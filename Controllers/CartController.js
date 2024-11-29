const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/apiError");
const CartModel = require("../Models/cartModel");
const LabTestsModel = require("../Models/labs-testsModel");
const PharmacyMedicineModel = require("../Models/pharmacies-medicinesModel");
const MedicineModel = require("../Models/medicineModel");

const calculateCartTotals = (cart) => {
  // Calculate total price for medicines
  cart.totalMedicinePrice = cart.medicines.reduce(
    (total, item) => total + item.quantity * item.price,
    0
  );
  // Calculate total price for tests (assuming tests have a fixed price)
  cart.totalTestPrice = cart.tests.reduce(
    (total, test) => total + test.price,
    0
  );
  // Calculate overall total
  cart.totalPrice = cart.totalMedicinePrice + cart.totalTestPrice;
};

const findAndUpdateItem = (array, item, key) => {
  const existingItem = array.find(
    (entry) => entry[key].toString() === item[key]
  );
  if (existingItem) {
    existingItem.quantity += item.quantity || 1; // Increment quantity
  } else {
    array.push(item); // Add new item
  }
};

exports.addToCart = asyncHandler(async (req, res, next) => {
  const { medicineId, testId, quantity = 1 } = req.body;

  // Retrieve user's cart
  let cart = await CartModel.findOne({ user: req.user._id });
  if (!cart) {
    cart = await CartModel.create({ user: req.user._id });
  }

  if (medicineId) {
    const PharmMedicine = await PharmacyMedicineModel.findOne({
      medicine: req.body.medicineId,
    });

    if (!PharmMedicine) return next(new ApiError(`Medicine not found`, 404));

    //find the origin medicine data to get the cost
    const Medicine = await MedicineModel.findById(medicineId);

    findAndUpdateItem(
      cart.medicines,
      { medicineId, quantity, price: Medicine.cost },
      "medicineId"
    );
  }

  if (testId) {
    const test = await LabTestsModel.findOne({ test: testId });

    if (!test) {
      return res.status(404).json({
        message: `No Test with this id : ${testId} found`,
      });
    }
    findAndUpdateItem(cart.tests, { testId, price: test.cost }, "testId");
  }

  calculateCartTotals(cart);
  await cart.save();

  res.status(200).json({ data: cart });
});

exports.getLoggedUserCart = asyncHandler(async (req, res, next) => {
  const cart = await CartModel.findOne({ user: req.user._id });

  if (!cart) {
    return res.status(404).json({
      message: `No cart found for user ${req.user._id}`,
    });
  }

  res.status(200).json({ data: cart });
});
exports.removeItemFromCart = asyncHandler(async (req, res, next) => {
  const { itemId } = req.params; // item ID from route params
  const { type } = req.query; // type ('medicine' or 'test') from query params

  const cart = await CartModel.findOne({ user: req.user._id });

  if (!cart) {
    return res.status(404).json({
      message: `No cart found for user ${req.user._id}`,
    });
  }

  if (type === "medicine") {
    cart.medicines = cart.medicines.filter(
      (item) => item._id.toString() !== itemId
    );
  } else if (type === "test") {
    cart.tests = cart.tests.filter((item) => item._id.toString() !== itemId);
  } else {
    return next(new ApiError(`Invalid type specified`, 400));
  }

  // Check if both medicines and tests are empty
  if (cart.medicines.length === 0 && cart.tests.length === 0) {
    // Delete the cart if empty
    await CartModel.findByIdAndDelete(cart._id);

    return res.status(200).json({
      message: "Cart is empty and has been deleted",
    });
  }

  // Recalculate totals if the cart still has items
  calculateCartTotals(cart);
  await cart.save();

  res.status(200).json({
    message: "Item removed successfully",
    data: cart,
  });
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
    const item = cart.medicines.find((item) => item._id.toString() === itemId);
    if (!item) {
      return res.status(404).json({
        message: `No cart found for user ${req.user._id}`,
      });
    }
    item.quantity = quantity;
  }
  // else if (type === "test") {
  //     const item = cart.tests.find((item) => item._id.toString() === itemId);
  //     if (!item) {
  //       return res.status(404).json({
  //         message: `No Item found for user ${req.user._id}`,
  //       });
  //     }
  //   }
  else {
    return next(new ApiError(`Invalid type specified`, 400));
  }

  calculateCartTotals(cart);
  await cart.save();

  res.status(200).json({
    status: "success",
    message: "Item quantity updated successfully",
    data: cart,
  });
});
