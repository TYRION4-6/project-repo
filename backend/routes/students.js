const express = require("express");
const router = express.Router();
const Student = require("../models/Student");
const protect = require("../middleware/auth");
const { isDbReady, generateId } = require("../config/store");

let inMemoryStudents = [
  { _id: "stud_1", name: "Aarav Sharma", email: "aarav@university.edu", course: "Computer Science", year: 3 },
  { _id: "stud_2", name: "Priya Patel", email: "priya@university.edu", course: "Business Administration", year: 2 },
];

// GET /api/students
router.get("/", protect, async (req, res) => {
  try {
    if (isDbReady()) {
      const students = await Student.find().sort({ createdAt: -1 });
      return res.json(students);
    }
    res.json(inMemoryStudents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/students
router.post("/", protect, async (req, res) => {
  const { name, email, course, year } = req.body;
  if (!name || !email || !course) {
    return res.status(400).json({ message: "Name, email, and course are required" });
  }

  try {
    if (isDbReady()) {
      const student = await Student.create({ name, email, course, year: year || 1 });
      return res.status(201).json(student);
    }

    const newStudent = { _id: generateId(), name, email, course, year: year || 1 };
    inMemoryStudents.unshift(newStudent);
    res.status(201).json(newStudent);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
