// models/prescriptionModels.js
const { db } = require("../config/firebase");
const { formatDoc, sanitizeInput, timestamp } = require("../../utils/helpers");
const crypto = require("crypto");

// Collection reference
const prescriptionsRef = db.collection("prescriptions");

// Encryption configuration
const ENCRYPTION_KEY = "mohiles"; // Your specified key
const ALGORITHM = "aes-256-cbc";

/**
 * Encryption utilities
 */
const encryptionUtils = {
  /**
   * Encrypt sensitive data
   * @param {string} text - Text to encrypt
   * @returns {string} Encrypted text
   */
  encrypt(text) {
    if (!text) return text;

    const key = crypto.createHash("sha256").update(ENCRYPTION_KEY).digest(); // 32 bytes
    const iv = crypto.randomBytes(16); // 16 bytes for AES

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");

    return iv.toString("hex") + ":" + encrypted;
  },

  decrypt(encryptedText) {
    if (!encryptedText) return encryptedText;

    try {
      const key = crypto.createHash("sha256").update(ENCRYPTION_KEY).digest();
      const [ivHex, encrypted] = encryptedText.split(":");
      const iv = Buffer.from(ivHex, "hex");

      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
      let decrypted = decipher.update(encrypted, "hex", "utf8");
      decrypted += decipher.final("utf8");

      return decrypted;
    } catch (error) {
      console.error("Decryption error:", error);
      return encryptedText;
    }
  },

  /**
   * Encrypt medication object
   * @param {Object} medication - Medication object
   * @returns {Object} Encrypted medication object
   */
  encryptMedication(medication) {
    return {
      ...medication,
      drugName: this.encrypt(medication.drugName),
      dosage: this.encrypt(medication.dosage),
      route: this.encrypt(medication.route),
      frequency: this.encrypt(medication.frequency),
      duration: this.encrypt(medication.duration),
      instructions: this.encrypt(medication.instructions),
    };
  },

  /**
   * Decrypt medication object
   * @param {Object} medication - Encrypted medication object
   * @returns {Object} Decrypted medication object
   */
  decryptMedication(medication) {
    return {
      ...medication,
      drugName: this.decrypt(medication.drugName),
      dosage: this.decrypt(medication.dosage),
      route: this.decrypt(medication.route),
      frequency: this.decrypt(medication.frequency),
      duration: this.decrypt(medication.duration),
      instructions: this.decrypt(medication.instructions),
    };
  },
};

/**
 * Prescription model
 */
