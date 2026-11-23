const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env
dotenv.config();

// Import custom middleware
const logger = require('./middleware/logger');
const staticImages = require('./middleware/staticImages');

const app = express();
const PORT = process.env.PORT || 3000;

// 1. Cross-Origin Resource Sharing (CORS) - enables frontend to connect
app.use(cors());

// 2. Body parser - parses JSON request payloads (for future POST/PUT orders & lessons)
app.use(express.json());

// 3. Custom Logger Middleware - logs every incoming request
app.use(logger);

// 4. Static Images Middleware - serves lesson images from public/images with custom 404 handling
app.use('/images', staticImages);

// 5. Root route (API health check)
app.get('/', (req, res) => {
  res.json({
    message: 'CST3144 After-School Classes Backend API is running',
    status: 'OK'
  });
});

// 6. 404 Fallback for any undefined API routes
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Start listening for incoming requests
app.listen(PORT, () => {
  console.log(`[Server] Express server running at http://localhost:${PORT}`);
  console.log(`[Server] Images mounted at http://localhost:${PORT}/images/`);
});
