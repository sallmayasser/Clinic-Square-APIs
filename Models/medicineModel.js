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
    
    state: {
      type: String,
      default:"pending"
    },
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
