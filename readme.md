# Virtual Event Management Platform - Backend System

A complete Node.js Express backend system for managing virtual events with user authentication, event scheduling, and participant management.

## Table of Contents
- [Features](#features)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Configuration](#configuration)
- [Swagger API Documentation](#swagger-api-documentation)
- [API Endpoints](#api-endpoints)
- [Authentication](#authentication)
- [Data Models](#data-models)
- [Logic Explanation](#logic-explanation)
- [Running Tests](#running-tests)
- [Usage Examples](#usage-examples)

## Features

✅ **User Authentication**
- User registration with email and password
- Secure password hashing using bcryptjs
- JWT token-based authentication
- Role-based access control (organizer/attendee)

✅ **Event Management**
- Create, read, update, delete events
- Event capacity management
- Event scheduling with date and time
- Organizer-only access to manage own events

✅ **Participant Management**
- Register users for events
- Automatic email notifications on registration
- View event participants
- Cancel registrations
- Check user event registrations

✅ **Email Notifications**
- Welcome emails on registration
- Event confirmation emails
- Cancellation notifications
- Asynchronous non-blocking email sending

✅ **Security**
- Password hashing with bcryptjs (10 salt rounds)
- JWT token-based authorization
- Input validation and sanitization
- Role-based authorization middleware

✅ **API Documentation**
- Interactive Swagger UI for testing endpoints
- OpenAPI 3.0 specification
- Request/response examples
- Authentication token input

## Swagger API Documentation

### Accessing Swagger Documentation

The API includes comprehensive interactive documentation powered by Swagger/OpenAPI 3.0:

**Swagger UI (Interactive)**: http://localhost:3000/api-docs
- Try-it-out functionality to test endpoints directly
- Real-time request/response examples
- Schema validation and documentation
- JWT token authentication input
- Automatic authorization persistence

**OpenAPI Specification (JSON)**: http://localhost:3000/swagger.json
- Raw OpenAPI specification in JSON format
- Can be imported into API clients (Postman, Insomnia, etc.)
- Use for programmatic API integration

### Swagger Features

1. **Try-it-Out**: Test any endpoint directly from the browser
   - Fill in required parameters
   - View request details before sending
   - See live responses with status codes
   - Test with real data

2. **Authentication**: Integrated JWT token support
   - Paste JWT token in the "Authorize" button at top
   - Token is automatically included in all requests
   - Authentication persists across all endpoints

3. **Schema Documentation**: Complete request/response models
   - View all available fields
   - See data types and validation rules
   - Example requests and responses
   - Required vs optional fields

4. **API Endpoint Discovery**: All endpoints documented with
   - Descriptions and use cases
   - Request/response models
   - Error codes and meanings
   - Query parameters and path parameters

### Swagger Configuration File

**Location**: `src/config/swagger.js`

This file contains:
- API title, version, and description
- Server configurations (development, production)
- Security scheme definitions (Bearer JWT)
- Reusable component schemas
- API endpoint paths

The configuration uses JSDoc comments in route files for endpoint documentation, which are automatically merged with this configuration.


## Architecture

### Core Components

```
┌─────────────────────────────────────────┐
│         Express.js Server               │
├─────────────────────────────────────────┤
│  API Routes (Auth, Events, Participants)│
├─────────────────────────────────────────┤
│  Middleware (Auth, Validation)          │
├─────────────────────────────────────────┤
│  Services (Email, Password Hashing)     │
├─────────────────────────────────────────┤
│  In-Memory Data Stores (Users, Events)  │
└─────────────────────────────────────────┘
```

### Data Flow

1. **Request → Middleware** → Validates token and authorization
2. **Middleware → Route Handler** → Processes business logic
3. **Route Handler → Services** → Sends emails, hashes passwords
4. **Services → Response** → Returns JSON to client

## Project Structure

```
virtual-event-management-backend/
├── src/
│   ├── server.js                    # Express app entry point
│   ├── routes/
│   │   ├── auth.js                  # Authentication endpoints
│   │   ├── events.js                # Event management endpoints
│   │   └── participants.js          # Participant management endpoints
│   ├── middleware/
│   │   └── auth.js                  # JWT verification & authorization
│   ├── services/
│   │   └── emailService.js          # Email sending logic
│   └── tests/
│       └── auth.test.js             # Test cases
├── .env                             # Environment variables (local)
├── .env.example                     # Environment variables template
├── package.json                     # Project dependencies
└── README.md                        # This file
```

## Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Gmail account (for email notifications)

### Steps

1. **Clone or setup the project**
```bash
cd virtual-event-management-backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Create .env file**
```bash
cp .env.example .env
```

4. **Update .env with your configuration**
```
PORT=3000
NODE_ENV=development
JWT_SECRET=your_secret_key_here

# Gmail Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password
EMAIL_FROM=noreply@eventmanagement.com
```

### Getting Gmail App Password
1. Enable 2-factor authentication on Gmail
2. Go to https://myaccount.google.com/apppasswords
3. Select Mail and Windows Computer
4. Copy the generated 16-character password
5. Paste into EMAIL_PASSWORD in .env

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 3000 |
| NODE_ENV | Environment (development/production) | development |
| JWT_SECRET | Secret key for signing JWT tokens | - |
| JWT_EXPIRE | Token expiration time | 7d |
| EMAIL_HOST | SMTP server host | smtp.gmail.com |
| EMAIL_PORT | SMTP server port | 587 |
| EMAIL_USER | SMTP username | - |
| EMAIL_PASSWORD | SMTP password | - |
| EMAIL_FROM | Email sender address | - |

## API Endpoints

### Quick Reference with Swagger

**Interactive Documentation**: Visit http://localhost:3000/api-docs to test all endpoints interactively.

Use the Swagger UI to:
1. View all available endpoints
2. Test requests with real data
3. See live responses and error codes
4. Authorize with JWT tokens
5. View request/response schemas

### Authentication Routes

#### 1. Register User
```http
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "role": "organizer"  // or "attendee" (default)
}

Response (201):
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "user_1234567890",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "organizer"
  }
}
```

#### 2. Login User
```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securePassword123"
}

Response (200):
{
  "success": true,
  "message": "Logged in successfully",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "user_1234567890",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "organizer"
  }
}
```

### Event Management Routes

#### 3. Create Event (Organizer Only)
```http
POST /events
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Web Development Workshop",
  "description": "Learn modern web development techniques",
  "date": "2024-03-15",
  "time": "14:00",
  "maxParticipants": 50
}

Response (201):
{
  "success": true,
  "message": "Event created successfully",
  "event": {
    "id": "event_1234567890",
    "title": "Web Development Workshop",
    "date": "2024-03-15",
    "time": "14:00",
    "maxParticipants": 50,
    "participants": [],
    "organizerId": "user_1234567890"
  }
}
```

#### 4. Get All Events
```http
GET /events
Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "count": 5,
  "events": [
    {
      "id": "event_1234567890",
      "title": "Web Development Workshop",
      "date": "2024-03-15",
      "time": "14:00",
      "participants": [],
      "participantCount": 0
    }
  ]
}
```

#### 5. Get Single Event
```http
GET /events/:id
Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "event": {
    "id": "event_1234567890",
    "title": "Web Development Workshop",
    "date": "2024-03-15",
    "time": "14:00",
    "participants": [],
    "participantCount": 0
  }
}
```

#### 6. Update Event (Organizer Only)
```http
PUT /events/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Advanced Web Development Workshop",
  "maxParticipants": 75
}

