import { Router } from 'express';
import { body } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { authenticate, adminOnly } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
const prisma = new PrismaClient();

// Default settings structure
const defaultSettings = {
  general: [
    { key: 'site_name', value: 'DominionCity', type: 'string', label: 'Site Name' },
    { key: 'site_tagline', value: 'Embrace Faith, Inspire Hope, Live in Grace', type: 'string', label: 'Tagline' },
    { key: 'site_logo', value: '', type: 'string', label: 'Logo URL' },
    { key: 'site_favicon', value: '', type: 'string', label: 'Favicon URL' },
    { key: 'contact_email', value: '', type: 'string', label: 'Contact Email' },
    { key: 'contact_phone', value: '', type: 'string', label: 'Contact Phone' },
    { key: 'contact_address', value: '', type: 'string', label: 'Address' },
    { key: 'service_times', value: '[]', type: 'json', label: 'Service Times' },
  ],
  email: [
    { key: 'email_provider', value: 'smtp', type: 'string', label: 'Email Provider' }, // smtp, sendgrid, mailgun
    { key: 'smtp_host', value: '', type: 'string', label: 'SMTP Host' },
    { key: 'smtp_port', value: '587', type: 'string', label: 'SMTP Port' },
    { key: 'smtp_user', value: '', type: 'string', label: 'SMTP Username' },
    { key: 'smtp_password', value: '', type: 'string', label: 'SMTP Password' },
    { key: 'smtp_from_email', value: '', type: 'string', label: 'From Email' },
    { key: 'smtp_from_name', value: '', type: 'string', label: 'From Name' },
    { key: 'sendgrid_api_key', value: '', type: 'string', label: 'SendGrid API Key' },
    { key: 'mailgun_api_key', value: '', type: 'string', label: 'Mailgun API Key' },
    { key: 'mailgun_domain', value: '', type: 'string', label: 'Mailgun Domain' },
  ],
  sms: [
    { key: 'sms_provider', value: 'twilio', type: 'string', label: 'SMS Provider' }, // twilio, africas_talking, termii
    { key: 'twilio_account_sid', value: '', type: 'string', label: 'Twilio Account SID' },
    { key: 'twilio_auth_token', value: '', type: 'string', label: 'Twilio Auth Token' },
    { key: 'twilio_phone_number', value: '', type: 'string', label: 'Twilio Phone Number' },
    { key: 'africas_talking_username', value: '', type: 'string', label: "Africa's Talking Username" },
    { key: 'africas_talking_api_key', value: '', type: 'string', label: "Africa's Talking API Key" },
    { key: 'termii_api_key', value: '', type: 'string', label: 'Termii API Key' },
    { key: 'termii_sender_id', value: '', type: 'string', label: 'Termii Sender ID' },
  ],
  payment: [
    { key: 'payment_provider', value: 'stripe', type: 'string', label: 'Payment Provider' }, // stripe, paystack, flutterwave
    { key: 'payment_currency', value: 'USD', type: 'string', label: 'Currency' },
    // Stripe
    { key: 'stripe_publishable_key', value: '', type: 'string', label: 'Stripe Publishable Key' },
    { key: 'stripe_secret_key', value: '', type: 'string', label: 'Stripe Secret Key' },
    { key: 'stripe_webhook_secret', value: '', type: 'string', label: 'Stripe Webhook Secret' },
    // Paystack
    { key: 'paystack_public_key', value: '', type: 'string', label: 'Paystack Public Key' },
    { key: 'paystack_secret_key', value: '', type: 'string', label: 'Paystack Secret Key' },
    // Flutterwave
    { key: 'flutterwave_public_key', value: '', type: 'string', label: 'Flutterwave Public Key' },
    { key: 'flutterwave_secret_key', value: '', type: 'string', label: 'Flutterwave Secret Key' },
    { key: 'flutterwave_encryption_key', value: '', type: 'string', label: 'Flutterwave Encryption Key' },
  ],
  social: [
    { key: 'facebook_url', value: '', type: 'string', label: 'Facebook URL' },
    { key: 'instagram_url', value: '', type: 'string', label: 'Instagram URL' },
    { key: 'youtube_url', value: '', type: 'string', label: 'YouTube URL' },
    { key: 'twitter_url', value: '', type: 'string', label: 'Twitter/X URL' },
    { key: 'tiktok_url', value: '', type: 'string', label: 'TikTok URL' },
  ],
  notifications: [
    { key: 'chat_notification_enabled', value: 'true', type: 'boolean', label: 'Enable Chat Notifications' },
    { key: 'chat_notification_emails', value: '', type: 'string', label: 'Chat Notification Emails (comma-separated)' },
    { key: 'chat_notification_phones', value: '', type: 'string', label: 'Chat Notification Phones (comma-separated)' },
    { key: 'chat_email_subject', value: 'New Chat Message from Website Visitor', type: 'string', label: 'Email Subject' },
  ],
};

