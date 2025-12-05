# Gava Wrapped Microservice

A Node.js microservice that extends the gift giving app by connecting to Supabase and calculating patient data.

## Features

- Connects to Supabase database
- Accepts patient ID and calculates various data metrics
- RESTful API endpoints
- Health check endpoint

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

3. Add your Supabase credentials to `.env`:
```
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
PORT=3000
```

## Running the Service

### Development mode (with auto-reload):
```bash
npm run dev
```

### Production mode:
```bash
npm start
```

The service will run on `http://localhost:3000` (or the port specified in your `.env` file).

## API Endpoints

### Health Check
```
GET /health
```
Returns service status.

### Calculate Wrapped Data
```
GET /api/patient/:patientId/data?year=2024
```
Calculates and returns wrapped data for the specified profile ID and year (year is optional, defaults to current year).

**Example:**
```bash
curl http://localhost:3000/api/patient/123/data
curl http://localhost:3000/api/patient/123/data?year=2023
```

**Response (WrappedData format):**
```json
{
  "profileId": 123,
  "year": 2024,
  "stats": {
    "totalGiftsGiven": 0,
    "totalGiftsReceived": 0,
    "mostExpensiveGift": {
      "title": "",
      "price": 0,
      "thumbnail_url": null
    },
    "totalSpending": 0,
    "peopleExchangedWith": 0,
    "mostPopularCategory": "",
    "giftGivingStreak": 0,
    "santaScore": 0,
    "lastMinutePurchases": 0,
    "mostUsedRetailer": "",
    "homemadeGifts": 0,
    "purchaseTiming": {
      "earlyBird": 0,
      "onTime": 0,
      "lastMinute": 0
    }
  },
  "personalityType": "",
  "personalityReason": ""
}
```

## Next Steps

1. Update `src/services/dataCalculator.js` with your specific calculation queries
2. Add Supabase queries to calculate each stat in the WrappedData structure
3. Implement personality type calculation logic
4. Adjust database table and column names to match your Supabase schema

## Type Definitions

Type definitions are stored in `src/types/`:
- `wrappedData.ts` - TypeScript type definition for WrappedData
- `wrappedData.js` - JSDoc type definitions for JavaScript reference

## Project Structure

```
gava-wrapped/
├── src/
│   ├── server.js              # Main Express server
│   ├── services/
│   │   └── dataCalculator.js  # Data calculation logic
│   └── types/
│       ├── wrappedData.ts     # TypeScript type definitions
│       └── wrappedData.js     # JSDoc type definitions
├── .env.example               # Environment variables template
├── .gitignore
├── package.json
└── README.md
```

