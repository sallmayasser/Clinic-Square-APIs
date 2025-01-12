const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/apiError");
const ApiFeatures = require("../utils/apiFeatures");
const bcrypt = require("bcryptjs");
const createToken = require("../utils/createToken");

exports.deleteOne = (Model) =>
  asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const document = await Model.findByIdAndDelete(id);

    if (!document) {
      return next(new ApiError(`No document for this id ${id}`, 404));
    }

    // Trigger "remove" event when update document
    // document.remove();
    res.status(204).json({
      status: "success",
      data: null,
    });
  });
exports.AppendOne = (Model) =>
  asyncHandler(async (req, res, next) => {
    const document = await Model.findByIdAndUpdate(
      req.params.id,
      { $push: req.body },
      {
        new: false,
        returnOriginal: true,
      }
    );

    if (!document) {
      return next(
        new ApiError(`No document for this id ${req.params.id}`, 404)
      );
    }
    // Trigger "save" event when update document
    document.save();
    res.status(200).json({ message: "Data Appended Successfully." });
  });

exports.updateOne = (Model, populateOpt) =>
  asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    let document = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    let filter = {};
    if (req.filterObj) {
      filter = req.filterObj;
    }
    // Build query
    let query = Model.findById(id, filter);
    if (populateOpt) {
      query = query.populate(populateOpt);
    }

    const apiFeatures = new ApiFeatures(query, req.query);
    await apiFeatures.limitFields();
    await apiFeatures.populate(); // This keeps the existing population logic intact
    const { mongooseQuery } = apiFeatures;

    // Execute query
    document = await mongooseQuery;

    if (!document) {
      return next(
        new ApiError(`No document for this id ${req.params.id}`, 404)
      );
    }
    // Trigger "save" event when update document
    document.save();
    res.status(200).json({ data: document });
  });

exports.createOne = (Model) =>
  asyncHandler(async (req, res) => {
    const newDoc = await Model.create(req.body);
    res.status(201).json({ data: newDoc });
  });

exports.getOne = (Model, populateOpt) =>
  asyncHandler(async (req, res, next) => {
    let filter = {};
    if (req.filterObj) {
      filter = req.filterObj;
    }

    const { id } = req.params;

    // Build query
    let query = Model.findById(id, filter);
    if (populateOpt) {
      query = query.populate(populateOpt);
    }

    const apiFeatures = new ApiFeatures(query, req.query);
    await apiFeatures.limitFields();
    await apiFeatures.populate(); // This keeps the existing population logic intact
    const { mongooseQuery } = apiFeatures;

    // Execute query
    const document = await mongooseQuery;

    if (!document) {
      return next(new ApiError(`No document for this id ${id}`, 404));
    }
    res.status(200).json({ data: document });
  });


exports.getAll = (Model, populateOpt, modelName = "") =>
  asyncHandler(async (req, res) => {
    let filter = {};
    if (req.filterObj) {
      filter = req.filterObj;
    }
    // Build query
    let query = Model.find(filter);
    if (populateOpt) {
      query = query.populate(populateOpt);
    }

    const apiFeatures = new ApiFeatures(query, req.query);
    await apiFeatures.filter();
    await apiFeatures.search();
    await apiFeatures.paginate();
    await apiFeatures.limitFields();
    await apiFeatures.sort();
    await apiFeatures.populate();
    await apiFeatures.groupBy(req.user.id,req.user.role);

    // Execute query
    const { mongooseQuery, paginationResult } = apiFeatures;
    const documents = await mongooseQuery;
    // console.log(documents)
   
      res
      .status(200)
      .json({ results: documents.length, paginationResult, data: documents });
    
    });

exports.createFilterObj = (req, res, next, filterType) => {
  let filterObject = {};

  if (filterType === "patient") {
    filterObject = { patient: req.params.id };
  } else if (filterType === "doctor") {
    filterObject = { doctor: req.params.id };
  } else if (filterType === "lab") {
    filterObject = { lab: req.params.id };
  } else if (filterType === "pharmacy") {
    filterObject = { pharmacy: req.params.id };
  }
  req.filterObj = filterObject;
  next();
};

exports.changeUserPassword = (Model) =>
  asyncHandler(async (req, res, next) => {
    const document = await Model.findByIdAndUpdate(
      req.params.id,
      {
        password: await bcrypt.hash(req.body.password, 12),
        passwordChangedAt: Date.now(),
      },
      {
        new: true,
      }
    );

    if (!document) {
      return next(
        new ApiError(`No document for this id ${req.params.id}`, 404)
      );
    }
    res.status(200).json({ data: document });
  });

// @desc    Get Logged user data
// @route   GET /api/v1/users/getMe
// @access  Private/Protect
exports.getLoggedUserData = asyncHandler(async (req, res, next) => {
  req.params.id = req.user._id;
  next();
});

// @desc    Update logged user password
// @route   PUT /api/v1/users/updateMyPassword
// @access  Private/Protect
exports.updateLoggedUserPassword = (Model) =>
  asyncHandler(async (req, res, next) => {
    // 1) Update user password based user payload (req.user._id)
    const user = await Model.findByIdAndUpdate(
      req.user._id,
      {
        password: await bcrypt.hash(req.body.newPassword, 12),
        passwordChangedAt: Date.now(),
      },
      {
        new: true,
      }
    );

    // 2) Generate token
    const token = createToken(user._id);
    delete user._doc.password;
    res.status(200).json({ data: user, token });
  });

// @desc    Deactivate logged user
// @route   DELETE /api/v1/users/deleteMe
// @access  Private/Protect
exports.deleteLoggedUserData = (Model) =>
  asyncHandler(async (req, res, next) => {
    await Model.findByIdAndUpdate(req.user._id, { active: false });

    res.status(204).json({ status: "Success" });
  });
exports.verify = (req, res, next) => {
  // Nested route (Create)
  if (!req.body.state) req.body.state = true;
  req.body.user = req.user.email;
  next();
};
exports.setMailToBody = (req, res, next) => {
  if (!req.body.user) req.body.user = req.user.email;
  next();
};
