const express = require('express');
const mongoose = require('mongoose');
const Lecture = require('../models/Lecture');
const Course = require('../models/Course');
const User = require('../models/User');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

const normalizeDate = (inputDate) => {
  const date = new Date(inputDate);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  date.setHours(0, 0, 0, 0);
  return date;
};

const hasDateConflict = async (instructorId, date, excludeLectureId) => {
  const startOfDay = normalizeDate(date);
  if (!startOfDay) {
    return { error: 'Invalid date provided' };
  }

  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);

  const conflictQuery = {
    instructor: instructorId,
    date: { $gte: startOfDay, $lt: endOfDay },
    status: 'scheduled'
  };

  if (excludeLectureId && mongoose.Types.ObjectId.isValid(excludeLectureId)) {
    conflictQuery._id = { $ne: excludeLectureId };
  }

  const conflict = await Lecture.findOne(conflictQuery)
    .populate('course', 'name')
    .populate('instructor', 'name');

  return { conflict, normalizedDate: startOfDay };
};

// Get all lectures
router.get('/', auth, adminOnly, async (req, res) => {
  try {
    const lectures = await Lecture.find()
      .populate('course', 'name level description image')
      .populate('instructor', 'name email');

    res.json(lectures);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get lectures for a course
router.get('/course/:courseId', auth, adminOnly, async (req, res) => {
  try {
    const { courseId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: 'Invalid course ID' });
    }

    const lectures = await Lecture.find({ course: courseId })
      .populate('course', 'name level')
      .populate('instructor', 'name email')
      .sort({ date: 1 });

    res.json(lectures);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all lectures that currently have instructors assigned
router.get('/assigned', auth, adminOnly, async (req, res) => {
  try {
    const lectures = await Lecture.find({ instructor: { $exists: true, $ne: null } })
      .populate('course', 'name level')
      .populate('instructor', 'name email')
      .sort({ date: 1 });

    res.json(lectures);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a single lecture
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid lecture ID' });
    }

    const lecture = await Lecture.findById(id)
      .populate('course', 'name level description image')
      .populate('instructor', 'name email');

    if (!lecture) {
      return res.status(404).json({ message: 'Lecture not found' });
    }

    res.json(lecture);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a lecture
router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const { course, instructor, date, startTime, endTime, batchName } = req.body;

    if (!course || !instructor || !date || !startTime || !endTime) {
      return res.status(400).json({ message: 'Course, instructor, date, start time, and end time are required' });
    }

    if (!mongoose.Types.ObjectId.isValid(course)) {
      return res.status(400).json({ message: 'Invalid course ID' });
    }

    if (!mongoose.Types.ObjectId.isValid(instructor)) {
      return res.status(400).json({ message: 'Invalid instructor ID' });
    }

    const courseExists = await Course.findById(course);
    if (!courseExists) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const instructorExists = await User.findOne({ _id: instructor, role: 'instructor' });
    if (!instructorExists) {
      return res.status(404).json({ message: 'Instructor not found' });
    }

    const { conflict, normalizedDate, error } = await hasDateConflict(instructor, date);
    if (error) {
      return res.status(400).json({ message: error });
    }

    if (conflict) {
      return res.status(409).json({
        message: `Instructor already has a lecture scheduled on ${normalizedDate.toDateString()}`,
        conflict
      });
    }

    const lecture = new Lecture({
      course,
      instructor,
      date: normalizedDate,
      startTime,
      endTime,
      batchName
    });

    await lecture.save();

    const populatedLecture = await Lecture.findById(lecture._id)
      .populate('course', 'name level description image')
      .populate('instructor', 'name email');

    res.status(201).json(populatedLecture);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update a lecture
router.put('/:id', auth, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { course, instructor, date, startTime, endTime, batchName, status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid lecture ID' });
    }

    const lecture = await Lecture.findById(id);
    if (!lecture) {
      return res.status(404).json({ message: 'Lecture not found' });
    }

    if (course) {
      if (!mongoose.Types.ObjectId.isValid(course)) {
        return res.status(400).json({ message: 'Invalid course ID' });
      }
      const courseExists = await Course.findById(course);
      if (!courseExists) {
        return res.status(404).json({ message: 'Course not found' });
      }
      lecture.course = course;
    }

    if (instructor) {
      if (!mongoose.Types.ObjectId.isValid(instructor)) {
        return res.status(400).json({ message: 'Invalid instructor ID' });
      }
      const instructorExists = await User.findOne({ _id: instructor, role: 'instructor' });
      if (!instructorExists) {
        return res.status(404).json({ message: 'Instructor not found' });
      }
      lecture.instructor = instructor;
    }

    const dateToCheck = date ? date : lecture.date;
    const instructorToCheck = instructor ? instructor : lecture.instructor;

    const { conflict, normalizedDate, error } = await hasDateConflict(instructorToCheck, dateToCheck, lecture._id);
    if (error) {
      return res.status(400).json({ message: error });
    }

    if (conflict) {
      return res.status(409).json({
        message: `Instructor already has a lecture scheduled on ${normalizedDate.toDateString()}`,
        conflict
      });
    }

    if (date) {
      lecture.date = normalizedDate;
    }
    if (startTime) lecture.startTime = startTime;
    if (endTime) lecture.endTime = endTime;
    if (batchName !== undefined) lecture.batchName = batchName;
    if (status) lecture.status = status;
    lecture.updatedAt = Date.now();

    await lecture.save();

    const updatedLecture = await Lecture.findById(lecture._id)
      .populate('course', 'name level description image')
      .populate('instructor', 'name email');

    res.json(updatedLecture);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete a lecture
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid lecture ID' });
    }

    const lecture = await Lecture.findById(id);
    if (!lecture) {
      return res.status(404).json({ message: 'Lecture not found' });
    }

    await lecture.deleteOne();
    res.json({ message: 'Lecture deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Assign/Update instructor and date
router.post('/:id/assign', auth, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { instructorId, date } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid lecture ID' });
    }
    if (!instructorId || !date) {
      return res.status(400).json({ message: 'Instructor and date are required' });
    }
    if (!mongoose.Types.ObjectId.isValid(instructorId)) {
      return res.status(400).json({ message: 'Invalid instructor ID' });
    }

    const lecture = await Lecture.findById(id);
    if (!lecture) {
      return res.status(404).json({ message: 'Lecture not found' });
    }

    const instructor = await User.findOne({ _id: instructorId, role: 'instructor' });
    if (!instructor) {
      return res.status(404).json({ message: 'Instructor not found' });
    }

    const { conflict, normalizedDate, error } = await hasDateConflict(instructorId, date, lecture._id);
    if (error) {
      return res.status(400).json({ message: error });
    }

    if (conflict) {
      return res.status(409).json({
        message: `Instructor already has a lecture scheduled on ${normalizedDate.toDateString()}`,
        conflict
      });
    }

    lecture.instructor = instructorId;
    lecture.date = normalizedDate;
    lecture.updatedAt = Date.now();
    await lecture.save();

    const updatedLecture = await Lecture.findById(lecture._id)
      .populate('course', 'name level')
      .populate('instructor', 'name email');

    res.json(updatedLecture);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

