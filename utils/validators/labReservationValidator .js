const slugify = require("slugify");
const { check, body } = require("express-validator");
const validatorMiddleware = require("../../Middlewares/validatorMiddleware");
const ReservationModel = require("../../Models/labReservationModel");
const PatientModel = require("../../Models/patientModel");
const LabModel = require("../../Models/labModel");
const ApiError = require("../apiError");

exports.getReservationValidator = [
  check("id").isMongoId().withMessage("Invalid Reservation id format"),
  validatorMiddleware,
];

exports.createLabReservationValidator = [
  check("patient")
    .notEmpty()
    .withMessage("Patient ID is required")
    .isMongoId()
    .withMessage("Invalid Reservation id format"),

  check("lab")
    .notEmpty()
    .withMessage("Lab ID is required")
    .isMongoId()
    .withMessage("Invalid Reservation id format"),

  check("requestedTests")
    .isArray({ min: 1 })
    .withMessage("Requested tests must be an array with at least one item")
    .custom((tests) => {
      tests.forEach((test) => {
        // Check that each test has a testName and testResult is empty
        if (!test.testName) {
          throw new Error("Each test must have a testName");
        }
        if (test.testResult && test.testResult.length > 0) {
          throw new Error(
            "testResult must be empty for each requested test during creation"
          );
        }
      });
      return true;
    }),

  validatorMiddleware,
];

exports.updateReservationValidator = [
  check("reservationId")
    .notEmpty()
    .withMessage("Reservation ID is required")
    .isMongoId()
    .withMessage("Invalid Reservation id format"),

  check("requestedTests")
    .optional()
    .isArray()
    .withMessage("Requested tests must be an array if provided")
    .custom((tests) => {
      tests.forEach((test) => {
        if (test.testResult && !Array.isArray(test.testResult)) {
          throw new Error("testResult must be an array");
        }
      });
      return true;
    }),

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
