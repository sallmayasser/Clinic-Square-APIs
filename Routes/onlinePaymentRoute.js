const express = require("express");
const {
  checkoutSessionMedicine,
} = require("../Controllers/onlinePaymentController");

const authService = require("../Controllers/authController");

const router = express.Router({ mergeParams: true });

router.use(authService.protect, authService.allowedTo("patient"));

router.route("/medicine/:cartId").get(checkoutSessionMedicine);

module.exports = router;
