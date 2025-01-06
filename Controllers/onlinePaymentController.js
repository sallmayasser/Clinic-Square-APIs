const cartModel = require("../Models/cartModel");
const asyncHandler = require("express-async-handler");
const PatientModel = require("../Models/patientModel");
const ApiError = require("../utils/apiError");
const {
  groupMedicinesByPharmacy,
  clearCart,
  createOrdersForPharmacies,
} = require("./orderController");
const {
  groupTestsByLabId,
  createLabReservations,
  updateCartAfterReservation,
} = require("./labReservationController");
const PharmacyMedicineModel = require("../Models/pharmacies-medicinesModel");
const MedicineModel = require("../Models/medicineModel");
const LabTestsModel = require("../Models/labs-testsModel");
const testModel = require("../Models/testModel");
const DoctorModel = require("../Models/doctorModel");
const { createDoctorReservation } = require("./doctorReservationController");
const DoctorReservationModel = require("../Models/doctorReservationModel");
const { default: mongoose } = require("mongoose");

const stripe = require("stripe")(process.env.STRIPE_SECRET);

// @desc    Get checkout session from stripe and send it as response
// @route   GET /api/v1/orders/checkout-session/medicine/:cartId
// @access  Protected/User

exports.checkoutSessionMedicine = asyncHandler(async (req, res, next) => {
  // app settings
  const taxPrice = 0; // Add any applicable tax here
  const shippingPrice = 50; // Flat shipping price
  const shippingAddress = JSON.stringify(req.user.address[0]);

  // 1) Get cart depend on cartId
  const cart = await cartModel.findById(req.params.cartId);
  if (!cart) {
    return next(
      new ApiError(`There is no such cart with id ${req.params.cartId}`, 404)
    );
  }

  // Check if medicines exist in cart
  if (!cart.medicines || !Array.isArray(cart.medicines)) {
    return next(new ApiError(`The cart does not contain valid medicines`, 400));
  }

  // 2) Get order price based on cart price
  const cartMedicinePrice = cart.totalMedicinePrice;
  const totalOrderPrice = cartMedicinePrice + taxPrice + shippingPrice; // Calculate the total price

  // 3) Create line items for each medicine in the cart
  const lineItems = await Promise.all(
    cart.medicines.map(async (medicine) => {
      // Check if purchasedMedicines exists and is an array
      if (
        !medicine.purchasedMedicines ||
        !Array.isArray(medicine.purchasedMedicines)
      ) {
        return next(
          new ApiError(`No purchased medicines found for this cart`, 400)
        );
      }

      // Map through the purchasedMedicines
      return Promise.all(
        medicine.purchasedMedicines.map(async (item) => {
          // Fetch the medicine from the PharmacyMedicineModel using the medicineId
          const medicineData = await PharmacyMedicineModel.findById(
            item.medicineId
          );

          if (!medicineData) {
            return next(
              new ApiError(`Medicine not found for ID ${item.medicineId}`, 404)
            );
          }

          const official = await MedicineModel.findById(medicineData.medicine);
          return {
            price_data: {
              currency: "egp",
              product_data: {
                name: official.name,
                images: [official.photo], // Use the medicine's photo
              },
              unit_amount: item.price * 100, // Stripe uses cents
            },
            quantity: item.quantity,
          };
        })
      );
    })
  );

  // 4) Create stripe checkout session
  const session = await stripe.checkout.sessions.create({
    line_items: [
      ...lineItems.flat(), // Flatten the array to a single level
      {
        price_data: {
          currency: "egp",
          product_data: {
            name: "Shipping", // Add shipping as a line item
            images: [
              "https://firebasestorage.googleapis.com/v0/b/clinic-square.appspot.com/o/uploads%2Fdownload.png?alt=media&token=7c49907c-780d-4788-8111-f4ca30488139",
            ],
          },
          unit_amount: shippingPrice * 100, // Convert to cents
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `${req.protocol}://clinic-square-frontend.vercel.app/en/patient/my-activity?pharmaciesPage=1&activeTab=pharmacies`,
    cancel_url: `${req.protocol}://clinic-square-frontend.vercel.app/en/patient/cart`,
    customer_email: req.user.email,
    client_reference_id: req.params.cartId,
    metadata: {
      shippingAddress,
      //items: JSON.stringify(cart.medicines),
      shippingPrice,
      totalOrderPrice, // Include total order price in metadata
    },
  });

  // 5) Send session to response
  res.status(200).json({ status: "success", session });
});

// @desc    Get checkout session from stripe and send it as response
// @route   GET /api/v1/orders/checkout-session/tests/:cartId
// @access  Protected/User

exports.checkoutSessionTests = asyncHandler(async (req, res, next) => {
  // app settings
  const taxPrice = 0; // Add any applicable tax here
  const shippingPrice = 50; // Flat shipping price
  const requestData = req.body.data; // Array of labId and date pairs
  const type = "test";
  // 1) Get cart depend on cartId
  const cart = await cartModel.findById(req.params.cartId);
  if (!cart) {
    return next(
      new ApiError(`There is no such cart with id ${req.params.cartId}`, 404)
    );
  }

  // Check if tests exist in cart
  if (!cart.tests || !Array.isArray(cart.tests)) {
    return next(new ApiError(`The cart does not contain valid tests`, 400));
  }

  // 2) Get order price based on cart test price
  const cartTestPrice = cart.totalTestPrice;
  const totalOrderPrice = cartTestPrice + taxPrice + shippingPrice; // Calculate the total price

  // 3) Create line items for each test in the cart
  const testLineItems = await Promise.all(
    cart.tests.map(async (test) => {
      // Check if purchasedTests exists and is an array
      if (!test.purchasedTests || !Array.isArray(test.purchasedTests)) {
        return next(
          new ApiError(`No purchased tests found for this cart`, 400)
        );
      }

      // Map through the purchasedTests
      return Promise.all(
        test.purchasedTests.map(async (item) => {
          // Fetch the test from the LabTestModel using the testId
          const testData = await LabTestsModel.findById(item.testId);

          if (!testData) {
            return next(
              new ApiError(`Test not found for ID ${item.testId}`, 404)
            );
          }
          const official = await testModel.findById(testData.test);
          return {
            price_data: {
              currency: "egp",
              product_data: {
                name: official.name,
              },
              unit_amount: testData.cost * 100, // Stripe uses cents
            },
            quantity: 1,
          };
        })
      );
    })
  );

  // 4) Create stripe checkout session for tests
  const session = await stripe.checkout.sessions.create({
    line_items: [
      ...testLineItems.flat(), // Flatten the array to a single level for tests
      {
        price_data: {
          currency: "egp",
          product_data: {
            name: "Home Visit", // Add shipping as a line item
            images: [
              "https://firebasestorage.googleapis.com/v0/b/clinic-square.appspot.com/o/uploads%2FhomeVisit.jpg?alt=media&token=007f509e-cdde-4447-8996-e1e0a307bfb1",
            ],
          },
          unit_amount: shippingPrice * 100, // Convert to cents
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `${req.protocol}://clinic-square-frontend.vercel.app/en/patient/my-activity?labsPage=1&activeTab=labs`,
    cancel_url: `${req.protocol}://clinic-square-frontend.vercel.app/en/patient/cart`,
    customer_email: req.user.email,
    client_reference_id: req.params.cartId,
    metadata: {
      type,
      requestDataArray: JSON.stringify(requestData),
      ////shippingPrice,
      // // totalOrderPrice, // Include total order price in metadata
    },
  });

  // 5) Send session to response
  res.status(200).json({
    status: "success",
    session: session,
  });
});

// @desc    Get checkout session from stripe and send it as response
// @route   GET /api/v1/orders/checkout-session/D-reservation
// @access  Protected/User
exports.checkoutSessionDoctor = asyncHandler(async (req, res, next) => {
  // app settings
  const taxPrice = 0;
  const shippingPrice = 0;
  const { doctor } = req.query;
  const date = req.query.reservationDate;
  const type = "D-reservation";
  const patientId = JSON.stringify(req.user._id);
  // 1) Validate Doctor ID
  if (!doctor || !mongoose.Types.ObjectId.isValid(doctor)) {
    return next(new ApiError("Invalid Doctor ID provided", 400));
  }

  // Check if doctor exists
  const doctorData = await DoctorModel.findById(doctor);
  if (!doctorData) {
    return next(new ApiError(`Doctor with ID ${doctor} not found`, 404));
  }

  // 2) Validate Reservation Date
  if (!date) {
    return next(new ApiError("Reservation date is required", 400));
  }

  // Check for existing reservations
  const existingReservation = await DoctorReservationModel.findOne({
    patient: req.user._id,
    doctor,
    date,
  });
  if (existingReservation) {
    return next(
      new ApiError(
        "This patient has already reserved with the same doctor on this date",
        400
      )
    );
  }

  // 3) Calculate Total Price
  const reservationPrice = doctorData.schedule.cost;
  const totalOrderPrice = reservationPrice + taxPrice + shippingPrice;

  // 3) Create stripe checkout session
  const session = await stripe.checkout.sessions.create({
    line_items: [
      {
        price_data: {
          currency: "egp",
          product_data: {
            name: doctorData.name,
          },
          unit_amount: totalOrderPrice * 100, // Stripe uses cents
        },

        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `${req.protocol}://clinic-square-frontend.vercel.app/en/patient/my-activity`,
    cancel_url: `${req.protocol}://clinic-square-frontend.vercel.app/en/patient/cart`,
    customer_email: req.user.email,
    client_reference_id: doctor,
    metadata: { date, type, patientId },
  });

  // 4) send session to response
  res.status(200).json({ status: "success", session });
});

// @desc    This webhook will run when stripe payment success paid
// @route   POST /webhook-checkout
// @access  Protected/User
exports.webhookCheckout = asyncHandler(async (req, res, next) => {
  const sig = req.headers["stripe-signature"];

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
  if (event.type === "checkout.session.completed") {
    if (event.data.object.metadata.type === "test") {
      // create reservation
      createCardReservation(event.data.object);
    } else if (event.data.object.metadata.type === "D-reservation") {
      // create reservation
      createCardDoctorReservation(event.data.object, req);
    } else {
      //  Create order
      createCardOrder(event.data.object);
    }
  }

  res.status(200).json({ received: true });
});

const createCardOrder = async (session) => {
  const cartId = session.client_reference_id;
  const shippingAddress = JSON.parse(session.metadata.shippingAddress); // Parse the shipping address
  const orderPrice = session.amount_total / 100;

  // Step 1: Fetch the cart using cartId
  const cart = await cartModel.findById(cartId);
  if (!cart || cart.medicines.length === 0) {
    throw new ApiError(`No medicines found in the cart with ID ${cartId}`, 400);
  }
  // Step 2: Fetch the user using their email
  const user = await PatientModel.findOne({ email: session.customer_email });
  if (!user) {
    throw new ApiError(
      `No user found with email ${session.customer_email}`,
      404
    );
  }
  // Step 3: Group medicines by pharmacy
  const pharmacyGroups = await groupMedicinesByPharmacy(cart.medicines);

  // Step 4: Create orders for each pharmacy
  const orders = await createOrdersForPharmacies({
    pharmacyGroups,
    userId: user._id,
    shippingAddress,
    paymentMethod: "visa",
    isPaid: true,
    paidAt: Date.now(),
  });

  // Step 5: Clear the cart after creating orders
  await clearCart(cart);
};

const createCardReservation = async (session) => {
  try {
    const cartId = session.client_reference_id;
    const requestData = JSON.parse(session.metadata.requestDataArray); // Array of labId and date pairs

    // Step 1: Fetch the cart using cartId
    const cart = await cartModel.findById(cartId);
    if (!cart || cart.tests.length === 0) {
      throw new ApiError(`No tests found in the cart with ID ${cartId}`, 400);
    }

    // Step 2: Fetch the user using their email
    const user = await PatientModel.findOne({ email: session.customer_email });
    if (!user) {
      throw new ApiError(
        `No user found with email ${session.customer_email}`,
        404
      );
    }

    // Step 3: Group tests by labId
    const groupedTests = groupTestsByLabId(cart.tests);

    // Step 4: Validate requestData and match dates to lab groups
    const labDatesMap = {};
    requestData.forEach((item) => {
      labDatesMap[item.labId] = item.date;
    });

    const reservationsData = Object.keys(groupedTests).map((labId) => {
      if (!labDatesMap[labId]) {
        throw new ApiError(`No date provided for lab ${labId}`, 400);
      }
      return {
        groupedTests: {
          [labId]: groupedTests[labId],
        },
        userId: user._id,
        date: labDatesMap[labId],
        paymentMethod: "visa",
        isPaid: true,
        paidAt: Date.now(),
      };
    });

    // Step 5: Create reservations for each lab group
    await Promise.all(
      reservationsData.map(async (reservation) => {
        await createLabReservations(reservation);
      })
    );

    // Step 6: Clear cart and update totals
    await updateCartAfterReservation(cart);
  } catch (error) {
    console.error("Error creating reservations:", error);
    throw new ApiError("Internal server error", 500);
  }
};

const createCardDoctorReservation = async (session, req) => {
  const doctorId = session.client_reference_id;
  const reservationDate = session.metadata.date;

  req.body.doctor = doctorId;
  req.body.date = reservationDate;
  req.body.patient = JSON.parse(session.metadata.patientId);
  req.body.paymentMethod = "visa";

  await DoctorReservationModel.create(req.body);
};
