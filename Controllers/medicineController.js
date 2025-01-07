const AsyncHandler = require("express-async-handler");
const MedicineModel = require("../Models/medicineModel");
const PharmacyMedicineModel = require("../Models/pharmacies-medicinesModel");
const ApiError = require("../utils/apiError");
const factory = require("./handlerFactory");

// Add a Medicine
exports.addMedicine = AsyncHandler(async (req, res, next) => {
  const { name } = req.body;
  const exist = await MedicineModel.findOne({ name });
  if (exist) {
    return next(new ApiError("this medicine is already exist", 409));
  }
  const newDoc = await MedicineModel.create(req.body);
  res.status(201).json({
    status: "success",
    data: newDoc,
  });
});
exports.deleteMedicine = AsyncHandler(async (req, res, next) => {
  const { id } = req.params;

  await PharmacyMedicineModel.deleteMany({ medicine: id });

  const document = await MedicineModel.findByIdAndDelete(id);
  if (!document) {
    return next(new ApiError(`No medicine found with id ${id}`, 404));
  }

  res.status(202).json({
    message:
      "Medicine deleted successfully, along with any associated pharmacy.",
  });
});
exports.getMedicines = factory.getAll(MedicineModel);
exports.getMedicineById = factory.getOne(MedicineModel);
exports.updateMedicine = factory.updateOne(MedicineModel);
