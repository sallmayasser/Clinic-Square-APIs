const express = require("express");
const {
  getLoggedUserData,
  createFilterObj,
} = require("../Controllers/handlerFactory");
const {
  getDoctorReservation,
  getDoctorReservations,
  createDoctorReservation,
  deleteDoctorReservation,
  updateDoctorReservation,
} = require("../Controllers/doctorReservationController");
const validator = require("../utils/validators/doctorReservationValidator");
const authController = require("../Controllers/authController");
const {
  setPatientToBody,
  setPatientIdToBody,
} = require("../Controllers/PatientController");
const { uploadImage, resizeImage } = require("../Controllers/imageController");

const router = express.Router({ mergeParams: true });

router.use(authController.protect);

router
  .route("/")
  .get(authController.allowedTo("admin"), getDoctorReservations)
  .post(
    authController.allowedTo("patient"),
    getLoggedUserData,
    setPatientIdToBody,
    validator.createDoctorReservationValidator,
    (req, res) => {
      console.log(req.body);
    },
    createDoctorReservation
  );

router
  .route("/:id")
  .get(
    authController.allowedTo("doctor", "patient", "admin"),
    validator.getReservationValidator,
    getDoctorReservation
  )
  .patch(
    authController.allowedTo("doctor", "patient"),
    uploadImage,
    setPatientToBody,
    resizeImage,
    validator.updateReservationValidator,
    updateDoctorReservation
  )
  .delete(
    authController.protect,
    authController.allowedTo("patient"),
    validator.deleteReservationValidator,
    deleteDoctorReservation
  );

module.exports = router;
