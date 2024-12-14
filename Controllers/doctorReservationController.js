const AsyncHandler = require("express-async-handler");
const DoctorReservationModel = require("../Models/doctorReservationModel");
const factory = require("./handlerFactory");

exports.getDoctorReservation = factory.getOne(DoctorReservationModel);
exports.getDoctorReservations = factory.getAll(DoctorReservationModel);
exports.createDoctorReservation = factory.createOne(DoctorReservationModel);
exports.deleteDoctorReservation = factory.deleteOne(DoctorReservationModel);
exports.updateDoctorReservation = factory.updateOne(DoctorReservationModel);
exports.AppendRequestedTest = factory.AppendOne(DoctorReservationModel);

exports.ClearData = AsyncHandler(async (req, res, next) => {
  const id = req.params.ReservationId;

  if (!req.body.report) {
    return next(
      new Error("You must provide fields to clear in the 'report' object.")
    );
  }

  // Construct the dynamic update query
  const updateQuery = {};
  for (const [key, value] of Object.entries(req.body.report)) {
    updateQuery[`report.${key}`] = value;
  }

  const updatedReservation = await DoctorReservationModel.findByIdAndUpdate(
    id,
    { $set: updateQuery },
    { new: true }
  );

  if (!updatedReservation) {
    return next(new Error(`No reservation found with ID ${id}`));
  }

  res.status(200).json({
    message: "Requested tests cleared successfully.",
    data: updatedReservation,
  });
});
