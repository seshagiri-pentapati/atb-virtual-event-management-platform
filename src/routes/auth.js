import express from 'express';
import { body, validationResult } from 'express-validator';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sendEmail } from '../services/emailService.js';

const router = express.Router();

/**
 * User Authentication Routes
 * Handles registration, login, and user validation
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Create a new user account with email and password. User can be an organizer or attendee.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *           examples:
 *             organizer:
 *               value:
 *                 name: John Organizer
 *                 email: organizer@example.com
 *                 password: Password123
 *                 role: organizer
 *             attendee:
 *               value:
 *                 name: Jane Attendee
 *                 email: attendee@example.com
 *                 password: Password123
 *                 role: attendee
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Validation error or user already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  '/register',
  [
    body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').optional().isIn(['organizer', 'attendee']).withMessage('Role must be organizer or attendee'),
  ],
  async (req, res) => {
    try {
      // Validate request input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { name, email, password, role = 'attendee' } = req.body;
      const users = req.app.locals.users;

      // Check if user already exists
      const existingUser = users.find(user => user.email === email);
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'Email already registered' });
      }

      // Hash password using bcryptjs (10 salt rounds for security)
      const hashedPassword = await bcryptjs.hash(password, 10);

      // Create new user object
      const newUser = {
        id: `user_${Date.now()}`,
        name,
        email,
        password: hashedPassword,
        role,
        createdAt: new Date(),
      };

      // Store user in memory
      users.push(newUser);

      // Generate JWT token (expires in 7 days)
      const token = jwt.sign(
        { id: newUser.id, email: newUser.email, role: newUser.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE }
      );

      // Send welcome email asynchronously (non-blocking)
      sendEmail(email, 'Welcome to Event Management Platform', `Hello ${name},\n\nWelcome to our Event Management Platform!\nYou have registered as an ${role}.`)
        .catch(err => console.error('Email send error:', err));

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        token,
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user and get JWT token
 *     description: Authenticate a user with email and password. Returns a JWT token for subsequent authenticated requests.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AuthRequest'
 *           example:
 *             email: user@example.com
 *             password: Password123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res) => {
    try {
      // Validate request input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { email, password } = req.body;
      const users = req.app.locals.users;

      // Find user by email
      const user = users.find(u => u.email === email);
      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }

      // Compare password with hashed password
      const isPasswordValid = await bcryptjs.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }

      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE }
      );

      res.json({
        success: true,
        message: 'Logged in successfully',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

export default router;
