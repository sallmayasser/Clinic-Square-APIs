const express = require("express");

const {
  getPatient,
  getPatients,
  createPatient,
  deletePatient,
  updatePatient,
} = require("../Controllers/PatientController");
const validator = require("../utils/validators/patientValidator");

const router = express.Router({ mergeParams: true });

router
  .route("/")
  .get(getPatients)
  .post(validator.createPatientValidator, createPatient);

router
  .route("/:id")
  .get(validator.getPatientValidator, getPatient)
  .put(validator.updatePatientValidator, updatePatient)
  .delete(validator.deletePatientValidator, deletePatient);

module.exports = router;
