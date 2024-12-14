const mongoose = require("mongoose");

// 1- Create Schema
const doctorReservationSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.ObjectId,
      ref: "Patient",
    },
    doctor: {
      type: mongoose.Schema.ObjectId,
      ref: "Doctor",
    },
    date: {
      type: String,
      required: [true, "you must enter reservation date "],
    },
    state: {
      type: String,
      enum: ["completed", "consultation", "pending"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "visa"],
      default: "cash",
    },
    report: {
      diagnose: { type: String, default: null },
      medicine: [
        {
          name: { type: String, default: null },
          dose: {
            type: String,
            default: null,
          },
        },
      ],
      requestedTests: [
        {
          type: String,
          default: null,
        },
      ],
      results: [
        {
          type: String,
          default: null,
        },
      ],
    },
  },
  {
    timestamps: true,

    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);
// 2- Create model
const DoctorReservationModel = mongoose.model(
  "DoctorReservation",
  doctorReservationSchema
);

module.exports = DoctorReservationModel;
