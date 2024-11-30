const TestModel = require("../Models/labs-testsModel");
const factory = require("./handlerFactory");

exports.getTest = factory.getOne(TestModel);
exports.getTests = factory.getAll(TestModel);
exports.addTest = factory.createOne(TestModel);
exports.deleteTest = factory.deleteOne(TestModel);
exports.updateTest = factory.updateOne(TestModel);
