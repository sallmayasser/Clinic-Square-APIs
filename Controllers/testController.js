const AsyncHandler = require("express-async-handler");
const testModel = require("../Models/testModel");
const factory = require("./handlerFactory");
const ApiError = require("../utils/apiError");
const LabTestsModel = require("../Models/labs-testsModel");

// Add a Test
exports.addTest = AsyncHandler(async (req, res, next) => {
  const { name } = req.body;
  const exist = await testModel.findOne({ name });
  if (exist) {
    return next(new ApiError("this test is already exist", 409));
  }
  const newDoc = await testModel.create(req.body);
  res.status(201).json({
    status: "success",
    data: newDoc,
  });
});

exports.deleteTest = AsyncHandler(async (req, res, next) => {
  const { id } = req.params;
  await LabTestsModel.deleteMany({ test: id });

  const document = await testModel.findByIdAndDelete(id);
  if (!document) {
    return next(new ApiError(`No test found with id ${id}`, 404));
  }

  res.status(202).json({
    message: "Test deleted successfully, along with any associated lab .",
  });
});

exports.getTests = factory.getAll(testModel);
exports.getTestById = factory.getOne(testModel);
exports.updateTest = factory.updateOne(testModel);
