const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const vendorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  mobileNo: { type: String, required: true },
  password: { type: String, required: true },
  businessName: { type: String, required: true },
  state: { type: String, required: true },
  district: { type: String, required: true },

  // Existing field: array of Driver ObjectIds
  drivers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Driver', default: [] }],

  // 🔹 New field: array of Vehicle ObjectIds
  vehicles: [{ type: Number, ref: 'Vehicle', default: [] }],

  // Push notification token
  expoPushToken: { type: String, default: null }

}, {
  timestamps: true,
  collection: 'Vendor'
});

// Database indexes for faster queries
vendorSchema.index({ username: 1 });
vendorSchema.index({ email: 1 });

// Hash password before saving
vendorSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

const Vendor = mongoose.model('Vendor', vendorSchema);
module.exports = Vendor;
