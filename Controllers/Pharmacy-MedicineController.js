const medicineModel = require("../Models/pharmacies-medicinesModel");
const factory = require("./handlerFactory");

exports.getMedicine = factory.getOne(medicineModel);
exports.getMedicines = factory.getAll(medicineModel);
exports.addMedicine = factory.createOne(medicineModel);
exports.deleteMedicine = factory.deleteOne(medicineModel);
exports.updateMedicine = factory.updateOne(medicineModel);
