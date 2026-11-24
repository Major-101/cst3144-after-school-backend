const express = require('express');
const { getDB } = require('../db');

const router = express.Router();

/**
 * POST /orders
 * Inserts a new order document into the 'order' collection.
 * 
 * Required fields in req.body:
 * - name: string (customer full name)
 * - phone: string (customer phone number)
 * - lessonIds: array or string (ID(s) of lessons ordered)
 * - spaces: number (number of spaces ordered, must be > 0)
 */
router.post('/', async (req, res, next) => {
  try {
    const { name, phone, lessonIds, spaces } = req.body;

    // Validate name
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({
        error: 'Bad Request',
        message: "Order 'name' is required and must be a non-empty string."
      });
    }

    // Validate phone
    if (!phone || typeof phone !== 'string' || phone.trim() === '') {
      return res.status(400).json({
        error: 'Bad Request',
        message: "Order 'phone' is required and must be a non-empty string."
      });
    }

    // Validate lessonIds
    if (!lessonIds || (Array.isArray(lessonIds) && lessonIds.length === 0)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: "Order 'lessonIds' is required and must not be empty."
      });
    }

    // Validate spaces
    const spacesNum = Number(spaces);
    if (isNaN(spacesNum) || spacesNum <= 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: "Order 'spaces' is required and must be a positive number greater than 0."
      });
    }

    const newOrder = {
      name: name.trim(),
      phone: phone.trim(),
      lessonIds,
      spaces: spacesNum,
      createdAt: new Date()
    };

    const db = getDB();
    // insertOne inserts the new order document into the 'order' collection
    const result = await db.collection('order').insertOne(newOrder);

    // Return 201 Created status with the newly inserted order ID
    res.status(201).json({
      message: 'Order placed successfully',
      orderId: result.insertedId,
      order: {
        _id: result.insertedId,
        ...newOrder
      }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
