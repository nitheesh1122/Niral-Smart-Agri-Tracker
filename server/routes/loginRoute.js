const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken'); // Added here ✅

const Customer = require('../models/customerModel');
const Vendor = require('../models/vendorModel');
const Driver = require('../models/driverModel');

// POST /api/login
router.post('/login', async (req, res) => {
  const { username, password, role } = req.body;

  if (!username || !password || !role) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    let Model;
    if (role === 'Customer') Model = Customer;
    else if (role === 'Vendor') Model = Vendor;
    else if (role === 'Driver') Model = Driver;
    else return res.status(400).json({ message: 'Invalid role' });

    console.log('Login request received:', { username, password, role });

    const user = await Model.findOne({ username: username });

    console.log("User found::", username); 

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // bcrypt compare
    console.log('Entered password:', password);
    console.log('Stored hash:', user.password);

    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('Is password valid?', isPasswordValid);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Incorrect password' });
    }

    // 🔥 Create JWT Token
    const token = jwt.sign(
      { id: user._id, username: user.username, role: role }, // Payload
      process.env.JWT_SECRET || 'your_secret_key',            // Secret (env first, fallback second)
      { expiresIn: '7d' }                                      // Token expiry
    );

    // 🔥 Send token + user data
    res.status(200).json({ success: true, message: 'Login successful', user, token });
    
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
