const mongoose = require("mongoose");
const { default: scheduleSchema } = require("./scheduleModel");

// 1- Create Schema


const labSchema = new mongoose.Schema(
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
    license: {
      type: [String],
      required: [true, "license is required"],
    },
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
    role: {
      type: String,
      default: "Lab",
      immutable: true,
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

labSchema.pre("save", function (next) {
  if (this.isModified("role")) {
    next(new ApiError("Role is read only field !", 400));
  } else {
    next();
  }
});
// 2- Create model
const LabModel = mongoose.model("Lab", labSchema);

module.exports = LabModel;
