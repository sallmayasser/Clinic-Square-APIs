const { request } = require("express");
const DoctorModel = require("../Models/doctorModel");
const factory = require("../Controllers/handlerFactory");

exports.getDoctor = factory.getOne(DoctorModel);
exports.getDoctors = factory.getAll(DoctorModel);
exports.createDoctor = factory.createOne(DoctorModel);
exports.deleteDoctor = factory.deleteOne(DoctorModel);
exports.updateDoctor = factory.updateOne(DoctorModel);
