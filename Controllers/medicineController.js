const MedicineModel = require("../Models/medicineModel");
const factory = require("./handlerFactory");

// Add a Medicine
exports.addMedicine = factory.createOne(MedicineModel);
exports.deleteMedicine = factory.deleteOne(MedicineModel);
exports.getMedicines = factory.getAll(MedicineModel);
exports.getMedicineById = factory.getOne(MedicineModel);
exports.updateMedicine = factory.updateOne(MedicineModel);
