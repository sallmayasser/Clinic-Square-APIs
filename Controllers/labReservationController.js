const asyncHandler = require("express-async-handler");
const LabReservationModel = require("../Models/labReservationModel");
const ApiError = require("../utils/apiError");
const factory = require("./handlerFactory");

exports.getLabReservation = factory.getOne(LabReservationModel);
exports.getLabReservations = factory.getAll(LabReservationModel);
exports.createLabReservation = factory.createOne(LabReservationModel);
exports.deleteLabReservation = factory.deleteOne(LabReservationModel);
exports.updateLabReservation = factory.updateOne(LabReservationModel);
