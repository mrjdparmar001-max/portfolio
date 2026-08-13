require('dotenv').config();
const {
  getEmailConfig,
  isEmailConfigured,
  verifyEmailConnection,
  sendMail,
} = require('./utils/mailer');

async function main() {
  const { user } = getEmailConfig();

  if (!isEmailConfigured()) {
    console.error('Email is not configured. Set EMAIL_USER and a real EMAIL_PASS in backend/.env');
    console.error('Generate an App Password at https://myaccount.google.com/apppasswords');
    process.exit(1);
  }

  const ready = await verifyEmailConnection();
  if (!ready) {
    process.exit(1);
  }

  const info = await sendMail({
    to: user,
    subject: 'Portfolio Email Test',
    text: 'Email sending is working!',
  });

  console.log('Email sent:', info.messageId);
}

main().catch((err) => {
  console.error('Test failed:', err.message);
  process.exit(1);
});
