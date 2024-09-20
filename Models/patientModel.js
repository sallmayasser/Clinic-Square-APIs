const mongoose = require("mongoose");

// 1- Create Schema
const patientSchema = new mongoose.Schema(
  {
    profilePic: {
      type: String,
    },
    name: String,
    address: [String],
    email: String,
    phone: {
      type: String,
      min: [11, "incorrect mobile number"],
      max: [11, "incorrect mobile number "],
    },
    gender: {
      type: String,
      required: [true, "gender required"],
      enum: ["male", "female"],
      lowercase: true,
    },
    dateOfBirth: Date,

    password: {
      type: String,
      required: [true, "password required"],
      minlength: [6, "Too short password"],
    },
    passwordChangedAt: Date,
    passwordResetCode: String,
    passwordResetExpires: Date,
    passwordResetVerified: Boolean,
  },
  {
    timestamps: true,

    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// 2- Create model
const PatientModel = mongoose.model("Patient", patientSchema);

module.exports = PatientModel;
