import { Router } from 'express';
import { body } from 'express-validator';
import prisma from '../lib/prisma.js';
import { authenticate, adminOnly } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();


const generateSlug = (name) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

// Get or create member profile
router.get('/profile', authenticate, async (req, res, next) => {
  try {
    let profile = await prisma.memberProfile.findUnique({
      where: { userId: req.user.id },
      include: {
        ministries: true,
        user: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
    });

    if (!profile) {
      profile = await prisma.memberProfile.create({
        data: { userId: req.user.id },
        include: {
          ministries: true,
          user: {
            select: { id: true, name: true, email: true, avatar: true },
          },
        },
      });
    }

    res.json({ profile });
  } catch (error) {
    next(error);
  }
});

// Update member profile
router.patch('/profile', authenticate, async (req, res, next) => {
  try {
    const { phone, address, city, state, zipCode, country, birthday, anniversary, bio } = req.body;

    const profile = await prisma.memberProfile.upsert({
      where: { userId: req.user.id },
      update: {
        phone,
        address,
        city,
        state,
        zipCode,
        country,
        birthday: birthday ? new Date(birthday) : undefined,
        anniversary: anniversary ? new Date(anniversary) : undefined,
        bio,
      },
      create: {
        userId: req.user.id,
        phone,
        address,
        city,
        state,
        zipCode,
        country,
        birthday: birthday ? new Date(birthday) : null,
        anniversary: anniversary ? new Date(anniversary) : null,
        bio,
      },
      include: { ministries: true },
    });

    res.json({ message: 'Profile updated', profile });
  } catch (error) {
    next(error);
  }
});

// Get all ministries (public)
router.get('/ministries', async (req, res, next) => {
  try {
    const ministries = await prisma.ministry.findMany({
      include: {
        leader: { select: { id: true, name: true, avatar: true } },
        _count: { select: { members: true } },
      },
      orderBy: { name: 'asc' },
    });

    res.json({ ministries });
  } catch (error) {
    next(error);
  }
});

// Get ministry by slug (public)
router.get('/ministries/:slug', async (req, res, next) => {
  try {
    const ministry = await prisma.ministry.findUnique({
      where: { slug: req.params.slug },
      include: {
        leader: { select: { id: true, name: true, avatar: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, avatar: true } },
          },
        },
      },
    });

    if (!ministry) {
      return res.status(404).json({ error: { message: 'Ministry not found' } });
    }

    res.json({ ministry });
  } catch (error) {
    next(error);
  }
});

// Join ministry
router.post('/ministries/:id/join', authenticate, async (req, res, next) => {
  try {
    let profile = await prisma.memberProfile.findUnique({
      where: { userId: req.user.id },
    });

    if (!profile) {
      profile = await prisma.memberProfile.create({
        data: { userId: req.user.id },
      });
    }

    await prisma.memberProfile.update({
      where: { id: profile.id },
      data: {
        ministries: {
          connect: { id: req.params.id },
        },
      },
    });

    res.json({ message: 'Successfully joined ministry' });
  } catch (error) {
    next(error);
  }
});

// Leave ministry
router.delete('/ministries/:id/leave', authenticate, async (req, res, next) => {
  try {
    const profile = await prisma.memberProfile.findUnique({
      where: { userId: req.user.id },
    });

    if (!profile) {
      return res.status(400).json({ error: { message: 'Profile not found' } });
    }

    await prisma.memberProfile.update({
      where: { id: profile.id },
      data: {
        ministries: {
          disconnect: { id: req.params.id },
        },
      },
    });

    res.json({ message: 'Left ministry' });
  } catch (error) {
    next(error);
  }
});

