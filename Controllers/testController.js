const testModel = require("../Models/testModel");
const factory = require("./handlerFactory");

// Add a Test
exports.addTest = factory.createOne(testModel);
exports.deleteTest = factory.deleteOne(testModel);
exports.getTests = factory.getAll(testModel);
exports.getTestById = factory.getOne(testModel);
exports.updateTest = factory.updateOne(testModel);
