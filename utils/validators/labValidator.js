const slugify = require("slugify");
const { check, body } = require("express-validator");
const validatorMiddleware = require("../../Middlewares/validatorMiddleware");
const LabModel = require("../../Models/labModel");

exports.getLabValidator = [
  check("id").isMongoId().withMessage("Invalid Lab id format"),
  validatorMiddleware,
];

exports.createLabValidator = [
  // Name validation
  check("name")
    .notEmpty()
    .withMessage("Lab name required")
    .isLength({ min: 3 })
    .withMessage("Too short Lab name")
    .isLength({ max: 32 })
    .withMessage("Too long Lab name")
    .custom((val, { req }) =>
      LabModel.findOne({ name: val }).then((Lab) => {
        if (Lab) {
          return Promise.reject(new Error("Name already in Labs"));
        }
        req.body.slug = slugify(val);
        return true;
      })
    ),

  // Email validation
  check("email")
    .isEmail()
    .withMessage("Invalid email address")
    .custom((val) =>
      LabModel.findOne({ email: val }).then((Lab) => {
        if (Lab) {
          return Promise.reject(new Error("E-mail already in Labs"));
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

  // License validation
  check("license")
    .isArray({ min: 1 })
    .withMessage("At least one license is required")
    .custom((licenseArray) => {
      if (licenseArray.some((license) => license.trim().length === 0)) {
        throw new Error("License cannot be an empty string");
      }
      return true;
    }),

  // Cost validation in schedule
  check("schedule.cost")
    .notEmpty()
    .withMessage("Consultation cost is required")
    .isNumeric()
    .withMessage("Consultation cost must be a number")
    .isFloat({ min: 0 })
    .withMessage("Consultation cost cannot be negative"),

  // Schedule validation
  check("schedule.days")
    .isArray({ min: 1 })
    .withMessage("At least one schedule day is required")
    .custom((scheduleArray) => {
      scheduleArray.forEach((day) => {
        if (
          ![
            "sunday",
            "monday",
            "tuesday",
            "wednesday",
            "thursday",
            "friday",
            "saturday",
          ].includes(day.day)
        ) {
          throw new Error("Invalid day of the week");
        }
        if (!day.startTime || !day.endTime) {
          throw new Error("Start time and end time are required");
        }
        if (new Date(day.startTime) >= new Date(day.endTime)) {
          throw new Error("Start time must be before end time");
        }
        if (day.limit < 1) {
          throw new Error("Limit must be at least 1");
        }
      });
      return true;
    }),
  check("license").notEmpty(),

];

exports.updateLabValidator = [
  check("id").isMongoId().withMessage("Invalid Lab id format"),
  check("email")
    .optional()
    .notEmpty()
    .withMessage("Email required")
    .isEmail()
    .withMessage("Invalid email address")
    .custom((val) =>
      LabModel.findOne({ email: val }).then((Lab) => {
        if (Lab) {
          return Promise.reject(new Error("E-mail already in Labs"));
        }
      })
    ),
  check("name")
    .optional()
    .notEmpty()
    .withMessage("Lab name required")
    .isLength({ min: 3 })
    .withMessage("Too short Lab name")
    .isLength({ max: 32 })
    .withMessage("Too long Lab name")
    .custom((val, { req }) =>
      LabModel.findOne({ name: val }).then((Lab) => {
        if (Lab) {
          return Promise.reject(new Error("Name already in Labs"));
        }
        req.body.slug = slugify(val);
        return true;
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

exports.deleteLabValidator = [
  check("id").isMongoId().withMessage("Invalid Lab id format"),
  validatorMiddleware,
];

exports.changeLabPasswordValidator = [
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
      const lab = await LabModel.findById(req.user._id);
      if (!lab) {
        throw new Error("There is no lab for this id");
      }
      const isCorrectPassword = await bcrypt.compare(
        req.body.currentPassword,
        lab.password
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
exports.updateLoggedLabValidator = [
  check("email")
    .optional()
    .isEmail()
    .withMessage("Invalid email address")
    .custom((val) =>
      LabModel.findOne({ email: val }).then((lab) => {
        if (lab) {
          return Promise.reject(new Error("E-mail already in lab"));
        }
      })
    ),
  check("phone")
    .optional()
    .isMobilePhone(["ar-EG", "ar-SA"])
    .withMessage("Invalid phone number only accepted Egy and SA Phone numbers"),

  validatorMiddleware,
];
