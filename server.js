const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env
dotenv.config();

// Import database connection manager
const { connectDB } = require('./db');

// Import custom middleware
const logger = require('./middleware/logger');
const staticImages = require('./middleware/staticImages');

// Import route handlers
const lessonRoutes = require('./routes/lessons');
const orderRoutes = require('./routes/orders');

const app = express();
const PORT = process.env.PORT || 3000;

// 1. Cross-Origin Resource Sharing (CORS)
// Fully enabled for all origins and standard methods (prevents browser preflight issues with Vue frontend)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Handle preflight requests for all routes
app.options('*', cors());

// 2. Body parser - parses JSON request payloads (for POST/PUT)
app.use(express.json());

// 3. Custom Logger Middleware - logs every incoming request
app.use(logger);

// 4. Static Images Middleware - serves lesson images from public/images with custom 404 handling
app.use('/images', staticImages);

// 5. Search endpoint - accessible directly at GET /search?q=...
app.get('/search', lessonRoutes.searchLessons);

// 6. Core REST API routes
app.use('/lessons', lessonRoutes);
app.use('/orders', orderRoutes);

// 7. Default root route (API status & health check)
app.get('/', (req, res) => {
  res.json({
    message: 'CST3144 After-School Classes Backend API is running',
    status: 'OK',
    routes: {
      lessons: 'GET /lessons, PUT /lessons/:id',
      search: 'GET /search?q=... (or GET /lessons/search?q=...)',
      orders: 'POST /orders',
      images: 'GET /images/:filename'
    }
  });
});

// 8. 404 Fallback for any undefined API routes
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// 9. Centralized Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('[Server Error]', err.message || err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message || 'An unexpected error occurred on the server.'
  });
});

// Start Express server after initializing MongoDB connection
async function startServer() {
  try {
    await connectDB();
  } catch (dbErr) {
    console.error('[MongoDB Warning] Could not connect to MongoDB Atlas on startup:');
    console.error(' ', dbErr.message);
    console.log('[MongoDB Info] Verify your Atlas database user credentials in .env and ensure Atlas Network Access (IP Whitelist) allows your IP or 0.0.0.0/0.');
  }

  app.listen(PORT, () => {
    console.log(`[Server] Express server running at http://localhost:${PORT}`);
    console.log(`[Server] Lessons endpoint: http://localhost:${PORT}/lessons`);
    console.log(`[Server] Search endpoint:  http://localhost:${PORT}/search?q=...`);
    console.log(`[Server] Orders endpoint:  http://localhost:${PORT}/orders`);
    console.log(`[Server] Images mounted at http://localhost:${PORT}/images/`);
  });
}

// Start server if executed directly
if (require.main === module) {
  startServer();
}

module.exports = app;