Response (200):
{
  "success": true,
  "message": "Event updated successfully",
  "event": { ... }
}
```

#### 7. Delete Event (Organizer Only)
```http
DELETE /events/:id
Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "message": "Event deleted successfully"
}
```

### Participant Management Routes

#### 8. Register for Event
```http
POST /events/:id/register
Authorization: Bearer <token>

Response (201):
{
  "success": true,
  "message": "Successfully registered for event",
  "event": {
    "id": "event_1234567890",
    "participants": [
      {
        "userId": "user_1234567890",
        "email": "john@example.com",
        "registeredAt": "2024-02-25T10:30:00Z"
      }
    ],
    "participantCount": 1
  }
}
```

#### 9. Get Event Participants
```http
GET /events/:id/participants
Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "eventId": "event_1234567890",
  "eventTitle": "Web Development Workshop",
  "participantCount": 5,
  "maxCapacity": 50,
  "availableSlots": 45,
  "participants": [
    {
      "userId": "user_1234567890",
      "email": "john@example.com",
      "registeredAt": "2024-02-25T10:30:00Z"
    }
  ]
}
```

#### 10. Cancel Registration
```http
DELETE /events/:eventId/register/:userId
Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "message": "Registration cancelled successfully",
  "event": { ... }
}
```

#### 11. Check My Registration
```http
GET /events/:id/my-registration
Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "eventId": "event_1234567890",
  "isRegistered": true,
  "registration": {
    "userId": "user_1234567890",
    "email": "john@example.com",
    "registeredAt": "2024-02-25T10:30:00Z"
  }
}
```

#### 12. Get My Event Registrations
```http
GET /events/user/registrations
Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "count": 3,
  "registrations": [
    {
      "eventId": "event_1234567890",
      "title": "Web Development Workshop",
      "date": "2024-03-15",
      "time": "14:00",
      "organizerName": "john@example.com",
      "registeredAt": "2024-02-25T10:30:00Z"
    }
  ]
}
```

## Authentication

### JWT Token Structure

```
Header:
{
  "alg": "HS256",
  "typ": "JWT"
}

