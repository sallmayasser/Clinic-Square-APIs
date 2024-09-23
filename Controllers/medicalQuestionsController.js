const asyncHandler = require("express-async-handler");
const QuestionModel = require("../Models/medicalQuestionsModel");
const DoctorModel = require("../Models/doctorModel");
const Patient = require("../Models/patientModel"); // Import the Patient model
const factory = require("./handlerFactory");

// Add a question
exports.addQuestion = factory.createOne(QuestionModel);
exports.deleteQuestion = factory.deleteOne(QuestionModel);
exports.getQuestions = factory.getAll(QuestionModel);
exports.getQuestionById = factory.getOne(QuestionModel);
exports.updateQuestion = factory.updateOne(QuestionModel);

exports.updateAnswer = asyncHandler(async (req, res, next) => {
  const { questionID, answerID ,answer } = req.body;

  const question = await QuestionModel.findById(questionID);
  const answerToUpdate = question.answers.id(answerID);
  answerToUpdate.answer = answer;

  await question.save();

  res.status(200).json({ data: question });
});

// Add an answer to a specific question
exports.addAnswer = async (req, res) => {
  const { doctor, answer ,questionID} = req.body;

  try {
    // Find the question by its ID
    const question = await QuestionModel.findById(questionID);
    let Doctor = await DoctorModel.findById(doctor);

    Doctor.points += 10;

    await Doctor.save();

    const newAnswer = { doctor, answer };
    question.answers.push(newAnswer);
    await question.save();

    res.status(201).json({ data: question });
  } catch (error) {
    res.status(500).json({ message: "Error adding answer", error });
  }
};
