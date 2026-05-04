# Swagger API Endpoints Reference

This document provides a complete guide to all API endpoints available in the Virtual Event Management Platform, including their Swagger documentation.

## Overview

All API endpoints are fully documented in Swagger/OpenAPI 3.0 format. You can interact with all endpoints through the Swagger UI at **http://localhost:3000/api-docs**.

## Table of Contents
- [Authentication Endpoints](#authentication-endpoints)
- [Event Management Endpoints](#event-management-endpoints)
- [Participant Management Endpoints](#participant-management-endpoints)
- [Using Swagger UI](#using-swagger-ui)
- [Swagger Specification](#swagger-specification)

---

## Authentication Endpoints

### POST /auth/register

**Summary**: Register a new user account

**Description**: Create a new user account with email, password, and optional role selection. Welcome email is sent asynchronously.

**Swagger Documentation**: [View in Swagger UI](http://localhost:3000/api-docs#/Authentication/post_auth_register)

**Request Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePass123",
  "role": "organizer"
}
```

**Response (201)**:
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_1234567890",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "organizer"
  }
}
```

**Validation Rules**:
- name: minimum 2 characters
- email: valid email format
- password: minimum 6 characters
- role: must be "organizer" or "attendee" (defaults to "attendee")

**Error Responses**:
- 400: Email already registered or validation error
- 500: Server error

**Logic Breakdown**:
1. Validates all input fields using express-validator
2. Checks if email already exists in the users array
3. Hashes password with bcryptjs (10 salt rounds)
4. Creates new user object with unique ID based on timestamp
5. Stores user in in-memory array
6. Generates JWT token with 7-day expiration
7. Sends welcome email asynchronously (non-blocking)
8. Returns token and user data

---

### POST /auth/login

**Summary**: Authenticate user and get JWT token

**Description**: Login with email and password to receive a JWT token for authenticated requests. Token expires in 7 days.

**Swagger Documentation**: [View in Swagger UI](http://localhost:3000/api-docs#/Authentication/post_auth_login)

**Request Body**:
```json
{
  "email": "john@example.com",
  "password": "securePass123"
}
```

**Response (200)**:
```json
{
  "success": true,
  "message": "Logged in successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_1234567890",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "organizer"
  }
}
```

**Error Responses**:
- 400: Validation error (missing email or password)
- 401: Invalid email or password combination
- 500: Server error

**Logic Breakdown**:
1. Validates email and password fields
2. Searches users array for email match
3. Returns 401 if user not found
4. Uses bcryptjs.compare() to verify password securely
5. Returns 401 if password doesn't match
6. Generates new JWT token upon successful authentication
7. Returns token with user information

---

## Event Management Endpoints

### GET /events

**Summary**: Retrieve all events

**Description**: Get a list of all events in the system. Optionally filter by organizer ID.

**Swagger Documentation**: [View in Swagger UI](http://localhost:3000/api-docs#/Events/get_events)

**Authentication**: Required (Bearer JWT token)

**Query Parameters**:
- `organizer` (optional): Filter events by organizer ID

**Example**:
```http
GET /events?organizer=user_1234567890
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200)**:
```json
{
  "success": true,
  "count": 2,
  "events": [
    {
      "id": "event_1234567890",
      "title": "Annual Tech Conference",
      "description": "A comprehensive tech conference covering latest trends",
      "date": "2024-06-15",
      "time": "10:00",
      "maxParticipants": 500,
      "organizerId": "user_1234567890",
      "organizerName": "John Doe",
      "participants": [...],
      "participantCount": 45,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

**Logic Breakdown**:
1. Authenticates user via JWT middleware
2. Retrieves all events from in-memory array
3. Filters by organizer ID if query parameter provided
4. Maps events to include participant count
5. Returns filtered list with counts

---

### POST /events

**Summary**: Create a new event

**Description**: Create a new event. Only users with "organizer" role can create events. Requires JWT authentication.

**Swagger Documentation**: [View in Swagger UI](http://localhost:3000/api-docs#/Events/post_events)

**Authentication**: Required (Bearer JWT token, organizer role only)

**Request Body**:
```json
{
  "title": "Annual Tech Conference",
  "description": "A comprehensive tech conference covering latest trends",
  "date": "2024-06-15",
  "time": "10:00",
  "maxParticipants": 500
}
```

**Response (201)**:
```json
{
  "success": true,
  "message": "Event created successfully",
  "event": {
    "id": "event_1234567890",
    "title": "Annual Tech Conference",
    "description": "A comprehensive tech conference covering latest trends",
    "date": "2024-06-15",
    "time": "10:00",
    "maxParticipants": 500,
    "organizerId": "user_1234567890",
    "organizerName": "John Doe",
    "participants": [],
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

**Validation Rules**:
- title: minimum 3 characters
- description: minimum 10 characters
- date: YYYY-MM-DD format
- time: HH:mm format (24-hour)
- maxParticipants: positive integer (defaults to 100)

**Error Responses**:
- 400: Validation error
- 401: Unauthorized (missing or invalid token)
- 403: Forbidden (user is not an organizer)
- 500: Server error

**Logic Breakdown**:
1. Authenticates user and checks organizer role via middleware
2. Validates all input fields
3. Creates event object with unique ID based on timestamp
4. Sets organizerId and organizerName from authenticated user
5. Initializes empty participants array
6. Stores event in in-memory array
7. Returns created event with 201 status

---

### GET /events/{id}

**Summary**: Get event by ID

**Description**: Retrieve detailed information about a specific event including all participants.

**Swagger Documentation**: [View in Swagger UI](http://localhost:3000/api-docs#/Events/get_events__id_)

**Authentication**: Required (Bearer JWT token)

**Path Parameters**:
- `id`: Event ID (string)

**Example**:
```http
GET /events/event_1234567890
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200)**:
```json
{
  "success": true,
  "event": {
    "id": "event_1234567890",
    "title": "Annual Tech Conference",
    "date": "2024-06-15",
    "time": "10:00",
    "maxParticipants": 500,
    "participants": [
      {
        "userId": "user_9876543210",
        "email": "attendee@example.com",
        "registeredAt": "2024-01-10T14:20:00Z"
      }
    ],
    "participantCount": 1
  }
}
```

**Error Responses**:
- 400: Validation error
- 401: Unauthorized (missing or invalid token)
- 404: Event not found
- 500: Server error

---

### PUT /events/{id}

**Summary**: Update an event

**Description**: Update event details. Only the event organizer can update an event.

**Swagger Documentation**: [View in Swagger UI](http://localhost:3000/api-docs#/Events/put_events__id_)

**Authentication**: Required (Bearer JWT token, must be event organizer)

**Path Parameters**:
- `id`: Event ID (string)

**Request Body** (all fields optional):
```json
{
  "title": "Updated Conference Title",
  "description": "Updated description",
  "date": "2024-06-20",
  "time": "14:00",
  "maxParticipants": 600
}
```

**Response (200)**:
```json
{
  "success": true,
  "message": "Event updated successfully",
  "event": {
    "id": "event_1234567890",
    "title": "Updated Conference Title",
    ...
  }
}
```

**Error Responses**:
- 401: Unauthorized
- 403: Forbidden (not event organizer)
- 404: Event not found
- 500: Server error

**Logic Breakdown**:
1. Authenticates user and verifies organizer role
2. Finds event by ID in array
3. Verifies current user is event organizer
4. Updates only provided fields
5. Updates timestamp
6. Returns updated event

---

### DELETE /events/{id}

**Summary**: Delete an event

**Description**: Delete an event permanently. Only the event organizer can delete an event.

**Swagger Documentation**: [View in Swagger UI](http://localhost:3000/api-docs#/Events/delete_events__id_)

**Authentication**: Required (Bearer JWT token, must be event organizer)

**Path Parameters**:
- `id`: Event ID (string)

**Response (200)**:
```json
{
  "success": true,
  "message": "Event deleted successfully"
}
```

**Error Responses**:
- 401: Unauthorized
- 403: Forbidden (not event organizer)
- 404: Event not found
- 500: Server error

---

## Participant Management Endpoints

### POST /events/{id}/register

**Summary**: Register user for an event

**Description**: Register the authenticated user for a specific event. Users can only register once per event. Registration confirmation email is sent asynchronously.

**Swagger Documentation**: [View in Swagger UI](http://localhost:3000/api-docs#/Participants/post_events__id__register)

**Authentication**: Required (Bearer JWT token)

**Path Parameters**:
- `id`: Event ID (string)

**Response (201)**:
```json
{
  "success": true,
  "message": "Successfully registered for event",
  "event": {
    "id": "event_1234567890",
    "title": "Annual Tech Conference",
    "participants": [
      {
        "userId": "user_1234567890",
        "email": "user@example.com",
        "registeredAt": "2024-01-20T15:45:00Z"
      }
    ],
    "participantCount": 1
  }
}
```

**Error Responses**:
- 400: Event at capacity, already registered, or validation error
- 401: Unauthorized (invalid token)
- 404: Event not found
- 500: Server error

**Logic Breakdown**:
1. Authenticates user via JWT
2. Finds event by ID
3. Checks if event has available capacity
4. Checks if user already registered (prevents duplicates)
5. Creates participant object with userId and timestamp
6. Adds to event's participants array
7. Sends confirmation email asynchronously
8. Returns updated event with participant count

---

### GET /events/{id}/participants

**Summary**: Get all participants for an event

**Description**: Retrieve a list of all participants registered for a specific event, including registration details.

**Swagger Documentation**: [View in Swagger UI](http://localhost:3000/api-docs#/Participants/get_events__id__participants)

**Authentication**: Required (Bearer JWT token)

**Path Parameters**:
- `id`: Event ID (string)

**Response (200)**:
```json
{
  "success": true,
  "eventId": "event_1234567890",
  "eventTitle": "Annual Tech Conference",
  "participantCount": 45,
  "maxCapacity": 500,
  "availableSlots": 455,
  "participants": [
    {
      "userId": "user_9876543210",
      "email": "attendee@example.com",
      "registeredAt": "2024-01-10T14:20:00Z"
    }
  ]
}
```

**Error Responses**:
- 401: Unauthorized
- 404: Event not found
- 500: Server error

---

### DELETE /events/{eventId}/register/{userId}

**Summary**: Cancel event registration

**Description**: Cancel a user's registration for an event. Can be done by the registered user or event organizer.

**Swagger Documentation**: [View in Swagger UI](http://localhost:3000/api-docs#/Participants/delete_events__eventId__register__userId_)

**Authentication**: Required (Bearer JWT token)

**Path Parameters**:
- `eventId`: Event ID (string)
- `userId`: User ID to unregister (string)

**Response (200)**:
```json
{
  "success": true,
  "message": "Registration cancelled successfully"
}
```

**Error Responses**:
- 401: Unauthorized (invalid token)
- 403: Forbidden (cannot cancel another user's registration)
- 404: Event not found or participant not found
- 500: Server error

**Logic Breakdown**:
1. Authenticates user
2. Finds event by eventId
3. Verifies user is either the participant or event organizer
4. Finds participant in event's participants array
5. Removes participant from array
6. Sends cancellation email asynchronously
7. Returns success message

---

## Using Swagger UI

### 1. Accessing Swagger UI

Navigate to: **http://localhost:3000/api-docs**

The Swagger UI provides an interactive interface for all API endpoints.

### 2. Adding Authorization Token

To test protected endpoints:
1. Click the **"Authorize"** button at the top
2. Paste your JWT token in the format: `eyJhbGciOiJIUzI1NiIs...`
3. Click **"Authorize"**
4. The token is automatically included in all subsequent requests

### 3. Testing Endpoints

For each endpoint:
1. Click to expand the endpoint
2. Click **"Try it out"**
3. Fill in required parameters
4. Click **"Execute"**
5. View the response and status code

### 4. Schema Information

In the "Models" section at the bottom:
- View complete request/response schemas
- See all available fields and data types
- Check required vs optional fields
- Find validation rules

---

## Swagger Specification

### Files

- **Configuration**: `src/config/swagger.js`
  - API metadata and info
  - Security schemes
  - Global component schemas
  - Server URLs

- **Route Documentation**: JSDoc comments in route files
  - Individual endpoint documentation
  - Request/response examples
  - Parameter descriptions

### Accessing Specification

**Raw JSON**: http://localhost:3000/swagger.json

You can import this URL into:
- Postman: Collection → Import → Paste URL
- Insomnia: Create request → Paste Swagger URL
- IDE Extensions: Install REST Client extension
- API Documentation generators

### Specification Details

The OpenAPI 3.0 specification includes:
- Complete API information
- All endpoints with descriptions
- Request and response schemas
- Authentication requirements
- Error codes and meanings
- Example requests and responses

### Component Schemas

Reusable schema definitions:
- **User**: User object structure
- **Event**: Event object structure
- **AuthRequest**: Login/register payload
- **AuthResponse**: Authentication response
- **ErrorResponse**: Error message format

---

## Common Use Cases with Swagger

### 1. Test User Registration

1. Go to Swagger UI
2. Expand "POST /auth/register"
3. Click "Try it out"
4. Enter user details
5. Click "Execute"
6. Copy the returned JWT token

### 2. Create Event (Organizer Only)

1. Authorize with JWT token (see above)
2. Expand "POST /events"
3. Click "Try it out"
4. Enter event details
5. Click "Execute"
6. Copy the event ID from response

### 3. Register for Event (Attendee)

1. Authorize with JWT token
2. Expand "POST /events/{id}/register"
3. Click "Try it out"
4. Enter the event ID
5. Click "Execute"
6. Check confirmation email

### 4. Check Registration Status

1. Authorize with JWT token
2. Expand "GET /events/{id}/participants"
3. Click "Try it out"
4. Enter event ID
5. Click "Execute"
6. View all registered participants

---

## Error Handling in Swagger

All error responses follow a consistent format:

```json
{
  "success": false,
  "message": "Description of what went wrong"
}
```

Common error codes:
- **400**: Bad Request - Validation failed or invalid data
- **401**: Unauthorized - Missing or invalid JWT token
- **403**: Forbidden - Insufficient permissions
- **404**: Not Found - Resource doesn't exist
- **500**: Internal Server Error - Server-side issue

---

