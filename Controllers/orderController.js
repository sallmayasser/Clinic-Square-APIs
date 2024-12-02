const factory = require("../Controllers/handlerFactory");
const CartModel = require("../Models/cartModel");
const OrderModel = require("../Models/OrderModel");
const asyncHandler = require("express-async-handler");
const PharmacyMedicineModel = require("../Models/pharmacies-medicinesModel");
const ApiError = require("../utils/apiError");

exports.getOrders = factory.getAll(OrderModel);
exports.getOrder = factory.getOne(OrderModel);
exports.updateOrder = factory.updateOne(OrderModel);

// @desc    Create an order from the user's cart medicines
// @route   POST /api/v1/orders
// @access  Private/User
exports.createOrder = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;
  const { paymentMethod } = req.body;
  const shippingAddress = req.user.address[0];

  // Step 1: Get the user's cart
  const cart = await CartModel.findOne({ user: userId });
  if (!cart || cart.medicines.length === 0) {
    return res.status(400).json({
      message:
        "Your cart is empty. Please add medicines before placing an order.",
    });
  }

  // Step 2: Group medicines by pharmacy
  const pharmacyGroups = await this.groupMedicinesByPharmacy(cart.medicines);

  // Step 3: Create orders for each pharmacy
  const orders = await this.createOrdersForPharmacies({
    pharmacyGroups,
    userId,
    shippingAddress,
    paymentMethod,
  });

  // Step 4: Clear the cart after creating orders
  await this.clearCart(cart);

  // Step 5: Respond with the created orders
  res.status(201).json({
    message: "Orders created successfully",
    orders,
  });
});

// Helper function to group medicines by pharmacy
exports.groupMedicinesByPharmacy = async (medicines) => {
  const pharmacyGroups = {};

  // Loop through each item in the medicines array
  for (const item of medicines) {
    // Loop through each medicine in the purchasedMedicines array
    for (const purchasedMedicine of item.purchasedMedicines) {
      const pharmacyMedicine = await PharmacyMedicineModel.findOne({
        pharmacy: item.pharmacyId,
        _id: purchasedMedicine.medicineId,
      });
      // Check if the pharmacy medicine exists and has enough stock
      if (
        !pharmacyMedicine ||
        pharmacyMedicine.stock < purchasedMedicine.quantity
      ) {
        throw new ApiError(
          `Not enough stock for medicine ID ${purchasedMedicine.medicineId}. Only ${pharmacyMedicine.stock} available.`,
          400
        );
      }

      // Deduct stock from the pharmacy
      pharmacyMedicine.stock -= purchasedMedicine.quantity;
      await pharmacyMedicine.save();

      // Group medicines by pharmacyId
      if (!pharmacyGroups[item.pharmacyId]) {
        pharmacyGroups[item.pharmacyId] = [];
      }

      pharmacyGroups[item.pharmacyId].push({
        medicineId: purchasedMedicine.medicineId,
        price: purchasedMedicine.price,
        quantity: purchasedMedicine.quantity,
      });
    }
  }

  return pharmacyGroups;
};

//  function to create orders for each pharmacy
exports.createOrdersForPharmacies = async ({
  pharmacyGroups,
  userId,
  shippingAddress,
  paymentMethod,
  isPaid = false,
  paidAt = null,
}) => {
  const orders = [];

  for (const pharmacyId in pharmacyGroups) {
    const medicines = pharmacyGroups[pharmacyId];
    const totalCost = medicines.reduce(
      (acc, medicine) => acc + medicine.price * medicine.quantity,
      0
    );

    const newOrder = await OrderModel.create({
      patient: userId,
      pharmacy: pharmacyId,
      paymentMethod,
      medicines,
      totalCost,
      shippingAddress,
      isPaid,
      paidAt,
    });

    orders.push(newOrder);
  }

  return orders;
};

// Helper function to clear the cart after order creation
exports.clearCart = async (cart) => {
  cart.medicines = [];
  cart.totalMedicinePrice = 0;
  cart.totalPrice = cart.totalTestPrice;

  if (cart.medicines.length === 0 && cart.tests.length === 0) {
    await CartModel.findByIdAndDelete(cart._id);
  } else {
    await cart.save();
  }
};

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
