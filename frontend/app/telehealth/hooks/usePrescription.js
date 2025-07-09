import { useState, useEffect, useCallback } from 'react';
import { useLazyQuery, useMutation, useQuery } from '@apollo/client';
import { 
  GET_PRESCRIPTION_BY_ID,
  GET_PRESCRIPTIONS_BY_APPOINTMENT_ID,
  GET_PRESCRIPTIONS_BY_PATIENT_ID,
  GET_PRESCRIPTIONS_BY_DOCTOR_ID,
  GET_MY_PRESCRIPTIONS,
  GET_MY_PATIENTS_PRESCRIPTIONS,
  CREATE_PRESCRIPTION
} from '../api/graphql/prescription/prescriptionQueries';

/**
 * Hook for getting a prescription by ID
 * @param {string} prescriptionId - The prescription ID
 * @returns {Object} Query result and functions
 */
export const usePrescriptionById = (prescriptionId) => {
  const { data, loading, error, refetch } = useQuery(GET_PRESCRIPTION_BY_ID, {
    variables: { id: prescriptionId },
    skip: !prescriptionId,
    errorPolicy: 'all',
    fetchPolicy: 'cache-and-network'
  });

  return {
    prescription: data?.prescriptionById || null,
    loading,
    error,
    refetch
  };
};

/**
 * Hook for getting prescriptions by appointment ID
 * @param {string} appointmentId - The appointment ID
 * @returns {Object} Query result and functions
 */
export const usePrescriptionsByAppointmentId = (appointmentId) => {
  const { data, loading, error, refetch } = useQuery(GET_PRESCRIPTIONS_BY_APPOINTMENT_ID, {
    variables: { appointmentId },
    skip: !appointmentId,
    errorPolicy: 'all',
    fetchPolicy: 'cache-and-network'
  });

  return {
    prescriptions: data?.prescriptionsByAppointmentId || [],
    loading,
    error,
    refetch
  };
};

/**
 * Hook for getting prescriptions by patient ID (lazy loading)
 * @returns {Object} Query function and result
 */
export const usePrescriptionsByPatientId = (patientId) => {
    console.log("patientId", patientId);
  const [getPrescriptions, { data, loading, error }] = useLazyQuery(
    GET_PRESCRIPTIONS_BY_PATIENT_ID,
    {
      variables: { patientId: patientId },
      errorPolicy: 'all',
      fetchPolicy: 'cache-and-network'
    }
  );

  const fetchPrescriptions = useCallback((patientId) => {
    if (patientId) {
      getPrescriptions({ variables: { patientId } });
    }
  }, [getPrescriptions]);

  return {
    prescriptions: data?.prescriptionsByPatientId || [],
    loading,
    error,
    fetchPrescriptions
  };
};

/**
 * Hook for getting prescriptions by doctor ID (lazy loading)
 * @returns {Object} Query function and result
 */
export const usePrescriptionsByDoctorId = () => {
  const [getPrescriptions, { data, loading, error }] = useLazyQuery(
    GET_PRESCRIPTIONS_BY_DOCTOR_ID,
    {
      errorPolicy: 'all',
      fetchPolicy: 'cache-and-network'
    }
  );

  const fetchPrescriptions = useCallback((doctorId) => {
    if (doctorId) {
      getPrescriptions({ variables: { doctorId } });
    }
  }, [getPrescriptions]);

  return {
    prescriptions: data?.prescriptionsByDoctorId || [],
    loading,
    error,
    fetchPrescriptions
  };
};

/**
 * Hook for getting current user's prescriptions (patient view)
 * @returns {Object} Query result and functions
 */
export const useMyPrescriptions = () => {
  const { data, loading, error, refetch } = useQuery(GET_MY_PRESCRIPTIONS, {
    errorPolicy: 'all',
    fetchPolicy: 'cache-and-network'
  });

  return {
    prescriptions: data?.myPrescriptions || [],
    loading,
    error,
    refetch
  };
};

/**
 * Hook for getting current doctor's patients prescriptions
 * @returns {Object} Query result and functions
 */
