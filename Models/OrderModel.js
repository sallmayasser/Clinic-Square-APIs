const mongoose = require("mongoose");

// 1- Create Schema
const orderSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.ObjectId,
      ref: "Patient",
    },
    pharmacy: {
      type: mongoose.Schema.ObjectId,
      ref: "Pharmacy",
    },
    medicines: [
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
    totalCost: {
      type: Number,
    },
    state: {
      type: String,
      enum: ["delivered", "pending"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "visa"],
      default: "cash",
    },
    shippingAddress: {
      type: String,
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

// 2- Create model
const OrderModel = mongoose.model("Order", orderSchema);

module.exports = OrderModel;
