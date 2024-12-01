const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Cart must belong to a user"],
    },
    medicines: [
      {
        pharmacyId: { type: mongoose.Schema.Types.ObjectId, ref: "Pharmacy" },
        purchasedMedicines: [
          {
            medicineId: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "PharmacyMedicine",
              required: [true, "Medicine ID is required"],
            },
            price: {
              type: Number,
            },
            quantity: {
              type: Number,
              default: 1,
              min: [1, "Quantity must be at least 1"],
            },
          },
        ],
      },
    ],

    tests: [
      {
        labId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Lab",
        },
        purchasedTests: [
          {
            testId: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "LabTests",
              required: [true, "Test ID is required"],
            },
            // date: {
            //   type: Date,
            // },
            price: {
              type: Number,
            },
          },
        ],
      },
    ],
    totalMedicinePrice: {
      type: Number,
      default: 0,
    },
    totalTestPrice: {
      type: Number,
      default: 0,
    },
    totalPrice: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

module.exports = mongoose.model("Cart", cartSchema);
