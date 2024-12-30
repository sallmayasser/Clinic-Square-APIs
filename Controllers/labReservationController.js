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
  const { data } = req.body; 
  const paymentMethod = "cash";

  // Step 1: Get the user's cart
  const cart = await cartModel.findOne({ user: userId });

  if (!cart || cart.tests.length === 0) {
    return res.status(400).json({
      message:
        "No tests found in your cart. Please add tests before creating a reservation.",
    });
  }

  // Step 2: Group tests by labId
  const groupedTests = this.groupTestsByLabId(cart.tests);

  // Step 3: Validate input and create reservations for each lab
  for (const item of data) {
    const { labId, date } = item;

    if (!groupedTests[labId]) {
      return res.status(400).json({
        message: `No tests found in your cart for lab with ID ${labId}.`,
      });
    }

    // Prepare the reservation data
    const requestedTests = groupedTests[labId];

    // Calculate total cost for the lab
    const totalCost = requestedTests.reduce((acc, test) => acc + test.price, 0);

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
      date, // Use the date from the input
      requestedTests,
      paymentMethod,
      totalCost,
      isPaid: false,
      paidAt: null,
    });
  }

  // Step 4: Clear cart and update totals
  await this.updateCartAfterReservation(cart);

  // Step 5: Respond with success message
  res.status(201).json({
    message: "Lab reservation(s) created successfully.",
  });
});

// Helper function to group tests by labId
exports.groupTestsByLabId = (tests, date) => {
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
exports.createLabReservations = async ({
  groupedTests,
  userId,
  date,
  paymentMethod,
  isPaid,
  paidAt,
}) => {
  for (const labId in groupedTests) {
    const requestedTests = groupedTests[labId];

    // Calculate total cost for the lab
    const totalCost = requestedTests.reduce((acc, test) => acc + test.price, 0);

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
      totalCost, // Use the calculated total cost for this lab's tests
      isPaid,
      paidAt,
    });
  }
};

// Helper function to clear the cart and update totals
exports.updateCartAfterReservation = async (cart) => {
  cart.tests = [];
  cart.totalTestPrice = 0;
  cart.totalPrice = cart.totalMedicinePrice; // Keep medicines price in the total

  if (cart.medicines.length === 0 && cart.tests.length === 0) {
    await cartModel.findByIdAndDelete(cart._id); // Delete cart if empty
  } else {
    await cart.save();
  }
};
