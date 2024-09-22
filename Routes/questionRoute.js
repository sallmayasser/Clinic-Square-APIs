const express = require("express");

const {
  addQuestion,
  getQuestions,
  addAnswer,
  getQuestionById,
  deleteQuestion,
} = require("../Controllers/medicalQuestionsController");
const validator = require("../utils/validators/questionValidator");

const router = express.Router({ mergeParams: true });

router
  .route("/")
  .get(getQuestions)
  .post(validator.createQuestionValidator, addQuestion);

router.route("/answer/:id").post(validator.createAnswerValidator, addAnswer);
router
  .route("/:id")
  .get(validator.getQuestionValidator, getQuestionById)
  .delete(validator.deleteQuestionValidator, deleteQuestion);
 // .patch(validator.updateQuestionValidator, updateDoctor)
module.exports = router;
