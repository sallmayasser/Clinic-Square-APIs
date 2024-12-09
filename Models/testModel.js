const mongoose = require("mongoose");

// 1- Create Schema
const testSchema = new mongoose.Schema(
  {
    name: {
      type: String,
    },
    user: {
      type: String,
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
const TestModel = mongoose.model("Test", testSchema);

module.exports = TestModel;
