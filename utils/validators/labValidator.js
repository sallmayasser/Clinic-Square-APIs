const slugify = require("slugify");
const { check, body } = require("express-validator");
const validatorMiddleware = require("../../Middlewares/validatorMiddleware");
const LabModel = require("../../Models/labModel");
const bcrypt = require("bcryptjs");

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
    .matches(/^[A-Za-z0-9\s]+$/)
    .withMessage("lab name can only contain letters, spaces and numbers")
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
  check("phoneNumbers").isArray().withMessage("Phone numbers must be an array"),

  // Validate each phone number in the array
  check("phoneNumbers.*").isMobilePhone().withMessage("Invalid phone number"),

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
        if (new Date(day.startTime) > new Date(day.endTime)) {
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
    .matches(/^[A-Za-z0-9\s]+$/)
    .withMessage("lab name can only contain letters, spaces and numbers")
    .custom((val, { req }) =>
      LabModel.findOne({ name: val }).then((Lab) => {
        if (Lab) {
          return Promise.reject(new Error("Name already in Labs"));
        }
        req.body.slug = slugify(val);
        return true;
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

exports.updateScheduleValidator = [
  check("day")
    .notEmpty()
    .withMessage("Day is required")
    .isIn([
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ])
    .withMessage("Invalid day"),

  // Custom validator to check if the day already exists in the schedule
  check("day").custom(async (value, { req }) => {
    const labId = req.params.id;

    const lab = await LabModel.findById(labId);
    if (!lab) {
      throw new Error("lab not found");
    }

    // Check if the day already exists in the schedule
    const dayExists = lab.schedule.days.some((dayObj) => dayObj.day === value);
    if (!dayExists) {
      throw new Error("Day does not exist in the schedule");
    }

    // return true;
  }),
  validatorMiddleware,
];

exports.addScheduleValidator = [
  check("day")
    .isIn([
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ])
    .withMessage("Please provide a valid day of the week"),

  check("startTime")
    .notEmpty()
    .withMessage("Start time is required")
    .isISO8601()
    .withMessage("Start time must be a valid ISO 8601 date"),

  check("endTime")
    .notEmpty()
    .withMessage("End time is required")
    .isISO8601()
    .withMessage("End time must be a valid ISO 8601 date"),

  // Custom validation for time logic
  body("startTime").custom((value, { req }) => {
    const start = new Date(value);
    const end = new Date(req.body.endTime);

    if (start >= end) {
      throw new Error("Start time must be before end time");
    }
    return true;
  }),

  // Custom validation to check that the day does not already exist
  body("day").custom(async (value, { req }) => {
    const lab = await LabModel.findById(req.user.id);

    if (!lab) {
      throw new Error("lab not found");
    }

    const existingDay = lab.schedule.days.find(
      (scheduleDay) => scheduleDay.day === value.toLowerCase()
    );

    if (existingDay) {
      throw new Error(
        `Schedule for ${value} already exists you can update it `
      );
    }
    return true;
  }),

  check("limit")
    .isInt({ min: 1 })
    .withMessage("Limit must be an integer greater than 0"),

  validatorMiddleware,
];
