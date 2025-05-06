/**
 * MedLink Backend - Main Entry Point
 * This file initializes all subprojects and microservices
 */
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Create main Express application
const app = express();

// Configure middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic health check for main API
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'MedLink API is running',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Initialize the telehealth subproject
const initializeTelehealthServer = require('./telehealth/server');

// Initialize telehealth as middleware on the main app
(async () => {
  try {
    const telehealthServer = await initializeTelehealthServer(app);
    console.log('Telehealth server initialized successfully');
  } catch (error) {
    console.error('Failed to initialize telehealth server:', error);
  }
})();

// Start main server
const PORT = process.env.MAIN_PORT || 4000;
app.listen(PORT, () => {
  console.log(`
=====================================================
🏥 MedLink Main API Server running on port ${PORT}
=====================================================
  `);
});

module.exports = app;

