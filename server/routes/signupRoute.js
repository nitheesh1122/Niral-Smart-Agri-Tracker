const express = require('express');
const bcrypt = require('bcryptjs');
const Vendor = require('../models/vendorModel');
const Customer = require('../models/customerModel');
const Driver = require('../models/driverModel');

const router = express.Router();

router.post('/signup', async (req, res) => {
  console.log('Received signup request:', req.body);
  const {
    role,
    name,
    username,
    email,
    mobile,
    password,
    businessName,
    licenseNo,
    state,
    district
  } = req.body;

  try {
    const hashedPassword = password;

    if (role === 'Vendor') {
      const newVendor = new Vendor({
        name,
        username,
        email,
        mobileNo: mobile,
        password: hashedPassword,
        businessName,
        state,
        district
      });
      await newVendor.save();
      return res.status(201).json({ message: 'Vendor registered successfully' });

    } else if (role === 'Customer') {
      const newCustomer = new Customer({
        name,
        username,
        email,
        mobileNo: mobile,
        password: hashedPassword,
        state,
        district
      });
      await newCustomer.save();
      return res.status(201).json({ message: 'Customer registered successfully' });

    } else if (role === 'Driver') {
      const newDriver = new Driver({
        name,
        username,
        email,
        mobileNo: mobile,
        password: hashedPassword,
        licenseNo,
        state,
        district
      });
      await newDriver.save();
      return res.status(201).json({ message: 'Driver registered successfully' });

    } else {
      return res.status(400).json({ message: 'Invalid role selected' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Error registering user', error: err });
  }
});

module.exports = router;