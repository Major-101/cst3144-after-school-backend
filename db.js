const { MongoClient } = require('mongodb');

let client = null;
let db = null;

/**
 * Connect to MongoDB Atlas using the native Node.js MongoDB driver (MongoClient).
 * Reads MONGODB_URI and DB_NAME from environment variables.
 */
async function connectDB() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.DB_NAME;

  if (!uri) {
    throw new Error('MONGODB_URI is not defined in environment variables.');
  }
  if (!dbName) {
    throw new Error('DB_NAME is not defined in environment variables.');
  }

  // Initialize MongoClient with the connection string
  client = new MongoClient(uri);

  // Connect client to the MongoDB Atlas cluster
  await client.connect();
  db = client.db(dbName);

  console.log(`[MongoDB] Successfully connected to database: "${dbName}"`);
  return db;
}

/**
 * Returns the active MongoDB database instance.
 * Throws an error if connectDB() has not been called or failed.
 */
function getDB() {
  if (!db) {
    throw new Error('Database connection is not initialized. Please check MongoDB Atlas connection and credentials.');
  }
  return db;
}

/**
 * Gracefully close the MongoDB client connection.
 */
async function closeDB() {
  if (client) {
    await client.close();
    client = null;
    db = null;
    console.log('[MongoDB] Connection closed.');
  }
}

module.exports = {
  connectDB,
  getDB,
  closeDB
};
