const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  mobileNo: { type: String, required: true },
  password: { type: String, required: true },
  state: { type: String, required: true },
  district: { type: String, required: true },
}, { timestamps: true,
    collection: 'Customer',
 });

// Only hash password if it's new or modified
customerSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

const Customer = mongoose.model('Customer', customerSchema);
module.exports = Customer;
