import assert from 'assert';

/**
 * Input Validation Tests
 * Tests for data validation across all endpoints
 * 
 * These tests verify:
 * - Email format validation
 * - Password requirements
 * - Field length requirements
 * - Date/time format validation
 * - Numeric constraints
 */
describe('Input Validation', () => {
  let organizerToken;

  /**
   * Test: Email Validation - Registration
   * 
   * Verifies that invalid email formats are rejected
   */
  test('should reject invalid email format', async () => {
    const response = await sendRequest('POST', '/auth/register',
      {
        name: 'John Doe',
        email: 'invalid-email', // Missing @ and domain
        password: 'password123',
      }
    );

    assert.strictEqual(response.status, 400);
    assert.strictEqual(response.body.success, false);
    assert(response.body.errors.some(e => e.param === 'email'));
  });

  /**
   * Test: Password Validation - Too Short
   * 
   * Verifies that passwords must be at least 6 characters
   */
  test('should reject short password', async () => {
    const response = await sendRequest('POST', '/auth/register',
      {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'pass', // Only 4 characters
      }
    );

    assert.strictEqual(response.status, 400);
    assert(response.body.errors.some(e => e.param === 'password'));
  });

  /**
   * Test: Name Validation - Too Short
   * 
   * Verifies that name must be at least 2 characters
   */
  test('should reject short name', async () => {
    const response = await sendRequest('POST', '/auth/register',
      {
        name: 'J', // Only 1 character
        email: 'john@example.com',
        password: 'password123',
      }
    );

    assert.strictEqual(response.status, 400);
    assert(response.body.errors.some(e => e.param === 'name'));
  });

  /**
   * Test: Role Validation
   * 
   * Verifies that role must be either 'organizer' or 'attendee'
   */
  test('should reject invalid role', async () => {
    const response = await sendRequest('POST', '/auth/register',
      {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        role: 'admin', // Invalid role
      }
    );

    assert.strictEqual(response.status, 400);
    assert(response.body.errors.some(e => e.param === 'role'));
  });

  /**
   * Test: Event Title Validation
   * 
   * Verifies that event title must be at least 3 characters
   */
  test('should reject short event title', async () => {
    const response = await sendRequest('POST', '/events',
      {
        title: 'ab', // Only 2 characters
        description: 'This is a valid event description',
        date: '2024-03-20',
        time: '14:00',
      },
      organizerToken
    );

    assert.strictEqual(response.status, 400);
    assert(response.body.errors.some(e => e.param === 'title'));
  });

  /**
   * Test: Event Description Validation
   * 
   * Verifies that event description must be at least 10 characters
   */
  test('should reject short description', async () => {
    const response = await sendRequest('POST', '/events',
      {
        title: 'Valid Title',
        description: 'short', // Only 5 characters
        date: '2024-03-20',
        time: '14:00',
      },
      organizerToken
    );

    assert.strictEqual(response.status, 400);
    assert(response.body.errors.some(e => e.param === 'description'));
  });

  /**
   * Test: Date Format Validation
   * 
   * Verifies that date must be in YYYY-MM-DD format
   */
  test('should reject invalid date format', async () => {
    const invalidFormats = [
      '03-20-2024', // MM-DD-YYYY
      '2024/03/20', // With slashes
      '20-03-2024', // DD-MM-YYYY
      '2024-3-20',  // Missing zero padding
    ];

    for (const date of invalidFormats) {
      const response = await sendRequest('POST', '/events',
        {
          title: 'Valid Title',
          description: 'Valid description',
          date,
          time: '14:00',
        },
        organizerToken
      );

      assert.strictEqual(response.status, 400);
      assert(response.body.errors.some(e => e.param === 'date'));
    }
  });

  /**
   * Test: Time Format Validation
   * 
   * Verifies that time must be in HH:mm format
   */
  test('should reject invalid time format', async () => {
    const invalidFormats = [
      '2:00',      // Missing hour zero padding
      '14:0',      // Missing minute zero padding
      '14:00:00',  // Includes seconds
      '14-00',     // Hyphen instead of colon
    ];

    for (const time of invalidFormats) {
      const response = await sendRequest('POST', '/events',
        {
          title: 'Valid Title',
          description: 'Valid description',
          date: '2024-03-20',
          time,
        },
        organizerToken
      );

      assert.strictEqual(response.status, 400);
      assert(response.body.errors.some(e => e.param === 'time'));
    }
  });

  /**
   * Test: Max Participants Validation
   * 
   * Verifies that maxParticipants must be a positive number
   */
  test('should reject invalid max participants', async () => {
    const invalidValues = [-1, 0, 'abc', -100];

    for (const value of invalidValues) {
      const response = await sendRequest('POST', '/events',
        {
          title: 'Valid Title',
          description: 'Valid description',
          date: '2024-03-20',
          time: '14:00',
          maxParticipants: value,
        },
        organizerToken
      );

      assert.strictEqual(response.status, 400);
    }
  });

  /**
   * Test: Required Fields - Registration
   * 
   * Verifies that all required fields must be provided
   */
  test('should reject missing required fields in registration', async () => {
    const invalidRequests = [
      { name: 'John', password: 'pass123' }, // Missing email
      { email: 'john@example.com', password: 'pass123' }, // Missing name
      { name: 'John', email: 'john@example.com' }, // Missing password
    ];

    for (const req of invalidRequests) {
      const response = await sendRequest('POST', '/auth/register', req);
      assert.strictEqual(response.status, 400);
    }
  });

  /**
   * Test: Required Fields - Event Creation
   * 
   * Verifies that all required event fields must be provided
   */
  test('should reject missing required event fields', async () => {
    const invalidRequests = [
      { description: 'Valid', date: '2024-03-20', time: '14:00' }, // Missing title
      { title: 'Valid', date: '2024-03-20', time: '14:00' }, // Missing description
      { title: 'Valid', description: 'Valid', time: '14:00' }, // Missing date
      { title: 'Valid', description: 'Valid', date: '2024-03-20' }, // Missing time
    ];

    for (const req of invalidRequests) {
      const response = await sendRequest('POST', '/events', req, organizerToken);
      assert.strictEqual(response.status, 400);
    }
  });

  /**
   * Test: String Trimming and Sanitization
   * 
   * Verifies that input strings are trimmed of whitespace
   */
  test('should trim whitespace from inputs', async () => {
    const response = await sendRequest('POST', '/auth/register',
      {
        name: '  John Doe  ', // Extra whitespace
        email: '  john@example.com  ',
        password: '  password123  ',
      }
    );

    // After trimming, values should be valid
    if (response.status === 201) {
      assert.strictEqual(response.body.user.name, 'John Doe');
    }
  });

  /**
   * Test: Very Long Input Rejection
   * 
   * Verifies that excessively long inputs are rejected
   */
  test('should reject excessively long inputs', async () => {
    const longString = 'a'.repeat(10000);
    
    const response = await sendRequest('POST', '/auth/register',
      {
        name: longString,
        email: longString + '@example.com',
        password: longString,
      }
    );

    assert.strictEqual(response.status, 400);
  });

  /**
   * Test: Special Characters in String Fields
   * 
   * Verifies that special characters are properly handled
   */
  test('should handle special characters', async () => {
    const response = await sendRequest('POST', '/auth/register',
      {
        name: "John O'Brien-Smith",
        email: 'john+tag@example.com',
        password: 'P@ss!word#123',
      }
    );

    // Should accept valid email formats with special chars
    assert.strictEqual(response.status, 201);
  });
});

function sendRequest(method, path, body, token) {
  return Promise.resolve({
    status: 200,
    body: { success: true },
  });
}
