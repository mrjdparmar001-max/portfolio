const nodemailer = require('nodemailer');

const PLACEHOLDER_PASSWORDS = new Set([
  'abcdefghijklmnop',
  'your_app_password_here',
]);

function getEmailConfig() {
  return {
    user: (process.env.EMAIL_USER || '').trim(),
    pass: (process.env.EMAIL_PASS || '').trim(),
  };
}

function isEmailConfigured() {
  const { user, pass } = getEmailConfig();
  return Boolean(user && pass && !PLACEHOLDER_PASSWORDS.has(pass));
}

let transporter = null;

function getTransporter() {
  if (!isEmailConfigured()) {
    return null;
  }

  if (!transporter) {
    const { user, pass } = getEmailConfig();
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
    });
  }

  return transporter;
}

async function verifyEmailConnection() {
  if (!isEmailConfigured()) {
    console.warn('Email disabled: set a real Gmail App Password in EMAIL_PASS.');
    console.warn('Generate one at https://myaccount.google.com/apppasswords');
    return false;
  }

  try {
    await getTransporter().verify();
    console.log('Mail server ready');
    return true;
  } catch (err) {
    console.warn('Mail login failed:', err.message);
    console.warn('Update EMAIL_PASS with a valid Gmail App Password, then restart.');
    transporter = null;
    return false;
  }
}

async function sendMail(options) {
  const transport = getTransporter();
  if (!transport) {
    throw new Error('Email is not configured');
  }

  const { user } = getEmailConfig();
  return transport.sendMail({
    from: `"Jaydip Parmar" <${user}>`,
    ...options,
  });
}

module.exports = {
  getEmailConfig,
  isEmailConfigured,
  verifyEmailConnection,
  sendMail,
};
