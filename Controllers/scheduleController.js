const asyncHandler = require("express-async-handler");
exports.updateSchedule = (Model) =>
  asyncHandler(async (req, res, next) => {
    const UserId = req.params.id;
    const { day, startTime, endTime, limit } = req.body;
    try {
      const updatedUser = await Model.findOneAndUpdate(
        { _id: UserId, "schedule.days.day": day },
        {
          $set: {
            "schedule.days.$.startTime": startTime,
            "schedule.days.$.endTime": endTime,
            "schedule.days.$.limit": limit,
          },
        },
        { new: true }
      );

      if (!updatedUser) {
        return next(new ApiError(`User or day not found `, 404));
      }

      res.status(200).json({ data: updatedUser });
    } catch (error) {
      return next(new ApiError(`Internal Server Error ,${error}`, 500));
    }
  });

exports.addNewSchedule =(Model)=> asyncHandler(async (req, res, next) => {
  try {
    const { day, startTime, endTime, limit } = req.body;

    // Find the User by ID (or use logged-in user if applicable)
    const User = await Model.findById(req.user.id);

    if (!User) {
      return next(new ApiError("User not found", 404));
    }

    // Check if the day already exists in the schedule
    const existingDay = User.schedule.days.find(
      (scheduleDay) => scheduleDay.day === day.toLowerCase()
    );

    if (existingDay) {
      return next(new ApiError(`Schedule for ${day} already exists`, 400));
    }

    User.schedule.days.push({
      day: day.toLowerCase(),
      startTime,
      endTime,
      limit,
    });

    await User.save();

    res.status(201).json({ data: User.schedule });
  } catch (error) {
    return next(new ApiError(`Internal Server Error ,${error}`, 500));
  }
});
exports.deleteSchedule =(Model)=> asyncHandler(async (req, res, next) => {
  const { day } = req.body;

  try {
    const User = await Model.findById(req.user.id);

    if (!User) {
      return next(new ApiError("User not found", 404));
    }

    // Filter out the day to delete
    const updatedDays = User.schedule.days.filter(
      (scheduleDay) => scheduleDay.day !== day.toLowerCase()
    );

    // Check if the day was found and removed
    if (User.schedule.days.length === updatedDays.length) {
      return next(new ApiError(`Schedule for ${day} not found`, 404));
    }

    // Update the User's schedule
    User.schedule.days = updatedDays;
    await User.save();

    res
      .status(200)
      .json({ message: `Schedule for ${day} deleted successfully` });
  } catch (error) {
    next(new ApiError("Failed to delete schedule", 500));
  }
});
