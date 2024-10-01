const mongoose = require("mongoose");

// const scheduleSchema = require("./scheduleModel");

// 1- Create Schema
exports.scheduleSchema = new mongoose.Schema({
  day: {
    type: String,
    required: true,
    enum: [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ], // Restrict to valid days
  },
  startTime: {
    type: Date,
    required: true,
  },
  endTime: {
    type: Date,
    required: true,
  },
  limit: {
    type: Number,
    required: true,
    min: 1, // Ensure there is at least 1 available slot
  },
});



