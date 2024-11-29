const asyncHandler = require("express-async-handler");
const factory = require("./handlerFactory");
const cartModel = require("../Models/cartModel");
const LabReservationModel = require("../Models/labReservationModel");

exports.getLabReservation = factory.getOne(LabReservationModel);
exports.getLabReservations = factory.getAll(LabReservationModel);
exports.deleteLabReservation = factory.deleteOne(LabReservationModel);
exports.updateLabReservation = factory.updateOne(LabReservationModel);

exports.createLabReservation = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;
  const { date, lab, paymentMethod } = req.body;
  // Step 1: Get the user's cart
  const cart = await cartModel.findOne({ user: userId });

  if (!cart || cart.tests.length === 0) {
    return res.status(400).json({
      message:
        "No tests found in your cart. Please add tests before creating a reservation.",
    });
  }
  // Step 2: Extract tests from the cart

  const requestedTests = cart.tests.map((test) => ({
    testDetails: test.testId,
    testResult: [],
  }));

  // Step 3: Check for duplicate reservations

  for (const test of requestedTests) {
    const duplicateReservation = await LabReservationModel.findOne({
      patient: userId,
      "requestedTests.testDetails": test.testDetails,
      date: req.body.date,
    });

    if (duplicateReservation) {
      return res.status(400).json({
        message: `You have already reserved test with ID ${test.testDetails} on the selected date.`,
      });
    }
  }

  // Step 4: Create the reservation
  const newReservation = await LabReservationModel.create({
    patient: userId,
    date: date,
    lab: lab,
    requestedTests,
    paymentMethod,
  });

  // Step 5: Clear tests from the cart
  cart.tests = [];
  cart.totalTestPrice = 0;
  cart.totalPrice = cart.totalMedicinePrice; // Update cart total price to include only medicines
  if (cart.medicines.length === 0 && cart.tests.length === 0) {
    await cartModel.findByIdAndDelete(cart._id); // Delete cart if both arrays are empty
  } else {
    await cart.save();
  }

  // Step 6: Respond with the reservation details
  res.status(201).json({
    reservation: newReservation,
  });
});