const PrescriptionModel = {
  /**
   * Create a new prescription
   * @param {Object} prescriptionData - Prescription data
   * @returns {Object} Created prescription
   */
  async create(prescriptionData) {
    try {
      const sanitizedData = sanitizeInput(prescriptionData);

      // Encrypt medications
      const encryptedMedications = sanitizedData.medications.map((med) =>
        encryptionUtils.encryptMedication(med)
      );

      // Encrypt recommendations
      const encryptedRecommendations = sanitizedData.recommendations
        ? encryptionUtils.encrypt(sanitizedData.recommendations)
        : null;

      // Prepare prescription document
      const prescriptionDoc = {
        appointmentId: sanitizedData.appointmentId,
        patientDetails: {
          patientId: sanitizedData.patientDetails.patientId,
          name: sanitizedData.patientDetails.name,
          profileImage: sanitizedData.patientDetails.profileImage || null,
        },
        doctorDetails: {
          doctorId: sanitizedData.doctorDetails.doctorId,
          name: sanitizedData.doctorDetails.name,
          profileImage: sanitizedData.doctorDetails.profileImage || null,
        },
        medications: encryptedMedications,
        recommendations: encryptedRecommendations,
        createdAt: timestamp(),
        updatedAt: timestamp(),
      };

      // Create prescription document
      const prescriptionRef = prescriptionsRef.doc();
      await prescriptionRef.set(prescriptionDoc);

      // Get the created document
      const createdDoc = await prescriptionRef.get();
      const formattedDoc = formatDoc(createdDoc);

      // Decrypt before returning
      return this.decryptPrescription(formattedDoc);
    } catch (error) {
      console.error("Error creating prescription:", error);
      throw error;
    }
  },

  /**
   * Get prescription by ID
   * @param {string} prescriptionId - Prescription ID
   * @returns {Object} Prescription data
   */
  async getById(prescriptionId) {
    try {
      const doc = await prescriptionsRef.doc(prescriptionId).get();
      const prescription = formatDoc(doc);

      if (!prescription) return null;

      // Decrypt prescription before returning
      return this.decryptPrescription(prescription);
    } catch (error) {
      console.error("Error getting prescription by ID:", error);
      throw error;
    }
  },

  async allPrescriptions() {
    try {
      const snapshot = await prescriptionsRef
        .orderBy("createdAt", "desc")
        .get();

      if (snapshot.empty) return [];

      const prescriptions = snapshot.docs.map((doc) => formatDoc(doc));

      // Decrypt all prescriptions before returning
      return prescriptions.map((prescription) =>
        this.decryptPrescription(prescription)
      );
    } catch (error) {
      console.error("Error getting prescriptions by appointment ID:", error);
      throw error;
    }
  },
  /**
   * Get prescriptions by appointment ID
   * @param {string} appointmentId - Appointment ID
   * @returns {Array} Array of prescriptions
   */
  async getByAppointmentId(appointmentId) {
    try {
      const snapshot = await prescriptionsRef
        .where("appointmentId", "==", appointmentId)
        .orderBy("createdAt", "desc")
        .get();

      if (snapshot.empty) return [];

      const prescriptions = snapshot.docs.map((doc) => formatDoc(doc));

      // Decrypt all prescriptions before returning
      return prescriptions.map((prescription) =>
        this.decryptPrescription(prescription)
      );
    } catch (error) {
      console.error("Error getting prescriptions by appointment ID:", error);
      throw error;
    }
  },

  /**
   * Get prescriptions by patient ID
   * @param {string} patientId - Patient ID
   * @returns {Array} Array of prescriptions
   */
  async getByPatientId(patientId) {
    try {
      const snapshot = await prescriptionsRef
        .where("patientDetails.patientId", "==", patientId)
        .orderBy("createdAt", "desc")
        .get();

      if (snapshot.empty) return [];

      const prescriptions = snapshot.docs.map((doc) => formatDoc(doc));

      // Decrypt all prescriptions before returning
      return prescriptions.map((prescription) =>
        this.decryptPrescription(prescription)
      );
    } catch (error) {
      console.error("Error getting prescriptions by patient ID:", error);
      throw error;
    }
  },

  /**
   * Get prescriptions by doctor ID
   * @param {string} doctorId - Doctor ID
   * @returns {Array} Array of prescriptions
   */
  async getByDoctorId(doctorId) {
    try {
      const snapshot = await prescriptionsRef
        .where("doctorDetails.doctorId", "==", doctorId)
        .orderBy("createdAt", "desc")
        .get();

      if (snapshot.empty) return [];

      const prescriptions = snapshot.docs.map((doc) => formatDoc(doc));

      // Decrypt all prescriptions before returning
      return prescriptions.map((prescription) =>
        this.decryptPrescription(prescription)
      );
    } catch (error) {
      console.error("Error getting prescriptions by doctor ID:", error);
      throw error;
    }
  },

  /**
   * Decrypt prescription data
   * @param {Object} prescription - Encrypted prescription
   * @returns {Object} Decrypted prescription
   */
  decryptPrescription(prescription) {
    if (!prescription) return prescription;

    return {
      ...prescription,
      medications: prescription.medications.map((med) =>
        encryptionUtils.decryptMedication(med)
      ),
      recommendations: prescription.recommendations
        ? encryptionUtils.decrypt(prescription.recommendations)
        : null,
    };
  },
};

module.exports = PrescriptionModel;
