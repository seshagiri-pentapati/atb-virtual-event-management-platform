import nodemailer from 'nodemailer';

/**
 * Email Service
 * Handles sending emails using Nodemailer and SMTP configuration
 * 
 * This service is used for:
 * - Welcome emails on user registration
 * - Event registration confirmation emails
 * - Event cancellation emails
 * 
 * Configuration uses environment variables:
 * - EMAIL_HOST: SMTP server host
 * - EMAIL_PORT: SMTP server port
 * - EMAIL_USER: SMTP authentication username
 * - EMAIL_PASSWORD: SMTP authentication password
 * - EMAIL_FROM: "From" email address for all emails
 */

// Create transporter with SMTP configuration
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_PORT === '465', // Use SSL for port 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

/**
 * Send Email Function
 * 
 * Logic:
 * 1. Create email options object with recipient, subject, and body
 * 2. Use transporter.sendMail (Promise-based async operation)
 * 3. Return Promise that resolves with send status
 * 4. Errors are caught by caller (non-blocking)
 * 
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} text - Email body text
 * @returns {Promise} - Resolves with info if successful, rejects with error
 */
export const sendEmail = async (to, subject, text) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to,
      subject,
      text,
      html: `
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #2c3e50;">${subject}</h1>
              <p style="white-space: pre-wrap;">${text}</p>
              <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
              <p style="font-size: 12px; color: #7f8c8d;">
                This is an automated email from Event Management Platform. Please do not reply to this email.
              </p>
            </div>
          </body>
        </html>
      `,
    };

    // Send email and return response
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.response);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

/**
 * Verify Email Configuration
 * 
 * This function tests the email connection and can be called during server startup
 * to ensure email configuration is correct before the server starts serving requests.
 * 
 * @returns {Promise<void>}
 */
export const verifyEmailConfig = async () => {
  try {
    await transporter.verify();
    console.log('Email configuration verified successfully');
  } catch (error) {
    console.error('Email configuration error:', error.message);
    console.warn('Warning: Email service may not work properly. Check your EMAIL_* environment variables.');
  }
};
