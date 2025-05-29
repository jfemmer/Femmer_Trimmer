require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors());
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

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
