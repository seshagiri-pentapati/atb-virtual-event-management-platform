/**
 * Swagger Configuration
 * 
 * This file contains the Swagger/OpenAPI specification for the Virtual Event Management API.
 * It provides a standardized way to document all API endpoints, request/response schemas,
 * and authentication methods.
 * 
 * The Swagger UI is accessible at: http://localhost:3000/api-docs
 * The OpenAPI JSON specification is available at: http://localhost:3000/swagger.json
 */

import swaggerJsdoc from 'swagger-jsdoc';

/**
 * Swagger Options Configuration
 * 
 * This object defines:
 * 1. API Definition: Basic info, servers, and security schemes
 * 2. API Paths: Detailed documentation for each endpoint
 * 3. Components: Reusable schemas and models
 */
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Virtual Event Management Platform API',
      version: '1.0.0',
      description: 'Comprehensive RESTful API for managing virtual events with user authentication, event scheduling, and participant management.',
      contact: {
        name: 'API Support',
        url: 'http://localhost:3000',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development Server',
      },
      {
        url: 'https://api.example.com',
        description: 'Production Server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token received after login. Use format: Bearer <token>',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Unique user identifier (UUID)',
            },
            name: {
              type: 'string',
              description: 'Full name of the user',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email address (must be unique)',
            },
            role: {
              type: 'string',
              enum: ['organizer', 'attendee'],
              description: 'User role in the system',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Account creation timestamp',
            },
          },
        },
        Event: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Unique event identifier (UUID)',
            },
            title: {
              type: 'string',
              description: 'Event title/name',
            },
            description: {
              type: 'string',
              description: 'Detailed event description',
            },
            date: {
              type: 'string',
              format: 'date',
              description: 'Event date in YYYY-MM-DD format',
            },
            time: {
              type: 'string',
              description: 'Event time in HH:MM format (24-hour)',
            },
            location: {
              type: 'string',
              description: 'Virtual meeting link or location',
            },
            capacity: {
              type: 'integer',
              minimum: 1,
              description: 'Maximum number of attendees',
            },
            organizerId: {
              type: 'string',
              description: 'ID of the event organizer',
            },
            organizerName: {
              type: 'string',
              description: 'Name of the event organizer',
            },
            participants: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  userId: {
                    type: 'string',
                  },
                  userName: {
                    type: 'string',
                  },
                  registeredAt: {
                    type: 'string',
                    format: 'date-time',
                  },
                },
              },
              description: 'List of registered participants',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Event creation timestamp',
            },
          },
        },
        AuthRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
            },
            password: {
              type: 'string',
              minLength: 6,
              description: 'User password (minimum 6 characters)',
            },
          },
        },
        RegisterRequest: {
          type: 'object',
          required: ['name', 'email', 'password', 'role'],
          properties: {
            name: {
              type: 'string',
              minLength: 2,
              description: 'Full name (minimum 2 characters)',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email address (must be unique)',
            },
            password: {
              type: 'string',
              minLength: 6,
              description: 'Password (minimum 6 characters)',
            },
            role: {
              type: 'string',
              enum: ['organizer', 'attendee'],
              description: 'User role selection',
            },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
            },
            message: {
              type: 'string',
            },
            token: {
              type: 'string',
              description: 'JWT token for authenticated requests',
            },
            user: {
              $ref: '#/components/schemas/User',
            },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
              example: 'Error message describing what went wrong',
            },
          },
        },
      },
    },
    security: [
      {
        BearerAuth: [],
      },
    ],
  },
  apis: [
    './src/routes/auth.js',
    './src/routes/events.js',
    './src/routes/participants.js',
  ],
};

/**
 * Swagger Specification Generator
 * 
 * This function generates the complete OpenAPI specification by combining:
 * 1. The definition object (servers, security schemes, schemas)
 * 2. JSDoc comments from route files (endpoint documentation)
 * 
 * The returned spec is used by Swagger UI for interactive API documentation
 */
const swaggerSpec = swaggerJsdoc(swaggerOptions);

export default swaggerSpec;
