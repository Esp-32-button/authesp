// server.js (Backend on Render)

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Setup express app
const app = express();
app.use(bodyParser.json());
app.use(cors());

// Database setup
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// JWT Secret Key
const JWT_SECRET = process.env.JWT_SECRET || 'oqWHRLfwaL5kw04/pBTeNwlZ8R8xZNeGpcWgnRMoZodVRdX6CUdiuTiJApR1WitePXm2HTDSE5sSYQO1AX54rw==';

// Endpoint to handle user registration
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const result = await pool.query(
      'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username',
      [username, hashedPassword]
    );
    res.status(201).json({ user: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'User registration failed' });
  }
});

// Endpoint to handle login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(400).json({ error: 'Incorrect password' });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });
    res.status(200).json({ token });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

let ledState = "OFF";

// Endpoint to get LED state
app.get('/led-state', (req, res) => {
    res.send(ledState);
});

// Endpoint to set LED state
app.post('/control-led', (req, res) => {
    const { state } = req.body;
    if (state === "ON" || state === "OFF") {
        ledState = state;
        console.log(`LED state set to ${state}`);
        res.status(200).send({ message: `LED state set to ${state}` });
    } else {
        res.status(400).send({ message: "Invalid state" });
    }
});

 
// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
