const express = require('express');
const router = express.Router();
const pusher = require('../utils/pusher');
const Message = require('../models/Message');
const Vendor = require('../models/vendorModel');
const Customer = require('../models/customerModel');
const Driver = require('../models/driverModel'); // Assuming you have a Driver model

/**
 * Send push notification via Expo Push API
 */
async function sendPushNotification(expoPushToken, { title, body }) {
  if (!expoPushToken || !expoPushToken.startsWith('ExponentPushToken')) {
    return; // Skip invalid tokens
  }

  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: expoPushToken,
        sound: 'default',
        title,
        body,
      }),
    });
    const data = await response.json();
    console.log('Push notification sent:', data);
  } catch (err) {
    console.error('Push notification error:', err);
    // Don't throw - push notification failure shouldn't break the chat
  }
}

router.post('/pusher/auth', (req, res) => {
  const { socket_id, channel_name } = req.body;
  const userId = req.headers['x-user-id'];

  if (!channel_name.includes(userId)) {
    return res.status(403).send('Unauthorized');
  }

  const auth = pusher.authenticate(socket_id, channel_name);
  res.send(auth);
});

/* ---------------------------------------------------------
 * POST /chat/send
 *  – vendor ↔ customer   → body must contain customerId
 *  – vendor ↔ driver     → body must contain driverId
 * -------------------------------------------------------- */
router.post('/send', async (req, res) => {
  const { vendorId, customerId, driverId, content } = req.body;
  const senderId = req.headers['x-user-id'];

  // Validate
  if (!vendorId || !content || (!customerId && !driverId)) {
    return res.status(400).json({
      error: 'vendorId, content, and a targetId are required',
    });
  }

  try {
    /* 1️⃣ Save the message */
    const msg = await Message.create({
      vendorId,
      customerId: customerId || undefined,
      driverId: driverId || undefined,
      content,
      senderId,
    });

    /* 2️⃣ Real-time update via Pusher */
    const targetId = customerId || driverId;
    const channel = `private-chat-${vendorId}-${targetId}`;
    pusher.trigger(channel, 'new-message', msg);

    /* 3️⃣ Push notification */
    const TargetModel = customerId ? Customer : Driver;
    const targetUser = await TargetModel.findById(targetId).select('expoPushToken');

    if (targetUser?.expoPushToken) {
      await sendPushNotification(targetUser.expoPushToken, {
        title: 'New Message',
        body: content,
      });
    }

    res.status(201).json(msg);
  } catch (err) {
    console.error('Message save error:', err);
    res.status(500).json({ error: 'Could not send message' });
  }
});

/* ---------------------------------------------------------
 * GET /chat/history
 *  – expects vendorId, targetId, chatType = 'customer' | 'driver'
 * -------------------------------------------------------- */
router.get('/history', async (req, res) => {
  const { vendorId, targetId, chatType } = req.query;

  if (!vendorId || !targetId || !chatType) {
    return res.status(400).json({ error: 'vendorId, targetId, chatType are required' });
  }

  const filter = { vendorId };
  if (chatType === 'customer') filter.customerId = targetId;
  if (chatType === 'driver') filter.driverId = targetId;

  try {
    const history = await Message.find(filter).sort({ createdAt: 1 });
    res.json(history);
  } catch (err) {
    console.error('Chat history fetch error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/vendors/get', async (req, res) => {
  try {
    const { q } = req.query;

    // Match all vendors or filter by name
    const filter = q
      ? { name: { $regex: new RegExp(q, 'i') } }   // i = case-insensitive
      : {};

    // Return only the fields you need in the list
    const vendors = await Vendor.find(filter)
      .select('name businessName _id')              // choose fields
      .sort({ name: 1 });

    res.json(vendors);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});


// GET all customers for vendor chat list
router.get('/customers/get', async (req, res) => {
  try {
    const customers = await Customer.find({}, '_id name mobileNo').sort({ createdAt: -1 });
    res.json(customers);
  } catch (err) {
    console.error('Error fetching customers:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/vendor-drivers', async (req, res) => {
  const { vendorId } = req.query;
  if (!vendorId) {
    return res.status(400).json({ error: 'vendorId is required' });
  }

  try {
    const vendor = await Vendor.findById(vendorId).populate({
      path: 'drivers',
      select: '_id name mobileNo', // limit fields
    });

    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    res.json(vendor.drivers);
  } catch (err) {
    console.error('Error fetching vendor drivers:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/vendors/by-driver', async (req, res) => {
  const { driverId } = req.query;

  if (!driverId) {
    return res.status(400).json({ error: 'driverId is required' });
  }

  try {
    const vendors = await Vendor.find({ drivers: driverId })
      .select('_id name businessName mobileNo');

    res.json(vendors);
  } catch (err) {
    console.error('Error fetching vendors for driver:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


module.exports = router;
