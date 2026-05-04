import express from 'express';
import { body, param, validationResult } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

/**
 * Event Management Routes
 * Handles CRUD operations for events (Create, Read, Update, Delete)
 * Only accessible to authenticated users
 */

/**
 * @swagger
 * /events:
 *   get:
 *     summary: Get all events
 *     description: Retrieve a list of all events. Can be filtered by organizer ID using query parameters.
 *     tags:
 *       - Events
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: organizer
 *         schema:
 *           type: string
 *         description: Filter events by organizer ID
 *     responses:
 *       200:
 *         description: List of events retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 events:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Event'
 *       401:
 *         description: Unauthorized - Missing or invalid JWT token
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
router.get('/', authenticate, (req, res) => {
  try {
    const events = req.app.locals.events;
    const { organizer } = req.query;

    // Filter events by organizer if provided
    const filteredEvents = organizer
      ? events.filter(event => event.organizerId === organizer)
      : events;

    res.json({
      success: true,
      count: filteredEvents.length,
      events: filteredEvents.map(event => ({
        ...event,
        participantCount: event.participants.length,
      })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /events:
 *   post:
 *     summary: Create a new event
 *     description: Create a new event. Only users with organizer role can create events.
 *     tags:
 *       - Events
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - date
 *               - time
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 3
 *                 description: Event title (minimum 3 characters)
 *               description:
 *                 type: string
 *                 minLength: 10
 *                 description: Event description (minimum 10 characters)
 *               date:
 *                 type: string
 *                 format: date
 *                 description: Event date in YYYY-MM-DD format
 *               time:
 *                 type: string
 *                 description: Event time in HH:mm format (24-hour)
 *               maxParticipants:
 *                 type: integer
 *                 minimum: 1
 *                 default: 100
 *                 description: Maximum number of participants
 *           example:
 *             title: Annual Tech Conference
 *             description: A comprehensive tech conference covering latest trends
 *             date: "2024-06-15"
 *             time: "10:00"
 *             maxParticipants: 500
 *     responses:
 *       201:
 *         description: Event created successfully
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
 *         description: Validation error
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
 *       403:
 *         description: Forbidden - Only organizers can create events
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
  '/',
  authenticate,
  authorize('organizer'),
  [
    body('title').trim().isLength({ min: 3 }).withMessage('Title must be at least 3 characters'),
    body('description').trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
    body('date').matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Date must be in YYYY-MM-DD format'),
    body('time').matches(/^\d{2}:\d{2}$/).withMessage('Time must be in HH:mm format'),
    body('maxParticipants').optional().isInt({ min: 1 }).withMessage('Max participants must be a positive number'),
  ],
  (req, res) => {
    try {
      // Validate request input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { title, description, date, time, maxParticipants = 100 } = req.body;
      const events = req.app.locals.events;

      // Create new event object
      const newEvent = {
        id: `event_${Date.now()}`,
        title,
        description,
        date,
        time,
        maxParticipants,
        organizerId: req.user.id,
        organizerName: req.user.email,
        participants: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Store event in memory
      events.push(newEvent);

      res.status(201).json({
        success: true,
        message: 'Event created successfully',
        event: newEvent,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

/**
 * @swagger
 * /events/{id}:
 *   get:
 *     summary: Get event by ID
 *     description: Retrieve detailed information about a specific event including all participants.
 *     tags:
 *       - Events
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
 *         description: Event retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 event:
 *                   $ref: '#/components/schemas/Event'
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
  '/:id',
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
 * /events/{id}:
 *   put:
 *     summary: Update an event
 *     description: Update event details. Only the event organizer can update an event.
 *     tags:
 *       - Events
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Updated event title
 *               description:
 *                 type: string
 *                 description: Updated event description
 *               date:
 *                 type: string
 *                 format: date
 *                 description: Updated event date
 *               time:
 *                 type: string
 *                 description: Updated event time
 *               maxParticipants:
 *                 type: integer
 *                 minimum: 1
 *                 description: Updated max participants
 *     responses:
 *       200:
 *         description: Event updated successfully
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
 *       401:
 *         description: Unauthorized - Missing or invalid JWT token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden - Only organizers can update events
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
router.put(
  '/:id',
  authenticate,
  authorize('organizer'),
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

      // Verify user is the organizer
      if (event.organizerId !== req.user.id) {
        return res.status(403).json({ success: false, message: 'You can only update your own events' });
      }

      // Update fields if provided
      if (req.body.title) event.title = req.body.title;
      if (req.body.description) event.description = req.body.description;
      if (req.body.date) event.date = req.body.date;
      if (req.body.time) event.time = req.body.time;
      if (req.body.maxParticipants) event.maxParticipants = req.body.maxParticipants;

      event.updatedAt = new Date();

      res.json({
        success: true,
        message: 'Event updated successfully',
        event,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

/**
 * @swagger
 * /events/{id}:
 *   delete:
 *     summary: Delete an event
 *     description: Delete an event. Only the event organizer can delete an event.
 *     tags:
 *       - Events
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
 *         description: Event deleted successfully
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
 *         description: Forbidden - Only organizers can delete events
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
 * - id: string (event ID)
 */
router.delete(
  '/:id',
  authenticate,
  authorize('organizer'),
  [param('id').notEmpty().withMessage('Event ID is required')],
  (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const eventIndex = req.app.locals.events.findIndex(e => e.id === req.params.id);
      if (eventIndex === -1) {
        return res.status(404).json({ success: false, message: 'Event not found' });
      }

      const event = req.app.locals.events[eventIndex];

      // Verify user is the organizer
      if (event.organizerId !== req.user.id) {
        return res.status(403).json({ success: false, message: 'You can only delete your own events' });
      }

      // Remove event from memory
      req.app.locals.events.splice(eventIndex, 1);

      res.json({
        success: true,
        message: 'Event deleted successfully',
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

export default router;
