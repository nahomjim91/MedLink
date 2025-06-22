// File: /graphql/resolvers/index.js
const thUser = require('./resolvers')
const appointment = require('./appointmentResolver')  
const transaction = require('./transactionResolvers')

// Merge resolvers
const resolvers = {
  Query: {
    ...thUser.Query,
    ...appointment.Query,
    ...transaction.Query,
  },
  Mutation: {
    ...thUser.Mutation,
    ...appointment.Mutation,
    ...transaction.Mutation,
  },
  // Custom scalars
  Date:  thUser.Date, 

  // Merge any additional resolver types
  Appointment: appointment.Appointment,
  THUser: thUser.THUser,
  PatientProfile: thUser.PatientProfile,
  DoctorProfile: thUser.DoctorProfile,
  Transaction: transaction.Transaction,
  Refund: transaction.Refund
};

module.exports = resolvers;
