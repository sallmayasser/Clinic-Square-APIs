const slugify = require("slugify");
const { check, body } = require("express-validator");
const validatorMiddleware = require("../../Middlewares/validatorMiddleware");
const QuestionModel = require("../../Models/medicalQuesstions");
const PatientModel = require("../../Models/patientModel");

exports.getQuestionValidator = [
  check("id").isMongoId().withMessage("Invalid Question id format"),
  validatorMiddleware,
];

exports.createQuestionValidator = [
  // Name validation
  check("patient")
    .notEmpty()
    .withMessage("patient field is Missing")
    .isMongoId().withMessage("Invalid Question id format")
    .custom(async (val) => {
      const patientExists = await PatientModel.findById(val);
      if (!patientExists) {
        throw new Error("Patient not found");
      }
      return true;
    }),


    check("question")
    .notEmpty()
    .withMessage("question field is Missing")
    .isLength({ min: 3 })
    .withMessage("Question Should have at least 6 characters")
    .isLength({ max: 250 })
    .withMessage("Question Should not exceed 250 characters"),

 
  validatorMiddleware, // This should handle sending validation results to the client
];

exports.updateQuestionValidator = [
  check("id").isMongoId().withMessage("Invalid Question id format"),
  check("question")
  .notEmpty()
  .withMessage("question field is Missing")
  .isLength({ min: 3 })
  .withMessage("Question Should have at least 6 characters")
  .isLength({ max: 250 })
  .withMessage("Question Should not exceed 250 characters"),
  validatorMiddleware,
];

exports.deleteQuestionValidator = [
  check("id").isMongoId().withMessage("Invalid Question id format"),
  validatorMiddleware,
];
