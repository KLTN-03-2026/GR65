const nodemailer = require('nodemailer');

/**
 * Send email utility
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} text - Plain text content
 * @param {string} html - HTML content (optional)
 */
const sendEmail = async (to, subject, text, html) => {
  try {
    // Create transporter using environment variables or fallback to a mock/test account
    // For production, use a real SMTP service like Gmail, SendGrid, Mailtrap, etc.
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: process.env.EMAIL_PORT || 587,
      secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER, // Your email
        pass: process.env.EMAIL_PASS, // Your email password or app password
      },
    });

    const info = await transporter.sendMail({
      from: `"AI Recruitment System" <${process.env.EMAIL_USER || 'noreply@airecruit.com'}>`,
      to,
      subject,
      text,
      html: html || text,
    });

    console.log('Message sent: %s', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    // If not configured, we log it and return false instead of crashing
    return { success: false, error: error.message };
  }
};

module.exports = { sendEmail };
