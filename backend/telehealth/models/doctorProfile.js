/**
 * Doctor profile model for MedLink telehealth
 */
const { db } = require("../config/firebase");
const {
  formatDoc,
  formatDocs,
  sanitizeInput,
  paginationParams,
  timestamp,
} = require("../../utils/helpers");

// Collection reference
const doctorsRef = db.collection("doctorProfiles");
const thUsersRef = db.collection("thUsers");

/**
 * Doctor profile model
 */
const DoctorProfileModel = {
  /**
   * Get doctor profile by ID
   * @param {String} id - Doctor ID
   * @returns {Object} Doctor profile data
   */
  async getById(id) {
    try {
      const doc = await doctorsRef.doc(id).get();
      return formatDoc(doc);
    } catch (error) {
      console.error("Error getting doctor profile by ID:", error);
      throw error;
    }
  },

  /**
   * Get doctors by specialization
   * @param {String} specialization - Specialization
   * @returns {Array} Doctor profiles
   */
  async getBySpecialization(specialization) {
    try {
      const snapshot = await doctorsRef
        .where("specialization", "array-contains", specialization)
        .where("isApproved", "==", true)
        .orderBy("experienceYears", "desc")
        .get();

        // console.log(snapshot.docs.length);

      return formatDocs(snapshot.docs);
    } catch (error) {
      console.error("Error getting doctors by specialization:", error);
      throw error;
    }
  },
  /**
   * Get all approved doctors
   * @param {Number} limit - Number of doctors to return
   * @param {Number} offset - Offset for pagination
   * @returns {Array} Doctor profiles
   */
  async getAllApproved(limit, offset) {
    try {
      const { limit: limitVal, offset: offsetVal } = paginationParams(
        limit,
        offset
      );

      let query = doctorsRef
        .where("isApproved", "==", true)
        .orderBy("experienceYears", "desc");

      // Apply pagination
      if (offsetVal > 0) {
        // Get the last document from the previous page
        const prevPageSnapshot = await doctorsRef
          .where("isApproved", "==", true)
          .orderBy("experienceYears", "desc")
          .limit(offsetVal)
          .get();

        const lastDoc = prevPageSnapshot.docs[prevPageSnapshot.docs.length - 1];
        if (lastDoc) {
          query = query.startAfter(lastDoc);
        }
      }

      // Apply limit
      query = query.limit(limitVal);

      const snapshot = await query.get();
      return formatDocs(snapshot.docs);
    } catch (error) {
      console.error("Error getting all approved doctors:", error);
      throw error;
    }
  },

  // Add these new methods to your existing DoctorProfileModel

/**
 * Filter doctors with specific criteria
 * @param {Object} filter - Filter parameters
 * @param {Number} limit - Number of results to return
 * @param {Number} offset - Offset for pagination
 * @returns {Object} Filtered results
 */
async filterDoctors(filter, limit = 20, offset = 0) {
  try {
    let query = doctorsRef.where("isApproved", "==", true);

    // Apply filters that exist in doctorProfiles
    if (filter.specializations && filter.specializations.length > 0) {
      query = query.where(
        "specialization",
        "array-contains-any",
        filter.specializations
      );
    }

    if (filter.experienceRange) {
      if (filter.experienceRange.min !== undefined) {
        query = query.where(
          "experienceYears",
          ">=",
          filter.experienceRange.min
        );
      }
      if (filter.experienceRange.max !== undefined) {
        query = query.where(
          "experienceYears",
          "<=",
          filter.experienceRange.max
        );
      }
    }

    if (filter.priceRange) {
      if (filter.priceRange.min !== undefined) {
        query = query.where("pricePerSession", ">=", filter.priceRange.min);
      }
      if (filter.priceRange.max !== undefined) {
        query = query.where("pricePerSession", "<=", filter.priceRange.max);
      }
    }

    if (filter.rating !== undefined) {
      query = query.where("averageRating", ">=", filter.rating);
    }

    // Default sorting by experience
    query = query.orderBy("experienceYears", "desc");

    const snapshot = await query.get();
    let doctors = formatDocs(snapshot.docs);

    // Get user data for each doctor
    const doctorIds = doctors.map(doctor => doctor.doctorId);
    const userPromises = doctorIds.map(id => thUsersRef.doc(id).get());
    const userDocs = await Promise.all(userPromises);
    
    // Merge user data with doctor profiles
    doctors = doctors.map((doctor, index) => {
      const userData = userDocs[index].exists ? userDocs[index].data() : {};
      return {
        ...doctor,
        user: userData,
        displayName: userData.firstName && userData.lastName 
          ? `${userData.firstName} ${userData.lastName}` 
          : userData.displayName,
        gender: userData.gender,
        profileImageUrl: userData.profileImageUrl
      };
    });

    // Apply gender filter (from user data)
    if (filter.gender) {
      doctors = doctors.filter(doctor => doctor.user.gender === filter.gender);
    }

    // Apply pagination
    const totalCount = doctors.length;
    const paginatedDoctors = doctors.slice(offset, offset + limit);

    return {
      doctors: paginatedDoctors,
      totalCount,
      hasMore: offset + limit < totalCount,
    };
  } catch (error) {
    console.error("Error filtering doctors:", error);
    throw error;
  }
},

/**
 * Search doctors with comprehensive filtering and sorting
 * @param {Object} searchInput - Search parameters
 * @param {Number} limit - Number of results to return
 * @param {Number} offset - Offset for pagination
 * @returns {Object} Search results with doctors and metadata
 */
async searchDoctors(searchInput, limit = 20, offset = 0) {
  try {
    let query = doctorsRef.where("isApproved", "==", true);

    // Apply filters that exist in doctorProfiles
    if (searchInput.specialization && searchInput.specialization.length > 0) {
      query = query.where(
        "specialization",
        "array-contains-any",
        searchInput.specialization
      );
    }

    if (searchInput.minExperience !== undefined) {
      query = query.where("experienceYears", ">=", searchInput.minExperience);
    }

    if (searchInput.maxExperience !== undefined) {
      query = query.where("experienceYears", "<=", searchInput.maxExperience);
    }

    if (searchInput.minPrice !== undefined) {
      query = query.where("pricePerSession", ">=", searchInput.minPrice);
    }

    if (searchInput.maxPrice !== undefined) {
      query = query.where("pricePerSession", "<=", searchInput.maxPrice);
    }

    if (searchInput.minRating !== undefined) {
      query = query.where("averageRating", ">=", searchInput.minRating);
    }

    // Apply sorting
    const sortBy = searchInput.sortBy || "experienceYears";
    const sortOrder = searchInput.sortOrder || "desc";

    switch (sortBy) {
      case "rating":
        query = query.orderBy("averageRating", sortOrder);
        break;
      case "experience":
        query = query.orderBy("experienceYears", sortOrder);
        break;
      case "price":
        query = query.orderBy("pricePerSession", sortOrder);
        break;
      default:
        query = query.orderBy("experienceYears", sortOrder);
    }

    // Get doctors first
    const snapshot = await query.get();
    let doctors = formatDocs(snapshot.docs);

    // Get user data for each doctor
    const doctorIds = doctors.map(doctor => doctor.doctorId);
    const userPromises = doctorIds.map(id => thUsersRef.doc(id).get());
    const userDocs = await Promise.all(userPromises);
    
    // Merge user data with doctor profiles
    doctors = doctors.map((doctor, index) => {
      const userData = userDocs[index].exists ? userDocs[index].data() : {};
      return {
        ...doctor,
        user: userData,
        displayName: userData.firstName && userData.lastName 
          ? `${userData.firstName} ${userData.lastName}` 
          : userData.displayName,
        gender: userData.gender,
        profileImageUrl: userData.profileImageUrl
      };
    });

    // Apply filters that depend on user data
    if (searchInput.gender) {
      doctors = doctors.filter(doctor => doctor.user.gender === searchInput.gender);
    }

    // Apply text search (client-side filtering)
    if (searchInput.searchTerm) {
      const searchTerm = searchInput.searchTerm.toLowerCase();
      doctors = doctors.filter(
        (doctor) =>
          (doctor.displayName &&
            doctor.displayName.toLowerCase().includes(searchTerm)) ||
          (doctor.aboutMe &&
            doctor.aboutMe.toLowerCase().includes(searchTerm)) ||
          (doctor.specialization &&
            doctor.specialization.some((spec) =>
              spec.toLowerCase().includes(searchTerm)
            )) ||
          (doctor.user.firstName &&
            doctor.user.firstName.toLowerCase().includes(searchTerm)) ||
          (doctor.user.lastName &&
            doctor.user.lastName.toLowerCase().includes(searchTerm))
      );
    }

    // Apply sorting for name-based sorting (client-side)
    if (sortBy === "name") {
      doctors.sort((a, b) => {
        const nameA = a.displayName || "";
        const nameB = b.displayName || "";
        return sortOrder === "asc" 
          ? nameA.localeCompare(nameB)
          : nameB.localeCompare(nameA);
      });
    }

    // Apply pagination to final results
    const totalCount = doctors.length;
    const paginatedDoctors = doctors.slice(offset, offset + limit);

    return {
      doctors: paginatedDoctors,
      totalCount,
      hasMore: offset + limit < totalCount,
    };
  } catch (error) {
    console.error("Error searching doctors:", error);
    throw error;
  }
},

  /**
   * Get all unique specializations
   * @returns {Array} List of specializations
   */
  async getAllSpecializations() {
    try {
      const snapshot = await doctorsRef
        .where("isApproved", "==", true)
        .select("specialization")
        .get();

      const specializationsSet = new Set();

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (data.specialization && Array.isArray(data.specialization)) {
          data.specialization.forEach((spec) => specializationsSet.add(spec));
        }
      });

      return Array.from(specializationsSet).sort();
    } catch (error) {
      console.error("Error getting specializations:", error);
      throw error;
    }
  },

  /**
   * Get doctors by multiple criteria (enhanced version)
   * @param {Object} criteria - Search criteria
   * @returns {Array} Matching doctors
   */
  async getByMultipleCriteria(criteria) {
    try {
      let query = doctorsRef.where("isApproved", "==", true);

      // Build query based on criteria
      Object.keys(criteria).forEach((key) => {
        if (criteria[key] !== undefined && criteria[key] !== null) {
          switch (key) {
            case "specializations":
              if (Array.isArray(criteria[key]) && criteria[key].length > 0) {
                query = query.where(
                  "specialization",
                  "array-contains-any",
                  criteria[key]
                );
              }
              break;
            case "minExperience":
              query = query.where("experienceYears", ">=", criteria[key]);
              break;
            case "maxExperience":
              query = query.where("experienceYears", "<=", criteria[key]);
              break;
            case "minPrice":
              query = query.where("pricePerSession", ">=", criteria[key]);
              break;
            case "maxPrice":
              query = query.where("pricePerSession", "<=", criteria[key]);
              break;
            case "minRating":
              query = query.where("averageRating", ">=", criteria[key]);
              break;
            case "gender":
              query = query.where("gender", "==", criteria[key]);
              break;
          }
        }
      });

      const snapshot = await query.orderBy("experienceYears", "desc").get();
      return formatDocs(snapshot.docs);
    } catch (error) {
      console.error("Error getting doctors by multiple criteria:", error);
      throw error;
    }
  },

  /**
   * Create doctor profile
   * @param {String} doctorId - Doctor ID
   * @param {Object} data - Doctor profile data
   * @param {Object} transaction - Firestore transaction (optional)
   * @returns {Object} Created doctor profile
   */
  async create(doctorId, data, transaction = null) {
    try {
      const sanitizedData = sanitizeInput(data);
      const docRef = doctorsRef.doc(doctorId);

      const doctorData = {
        doctorId,
        ...sanitizedData,
        certificates: [],
        averageRating: 0,
        ratingCount: 0,
        isApproved: false,
        createdAt: timestamp(),
        updatedAt: timestamp(),
      };

      if (transaction) {
        transaction.set(docRef, doctorData);
      } else {
        await docRef.set(doctorData);
      }

      if (!transaction) {
        const doc = await docRef.get();
        return formatDoc(doc);
      }

      return doctorData;
    } catch (error) {
      console.error("Error creating doctor profile:", error);
      throw error;
    }
  },

  /**
   * Update doctor profile
   * @param {String} doctorId - Doctor ID
   * @param {Object} data - Doctor profile data
   * @returns {Object} Updated doctor profile
   */
  async update(doctorId, data) {
    try {
      const sanitizedData = sanitizeInput(data);
      const docRef = doctorsRef.doc(doctorId);

      // Check if doctor profile exists
      const docSnapshot = await docRef.get();
      if (!docSnapshot.exists) {
        throw new Error("Doctor profile not found");
      }

      // Update doctor profile
      await docRef.update({
        ...sanitizedData,
        updatedAt: timestamp(),
      });

      // Get updated doctor profile
      const updatedDoc = await docRef.get();
      return formatDoc(updatedDoc);
    } catch (error) {
      console.error("Error updating doctor profile:", error);
      throw error;
    }
  },

  /**
   * Add certificate to doctor profile
   * @param {String} doctorId - Doctor ID
   * @param {Object} certificate - Certificate data
   * @returns {Object} Updated doctor profile
   */
  async addCertificate(doctorId, certificate) {
    try {
      const sanitizedCertificate = sanitizeInput(certificate);
      const docRef = doctorsRef.doc(doctorId);

      // Check if doctor profile exists
      const docSnapshot = await docRef.get();
      if (!docSnapshot.exists) {
        throw new Error("Doctor profile not found");
      }

      // Add certificate
      await docRef.update({
        certificates: db.FieldValue.arrayUnion(sanitizedCertificate),
        updatedAt: timestamp(),
      });

      // Get updated doctor profile
      const updatedDoc = await docRef.get();
      return formatDoc(updatedDoc);
    } catch (error) {
      console.error("Error adding certificate:", error);
      throw error;
    }
  },

  /**
   * Approve doctor profile
   * @param {String} doctorId - Doctor ID
   * @returns {Object} Updated doctor profile
   */
  async approve(doctorId) {
    try {
      const docRef = doctorsRef.doc(doctorId);

      // Check if doctor profile exists
      const docSnapshot = await docRef.get();
      if (!docSnapshot.exists) {
        throw new Error("Doctor profile not found");
      }

      // Approve doctor profile
      await docRef.update({
        isApproved: true,
        approvedAt: timestamp(),
        updatedAt: timestamp(),
      });

      // Get updated doctor profile
      const updatedDoc = await docRef.get();
      return formatDoc(updatedDoc);
    } catch (error) {
      console.error("Error approving doctor profile:", error);
      throw error;
    }
  },

  /**
   * Delete doctor profile
   * @param {String} doctorId - Doctor ID
   * @param {Object} transaction - Firestore transaction (optional)
   * @returns {Boolean} Success status
   */
  async delete(doctorId, transaction = null) {
    try {
      const docRef = doctorsRef.doc(doctorId);

      if (transaction) {
        transaction.delete(docRef);
      } else {
        await docRef.delete();
      }

      return true;
    } catch (error) {
      console.error("Error deleting doctor profile:", error);
      throw error;
    }
  },
};

module.exports = DoctorProfileModel;
