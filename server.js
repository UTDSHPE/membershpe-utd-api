const express = require('express');
const { google } = require('googleapis');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT;

// Middleware
app.use(cors());
app.use(express.json());

// Google Sheets setup
const auth = new google.auth.GoogleAuth({
  keyFile: `google_credentials/${process.env.SERVICE_ACCOUNT_PRIVATE_KEY}`, // Replace with your service account key file path
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

// API endpoint
app.post('/api/members', async (req, res) => {
  const { firstName, lastName, netID } = req.body;

  const name = `${firstName} ${lastName}`;
  const altName = `${firstName}, ${lastName}`;

  if (!name || !netID) {
    return res.status(400).json({ error: 'Name and ID are required' });
  }

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Form Responses 1',
    });

    const rows = response.data.values;

    // inconsistent data input will screw this up
    const isValid = rows.some(row => (row[2] === name || row[2] == altName) && row[6].toLowerCase() === `${netID}@utdallas.edu`);

    res.json({ isValid });
  } catch (error) {
    console.error('Error accessing Google Sheet:', error);
    res.status(500).json({ error: 'Failed to validate user' });
  }
});

app.get('/api/members', async (req, res) => {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'Form Responses 1',
  });

  const rows = response.data.values;
  res.status(200).json({rows})
})

app.get('/api/metadata', async (req, res) => {

  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  try {
    const sheetMetadata = await sheets.spreadsheets.get({ auth, spreadsheetId });

    res.send(sheetMetadata.data)
  } catch (error) {
    console.error('Error accessing Google Sheet:', error);
    res.status(500).json({ error: 'Failed to fetch metadata' });
  }
})

// API checking endpoint
app.get('/api/hello', async (req, res) => {
  return res.status(200).json({msg: 'hello world, server is running'})
})

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});