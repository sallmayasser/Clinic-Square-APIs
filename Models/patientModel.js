const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
// 1- Create Schema
const patientSchema = new mongoose.Schema(
  {
    profilePic: {
      type: String,
    },
    name: String,
    address: [String],
    email: String,
    phoneNumbers: [
      {
        required:[true,"Phone Number is Required"],
        type: String,
        min: [11, "incorrect mobile number"],
        max: [11, "incorrect mobile number "],
      },
    ],
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
    role: {
      type: String,
      default: "patient",
      immutable: true,
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
// patientSchema.pre("save", function (next) {
//   if (this.isModified("role")) {
//     next(new ApiError("Role is read only field !", 400));
//   } else {
//     next();
//   }
// });
patientSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  // Hashing user password
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// 2- Create model
const PatientModel = mongoose.model("Patient", patientSchema);

module.exports = PatientModel;
