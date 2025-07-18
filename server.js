require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();
const apiBase = 'https://femmertrimmer-production.up.railway.app';

const Client = clientsConnection.model('Client', clientSchema);

const jobsConnection = mongoose.createConnection(process.env.NEW_JOBS_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const clientsConnection = mongoose.createConnection(process.env.CLIENT_DATA_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const allowedOrigins = [
  'http://localhost:5500',
  'https://femmertrimmer-production.up.railway.app',
  'https://jfemmer.github.io'
];

const corsOptions = {
  origin: [
    'http://localhost:5500',
    'https://jfemmer.github.io',
    'https://femmertrimmer-production.up.railway.app'
  ],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  credentials: true
};

app.use(cors(corsOptions)); 
app.use(express.json());

// Connect to MongoDB
const quotesConnection = mongoose.createConnection(process.env.QUOTES_DB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Define the schema
const quoteSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  phone: String,
  address: String,
  services: [String],
  mowingSchedule: String,
  estimateAmount: String,
  estimateNotes: String,
  deliveryMethod: String,
  sentAt: Date,
status: { type: String, default: 'New' }
}, { timestamps: true });

const clientSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  phone: String,
  address: String,
  propertySize: Number,
  jobs: [
    {
      services: [String],
      start: String,
      notes: String,
      status: String,
      address: String,
      propertySize: Number,
      price: Number,
      schedulingPriority: String,
      flexibleDays: [String],
      flexibleStartTime: String,
      flexibleEndTime: String
    }
  ]
}, {
  collection: 'clients',
  timestamps: true
});


// Register the model on the 'new_requests' collection
const QuoteRequest = quotesConnection.model('QuoteRequest', quoteSchema, 'new_requests');

module.exports = QuoteRequest;
// Route to handle quote submissions
app.post('/api/quotes', async (req, res) => {
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
    res.status(200).json(newQuote); // ✅ Now includes _id for frontend use
  } catch (err) {
    console.error('❌ Error saving quote request:', err);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
});

app.get('/api/quotes', async (req, res) => {
  try {
    const quotes = await QuoteRequest.find().sort({ _id: -1 });
    console.log("📤 Sending raw quote:", quotes[0]); // ADD THIS LINE
    res.status(200).json(quotes);
  } catch (err) {
    console.error("❌ Failed to fetch quotes:", err);
    res.status(500).json({ message: 'Failed to fetch quotes' });
  }
});

app.get('/api/quotes/:id', async (req, res) => {
  try {
    const quote = await QuoteRequest.findById(req.params.id);
    if (!quote) {
      return res.status(404).json({ message: 'Quote not found' });
    }
    res.status(200).json(quote);
  } catch (err) {
    console.error("❌ Failed to fetch quote by ID:", err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.patch('/api/quotes/:id/mark-pending', async (req, res) => {
  try {
    const updated = await QuoteRequest.findByIdAndUpdate(req.params.id, {
      ...req.body
    }, { new: true });

    if (!updated) return res.status(404).json({ message: 'Quote not found' });
    res.status(200).json(updated);
  } catch (err) {
    console.error("❌ Failed to update quote:", err);
    res.status(500).json({ message: 'Failed to update quote' });
  }
});

const jobSchema = new mongoose.Schema({
  name: String,
  services: [String],
  start: String,
  notes: String,
  status: { type: String, default: "Scheduled" },
  address: String,
  propertySize: Number,
  schedulingPriority: String,
  flexibleDays: [String],
  flexibleStartTime: String,
  flexibleEndTime: String
}, {
  collection: 'jobs',
  timestamps: true
});

const Job = jobsConnection.model('Job', jobSchema);

app.post('/api/jobs', async (req, res) => {
  try {
    const newJob = new Job(req.body);
    await newJob.save();
    res.status(201).json({ message: 'Job created' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create job' });
  }
});

// Get all jobs
app.get('/api/jobs', async (req, res) => {
  try {
    const jobs = await Job.find();
    const events = jobs
      .filter(job => !!job.start)
      .map(job => ({
        title: job.services.join(', ') + (job.name ? ` for ${job.name}` : ' Job'),
        start: job.start,
        address: job.address,
        name: job.name,
        notes: job.notes,
        propertySize: job.propertySize
      }));
    res.status(200).json(events);
  } catch (error) {
    console.error('❌ Error fetching jobs:', error);
    res.status(500).json({ message: 'Failed to fetch jobs.' });
  }
});

app.post('/api/clients', async (req, res) => {
  try {
    const newClient = new Client(req.body);
    await newClient.save();
    res.status(201).json({ message: 'Client saved successfully' });
  } catch (err) {
    console.error('❌ Error saving client:', err);
    res.status(500).json({ message: 'Failed to save client' });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
