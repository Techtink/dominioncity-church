import { Router } from 'express';
import { body } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { authenticate, editorOrAdmin } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
const prisma = new PrismaClient();

const generateSlug = (title) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

// Get all sermons (public)
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 12, series, speaker, search } = req.query;
    const skip = (page - 1) * limit;

    const where = {
      ...(series && { series: { slug: series } }),
      ...(speaker && { speaker: { contains: speaker, mode: 'insensitive' } }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { scripture: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [sermons, total] = await Promise.all([
      prisma.sermon.findMany({
        where,
        include: {
          series: { select: { id: true, name: true, slug: true } },
        },
        skip,
        take: parseInt(limit),
        orderBy: { date: 'desc' },
      }),
      prisma.sermon.count({ where }),
    ]);

    res.json({
      sermons,
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

// Get sermon by slug (public)
router.get('/slug/:slug', async (req, res, next) => {
  try {
    const sermon = await prisma.sermon.findUnique({
      where: { slug: req.params.slug },
      include: {
        series: true,
        author: { select: { id: true, name: true } },
      },
    });

    if (!sermon) {
      return res.status(404).json({ error: { message: 'Sermon not found' } });
    }

    res.json({ sermon });
  } catch (error) {
    next(error);
  }
});

// Get latest sermons (for homepage)
router.get('/latest', async (req, res, next) => {
  try {
    const sermons = await prisma.sermon.findMany({
      take: 6,
      orderBy: { date: 'desc' },
      include: {
        series: { select: { id: true, name: true, slug: true } },
      },
    });

    res.json({ sermons });
  } catch (error) {
    next(error);
  }
});

// Get all speakers
router.get('/speakers', async (req, res, next) => {
  try {
    const speakers = await prisma.sermon.findMany({
      select: { speaker: true },
      distinct: ['speaker'],
      orderBy: { speaker: 'asc' },
    });

    res.json({ speakers: speakers.map(s => s.speaker) });
  } catch (error) {
    next(error);
  }
});

// Create sermon (admin)
router.post(
  '/',
  authenticate,
  editorOrAdmin,
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('speaker').trim().notEmpty().withMessage('Speaker is required'),
    body('date').isISO8601().withMessage('Valid date is required'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { title, description, speaker, scripture, audioUrl, videoUrl, thumbnailUrl, duration, date, seriesId } = req.body;

      let slug = generateSlug(title);
      const existingSermon = await prisma.sermon.findUnique({ where: { slug } });
      if (existingSermon) {
        slug = `${slug}-${Date.now()}`;
      }

      const sermon = await prisma.sermon.create({
        data: {
          title,
          slug,
          description,
          speaker,
          scripture,
          audioUrl,
          videoUrl,
          thumbnailUrl,
          duration,
          date: new Date(date),
          seriesId,
          authorId: req.user.id,
        },
        include: { series: true },
      });

      res.status(201).json({ message: 'Sermon created', sermon });
    } catch (error) {
      next(error);
    }
  }
);

// Update sermon
router.patch('/:id', authenticate, editorOrAdmin, async (req, res, next) => {
  try {
    const sermon = await prisma.sermon.update({
      where: { id: req.params.id },
      data: {
        ...req.body,
        ...(req.body.date && { date: new Date(req.body.date) }),
      },
      include: { series: true },
    });

    res.json({ message: 'Sermon updated', sermon });
  } catch (error) {
    next(error);
  }
});

// Delete sermon
router.delete('/:id', authenticate, editorOrAdmin, async (req, res, next) => {
  try {
    await prisma.sermon.delete({ where: { id: req.params.id } });
    res.json({ message: 'Sermon deleted' });
  } catch (error) {
    next(error);
  }
});

// Series CRUD
router.get('/series', async (req, res, next) => {
  try {
    const series = await prisma.series.findMany({
      include: {
        _count: { select: { sermons: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ series });
  } catch (error) {
    next(error);
  }
});

router.get('/series/:slug', async (req, res, next) => {
  try {
    const series = await prisma.series.findUnique({
      where: { slug: req.params.slug },
      include: {
        sermons: {
          orderBy: { date: 'desc' },
        },
      },
    });

    if (!series) {
      return res.status(404).json({ error: { message: 'Series not found' } });
    }

    res.json({ series });
  } catch (error) {
    next(error);
  }
});

router.post(
  '/series',
  authenticate,
  editorOrAdmin,
  [body('name').trim().notEmpty().withMessage('Name is required')],
  validate,
  async (req, res, next) => {
    try {
      const { name, description, imageUrl } = req.body;
      const slug = generateSlug(name);

      const series = await prisma.series.create({
        data: { name, slug, description, imageUrl },
      });

      res.status(201).json({ message: 'Series created', series });
    } catch (error) {
      if (error.code === 'P2002') {
        return res.status(400).json({ error: { message: 'Series already exists' } });
      }
      next(error);
    }
  }
);

router.patch('/series/:id', authenticate, editorOrAdmin, async (req, res, next) => {
  try {
    const series = await prisma.series.update({
      where: { id: req.params.id },
      data: req.body,
    });

    res.json({ message: 'Series updated', series });
  } catch (error) {
    next(error);
  }
});

router.delete('/series/:id', authenticate, editorOrAdmin, async (req, res, next) => {
  try {
    await prisma.series.delete({ where: { id: req.params.id } });
    res.json({ message: 'Series deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;
