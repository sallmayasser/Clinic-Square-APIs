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
      enum: ["completed", "new"],
      default: "new",
    },
    requestedTests: [
      {
        testDetails: {
          type: mongoose.Schema.ObjectId,
          ref: "LabTests",
          default: null,
        },
        // cost: { type: String },
        testResult: [{ type: String, default: null }],
      },
    ],
    paymentMethod: {
      type: String,
      enum: ["cash", "visa"],
      default: "cash",
    },
    totalCost: {
      type: Number,
      defualt: 0,
    },
    isPaid: { type: Boolean, default: false },
    paidAt: { type: Date, default: null },
  },
  {
    timestamps: true,

    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// labReservationSchema.pre("find", async function () {
//   this.populate({
//     path: "requestedTests.testDetails",
//     populate: {
//       path: "test",
//       model: "Test",
//       select:"name"
//     },
//   });
// });

// 2- Create model
const LabReservationModel = mongoose.model(
  "LabReservation",
  labReservationSchema
);

module.exports = LabReservationModel;