// Initialize default settings if not exists
async function initializeSettings() {
  for (const [category, settings] of Object.entries(defaultSettings)) {
    for (const setting of settings) {
      await prisma.siteSetting.upsert({
        where: { key: setting.key },
        update: {},
        create: {
          key: setting.key,
          value: setting.value,
          type: setting.type,
          category,
          label: setting.label,
        },
      });
    }
  }
}

// Get all settings (admin only)
router.get('/', authenticate, adminOnly, async (req, res, next) => {
  try {
    // Initialize defaults if needed
    await initializeSettings();

    const settings = await prisma.siteSetting.findMany({
      orderBy: [{ category: 'asc' }, { key: 'asc' }],
    });

    // Group by category
    const grouped = settings.reduce((acc, setting) => {
      if (!acc[setting.category]) {
        acc[setting.category] = [];
      }
      acc[setting.category].push(setting);
      return acc;
    }, {});

    res.json({ settings: grouped });
  } catch (error) {
    next(error);
  }
});

// Get public settings (no auth required)
router.get('/public', async (req, res, next) => {
  try {
    const settings = await prisma.siteSetting.findMany({
      where: {
        key: {
          in: [
            'site_name', 'site_tagline', 'site_logo', 'site_favicon',
            'contact_email', 'contact_phone', 'contact_address', 'service_times',
            'facebook_url', 'instagram_url', 'youtube_url', 'twitter_url', 'tiktok_url',
            'payment_provider', 'payment_currency',
            'stripe_publishable_key', 'paystack_public_key', 'flutterwave_public_key',
          ],
        },
      },
    });

    const settingsMap = settings.reduce((acc, s) => {
      let value = s.value;
      if (s.type === 'json') {
        try { value = JSON.parse(s.value); } catch { value = s.value; }
      } else if (s.type === 'boolean') {
        value = s.value === 'true';
      } else if (s.type === 'number') {
        value = Number(s.value);
      }
      acc[s.key] = value;
      return acc;
    }, {});

    res.json({ settings: settingsMap });
  } catch (error) {
    next(error);
  }
});

// Update settings (admin only)
router.put(
  '/',
  authenticate,
  adminOnly,
  [body('settings').isArray().withMessage('Settings must be an array')],
  validate,
  async (req, res, next) => {
    try {
      const { settings } = req.body;

      for (const setting of settings) {
        if (!setting.key) continue;

        await prisma.siteSetting.upsert({
          where: { key: setting.key },
          update: {
            value: String(setting.value),
            ...(setting.type && { type: setting.type }),
            ...(setting.category && { category: setting.category }),
            ...(setting.label && { label: setting.label }),
          },
          create: {
            key: setting.key,
            value: String(setting.value),
            type: setting.type || 'string',
            category: setting.category || 'general',
            label: setting.label,
          },
        });
      }

      res.json({ message: 'Settings updated successfully' });
    } catch (error) {
      next(error);
    }
  }
);

// Update single setting (admin only)
router.patch(
  '/:key',
  authenticate,
  adminOnly,
  async (req, res, next) => {
    try {
      const { key } = req.params;
      const { value, type, category, label } = req.body;

      const setting = await prisma.siteSetting.upsert({
        where: { key },
        update: {
          value: String(value),
          ...(type && { type }),
          ...(category && { category }),
          ...(label && { label }),
        },
        create: {
          key,
          value: String(value),
          type: type || 'string',
          category: category || 'general',
          label,
        },
      });

      res.json({ message: 'Setting updated', setting });
    } catch (error) {
      next(error);
    }
  }
);

// ============ HERO SLIDES ============

// Get all slides (public)
router.get('/slides', async (req, res, next) => {
  try {
    const slides = await prisma.heroSlide.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    });

    res.json({ slides });
  } catch (error) {
    next(error);
  }
});

// Get all slides for admin
router.get('/slides/admin', authenticate, adminOnly, async (req, res, next) => {
  try {
    const slides = await prisma.heroSlide.findMany({
      orderBy: { order: 'asc' },
    });

    res.json({ slides });
  } catch (error) {
    next(error);
  }
});

// Create slide
router.post(
  '/slides',
  authenticate,
  adminOnly,
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('imageUrl').trim().notEmpty().withMessage('Image URL is required'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { title, subtitle, description, imageUrl, buttonText, buttonLink, buttonText2, buttonLink2, animation, order, isActive } = req.body;

      // Get max order if not provided
      let slideOrder = order;
      if (slideOrder === undefined) {
        const maxOrder = await prisma.heroSlide.aggregate({
          _max: { order: true },
        });
        slideOrder = (maxOrder._max.order || 0) + 1;
      }

      const slide = await prisma.heroSlide.create({
        data: {
          title,
          subtitle,
          description,
          imageUrl,
          buttonText,
          buttonLink,
          buttonText2,
          buttonLink2,
          animation: animation || 'fade',
          order: slideOrder,
          isActive: isActive !== false,
        },
      });

      res.status(201).json({ message: 'Slide created', slide });
    } catch (error) {
      next(error);
    }
  }
);

