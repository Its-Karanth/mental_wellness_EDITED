require('dotenv').config({ path: require('path').join(__dirname, '.env') });
console.log('Loaded GROQ_API_KEY:', process.env.GROQ_API_KEY ? 'Present' : 'Missing', 'Length:', process.env.GROQ_API_KEY ? process.env.GROQ_API_KEY.length : 0);

// Check if GROQ_API_KEY is available
if (!process.env.GROQ_API_KEY) {
  console.log('⚠️  GROQ_API_KEY not found in environment variables');
  console.log('Please set GROQ_API_KEY in your .env file');
}

const MONGO_URI = 'mongodb://localhost:27017/mental-wellness-chat';
console.log('MONGO_URI:', MONGO_URI);
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const chatRouter = require('./chat');
const { User, Chat, Appointment, Admin } = require('./models');

// Set JWT secret with fallback
process.env.JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Register route
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, phone, address, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'Email already registered.' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ 
      name, 
      email, 
      password: hashedPassword, 
      phone: phone || '', 
      address: address || '', 
      role 
    });
    await user.save();
    res.status(201).json({ message: 'User registered successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// Login route
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'All fields are required.' });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }
    // Restrict admin login to only the specified credentials
    if (user.role === 'admin') {
      if (user.email !== 'admin@wellness.com') {
        return res.status(401).json({ message: 'Invalid credentials.' });
      }
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }
    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// Get all therapists (with specialization and availability)
app.get('/api/therapists', async (req, res) => {
  try {
    const therapists = await User.find({ role: 'therapist' }, '-password');
    res.json(therapists);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch therapists.' });
  }
});

// Get a single therapist profile
app.get('/api/therapists/:id', async (req, res) => {
  try {
    const therapist = await User.findOne({ _id: req.params.id, role: 'therapist' }, '-password');
    if (!therapist) return res.status(404).json({ error: 'Therapist not found.' });
    res.json(therapist);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch therapist profile.' });
  }
});

// Get available time slots for a therapist on a specific date
app.get('/api/therapists/:therapistId/availability/:date', async (req, res) => {
  try {
    const { therapistId, date } = req.params;
    
    // Validate date format
    const requestedDate = new Date(date);
    if (isNaN(requestedDate.getTime())) {
      return res.status(400).json({ error: 'Invalid date format.' });
    }
    
    // Check if date is in the past
    if (requestedDate <= new Date()) {
      return res.status(400).json({ error: 'Cannot check availability for past dates.' });
    }
    
    // Get therapist
    const therapist = await User.findById(therapistId);
    if (!therapist || therapist.role !== 'therapist') {
      return res.status(404).json({ error: 'Therapist not found.' });
    }
    
    // Get day of week
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayOfWeek = daysOfWeek[requestedDate.getDay()];
    
    // Check if therapist is available on this day
    const therapistAvailability = therapist.availability || [];
    const availableSlot = therapistAvailability.find(slot => slot.day === dayOfWeek);
    
    if (!availableSlot) {
      return res.json({ 
        available: false, 
        message: `Therapist is not available on ${dayOfWeek}`,
        availableDays: therapistAvailability.map(s => s.day)
      });
    }
    
    // Generate 30-minute time slots within the availability window
    const timeSlots = [];
    const [startHour, startMinute] = availableSlot.start.split(':').map(Number);
    const [endHour, endMinute] = availableSlot.end.split(':').map(Number);
    
    let currentHour = startHour;
    let currentMinute = startMinute;
    
    while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
      const timeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
      timeSlots.push(timeString);
      
      currentMinute += 30;
      if (currentMinute >= 60) {
        currentHour++;
        currentMinute = 0;
      }
    }
    
    // Filter out already booked slots
    const bookedSlots = [];
    const existingAppointments = await Appointment.find({
      therapist: therapistId,
      date: {
        $gte: new Date(requestedDate.getFullYear(), requestedDate.getMonth(), requestedDate.getDate()),
        $lt: new Date(requestedDate.getFullYear(), requestedDate.getMonth(), requestedDate.getDate() + 1)
      },
      status: { $nin: ['rejected', 'cancelled'] }
    });
    
    existingAppointments.forEach(appointment => {
      const appointmentHour = appointment.date.getHours();
      const appointmentMinute = appointment.date.getMinutes();
      const bookedTime = `${appointmentHour.toString().padStart(2, '0')}:${appointmentMinute.toString().padStart(2, '0')}`;
      bookedSlots.push(bookedTime);
    });
    
    const availableSlots = timeSlots.filter(slot => !bookedSlots.includes(slot));
    
    // Filter out past times if the date is today
    const today = new Date();
    const isToday = requestedDate.toDateString() === today.toDateString();
    let finalAvailableSlots = availableSlots;
    
    if (isToday) {
      const nowMinutes = today.getHours() * 60 + today.getMinutes();
      finalAvailableSlots = availableSlots.filter(slot => {
        const [hour, minute] = slot.split(':').map(Number);
        return hour * 60 + minute > nowMinutes;
      });
    }
    
    res.json({ 
      available: true, 
      availableSlots: finalAvailableSlots,
      message: `Available on ${dayOfWeek}`
    });
    
  } catch (err) {
    console.error('Availability check error:', err);
    res.status(500).json({ error: 'Failed to check availability.' });
  }
});

