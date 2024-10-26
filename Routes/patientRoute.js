const express = require("express");
const {
  createFilterObj,
  updateLoggedUserPassword,
  deleteLoggedUserData,
  getLoggedUserData,
} = require("../Controllers/handlerFactory");
const {
  getPatient,
  getPatients,
  deletePatient,
  updatePatient,
  setPatientToBody,
  updateLoggedPatientData,
  setPatientIdToBody,
} = require("../Controllers/PatientController");
const validators = require("../utils/validators/patientValidator");
const { resizeImage, uploadImage } = require("../Controllers/imageController");
const authController = require("../Controllers/authController");
const PatientModel = require("../Models/patientModel");
const {
  getDoctorReservations,
} = require("../Controllers/doctorReservationController");
const {
  getLabReservations,
} = require("../Controllers/labReservationController");

const router = express.Router({ mergeParams: true });

router.use(authController.protect);

// patient routes

router.get(
  "/getMe",
  authController.allowedTo("patient"),
  getLoggedUserData,
  getPatient
);

router.patch(
  "/updateMe",
  authController.allowedTo("patient"),
  getLoggedUserData,
  uploadImage,
  setPatientToBody,
  resizeImage,
  validators.updateLoggedPatientValidator,
  updateLoggedPatientData
);

router.patch(
  "/changeMyPassword",
  authController.allowedTo("patient"),
  validators.changePatientPasswordValidator,
  updateLoggedUserPassword(PatientModel)
);

// nested Route

router.get(
  "/Patient-reservation",
  authController.allowedTo("patient"),
  getLoggedUserData,
  (req, res, next) => {
    createFilterObj(req, res, next, "patient");
  },
  getDoctorReservations
);

router.get(
  "/Patient-LabReservation",
  authController.allowedTo("patient"),
  getLoggedUserData,
  (req, res, next) => {
    createFilterObj(req, res, next, "patient");
  },
  getLabReservations
);

// admin routes

router.route("/").get(authController.allowedTo("admin"), getPatients);

router
  .route("/:id")
  .get(validators.getPatientValidator, getPatient)
  .patch(
    authController.allowedTo("admin"),
    uploadImage,
    resizeImage,
    validators.updatePatientValidator,
    updatePatient
  )
  .delete(
    authController.allowedTo("admin"),
    validators.deletePatientValidator,
    deletePatient
  );

module.exports = router;
