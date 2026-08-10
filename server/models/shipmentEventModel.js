const mongoose = require('mongoose');

/**
 * Append-only timeline for a Shipment. Stage 4 only wires up events for
 * transitions the current routes actually perform (create/assign, accept,
 * reject, start, complete). Event types for not-yet-built features
 * (IoT warnings, rescue sale, route suggestions) are declared here so the
 * schema doesn't need to change again when those stages land, but nothing
 * emits them yet.
 */
const shipmentEventSchema = new mongoose.Schema({
  shipment: { type: mongoose.Schema.Types.ObjectId, ref: 'Shipment', required: true },

  eventType: {
    type: String,
    required: true,
    enum: [
      'SHIPMENT_CREATED',
      'DRIVER_ASSIGNED',
      'DRIVER_ACCEPTED',
      'DRIVER_REJECTED',
      'DELIVERY_STARTED',
      'DELIVERY_COMPLETED',
      'SHIPMENT_CANCELLED',
      // Reserved for future stages — not emitted yet:
      'IOT_WARNING',
      'HIGH_RISK_DETECTED',
      'RESCUE_SALE_CREATED',
      'ROUTE_SUGGESTED',
      'ROUTE_ACCEPTED',
      'ROUTE_DECLINED',
    ],
  },

  // Who caused the event. actorModel enables a polymorphic populate via
  // refPath; actor is null for system-generated events (none yet in Stage 4).
  actor: { type: mongoose.Schema.Types.ObjectId, default: null },
  actorModel: { type: String, enum: ['Vendor', 'Driver', 'Customer', null], default: null },

  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },

  timestamp: { type: Date, default: Date.now },
}, {
  collection: 'ShipmentEvent',
});

shipmentEventSchema.index({ shipment: 1, timestamp: -1 });
shipmentEventSchema.index({ eventType: 1 });

const ShipmentEvent = mongoose.model('ShipmentEvent', shipmentEventSchema);
module.exports = ShipmentEvent;
