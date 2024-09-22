const QuestionModel = require("../Models/medicalQuestionsModel");
const DoctorModel = require("../Models/doctorModel");
const Patient = require("../Models/patientModel"); // Import the Patient model
const factory = require("./handlerFactory");

// Add a question
exports.addQuestion = factory.createOne(QuestionModel);
exports.deleteQuestion = factory.deleteOne(QuestionModel);
// exports.addQuestion = async (req, res) => {
//   const { question, patient } = req.body;
//   console.log(patient)
//   try {
//     // Verify if the patient exists
//     const existedPatient = await Patient.findById(patient);
//     if (!existedPatient) {
//       return res.status(404).json({ message: 'Patient not found' });
//     }

//     const newQuestion = new QuestionModel({ question, patient });
//     await newQuestion.save();
//     res.status(201).json({ message: 'Question added successfully', question: newQuestion });
//   } catch (error) {
//     res.status(500).json({ message: 'Error adding question', error });
//   }
// };

exports.getQuestions = factory.getAll(QuestionModel);

// Get all questions with answers
// exports.getQuestions = async (req, res) => {

//   try {
//     // Populate the createdBy field with patient details
//     const questions = await QuestionModel.find().populate('patient', 'name email');  // Assuming patient has name and email fields
//     res.status(200).json(questions);
//   } catch (error) {
//     res.status(500).json({ message: 'Error retrieving questions', error });
//   }

// };
// Get a question by ID
exports.getQuestionById = factory.getOne(QuestionModel);

// exports.getQuestionById = async (req, res) => {
//     const { id } = req.params;

//     try {
//       const question = await QuestionModel.findById(id).populate('createdBy', 'name email'); // Populate patient details
//       if (!question) {
//         return res.status(404).json({ message: 'QuestionModel not found' });
//       }
//       res.status(200).json(question);
//     } catch (error) {
//       res.status(500).json({ message: 'Error retrieving question', error });
//     }
//   };

// Add an answer to a specific question
exports.addAnswer = async (req, res) => {
  const { id } = req.params;
  const { doctor, answer } = req.body;

  try {
    // Find the question by its ID
    const question = await QuestionModel.findById(id);
    let Doctor = await DoctorModel.findById(doctor);

    Doctor.points += 10;

    await Doctor.save();

    // Create a new answer object
    const newAnswer = { doctor, answer };

    // Add the new answer to the question's answers array
    question.answers.push(newAnswer);

    // Save the updated question
    await question.save();

    res.status(201).json({ data: question });
  } catch (error) {
    res.status(500).json({ message: "Error adding answer", error });
  }
};
