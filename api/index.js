// Vercel serverless function handler
import express from 'express';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { calculatePatientData } from '../src/services/dataCalculator.js';

dotenv.config();

const app = express();
app.use(express.json());

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Please set SUPABASE_URL and SUPABASE_ANON_KEY in Vercel environment variables');
}

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'gava-wrapped' });
});

// Main endpoint: Calculate wrapped data for a profile
app.get('/api/patient/:patientId/data', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(500).json({ 
        error: 'Server configuration error',
        message: 'Supabase credentials not configured. Please set SUPABASE_URL and SUPABASE_ANON_KEY in environment variables.'
      });
    }

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

// Export the Express app for Vercel
export default app;

