/**
 * Custom Logger Middleware
 * 
 * Logs all incoming HTTP requests to the server console:
 * - Request Method (GET, POST, PUT, DELETE, etc.)
 * - Request URL
 * - Response Status Code (200, 404, 500, etc.)
 * - Timestamp in ISO 8601 format
 * 
 * Explanation for demo:
 * Express executes middleware in sequence. When a request arrives, the status code
 * has not yet been determined because the route handler hasn't run.
 * By listening to the 'finish' event on the response object (`res.on('finish', ...)`),
 * we capture the final HTTP status code right as the response headers and body are sent
 * to the client. Calling `next()` ensures the request continues down the middleware chain.
 */
function logger(req, res, next) {
  const timestamp = new Date().toISOString();

  res.on('finish', () => {
    console.log(`[${timestamp}] ${req.method} ${req.originalUrl} - Status: ${res.statusCode}`);
  });

  next();
}

module.exports = logger;
