const mongoose = require("mongoose");
const Doctor = require("./doctorModel");
const Lab = require("./labModel");

const reviewSchema = new mongoose.Schema(
  {
    title: {
      type: String,
    },
    ratings: {
      type: Number,
      min: [1, "Min ratings value is 1.0"],
      max: [5, "Max ratings value is 5.0"],
      required: [true, "review ratings required"],
    },
    patient: {
      type: mongoose.Schema.ObjectId,
      ref: "Patient",
      required: [true, "Review must belong to Patient"],
    },
    doctor: {
      type: mongoose.Schema.ObjectId,
      ref: "Doctor",
      // required: [true, 'Review must belong to doctor'],
    },
    // parent reference (one to many)
    lab: {
      type: mongoose.Schema.ObjectId,
      ref: "Lab",
      // required: [true, 'Review must belong to lab'],
    },
  },
  { timestamps: true }
);

// Generic function to calculate average ratings and quantity
const calcAverageRatingsAndQuantity = async function (
  entityId,
  entityModel,
  field
) {
  const result = await this.aggregate([
    { $match: { [field]: entityId } },
    {
      $group: {
        _id: field,
        avgRatings: { $avg: "$ratings" },
        ratingsQuantity: { $sum: 1 },
      },
    },
  ]);

  const updateData =
    result.length > 0
      ? {
          ratingsAverage: result[0].avgRatings,
          ratingsQuantity: result[0].ratingsQuantity,
        }
      : { ratingsAverage: 0, ratingsQuantity: 0 };

  await entityModel.findByIdAndUpdate(entityId, updateData);
};

// Attach the generic function to the schema
reviewSchema.statics.calcAverageRatingsAndQuantity =
  calcAverageRatingsAndQuantity;

// Post-save and post-remove hooks for Doctor
reviewSchema.post("save", async function () {
  await this.constructor.calcAverageRatingsAndQuantity(
    this.doctor,
    Doctor,
    "doctor"
  );
});

reviewSchema.post("remove", async function () {
  await this.constructor.calcAverageRatingsAndQuantity(
    this.doctor,
    Doctor,
    "doctor"
  );
});

// Post-save and post-remove hooks for Lab
reviewSchema.post("save", async function () {
  await this.constructor.calcAverageRatingsAndQuantity(this.lab, Lab, "lab");
});

reviewSchema.post("remove", async function () {
  await this.constructor.calcAverageRatingsAndQuantity(this.lab, Lab, "lab");
});

module.exports = mongoose.model("Review", reviewSchema);
