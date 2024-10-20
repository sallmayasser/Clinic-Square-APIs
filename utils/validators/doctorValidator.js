const slugify = require("slugify");
const { check, body } = require("express-validator");
const validatorMiddleware = require("../../Middlewares/validatorMiddleware");
const DoctorModel = require("../../Models/doctorModel");

exports.getDoctorValidator = [
  check("id").isMongoId().withMessage("Invalid Doctor id format"),
  validatorMiddleware,
];

exports.createDoctorValidator = [
  // Name validation
  check("name")
    .notEmpty()
    .withMessage("Doctor name required")
    .isLength({ min: 3 })
    .withMessage("Too short Doctor name")
    .isLength({ max: 32 })
    .withMessage("Too long Doctor name")
    .custom((val, { req }) => {
      req.body.slug = slugify(val);
      return true;
    }),

  // Email validation
  check("email")
    .isEmail()
    .withMessage("Invalid email address")
    .custom((val) =>
      DoctorModel.findOne({ email: val }).then((doctor) => {
        if (doctor) {
          return Promise.reject(new Error("E-mail already in doctors"));
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
  check("specialization").notEmpty().withMessage("Specialization is required"),
   // Phone validation
  check('phoneNumbers')
  .isArray().withMessage('Phone numbers must be an array'),

// Validate each phone number in the array
check('phoneNumbers.*')
  .isMobilePhone().withMessage('Invalid phone number'),
];

exports.updateDoctorValidator = [
  check("id").isMongoId().withMessage("Invalid Doctor id format"),
  check("email")
    .optional()
    .notEmpty()
    .withMessage("Email required")
    .isEmail()
    .withMessage("Invalid email address")
    .custom((val) =>
      DoctorModel.findOne({ email: val }).then((doctor) => {
        if (doctor) {
          return Promise.reject(new Error("E-mail already in doctors"));
        }
      })
    ),
   // Phone validation
   check('phoneNumbers')
   .isArray().withMessage('Phone numbers must be an array'),
 
 // Validate each phone number in the array
 check('phoneNumbers.*')
   .isMobilePhone().withMessage('Invalid phone number'),
];

exports.deleteDoctorValidator = [
  check("id").isMongoId().withMessage("Invalid Doctor id format"),
  validatorMiddleware,
];
exports.changeDoctorPasswordValidator = [
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
      const doctor = await DoctorModel.findById(req.user._id);
      if (!doctor) {
        throw new Error("There is no doctor for this id");
      }
      const isCorrectPassword = await bcrypt.compare(
        req.body.currentPassword,
        doctor.password
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
exports.updateLoggedDoctorValidator = [
  check("email")
    .optional()
    .isEmail()
    .withMessage("Invalid email address")
    .custom((val) =>
      DoctorModel.findOne({ email: val }).then((doctor) => {
        if (doctor) {
          return Promise.reject(new Error("E-mail already in doctor"));
        }
      })
    ),
   // Phone validation
   check('phoneNumbers')
   .isArray().withMessage('Phone numbers must be an array'),
 
 // Validate each phone number in the array
 check('phoneNumbers.*')
   .isMobilePhone().withMessage('Invalid phone number'),

  validatorMiddleware,
];
