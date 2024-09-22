const express = require("express");

const {
  addQuestion,
  getQuestions,
  addAnswer,
  getQuestionById,
  deleteQuestion,
  updateAnswer,
  updateQuestion,
} = require("../Controllers/medicalQuestionsController");
const validator = require("../utils/validators/questionValidator");

const router = express.Router({ mergeParams: true });

router
  .route("/")
  .get(getQuestions)
  .post(validator.createQuestionValidator, addQuestion);

router.route("/answer/:id").post(validator.createAnswerValidator, addAnswer);

router
  .route("/:questionId/answer/:answerId")
  .put(validator.updateAnswerValidator, updateAnswer);

router
  .route("/:id")
  .get(validator.getQuestionValidator, getQuestionById)
  .delete(validator.deleteQuestionValidator, deleteQuestion)
  .put(validator.updateQuestionValidator, updateQuestion);

module.exports = router;
