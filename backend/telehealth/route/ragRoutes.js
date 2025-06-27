// route/ragRoutes.js
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs").promises;
const ragService = require("../services/ragService");

const router = express.Router();

// Configure multer for PDF uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const documentsPath = path.join(__dirname, "../documents");
    try {
      await fs.access(documentsPath);
    } catch {
      await fs.mkdir(documentsPath, { recursive: true });
    }
    cb(null, documentsPath);
  },
  filename: (req, file, cb) => {
    // Keep original filename
    cb(null, file.originalname);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Main query endpoint
router.post("/query", async (req, res) => {
  try {
    const { question, language = "english", documentName = null } = req.body;

    if (!question) {
      return res.status(400).json({
        success: false,
        error: "Question is required"
      });
    }

    // Validate language
    if (!["english", "amharic"].includes(language.toLowerCase())) {
      return res.status(400).json({
        success: false,
        error: "Language must be either 'english' or 'amharic'"
      });
    }

    let result;

    if (language.toLowerCase() === "amharic") {
      // Handle Amharic query directly
      const answer = await ragService.handleAmharicQuery(question);
      result = {
        answer,
        language: "amharic",
        availableDocuments: ragService.getAvailableDocuments()
      };
    } else {
      // Handle English query with RAG
      const ragResult = await ragService.handleEnglishQuery(question, documentName);
      result = {
        ...ragResult,
        language: "english",
        availableDocuments: ragService.getAvailableDocuments()
      };
    }

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error("RAG query error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Internal server error"
    });
  }
});

// Service status endpoint
router.get("/status", async (req, res) => {
  try {
    const status = ragService.getServiceStatus();
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error("Status check error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to get service status"
    });
  }
});

// Initialize service endpoint (for manual initialization if needed)
router.post("/initialize", async (req, res) => {
  try {
    if (!ragService.isInitialized) {
      await ragService.initialize();
    }
    
    const status = ragService.getServiceStatus();
    res.json({
      success: true,
      message: "RAG service initialized successfully",
      data: status
    });
  } catch (error) {
    console.error("Service initialization error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to initialize service"
    });
  }
});

module.exports = router;
