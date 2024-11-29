const factory = require("../Controllers/handlerFactory");
const CartModel = require("../Models/cartModel");
const OrderModel = require("../Models/OrderModel");
const asyncHandler = require("express-async-handler");

// @desc    Create an order from the user's cart medicines
// @route   POST /api/v1/orders
// @access  Private/User
exports.createOrder = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;
  const { pharmacy } = req.body;

  // Step 1: Get the user's cart
  const cart = await CartModel.findOne({ user: userId });

  if (!cart || cart.medicines.length === 0) {
    return res.status(400).json({
      message:
        "Your cart is empty. Please add medicines before placing an order.",
    });
  }

  // Step 2: Extract medicines and total price
  const medicines = cart.medicines.map((item) => ({
    medicineId: item.medicineId,
    name: item.name,
    quantity: item.quantity,
    price: item.price,
  }));

  const totalCost = cart.totalMedicinePrice;

  // Step 3: Create the order
  const newOrder = await OrderModel.create({
    patient: userId, // Assuming "patient" represents the user in the Order schema
    pharmacy,
    medicine: medicines,
    totalCost,
  });

  // Step 4: Clear medicines from the cart
  cart.medicines = [];
  cart.totalMedicinePrice = 0;
  cart.totalPrice = cart.totalTestPrice; // Update cart total price to include only tests

  // Step 5: Check if cart is empty and delete it if necessary
  if (cart.medicines.length === 0 && cart.tests.length === 0) {
    await CartModel.findByIdAndDelete(cart._id);
  } else {
    await cart.save();
  }

  // Step 6: Respond with the order details
  res.status(201).json({
    order: newOrder,
  });
});

exports.getOrders = factory.getAll(OrderModel);
exports.getOrder = factory.getOne(OrderModel);
exports.updateOrder = factory.updateOne(OrderModel);

exports.deleteOrder = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const order = await OrderModel.findById(id);

  if (order.state === "pending") {
    await OrderModel.findByIdAndDelete(id);
    res.status(200).json({
      message: "Order has been successfully canceled",
    });
  } else {
    res.status(400).json({
      message: "Order has been shipping you can't cancel it right now ",
    });
  }
});
