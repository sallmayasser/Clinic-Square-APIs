const mongoose = require("mongoose");

// 1- Create Schema
const labReservationSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.ObjectId,
      ref: "Patient",
    },
    lab: {
      type: mongoose.Schema.ObjectId,
      ref: "Lab",
    },
    date: {
      type: Date,
      required: [true, "you must enter reservation date "],
    },
    state: {
      type: String,
      enum: ["completed","new"],
      default: "new",
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
const LabReservationModel = mongoose.model(
  "LabReservation",
  labReservationSchema
);

module.exports = LabReservationModel;
