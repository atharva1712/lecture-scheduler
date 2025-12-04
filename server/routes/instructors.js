const express = require('express');
const mongoose = require('mongoose');
const Lecture = require('../models/Lecture');
const User = require('../models/User');
const { auth, instructorOnly, adminOnly } = require('../middleware/auth');

const router = express.Router();

// Get all instructors (admin convenience endpoint)
router.get('/', auth, adminOnly, async (req, res) => {
  try {
    const instructors = await User.find({ role: 'instructor' })
      .select('-password')
      .sort({ name: 1 });

    res.json(instructors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get logged-in instructor lectures
router.get('/me/lectures', auth, instructorOnly, async (req, res) => {
  try {
    const lectures = await Lecture.find({ instructor: req.user._id })
      .populate('course', 'name level description image')
      .sort({ date: 1 });

    res.json(lectures);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get specific instructor schedule (admin)
router.get('/:id/schedule', auth, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid instructor ID' });
    }

    const instructor = await User.findOne({ _id: id, role: 'instructor' }).select('-password');
    if (!instructor) {
      return res.status(404).json({ message: 'Instructor not found' });
    }

    const lectures = await Lecture.find({ instructor: id })
      .populate('course', 'name level')
      .sort({ date: 1 });

    res.json({
      instructor,
      lectures
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

