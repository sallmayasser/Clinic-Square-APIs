const express = require("express");

const {
  getDoctorReservation,
  getDoctorReservations,
  createDoctorReservation,
  deleteDoctorReservation,
  updateDoctorReservation,
} = require("../Controllers/doctorReservationController");
const validator = require("../utils/validators/doctorReservationValidator");

const router = express.Router({ mergeParams: true });

router
  .route("/")
  .get(getDoctorReservations)
  .post(validator.createDoctorReservationValidator, createDoctorReservation);

router
  .route("/:id")
  .get(validator.getReservationValidator, getDoctorReservation)
  .patch(validator.updateReservationValidator, updateDoctorReservation)
  .delete(validator.deleteReservationValidator, deleteDoctorReservation);

module.exports = router;
