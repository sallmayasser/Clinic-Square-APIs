const slugify = require("slugify");
const { check, body } = require("express-validator");
const validatorMiddleware = require("../../Middlewares/validatorMiddleware");
const ReservationModel = require("../../Models/doctorReservationModel");
const PatientModel = require("../../Models/patientModel");
const DoctorModel = require("../../Models/doctorModel");
const ApiError = require("../apiError");

exports.getReservationValidator = [
  check("id").isMongoId().withMessage("Invalid Reservation id format"),
  validatorMiddleware,
];

exports.createDoctorReservationValidator = [
  check("patient")
    .notEmpty()
    .withMessage("Patient ID is required")
    .isMongoId()
    .withMessage("Invalid Patient ID")
    .custom(async (val) => {
      const patientExists = await PatientModel.findById(val);
      if (!patientExists) {
        throw new Error("Patient not found");
      }
      return true;
    }),

  check("doctor")
    .notEmpty()
    .withMessage("Doctor ID is required")
    .isMongoId()
    .withMessage("Invalid Doctor ID")
    .custom(async (val) => {
      const doctorExists = await DoctorModel.findById(val);
      if (!doctorExists) {
        throw new Error("Doctor not found");
      }
      return true;
    }),

  check("date")
    .notEmpty()
    .withMessage("Reservation date is required")
    .custom(async (date, { req }) => {
      const existingReservation = await ReservationModel.findOne({
        patient: req.body.patient,
        doctor: req.body.doctor,
        date: date,
      });

      if (existingReservation) {
        throw new Error(
          "This patient has already reserved with the same doctor on this date."
        );
      }

      return true;
    }),

  check("state")
    .optional()
    .isIn(["completed", "consultation", "pending"])
    .withMessage(
      "Invalid state. Must be either 'completed', 'consultation', or 'pending'"
    ),

  check("report.diagnose")
    .optional()
    .isString()
    .withMessage("Diagnose must be a string"),

  check("report.medicine")
    .optional()
    .isArray()
    .withMessage("Medicine must be an array"),
  check("report.medicine.*.name")
    .optional()
    .isString()
    .withMessage("Medicine name must be a string"),
  check("report.medicine.*.dose")
    .optional()
    .isString()
    .withMessage("Medicine dose must be a string"),

  check("report.requestedTests")
    .optional()
    .isArray()
    .withMessage("Requested tests must be an array"),
  check("report.requestedTests.*")
    .optional()
    .isString()
    .withMessage("Requested test must be a string"),

  validatorMiddleware,
];
exports.createOnlineDoctorReservationValidator = [
  check("patient")
    .notEmpty()
    .withMessage("Patient ID is required")
    .isMongoId()
    .withMessage("Invalid Patient ID")
    .custom(async (val) => {
      const patientExists = await PatientModel.findById(val);
      if (!patientExists) {
        throw new Error("Patient not found");
      }
      return true;
    }),

  check("doctor")
    .notEmpty()
    .withMessage("Doctor ID is required")
    .isMongoId()
    .withMessage("Invalid Doctor ID")
    .custom(async (val) => {
      const doctorExists = await DoctorModel.findById(val);
      if (!doctorExists) {
        throw new Error("Doctor not found");
      }
      return true;
    }),

  check("reservationDate")
    .notEmpty()
    .withMessage("Reservation date is required")
    .custom(async (reservationDate, { req }) => {
      const existingReservation = await ReservationModel.findOne({
        patient: req.body.patient,
        doctor: req.body.doctor,
        date: new Date(reservationDate),
      });

      if (existingReservation) {
        throw new Error(
          "This patient has already reserved with the same doctor on this date."
        );
      }

      return true;
    }),

  check("state")
    .optional()
    .isIn(["completed", "consultation", "pending"])
    .withMessage(
      "Invalid state. Must be either 'completed', 'consultation', or 'pending'"
    ),

  check("report.diagnose")
    .optional()
    .isString()
    .withMessage("Diagnose must be a string"),

  check("report.medicine")
    .optional()
    .isArray()
    .withMessage("Medicine must be an array"),
  check("report.medicine.*.name")
    .optional()
    .isString()
    .withMessage("Medicine name must be a string"),
  check("report.medicine.*.dose")
    .optional()
    .isString()
    .withMessage("Medicine dose must be a string"),

  check("report.requestedTests")
    .optional()
    .isArray()
    .withMessage("Requested tests must be an array"),
  check("report.requestedTests.*")
    .optional()
    .isString()
    .withMessage("Requested test must be a string"),

  validatorMiddleware,
];

exports.updateReservationValidator = [
  check("id").isMongoId().withMessage("Invalid ID formate"),

  check("state")
    .optional()
    .isIn(["completed", "consultation", "pending"])
    .withMessage(
      "Invalid state. Must be either 'completed', 'consultation', or 'pending'"
    ),

  check("report.diagnose")
    .optional()
    .isString()
    .withMessage("Diagnose must be a string"),

  check("report.medicine")
    .optional()
    .isArray()
    .withMessage("Medicine must be an array"),
  check("report.medicine.*.name")
    .optional()
    .isString()
    .withMessage("Medicine name must be a string"),
  check("report.medicine.*.dose")
    .optional()
    .isString()
    .withMessage("Medicine dose must be a string"),

  check("report.requestedTests")
    .optional()
    .isArray()
    .withMessage("Requested tests must be an array"),
  check("report.requestedTests.*")
    .optional()
    .isString()
    .withMessage("Requested test must be a string"),
  validatorMiddleware,
];

exports.deleteReservationValidator = [
  check("id")
    .isMongoId()
    .withMessage("Invalid Reservation id format")
    .custom(async (reservationId, { req }) => {
      const patientId = req.user._id;

      // Find the reservation by the given id
      const reservation = await ReservationModel.findById(reservationId);
      if (!reservation) {
        throw new ApiError("Reservation not found", 404);
      }

      // Check if the reservation belongs to the logged-in patient
      if (reservation.patient.toString() !== patientId.toString()) {
        throw new ApiError(
          "You do not have permission to delete this reservation",
          403
        );
      }

      return true;
    }),

  validatorMiddleware,
];
