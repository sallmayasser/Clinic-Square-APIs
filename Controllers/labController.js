const LabModel = require("../Models/labModel");
const factory = require("./handlerFactory");

exports.getLab = factory.getOne(LabModel);
exports.getLabs = factory.getAll(LabModel);
exports.createLab = factory.createOne(LabModel);
exports.deleteLab = factory.deleteOne(LabModel);
exports.updateLab = factory.updateOne(LabModel);
