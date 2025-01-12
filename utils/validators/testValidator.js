const slugify = require("slugify");
const { check, body } = require("express-validator");
const validatorMiddleware = require("../../Middlewares/validatorMiddleware");
const LabTestsModel = require("../../Models/labs-testsModel");
const ApiError = require("../apiError");

exports.getTestValidator = [
  check("id").isMongoId().withMessage("Invalid Test id format"),
  validatorMiddleware,
];

exports.createTestValidator = [
  // Name validation
  check("name")
    .notEmpty()
    .withMessage("Test name required")
    .isLength({ min: 3 })
    .withMessage("Too short Test name")
    .isLength({ max: 32 })
    .withMessage("Too long Test name")
    .matches(/^[A-Za-z0-9\s\(\)]+$/)
    .withMessage(
      "test name can only contain letters, spaces, brackets and numbers"
    )
    .custom((val, { req }) => {
      req.body.slug = slugify(val);
      return true;
    }),
  validatorMiddleware,
];

exports.deleteTestValidator = [
  check("id").isMongoId().withMessage("Invalid Test id format"),
  validatorMiddleware,
];
exports.updateTestValidator = [
  check("id").isMongoId().withMessage("Invalid Test id format"),
  check("name")
    .optional()
    .notEmpty()
    .withMessage("Test name required")
    .isLength({ min: 3 })
    .withMessage("Too short Test name")
    .isLength({ max: 32 })
    .withMessage("Too long Test name")
    .matches(/^[A-Za-z0-9\s\(\)]+$/)
    .withMessage(
      "test name can only contain letters, spaces , brackets and numbers"
    )
    .custom((val, { req }) => {
      req.body.slug = slugify(val);
      return true;
    }),
  validatorMiddleware,
];

exports.createLabTestValidator = [
  // Validate test
  check("test")
    .notEmpty()
    .withMessage("test ID is required")
    .custom(async (testId, { req }) => {
      return LabTestsModel.findOne({
        test: testId,
        lab: req.user._id,
      }).then((existingTest) => {
        if (existingTest) {
          throw new ApiError("This test already exists in the Lab", 400);
        }
      });
    }),

  // Validate Lab
  // check("Lab").notEmpty().withMessage("Lab ID is required"),

  // Validate cost
  check("cost")
    .notEmpty()
    .withMessage("cost is required")
    .isInt({ gt: 0 }) // Check if the cost is a positive integer
    .withMessage("cost must be a positive number"),

  validatorMiddleware,
];
