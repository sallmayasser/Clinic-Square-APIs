const mongoose = require("mongoose");

// 1- Create Schema
const questionSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.ObjectId,
      ref: "Patient",
    },
    answers: [
      {
        Doctor: {
          type: mongoose.Schema.ObjectId,
          ref: "Doctor",
        },
        answer: {
          type: String,
          required: [true, "you must answer this question"],
        },
      },
    ],
  },
  {
    timestamps: true,

    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// 2- Create model
const QuestionModel = mongoose.model("Question", questionSchema);

module.exports = QuestionModel;
