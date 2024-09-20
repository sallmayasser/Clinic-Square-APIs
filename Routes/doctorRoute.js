const express = require("express");

const {
  getDoctor,
  getDoctors,
  createDoctor,
  deleteDoctor,
  updateDoctor,
} = require("../Controllers/doctorController");
const validator = require("../utils/validators/doctorValidator");

const router = express.Router({ mergeParams: true });

router
  .route("/")
  .get(getDoctors)
  .post(validator.createDoctorValidator, createDoctor);

router
  .route("/:id")
  .get(validator.getDoctorValidator, getDoctor)
  .put(validator.updateDoctorValidator, updateDoctor)
  .delete(validator.deleteDoctorValidator, deleteDoctor);

module.exports = router;
