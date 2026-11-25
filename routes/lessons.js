const express = require('express');
const { ObjectId } = require('mongodb');
const { getDB } = require('../db');

const router = express.Router();

/**
 * Search Lessons Handler
 * GET /search?q=... or GET /lessons/search?q=...
 * 
 * Requirements:
 * 1. Reads 'q' or 'query' from req.query.
 * 2. If query is empty or missing, returns all lessons.
 * 3. Uses case-insensitive $regex matching across 'topic' and 'location'.
 * 4. If query is a valid number, also matches 'price' or 'space'.
 * 5. Returns array of matching lesson documents as JSON.
 */
async function searchLessons(req, res, next) {
  try {
    const rawQuery = req.query.q || req.query.query || '';
    const query = String(rawQuery).trim();

    const db = getDB();

    // If query is empty or missing, return all lessons from the 'lesson' collection
    if (!query) {
      const lessons = await db.collection('lesson').find({}).toArray();
      return res.json(lessons);
    }

    // Escape regex special characters to prevent regex injection or syntax errors
    const escapedQuery = query.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');

    // Case-insensitive regex matching for string fields (topic, location)
    const conditions = [
      { topic: { $regex: escapedQuery, $options: 'i' } },
      { location: { $regex: escapedQuery, $options: 'i' } }
    ];

    // If query is a valid number, include numeric equality matching for price and space
    const num = Number(query);
    if (!isNaN(num)) {
      conditions.push({ price: num });
      conditions.push({ space: num });
    }

    const filter = { $or: conditions };
    const matchingLessons = await db.collection('lesson').find(filter).toArray();

    res.json(matchingLessons);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /lessons/search
 * Mounted on lesson router for /lessons/search?q=...
 */
router.get('/search', searchLessons);

/**
 * GET /lessons
 * Retrieves all lesson documents from the 'lesson' collection.
 * Documents include: topic, price, location, space, and image/display fields.
 */
router.get('/', async (req, res, next) => {
  try {
    const db = getDB();
    // find({}) returns a cursor; toArray() fetches all documents into an array
    const lessons = await db.collection('lesson').find({}).toArray();
    res.json(lessons);
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /lessons/:id
 * Updates attributes on a lesson document in the 'lesson' collection.
 * 
 * Key demo features:
 * 1. Validates that ':id' is a valid 24-character hexadecimal MongoDB ObjectId.
 * 2. Allows setting 'space' directly to ANY valid number (not limited to +/-1).
 * 3. Prevents modifying the immutable '_id' field.
 * 4. Returns 404 if no lesson matched the ID.
 */
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate that the ID conforms to a 24-character hexadecimal ObjectId
    if (!ObjectId.isValid(id) || String(new ObjectId(id)) !== id) {
      return res.status(400).json({
        error: 'Bad Request',
        message: `Invalid lesson ID format: '${id}'. Must be a 24-character hexadecimal string.`
      });
    }

    const updates = { ...req.body };

    // Never allow updating MongoDB's immutable _id
    delete updates._id;

    // Check that at least one field was provided in the request body
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Request body must contain at least one attribute to update.'
      });
    }

    // If 'space' is provided, cast and validate that it is a valid number
    if (updates.space !== undefined) {
      const spaceNum = Number(updates.space);
      if (isNaN(spaceNum)) {
        return res.status(400).json({
          error: 'Bad Request',
          message: "Field 'space' must be a valid number."
        });
      }
      updates.space = spaceNum;
    }

    const db = getDB();
    // updateOne locates the document by _id and applies fields via the $set operator
    const result = await db.collection('lesson').updateOne(
      { _id: new ObjectId(id) },
      { $set: updates }
    );

    // If no document matched the query criteria, return a 404
    if (result.matchedCount === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Lesson with ID '${id}' does not exist.`
      });
    }

    res.json({
      message: 'Lesson updated successfully',
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount
    });
  } catch (err) {
    next(err);
  }
});

// Attach searchLessons handler to the router object for direct mounting in server.js
router.searchLessons = searchLessons;

module.exports = router;
