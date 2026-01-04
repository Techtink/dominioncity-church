import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { authenticate, editorOrAdmin, optionalAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
const prisma = new PrismaClient();

// Helper to generate slug
const generateSlug = (title) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

// Get all published posts (public)
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const { page = 1, limit = 10, category, search } = req.query;
    const skip = (page - 1) * limit;

    const where = {
      status: 'PUBLISHED',
      ...(category && { category: { slug: category } }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { content: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        include: {
          author: { select: { id: true, name: true, avatar: true } },
          category: { select: { id: true, name: true, slug: true } },
        },
        skip,
        take: parseInt(limit),
        orderBy: { publishedAt: 'desc' },
      }),
      prisma.post.count({ where }),
    ]);

    res.json({
      posts,
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

// Get single post by slug (public)
router.get('/slug/:slug', async (req, res, next) => {
  try {
    const post = await prisma.post.findUnique({
      where: { slug: req.params.slug, status: 'PUBLISHED' },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
        category: { select: { id: true, name: true, slug: true } },
      },
    });

    if (!post) {
      return res.status(404).json({ error: { message: 'Post not found' } });
    }

    res.json({ post });
  } catch (error) {
    next(error);
  }
});

// Get all posts (admin - includes drafts)
router.get('/admin', authenticate, editorOrAdmin, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const skip = (page - 1) * limit;

    const where = {
      ...(status && { status }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { content: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        include: {
          author: { select: { id: true, name: true } },
          category: { select: { id: true, name: true } },
        },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.post.count({ where }),
    ]);

    res.json({
      posts,
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

// Get single post by ID (admin)
router.get('/admin/:id', authenticate, editorOrAdmin, async (req, res, next) => {
  try {
    const post = await prisma.post.findUnique({
      where: { id: req.params.id },
      include: {
        author: { select: { id: true, name: true } },
        category: true,
      },
    });

    if (!post) {
      return res.status(404).json({ error: { message: 'Post not found' } });
    }

    res.json({ post });
  } catch (error) {
    next(error);
  }
});

// Create post
router.post(
  '/',
  authenticate,
  editorOrAdmin,
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('content').trim().notEmpty().withMessage('Content is required'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { title, content, excerpt, featuredImage, categoryId, status = 'DRAFT' } = req.body;

      let slug = generateSlug(title);

      // Ensure unique slug
      const existingPost = await prisma.post.findUnique({ where: { slug } });
      if (existingPost) {
        slug = `${slug}-${Date.now()}`;
      }

      const post = await prisma.post.create({
        data: {
          title,
          slug,
          content,
          excerpt,
          featuredImage,
          status,
          categoryId,
          authorId: req.user.id,
          publishedAt: status === 'PUBLISHED' ? new Date() : null,
        },
        include: {
          author: { select: { id: true, name: true } },
          category: true,
        },
      });

      res.status(201).json({ message: 'Post created', post });
    } catch (error) {
      next(error);
    }
  }
);

// Update post
router.patch('/:id', authenticate, editorOrAdmin, async (req, res, next) => {
  try {
    const { title, content, excerpt, featuredImage, categoryId, status } = req.body;

    const existingPost = await prisma.post.findUnique({ where: { id: req.params.id } });

    if (!existingPost) {
      return res.status(404).json({ error: { message: 'Post not found' } });
    }

    const updateData = {
      ...(title && { title }),
      ...(content && { content }),
      ...(excerpt !== undefined && { excerpt }),
      ...(featuredImage !== undefined && { featuredImage }),
      ...(categoryId !== undefined && { categoryId }),
      ...(status && { status }),
    };

    // Set publishedAt when publishing
    if (status === 'PUBLISHED' && existingPost.status !== 'PUBLISHED') {
      updateData.publishedAt = new Date();
    }

    const post = await prisma.post.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        author: { select: { id: true, name: true } },
        category: true,
      },
    });

    res.json({ message: 'Post updated', post });
  } catch (error) {
    next(error);
  }
});

// Delete post
router.delete('/:id', authenticate, editorOrAdmin, async (req, res, next) => {
  try {
    await prisma.post.delete({ where: { id: req.params.id } });
    res.json({ message: 'Post deleted' });
  } catch (error) {
    next(error);
  }
});

// Categories
router.get('/categories', async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
    });
    res.json({ categories });
  } catch (error) {
    next(error);
  }
});

router.post(
  '/categories',
  authenticate,
  editorOrAdmin,
  [body('name').trim().notEmpty().withMessage('Name is required')],
  validate,
  async (req, res, next) => {
    try {
      const { name, description } = req.body;
      const slug = generateSlug(name);

      const category = await prisma.category.create({
        data: { name, slug, description },
      });

      res.status(201).json({ message: 'Category created', category });
    } catch (error) {
      if (error.code === 'P2002') {
        return res.status(400).json({ error: { message: 'Category already exists' } });
      }
      next(error);
    }
  }
);

router.delete('/categories/:id', authenticate, editorOrAdmin, async (req, res, next) => {
  try {
    await prisma.category.delete({ where: { id: req.params.id } });
    res.json({ message: 'Category deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;
