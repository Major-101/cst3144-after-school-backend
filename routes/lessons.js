const express = require('express');
const { ObjectId } = require('mongodb');
const { getDB } = require('../db');

const router = express.Router();

/**
 * GET /lessons
 * Retrieves all lesson documents from the 'lesson' collection.
 * Documents include: topic, price, location, space, and image/display fields.
 */
router.get('/', async (req, res, next) => {
  try {
    const db = getDB();
    // find({}) returns a MongoDB cursor; toArray() fetches all documents as a JavaScript array
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

module.exports = router;
