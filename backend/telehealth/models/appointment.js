const { db } = require('../../config/firebase');
const { v4: uuidv4 } = require('uuid');

class AppointmentModel {
  static collection = db.collection('appointments');

  static async create(patientId, input) {
    const appointmentId = uuidv4();
    const now = new Date();
    
    const appointmentData = {
      appointmentId,
      patientId,
      patientName: input.patientName || '',
      doctorId: input.doctorId,
      doctorName: input.doctorName || '',
      status: 'requested',
      scheduledStartTime: input.scheduledStartTime,
      scheduledEndTime: input.scheduledEndTime,
      actualStartTime: null,
      actualEndTime: null,
      createdAt: now,
      updatedAt: now
    };

    await this.collection.doc(appointmentId).set(appointmentData);
    return appointmentData;
  }

  static async getById(id) {
    const doc = await this.collection.doc(id).get();
    return doc.exists ? doc.data() : null;
  }

  static async getByPatientId(patientId) {
    const snapshot = await this.collection
      .where('patientId', '==', patientId)
      .orderBy('date', 'desc')
      .get();
    
    return snapshot.docs.map(doc => doc.data());
  }

  static async getByDoctorId(doctorId) {
    const snapshot = await this.collection
      .where('doctorId', '==', doctorId)
      .orderBy('date', 'desc')
      .get();
    
    return snapshot.docs.map(doc => doc.data());
  }

  static async update(id, input) {
    const appointmentRef = this.collection.doc(id);
    const appointment = await appointmentRef.get();

    if (!appointment.exists) {
      throw new Error('Appointment not found');
    }

    const updateData = {
      ...input,
      updatedAt: new Date()
    };

    await appointmentRef.update(updateData);
    return { ...appointment.data(), ...updateData };
  }

  static async cancel(id) {
    return this.update(id, { status: 'CANCELLED' });
  }

  static async checkAvailability(doctorId, date, startTime, endTime) {
    const snapshot = await this.collection
      .where('doctorId', '==', doctorId)
      .where('date', '==', date)
      .where('status', 'in', ['SCHEDULED', 'CONFIRMED'])
      .get();

    const existingAppointments = snapshot.docs.map(doc => doc.data());
    
    // Check for time conflicts
    return !existingAppointments.some(appointment => {
      const existingStart = appointment.startTime;
      const existingEnd = appointment.endTime;
      return (
        (startTime >= existingStart && startTime < existingEnd) ||
        (endTime > existingStart && endTime <= existingEnd) ||
        (startTime <= existingStart && endTime >= existingEnd)
      );
    });
  }
}

module.exports = AppointmentModel; 