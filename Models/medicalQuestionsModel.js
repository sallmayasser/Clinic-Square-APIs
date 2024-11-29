const mongoose = require("mongoose");

// 1- Create Schema
const questionSchema = new mongoose.Schema(
  {
    question: {
      required: true,
      type: String,
      minlength: [6, "Question Should have at least 6 characters"],
      maxlength: [250, "Question Should not exceed 250 characters"],
    },
    patient: {
      type: mongoose.Schema.ObjectId,
      ref: "Patient",
    },
    answers: [
      {
        doctor: {
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

// questionSchema.pre(/^find/, function (next) {
//   this.populate({
//     path: "answers.doctor",
//     select: "profilePic name email phoneNumbers specialization",
//   });
//   next();
// });

// 2- Create model
const QuestionModel = mongoose.model("Question", questionSchema);

module.exports = QuestionModel;