export const useMyPatientsPrescriptions = () => {
  const { data, loading, error, refetch } = useQuery(GET_MY_PATIENTS_PRESCRIPTIONS, {
    errorPolicy: 'all',
    fetchPolicy: 'cache-and-network'
  });

  return {
    prescriptions: data?.myPatientsPrescriptions || [],
    loading,
    error,
    refetch
  };
};

/**
 * Hook for creating a prescription
 * @returns {Object} Mutation function and state
 */
export const useCreatePrescription = () => {
  const [createPrescription, { data, loading, error }] = useMutation(CREATE_PRESCRIPTION, {
    errorPolicy: 'all'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleCreatePrescription = useCallback(async (prescriptionData) => {
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      const result = await createPrescription({
        variables: {
          input: prescriptionData
        },
        // Update cache after successful creation
        update: (cache, { data: { createPrescription } }) => {
          // Update myPatientsPrescriptions cache
          try {
            const existingData = cache.readQuery({
              query: GET_MY_PATIENTS_PRESCRIPTIONS
            });
            
            if (existingData) {
              cache.writeQuery({
                query: GET_MY_PATIENTS_PRESCRIPTIONS,
                data: {
                  myPatientsPrescriptions: [createPrescription, ...existingData.myPatientsPrescriptions]
                }
              });
            }
          } catch (e) {
            console.log('Cache update error:', e);
          }

          // Update prescriptions by appointment ID cache
          try {
            const existingAppointmentData = cache.readQuery({
              query: GET_PRESCRIPTIONS_BY_APPOINTMENT_ID,
              variables: { appointmentId: prescriptionData.appointmentId }
            });
            
            if (existingAppointmentData) {
              cache.writeQuery({
                query: GET_PRESCRIPTIONS_BY_APPOINTMENT_ID,
                variables: { appointmentId: prescriptionData.appointmentId },
                data: {
                  prescriptionsByAppointmentId: [
                    createPrescription, 
                    ...existingAppointmentData.prescriptionsByAppointmentId
                  ]
                }
              });
            }
          } catch (e) {
            console.log('Cache update error:', e);
          }
        }
      });

      setSubmitSuccess(true);
      return result.data.createPrescription;
    } catch (err) {
      setSubmitError(err.message || 'Failed to create prescription');
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, [createPrescription]);

  // Reset success state after some time
  useEffect(() => {
    if (submitSuccess) {
      const timer = setTimeout(() => {
        setSubmitSuccess(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [submitSuccess]);

  return {
    createPrescription: handleCreatePrescription,
    prescription: data?.createPrescription || null,
    loading: loading || isSubmitting,
    error: error || submitError,
    isSubmitting,
    submitError,
    submitSuccess
  };
};

/**
 * Hook for managing prescription form state
 * @param {Object} initialData - Initial form data
 * @returns {Object} Form state and handlers
 */
export const usePrescriptionForm = (initialData = {}) => {
  const [formData, setFormData] = useState({
    appointmentId: '',
    patientDetails: {
      patientId: '',
      name: '',
      profileImage: ''
    },
    doctorDetails: {
      doctorId: '',
      name: '',
      profileImage: ''
    },
    medications: [{
      drugName: '',
      dosage: '',
      route: '',
      frequency: '',
      duration: '',
      instructions: ''
    }],
    recommendations: '',
    ...initialData
  });

  const [errors, setErrors] = useState({});

  const updateFormData = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when field is updated
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  }, [errors]);

  const updateNestedFormData = useCallback((parentField, childField, value) => {
    setFormData(prev => ({
      ...prev,
      [parentField]: {
        ...prev[parentField],
        [childField]: value
      }
    }));
    // Clear error when field is updated
    const errorKey = `${parentField}.${childField}`;
    if (errors[errorKey]) {
      setErrors(prev => ({
        ...prev,
        [errorKey]: null
      }));
    }
  }, [errors]);

  const updateMedication = useCallback((index, field, value) => {
    setFormData(prev => ({
      ...prev,
      medications: prev.medications.map((med, i) => 
        i === index ? { ...med, [field]: value } : med
      )
    }));
    // Clear error when field is updated
    const errorKey = `medications.${index}.${field}`;
    if (errors[errorKey]) {
      setErrors(prev => ({
        ...prev,
        [errorKey]: null
      }));
    }
  }, [errors]);

  const addMedication = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      medications: [
        ...prev.medications,
        {
          drugName: '',
          dosage: '',
          route: '',
          frequency: '',
          duration: '',
          instructions: ''
        }
      ]
    }));
  }, []);

  const removeMedication = useCallback((index) => {
    setFormData(prev => ({
      ...prev,
      medications: prev.medications.filter((_, i) => i !== index)
    }));
  }, []);

  const validateForm = useCallback(() => {
    const newErrors = {};

    // Validate appointment ID
    if (!formData.appointmentId) {
      newErrors.appointmentId = 'Appointment ID is required';
    }

    // Validate patient details
    if (!formData.patientDetails.patientId) {
      newErrors['patientDetails.patientId'] = 'Patient ID is required';
    }
    if (!formData.patientDetails.name) {
      newErrors['patientDetails.name'] = 'Patient name is required';
    }

    // Validate doctor details
    if (!formData.doctorDetails.doctorId) {
      newErrors['doctorDetails.doctorId'] = 'Doctor ID is required';
    }
    if (!formData.doctorDetails.name) {
      newErrors['doctorDetails.name'] = 'Doctor name is required';
    }

    // Validate medications
    if (formData.medications.length === 0) {
      newErrors.medications = 'At least one medication is required';
    } else {
      formData.medications.forEach((med, index) => {
        if (!med.drugName) {
          newErrors[`medications.${index}.drugName`] = 'Drug name is required';
        }
        if (!med.dosage) {
          newErrors[`medications.${index}.dosage`] = 'Dosage is required';
        }
        if (!med.route) {
          newErrors[`medications.${index}.route`] = 'Route is required';
        }
        if (!med.frequency) {
          newErrors[`medications.${index}.frequency`] = 'Frequency is required';
        }
        if (!med.duration) {
          newErrors[`medications.${index}.duration`] = 'Duration is required';
        }
        if (!med.instructions) {
          newErrors[`medications.${index}.instructions`] = 'Instructions are required';
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const resetForm = useCallback(() => {
    setFormData({
      appointmentId: '',
      patientDetails: {
        patientId: '',
        name: '',
        profileImage: ''
      },
      doctorDetails: {
        doctorId: '',
        name: '',
        profileImage: ''
      },
      medications: [{
        drugName: '',
        dosage: '',
        route: '',
        frequency: '',
        duration: '',
        instructions: ''
      }],
      recommendations: '',
      ...initialData
    });
    setErrors({});
  }, [initialData]);

  return {
    formData,
    errors,
    updateFormData,
    updateNestedFormData,
    updateMedication,
    addMedication,
    removeMedication,
    validateForm,
    resetForm,
    isValid: Object.keys(errors).length === 0
  };
};

/**
 * Hook for managing prescription list with filtering and sorting
 * @param {Array} prescriptions - List of prescriptions
 * @returns {Object} Filtered and sorted prescriptions with utilities
 */
export const usePrescriptionList = (prescriptions = []) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterBy, setFilterBy] = useState('all');

  const filteredAndSortedPrescriptions = useCallback(() => {
    let filtered = [...prescriptions];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(prescription => 
        prescription.patientDetails.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prescription.doctorDetails.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prescription.medications.some(med => 
          med.drugName.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Apply date filter
    if (filterBy !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (filterBy) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          filtered = filtered.filter(p => new Date(p.createdAt) >= filterDate);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          filtered = filtered.filter(p => new Date(p.createdAt) >= filterDate);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          filtered = filtered.filter(p => new Date(p.createdAt) >= filterDate);
          break;
        default:
          break;
      }
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'createdAt':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case 'patientName':
          aValue = a.patientDetails.name.toLowerCase();
          bValue = b.patientDetails.name.toLowerCase();
          break;
        case 'doctorName':
          aValue = a.doctorDetails.name.toLowerCase();
          bValue = b.doctorDetails.name.toLowerCase();
          break;
        default:
          aValue = a[sortBy];
          bValue = b[sortBy];
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [prescriptions, searchTerm, sortBy, sortOrder, filterBy]);

  return {
    prescriptions: filteredAndSortedPrescriptions(),
    searchTerm,
    setSearchTerm,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    filterBy,
    setFilterBy,
    totalCount: prescriptions.length,
    filteredCount: filteredAndSortedPrescriptions().length
  };
};