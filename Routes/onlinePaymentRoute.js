const express = require("express");
const {
  checkoutSessionMedicine,
  checkoutSessionTests,
  checkoutSessionDoctor,
} = require("../Controllers/onlinePaymentController");

const authService = require("../Controllers/authController");
const { getLoggedUserData } = require("../Controllers/handlerFactory");
const { setPatientIdToBody } = require("../Controllers/PatientController");
const {
  createDoctorReservationValidator,
  createOnlineDoctorReservationValidator,
} = require("../utils/validators/doctorReservationValidator");

const router = express.Router({ mergeParams: true });

router.use(authService.protect, authService.allowedTo("patient"));

router.route("/medicine/:cartId").get(checkoutSessionMedicine);
router.route("/tests/:cartId").get(checkoutSessionTests);
router
  .route("/D-reservation")
  .get(
    getLoggedUserData,
    createOnlineDoctorReservationValidator,
    checkoutSessionDoctor
  );
module.exports = router;
