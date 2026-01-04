import { Router } from 'express';
import { body } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { authenticate, adminOnly, editorOrAdmin } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { sendChatNotification } from '../services/notifications.js';

const router = Router();
const prisma = new PrismaClient();

// Create or get existing chat session for visitor
router.post(
  '/session',
  [
    body('visitorId').notEmpty().withMessage('Visitor ID is required'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { visitorId, visitorName, visitorEmail } = req.body;

      // Check for existing active session
      let session = await prisma.chatSession.findFirst({
        where: {
          visitorId,
          status: { not: 'CLOSED' },
        },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
            take: 50,
          },
          assignee: {
            select: { id: true, name: true, avatar: true },
          },
        },
      });

      if (!session) {
        session = await prisma.chatSession.create({
          data: {
            visitorId,
            visitorName,
            visitorEmail,
            status: 'WAITING',
          },
          include: {
            messages: true,
            assignee: {
              select: { id: true, name: true, avatar: true },
            },
          },
        });
      } else if (visitorName || visitorEmail) {
        // Update visitor info if provided
        session = await prisma.chatSession.update({
          where: { id: session.id },
          data: {
            ...(visitorName && { visitorName }),
            ...(visitorEmail && { visitorEmail }),
          },
          include: {
            messages: {
              orderBy: { createdAt: 'asc' },
              take: 50,
            },
            assignee: {
              select: { id: true, name: true, avatar: true },
            },
          },
        });
      }

      res.json({ session });
    } catch (error) {
      next(error);
    }
  }
);

// Send message (visitor)
router.post(
  '/session/:sessionId/message',
  [
    body('content').trim().notEmpty().withMessage('Message content is required'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { sessionId } = req.params;
      const { content, visitorId } = req.body;

      // Verify session belongs to this visitor
      const session = await prisma.chatSession.findFirst({
        where: {
          id: sessionId,
          visitorId,
        },
      });

      if (!session) {
        return res.status(404).json({ error: { message: 'Session not found' } });
      }

      // Check if this is the first message in the session
      const messageCount = await prisma.chatMessage.count({
        where: { sessionId },
      });

      const message = await prisma.chatMessage.create({
        data: {
          content,
          isFromVisitor: true,
          sessionId,
        },
      });

      // Update session status to waiting if it was active (waiting for staff response)
      if (session.status === 'ACTIVE') {
        await prisma.chatSession.update({
          where: { id: sessionId },
          data: { status: 'WAITING' },
        });
      }

      // Send notification for first message
      if (messageCount === 0) {
        sendChatNotification(
          session.visitorName || 'Anonymous Visitor',
          session.visitorEmail,
          content
        ).catch(err => console.error('Notification error:', err));
      }

      res.status(201).json({ message });
    } catch (error) {
      next(error);
    }
  }
);

// Get messages for a session (visitor)
router.get('/session/:sessionId/messages', async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { visitorId } = req.query;

    const session = await prisma.chatSession.findFirst({
      where: {
        id: sessionId,
        visitorId,
      },
    });

    if (!session) {
      return res.status(404).json({ error: { message: 'Session not found' } });
    }

    const messages = await prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    res.json({ messages });
  } catch (error) {
    next(error);
  }
});

// Close session (visitor)
router.patch('/session/:sessionId/close', async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { visitorId } = req.body;

    const session = await prisma.chatSession.updateMany({
      where: {
        id: sessionId,
        visitorId,
      },
      data: {
        status: 'CLOSED',
        closedAt: new Date(),
      },
    });

    res.json({ message: 'Session closed' });
  } catch (error) {
    next(error);
  }
});

// ============ ADMIN ROUTES ============

// Get all active chat sessions (admin)
router.get('/admin/sessions', authenticate, editorOrAdmin, async (req, res, next) => {
  try {
    const { status } = req.query;

    const where = status ? { status } : { status: { not: 'CLOSED' } };

    const sessions = await prisma.chatSession.findMany({
      where,
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        assignee: {
          select: { id: true, name: true, avatar: true },
        },
        _count: {
          select: {
            messages: {
              where: { isFromVisitor: true, isRead: false },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    res.json({ sessions });
  } catch (error) {
    next(error);
  }
});

// Get single session with all messages (admin)
router.get('/admin/sessions/:sessionId', authenticate, editorOrAdmin, async (req, res, next) => {
  try {
    const session = await prisma.chatSession.findUnique({
      where: { id: req.params.sessionId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            sender: {
              select: { id: true, name: true, avatar: true },
            },
          },
        },
        assignee: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    if (!session) {
      return res.status(404).json({ error: { message: 'Session not found' } });
    }

    // Mark messages as read
    await prisma.chatMessage.updateMany({
      where: { sessionId: req.params.sessionId, isFromVisitor: true, isRead: false },
      data: { isRead: true },
    });

    res.json({ session });
  } catch (error) {
    next(error);
  }
});

// Send message as staff (admin)
router.post(
  '/admin/sessions/:sessionId/message',
  authenticate,
  editorOrAdmin,
  [
    body('content').trim().notEmpty().withMessage('Message content is required'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { sessionId } = req.params;
      const { content } = req.body;

      const session = await prisma.chatSession.findUnique({
        where: { id: sessionId },
      });

      if (!session) {
        return res.status(404).json({ error: { message: 'Session not found' } });
      }

      const message = await prisma.chatMessage.create({
        data: {
          content,
          isFromVisitor: false,
          sessionId,
          senderId: req.user.id,
        },
        include: {
          sender: {
            select: { id: true, name: true, avatar: true },
          },
        },
      });

      // Update session status to active and assign to current user if not assigned
      await prisma.chatSession.update({
        where: { id: sessionId },
        data: {
          status: 'ACTIVE',
          assigneeId: session.assigneeId || req.user.id,
        },
      });

      res.status(201).json({ message });
    } catch (error) {
      next(error);
    }
  }
);

// Assign session to staff (admin)
router.patch('/admin/sessions/:sessionId/assign', authenticate, editorOrAdmin, async (req, res, next) => {
  try {
    const { assigneeId } = req.body;

    const session = await prisma.chatSession.update({
      where: { id: req.params.sessionId },
      data: {
        assigneeId: assigneeId || req.user.id,
        status: 'ACTIVE',
      },
      include: {
        assignee: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    res.json({ session });
  } catch (error) {
    next(error);
  }
});

// Close session (admin)
router.patch('/admin/sessions/:sessionId/close', authenticate, editorOrAdmin, async (req, res, next) => {
  try {
    const session = await prisma.chatSession.update({
      where: { id: req.params.sessionId },
      data: {
        status: 'CLOSED',
        closedAt: new Date(),
      },
    });

    res.json({ message: 'Session closed', session });
  } catch (error) {
    next(error);
  }
});

// Get unread message count (admin)
router.get('/admin/unread-count', authenticate, editorOrAdmin, async (req, res, next) => {
  try {
    const count = await prisma.chatMessage.count({
      where: {
        isFromVisitor: true,
        isRead: false,
        session: {
          status: { not: 'CLOSED' },
        },
      },
    });

    const waitingSessions = await prisma.chatSession.count({
      where: { status: 'WAITING' },
    });

    res.json({ unreadMessages: count, waitingSessions });
  } catch (error) {
    next(error);
  }
});

export default router;
