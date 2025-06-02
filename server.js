require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();
const apiBase = 'https://femmer_trimmer-name.up.railway.app';

// Middleware
const corsOptions = {
  origin: ['http://localhost:5500', 'https://femmer_trimmer-name.up.railway.app'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  credentials: false
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Mongoose Schema
const quoteSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  phone: String,
  address: String,
  services: [String],
  mowingSchedule: String
});

const QuoteRequest = mongoose.model('QuoteRequest', quoteSchema);

// Route to handle quote submissions
app.post('/api/quote', async (req, res) => {
  try {
    const { firstName, lastName, email, phone, address, services, mowingSchedule } = req.body;

    if (!firstName || !lastName || !email || !phone || !address || !services || services.length === 0) {
      return res.status(400).json({ message: 'Please fill out all required fields.' });
    }

    // Only require mowingSchedule if mowing is selected
    if (services.includes('Mowing & Trimming') && !mowingSchedule) {
      return res.status(400).json({ message: 'Please select a mowing schedule.' });
    }

    const newQuote = new QuoteRequest({
      firstName,
      lastName,
      email,
      phone,
      address,
      services,
      mowingSchedule: services.includes('Mowing & Trimming') ? mowingSchedule : null
    });

    await newQuote.save();
    res.status(200).json({ message: 'Quote request submitted successfully!' });
  } catch (err) {
    console.error('❌ Error saving quote request:', err);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
});

const jobSchema = new mongoose.Schema({
  title: String,
  start: String,
  notes: String,
  status: String,
  name: String,
  address: String,
  propertySize: Number
}, { collection: 'jobs' });

const Job = mongoose.model('Job', jobSchema);

// Save a new job
app.post('/api/jobs', async (req, res) => {
  try {
    const job = new Job(req.body);
    await job.save();
    res.status(201).json(job);
  } catch (error) {
    console.error('❌ Error saving job:', error);
    res.status(500).json({ message: 'Failed to save job.' });
  }
});

// Get all jobs
app.get('/api/jobs', async (req, res) => {
  try {
    const jobs = await Job.find();
    res.status(200).json(jobs);
  } catch (error) {
    console.error('❌ Error fetching jobs:', error);
    res.status(500).json({ message: 'Failed to fetch jobs.' });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
