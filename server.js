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
  keyFile: `${process.env.SERVICE_ACCOUNT_PRIVATE_KEY}`, // Replace with your service account key file path
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

// API endpoint to validate members
app.post('/api/membershpe', async (req, res) => {
  const { name, netID } = req.body;

  const words = name.replace(/,/g, '').trim().split(/\s+/);
  const altName = `${words[0]} ${words[words.length - 1]}`;

  if (!name || !netID) {
    return res.status(400).json({ error: 'Name and ID are required' });
  }

  try {

    // request rows from membership form
    const signUpSheetResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.RESPONSES_GOOGLE_SHEET_ID,
      range: 'Form Responses 1',
    });
    const signUpSheetRows = signUpSheetResponse.data.values;
    const signedUp = signUpSheetRows.some(row => 
      (row[2].toLowerCase().replace(/^[^a-zA-Z]+|[^a-zA-Z]+$/g, '').replace(/,/g, '') === name.toLowerCase() ||
      row[2].toLowerCase().replace(/^[^a-zA-Z]+|[^a-zA-Z]+$/g, '').replace(/,/g, '') == altName.toLowerCase()) &&
      row[6].toLowerCase().replace(/,/g, '') === `${netID.toLowerCase()}@utdallas.edu`
    );

    // request rows from paid dues sheet
    const paidDuesSheetResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.PAID_DUES_GOOGLE_SHEET_ID,
      range: 'Sheet1',
    });
    const paidDuesSheetRows = paidDuesSheetResponse.data.values;
    const paid = paidDuesSheetRows.some(row =>
      (row[0].toLowerCase().replace(/^[^a-zA-Z]+|[^a-zA-Z]+$/g, '').replace(/,/g, '') === name.toLowerCase() ||
      row[0].toLowerCase().replace(/^[^a-zA-Z]+|[^a-zA-Z]+$/g, '').replace(/,/g, '') == altName.toLowerCase()) &&
      row[1].toLowerCase().replace(/,/g, '') === netID && row[3].toLowerCase() === 'true'
    );

    res.json({ signedUp, paid });
  } catch (error) {
    console.error('Error accessing member in Google Sheet:', error);
    res.status(500).json({ error: 'Failed to validate user' });
  }
});

app.get('/api/responses/rows', async (req, res) => {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.RESPONSES_GOOGLE_SHEET_ID,
    range: 'Form Responses 1',
  });

  const rows = response.data.values;
  res.status(200).json({ rows })
})

app.get('/api/responses', async (req, res) => {

  const spreadsheetId = process.env.RESPONSES_GOOGLE_SHEET_ID;
  try {
    const sheetMetadata = await sheets.spreadsheets.get({ auth, spreadsheetId });

    res.send(sheetMetadata.data)
  } catch (error) {
    console.error('Error accessing Google Sheet:', error);
    res.status(500).json({ error: 'Failed to fetch metadata' });
  }
})

app.get('/api/dues/rows', async (req, res) => {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.PAID_DUES_GOOGLE_SHEET_ID,
    range: 'Sheet1',
  });

  const rows = response.data.values;
  res.status(200).json({ rows })
})


app.get('/api/dues', async (req, res) => {

  const spreadsheetId = process.env.PAID_DUES_GOOGLE_SHEET_ID;
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
  return res.status(200).json({ msg: 'hello world, server is running' })
})

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});