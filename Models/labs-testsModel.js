const mongoose = require("mongoose");

// 1- Create Schema
const labTestsSchema = new mongoose.Schema({
  lab: {
    type: mongoose.Schema.ObjectId,
    ref: "Lab",
  },
  test: {
    type: mongoose.Schema.ObjectId,
    ref: "Test",
  },
 
  cost: {
    type: String,
  },
});

// 2- Create model
const LabTestsModel = mongoose.model("LabTests", labTestsSchema);

module.exports = LabTestsModel;