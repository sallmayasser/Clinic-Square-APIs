const asyncHandler = require("express-async-handler");
const DoctorModel = require("../Models/doctorModel");
const factory = require("../Controllers/handlerFactory");

exports.getDoctor = factory.getOne(DoctorModel);
exports.getDoctors = factory.getAll(DoctorModel);
exports.deleteDoctor = factory.deleteOne(DoctorModel);

exports.updateDoctor = asyncHandler(async (req, res, next) => {
  const updateData = { ...req.body };
  delete updateData.password;
  delete updateData.confirmPassword;

  const document = await DoctorModel.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true }
  );

  if (!document) {
    return next(new ApiError(`No document for this id ${req.params.id}`, 404));
  }
  res.status(200).json({ data: document });
});

exports.updateLoggedDoctorData = asyncHandler(async (req, res, next) => {
  // Remove password and confirmPassword from req.body if present

  const updateData = { ...req.body };
  delete updateData.password;
    delete updateData.confirmPassword;
    delete updateData.role;

  const updatedUser = await DoctorModel.findByIdAndUpdate(
    req.user._id,
    updateData,
    { new: true }
  );

  res.status(200).json({ data: updatedUser });
});

exports.setDoctorToBody = (req, res, next) => {
  if (!req.body.role) req.body.role = "doctor";
  next();
};
exports.setDoctorIdToBody = (req, res, next) => {
  // Nested route (Create)
  if (!req.body.doctor) req.body.doctor = req.params.id;
  next();
};