// Book appointment
app.post('/api/appointments', async (req, res) => {
  try {
    const { user, therapist, date, type } = req.body;
    
    if (!user || !therapist || !date || !type) {
      return res.status(400).json({ error: 'All fields are required.' });
    }
    
    // Validate user exists
    const userDoc = await User.findById(user);
    if (!userDoc) {
      return res.status(404).json({ error: 'User not found.' });
    }
    
    // Validate therapist exists
    const therapistDoc = await User.findById(therapist);
    if (!therapistDoc || therapistDoc.role !== 'therapist') {
      return res.status(404).json({ error: 'Therapist not found.' });
    }
    
    // Parse and validate appointment date
    const appointmentDate = new Date(date);
    if (isNaN(appointmentDate.getTime())) {
      return res.status(400).json({ error: 'Invalid date format.' });
    }
    
    // Check if appointment is in the past
    if (appointmentDate <= new Date()) {
      return res.status(400).json({ error: 'Cannot book appointments in the past.' });
    }
    
    // Check if appointment is on 30-minute intervals
    const minutes = appointmentDate.getMinutes();
    if (minutes !== 0 && minutes !== 30) {
      return res.status(400).json({ 
        error: 'Appointments must be scheduled on 30-minute intervals (e.g., 09:00, 09:30, 10:00, etc.)' 
      });
    }
    
    // All validations passed - create the appointment
    // Generate a unique Jitsi room name
    const shortId = Math.random().toString(36).substring(2, 10);
    const jitsiRoom = `wellness-app-${shortId}`;
    const appointment = new Appointment({ 
      user, 
      therapist, 
      date: appointmentDate, 
      type,
      status: 'pending',
      jitsiRoom
    });
    
    await appointment.save();
    
    res.status(201).json({ 
      message: 'Appointment booked successfully!', 
      appointment: {
        id: appointment._id,
        date: appointment.date,
        type: appointment.type,
        status: appointment.status,
        therapist: {
          name: therapistDoc.name,
          email: therapistDoc.email
        },
        jitsiRoom: appointment.jitsiRoom
      }
    });
    
  } catch (err) {
    console.error('Book appointment error:', err);
    res.status(500).json({ error: 'Failed to book appointment.', details: err.message });
  }
});

// Get all appointments for a therapist
app.get('/api/appointments/therapist/:therapistId', async (req, res) => {
  try {
    const appointments = await Appointment.find({ therapist: req.params.therapistId })
      .populate('user', 'name email phone')
      .sort({ date: 1 });
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch appointments.' });
  }
});

// Get all patients for a therapist (unique users with appointments)
app.get('/api/patients/therapist/:therapistId', async (req, res) => {
  try {
    const appointments = await Appointment.find({ therapist: req.params.therapistId }).populate('user', 'name email phone address');
    const patientsMap = {};
    appointments.forEach(a => {
      if (a.user && a.user._id) patientsMap[a.user._id] = a.user;
    });
    res.json(Object.values(patientsMap));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch patients.' });
  }
});

// Add/update notes and medication for an appointment
app.put('/api/appointments/:id/notes', async (req, res) => {
  try {
    const { notes, medication } = req.body;
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { $set: { notes, medication } },
      { new: true, runValidators: true }
    );
    if (!appointment) return res.status(404).json({ error: 'Appointment not found.' });
    res.json(appointment);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update appointment notes.' });
  }
});

// Get a user's appointments
app.get('/api/appointments/user/:userId', async (req, res) => {
  try {
    const appointments = await Appointment.find({ user: req.params.userId })
      .populate('therapist', 'name email phone')
      .sort({ date: 1 });
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch appointments.' });
  }
});

// Get user profile
app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user profile.' });
  }
});

