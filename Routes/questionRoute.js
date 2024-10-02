const express = require("express");
const { getLoggedUserData } = require("../Controllers/handlerFactory");
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
const {
  setPatientToBody,
  setPatientIdToBody,
} = require("../Controllers/PatientController");

const authController = require("../Controllers/authController");
const { setDoctorIdToBody } = require("../Controllers/doctorController");
const router = express.Router({ mergeParams: true });

router.use(authController.protect);

router
  .route("/")
  .get(authController.allowedTo("doctor", "admin", "patient"), getQuestions)
  .post(
    authController.allowedTo("patient"),
    setPatientIdToBody,
    validator.createQuestionValidator,
    addQuestion
  );

router
  .route("/answer")
  //  @@/questions/answer/questionId = <Question Id>
  .post(
    authController.allowedTo("doctor"),
    setDoctorIdToBody,
    validator.createAnswerValidator,
    addAnswer
  )
  // /questions/answer/?questionId =<Question Id>&answerId = <Answer Id>
  .put(
    authController.allowedTo("doctor"),
    validator.updateAnswerValidator,
    updateAnswer
  );

router
  .route("/:id")
  .get(
    authController.allowedTo("doctor", "patient", "admin"),
    validator.getQuestionValidator,
    getQuestionById
  )
  .delete(
    authController.allowedTo("patient", "admin"),
    validator.deleteQuestionValidator,
    deleteQuestion
  )
  .put(
    authController.allowedTo("patient"),
    validator.updateQuestionValidator,
    updateQuestion
  );

module.exports = router;
