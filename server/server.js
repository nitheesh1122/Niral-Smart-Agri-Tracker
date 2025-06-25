const express = require('express');
const bodyParser = require('body-parser');
const connectDB = require('./db'); // ✅ Import DB connection
const signupRoute = require('./routes/signupRoute');
const loginRoute = require('./routes/loginRoute');

// const customerRoute = require('./routes/customerRoute'); // If needed

require('dotenv').config();
const app = express();

// ✅ Connect to MongoDB
connectDB();

// Middleware to parse JSON
app.use(bodyParser.json());

// Routes
app.use('/api', signupRoute);
app.use('/api', loginRoute);
app.use('/api/vendor', require('./routes/vendorRoutes')); // Vendor routes
app.use('/api/driver', require('./routes/driverRoutes')); // Driver routes

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
