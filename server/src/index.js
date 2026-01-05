import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Route imports
import authRoutes from './routes/auth.js';
import postRoutes from './routes/posts.js';
import sermonRoutes from './routes/sermons.js';
import eventRoutes from './routes/events.js';
import donationRoutes from './routes/donations.js';
import memberRoutes from './routes/members.js';
import uploadRoutes from './routes/uploads.js';
import chatRoutes from './routes/chat.js';
import settingsRoutes from './routes/settings.js';
import smsRoutes from './routes/sms.js';
import socialRoutes from './routes/social.js';
import contentRoutes from './routes/content.js';
import { startSmsQueue } from './services/smsQueue.js';
import { startSocialQueue } from './services/socialQueue.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 5001;

// Trust proxy for DigitalOcean load balancer
app.set('trust proxy', 1);

// Socket.io setup
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Make io accessible to routes
app.set('io', io);

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: { error: { message: 'Too many requests, please try again later.' } },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window
  message: { error: { message: 'Too many login attempts, please try again later.' } },
  standardHeaders: true,
  legacyHeaders: false,
});

const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 requests per hour
  message: { error: { message: 'Rate limit exceeded, please try again later.' } },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(morgan('dev'));

// Apply rate limiting
app.use('/api/', generalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/donations/create-payment-intent', strictLimiter);

// Stripe webhook needs raw body for signature verification - must be before express.json()
app.use('/api/donations/webhook', express.raw({ type: 'application/json' }));

// JSON parsing for all other routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files for uploads
app.use('/uploads', express.static('uploads'));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/sermons', sermonRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/sms', smsRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/content', contentRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Join a chat room (session)
  socket.on('join-chat', (sessionId) => {
    socket.join(`chat:${sessionId}`);
    console.log(`Socket ${socket.id} joined chat:${sessionId}`);
  });

  // Leave a chat room
  socket.on('leave-chat', (sessionId) => {
    socket.leave(`chat:${sessionId}`);
  });

  // Join admin room for notifications
  socket.on('join-admin', () => {
    socket.join('admin-chat');
    console.log(`Socket ${socket.id} joined admin-chat`);
  });

  // Handle new message
  socket.on('send-message', (data) => {
    const { sessionId, message } = data;
    // Broadcast to everyone in the chat room
    io.to(`chat:${sessionId}`).emit('new-message', message);
    // Also notify admin room
    io.to('admin-chat').emit('new-message', { sessionId, message });
  });

  // Handle typing indicator
  socket.on('typing', (data) => {
    const { sessionId, isTyping, isVisitor } = data;
    socket.to(`chat:${sessionId}`).emit('user-typing', { isTyping, isVisitor });
  });

  // Handle session status change
  socket.on('session-status', (data) => {
    const { sessionId, status } = data;
    io.to(`chat:${sessionId}`).emit('session-status-changed', { status });
    io.to('admin-chat').emit('session-updated', { sessionId, status });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: { message: 'Route not found' } });
});

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

  // Start background services
  startSmsQueue();
  startSocialQueue();
});

export default app;
