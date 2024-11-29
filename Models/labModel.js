const mongoose = require("mongoose");
const { default: scheduleSchema } = require("./scheduleModel");
const bcrypt = require("bcryptjs");
// 1- Create Schema

const labSchema = new mongoose.Schema(
  {
    profilePic: {
      type: String,
    },
    name: String,
    address: [String],
    email: String,
    phoneNumbers: [
      {
        required: [true, "Phone Number is Required"],
        type: String,
        min: [11, "incorrect mobile number"],
        max: [11, "incorrect mobile number "],
      },
    ],
    license: {
      type: [String],
      required: [true, "license is required"],
    },
    schedule: {
      days: {
        type: [scheduleSchema], // Array of schedule objects
        required: true,
      },
    },
    role: {
      type: String,
      default: "lab",
      immutable: true,
    },
    state: {
      type: Boolean,
      default: false,
    },
    ratingsAverage: {
      type: Number,
      min: [1, "Rating must be above or equal 1.0"],
      max: [5, "Rating must be below or equal 5.0"],
      // set: (val) => Math.round(val * 10) / 10, // 3.3333 * 10 => 33.333 => 33 => 3.3
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
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

// labSchema.pre("save", function (next) {
//   if (this.isModified("role")) {
//     next(new ApiError("Role is read only field !", 400));
//   } else {
//     next();
//   }
// });
labSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  // Hashing user password
  this.password = await bcrypt.hash(this.password, 12);
  next();
});
  labSchema.virtual("reviews", {
    ref: "Review",
    localField: "_id",
    foreignField: "lab",
  });
// 2- Create model
const LabModel = mongoose.model("Lab", labSchema);

module.exports = LabModel;