// Update slide
router.patch('/slides/:id', authenticate, adminOnly, async (req, res, next) => {
  try {
    const { id } = req.params;

    const slide = await prisma.heroSlide.update({
      where: { id },
      data: req.body,
    });

    res.json({ message: 'Slide updated', slide });
  } catch (error) {
    next(error);
  }
});

// Reorder slides
router.put('/slides/reorder', authenticate, adminOnly, async (req, res, next) => {
  try {
    const { slideIds } = req.body;

    // Update order for each slide
    await Promise.all(
      slideIds.map((id, index) =>
        prisma.heroSlide.update({
          where: { id },
          data: { order: index },
        })
      )
    );

    res.json({ message: 'Slides reordered' });
  } catch (error) {
    next(error);
  }
});

// Delete slide
router.delete('/slides/:id', authenticate, adminOnly, async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.heroSlide.delete({
      where: { id },
    });

    res.json({ message: 'Slide deleted' });
  } catch (error) {
    next(error);
  }
});

// Test email configuration
router.post('/test-email', authenticate, adminOnly, async (req, res, next) => {
  try {
    const { email } = req.body;
    // TODO: Implement email sending based on configured provider
    res.json({ message: `Test email would be sent to ${email}` });
  } catch (error) {
    next(error);
  }
});

// Test SMS configuration
router.post('/test-sms', authenticate, adminOnly, async (req, res, next) => {
  try {
    const { phone } = req.body;
    // TODO: Implement SMS sending based on configured provider
    res.json({ message: `Test SMS would be sent to ${phone}` });
  } catch (error) {
    next(error);
  }
});

// ============ PAGE BACKGROUNDS ============

// Default page backgrounds
const defaultPageBackgrounds = [
  { pageSlug: 'about', backgroundType: 'SOLID', solidColor: '#1f2937' },
  { pageSlug: 'sermons', backgroundType: 'SOLID', solidColor: '#1f2937' },
  { pageSlug: 'blog', backgroundType: 'SOLID', solidColor: '#1f2937' },
  { pageSlug: 'events', backgroundType: 'SOLID', solidColor: '#1f2937' },
  { pageSlug: 'ministries', backgroundType: 'SOLID', solidColor: '#1f2937' },
  { pageSlug: 'give', backgroundType: 'GRADIENT', gradientFrom: '#1e3a8a', gradientTo: '#1d4ed8' },
  { pageSlug: 'blog-post', backgroundType: 'SOLID', solidColor: '#1f2937' },
  { pageSlug: 'contact', backgroundType: 'SOLID', solidColor: '#1f2937' },
];

// Get all page backgrounds (public)
router.get('/backgrounds', async (req, res, next) => {
  try {
    const backgrounds = await prisma.pageBackground.findMany();

    // Merge with defaults for pages that don't have settings
    const backgroundMap = backgrounds.reduce((acc, bg) => {
      acc[bg.pageSlug] = bg;
      return acc;
    }, {});

    const allBackgrounds = defaultPageBackgrounds.map(defaultBg => {
      return backgroundMap[defaultBg.pageSlug] || {
        ...defaultBg,
        id: null,
        overlayOpacity: 50,
        overlayColor: '#000000',
        titleColor: '#ffffff',
        subtitleColor: '#d1d5db',
      };
    });

    res.json({ backgrounds: allBackgrounds });
  } catch (error) {
    next(error);
  }
});

// Get background for specific page (public)
router.get('/backgrounds/:pageSlug', async (req, res, next) => {
  try {
    const { pageSlug } = req.params;

    let background = await prisma.pageBackground.findUnique({
      where: { pageSlug },
    });

    // Return default if not found
    if (!background) {
      const defaultBg = defaultPageBackgrounds.find(bg => bg.pageSlug === pageSlug);
      background = defaultBg ? {
        ...defaultBg,
        id: null,
        overlayOpacity: 50,
        overlayColor: '#000000',
        titleColor: '#ffffff',
        subtitleColor: '#d1d5db',
      } : null;
    }

    res.json({ background });
  } catch (error) {
    next(error);
  }
});

// Update page background (admin only)
router.put('/backgrounds/:pageSlug', authenticate, adminOnly, async (req, res, next) => {
  try {
    const { pageSlug } = req.params;
    const {
      backgroundType,
      solidColor,
      gradientFrom,
      gradientTo,
      gradientAngle,
      imageUrl,
      overlayOpacity,
      overlayColor,
      titleColor,
      subtitleColor,
    } = req.body;

    const background = await prisma.pageBackground.upsert({
      where: { pageSlug },
      update: {
        backgroundType,
        solidColor,
        gradientFrom,
        gradientTo,
        gradientAngle,
        imageUrl,
        overlayOpacity,
        overlayColor,
        titleColor,
        subtitleColor,
      },
      create: {
        pageSlug,
        backgroundType: backgroundType || 'SOLID',
        solidColor,
        gradientFrom,
        gradientTo,
        gradientAngle,
        imageUrl,
        overlayOpacity,
        overlayColor,
        titleColor,
        subtitleColor,
      },
    });

    res.json({ message: 'Background updated', background });
  } catch (error) {
    next(error);
  }
});

export default router;
