const slugify = require("slugify");
const { check, body } = require("express-validator");
const validatorMiddleware = require("../../Middlewares/validatorMiddleware");

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
  validatorMiddleware,
];
