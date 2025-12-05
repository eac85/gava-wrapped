import express from 'express';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { calculatePatientData } from './services/dataCalculator.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Please set SUPABASE_URL and SUPABASE_ANON_KEY in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'gava-wrapped' });
});

// Main endpoint: Calculate wrapped data for a profile
app.get('/api/patient/:patientId/data', async (req, res) => {
  try {
    const { patientId } = req.params;
    const { year } = req.query;

    if (!patientId) {
      return res.status(400).json({ error: 'Patient ID is required' });
    }

    // Parse year from query or use current year
    const yearParam = year ? parseInt(year) : new Date().getFullYear();

    // Calculate wrapped data
    const wrappedData = await calculatePatientData(supabase, patientId, yearParam);

    res.json(wrappedData);
  } catch (error) {
    console.error('Error calculating wrapped data:', error);
    res.status(500).json({ 
      error: 'Failed to calculate wrapped data',
      message: error.message 
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Gava Wrapped microservice running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

export { supabase };

