const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
// 1- Create Schema

const pharmacySchema = new mongoose.Schema(
  {
    profilePic: {
      type: String,
    },
    name: String,
    address: [String],
    email: String,
    phone: [
      {
        type: String,
        min: [11, "incorrect mobile number"],
        max: [11, "incorrect mobile number "],
      },
    ],

    license: {
      type: [String],
      required: [true, "license is required"],
    },
    role: {
      type: String,
      default: "pharmacy",
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
// pharmacySchema.pre("save", function (next) {
//   if (this.isModified("role")) {
//     next(new ApiError("Role is read only field !", 400));
//   } else {
//     next();
//   }
// });

pharmacySchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  // Hashing user password
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// 2- Create model
const PharmacyModel = mongoose.model("Pharmacy", pharmacySchema);

module.exports = PharmacyModel;
