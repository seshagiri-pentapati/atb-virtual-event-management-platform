import express from 'express';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger.js';
import authRoutes from './routes/auth.js';
import eventRoutes from './routes/events.js';
import participantRoutes from './routes/participants.js';
import { verifyEmailConfig } from './services/emailService.js';

/**
 * Virtual Event Management Platform Backend
 * 
 * This Express.js server provides RESTful API endpoints for:
 * 1. User Authentication (registration, login with JWT)
 * 2. Event Management (CRUD operations)
 * 3. Participant Management (event registration, cancellation)
 * 
 * Data is stored in-memory using arrays and objects
 * Email notifications are sent asynchronously using Nodemailer
 */

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

/**
 * Middleware Configuration
 * 
 * express.json(): Parse incoming JSON request bodies
 * - Limits to 10MB for security
 * - Populates req.body with parsed JSON
 */
app.use(express.json({ limit: '10mb' }));

/**
 * In-Memory Data Stores
 * 
 * Users Array:
 * - Stores user objects with id, name, email, hashed password, role, createdAt
 * - Used for authentication and user management
 * 
 * Events Array:
 * - Stores event objects with id, title, description, date, time, participants, etc.
 * - Participants list maintains attendee information and registration time
 * 
 * Access: req.app.locals.users and req.app.locals.events
 */
app.locals.users = [];
app.locals.events = [];

/**
 * Request Logging Middleware
 * Logs all incoming requests with method, path, and timestamp
 */
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

/**
 * API Routes Registration
 * 
 * Routes mounted at:
 * - /auth - User authentication (register, login)
 * - /events - Event CRUD operations
 * - /events/:id/register - Event participant management
 * - /api-docs - Swagger UI (interactive API documentation)
 * - /swagger.json - OpenAPI specification (JSON format)
 */
app.use('/auth', authRoutes);
app.use('/events', eventRoutes);
app.use('/events', participantRoutes);

/**
 * Swagger UI Integration
 * 
 * Provides interactive API documentation accessible at http://localhost:3000/api-docs
 * Features:
 * - Try-it-out functionality to test endpoints
 * - Request/response examples
 * - Authentication token input
 * - Schema validation
 */
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
  },
  customCss: '.topbar { display: none }',
  customSiteTitle: 'Virtual Event Management API Docs',
}));

/**
 * OpenAPI Specification Endpoint
 * Returns the raw Swagger specification in JSON format
 * Useful for API clients and external integrations
 */
app.get('/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

/**
 * Health Check Endpoint
 * Returns server status and can be used by monitoring services
 */
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

/**
 * Root Endpoint
 * Returns API information and available endpoints
 */
app.get('/', (req, res) => {
  res.json({
    name: 'Virtual Event Management Platform API',
    version: '1.0.0',
    description: 'Backend API for virtual event management with user authentication, event scheduling, and participant management',
    documentation: 'http://localhost:3000/api-docs',
    swaggerJson: 'http://localhost:3000/swagger.json',
    endpoints: {
      auth: {
        register: 'POST /auth/register',
        login: 'POST /auth/login',
      },
      events: {
        getAll: 'GET /events',
        create: 'POST /events',
        getOne: 'GET /events/:id',
        update: 'PUT /events/:id',
        delete: 'DELETE /events/:id',
      },
      participants: {
        register: 'POST /events/:id/register',
        getParticipants: 'GET /events/:id/participants',
        unregister: 'DELETE /events/:eventId/register/:userId',
        checkRegistration: 'GET /events/:id/my-registration',
        getUserRegistrations: 'GET /events/user/registrations',
      },
      documentation: {
        swaggerUI: 'GET /api-docs',
        openAPISpec: 'GET /swagger.json',
      },
    },
  });
});

/**
 * 404 Not Found Handler
 * Catches all requests to undefined routes
 */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path,
  });
});

/**
 * Global Error Handler
 * Catches all unhandled errors and returns appropriate error response
 */
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

/**
 * Server Startup
 * 
 * Logic:
 * 1. Verify email configuration (non-critical, server starts even if email fails)
 * 2. Listen on specified PORT
 * 3. Log startup message with server URL
 * 4. Handle server errors gracefully
 */
async function startServer() {
  try {
    // Verify email configuration before starting server
    // If email config fails, it's not critical - server can still run
    try {
      await verifyEmailConfig();
    } catch (emailError) {
      console.warn('⚠️  Email service initialization failed. Email features may not work.');
      console.warn('Please check your EMAIL_* environment variables in .env file');
    }

    app.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════════════════════════╗
║   Virtual Event Management Platform API                    ║
║   Server running at http://localhost:${PORT}                   ║
║   API Documentation: http://localhost:${PORT}/api-docs          ║
║   Environment: ${process.env.NODE_ENV}                             ║
╚════════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();

export default app;
