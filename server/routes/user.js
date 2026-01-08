const express = require('express');
const router = express.Router();
const Vendor = require('../models/vendorModel');
const Customer = require('../models/customerModel');
const Driver = require('../models/driverModel');
router.post('/token', async (req, res) => {
  const { userId, pushToken } = req.body;

  if (!userId || !pushToken) {
    return res.status(400).json({ error: 'Missing userId or pushToken' });
  }

  try {
    // Try to find the user in all three collections
    let user = await Vendor.findById(userId);
    if (!user) user = await Customer.findById(userId);
    if (!user) user = await Driver.findById(userId);

    if (!user) return res.status(404).json({ error: 'User not found' });

    user.expoPushToken = pushToken;
    await user.save();

    res.json({ success: true, message: 'Push token saved successfully' });
  } catch (err) {
    console.error('Error saving push token:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;