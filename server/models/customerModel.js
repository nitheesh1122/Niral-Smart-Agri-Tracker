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

  // Free-text street address, editable by the customer. Optional — Stage 4
  // establishes the field, no screen collects it yet.
  address: { type: String, default: null, maxlength: 500 },

  // GeoJSON point, only set once a screen starts capturing precise
  // coordinates (e.g. for a future "nearby rescue sales" query).
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: undefined }, // [lng, lat]
  },

  // Foundation for future rescue-marketplace filtering — not read by any
  // route yet.
  productInterests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: [] }],

  expoPushToken: { type: String, default: null },
}, {
  timestamps: true,
  collection: 'Customer',
});

// Database indexes for faster queries
// No separate .index({username:1}) / .index({email:1}) — `unique: true`
// on those fields above already creates that index.

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

// Hide password when sending JSON (mirrors Driver's existing toJSON — this
// was previously missing here, so login/profile responses leaked the
// bcrypt hash to the client).
customerSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

const Customer = mongoose.model('Customer', customerSchema);
module.exports = Customer;
