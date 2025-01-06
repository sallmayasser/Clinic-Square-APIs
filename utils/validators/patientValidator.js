const slugify = require("slugify");
const { check, body } = require("express-validator");
const validatorMiddleware = require("../../Middlewares/validatorMiddleware");
const PatientModel = require("../../Models/patientModel");
const bcrypt = require("bcryptjs");

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
    .matches(/^[A-Za-z0-9\s]+$/)
    .withMessage("Patient name can only contain letters, spaces and numbers")
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
  check("phoneNumbers").isArray().withMessage("Phone numbers must be an array"),

  // Validate each phone number in the array
  check("phoneNumbers.*").isMobilePhone().withMessage("Invalid phone number"),

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
  // Phone validation
  check("phoneNumbers")
    .optional()
    .isArray()
    .withMessage("Phone numbers must be an array"),

    check("name")
    .optional()
    .notEmpty()
    .withMessage("Patient name required")
    .isLength({ min: 3 })
    .withMessage("Too short Patient name")
    .isLength({ max: 32 })
    .withMessage("Too long Patient name")
    .matches(/^[A-Za-z0-9\s]+$/)
    .withMessage("Patient name can only contain letters, spaces and numbers")
    .custom((val, { req }) => {
      req.body.slug = slugify(val);
      return true;
    }),

  // Validate each phone number in the array
  check("phoneNumbers.*")
    .optional()
    .isMobilePhone()
    .withMessage("Invalid phone number"),
  validatorMiddleware,
];

exports.deletePatientValidator = [
  check("id").isMongoId().withMessage("Invalid Patient id format"),
  validatorMiddleware,
];

exports.changePatientPasswordValidator = [
  body("currentPassword")
    .notEmpty()
    .withMessage("You must enter your current password"),
  body("passwordConfirm")
    .notEmpty()
    .withMessage("You must enter the password confirm"),
  body("newPassword")
    .notEmpty()
    .withMessage("You must enter new password")
    .custom(async (val, { req }) => {
      // 1) Verify current password
      const patient = await PatientModel.findById(req.user._id);
      if (!patient) {
        throw new Error("There is no patient for this id");
      }
      const isCorrectPassword = await bcrypt.compare(
        req.body.currentPassword,
        patient.password
      );
      if (!isCorrectPassword) {
        throw new Error("Incorrect current password");
      }

      // 2) Verify password confirm
      if (val !== req.body.passwordConfirm) {
        throw new Error("Password Confirmation incorrect");
      }
      if (val === req.body.currentPassword) {
        throw new Error("Please enter new password !");
      }
      return true;
    }),
  validatorMiddleware,
];
exports.updateLoggedPatientValidator = [
  check("email")
    .optional()
    .isEmail()
    .withMessage("Invalid email address")
    .custom((val) =>
      PatientModel.findOne({ email: val }).then((patient) => {
        if (patient) {
          return Promise.reject(new Error("E-mail already in patient"));
        }
      })
    ),
  // Phone validation
  check("phoneNumbers")
    .optional()
    .isArray()
    .withMessage("Phone numbers must be an array"),

  // Validate each phone number in the array
  check("phoneNumbers.*")
    .optional()
    .isMobilePhone()
    .withMessage("Invalid phone number"),
  validatorMiddleware,
];
