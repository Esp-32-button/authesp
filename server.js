const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// PostgreSQL connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }, // Required for Supabase
});

// Secret key for JWT
const JWT_SECRET = 'oqWHRLfwaL5kw04/pBTeNwlZ8R8xZNeGpcWgnRMoZodVRdX6CUdiuTiJApR1WitePXm2HTDSE5sSYQO1AX54rw==';

// User Registration
app.post('/register', async (req, res) => {
    const { email, password } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query(
            'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING *',
            [email, hashedPassword]
        );
        res.status(201).json({ message: 'User registered successfully', user: result.rows[0] });
    } catch (error) {
        res.status(400).json({ error: 'User already exists or invalid input' });
    }
});

// User Login
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            return res.status(400).json({ error: 'User not found' });
        }

        const user = result.rows[0];
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(400).json({ error: 'Invalid password' });
        }

        const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ message: 'Login successful', token });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// LED State Management
let ledState = "OFF";

app.get('/led', (req, res) => {
    res.json({ ledState });
});

app.post('/led', (req, res) => {
    const { state } = req.body;
    if (state === "ON" || state === "OFF") {
        ledState = state;
        res.json({ message: `LED state set to ${state}` });
    } else {
        res.status(400).json({ error: "Invalid state" });
    }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

