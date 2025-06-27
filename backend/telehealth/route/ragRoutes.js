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
    const { question, language = "english", gender , userType} = req.body;
    console.log("gender" , gender , "userType" , userType)

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
      // Handle Amharic query with direct DeepSeek call
      result = await ragService.handleAmharicQuery(question, gender);
      
      // If result is just a string (backward compatibility), wrap it
      if (typeof result === 'string') {
        result = {
          answer: result,
          language: "amharic",
          source: "direct_llm",
        //   availableDocuments: ragService.getAvailableDocuments()
        };
      }
    } else {
      // Handle English query with RAG
      const ragResult = await ragService.handleEnglishQuery(question, gender , userType);
      result = {
        ...ragResult,
        language: "english",
        source: "rag",
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
