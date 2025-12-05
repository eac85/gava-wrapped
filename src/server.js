import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { calculatePatientData } from './services/dataCalculator.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // List of allowed origins
    const allowedOrigins = [
      'https://gava.vercel.app',
      'https://www.gava.vercel.app',
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5173',
      'http://localhost:5174',
      // Add your frontend domains here
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      // For development, allow all origins
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Please set SUPABASE_URL and SUPABASE_ANON_KEY');
  // Don't exit in serverless environment, just log the error
  if (process.env.VERCEL) {
    console.error('Environment variables must be set in Vercel project settings');
  } else {
    process.exit(1);
  }
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

// Export for Vercel serverless functions
export default app;

// Start server locally (not on Vercel)
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Gava Wrapped microservice running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
  });
}

export { supabase };

