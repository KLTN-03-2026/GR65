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
    // Kiểm tra cấu hình SMTP trước khi gửi
    if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
      console.error('sendEmail: SMTP_EMAIL hoặc SMTP_PASSWORD chưa được cấu hình trong .env');
      return { success: false, error: 'SMTP chưa được cấu hình.' };
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    const info = await transporter.sendMail({
      from: `"AI Recruitment System" <${process.env.SMTP_EMAIL}>`,
      to,
      subject,
      text,
      html: html || text,
    });

    console.log('✅ Email sent to %s — messageId: %s', to, info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending email to', to, ':', error.message);
    return { success: false, error: error.message };
  }
};

module.exports = { sendEmail };
