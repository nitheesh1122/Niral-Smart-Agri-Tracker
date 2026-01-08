/**
 * Customer Routes - API endpoints for customer features
 */
const express = require('express');
const router = express.Router();
const Customer = require('../models/customerModel');
const Vendor = require('../models/vendorModel');
const Export = require('../models/ExportModel');

/**
 * GET /api/customer/profile/:customerId
 * Get customer profile
 */
router.get('/profile/:customerId', async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.customerId).select('-password');
        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        res.json(customer);
    } catch (err) {
        console.error('Error fetching customer profile:', err);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

/**
 * GET /api/customer/vendors
 * Get list of all vendors
 */
router.get('/vendors', async (req, res) => {
    try {
        const vendors = await Vendor.find({})
            .select('name mobileNo state district')
            .sort({ name: 1 });
        res.json(vendors);
    } catch (err) {
        console.error('Error fetching vendors:', err);
        res.status(500).json({ error: 'Failed to fetch vendors' });
    }
});

/**
 * GET /api/customer/vendors/:vendorId
 * Get single vendor details
 */
router.get('/vendors/:vendorId', async (req, res) => {
    try {
        const vendor = await Vendor.findById(req.params.vendorId)
            .select('-password')
            .populate('drivers', 'name')
            .populate('vehicles', 'vehicleNumber brand');

        if (!vendor) {
            return res.status(404).json({ error: 'Vendor not found' });
        }
        res.json(vendor);
    } catch (err) {
        console.error('Error fetching vendor:', err);
        res.status(500).json({ error: 'Failed to fetch vendor' });
    }
});

/**
 * GET /api/customer/exports/available
 * Get all active/available exports (Started status) that customer can track
 */
router.get('/exports/available', async (req, res) => {
    try {
        const { state, district } = req.query;

        let query = { status: 'Started' };

        // Filter by location if provided
        if (state || district) {
            query['routes'] = { $exists: true };
        }

        const exports = await Export.find(query)
            .populate('vendorId', 'name mobileNo')
            .populate('driver', 'name mobileNo')
            .populate('vehicle', 'vehicleNumber brand')
            .sort({ startDate: -1 })
            .limit(50);

        res.json(exports);
    } catch (err) {
        console.error('Error fetching available exports:', err);
        res.status(500).json({ error: 'Failed to fetch exports' });
    }
});

/**
 * GET /api/customer/track/:exportId
 * Get tracking info for an export
 */
router.get('/track/:exportId', async (req, res) => {
    try {
        const exportData = await Export.findById(req.params.exportId)
            .populate('vendorId', 'name mobileNo')
            .populate('driver', 'name mobileNo')
            .populate('vehicle', 'vehicleNumber brand deviceId');

        if (!exportData) {
            return res.status(404).json({ error: 'Export not found' });
        }

        res.json({
            export: exportData,
            startLocation: exportData.startLocation,
            endLocation: exportData.endLocation,
            intermediateLocations: exportData.intermediateLocations,
            routes: exportData.routes,
            status: exportData.status,
        });
    } catch (err) {
        console.error('Error fetching tracking info:', err);
        res.status(500).json({ error: 'Failed to fetch tracking info' });
    }
});

/**
 * GET /api/customer/dashboard/:customerId
 * Get dashboard data for customer
 */
router.get('/dashboard/:customerId', async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.customerId).select('-password');
        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        // Get active exports in customer's area
        const activeExports = await Export.find({
            status: 'Started',
            routes: { $in: [customer.district, customer.state] }
        })
            .populate('vendorId', 'name')
            .populate('driver', 'name')
            .sort({ startDate: -1 })
            .limit(10);

        // Get vendor count
        const vendorCount = await Vendor.countDocuments({});

        // Get active deliveries count
        const activeCount = await Export.countDocuments({ status: 'Started' });

        res.json({
            customer: {
                name: customer.name,
                state: customer.state,
                district: customer.district,
            },
            stats: {
                totalVendors: vendorCount,
                activeDeliveries: activeCount,
                nearbyDeliveries: activeExports.length,
            },
            nearbyExports: activeExports,
        });
    } catch (err) {
        console.error('Error fetching dashboard:', err);
        res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
});

module.exports = router;
