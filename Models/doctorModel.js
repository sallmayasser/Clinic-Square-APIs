const mongoose = require("mongoose");
const ApiError = require("../utils/apiError");
const { default: scheduleSchema } = require("./scheduleModel");
const bcrypt = require("bcryptjs");
// const scheduleSchema = require("./scheduleModel");

const doctorSchema = new mongoose.Schema(
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
    about: {
      type: String,
      default: "Doctor",
    },
    specialization: {
      type: String,
      required: [true, "specialization is required"],
    },
    gender: {
      type: String,
      required: [true, "gender required"],
      enum: ["male", "female"],
      lowercase: true,
    },
    license: {
      type: [String],
      required: [true, "license is required"],
    },
    dateOfBirth: Date,
    schedule: {
      days: {
        type: [scheduleSchema], // Array of schedule objects
        required: true,
      },
      cost: {
        type: Number,
        required: true,
        min: 0, // Ensure cost is non-negative
      },
    },
    points: {
      type: Number,
      default: 0,
    },
    role: {
      type: String,
      default: "doctor",
      immutable: true,
    },
    state: {
      type: Boolean,
      default: false,
    },
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

// doctorSchema.pre("save", function (next) {
//   if (this.isModified("role")) {
//     next(new ApiError("Role is read only field !", 400));
//   } else {
//     next();
//   }
// });

doctorSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  // Hashing user password
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// 2- Create model
const DoctorModel = mongoose.model("Doctor", doctorSchema);

module.exports = DoctorModel;
