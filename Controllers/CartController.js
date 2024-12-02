const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/apiError");
const ApiFeatures = require("../utils/apiFeatures");
const CartModel = require("../Models/cartModel");
const LabTestsModel = require("../Models/labs-testsModel");
const PharmacyMedicineModel = require("../Models/pharmacies-medicinesModel");
const MedicineModel = require("../Models/medicineModel");

const calculateCartTotals = (cart) => {
  // Calculate total price for medicines
  cart.totalMedicinePrice = cart.medicines.reduce((total, pharmacyEntry) => {
    const pharmacyTotal = pharmacyEntry.purchasedMedicines.reduce(
      (subTotal, item) => subTotal + item.quantity * item.price,
      0
    );
    return total + pharmacyTotal;
  }, 0);

  // Calculate total price for tests
  cart.totalTestPrice = cart.tests.reduce((total, labEntry) => {
    const labTotal = labEntry.purchasedTests.reduce(
      (subTotal, test) => subTotal + test.price,
      0
    );
    return total + labTotal;
  }, 0);

  // Calculate overall total
  cart.totalPrice = cart.totalMedicinePrice + cart.totalTestPrice;
};

const findOrCreateCart = async (userId) => {
  let cart = await CartModel.findOne({ user: userId });
  if (!cart) {
    cart = await CartModel.create({ user: userId });
  }
  return cart;
};

// Add or update a medicine in the cart
const addMedicineToCart = async (cart, medicineId, quantity) => {
  const pharmacyMedicine = await PharmacyMedicineModel.findOne({
    _id: medicineId,
  });

  if (!pharmacyMedicine) {
    throw new ApiError("Medicine not found", 404);
  }

  const medicine = await MedicineModel.findById(pharmacyMedicine.medicine);
  if (!medicine) {
    throw new ApiError("Medicine not found", 404);
  }

  // Check if pharmacy already exists in the cart
  const pharmacyEntry = cart.medicines.find(
    (entry) =>
      entry.pharmacyId.toString() === pharmacyMedicine.pharmacy._id.toString()
  );

  if (pharmacyEntry) {
    // Check if the medicine already exists in the pharmacy's purchased medicines
    const existingMedicine = pharmacyEntry.purchasedMedicines.find(
      (item) => item.medicineId.toString() === medicineId
    );

    if (existingMedicine) {
      // Increment the quantity if the medicine already exists
      existingMedicine.quantity += quantity;
    } else {
      // Add the new medicine to the existing pharmacy entry
      pharmacyEntry.purchasedMedicines.push({
        medicineId,
        price: medicine.cost,
        quantity,
      });
    }
  } else {
    // Add a new pharmacy entry
    cart.medicines.push({
      pharmacyId: pharmacyMedicine.pharmacy._id,
      purchasedMedicines: [
        {
          medicineId,
          price: medicine.cost,
          quantity,
        },
      ],
    });
  }
};

//  Add or update a test in the cart
const addTestToCart = async (cart, testId) => {
  const labTest = await LabTestsModel.findById(testId).populate("lab");
  if (!labTest) {
    throw new ApiError("Test not found", 404);
  }

  // Check if lab already exists in the cart
  const labEntry = cart.tests.find(
    (entry) => entry.labId.toString() === labTest.lab._id.toString()
  );

  if (labEntry) {
    // Check if the test already exists in the lab's purchased tests
    const existingTest = labEntry.purchasedTests.find(
      (item) => item.testId.toString() === testId
    );

    if (existingTest) {
      throw new ApiError("Test already exists in the cart", 400);
    }

    // Add the new test to the existing lab entry
    labEntry.purchasedTests.push({
      testId,
      price: labTest.cost,
    });
  } else {
    // Add a new lab entry
    cart.tests.push({
      labId: labTest.lab._id,
      purchasedTests: [
        {
          testId,
          price: labTest.cost,
        },
      ],
    });
  }
};

exports.addToCart = asyncHandler(async (req, res, next) => {
  const { medicineId, testId, quantity = 1 } = req.body;

  const cart = await findOrCreateCart(req.user._id);

  try {
    if (medicineId) {
      await addMedicineToCart(cart, medicineId, quantity);
    }

    if (testId) {
      await addTestToCart(cart, testId);
    }

    calculateCartTotals(cart);
    await cart.save();
    const filter = { user: req.user._id }; // Filter for logged-in user's cart
    let query = CartModel.findOne(filter);
    const apiFeatures = new ApiFeatures(query, req.query);

    await apiFeatures.populate();
    const { mongooseQuery } = apiFeatures;
    const documents = await mongooseQuery;
    res.status(200).json({ data: documents });
  } catch (error) {
    next(error);
  }
});

