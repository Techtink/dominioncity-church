import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, adminOnly } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get all campaigns (admin only)
router.get('/campaigns', authenticate, adminOnly, async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = status ? { status } : {};

    const [campaigns, total] = await Promise.all([
      prisma.sMSCampaign.findMany({
        where,
        include: {
          createdBy: {
            select: { id: true, firstName: true, lastName: true },
          },
          _count: {
            select: { recipients: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.sMSCampaign.count({ where }),
    ]);

    res.json({
      data: {
        campaigns,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get single campaign
router.get('/campaigns/:id', authenticate, adminOnly, async (req, res, next) => {
  try {
    const campaign = await prisma.sMSCampaign.findUnique({
      where: { id: req.params.id },
      include: {
        createdBy: {
          select: { id: true, firstName: true, lastName: true },
        },
        recipients: {
          take: 100,
          orderBy: { sentAt: 'desc' },
        },
      },
    });

    if (!campaign) {
      return res.status(404).json({ error: { message: 'Campaign not found' } });
    }

    res.json({ data: { campaign } });
  } catch (error) {
    next(error);
  }
});

// Preview recipients based on target type
router.get('/recipients/preview', authenticate, adminOnly, async (req, res, next) => {
  try {
    const { targetType, targetId } = req.query;
    let recipients = [];
    let totalCount = 0;

    if (targetType === 'ALL_MEMBERS') {
      const members = await prisma.memberProfile.findMany({
        where: { phone: { not: null } },
        select: { id: true, phone: true, user: { select: { firstName: true, lastName: true } } },
        take: 50,
      });
      totalCount = await prisma.memberProfile.count({ where: { phone: { not: null } } });
      recipients = members.map(m => ({
        id: m.id,
        phone: m.phone,
        name: `${m.user.firstName} ${m.user.lastName}`,
      }));
    }

    if (targetType === 'MINISTRY' && targetId) {
      const members = await prisma.memberProfile.findMany({
        where: {
          phone: { not: null },
          ministries: { some: { id: targetId } },
        },
        select: { id: true, phone: true, user: { select: { firstName: true, lastName: true } } },
        take: 50,
      });
      totalCount = await prisma.memberProfile.count({
        where: {
          phone: { not: null },
          ministries: { some: { id: targetId } },
        },
      });
      recipients = members.map(m => ({
        id: m.id,
        phone: m.phone,
        name: `${m.user.firstName} ${m.user.lastName}`,
      }));
    }

    if (targetType === 'EVENT_REGISTRANTS' && targetId) {
      const registrations = await prisma.eventRegistration.findMany({
        where: {
          eventId: targetId,
          phone: { not: null },
        },
        select: { id: true, phone: true, name: true },
        take: 50,
      });
      totalCount = await prisma.eventRegistration.count({
        where: {
          eventId: targetId,
          phone: { not: null },
        },
      });
      recipients = registrations.map(r => ({
        id: r.id,
        phone: r.phone,
        name: r.name,
      }));
    }

    res.json({
      data: {
        recipients,
        totalCount,
        preview: true,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Create campaign
router.post('/campaigns', authenticate, adminOnly, async (req, res, next) => {
  try {
    const { name, message, targetType, targetId, scheduledAt } = req.body;

    if (!name || !message || !targetType) {
      return res.status(400).json({ error: { message: 'Name, message, and target type are required' } });
    }

    // Get recipient count
    let totalRecipients = 0;
    if (targetType === 'ALL_MEMBERS') {
      totalRecipients = await prisma.memberProfile.count({ where: { phone: { not: null } } });
    } else if (targetType === 'MINISTRY' && targetId) {
      totalRecipients = await prisma.memberProfile.count({
        where: {
          phone: { not: null },
          ministries: { some: { id: targetId } },
        },
      });
    } else if (targetType === 'EVENT_REGISTRANTS' && targetId) {
      totalRecipients = await prisma.eventRegistration.count({
        where: {
          eventId: targetId,
          phone: { not: null },
        },
      });
    }

    const campaign = await prisma.sMSCampaign.create({
      data: {
        name,
        message,
        targetType,
        targetId,
        totalRecipients,
        status: scheduledAt ? 'SCHEDULED' : 'DRAFT',
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        createdById: req.user.id,
      },
      include: {
        createdBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    res.status(201).json({ data: { campaign } });
  } catch (error) {
    next(error);
  }
});

// Update campaign (only drafts)
router.patch('/campaigns/:id', authenticate, adminOnly, async (req, res, next) => {
  try {
    const { name, message, targetType, targetId, scheduledAt } = req.body;

    const existing = await prisma.sMSCampaign.findUnique({
      where: { id: req.params.id },
    });

    if (!existing) {
      return res.status(404).json({ error: { message: 'Campaign not found' } });
    }

    if (existing.status !== 'DRAFT' && existing.status !== 'SCHEDULED') {
      return res.status(400).json({ error: { message: 'Can only edit draft or scheduled campaigns' } });
    }

    // Recalculate recipients if target changed
    let totalRecipients = existing.totalRecipients;
    const newTargetType = targetType || existing.targetType;
    const newTargetId = targetId !== undefined ? targetId : existing.targetId;

    if (targetType || targetId !== undefined) {
      if (newTargetType === 'ALL_MEMBERS') {
        totalRecipients = await prisma.memberProfile.count({ where: { phone: { not: null } } });
      } else if (newTargetType === 'MINISTRY' && newTargetId) {
        totalRecipients = await prisma.memberProfile.count({
          where: {
            phone: { not: null },
            ministries: { some: { id: newTargetId } },
          },
        });
      } else if (newTargetType === 'EVENT_REGISTRANTS' && newTargetId) {
        totalRecipients = await prisma.eventRegistration.count({
          where: {
            eventId: newTargetId,
            phone: { not: null },
          },
        });
      }
    }

    const campaign = await prisma.sMSCampaign.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(message && { message }),
        ...(targetType && { targetType }),
        ...(targetId !== undefined && { targetId }),
        totalRecipients,
        ...(scheduledAt !== undefined && {
          scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
          status: scheduledAt ? 'SCHEDULED' : 'DRAFT',
        }),
      },
      include: {
        createdBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    res.json({ data: { campaign } });
  } catch (error) {
    next(error);
  }
});

// Delete campaign (only drafts)
router.delete('/campaigns/:id', authenticate, adminOnly, async (req, res, next) => {
  try {
    const existing = await prisma.sMSCampaign.findUnique({
      where: { id: req.params.id },
    });

    if (!existing) {
      return res.status(404).json({ error: { message: 'Campaign not found' } });
    }

    if (existing.status !== 'DRAFT') {
      return res.status(400).json({ error: { message: 'Can only delete draft campaigns' } });
    }

    await prisma.sMSCampaign.delete({
      where: { id: req.params.id },
    });

    res.json({ data: { success: true } });
  } catch (error) {
    next(error);
  }
});

// Send/Schedule campaign
router.post('/campaigns/:id/send', authenticate, adminOnly, async (req, res, next) => {
  try {
    const { scheduledAt } = req.body;

    const existing = await prisma.sMSCampaign.findUnique({
      where: { id: req.params.id },
    });

    if (!existing) {
      return res.status(404).json({ error: { message: 'Campaign not found' } });
    }

    if (existing.status !== 'DRAFT' && existing.status !== 'SCHEDULED') {
      return res.status(400).json({ error: { message: 'Campaign cannot be sent' } });
    }

    // If scheduling, update the scheduled time
    if (scheduledAt) {
      const campaign = await prisma.sMSCampaign.update({
        where: { id: req.params.id },
        data: {
          status: 'SCHEDULED',
          scheduledAt: new Date(scheduledAt),
        },
      });
      return res.json({ data: { campaign, message: 'Campaign scheduled' } });
    }

    // Otherwise, populate recipients and start sending
    const campaign = await prisma.sMSCampaign.update({
      where: { id: req.params.id },
      data: {
        status: 'PROCESSING',
        startedAt: new Date(),
      },
    });

    // Populate recipients based on target type
    let recipientData = [];

    if (existing.targetType === 'ALL_MEMBERS') {
      const members = await prisma.memberProfile.findMany({
        where: { phone: { not: null } },
        select: { phone: true, userId: true, user: { select: { firstName: true, lastName: true } } },
      });
      recipientData = members.map(m => ({
        phone: m.phone,
        name: `${m.user.firstName} ${m.user.lastName}`,
        userId: m.userId,
        campaignId: campaign.id,
      }));
    } else if (existing.targetType === 'MINISTRY' && existing.targetId) {
      const members = await prisma.memberProfile.findMany({
        where: {
          phone: { not: null },
          ministries: { some: { id: existing.targetId } },
        },
        select: { phone: true, userId: true, user: { select: { firstName: true, lastName: true } } },
      });
      recipientData = members.map(m => ({
        phone: m.phone,
        name: `${m.user.firstName} ${m.user.lastName}`,
        userId: m.userId,
        campaignId: campaign.id,
      }));
    } else if (existing.targetType === 'EVENT_REGISTRANTS' && existing.targetId) {
      const registrations = await prisma.eventRegistration.findMany({
        where: {
          eventId: existing.targetId,
          phone: { not: null },
        },
        select: { phone: true, name: true, userId: true },
      });
      recipientData = registrations.map(r => ({
        phone: r.phone,
        name: r.name,
        userId: r.userId,
        campaignId: campaign.id,
      }));
    }

    // Create recipients in batches
    if (recipientData.length > 0) {
      await prisma.sMSRecipient.createMany({
        data: recipientData,
      });
    }

    // Update total recipients count
    await prisma.sMSCampaign.update({
      where: { id: campaign.id },
      data: { totalRecipients: recipientData.length },
    });

    res.json({
      data: {
        campaign,
        message: `Campaign started with ${recipientData.length} recipients`,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Cancel scheduled campaign
router.post('/campaigns/:id/cancel', authenticate, adminOnly, async (req, res, next) => {
  try {
    const existing = await prisma.sMSCampaign.findUnique({
      where: { id: req.params.id },
    });

    if (!existing) {
      return res.status(404).json({ error: { message: 'Campaign not found' } });
    }

    if (existing.status !== 'SCHEDULED' && existing.status !== 'PROCESSING') {
      return res.status(400).json({ error: { message: 'Campaign cannot be cancelled' } });
    }

    const campaign = await prisma.sMSCampaign.update({
      where: { id: req.params.id },
      data: {
        status: 'CANCELLED',
      },
    });

    res.json({ data: { campaign } });
  } catch (error) {
    next(error);
  }
});

// Get ministries for target selection
router.get('/ministries', authenticate, adminOnly, async (req, res, next) => {
  try {
    const ministries = await prisma.ministry.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });

    res.json({ data: { ministries } });
  } catch (error) {
    next(error);
  }
});

// Get events for target selection
router.get('/events', authenticate, adminOnly, async (req, res, next) => {
  try {
    const events = await prisma.event.findMany({
      where: { isPublished: true },
      select: { id: true, title: true, startDate: true },
      orderBy: { startDate: 'desc' },
      take: 50,
    });

    res.json({ data: { events } });
  } catch (error) {
    next(error);
  }
});

export default router;
