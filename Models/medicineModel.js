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
      type: Number,
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
      type: Boolean,
      default: false,
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
