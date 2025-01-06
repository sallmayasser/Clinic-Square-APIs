const slugify = require("slugify");
const { check, body } = require("express-validator");
const validatorMiddleware = require("../../Middlewares/validatorMiddleware");
const PharmacyModel = require("../../Models/pharmacyModel");
const bcrypt = require("bcryptjs");

exports.getPharmacyValidator = [
  check("id").isMongoId().withMessage("Invalid Pharmacy id format"),
  validatorMiddleware,
];

exports.createPharmacyValidator = [
  // Name validation
  check("name")
    .notEmpty()
    .withMessage("Pharmacy name required")
    .isLength({ min: 3 })
    .withMessage("Too short Pharmacy name")
    .isLength({ max: 32 })
    .withMessage("Too long Pharmacy name")
    .matches(/^[A-Za-z0-9\s]+$/)
    .withMessage("pharmacy name can only contain letters, spaces and numbers")
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
      PharmacyModel.findOne({ email: val }).then((Pharmacy) => {
        if (Pharmacy) {
          return Promise.reject(new Error("E-mail already in Pharmacys"));
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
  check("license")
    .isArray({ min: 1 })
    .withMessage("At least one license is required")
    .custom((licenseArray) => {
      if (licenseArray.some((license) => license.trim().length === 0)) {
        throw new Error("License cannot be an empty string");
      }
      return true;
    }),
];

exports.updatePharmacyValidator = [
  check("id").isMongoId().withMessage("Invalid Pharmacy id format"),
  check("email")
    .optional()
    .isEmail()
    .withMessage("Invalid email address")
    .custom((val) =>
      PharmacyModel.findOne({ email: val }).then((Pharmacy) => {
        if (Pharmacy) {
          return Promise.reject(new Error("E-mail already in Pharmacys"));
        }
      })
    ),

    check("name")
    .optional()
    .notEmpty()
    .withMessage("Pharmacy name required")
    .isLength({ min: 3 })
    .withMessage("Too short Pharmacy name")
    .isLength({ max: 32 })
    .withMessage("Too long Pharmacy name")
    .matches(/^[A-Za-z0-9\s]+$/)
    .withMessage("pharmacy name can only contain letters, spaces and numbers")
    .custom((val, { req }) => {
      req.body.slug = slugify(val);
      return true;
    }),


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

exports.deletePharmacyValidator = [
  check("id").isMongoId().withMessage("Invalid Pharmacy id format"),
  validatorMiddleware,
];

exports.changePharmacyPasswordValidator = [
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
      const pharmacy = await PharmacyModel.findById(req.user._id);
      if (!pharmacy) {
        throw new Error("There is no pharmacy for this id");
      }
      const isCorrectPassword = await bcrypt.compare(
        req.body.currentPassword,
        pharmacy.password
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
exports.updateLoggedpharmacyValidator = [
  check("email")
    .optional()
    .isEmail()
    .withMessage("Invalid email address")
    .custom((val) =>
      PharmacyModel.findOne({ email: val }).then((pharmacy) => {
        if (pharmacy) {
          return Promise.reject(new Error("E-mail already in pharmacy"));
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
