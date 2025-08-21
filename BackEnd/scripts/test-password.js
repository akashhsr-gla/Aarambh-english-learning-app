require('dotenv').config({ path: './env.local' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aarambhapp';

async function testPassword() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Test password hashing
    const testPassword = 'teacher123';
    const hashedPassword = await bcrypt.hash(testPassword, 12);
    console.log(`\nTest password: ${testPassword}`);
    console.log(`Hashed password: ${hashedPassword}`);

    // Test password comparison
    const isMatch = await bcrypt.compare(testPassword, hashedPassword);
    console.log(`Password comparison result: ${isMatch}`);

    // Check the teacher user
    const teacher = await User.findOne({ email: 'teacher@test.com' });
    if (teacher) {
      console.log(`\nTeacher found: ${teacher.name}`);
      console.log(`Stored password hash: ${teacher.password}`);
      
      // Test password comparison with stored hash
      const storedHashMatch = await bcrypt.compare(testPassword, teacher.password);
      console.log(`Stored hash comparison result: ${storedHashMatch}`);
      
      // Test using the User model's comparePassword method
      const modelMatch = await teacher.comparePassword(testPassword);
      console.log(`Model comparePassword result: ${modelMatch}`);
    } else {
      console.log('Teacher not found');
    }

    // Check the student user
    const student = await User.findOne({ email: 'student@test.com' });
    if (student) {
      console.log(`\nStudent found: ${student.name}`);
      console.log(`Stored password hash: ${student.password}`);
      
      // Test password comparison with stored hash
      const studentPassword = 'student123';
      const storedHashMatch = await bcrypt.compare(studentPassword, student.password);
      console.log(`Student password comparison result: ${storedHashMatch}`);
      
      // Test using the User model's comparePassword method
      const modelMatch = await student.comparePassword(studentPassword);
      console.log(`Student model comparePassword result: ${modelMatch}`);
    } else {
      console.log('Student not found');
    }

  } catch (error) {
    console.error('Error testing password:', error);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
  }
}

testPassword();