// Admin: Create ministry
router.post(
  '/ministries',
  authenticate,
  adminOnly,
  [body('name').trim().notEmpty().withMessage('Name is required')],
  validate,
  async (req, res, next) => {
    try {
      const { name, description, imageUrl, meetingTime, leaderId } = req.body;
      const slug = generateSlug(name);

      const ministry = await prisma.ministry.create({
        data: { name, slug, description, imageUrl, meetingTime, leaderId },
        include: {
          leader: { select: { id: true, name: true } },
        },
      });

      res.status(201).json({ message: 'Ministry created', ministry });
    } catch (error) {
      if (error.code === 'P2002') {
        return res.status(400).json({ error: { message: 'Ministry already exists' } });
      }
      next(error);
    }
  }
);

// Admin: Update ministry
router.patch('/ministries/:id', authenticate, adminOnly, async (req, res, next) => {
  try {
    const ministry = await prisma.ministry.update({
      where: { id: req.params.id },
      data: req.body,
      include: {
        leader: { select: { id: true, name: true } },
      },
    });

    res.json({ message: 'Ministry updated', ministry });
  } catch (error) {
    next(error);
  }
});

// Admin: Delete ministry
router.delete('/ministries/:id', authenticate, adminOnly, async (req, res, next) => {
  try {
    await prisma.ministry.delete({ where: { id: req.params.id } });
    res.json({ message: 'Ministry deleted' });
  } catch (error) {
    next(error);
  }
});

// Prayer Requests
router.get('/prayer-requests', authenticate, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, public: isPublic = 'false' } = req.query;
    const skip = (page - 1) * limit;

    const where = isPublic === 'true'
      ? { isPublic: true, status: 'ACTIVE' }
      : { userId: req.user.id };

    const [requests, total] = await Promise.all([
      prisma.prayerRequest.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, avatar: true },
          },
        },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.prayerRequest.count({ where }),
    ]);

    // Hide user info for anonymous requests
    const sanitizedRequests = requests.map(req => ({
      ...req,
      user: req.isAnonymous ? null : req.user,
    }));

    res.json({
      requests: sanitizedRequests,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
});

// Submit prayer request
router.post(
  '/prayer-requests',
  authenticate,
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('content').trim().notEmpty().withMessage('Content is required'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { title, content, isAnonymous = false, isPublic = false } = req.body;

      const request = await prisma.prayerRequest.create({
        data: {
          title,
          content,
          isAnonymous,
          isPublic,
          userId: req.user.id,
        },
      });

      res.status(201).json({ message: 'Prayer request submitted', request });
    } catch (error) {
      next(error);
    }
  }
);

// Update prayer request status
router.patch('/prayer-requests/:id', authenticate, async (req, res, next) => {
  try {
    const { status } = req.body;

    const request = await prisma.prayerRequest.findUnique({
      where: { id: req.params.id },
    });

    if (!request) {
      return res.status(404).json({ error: { message: 'Prayer request not found' } });
    }

    if (request.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: { message: 'Not authorized' } });
    }

    const updated = await prisma.prayerRequest.update({
      where: { id: req.params.id },
      data: { status },
    });

    res.json({ message: 'Prayer request updated', request: updated });
  } catch (error) {
    next(error);
  }
});

// Delete prayer request
router.delete('/prayer-requests/:id', authenticate, async (req, res, next) => {
  try {
    const request = await prisma.prayerRequest.findUnique({
      where: { id: req.params.id },
    });

    if (!request) {
      return res.status(404).json({ error: { message: 'Prayer request not found' } });
    }

    if (request.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: { message: 'Not authorized' } });
    }

    await prisma.prayerRequest.delete({ where: { id: req.params.id } });

    res.json({ message: 'Prayer request deleted' });
  } catch (error) {
    next(error);
  }
});

// Admin: Get all members
router.get('/admin', authenticate, adminOnly, async (req, res, next) => {
  try {
    const { page = 1, limit = 50, search } = req.query;
    const skip = (page - 1) * limit;

    const where = {
      role: 'MEMBER',
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [members, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          createdAt: true,
          memberProfile: {
            include: { ministries: true },
          },
        },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      members,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
