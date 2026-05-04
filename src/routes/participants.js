import express from 'express';
import { param, validationResult } from 'express-validator';
import { authenticate } from '../middleware/auth.js';
import { sendEmail } from '../services/emailService.js';

const router = express.Router();

/**
 * Participant Management Routes
 * Handles event registration and participant management
 */

/**
 * @swagger
 * /events/{id}/register:
 *   post:
 *     summary: Register user for an event
 *     description: Register the authenticated user for a specific event. The user can only register once per event.
 *     tags:
 *       - Participants
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     responses:
 *       201:
 *         description: Successfully registered for event
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 event:
 *                   $ref: '#/components/schemas/Event'
 *       400:
 *         description: Bad request - Event at capacity, already registered, or validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized - Missing or invalid JWT token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Event not found
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
  '/:id/register',
  authenticate,
  [param('id').notEmpty().withMessage('Event ID is required')],
  async (req, res) => {
    try {
      // Validate request input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const event = req.app.locals.events.find(e => e.id === req.params.id);
      if (!event) {
        return res.status(404).json({ success: false, message: 'Event not found' });
      }

      // Check if event is at capacity
      if (event.participants.length >= event.maxParticipants) {
        return res.status(400).json({ success: false, message: 'Event is at maximum capacity' });
      }

      // Check if user is already registered
      const alreadyRegistered = event.participants.find(p => p.userId === req.user.id);
      if (alreadyRegistered) {
        return res.status(400).json({ success: false, message: 'You are already registered for this event' });
      }

      // Add participant to event
      const participant = {
        userId: req.user.id,
        email: req.user.email,
        registeredAt: new Date(),
      };

      event.participants.push(participant);

      // Send confirmation email asynchronously (non-blocking)
      sendEmail(
        req.user.email,
        `Registration Confirmed: ${event.title}`,
        `Hello,\n\nYou have successfully registered for "${event.title}"\nDate: ${event.date}\nTime: ${event.time}\n\nWe look forward to seeing you!`
      ).catch(err => console.error('Email send error:', err));

      res.status(201).json({
        success: true,
        message: 'Successfully registered for event',
        event: {
          ...event,
          participantCount: event.participants.length,
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

/**
 * @swagger
 * /events/{id}/participants:
 *   get:
 *     summary: Get all participants for an event
 *     description: Retrieve a list of all participants registered for a specific event, including registration details.
 *     tags:
 *       - Participants
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     responses:
 *       200:
 *         description: List of participants retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 eventId:
 *                   type: string
 *                 eventTitle:
 *                   type: string
 *                 participantCount:
 *                   type: integer
 *                 maxCapacity:
 *                   type: integer
 *                 availableSlots:
 *                   type: integer
 *                 participants:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       userId:
 *                         type: string
 *                       email:
 *                         type: string
 *                       registeredAt:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Unauthorized - Missing or invalid JWT token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Event not found
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
router.get(
  '/:id/participants',
  authenticate,
  [param('id').notEmpty().withMessage('Event ID is required')],
  (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const event = req.app.locals.events.find(e => e.id === req.params.id);
      if (!event) {
        return res.status(404).json({ success: false, message: 'Event not found' });
      }

      res.json({
        success: true,
        eventId: event.id,
        eventTitle: event.title,
        participantCount: event.participants.length,
        maxCapacity: event.maxParticipants,
        availableSlots: event.maxParticipants - event.participants.length,
        participants: event.participants,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

/**
 * @swagger
 * /events/{eventId}/register/{userId}:
 *   delete:
 *     summary: Cancel event registration
 *     description: Cancel a user's registration for an event. Can be done by the registered user or event organizer.
 *     tags:
 *       - Participants
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to unregister
 *     responses:
 *       200:
 *         description: Registration cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized - Missing or invalid JWT token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden - Cannot cancel another user's registration
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Event not found or participant not found
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
router.delete(
  '/:eventId/register/:userId',
  authenticate,
  [
    param('eventId').notEmpty().withMessage('Event ID is required'),
    param('userId').notEmpty().withMessage('User ID is required'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { eventId, userId } = req.params;
      const event = req.app.locals.events.find(e => e.id === eventId);

      if (!event) {
        return res.status(404).json({ success: false, message: 'Event not found' });
      }

      // Verify user is either the participant or event organizer
      if (req.user.id !== userId && req.user.id !== event.organizerId) {
        return res.status(403).json({ success: false, message: 'Unauthorized to cancel this registration' });
      }

      // Find and remove participant
      const participantIndex = event.participants.findIndex(p => p.userId === userId);
      if (participantIndex === -1) {
        return res.status(404).json({ success: false, message: 'Participant not found in event' });
      }

      const participant = event.participants[participantIndex];
      event.participants.splice(participantIndex, 1);

      // Send cancellation email asynchronously
      sendEmail(
        participant.email,
        `Registration Cancelled: ${event.title}`,
        `Hello,\n\nYour registration for "${event.title}" has been cancelled.\n\nIf you have any questions, please contact the event organizer.`
      ).catch(err => console.error('Email send error:', err));

      res.json({
        success: true,
        message: 'Registration cancelled successfully',
        event: {
          ...event,
          participantCount: event.participants.length,
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

/**
 * GET /events/:id/my-registration
 * Check if current user is registered for an event
 * 
 * Logic:
 * 1. Authenticate user
 * 2. Find event by ID
 * 3. Search for user in participants list
 * 4. Return registration status
 * 
 * URL Parameters:
 * - id: string (event ID)
 * 
 * Response: Registration status and details
 */
router.get(
  '/:id/my-registration',
  authenticate,
  [param('id').notEmpty().withMessage('Event ID is required')],
  (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const event = req.app.locals.events.find(e => e.id === req.params.id);
      if (!event) {
        return res.status(404).json({ success: false, message: 'Event not found' });
      }

      const registration = event.participants.find(p => p.userId === req.user.id);

      res.json({
        success: true,
        eventId: event.id,
        isRegistered: !!registration,
        registration: registration || null,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

/**
 * GET /events/user/registrations
 * Get all events user is registered for
 * 
 * Logic:
 * 1. Authenticate user
 * 2. Search all events
 * 3. Find events where user is in participants
 * 4. Return list of events user is registered for
 * 
 * Response: Array of events with registration details
 */
router.get(
  '/user/registrations',
  authenticate,
  (req, res) => {
    try {
      const events = req.app.locals.events;

      // Find all events where user is registered
      const userRegistrations = events
        .filter(event => event.participants.some(p => p.userId === req.user.id))
        .map(event => {
          const registration = event.participants.find(p => p.userId === req.user.id);
          return {
            eventId: event.id,
            title: event.title,
            date: event.date,
            time: event.time,
            organizerName: event.organizerName,
            registeredAt: registration.registeredAt,
          };
        });

      res.json({
        success: true,
        count: userRegistrations.length,
        registrations: userRegistrations,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

export default router;
