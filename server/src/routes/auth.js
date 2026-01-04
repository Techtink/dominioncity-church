import { Router } from 'express';
import { body } from 'express-validator';
import {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  getAllUsers,
  updateUserRole,
} from '../controllers/authController.js';
import { authenticate, adminOnly } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

// Validation rules
const registerValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('name').trim().notEmpty().withMessage('Name is required'),
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

const passwordValidation = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
];

// Public routes
router.post('/register', registerValidation, validate, register);
router.post('/login', loginValidation, validate, login);

// Protected routes
router.get('/me', authenticate, getMe);
router.patch('/profile', authenticate, updateProfile);
router.patch('/password', authenticate, passwordValidation, validate, changePassword);

// Admin routes
router.get('/users', authenticate, adminOnly, getAllUsers);
router.patch('/users/:id', authenticate, adminOnly, updateUserRole);

export default router;
