const mongoose = require("mongoose");

// 1- Create Schema
const pharmacyMedicine = new mongoose.Schema(
  {
    medicine: {
      type: mongoose.Schema.ObjectId,
      ref: "Medicine",
    },
    pharmacy: {
      type: mongoose.Schema.ObjectId,
      ref: "Pharmacy",
    },
    stock: {
      type: String,
      defualt: 0,
    },
  },

  {
    timestamps: true,

    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// 2- Create model
const PharmacyMedicineModel = mongoose.model(
  "PharmacyMedicine",
  pharmacyMedicine
);

module.exports = PharmacyMedicineModel;
