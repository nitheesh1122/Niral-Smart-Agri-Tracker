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

  // GeoJSON point. Stage 11 is the first stage that actually reads this —
  // set only when the customer explicitly opts into Rescue Sale
  // notifications (see rescueOptIn below) and grants location permission.
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: undefined }, // [lng, lat]
  },
  // When `location` was last captured, so eligibility can distinguish a
  // fresh consent from a months-old one (Phase 8/9 — see
  // CUSTOMER_LOCATION_STALE_DAYS in server/config/rescueConfig.js).
  locationUpdatedAt: { type: Date, default: null },

  // Explicit opt-in gate for the Rescue Marketplace (Phase 9). Off by
  // default — never inferred from having set `location` for some other
  // reason, and never required for normal Fresh Goods use. A customer who
  // opts out is excluded from radius-based eligibility even if `location`
  // is still populated from a prior opt-in.
  rescueOptIn: { type: Boolean, default: false },

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

// Phase 32: geospatial index backing the Rescue Sale nearby-customer query
// (server/services/rescueService.js) so eligibility never requires loading
// every Customer into Node to compute distance.
customerSchema.index({ location: '2dsphere' });

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
