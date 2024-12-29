const slugify = require("slugify");
const { check } = require("express-validator");
const validatorMiddleware = require("../../Middlewares/validatorMiddleware");
const QuestionModel = require("../../Models/medicalQuestionsModel");
const PatientModel = require("../../Models/patientModel");
const DoctorModel = require("../../Models/doctorModel");

exports.getQuestionValidator = [
  check("id").isMongoId().withMessage("Invalid Question id format"),
  validatorMiddleware,
];

exports.createQuestionValidator = [
  // Name validation
  check("patient")
    .notEmpty()
    .withMessage("patient field is Missing")
    .isMongoId()
    .withMessage("Invalid paient id format")
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

exports.createAnswerValidator = [
  check("questionID")
    .notEmpty()
    .withMessage("Question ID is required in query")
    .isMongoId()
    .withMessage("Invalid question id format")
    .custom(async (val) => {
      const questionExists = await QuestionModel.findById(val);
      if (!questionExists) {
        throw new Error("Question not found");
      }
      return true;
    }),

  check("doctor")
    .notEmpty()
    .withMessage("Doctor field is missing")
    .isMongoId()
    .withMessage("Invalid doctor id format")
    .custom(async (val, { req }) => {
      const question = await QuestionModel.findById(req.body.questionID);
      if (!question) {
        throw new Error("Question not found");
      }
      const doctorHasAnswered = question.answers.some((answer) => {
        const isDoctorMatched = answer.doctor.toString() === val;
        return isDoctorMatched;
      });
      if (doctorHasAnswered) {
        throw new Error("Doctor has already answered this question");
      }

      return true;
    }),

  check("answer").notEmpty().withMessage("answer field is Missing"),

  check("question").isEmpty().withMessage("You Can not add/update question "),

  validatorMiddleware,
];
exports.updateAnswerValidator = [
  check("questionID")
    .notEmpty()
    .withMessage("Question ID is required in query")
    .isMongoId()
    .withMessage("Invalid question id format")
    .custom(async (val) => {
      const questionExists = await QuestionModel.findById(val);
      if (!questionExists) {
        throw new Error("Question not found");
      }
      return true;
    }),
  check("answerID")
    .notEmpty()
    .withMessage("Answer ID is required in query")
    .isMongoId()
    .withMessage("Invalid answer ID format")
    .custom(async (val, { req }) => {
      const question = await QuestionModel.findById(req.body.questionID);
      if (!question) {
        throw new Error("Question not found");
      }

      const answerExists = question.answers.id(val);
      if (!answerExists) {
        throw new Error("Answer not found");
      }
      return true;
    }),

  check("answer").notEmpty().withMessage("answer field is Missing"),

  check("question").isEmpty().withMessage("You Can not add/update question "),

  validatorMiddleware,
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

  check("answers").isEmpty().withMessage("You Can not add Answer "),

  validatorMiddleware,
];

exports.deleteQuestionValidator = [
  check("id")
    .isMongoId()
    .withMessage("Invalid Question id format")
    .custom(async (val) => {
      const question = await QuestionModel.findById(val);
      if (!question) {
        throw new Error("Question not found");
      }

      if (question.answers && question.answers.length > 0) {
        throw new Error("Cannot delete question with existing answers");
      }

      return true;
    }),

  validatorMiddleware,
];
