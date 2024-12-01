const cartModel = require("../Models/cartModel");
const asyncHandler = require("express-async-handler");
const PatientModel = require("../Models/patientModel");
const ApiError = require("../utils/apiError");
const { groupMedicinesByPharmacy, clearCart } = require("./CartController");

const stripe = require("stripe")(process.env.STRIPE_SECRET);

// @desc    Get checkout session from stripe and send it as response
// @route   GET /api/v1/orders/checkout-session/medicine/:cartId
// @access  Protected/User
exports.checkoutSessionMedicine = asyncHandler(async (req, res, next) => {
  // app settings
  const taxPrice = 0;
  const shippingPrice = 50;
  const shippingAddress = JSON.stringify(req.user.address[0]);

  // 1) Get cart depend on cartId
  const cart = await cartModel.findById(req.params.cartId);
  if (!cart) {
    return next(
      new ApiError(`There is no such cart with id ${req.params.cartId}`, 404)
    );
  }

  // 2) Get order price depend on cart price
  const cartMedicinePrice = cart.totalMedicinePrice;

  const totalOrderPrice = cartMedicinePrice + taxPrice + shippingPrice;

  // 3) Create stripe checkout session
  const session = await stripe.checkout.sessions.create({
    line_items: [
      {
        price_data: {
          currency: "egp",
          product_data: {
            name: req.user.name,
          },
          unit_amount: totalOrderPrice * 100,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `${req.protocol}://${req.get("host")}/patient/order`,
    cancel_url: `${req.protocol}://${req.get("host")}/patient/cart`,
    customer_email: req.user.email,
    client_reference_id: req.params.cartId,
    metadata: {shippingAddress},
  });

  // 4) send session to response
  res.status(200).json({ status: "success", session });
});

// @desc    This webhook will run when stripe payment success paid
// @route   POST /webhook-checkout
// @access  Protected/User
exports.webhookCheckout = asyncHandler(async (req, res, next) => {
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  if (event.type === 'checkout.session.completed') {
    //  Create order
    createCardOrder(event.data.object);
  }

  res.status(200).json({ received: true });
});


const createCardOrder = async (session) => {
  const cartId = session.client_reference_id;
  const shippingAddress = JSON.parse(session.metadata.shippingAddress); // Parse the shipping address
  const orderPrice = session.amount_total / 100;

  // 1) Fetch the cart using cartId
  const cart = await cartModel.findById(cartId);
  if (!cart || cart.medicines.length === 0) {
    throw new ApiError(`No medicines found in the cart with ID ${cartId}`, 400);
  }

  // 2) Fetch the user using their email
  const user = await PatientModel.findOne({ email: session.customer_email });
  if (!user) {
    throw new ApiError(
      `No user found with email ${session.customer_email}`,
      404
    );
  }

  // 3) Group medicines by pharmacy
  const pharmacyGroups = await groupMedicinesByPharmacy(cart.medicines);

  // 4) Create orders for each pharmacy
  const orders = [];
  for (const pharmacyId in pharmacyGroups) {
    const medicines = pharmacyGroups[pharmacyId];
    const totalCost = medicines.reduce(
      (acc, medicine) => acc + medicine.price * medicine.quantity,
      0
    );

    const newOrder = await OrderModel.create({
      patient: user._id,
      pharmacy: pharmacyId,
      paymentMethod: "visa",
      medicines,
      totalCost,
      shippingAddress,
      isPaid: true,
      paidAt: Date.now(),
    });

    orders.push(newOrder);
  }

  // 5) Clear the cart after creating orders
  await clearCart(cart);
  // Step 5: Respond with the created orders
  res.status(201).json({
    message: "Orders created successfully"
  });
};
