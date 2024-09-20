const mongoose = require("mongoose");

// 1- Create Schema
const doctorReservationSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.ObjectId,
      ref: "Patient",
    },
    lab: {
      type: mongoose.Schema.ObjectId,
      ref: "Lab",
    },
    requestedTests: [
      {
        testName: {
          type: String,
          default: null,
        },
        testResult: [{ type: String, default: null }],
      },
    ],
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
