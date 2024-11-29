const mongoose = require("mongoose");

// 1- Create Schema
const medicineSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      require: true,
    },
    photo: {
      type: String,
      require: true,
    },
    cost: {
      type: String,
      require: true,
    },
    user: {
      type: String,
      require: true,
    },
    category: {
      type: String,
      enum: [
        "Cosmetics",
        "Hair Care",
        "Every Day Essentials",
        "Medical Equipment & Supplies",
        "Mom & Baby",
        "Sexual Health",
        "Medicine",
        "Skin Care",
      ],
      require: true,
    },
    state: {
      type: String,
      default: "pending",
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
