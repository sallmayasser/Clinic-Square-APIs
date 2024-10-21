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

exports.updateSchedule = asyncHandler(async (req, res, next) => {
  const doctorId = req.params.id;
  const { day, startTime, endTime, limit } = req.body;
  try {
    const updatedDoctor = await DoctorModel.findOneAndUpdate(
      { _id: doctorId, "schedule.days.day": day },
      {
        $set: {
          "schedule.days.$.startTime": startTime,
          "schedule.days.$.endTime": endTime,
          "schedule.days.$.limit": limit,
        },
      },
      { new: true }
    );

    if (!updatedDoctor) {
      return next(new ApiError(`Doctor or day not found `, 404));
    }

    res.status(200).json({ data: updatedDoctor });
  } catch (error) {
    return next(new ApiError(`Internal Server Error ,${error}`, 500));
  }
});
exports.addNewSchedule = asyncHandler(async (req, res, next) => {
  try {
    const { day, startTime, endTime, limit } = req.body;

    // Find the doctor by ID (or use logged-in user if applicable)
    const doctor = await DoctorModel.findById(req.user.id);

    if (!doctor) {
      return next(new ApiError("Doctor not found", 404));
    }

    // Check if the day already exists in the schedule
    const existingDay = doctor.schedule.days.find(
      (scheduleDay) => scheduleDay.day === day.toLowerCase()
    );

    if (existingDay) {
      return next(new ApiError(`Schedule for ${day} already exists`, 400));
    }

    doctor.schedule.days.push({
      day: day.toLowerCase(),
      startTime,
      endTime,
      limit,
    });

    await doctor.save();

    res.status(201).json({ data: doctor.schedule });
  } catch (error) {
    return next(new ApiError(`Internal Server Error ,${error}`, 500));
  }
});
exports.deleteSchedule = asyncHandler(async (req, res, next) => {
  const { day } = req.body;

  try {
    const doctor = await DoctorModel.findById(req.user.id);

    if (!doctor) {
      return next(new ApiError("Doctor not found", 404));
    }

    // Filter out the day to delete
    const updatedDays = doctor.schedule.days.filter(
      (scheduleDay) => scheduleDay.day !== day.toLowerCase()
    );

    // Check if the day was found and removed
    if (doctor.schedule.days.length === updatedDays.length) {
      return next(new ApiError(`Schedule for ${day} not found`, 404));
    }

    // Update the doctor's schedule
    doctor.schedule.days = updatedDays;
    await doctor.save();

    res
      .status(200)
      .json({ message: `Schedule for ${day} deleted successfully` });
  } catch (error) {
    next(new ApiError("Failed to delete schedule", 500));
  }
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
