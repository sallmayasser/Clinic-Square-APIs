const mongoose = require("mongoose");

// 1- Create Schema
const medicineSchema = new mongoose.Schema(
  {
    name: {
      type: String,
    },

    cost: {
      type: String,
    },
    pharmacy: [
      {
        pharmacyId: {
          type: mongoose.Schema.ObjectId,
          ref: "Pharmacy",
        },
        stock: {
          type: String,
          defualt: 0,
        },
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
const MedicineModel = mongoose.model("Medicine", medicineSchema);

module.exports = MedicineModel;
