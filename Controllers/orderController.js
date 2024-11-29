const factory = require("../Controllers/handlerFactory");
const CartModel = require("../Models/cartModel");
const OrderModel = require("../Models/OrderModel");
const asyncHandler = require("express-async-handler");
const PharmacyMedicineModel = require("../Models/pharmacies-medicinesModel");

exports.getOrders = factory.getAll(OrderModel);
exports.getOrder = factory.getOne(OrderModel);
exports.updateOrder = factory.updateOne(OrderModel);

// @desc    Create an order from the user's cart medicines
// @route   POST /api/v1/orders
// @access  Private/User

exports.createOrder = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;
  const { pharmacy, paymentMethod, medicines: orderedMedicines } = req.body;

  // Step 1: Get the user's cart
  const cart = await CartModel.findOne({ user: userId });

  if (!cart || cart.medicines.length === 0) {
    return res.status(400).json({
      message:
        "Your cart is empty. Please add medicines before placing an order.",
    });
  }

  // Step 2: Check medicine availability and prepare order items
  const medicines = [];
  let totalCost = 0;
  for (let item of cart.medicines) {
    const pharmacyMedicine = await PharmacyMedicineModel.findOne({
      pharmacy: pharmacy,
      medicine: item.medicineId,
    });

    if (!pharmacyMedicine || pharmacyMedicine.stock < item.quantity) {
      return res.status(400).json({
        message: `Not enough stock for ${item.name}. Only ${pharmacyMedicine.stock} available.`,
      });
    }

    // Deduct the stock for the medicine
    pharmacyMedicine.stock -= item.quantity;
    await pharmacyMedicine.save();

    // Add to medicines array
    medicines.push({
      medicineId: item.medicineId,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
    });

    totalCost += item.price * item.quantity;
  }

  // Step 3: Create the order
  const newOrder = await OrderModel.create({
    patient: userId, // Assuming "patient" represents the user in the Order schema
    pharmacy,
    paymentMethod,
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
    message: "Order created successfully",
    order: newOrder,
  });
});

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
