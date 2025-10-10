/**
 * Vercel Serverless Function to proxy Football-Data.org API requests
 * This solves CORS issues by making the API call server-side
 */

const API_TOKEN = '5d3fa40003f344348367b02809980cc6';
const FOOTBALL_DATA_API = 'https://api.football-data.org/v4';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Extract competition and season from query parameters
    const { competition, season } = req.query;

    if (!competition) {
      return res.status(400).json({ error: 'Competition parameter is required' });
    }

    if (!season) {
      return res.status(400).json({ error: 'Season parameter is required' });
    }

    // Build Football-Data.org API URL
    const url = `${FOOTBALL_DATA_API}/competitions/${competition}/matches?season=${season}`;

    console.log(`Proxying request to: ${url}`);

    // Make the request to Football-Data.org
    const response = await fetch(url, {
      headers: {
        'X-Auth-Token': API_TOKEN
      }
    });

    if (!response.ok) {
      throw new Error(`Football-Data.org API returned ${response.status}`);
    }

    const data = await response.json();

    // Return the data with proper CORS headers
    res.status(200).json(data);
  } catch (error) {
    console.error('Error proxying Football-Data.org API:', error);
    res.status(500).json({
      error: 'Failed to fetch from Football-Data.org',
      message: error.message
    });
  }
}
