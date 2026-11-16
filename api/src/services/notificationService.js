const sgMail = require('@sendgrid/mail');
const Africastalking = require('africastalking');

const sendGridKey = process.env.SENDGRID_API_KEY;
if (sendGridKey) {
  sgMail.setApiKey(sendGridKey);
}

const atOptions = {
  username: process.env.AFRICASTALKING_USERNAME,
  apiKey: process.env.AFRICASTALKING_API_KEY,
};
const africasTalking = Africastalking(atOptions);
const sms = africasTalking.SMS;

const sendEmail = async ({ to, subject, text, html }) => {
  if (!sendGridKey) {
    console.log('SendGrid not configured. Email skipped:', subject);
    return { skipped: true };
  }
  const msg = {
    to,
    from: process.env.FROM_EMAIL || 'noreply@ndangira.com',
    subject,
    text,
    html,
  };
  return await sgMail.send(msg);
};

const sendSMS = async ({ to, message }) => {
  if (!process.env.AFRICASTALKING_API_KEY) {
    console.log('Africa\'s Talking not configured. SMS skipped:', message);
    return { skipped: true };
  }
  try {
    const response = await sms.send({
      to: Array.isArray(to) ? to : [to],
      message,
      from: process.env.AFRICASTALKING_SENDER_ID || 'NDANGIRA',
    });
    return response;
  } catch (error) {
    console.error('SMS error:', error.message);
    throw error;
  }
};

module.exports = { sendEmail, sendSMS };
