/**
 * Vercel Serverless Function to proxy TheSportsDB API requests
 * This solves CORS issues by making the API call server-side
 */

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
    // Extract endpoint and query parameters from request
    const { endpoint, ...queryParams } = req.query;

    if (!endpoint) {
      return res.status(400).json({ error: 'Endpoint parameter is required' });
    }

    // Build TheSportsDB API URL
    const THESPORTSDB_API = 'https://www.thesportsdb.com/api/v1/json/3';
    const url = new URL(`${THESPORTSDB_API}/${endpoint}`);

    // Add query parameters to the URL
    Object.entries(queryParams).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    console.log(`Proxying request to: ${url.toString()}`);

    // Make the request to TheSportsDB
    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`TheSportsDB API returned ${response.status}`);
    }

    const data = await response.json();

    // Return the data with proper CORS headers
    res.status(200).json(data);
  } catch (error) {
    console.error('Error proxying TheSportsDB API:', error);
    res.status(500).json({
      error: 'Failed to fetch from TheSportsDB',
      message: error.message
    });
  }
}
