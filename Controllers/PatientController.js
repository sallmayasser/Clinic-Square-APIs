const asyncHandler = require("express-async-handler");
const PatientModel = require("../Models/patientModel");
const factory = require("./handlerFactory");

exports.getPatient = factory.getOne(PatientModel);
exports.getPatients = factory.getAll(PatientModel);
exports.deletePatient = factory.deleteOne(PatientModel);

exports.updatePatient = asyncHandler(async (req, res, next) => {
  const updateData = { ...req.body };
  delete updateData.password;
  delete updateData.confirmPassword;

  const document = await PatientModel.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true }
  );

  if (!document) {
    return next(new ApiError(`No document for this id ${req.params.id}`, 404));
  }
  res.status(200).json({ data: document });
});

exports.updateLoggedPatientData = asyncHandler(async (req, res, next) => {
  // Remove password and confirmPassword from req.body if present

  const updateData = { ...req.body };
  delete updateData.password;
  delete updateData.confirmPassword;

  const updatedUser = await PatientModel.findByIdAndUpdate(
    req.user._id,
    updateData,
    { new: true }
  );

  res.status(200).json({ data: updatedUser });
});

exports.setPatientToBody = (req, res, next) => {
  if (!req.body.role) req.body.role = "patient";
  next();
};
exports.setPatientIdToBody = (req, res, next) => {
  // Nested route (Create)
  if (!req.body.patient) req.body.patient = req.params.id;
  next();
};