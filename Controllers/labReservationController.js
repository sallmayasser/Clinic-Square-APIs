const asyncHandler = require("express-async-handler");
const factory = require("./handlerFactory");
const cartModel = require("../Models/cartModel");
const LabReservationModel = require("../Models/labReservationModel");
const ApiError = require("../utils/apiError");

exports.getLabReservation = factory.getOne(LabReservationModel);
exports.getLabReservations = factory.getAll(LabReservationModel);
exports.deleteLabReservation = factory.deleteOne(LabReservationModel);
exports.updateLabReservation = factory.updateOne(LabReservationModel);

exports.createLabReservation = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;
  const { paymentMethod, date } = req.body; // Take the date from request body

  // Step 1: Get the user's cart
  const cart = await cartModel.findOne({ user: userId });

  if (!cart || cart.tests.length === 0) {
    return res.status(400).json({
      message:
        "No tests found in your cart. Please add tests before creating a reservation.",
    });
  }

  // Step 2: Group tests by labId for separate reservations
  const groupedTests = groupTestsByLabId(cart.tests, date); // Pass date here

  // Step 3: Create reservations for each lab group
  await createLabReservations(userId, groupedTests, paymentMethod, date); // Pass date here

  // Step 4: Clear cart and update totals
  await updateCartAfterReservation(cart);

  // Step 5: Respond with success message
  res.status(201).json({
    message: "Lab reservation(s) created successfully.",
  });
});

// Helper function to group tests by labId
const groupTestsByLabId = (tests, date) => {
  return tests.reduce((acc, test) => {
    // Iterate over each lab
    test.purchasedTests.forEach((purchasedTest) => {
      // If labId doesn't exist in accumulator, create an array for it
      if (!acc[test.labId]) {
        acc[test.labId] = [];
      }

      // Add the test details (from purchasedTests) into the accumulator for that labId
      acc[test.labId].push({
        testDetails: purchasedTest.testId,
        testResult: [],
        date, // Use the date from the request body
        price: purchasedTest.price,
      });
    });
    return acc;
  }, {});
};

// Helper function to create reservations for each lab
const createLabReservations = async (
  userId,
  groupedTests,
  paymentMethod,
  date
) => {
  for (const labId in groupedTests) {
    const requestedTests = groupedTests[labId];

    // Step 3a: Check for duplicate reservations for all tests
    for (const test of requestedTests) {
      const duplicateReservation = await LabReservationModel.findOne({
        patient: userId,
        lab: labId,
        "requestedTests.testDetails": test.testDetails,
        date: date, // Check if any test already reserved on this date
      });

      if (duplicateReservation) {
        throw new ApiError(
          `You have already reserved the test with ID ${test.testDetails} at this lab on ${date}.`,
          400
        );
      }
    }

    // Step 3b: Create the reservation for the lab
    await LabReservationModel.create({
      patient: userId,
      lab: labId,
      date: date, // Use the date from the request body
      requestedTests,
      paymentMethod,
    });
  }
};

// Helper function to clear the cart and update totals
const updateCartAfterReservation = async (cart) => {
  cart.tests = [];
  cart.totalTestPrice = 0;
  cart.totalPrice = cart.totalMedicinePrice; // Keep medicines price in the total

  if (cart.medicines.length === 0 && cart.tests.length === 0) {
    await cartModel.findByIdAndDelete(cart._id); // Delete cart if empty
  } else {
    await cart.save();
  }
};
