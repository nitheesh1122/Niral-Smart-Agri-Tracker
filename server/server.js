const express = require('express');
const connectDB = require('./db');
const signupRoute = require('./routes/signupRoute');
const loginRoute = require('./routes/loginRoute');
const errorHandler = require('./middleware/errorHandler');

require('dotenv').config();
const app = express();

// Connect to MongoDB
connectDB();

// Middleware to parse JSON
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Routes
app.use('/api', signupRoute);
app.use('/api', loginRoute);
app.use('/api', require('./routes/passwordReset'));
app.use('/api/vendor', require('./routes/vendorRoutes'));
app.use('/api/vendor', require('./routes/serviceRequestRoutes'));
app.use('/api/driver', require('./routes/driverRoutes'));
app.use('/api/customer', require('./routes/customerRoutes'));
app.use('/chat', require('./routes/chat'));
app.use('/api/user', require('./routes/user'));

// Global error handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
