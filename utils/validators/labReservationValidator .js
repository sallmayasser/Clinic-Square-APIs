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

  check("state")
    .optional()
    .isIn(["completed", "new"])
    .withMessage(
      "Invalid state. Must be either 'completed'or 'new'"
    ),
 
check("date")
    .notEmpty()
    .withMessage("you must enter lab reservation date"),
 
  validatorMiddleware,
];

exports.updateReservationValidator = [
  check("id")
    .notEmpty()
    .withMessage("Reservation ID is required")
    .isMongoId()
    .withMessage("Invalid Reservation id format"),
  
 check('state')
    .optional() 
    .isIn(['completed', 'new']) 
    .withMessage("Invalid state. Must be either 'completed' or 'new'."),
 
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
