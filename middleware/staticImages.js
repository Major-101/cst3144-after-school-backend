const path = require('path');
const fs = require('fs');

// Absolute path to the lesson images folder inside backend/public/images
const IMAGES_DIR = path.resolve(__dirname, '..', 'public', 'images');

/**
 * Static Image Middleware
 * 
 * Serves lesson images from the `public/images` folder.
 * If the requested image does not exist, returns a clear 404 error response with a JSON message.
 * 
 * Explanation for demo:
 * 1. Checks that the HTTP request is GET or HEAD (static image retrieval).
 * 2. Resolves the requested file path using `path.join(IMAGES_DIR, ...)`.
 * 3. Enforces directory traversal protection (`targetFilePath.startsWith(IMAGES_DIR)`)
 *    to prevent malicious requests from accessing files outside the images folder.
 * 4. Uses `fs.stat` to verify the file exists on disk and is a regular file.
 * 5. If the file is missing or invalid, immediately returns a 404 status code with a descriptive JSON error.
 * 6. If the file exists, streams it to the client using Express's `res.sendFile()`.
 */
function staticImages(req, res, next) {
  // Only process GET and HEAD requests for static image assets
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return next();
  }

  // Normalize requested relative file path (removes leading slashes and URL-decodes spaces/characters)
  const relativeFilePath = decodeURIComponent(req.path).replace(/^\/+/, '');
  const targetFilePath = path.join(IMAGES_DIR, relativeFilePath);

  // Security check: Ensure requested path stays strictly inside public/images
  // Appending path.sep prevents matching sibling folder prefixes (e.g. images_backup)
  const safeRoot = IMAGES_DIR.endsWith(path.sep) ? IMAGES_DIR : IMAGES_DIR + path.sep;
  if (!targetFilePath.startsWith(safeRoot)) {
    return res.status(403).json({
      error: 'Access Denied',
      message: 'Directory traversal is not permitted.'
    });
  }

  // Check if the requested file exists on disk
  fs.stat(targetFilePath, (err, stats) => {
    if (err || !stats.isFile()) {
      return res.status(404).json({
        error: 'Image not found',
        message: `Image '${relativeFilePath || 'unspecified'}' does not exist on this server.`
      });
    }

    // Stream the image file to the client
    res.sendFile(targetFilePath, (sendErr) => {
      if (sendErr && !res.headersSent) {
        next(sendErr);
      }
    });
  });
}

module.exports = staticImages;
