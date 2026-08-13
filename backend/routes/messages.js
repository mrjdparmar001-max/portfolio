const express = require('express');
const Message = require('../models/Message');
const auth = require('../middleware/auth');
const { sendMail } = require('../utils/mailer');

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const msg = new Message(req.body);
    await msg.save();
    res.status(201).json({ message: 'Message sent successfully!' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: -1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id/read', auth, async (req, res) => {
  try {
    const msg = await Message.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );

    res.json(msg);

  } catch (err) {
    res.status(400).json({
      message: err.message
    });
  }
});

router.put('/:id/reply', auth, async (req, res) => {
  try {
    const msg = await Message.findById(req.params.id);
    console.log("=================================");
console.log("REPLY ROUTE HIT");
console.log("MESSAGE ID:", req.params.id);
console.log("EMAIL:", msg?.email);
console.log("REPLY:", req.body.reply);

    if (!msg) {
      return res.status(404).json({
        success: false,
        message: 'Message not found',
      });
    }

    // Save reply
    msg.adminReply = req.body.reply;
    msg.replied = true;
    msg.read = true;

    await msg.save();

    // Try sending email
    try {
  console.log("=================================");
  console.log("SENDING EMAIL TO:", msg.email);
  console.log("REPLY TEXT:", req.body.reply);

  const info = await sendMail({
    to: msg.email,
    subject: `Reply: ${msg.subject || "Your Message"}`,
    html: `
      <h2>Hello ${msg.name}</h2>
      <p>${req.body.reply}</p>

      <br/>

      <p>Regards,</p>
      <b>Jaydip Parmar</b>
    `,
  });

  console.log("EMAIL SENT SUCCESS");
  console.log("MESSAGE ID:", info.messageId);
  console.log("RESPONSE:", info.response);

} catch (mailError) {
  console.error("EMAIL ERROR:");
  console.error(mailError);
}

    return res.status(200).json({
      success: true,
      message: "Reply saved successfully",
      data: msg,
    });

  } catch (err) {
    console.error("REPLY ERROR:", err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}); 
router.delete('/:id', auth, async (req, res) => {
  try {
    await Message.findByIdAndDelete(req.params.id);
    res.json({ message: 'Message deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;