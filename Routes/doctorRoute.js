const express = require("express");
const {
  createFilterObj,
  updateLoggedUserPassword,
  deleteLoggedUserData,
  getLoggedUserData,
} = require("../Controllers/handlerFactory");
const {
  getDoctor,
  getDoctors,
  deleteDoctor,
  updateDoctor,
  setDoctorToBody,
  updateLoggedDoctorData,
} = require("../Controllers/doctorController");
const validators = require("../utils/validators/doctorValidator");

const { resizeImage, uploadImage } = require("../controllers/imageController");
const authController = require("../controllers/authController");
const DoctorModel = require("../Models/doctorModel");
const {
  getDoctorReservations,
} = require("../Controllers/doctorReservationController");

const router = express.Router({ mergeParams: true });

router.use(authController.protect);

// Doctor routes
router.get(
  "/getMe",
  authController.allowedTo("doctor"),
  getLoggedUserData,
  getDoctor
);
router.put(
  "/changeMyPassword",
  authController.allowedTo("doctor"),
  validators.changeDoctorPasswordValidator,
  updateLoggedUserPassword(DoctorModel)
);
router.put(
  "/updateMe",
  authController.allowedTo("doctor"),
  getLoggedUserData,
  uploadImage,
  setDoctorToBody,
  resizeImage,
  validators.updateLoggedDoctorValidator,
  updateLoggedDoctorData
);

// nested Route
router.route("/My-Reservation").get(
  getLoggedUserData,
  (req, res, next) => {
    createFilterObj(req, res, next, "doctor");
  },
  authController.allowedTo("doctor"),
  getDoctorReservations
);

// admin routes

router.route("/").get(authController.allowedTo("admin", "patient"), getDoctors);

router
  .route("/:id")
  .get(validators.getDoctorValidator, getDoctor)
  .put(
    authController.allowedTo("admin"),
    uploadImage,
    resizeImage,
    validators.updateDoctorValidator,
    updateDoctor
  )
  .delete(
    authController.allowedTo("admin"),
    validators.deleteDoctorValidator,
    deleteDoctor
  );

module.exports = router;
