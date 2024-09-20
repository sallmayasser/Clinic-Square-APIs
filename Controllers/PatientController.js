const PatientModel = require("../Models/patientModel");
const factory = require("./handlerFactory");

exports.getPatient = factory.getOne(PatientModel);
exports.getPatients = factory.getAll(PatientModel);
exports.createPatient = factory.createOne(PatientModel);
exports.deletePatient = factory.deleteOne(PatientModel);
exports.updatePatient = factory.updateOne(PatientModel);
