const express = require('express');
const { google } = require('googleapis');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());

// Google Sheets setup
const auth = new google.auth.GoogleAuth({
  keyFile: 'path/to/your/service-account-key.json', // Replace with your service account key file path
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});

const sheets = google.sheets({ version: 'v4', auth });

// API endpoint
app.post('/api/validate-user', async (req, res) => {
  const { name, id } = req.body;

  if (!name || !id) {
    return res.status(400).json({ error: 'Name and ID are required' });
  }

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Sheet1!A:B', // Adjust based on your sheet structure
    });

    const rows = response.data.values;
    const isValid = rows.some(row => row[0] === name && row[1] === id);

    res.json({ isValid });
  } catch (error) {
    console.error('Error accessing Google Sheet:', error);
    res.status(500).json({ error: 'Failed to validate user' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});