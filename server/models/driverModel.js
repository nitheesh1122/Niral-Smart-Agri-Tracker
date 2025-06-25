const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const durationSchema = new mongoose.Schema({
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true }
}, { _id: false });

const workSchema = new mongoose.Schema({
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  workDuration: { type: [durationSchema], required: true },
  salary: { type: Number, required: true },
  isPaid: { type: Boolean, default: false }
}, { _id: false });

const driverSchema = new mongoose.Schema({
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  mobileNo: { type: String, required: true },
  password: { type: String, required: true },
  licenseNo: { type: String, required: true },
  state: { type: String, required: true },
  district: { type: String, required: true },

  // ✅ All past work assignments
  work: {
    type: [workSchema],
    default: []
  },

  // ✅ Flat list of all individual dates the driver worked
  workDates: {
    type: [Date],
    default: []
  }

}, {
  timestamps: true,
  collection: 'Driver'
});

// Hash password before saving
driverSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Hide password when sending JSON
driverSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

const Driver = mongoose.model('Driver', driverSchema);
module.exports = Driver;