exports.removeItemFromCart = asyncHandler(async (req, res, next) => {
  const { itemId } = req.params; // item ID from route params
  const { type } = req.query; // type ('medicine' or 'test') from query params

  const cart = await CartModel.findOne({ user: req.user._id });

  if (!cart) {
    return res
      .status(404)
      .json({ message: `No cart found for user ${req.user._id}` });
  }

  if (type === "medicine") {
    // Iterate over pharmacies to find and remove the medicine
    cart.medicines = cart.medicines
      .map((pharmacyEntry) => {
        pharmacyEntry.purchasedMedicines =
          pharmacyEntry.purchasedMedicines.filter(
            (medicine) => medicine._id.toString() !== itemId
          );
        return pharmacyEntry;
      })
      .filter((pharmacyEntry) => pharmacyEntry.purchasedMedicines.length > 0); // Remove empty pharmacy entries
  } else if (type === "test") {
    // Iterate over labs to find and remove the test
    cart.tests = cart.tests
      .map((labEntry) => {
        labEntry.purchasedTests = labEntry.purchasedTests.filter(
          (test) => test._id.toString() !== itemId
        );
        return labEntry;
      })
      .filter((labEntry) => labEntry.purchasedTests.length > 0); // Remove empty lab entries
  } else {
    return next(new ApiError("Invalid type specified", 400));
  }

  // Delete the cart if it becomes empty
  if (cart.medicines.length === 0 && cart.tests.length === 0) {
    await CartModel.findByIdAndDelete(cart._id);
    return res
      .status(200)
      .json({ message: "Cart is empty and has been deleted" });
  }

  // Recalculate totals
  calculateCartTotals(cart);
  await cart.save();
  const filter = { user: req.user._id }; // Filter for logged-in user's cart
  let query = CartModel.findOne(filter);
  const apiFeatures = new ApiFeatures(query, req.query);

  await apiFeatures.populate();
  const { mongooseQuery } = apiFeatures;
  const documents = await mongooseQuery;
  res.status(200).json({ message: "Item removed successfully", data: documents });
});

exports.clearCart = asyncHandler(async (req, res, next) => {
  await CartModel.findOneAndDelete({ user: req.user._id });

  res.status(200).json({
    message: "Cart cleared successfully",
  });
});
exports.updateItemQuantity = asyncHandler(async (req, res, next) => {
  const { itemId } = req.params;
  const { quantity, type } = req.body;

  const cart = await CartModel.findOne({ user: req.user._id });
  if (!cart)
    return next(new ApiError(`No cart found for user ${req.user._id}`, 404));

  if (type === "medicine") {
    // Loop through medicines and check if the itemId exists in purchasedMedicines
    const pharmacy = cart.medicines.find((pharmacy) => {
      return pharmacy.purchasedMedicines.some(
        (item) => item.medicineId._id.toString() === itemId // Make sure you access medicineId correctly
      );
    });

    if (!pharmacy) {
      return res.status(404).json({
        message: `No medicine found with id ${itemId} for user ${req.user._id}`,
      });
    }

    // Find the specific medicine inside purchasedMedicines and update its quantity
    const medicine = pharmacy.purchasedMedicines.find(
      (item) => item.medicineId._id.toString() === itemId
    );

    if (medicine) {
      medicine.quantity = quantity; // Update the quantity of the medicine
    }
  } else {
    return next(new ApiError(`Invalid type specified`, 400));
  }

  // Recalculate totals after updating the quantity
  calculateCartTotals(cart);

  // Save the updated cart
  await cart.save();
  

  const filter = { user: req.user._id }; // Filter for logged-in user's cart
  let query = CartModel.findOne(filter);
  const apiFeatures = new ApiFeatures(query, req.query);

  await apiFeatures.populate();
  const { mongooseQuery } = apiFeatures;
  const documents = await mongooseQuery;


  return res.status(200).json({
    message: "Item quantity updated successfully",
    data: documents,
  });
});

exports.getLoggedUserCart = asyncHandler(async (req, res, next) => {
  const filter = { user: req.user._id }; // Filter for logged-in user's cart
  let query = CartModel.findOne(filter);

  const apiFeatures = new ApiFeatures(query, req.query);
  await apiFeatures.filter();
  await apiFeatures.paginate();
  await apiFeatures.limitFields();
  await apiFeatures.sort();
  await apiFeatures.populate();

  // Execute the query
  const { mongooseQuery, paginationResult } = apiFeatures;
  const cart = await mongooseQuery;

  if (!cart) {
    return res.status(404).json({
      message: `No cart found for user ${req.user._id}`,
    });
  }
  res.status(200).json({
    paginationResult,
    data: cart,
  });
});
