import { Router } from 'express';
import { body } from 'express-validator';
import prisma from '../lib/prisma.js';
import Stripe from 'stripe';
import { authenticate, adminOnly, optionalAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();


// Initialize Stripe
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

// Get giving categories (public)
router.get('/categories', async (req, res, next) => {
  try {
    const categories = await prisma.givingCategory.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    res.json({ categories });
  } catch (error) {
    next(error);
  }
});

// Create payment intent
router.post(
  '/create-payment-intent',
  optionalAuth,
  [
    body('amount').isFloat({ min: 1 }).withMessage('Amount must be at least $1'),
    body('categoryId').notEmpty().withMessage('Giving category is required'),
  ],
  validate,
  async (req, res, next) => {
    try {
      if (!stripe) {
        return res.status(500).json({ error: { message: 'Payment processing not configured' } });
      }

      const { amount, categoryId, isAnonymous = false, donorName, donorEmail } = req.body;

      // Create payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: 'usd',
        metadata: {
          categoryId,
          userId: req.user?.id || 'guest',
          isAnonymous: String(isAnonymous),
        },
      });

      // Create pending donation record
      const donation = await prisma.donation.create({
        data: {
          amount,
          currency: 'USD',
          stripePaymentId: paymentIntent.id,
          status: 'PENDING',
          isAnonymous,
          donorName: isAnonymous ? null : (donorName || req.user?.name),
          donorEmail: donorEmail || req.user?.email,
          userId: req.user?.id || null,
          categoryId,
        },
      });

      res.json({
        clientSecret: paymentIntent.client_secret,
        donationId: donation.id,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Stripe webhook
router.post('/webhook', async (req, res) => {
  if (!stripe) {
    return res.status(500).json({ error: { message: 'Stripe not configured' } });
  }

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: { message: `Webhook Error: ${err.message}` } });
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      await prisma.donation.updateMany({
        where: { stripePaymentId: paymentIntent.id },
        data: { status: 'COMPLETED' },
      });
      break;

    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      await prisma.donation.updateMany({
        where: { stripePaymentId: failedPayment.id },
        data: { status: 'FAILED' },
      });
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

// Get user's donation history
router.get('/my-donations', authenticate, async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const [donations, total] = await Promise.all([
      prisma.donation.findMany({
        where: { userId: req.user.id, status: 'COMPLETED' },
        include: {
          category: { select: { id: true, name: true } },
        },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.donation.count({ where: { userId: req.user.id, status: 'COMPLETED' } }),
    ]);

    // Calculate total given
    const totalGiven = await prisma.donation.aggregate({
      where: { userId: req.user.id, status: 'COMPLETED' },
      _sum: { amount: true },
    });

    res.json({
      donations,
      totalGiven: totalGiven._sum.amount || 0,
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

// Admin: Get all donations
router.get('/admin', authenticate, adminOnly, async (req, res, next) => {
  try {
    const { page = 1, limit = 50, status, categoryId, startDate, endDate } = req.query;
    const skip = (page - 1) * limit;

    const where = {
      ...(status && { status }),
      ...(categoryId && { categoryId }),
      ...(startDate && endDate && {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      }),
    };

    const [donations, total, stats] = await Promise.all([
      prisma.donation.findMany({
        where,
        include: {
          category: { select: { id: true, name: true } },
          user: { select: { id: true, name: true, email: true } },
        },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.donation.count({ where }),
      prisma.donation.aggregate({
        where: { ...where, status: 'COMPLETED' },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    res.json({
      donations,
      stats: {
        totalAmount: stats._sum.amount || 0,
        totalCount: stats._count,
      },
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

// Admin: Get donation reports by category
router.get('/admin/reports', authenticate, adminOnly, async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const where = {
      status: 'COMPLETED',
      ...(startDate && endDate && {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      }),
    };

    const byCategory = await prisma.donation.groupBy({
      by: ['categoryId'],
      where,
      _sum: { amount: true },
      _count: true,
    });

    // Get category names
    const categories = await prisma.givingCategory.findMany();
    const categoryMap = Object.fromEntries(categories.map(c => [c.id, c.name]));

    const report = byCategory.map(item => ({
      categoryId: item.categoryId,
      categoryName: categoryMap[item.categoryId] || 'Unknown',
      totalAmount: item._sum.amount,
      donationCount: item._count,
    }));

    const total = await prisma.donation.aggregate({
      where,
      _sum: { amount: true },
    });

    res.json({
      report,
      total: total._sum.amount || 0,
    });
  } catch (error) {
    next(error);
  }
});

// Admin: Manage giving categories
router.post(
  '/categories',
  authenticate,
  adminOnly,
  [body('name').trim().notEmpty().withMessage('Name is required')],
  validate,
  async (req, res, next) => {
    try {
      const { name, description } = req.body;

      const category = await prisma.givingCategory.create({
        data: { name, description },
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

router.patch('/categories/:id', authenticate, adminOnly, async (req, res, next) => {
  try {
    const category = await prisma.givingCategory.update({
      where: { id: req.params.id },
      data: req.body,
    });

    res.json({ message: 'Category updated', category });
  } catch (error) {
    next(error);
  }
});

export default router;
