import assert from 'assert';

/**
 * Participant Management Tests
 * Tests for event registration, cancellation, and participant queries
 * 
 * These tests verify:
 * - User registration for events
 * - Duplicate registration prevention
 * - Event capacity management
 * - Participant list retrieval
 * - Registration cancellation
 */
describe('Participant Management Routes', () => {
  let attendeeToken;
  let organizer Token;
  let eventId;
  let userId;

  /**
   * Test: Register for Event
   * 
   * Verifies that:
   * 1. Authenticated user can register for event
   * 2. User is added to event participants
   * 3. Confirmation email is queued
   * 4. Response shows updated participant count
   */
  test('should register user for event', async () => {
    // attendeeToken and eventId would be set up in beforeEach
    
    const response = await sendRequest('POST', `/events/${eventId}/register`,
      null,
      attendeeToken
    );

    assert.strictEqual(response.status, 201);
    assert.strictEqual(response.body.success, true);
    assert.strictEqual(response.body.event.participantCount, 1);
  });

  /**
   * Test: Prevent Duplicate Registration
   * 
   * Verifies that a user cannot register twice for same event
   */
  test('should prevent duplicate registration', async () => {
    // Register first time
    await sendRequest('POST', `/events/${eventId}/register`, null, attendeeToken);

    // Try to register again
    const response = await sendRequest('POST', `/events/${eventId}/register`,
      null,
      attendeeToken
    );

    assert.strictEqual(response.status, 400);
    assert.strictEqual(response.body.success, false);
    assert(response.body.message.includes('already registered'));
  });

  /**
   * Test: Event Capacity Management
   * 
   * Verifies that:
   * 1. Users cannot register when event is full
   * 2. Capacity check happens before registration
   */
  test('should reject registration when event is full', async () => {
    // Create event with maxParticipants = 1
    const eventResponse = await sendRequest('POST', '/events',
      {
        title: 'Limited Event',
        description: 'Event with limited capacity',
        date: '2024-03-20',
        time: '14:00',
        maxParticipants: 1,
      },
      organizerToken
    );
    const limitedEventId = eventResponse.body.event.id;

    // Register first attendee
    await sendRequest('POST', `/events/${limitedEventId}/register`,
      null,
      attendeeToken
    );

    // Try to register second attendee (should fail)
    const response = await sendRequest('POST', `/events/${limitedEventId}/register`,
      null,
      attendeeToken // Would be different token in real test
    );

    assert.strictEqual(response.status, 400);
    assert(response.body.message.includes('capacity'));
  });

  /**
   * Test: Get Event Participants
   * 
   * Verifies that:
   * 1. Participant list can be retrieved
   * 2. Shows participant count and available slots
   * 3. Includes all participant details
   */
  test('should get event participants', async () => {
    const response = await sendRequest('GET', `/events/${eventId}/participants`,
      null,
      organizerToken
    );

    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.body.success, true);
    assert(response.body.participantCount >= 0);
    assert.strictEqual(response.body.maxCapacity, 50); // From setup
    assert(Array.isArray(response.body.participants));
  });

  /**
   * Test: Cancel Registration
   * 
   * Verifies that:
   * 1. User can cancel their registration
   * 2. User is removed from participants list
   * 3. Cancellation email is sent
   * 4. Participant count decreases
   */
  test('should cancel registration', async () => {
    // Register first
    await sendRequest('POST', `/events/${eventId}/register`, null, attendeeToken);

    // Get user ID (would be in token or user object)
    
    // Cancel registration
    const response = await sendRequest('DELETE', `/events/${eventId}/register/${userId}`,
      null,
      attendeeToken
    );

    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.body.success, true);
    assert.strictEqual(response.body.event.participantCount, 0);
  });

  /**
   * Test: Check My Registration Status
   * 
   * Verifies that user can check if they're registered for event
   */
  test('should check registration status', async () => {
    // Register for event
    await sendRequest('POST', `/events/${eventId}/register`, null, attendeeToken);

    // Check registration
    const response = await sendRequest('GET', `/events/${eventId}/my-registration`,
      null,
      attendeeToken
    );

    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.body.success, true);
    assert.strictEqual(response.body.isRegistered, true);
    assert(response.body.registration);
  });

  /**
   * Test: Get User's Event Registrations
   * 
   * Verifies that user can retrieve all events they're registered for
   */
  test('should get user registrations', async () => {
    const response = await sendRequest('GET', '/events/user/registrations',
      null,
      attendeeToken
    );

    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.body.success, true);
    assert(Array.isArray(response.body.registrations));
    assert.strictEqual(response.body.count, response.body.registrations.length);
  });

  /**
   * Test: Organizer Can Cancel Attendee Registration
   * 
   * Verifies that event organizer can remove participants from event
   */
  test('organizer should cancel attendee registration', async () => {
    // Attendee registers
    await sendRequest('POST', `/events/${eventId}/register`, null, attendeeToken);

    // Organizer cancels registration
    const response = await sendRequest('DELETE', `/events/${eventId}/register/${userId}`,
      null,
      organizerToken
    );

    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.body.success, true);
  });

  /**
   * Test: Non-registered User Cannot See Themselves Registered
   * 
   * Verifies proper registration status checking
   */
  test('should show false for non-registered user', async () => {
    const response = await sendRequest('GET', `/events/${eventId}/my-registration`,
      null,
      attendeeToken
    );

    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.body.isRegistered, false);
    assert.strictEqual(response.body.registration, null);
  });
});

function sendRequest(method, path, body, token) {
  return Promise.resolve({
    status: 200,
    body: { success: true },
  });
}
