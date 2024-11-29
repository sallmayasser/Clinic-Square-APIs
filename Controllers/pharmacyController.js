const asyncHandler = require("express-async-handler");
const MedicineModel = require("../Models/medicineModel");
const factory = require("./handlerFactory");
const PharmacyModel = require("../Models/pharmacyModel");

exports.getPharmacy = factory.getOne(PharmacyModel, "reviews");
exports.getPharmacys = factory.getAll(PharmacyModel, "reviews");
exports.deletePharmacy = factory.deleteOne(PharmacyModel);

exports.updatePharmacy = asyncHandler(async (req, res, next) => {
  const updateData = { ...req.body };
  delete updateData.password;
  delete updateData.confirmPassword;

  const document = await PharmacyModel.findByIdAndUpdate(
    req.params.id,
    updateData,
    {
      new: true,
    }
  );

  if (!document) {
    return next(new ApiError(`No document for this id ${req.params.id}`, 404));
  }
  res.status(200).json({ data: document });
});

exports.updateLoggedPharmacyData = asyncHandler(async (req, res, next) => {
  // Remove password and confirmPassword from req.body if present

  const updateData = { ...req.body };
  delete updateData.password;
  delete updateData.confirmPassword;

  const updatedUser = await PharmacyModel.findByIdAndUpdate(
    req.user._id,
    updateData,
    { new: true }
  );

  res.status(200).json({ data: updatedUser });
});

exports.setPharmacyIdToBody = (req, res, next) => {
  // Nested route (Create)
  if (!req.body.Pharmacy) req.body.pharmacy = req.params.id;
  next();
};
exports.setPharmacyToBody = (req, res, next) => {
  if (!req.body.role) req.body.role = "pharmacy";
  next();
};
