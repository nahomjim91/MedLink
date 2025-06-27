// services/ragService.js
const { FaissStore } = require("@langchain/community/vectorstores/faiss");
const { PDFLoader } = require("@langchain/community/document_loaders/fs/pdf");
const { RecursiveCharacterTextSplitter } = require("langchain/text_splitter");
const { createRetrievalChain } = require("langchain/chains/retrieval");
const {
  createStuffDocumentsChain,
} = require("langchain/chains/combine_documents");
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
      documentNotFound: "የተጠየቀው ሰነድ አልተገኘም።",
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
      const openRouterApiKey =
        process.env.OPENROUTER_API_KEY ||
        "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";

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
      const pdfFiles = files.filter((file) =>
        file.toLowerCase().endsWith(".pdf")
      );

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
      const vectorStore = await FaissStore.fromDocuments(
        texts,
        this.embeddings
      );

      // Store the vector store
      this.vectorStores.set(documentKey, {
        vectorStore,
        retriever: vectorStore.asRetriever(),
        filename,
        processedAt: new Date(),
      });

      console.log(`Document ${filename} processed and indexed`);
    } catch (error) {
      console.error(`Error processing document ${filename}:`, error);
      throw error;
    }
  }

  async handleAmharicQuery(question, gender) {
    try {
      // Check if the service is initialized (we need the LLM model)
      if (!this.isInitialized || !this.model) {
        // Return default response if service not ready
        return this.amharicResponses.error;
      }

      // Create a simple prompt for Amharic queries - no context from documents
      const amharicPrompt = ChatPromptTemplate.fromTemplate(
        `You are MedLink Assistant - a supportive telehealth helper for patients and medical staff. You are NOT a doctor and MUST NEVER provide medical advice, diagnoses, or treatment recommendations. Your role is strictly administrative and informational.
**Key Rules:**
1. **Language Handling:**
   - Respond in Amharic if the question is in Amharic
   - Respond to greetings appropriately in Amharic
   - For other languages, respond in English

2. **Medical Boundary:**
   - If medical advice is requested: "ይቅርታ፣ የህክምና እርዳታ ማግኘት ከፈለጉ እባኮትን ባለሙያ ዶክተር ያግኙ"
   - For medication/symptom questions: "ይህን ለመመለስ አልችልም፣ ከባለሙያ ጋር ይወያዩ"

3. **Gender Sensitivity:**
   - Use respectful gender terms: ${gender} (እሷ/እሱ)
   - Example: "እሷ ማድረግ ያለባት..." or "እሱ ማድረግ ያለበት..."

4. **Response Principles:**
   - Helpful for appointments, clinic info, or non-medical guidance
   - For unknown answers: "አላውቅም" (I don't know)
   - Redirect medical queries: "በባለሙያ ዶክተር እንዲታወቁ እመክራለሁ"

5. **Tone:**
   - Formal yet warm Amharic (using እባኮትን፣ አመሰግናለሁ፣ ይቅርታ)
   - Maintain professional boundaries

**Response Template:**
[Appropriate Amharic greeting if applicable]
[Gender-inclusive response] 
[Strictly non-medical information] 
[Medical query disclaimer if needed]

Question: {question}`
      );

      // Create a simple chain without document retrieval
      const amharicChain = amharicPrompt.pipe(this.model);

      // Get response directly from DeepSeek
      const response = await amharicChain.invoke({
        question: question,
      });

      // Extract the content from the response
      let answer;
      if (typeof response === "object" && response.content) {
        answer = response.content;
      } else if (typeof response === "string") {
        answer = response;
      } else {
        answer = response.toString();
      }

      return {
        answer: answer,
        language: "amharic",
        source: "direct_llm", // Indicating this came directly from LLM
        // availableDocuments: this.getAvailableDocuments(),
      };
    } catch (error) {
      console.error("Error in Amharic query handling:", error);
      // Return error message in Amharic
      return {
        answer: this.amharicResponses.error,
        language: "amharic",
        source: "error",
        error: error.message,
      };
    }
  }

  async buildPrompt(question, userType, gender) {
    const isDoctor = userType === "doctor";
    return ChatPromptTemplate.fromTemplate(`
You are MedLink Assistant, a professional telehealth support AI.
  
**User Profile:**
- Type: ${userType}
- Gender: ${gender} (refer to pronoun "${gender === "female" ? "she" : "he"}")

${
  isDoctor
    ? `
**Medical Authority Mode (Doctor):**
1. You may provide evidence-based medical advice, diagnoses, and treatment recommendations.
2. Must reference Ethiopian guidelines (Proclamation No. 916/2015, Medical Ethics Guideline 2010, E‑STGs) when applicable.
3. Include ICD codes, dosage ranges, diagnostic criteria, and citations.
`
    : `
**Patient Support Mode (Patient):**
1. NEVER provide medical advice, diagnoses, or treatment.
2. Redirect all medical questions with:
   "I apologize, this requires medical expertise. Please consult a doctor."
3. Only assist with:
   - Appointment scheduling
   - Clinic information
   - Prescription refill requests
   - Billing inquiries
   - Service explanations
`
}

**Universal Rules:**
- Language: English-only responses.
- Safety: If insufficient context → "Please verify with official sources."; if unsure → "I don't know."
- Attribution: "Information sourced from [Document Name]"

**Context:** {context}
**Question:** {input}

**Response (in ${question.includes("hello") ? "greeting" : "answer"} format):`);
  }
  async handleEnglishQuery(question, gender, userType = "patient") {
    try {
      if (!this.isInitialized) {
        throw new Error("RAG Service not initialized");
      }

      let retriever;
      let contextInfo = "";

      // if (documentName) {
      //   // Query specific document
      //   const documentData = this.vectorStores.get(documentName);
      //   if (!documentData) {
      //     throw new Error(`Document '${documentName}' not found`);
      //   }
      //   retriever = documentData.retriever;
      //   contextInfo = `from document: ${documentData.filename}`;
      // } else {
      // Query all documents - combine retrievers
      retriever = await this.createCombinedRetriever();
      contextInfo = "from all available documents";
      // }

      // Create the RAG chain
      const prompt = await this.buildPrompt(question, userType, gender);

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
        contextInfo,
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
      availableDocuments: this.getAvailableDocuments(),
    };
  }
}

// Create singleton instance
const ragService = new RAGService();

module.exports = ragService;
