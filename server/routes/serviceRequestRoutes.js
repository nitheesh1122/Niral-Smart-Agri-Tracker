/**
 * Service Request Routes
 * API endpoints for managing vendor service requests
 */
const express = require('express');
const router = express.Router();
const ServiceRequest = require('../models/serviceRequestModel');

/**
 * GET /api/vendor/service-requests/:vendorId
 * Get all service requests for a vendor
 */
router.get('/service-requests/:vendorId', async (req, res) => {
    try {
        const { vendorId } = req.params;

        const requests = await ServiceRequest.find({ vendor: vendorId })
            .populate('customer', 'name email phone')
            .sort({ createdAt: -1 });

        res.json(requests);
    } catch (error) {
        console.error('Error fetching service requests:', error);
        res.status(500).json({ error: 'Failed to fetch service requests' });
    }
});

/**
 * POST /api/vendor/service-requests
 * Create a new service request (from customer)
 */
router.post('/service-requests', async (req, res) => {
    try {
        const { customerId, vendorId, serviceType, message } = req.body;

        if (!customerId || !vendorId || !message) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const request = new ServiceRequest({
            customer: customerId,
            vendor: vendorId,
            serviceType: serviceType || 'other',
            message,
        });

        await request.save();

        res.status(201).json({
            success: true,
            message: 'Service request created successfully',
            request,
        });
    } catch (error) {
        console.error('Error creating service request:', error);
        res.status(500).json({ error: 'Failed to create service request' });
    }
});

/**
 * PUT /api/vendor/service-requests/:requestId/accept
 * Accept a service request
 */
router.put('/service-requests/:requestId/accept', async (req, res) => {
    try {
        const { requestId } = req.params;

        const request = await ServiceRequest.findByIdAndUpdate(
            requestId,
            { status: 'accepted', updatedAt: Date.now() },
            { new: true }
        ).populate('customer', 'name email');

        if (!request) {
            return res.status(404).json({ error: 'Request not found' });
        }

        res.json({
            success: true,
            message: 'Request accepted',
            request,
        });
    } catch (error) {
        console.error('Error accepting request:', error);
        res.status(500).json({ error: 'Failed to accept request' });
    }
});

/**
 * PUT /api/vendor/service-requests/:requestId/reject
 * Reject a service request
 */
router.put('/service-requests/:requestId/reject', async (req, res) => {
    try {
        const { requestId } = req.params;
        const { reason } = req.body;

        const request = await ServiceRequest.findByIdAndUpdate(
            requestId,
            {
                status: 'rejected',
                response: reason || '',
                updatedAt: Date.now()
            },
            { new: true }
        ).populate('customer', 'name email');

        if (!request) {
            return res.status(404).json({ error: 'Request not found' });
        }

        res.json({
            success: true,
            message: 'Request rejected',
            request,
        });
    } catch (error) {
        console.error('Error rejecting request:', error);
        res.status(500).json({ error: 'Failed to reject request' });
    }
});

/**
 * PUT /api/vendor/service-requests/:requestId/complete
 * Mark a service request as completed
 */
router.put('/service-requests/:requestId/complete', async (req, res) => {
    try {
        const { requestId } = req.params;
        const { response } = req.body;

        const request = await ServiceRequest.findByIdAndUpdate(
            requestId,
            {
                status: 'completed',
                response: response || '',
                updatedAt: Date.now()
            },
            { new: true }
        );

        if (!request) {
            return res.status(404).json({ error: 'Request not found' });
        }

        res.json({
            success: true,
            message: 'Request completed',
            request,
        });
    } catch (error) {
        console.error('Error completing request:', error);
        res.status(500).json({ error: 'Failed to complete request' });
    }
});

module.exports = router;