Payload:
{
  "id": "user_1234567890",
  "email": "john@example.com",
  "role": "organizer",
  "iat": 1709096400,
  "exp": 1709701200
}

Signature:
HMACSHA256(header.payload, JWT_SECRET)
```

### Token Usage

All protected endpoints require the Authorization header:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Token Validation Flow

1. Extract token from Authorization header
2. Verify signature using JWT_SECRET
3. Check token expiration
4. Extract user information from payload
5. Attach user to request object

## Data Models

### User Object
```javascript
{
  id: "user_1234567890",              // Unique identifier
  name: "John Doe",
  email: "john@example.com",
  password: "$2a$10$...",              // Hashed with bcryptjs
  role: "organizer",                  // "organizer" or "attendee"
  createdAt: "2024-02-25T10:00:00Z"
}
```

### Event Object
```javascript
{
  id: "event_1234567890",
  title: "Web Development Workshop",
  description: "Learn modern web development...",
  date: "2024-03-15",                 // YYYY-MM-DD format
  time: "14:00",                      // HH:mm format
  maxParticipants: 50,
  organizerId: "user_1234567890",
  organizerName: "john@example.com",
  participants: [                     // Array of participant objects
    {
      userId: "user_9876543210",
      email: "jane@example.com",
      registeredAt: "2024-02-25T10:30:00Z"
    }
  ],
  createdAt: "2024-02-25T10:00:00Z",
  updatedAt: "2024-02-25T10:00:00Z"
}
```

## Logic Explanation

### Password Hashing and Authentication

**Registration:**
1. User submits email and password
2. Password is hashed using bcryptjs (10 salt rounds)
3. User object with hashed password is stored in memory
4. JWT token is generated for immediate login

**Login:**
1. User submits email and password
2. User found by email in memory
3. Provided password is compared with hashed password using bcryptjs
4. If match, JWT token is generated
5. Token sent to client for future requests

**Why bcryptjs:**
- Bcryptjs is an implementation of bcrypt algorithm
- Uses salt rounds (10) to make rainbow table attacks infeasible
- Each hash is unique even for same password (due to salt)
- Significantly slows down brute force attacks

### JWT Token Flow

**Token Generation:**
```javascript
const token = jwt.sign(
  { id: user.id, email: user.email, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);
```
- Token contains user information (claims)
- Signed with SECRET key
- Expires in 7 days

**Token Verification:**
```javascript
const decoded = jwt.verify(token, process.env.JWT_SECRET);
// If signature is invalid → throws error
// If expired → throws TokenExpiredError
// If valid → returns decoded payload
```

### Event Management Logic

**Creating Event:**
1. User must be authenticated and have "organizer" role
2. Input validated (title length, date format, etc.)
3. Unique event ID generated using timestamp
4. Event object created with empty participants array
5. Event stored in memory array
6. Response sent with created event

**Registering for Event:**
1. User authenticated
2. Event found by ID
3. Check if user already registered (prevent duplicates)
4. Check if event has available capacity
5. User added to participants array with registration timestamp
6. Confirmation email sent asynchronously
7. User data not blocked waiting for email (non-blocking)

**Cancelling Registration:**
1. User must be the participant or event organizer
2. Participant removed from event's participants array
3. Cancellation email sent asynchronously
4. Event capacity automatically updated

### Email Service Logic

**Non-Blocking Email Sending:**
```javascript
sendEmail(email, subject, text)
  .catch(err => console.error('Email error:', err));
// Request handler continues without waiting
```

**Why Asynchronous:**
- Email sending can be slow (0.5-5 seconds)
- User shouldn't wait for email to send
- Email failure shouldn't block API response
- Errors are logged but don't crash the server

**Email Configuration:**
- Uses Nodemailer SMTP transport
- Supports any SMTP server (Gmail, AWS SES, etc.)
- Credentials from environment variables
- Supports both text and HTML email formats

### Authorization and Access Control

**Role-Based Authorization:**
```javascript
// Only organizers can create events
router.post('/', authenticate, authorize('organizer'), ...)

// Both organizers and attendees can view events
router.get('/', authenticate, ...)
```

**Resource Ownership:**
```javascript
// Organizer can only update/delete own events
if (event.organizerId !== req.user.id) {
  return res.status(403).json({ message: 'Unauthorized' });
}
```

### Data Validation

**Input Validation using express-validator:**
```javascript
[
  body('email').isEmail(),              // Must be valid email
  body('password').isLength({ min: 6 }), // Min 6 characters
  body('date').matches(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD format
]
```

**Validation Results:**
```javascript
const errors = validationResult(req);
if (!errors.isEmpty()) {
  return res.status(400).json({ errors: errors.array() });
}
```

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Specific Test File
```bash
npm test -- src/tests/auth.test.js
```

### Test Output
```
Authentication Routes
  ✓ should register a new user successfully
  ✓ should reject duplicate email registration
  ✓ should login user with correct credentials
  ✓ should reject login with invalid password

4 tests passed
```

### Creating Test Cases

1. Register new users with various data
2. Verify JWT token generation
3. Test authentication middleware
4. Test authorization (role-based access)
5. Test event CRUD operations
6. Test participant registration
7. Test validation errors
8. Test email sending

## Usage Examples

### Example 1: Complete Registration and Event Flow

```bash
# 1. Register as event organizer
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice Johnson",
    "email": "alice@example.com",
    "password": "secure123",
    "role": "organizer"
  }'

# Response includes token: eyJhbGciOiJIUzI1NiIs...
ORGANIZER_TOKEN="eyJhbGciOiJIUzI1NiIs..."

# 2. Create event
curl -X POST http://localhost:3000/events \
  -H "Authorization: Bearer $ORGANIZER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "React Workshop",
    "description": "Learn React fundamentals",
    "date": "2024-03-20",
    "time": "10:00",
    "maxParticipants": 30
  }'

