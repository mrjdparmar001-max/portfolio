const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Profile = require('../models/Profile');

// Public — user site fetches this
router.get('/', async (req, res) => {
  let profile = await Profile.findOne();
  if (!profile) profile = await Profile.create({});
  res.json(profile);
});

// Protected — admin updates
router.put('/', auth, async (req, res) => {
  try {
    const {
      email, phone, location, github, linkedin, twitter,
      yearsExperience, expYears, expMonths, expDays,
      happyClients, awardsWon, resume, resumeName, avatar
    } = req.body;

    let profile = await Profile.findOne();
    if (!profile) profile = new Profile();

    if (email           !== undefined) profile.email           = email;
    if (phone           !== undefined) profile.phone           = phone;
    if (location        !== undefined) profile.location        = location;
    if (github          !== undefined) profile.github          = github;
    if (linkedin        !== undefined) profile.linkedin        = linkedin;
    if (twitter         !== undefined) profile.twitter         = twitter;
    if (yearsExperience !== undefined) profile.yearsExperience = yearsExperience;
    if (expYears        !== undefined) profile.expYears        = expYears;
    if (expMonths       !== undefined) profile.expMonths       = expMonths;
    if (expDays         !== undefined) profile.expDays         = expDays;
    if (happyClients    !== undefined) profile.happyClients    = happyClients;
    if (awardsWon       !== undefined) profile.awardsWon       = awardsWon;
    if (resume          !== undefined) profile.resume          = resume;
    if (resumeName      !== undefined) profile.resumeName      = resumeName;
    if (avatar          !== undefined) profile.avatar          = avatar;

    await profile.save();
    res.json(profile);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
