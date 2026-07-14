const path = require('path');
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const postRoutes = require('./routes/postRoutes');
const commentRoutes = require('./routes/commentRoutes');

const app = express();

// Connect to MongoDB Atlas
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api', commentRoutes); // handles /api/posts/:postId/comments and /api/comments/:id

// Any /api/* request that didn't match a route above -> JSON 404
app.use('/api', (req, res) => {
  res.status(404).json({ message: 'API route not found' });
});

// Serve the frontend (static files) from the public folder
app.use(express.static(path.join(__dirname, 'public')));

// Fallback: any non-API GET request returns index.html (simple SPA-style routing)
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`server running on http://localhost:${PORT}`);
});
