const express = require('express');
const User = require('../models/User');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

// Get all instructors
router.get('/instructors', auth, adminOnly, async (req, res) => {
  try {
    const instructors = await User.find({ role: 'instructor' })
      .select('-password')
      .sort({ name: 1 });
    
    res.json(instructors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

