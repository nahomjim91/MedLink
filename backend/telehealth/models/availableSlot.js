const { db } = require("../../config/firebase");
const { v4: uuidv4 } = require("uuid");

class AvailableSlotModel {
  static collection = db.collection("availableSlots");

  static async create(doctorId, input) {
    const slotId = uuidv4();
    const now = new Date();

    const slotData = {
      slotId,
      doctorId,
      startTime: input.startTime,
      endTime: input.endTime,
      isBooked: false,
      createdAt: now,
      updatedAt: now,
    };

    await this.collection.doc(slotId).set(slotData);
    return slotData;
  }

  static async getById(id) {
    const doc = await this.collection.doc(id).get();
    return doc.exists ? doc.data() : null;
  }

  static async getByDoctorId(doctorId) {
    const snapshot = await this.collection
      .where("doctorId", "==", doctorId)
      .orderBy("startTime", "asc")
      .get();

    return snapshot.docs.map((doc) => doc.data());
  }

  static async getByDoctorIdAndDate(doctorId, date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const snapshot = await this.collection
      .where("doctorId", "==", doctorId)
      .where("startTime", ">=", startOfDay)
      .where("startTime", "<=", endOfDay)
      .orderBy("startTime", "asc")
      .get();

    return snapshot.docs.map((doc) => doc.data());
  }

  static async update(id, input) {
    const slotRef = this.collection.doc(id);
    const slot = await slotRef.get();

    if (!slot.exists) {
      throw new Error("Slot not found");
    }

    const updateData = {
      ...input,
      updatedAt: new Date(),
    };

    await slotRef.update(updateData);
    return { ...slot.data(), ...updateData };
  }

  static async remove(id) {
    const slotRef = this.collection.doc(id);
    const slot = await slotRef.get();

    if (!slot.exists) {
      throw new Error("Slot not found");
    }

    await slotRef.delete();
    return true;
  }

  static async markAsBooked(id) {
    return this.update(id, { isBooked: true });
  }

  static async checkAvailability(doctorId, startTime, endTime) {
    const snapshot = await this.collection
      .where("doctorId", "==", doctorId)
      .where("isBooked", "==", false)
      .where("startTime", "<=", endTime)
      .where("endTime", ">=", startTime)
      .get();

    return snapshot.empty;
  }
}

module.exports = AvailableSlotModel;
