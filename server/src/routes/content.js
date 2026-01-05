import { Router } from 'express';
import { body } from 'express-validator';
import prisma from '../lib/prisma.js';
import { authenticate, adminOnly } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();


// ============ SERVICE TIMES ============

// Get all service times (public)
router.get('/service-times', async (req, res, next) => {
  try {
    const serviceTimes = await prisma.serviceTime.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    });

    res.json({ serviceTimes });
  } catch (error) {
    next(error);
  }
});

// Get all service times (admin)
router.get('/service-times/admin', authenticate, adminOnly, async (req, res, next) => {
  try {
    const serviceTimes = await prisma.serviceTime.findMany({
      orderBy: { order: 'asc' },
    });

    res.json({ serviceTimes });
  } catch (error) {
    next(error);
  }
});

// Create service time
router.post(
  '/service-times',
  authenticate,
  adminOnly,
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('day').trim().notEmpty().withMessage('Day is required'),
    body('time').trim().notEmpty().withMessage('Time is required'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { name, day, time, location, description, order, isActive } = req.body;

      const maxOrder = await prisma.serviceTime.aggregate({
        _max: { order: true },
      });

      const serviceTime = await prisma.serviceTime.create({
        data: {
          name,
          day,
          time,
          location,
          description,
          order: order ?? (maxOrder._max.order || 0) + 1,
          isActive: isActive !== false,
        },
      });

      res.status(201).json({ message: 'Service time created', serviceTime });
    } catch (error) {
      next(error);
    }
  }
);

// Update service time
router.patch('/service-times/:id', authenticate, adminOnly, async (req, res, next) => {
  try {
    const { id } = req.params;

    const serviceTime = await prisma.serviceTime.update({
      where: { id },
      data: req.body,
    });

    res.json({ message: 'Service time updated', serviceTime });
  } catch (error) {
    next(error);
  }
});

// Delete service time
router.delete('/service-times/:id', authenticate, adminOnly, async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.serviceTime.delete({
      where: { id },
    });

    res.json({ message: 'Service time deleted' });
  } catch (error) {
    next(error);
  }
});

// ============ ABOUT CONTENT ============

// Get all about content (public)
router.get('/about', async (req, res, next) => {
  try {
    const aboutContent = await prisma.aboutContent.findMany({
      orderBy: { order: 'asc' },
    });

    res.json({ aboutContent });
  } catch (error) {
    next(error);
  }
});

// Get about content by section (public)
router.get('/about/:section', async (req, res, next) => {
  try {
    const { section } = req.params;

    const content = await prisma.aboutContent.findUnique({
      where: { section },
    });

    res.json({ content });
  } catch (error) {
    next(error);
  }
});

// Create or update about content
router.put(
  '/about/:section',
  authenticate,
  adminOnly,
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('content').trim().notEmpty().withMessage('Content is required'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { section } = req.params;
      const { title, content, imageUrl, order } = req.body;

      const aboutContent = await prisma.aboutContent.upsert({
        where: { section },
        update: { title, content, imageUrl, order },
        create: { section, title, content, imageUrl, order: order || 0 },
      });

      res.json({ message: 'About content updated', aboutContent });
    } catch (error) {
      next(error);
    }
  }
);

// ============ CORE VALUES ============

// Get all core values (public)
router.get('/core-values', async (req, res, next) => {
  try {
    const coreValues = await prisma.coreValue.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    });

    res.json({ coreValues });
  } catch (error) {
    next(error);
  }
});

// Get all core values (admin)
router.get('/core-values/admin', authenticate, adminOnly, async (req, res, next) => {
  try {
    const coreValues = await prisma.coreValue.findMany({
      orderBy: { order: 'asc' },
    });

    res.json({ coreValues });
  } catch (error) {
    next(error);
  }
});

// Create core value
router.post(
  '/core-values',
  authenticate,
  adminOnly,
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { title, description, icon, order, isActive } = req.body;

      const maxOrder = await prisma.coreValue.aggregate({
        _max: { order: true },
      });

      const coreValue = await prisma.coreValue.create({
        data: {
          title,
          description,
          icon,
          order: order ?? (maxOrder._max.order || 0) + 1,
          isActive: isActive !== false,
        },
      });

      res.status(201).json({ message: 'Core value created', coreValue });
    } catch (error) {
      next(error);
    }
  }
);

// Update core value
router.patch('/core-values/:id', authenticate, adminOnly, async (req, res, next) => {
  try {
    const { id } = req.params;

    const coreValue = await prisma.coreValue.update({
      where: { id },
      data: req.body,
    });

    res.json({ message: 'Core value updated', coreValue });
  } catch (error) {
    next(error);
  }
});

// Delete core value
router.delete('/core-values/:id', authenticate, adminOnly, async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.coreValue.delete({
      where: { id },
    });

    res.json({ message: 'Core value deleted' });
  } catch (error) {
    next(error);
  }
});

// ============ LEADERSHIP ============

// Get all leadership members (public)
router.get('/leadership', async (req, res, next) => {
  try {
    const leadership = await prisma.leadershipMember.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    });

    res.json({ leadership });
  } catch (error) {
    next(error);
  }
});

// Get all leadership members (admin)
router.get('/leadership/admin', authenticate, adminOnly, async (req, res, next) => {
  try {
    const leadership = await prisma.leadershipMember.findMany({
      orderBy: { order: 'asc' },
    });

    res.json({ leadership });
  } catch (error) {
    next(error);
  }
});

// Create leadership member
router.post(
  '/leadership',
  authenticate,
  adminOnly,
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('role').trim().notEmpty().withMessage('Role is required'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { name, role, bio, imageUrl, email, order, isActive } = req.body;

      const maxOrder = await prisma.leadershipMember.aggregate({
        _max: { order: true },
      });

      const leader = await prisma.leadershipMember.create({
        data: {
          name,
          role,
          bio,
          imageUrl,
          email,
          order: order ?? (maxOrder._max.order || 0) + 1,
          isActive: isActive !== false,
        },
      });

      res.status(201).json({ message: 'Leadership member created', leader });
    } catch (error) {
      next(error);
    }
  }
);

// Update leadership member
router.patch('/leadership/:id', authenticate, adminOnly, async (req, res, next) => {
  try {
    const { id } = req.params;

    const leader = await prisma.leadershipMember.update({
      where: { id },
      data: req.body,
    });

    res.json({ message: 'Leadership member updated', leader });
  } catch (error) {
    next(error);
  }
});

// Delete leadership member
router.delete('/leadership/:id', authenticate, adminOnly, async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.leadershipMember.delete({
      where: { id },
    });

    res.json({ message: 'Leadership member deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;
