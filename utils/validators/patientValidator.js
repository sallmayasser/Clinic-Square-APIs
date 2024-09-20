const slugify = require("slugify");
const { check, body } = require("express-validator");
const validatorMiddleware = require("../../Middlewares/validatorMiddleware");
const PatientModel = require("../../Models/patientModel");

exports.getPatientValidator = [
  check("id").isMongoId().withMessage("Invalid Patient id format"),
  validatorMiddleware,
];

exports.createPatientValidator = [
  // Name validation
  check("name")
    .notEmpty()
    .withMessage("Patient name required")
    .isLength({ min: 3 })
    .withMessage("Too short Patient name")
    .isLength({ max: 32 })
    .withMessage("Too long Patient name")
    .custom((val, { req }) => {
      req.body.slug = slugify(val);
      return true;
    }),

  // Email validation
  check("email")
    .notEmpty()
    .withMessage("Email required")
    .isEmail()
    .withMessage("Invalid email address")
    .custom((val) =>
      PatientModel.findOne({ email: val }).then((Patient) => {
        if (Patient) {
          return Promise.reject(new Error("E-mail already in Patients"));
        }
      })
    ),

  // Password validation
  check("password")
    .notEmpty()
    .withMessage("Password required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters")
    .custom((password, { req }) => {
      if (password !== req.body.passwordConfirm) {
        throw new Error("Password Confirmation incorrect");
      }
      return true;
    }),

  // Password confirmation validation
  check("passwordConfirm")
    .notEmpty()
    .withMessage("Password confirmation required"),

  // Phone validation
  check("phone")
    .optional()
    .isMobilePhone(["ar-EG", "ar-SA"])
    .withMessage(
      "Invalid phone number, only accepted Egyptian and Saudi Arabian phone numbers"
    ),

  // Gender validation
  check("gender")
    .notEmpty()
    .withMessage("Gender required")
    .custom((gender, { req }) => {
      const lowercaseVal = gender.toLowerCase();
      if (lowercaseVal !== "male" && lowercaseVal !== "female") {
        throw new Error("Please enter male or female");
      }
      return true;
    }),
  validatorMiddleware, // This should handle sending validation results to the client
];

exports.updatePatientValidator = [
  check("id").isMongoId().withMessage("Invalid Patient id format"),
  check("email")
    .optional()
    .isEmail()
    .withMessage("Invalid email address")
    .custom((val) =>
      PatientModel.findOne({ email: val }).then((Patient) => {
        if (Patient) {
          return Promise.reject(new Error("E-mail already in Patients"));
        }
      })
    ),
  check("phone")
    .optional()
    .isMobilePhone(["ar-EG", "ar-SA"])
    .withMessage(
      "Invalid phone number, only accepted Egyptian and Saudi Arabian phone numbers"
    ),
  validatorMiddleware,
];

exports.deletePatientValidator = [
  check("id").isMongoId().withMessage("Invalid Patient id format"),
  validatorMiddleware,
];
