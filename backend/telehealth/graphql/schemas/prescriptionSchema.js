// graphql/schemas/prescriptionSchema.js
const prescriptionTypeDefs = `
  type Prescription {
    id: ID!
    appointmentId: ID!
    patientDetails: PrescriptionPatientDetails!
    doctorDetails: PrescriptionDoctorDetails!
    medications: [Medication!]!
    recommendations: String
    signature: String
    status: String
    createdAt: Date!
    updatedAt: Date!
  }

  type PrescriptionPatientDetails {
    patientId: ID!
    name: String!
    profileImage: String
  }

  type PrescriptionDoctorDetails {
    doctorId: ID!
    name: String!
    profileImage: String
  }

  type Medication {
    drugName: String!
    dosage: String!
    route: String!
    frequency: String!
    duration: String!
    instructions: String!
  }

  input PrescriptionInput {
    appointmentId: ID!
    patientDetails: PrescriptionPatientDetailsInput!
    doctorDetails: PrescriptionDoctorDetailsInput!
    medications: [MedicationInput!]!
    recommendations: String
    signature: String
    status: String
  }

  input PrescriptionPatientDetailsInput {
    patientId: ID!
    name: String!
    profileImage: String
  }

  input PrescriptionDoctorDetailsInput {
    doctorId: ID!
    name: String!
    profileImage: String
  }

  input MedicationInput {
    drugName: String!
    dosage: String!
    route: String!
    frequency: String!
    duration: String!
    instructions: String!
  }

  extend type Query {
    # Prescription queries
    prescriptionById(id: ID!): Prescription
    prescriptionsByAppointmentId(appointmentId: ID!): [Prescription!]!
    prescriptionsByPatientId(patientId: ID!): [Prescription!]!
    prescriptionsByDoctorId(doctorId: ID!): [Prescription!]!
    myPrescriptions: [Prescription!]!
    myPatientsPrescriptions: [Prescription!]!
    #admin
    allPrescriptions: [Prescription!]
  }

  extend type Mutation {
    # Prescription mutations
    createPrescription(input: PrescriptionInput!): Prescription!
  }
`;

module.exports = prescriptionTypeDefs;