// Update user profile
app.put('/api/users/:id', async (req, res) => {
  try {
    const allowedFields = ['name', 'phone', 'address'];
    const updates = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    // Password change logic
    if (req.body.oldPassword && req.body.newPassword) {
      const user = await User.findById(req.params.id);
      if (!user) return res.status(404).json({ error: 'User not found.' });
      const isMatch = await bcrypt.compare(req.body.oldPassword, user.password);
      if (!isMatch) return res.status(400).json({ error: 'Old password is incorrect.' });
      user.password = await bcrypt.hash(req.body.newPassword, 10);
      if (Object.keys(updates).length > 0) {
        Object.assign(user, updates);
      }
      await user.save();
      return res.json({ message: 'Password updated successfully.' });
    }

    // Profile update logic (no password)
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true, select: '-password' }
    );
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user profile.' });
  }
});

// Accept/reject appointment (therapist)
app.put('/api/appointments/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'accepted', 'rejected', 'completed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status.' });
    }
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { $set: { status } },
      { new: true, runValidators: true }
    );
    if (!appointment) return res.status(404).json({ error: 'Appointment not found.' });
    res.json(appointment);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update appointment status.' });
  }
});

// Admin: Add therapist
app.post('/api/admin/therapists', async (req, res) => {
  try {
    const { name, email, password, specialization, phone, address, availability } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered.' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const therapist = new User({
      name,
      email,
      password: hashedPassword,
      role: 'therapist',
      specialization,
      phone,
      address,
      availability
    });
    await therapist.save();
    res.status(201).json({ message: 'Therapist added.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add therapist.' });
  }
});

// Admin: Delete therapist
app.delete('/api/admin/therapists/:id', async (req, res) => {
  try {
    const therapist = await User.findOneAndDelete({ _id: req.params.id, role: 'therapist' });
    if (!therapist) return res.status(404).json({ error: 'Therapist not found.' });
    res.json({ message: 'Therapist deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete therapist.' });
  }
});

// Admin: Get all users
app.get('/api/admin/users', async (req, res) => {
  try {
    const users = await User.find({}, '-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users.' });
  }
});

// Admin: Delete user
app.delete('/api/admin/users/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json({ message: 'User deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user.' });
  }
});

// Admin: Get all appointments
app.get('/api/admin/appointments', async (req, res) => {
  try {
    const appointments = await Appointment.find({})
      .populate('user', 'name email')
      .populate('therapist', 'name email')
      .sort({ date: 1 });
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch appointments.' });
  }
});

// Admin: Get chatbot usage stats
app.get('/api/admin/chatbot-stats', async (req, res) => {
  try {
    const stats = await Chat.aggregate([
      {
        $group: {
          _id: '$user',
          totalMessages: { $sum: 1 },
          lastUsed: { $max: '$timestamp' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          user: { name: 1, email: 1 },
          totalMessages: 1,
          lastUsed: 1
        }
      },
      {
        $sort: { totalMessages: -1 }
      }
    ]);
    res.json(stats);
  } catch (err) {
    console.error('Chatbot stats error:', err);
    res.status(500).json({ error: 'Failed to fetch chatbot stats.' });
  }
});

// Admin: Get system reports
app.get('/api/admin/reports', async (req, res) => {
  try {
    const { range = 'this_week' } = req.query;
    const { startDate, endDate } = getDateRange(range);
    
    const [accountsCreated, chatbotUsers, appointmentsBooked] = await Promise.all([
      User.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } }),
      Chat.distinct('user', { timestamp: { $gte: startDate, $lte: endDate } }).then(users => users.length),
      Appointment.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } })
    ]);
    
    res.json({
      accountsCreated,
      chatbotUsers,
      appointmentsBooked,
      siteVisits: null // Not implemented yet
    });
  } catch (err) {
    console.error('Reports error:', err);
    res.status(500).json({ error: 'Failed to fetch reports.' });
  }
});

// Helper function to get date range
const getDateRange = (range) => {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (range) {
    case 'this_week':
      const startOfWeek = new Date(startOfDay);
      startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay());
      return { startDate: startOfWeek, endDate: now };
    case 'last_week':
      const lastWeekStart = new Date(startOfDay);
      lastWeekStart.setDate(startOfDay.getDate() - startOfDay.getDay() - 7);
      const lastWeekEnd = new Date(lastWeekStart);
      lastWeekEnd.setDate(lastWeekStart.getDate() + 6);
      return { startDate: lastWeekStart, endDate: lastWeekEnd };
    case 'past_15_days':
      const past15 = new Date(startOfDay);
      past15.setDate(startOfDay.getDate() - 15);
      return { startDate: past15, endDate: now };
    case 'past_30_days':
      const past30 = new Date(startOfDay);
      past30.setDate(startOfDay.getDate() - 30);
      return { startDate: past30, endDate: now };
    default:
      return { startDate: startOfDay, endDate: now };
  }
};

// Use chat router
app.use('/api/chat', chatRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 