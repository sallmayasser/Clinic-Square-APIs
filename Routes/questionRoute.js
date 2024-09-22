const express = require("express");

const {
addQuestion,
getQuestions,
addAnswer,
getQuestionById
} = require("../Controllers/medicalQuesstionsController");
const validator = require("../utils/validators/questionValidator");

const router = express.Router({ mergeParams: true });

router
  .route("/")
  .get(getQuestions)
  .post(validator.createQuestionValidator, addQuestion);

router
  .route("/:id")
  .get(validator.getQuestionValidator, getQuestionById);
  // .patch(validator.updateQuestionValidator, updateDoctor)
  // .delete(validator.deleteQuestionValidator, deleteDoctor);

module.exports = router;
