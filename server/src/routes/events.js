import { Router } from 'express';
import { body } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { authenticate, editorOrAdmin, optionalAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
const prisma = new PrismaClient();

const generateSlug = (title) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

// Get upcoming events (public)
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 12, past = 'false' } = req.query;
    const skip = (page - 1) * limit;
    const now = new Date();

    const where = past === 'true'
      ? { endDate: { lt: now } }
      : { startDate: { gte: now } };

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        include: {
          _count: { select: { registrations: true } },
        },
        skip,
        take: parseInt(limit),
        orderBy: { startDate: past === 'true' ? 'desc' : 'asc' },
      }),
      prisma.event.count({ where }),
    ]);

    res.json({
      events,
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

// Get event by slug (public)
router.get('/slug/:slug', async (req, res, next) => {
  try {
    const event = await prisma.event.findUnique({
      where: { slug: req.params.slug },
      include: {
        _count: { select: { registrations: true } },
      },
    });

    if (!event) {
      return res.status(404).json({ error: { message: 'Event not found' } });
    }

    res.json({ event });
  } catch (error) {
    next(error);
  }
});

// Get upcoming events for homepage
router.get('/upcoming', async (req, res, next) => {
  try {
    const events = await prisma.event.findMany({
      where: {
        startDate: { gte: new Date() },
      },
      take: 4,
      orderBy: { startDate: 'asc' },
    });

    res.json({ events });
  } catch (error) {
    next(error);
  }
});

// Create event (admin)
router.post(
  '/',
  authenticate,
  editorOrAdmin,
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('startDate').isISO8601().withMessage('Valid start date is required'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { title, description, location, imageUrl, startDate, endDate, isRecurring, recurrenceRule, registrationRequired, maxAttendees } = req.body;

      let slug = generateSlug(title);
      const existingEvent = await prisma.event.findUnique({ where: { slug } });
      if (existingEvent) {
        slug = `${slug}-${Date.now()}`;
      }

      const event = await prisma.event.create({
        data: {
          title,
          slug,
          description,
          location,
          imageUrl,
          startDate: new Date(startDate),
          endDate: endDate ? new Date(endDate) : null,
          isRecurring,
          recurrenceRule,
          registrationRequired,
          maxAttendees,
        },
      });

      res.status(201).json({ message: 'Event created', event });
    } catch (error) {
      next(error);
    }
  }
);

// Update event
router.patch('/:id', authenticate, editorOrAdmin, async (req, res, next) => {
  try {
    const updateData = { ...req.body };
    if (updateData.startDate) updateData.startDate = new Date(updateData.startDate);
    if (updateData.endDate) updateData.endDate = new Date(updateData.endDate);

    const event = await prisma.event.update({
      where: { id: req.params.id },
      data: updateData,
    });

    res.json({ message: 'Event updated', event });
  } catch (error) {
    next(error);
  }
});

// Delete event
router.delete('/:id', authenticate, editorOrAdmin, async (req, res, next) => {
  try {
    await prisma.event.delete({ where: { id: req.params.id } });
    res.json({ message: 'Event deleted' });
  } catch (error) {
    next(error);
  }
});

// Register for event
router.post(
  '/:id/register',
  optionalAuth,
  [
    body('guestName').if(body('guestEmail').exists()).trim().notEmpty().withMessage('Name is required for guests'),
    body('guestEmail').if(body('guestName').exists()).isEmail().withMessage('Valid email is required'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { guestName, guestEmail, guestCount = 1, notes } = req.body;

      const event = await prisma.event.findUnique({
        where: { id: req.params.id },
        include: { _count: { select: { registrations: true } } },
      });

      if (!event) {
        return res.status(404).json({ error: { message: 'Event not found' } });
      }

      if (!event.registrationRequired) {
        return res.status(400).json({ error: { message: 'Registration not required for this event' } });
      }

      if (event.maxAttendees && event._count.registrations >= event.maxAttendees) {
        return res.status(400).json({ error: { message: 'Event is fully booked' } });
      }

      const registration = await prisma.eventRegistration.create({
        data: {
          eventId: req.params.id,
          userId: req.user?.id || null,
          guestName,
          guestEmail,
          guestCount,
          notes,
          status: 'CONFIRMED',
        },
      });

      res.status(201).json({ message: 'Registration successful', registration });
    } catch (error) {
      next(error);
    }
  }
);

// Get registrations for an event (admin)
router.get('/:id/registrations', authenticate, editorOrAdmin, async (req, res, next) => {
  try {
    const registrations = await prisma.eventRegistration.findMany({
      where: { eventId: req.params.id },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ registrations });
  } catch (error) {
    next(error);
  }
});

// Get user's registrations
router.get('/my-registrations', authenticate, async (req, res, next) => {
  try {
    const registrations = await prisma.eventRegistration.findMany({
      where: { userId: req.user.id },
      include: { event: true },
      orderBy: { event: { startDate: 'desc' } },
    });

    res.json({ registrations });
  } catch (error) {
    next(error);
  }
});

// Cancel registration
router.delete('/registrations/:id', authenticate, async (req, res, next) => {
  try {
    const registration = await prisma.eventRegistration.findUnique({
      where: { id: req.params.id },
    });

    if (!registration) {
      return res.status(404).json({ error: { message: 'Registration not found' } });
    }

    if (registration.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: { message: 'Not authorized' } });
    }

    await prisma.eventRegistration.delete({ where: { id: req.params.id } });

    res.json({ message: 'Registration cancelled' });
  } catch (error) {
    next(error);
  }
});

export default router;
