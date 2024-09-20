const mongoose = require("mongoose");

// 1- Create Schema
const testSchema = new mongoose.Schema({
  name: {
    type: String,
  },

});

// 2- Create model
const TestModel = mongoose.model("Test", testSchema);

module.exports = TestModel;
