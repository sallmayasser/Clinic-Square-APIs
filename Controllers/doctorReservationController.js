const DoctorReservationModel = require("../Models/doctorReservationModel");
const factory = require("./handlerFactory");

exports.getDoctorReservation = factory.getOne(DoctorReservationModel);
exports.getDoctorReservations = factory.getAll(DoctorReservationModel);
exports.createDoctorReservation = factory.createOne(DoctorReservationModel);
exports.deleteDoctorReservation = factory.deleteOne(DoctorReservationModel);
exports.updateDoctorReservation = factory.updateOne(DoctorReservationModel);
