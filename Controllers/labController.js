const LabModel = require("../Models/labModel");
const factory = require("./handlerFactory");
const asyncHandler = require("express-async-handler");

exports.getLab = factory.getOne(LabModel, "reviews");
exports.getLabs = factory.getAll(LabModel, "reviews");
exports.deleteLab = factory.deleteOne(LabModel);

exports.setLabToBody = (req, res, next) => {
  if (!req.body.role) req.body.role = "lab";
  next();
};

exports.updateLab = asyncHandler(async (req, res, next) => {
  const updateData = { ...req.body };
  delete updateData.password;
  delete updateData.confirmPassword;

  const document = await LabModel.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
  });

  if (!document) {
    return next(new ApiError(`No document for this id ${req.params.id}`, 404));
  }
  res.status(200).json({ data: document });
});

exports.updateLoggedLabData = asyncHandler(async (req, res, next) => {
  // Remove password and confirmPassword from req.body if present

  const updateData = { ...req.body };
  delete updateData.password;
  delete updateData.confirmPassword;

  const updatedUser = await LabModel.findByIdAndUpdate(
    req.user._id,
    updateData,
    { new: true }
  );

  res.status(200).json({ data: updatedUser });
});
exports.setLabIdToBody = (req, res, next) => {
  // Nested route (Create)
  if (!req.body.lab) req.body.lab = req.params.id;
  next();
};

