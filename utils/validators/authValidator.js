const { check } = require('express-validator');
const validatorMiddleware = require('../../Middlewares/validatorMiddleware');

exports.loginValidator = [
  check("email")
    .notEmpty()
    .withMessage("Email required")
    .isEmail()
    .withMessage("Invalid email address"),

  check("password")
    .notEmpty()
    .withMessage("Password required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  
  check("role")
    .notEmpty()
    .withMessage("role required"),

  validatorMiddleware,
];
