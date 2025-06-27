// services/ragService.js
const { FaissStore } = require("@langchain/community/vectorstores/faiss");
const { PDFLoader } = require("@langchain/community/document_loaders/fs/pdf");
const { RecursiveCharacterTextSplitter } = require("langchain/text_splitter");
const { createRetrievalChain } = require("langchain/chains/retrieval");
const { createStuffDocumentsChain } = require("langchain/chains/combine_documents");
const { ChatPromptTemplate } = require("@langchain/core/prompts");
const { ChatOpenAI } = require("@langchain/openai");
const { MedLinkEmbeddings } = require("../../utils/MedLinkEmbeddings");
const fs = require("fs").promises;
const path = require("path");

class RAGService {
  constructor() {
    this.vectorStores = new Map(); // Store multiple vector stores for different documents
    this.embeddings = null;
    this.model = null;
    this.isInitialized = false;
    this.documentsPath = path.join(__dirname, "../documents");
    
    // Amharic responses for common scenarios
    this.amharicResponses = {
      greeting: "ሀሎ! እንዴት ልረዳዎት እችላለሁ?",
      help: "በምን ልረዳዎት እችላለሁ? ጥያቄዎን በአማርኛ ይጠይቁ።",
      error: "ይቅርታ፣ አንድ ስህተት ተከስቷል። እንደገና ይሞክሩ።",
      noUnderstand: "ይቅርታ፣ ጥያቄዎን አልተረዳሁም። እባክዎን በግልጽ ይጠይቁ።",
      processing: "እባክዎን ይጠብቁ፣ ጥያቄዎን እየሰራሁ ነው...",
      documentNotFound: "የተጠየቀው ሰነድ አልተገኘም።"
    };
  }

  async initialize() {
    try {
      console.log("Initializing RAG Service...");
      
      // Initialize embedding model
      console.log("Loading embedding model...");
      this.embeddings = new MedLinkEmbeddings();
      console.log("Embedding model loaded.");

      // Initialize LLM
      const openRouterApiKey = process.env.OPENROUTER_API_KEY || "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";
      
      this.model = new ChatOpenAI({
        modelName: "deepseek/deepseek-chat-v3-0324:free",
        openAIApiKey: openRouterApiKey,
        configuration: {
          baseURL: "https://openrouter.ai/api/v1",
        },
      });

      // Load all documents from the documents folder
      await this.loadAllDocuments();
      
      this.isInitialized = true;
      console.log("RAG Service initialized successfully.");
    } catch (error) {
      console.error("Failed to initialize RAG Service:", error);
      throw error;
    }
  }

  async loadAllDocuments() {
    try {
      // Create documents directory if it doesn't exist
      await this.ensureDocumentsDirectory();
      
      // Get all PDF files from documents directory
      const files = await fs.readdir(this.documentsPath);
      const pdfFiles = files.filter(file => file.toLowerCase().endsWith('.pdf'));
      
      console.log(`Found ${pdfFiles.length} PDF files to process`);
      
      for (const pdfFile of pdfFiles) {
        await this.processDocument(pdfFile);
      }
      
      console.log(`Processed ${pdfFiles.length} documents successfully`);
    } catch (error) {
      console.error("Error loading documents:", error);
      throw error;
    }
  }

  async ensureDocumentsDirectory() {
    try {
      await fs.access(this.documentsPath);
    } catch {
      await fs.mkdir(this.documentsPath, { recursive: true });
      console.log(`Created documents directory: ${this.documentsPath}`);
    }
  }

  async processDocument(filename) {
    try {
      const filePath = path.join(this.documentsPath, filename);
      const documentKey = path.parse(filename).name; // Use filename without extension as key
      
      console.log(`Processing document: ${filename}`);
      
      // Load PDF
      const loader = new PDFLoader(filePath);
      const docs = await loader.load();
      
      // Split into chunks
      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
      });
      const texts = await splitter.splitDocuments(docs);
      
      // Create vector store for this document
      const vectorStore = await FaissStore.fromDocuments(texts, this.embeddings);
      
      // Store the vector store
      this.vectorStores.set(documentKey, {
        vectorStore,
        retriever: vectorStore.asRetriever(),
        filename,
        processedAt: new Date()
      });
      
      console.log(`Document ${filename} processed and indexed`);
    } catch (error) {
      console.error(`Error processing document ${filename}:`, error);
      throw error;
    }
  }

  async handleAmharicQuery(question) {

    const lowerQuestion = question.toLowerCase();
    
    if (lowerQuestion.includes('ሰላም') || lowerQuestion.includes('ሀሎ')) {
      return this.amharicResponses.greeting;
    }
    
    if (lowerQuestion.includes('እርዳታ') || lowerQuestion.includes('ረዳ')) {
      return this.amharicResponses.help;
    }
    
    // For now, return a generic help message for Amharic queries
    return `${this.amharicResponses.help}\n\nየሚገኙ ሰነዶች baba:\n${this.getAvailableDocuments().map(doc => `• ${doc}`).join('\n')}`;
  }

  async handleEnglishQuery(question, documentName = null) {
    try {
      if (!this.isInitialized) {
        throw new Error("RAG Service not initialized");
      }

      let retriever;
      let contextInfo = "";

      if (documentName) {
        // Query specific document
        const documentData = this.vectorStores.get(documentName);
        if (!documentData) {
          throw new Error(`Document '${documentName}' not found`);
        }
        retriever = documentData.retriever;
        contextInfo = `from document: ${documentData.filename}`;
      } else {
        // Query all documents - combine retrievers
        retriever = await this.createCombinedRetriever();
        contextInfo = "from all available documents";
      }

      // Create the RAG chain
      const prompt = ChatPromptTemplate.fromTemplate(
        `Answer the user's question: {input} based on the following context: {context}\n\nProvide a comprehensive answer and mention which document(s) the information comes from if relevant.`
      );

      const combineDocsChain = await createStuffDocumentsChain({
        llm: this.model,
        prompt,
      });

      const chain = await createRetrievalChain({
        combineDocsChain,
        retriever,
      });

      const response = await chain.invoke({
        input: question,
      });

      return {
        answer: response.answer,
        sourceDocuments: response.context || [],
        contextInfo
      };
    } catch (error) {
      console.error("Error in English query handling:", error);
      throw error;
    }
  }

  async createCombinedRetriever() {
    // For simplicity, we'll use the first available retriever
    // In a more sophisticated implementation, you might want to combine multiple retrievers
    const retrievers = Array.from(this.vectorStores.values());
    if (retrievers.length === 0) {
      throw new Error("No documents available");
    }
    
    // Return the first retriever for now
    // You could implement a more sophisticated combination strategy here
    return retrievers[0].retriever;
  }

  getAvailableDocuments() {
    return Array.from(this.vectorStores.keys());
  }

  async addNewDocument(filename) {
    try {
      await this.processDocument(filename);
      return true;
    } catch (error) {
      console.error("Error adding new document:", error);
      return false;
    }
  }

  async removeDocument(documentName) {
    try {
      if (this.vectorStores.has(documentName)) {
        this.vectorStores.delete(documentName);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error removing document:", error);
      return false;
    }
  }

  getServiceStatus() {
    return {
      initialized: this.isInitialized,
      documentsLoaded: this.vectorStores.size,
      availableDocuments: this.getAvailableDocuments()
    };
  }
}

// Create singleton instance
const ragService = new RAGService();

module.exports = ragService;

