const mongoose = require("mongoose");

// 1- Create Schema
const doctorReservationSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.ObjectId,
    ref: "Patient",
  },
  doctor: {
    type: mongoose.Schema.ObjectId,
    ref: "Doctor",
  },
  state: {
    type: String,
    enum: ["completed", "consaltation", "pending"],
    default: "pending",
  },

  report: {
    diagnose: { type: String },
    medicine: [
      {
        name: { type: String },
        dose: {
          type: String,
        },
      },
    ],
    requestedTests: [
      {
        type: String,
        default: null,
      },
    ],
  },
});
// 2- Create model
const DoctorReservationModel = mongoose.model(
  "DoctorReservation",
  doctorReservationSchema
);

module.exports = DoctorReservationModel;