# Response includes event ID: event_1234567890
EVENT_ID="event_1234567890"

# 3. Register as attendee
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Bob Smith",
    "email": "bob@example.com",
    "password": "secure456",
    "role": "attendee"
  }'

# Response includes token: eyJhbGciOiJIUzI1NiIs...
ATTENDEE_TOKEN="eyJhbGciOiJIUzI1NiIs..."

# 4. Attendee registers for event
curl -X POST http://localhost:3000/events/$EVENT_ID/register \
  -H "Authorization: Bearer $ATTENDEE_TOKEN"

# Response confirms registration

# 5. View event participants
curl -X GET http://localhost:3000/events/$EVENT_ID/participants \
  -H "Authorization: Bearer $ORGANIZER_TOKEN"

# Response shows all registered participants
```

### Example 2: Update and Delete Event

```bash
# Update event details
curl -X PUT http://localhost:3000/events/$EVENT_ID \
  -H "Authorization: Bearer $ORGANIZER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Advanced React Workshop",
    "maxParticipants": 40
  }'

# Delete event
curl -X DELETE http://localhost:3000/events/$EVENT_ID \
  -H "Authorization: Bearer $ORGANIZER_TOKEN"
```

### Example 3: View and Cancel Registrations

```bash
# View all my event registrations
curl -X GET http://localhost:3000/events/user/registrations \
  -H "Authorization: Bearer $ATTENDEE_TOKEN"

# Cancel registration for event
curl -X DELETE http://localhost:3000/events/$EVENT_ID/register/user_123 \
  -H "Authorization: Bearer $ATTENDEE_TOKEN"
```

## Running the Server

### Development Mode (with auto-reload)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

### Accessing the API

- **Health Check**: http://localhost:3000/health
- **API Info**: http://localhost:3000/
- **Base URL**: http://localhost:3000

## Error Handling

### Common Error Responses

**400 Bad Request** - Invalid input
```json
{
  "success": false,
  "errors": [
    { "param": "email", "msg": "Please provide a valid email" }
  ]
}
```

**401 Unauthorized** - Missing or invalid token
```json
{
  "success": false,
  "message": "No token provided"
}
```

**403 Forbidden** - Insufficient permissions
```json
{
  "success": false,
  "message": "Only organizer can access this resource"
}
```

**404 Not Found** - Resource doesn't exist
```json
{
  "success": false,
  "message": "Event not found"
}
```

**500 Internal Server Error** - Server error
```json
{
  "success": false,
  "message": "Internal server error"
}
```

## Performance Considerations

1. **In-Memory Storage**: Data lost on server restart (use database for production)
2. **Async Email**: Non-blocking email sending prevents request delays
3. **JWT Tokens**: No database lookups for token validation
4. **Indexing**: Linear search through arrays (acceptable for demo, use database indexes for production)

## Security Best Practices

✅ **Implemented:**
- Bcryptjs password hashing
- JWT token-based authentication
- Input validation and sanitization
- Role-based access control
- Secure headers in HTTP responses

⚠️ **For Production:**
- Use HTTPS/TLS
- Implement rate limiting
- Add CORS configuration
- Use database instead of memory
- Implement request logging
- Use environment-specific configs
- Add API key rotation
- Implement refresh tokens

## Scaling Considerations

For production deployment:

1. **Database Integration**: Replace in-memory storage with MongoDB/PostgreSQL
2. **Session Management**: Implement Redis for session caching
3. **Load Balancing**: Use multiple server instances
4. **Email Queue**: Use message queue (RabbitMQ, SQS) for emails
5. **Caching**: Implement caching for frequently accessed events
6. **Monitoring**: Add APM tools for performance tracking

