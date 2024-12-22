const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/apiError");
const sendEmail = require("../utils/sendEmail");
const createToken = require("../utils/createToken");
const Patients = require("../Models/patientModel");
const Doctors = require("../Models/doctorModel");
const Pharmacies = require("../Models/pharmacyModel");
const Labs = require("../Models/labModel");
const Admins = require("../Models/AdminModel");

const invalidatedTokens = new Set();
// @desc    Signup
// @route   GET /api/v1/auth/signup/{ModelName}
// @access  Public

exports.signup = async (Model, req, res, next) => {
  const { email } = req.body;
  const [patient, doctor, lab, admin, pharmacy] = await Promise.all([
    Patients.findOne({ email }).exec(),
    Doctors.findOne({ email }).exec(),
    Labs.findOne({ email }).exec(),
    Admins.findOne({ email }).exec(),
    Pharmacies.findOne({ email }).exec(),
  ]);
  if (!patient && !doctor && !lab && !admin && !pharmacy) {
    // 1- Create user
    let user = await Model.create(req.body);

    // Convert the document to JSON with virtuals
    const responseData = user.toJSON({ virtuals: true });
    // 2- Generate token
    const token = createToken(user._id);

    res.status(201).json({ data: responseData, token });
  } else {
    return next(
      new ApiError("this email is already exsit for other role ", 400)
    );
  }
};

exports.checkRole = (req, res, next) => {
  const query = req.body.role;

  try {
    switch (query) {
      case "patient":
        this.signup(Patients, req, res, next);
        break;
      case "doctor":
        this.signup(Doctors, req, res, next);
        break;
      case "lab":
        this.signup(Labs, req, res, next);
        break;
      case "pharmacy":
        this.signup(Pharmacies, req, res, next);
        break;
      default:
        return next(new ApiError("this role is incorrect ", 401));
    }
  } catch (error) {
    console.log(error);
  }
};

// @desc    Login
// @route   GET /api/v1/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
  const { password, email, role } = req.body;
  let user;

  switch (role) {
    case "patient":
      user = await Patients.findOne({ email }).exec();
      break;
    case "doctor":
      user = await Doctors.findOne({ email }).exec();
      break;
    case "lab":
      user = await Labs.findOne({ email }).exec();
      break;
    case "pharmacy":
      user = await Pharmacies.findOne({ email }).exec();
      break;
    case "admin":
      user = await Admins.findOne({ email }).exec();
      break;
    default:
      return next(new ApiError("Invalid role", 400));
  }
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return next(new ApiError("Incorrect email or password", 401));
  }
  // Check if account is awaiting approval (for roles that require approval)
  if (
    (role === "doctor" && user.state === false) ||
    (role === "lab" && user.state === false) ||
    (role === "pharmacy" && user.state === false)
  ) {
    return next(new ApiError("Waiting until Admin approves your account", 401));
  }

  // Login successful, generate token
  const token = createToken(user._id);

  // Remove password before sending the response
  delete user._doc.password;

  // Send response
  res.status(200).json({ data: user, token });
});

exports.logout = asyncHandler(async (req, res, next) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    // Invalidate the token by adding it to the blacklist
    invalidatedTokens.add(token);
    res.status(200).json({ message: "Logout successful" });
  } catch {
    return next(new ApiError("Please login first ", 401));
  }
});

// @desc   make sure the user is logged in
exports.protect = asyncHandler(async (req, res, next) => {
  // 1) Check if token exist, if exist get
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }
  if (!token || invalidatedTokens.has(token)) {
    return next(
      new ApiError(
        "You are not login,Please login to get access this route",
        401
      )
    );
  }

  // 2) Verify token (no change happens, expired token)
  const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

  //3) Check if user exists
  const [patient, doctor, lab, pharmacy, admin] = await Promise.all([
    Patients.findById(decoded.userId),
    Doctors.findById(decoded.userId),
    Labs.findById(decoded.userId),
    Pharmacies.findById(decoded.userId),
    Admins.findById(decoded.userId),
  ]);
  const currentUser = patient || doctor || lab || pharmacy || admin;
  if (!currentUser) {
    return next(
      new ApiError(
        "The user that belongs to this token does no longer exist",
        401
      )
    );
  }
  // 4) Check if user change his password after token created

  if (currentUser) {
    if (currentUser.passwordChangedAt) {
      const passChangedTimestamp = parseInt(
        currentUser.passwordChangedAt.getTime() / 1000,
        10
      );
      // Password changed after token created (Error)
      if (passChangedTimestamp > decoded.iat) {
        return next(
          new ApiError(
            "user recently changed their password. Please log in again.",
            401
          )
        );
      }
    }
    req.user = currentUser;
  } else {
    return next(
      new ApiError(
        "No valid user found for this token. Please log in again.",
        401
      )
    );
  }
  next();
});

// // @desc    Authorization (User Permissions)
// // [ "patient","doctor ,"lab","pharmacy"]
exports.allowedTo = (...roles) =>
  asyncHandler(async (req, res, next) => {
    // Access roles
    // Check if the user has the required role
    const { user } = req;
    if (!user || !roles.includes(user.role)) {
      return next(
        new ApiError("You are not allowed to access this route", 403)
      );
    }
    next();
  });

// // @desc    Forgot password
// // @route   POST /api/v1/auth/forgotPassword
// // @access  Public
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  // 1) Get user by email
  const [patient, doctor, lab, pharmacy, admin] = await Promise.all([
    Patients.findOne({ email: req.body.email }),
    Doctors.findOne({ email: req.body.email }),
    Labs.findOne({ email: req.body.email }),
    Pharmacies.findOne({ email: req.body.email }),
    Admins.findOne({ email: req.body.email }),
  ]);

  const user = patient || doctor || lab || pharmacy || admin;

  if (user) {
    // User found, handle accordingly...
  } else {
    return next(
      new ApiError(`There is no user with that email ${req.body.email}`, 404)
    );
  }

  //   // 2) If user exist, Generate hash reset random 6 digits and save it in db
  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedResetCode = crypto
    .createHash("sha256")
    .update(resetCode)
    .digest("hex");

  // Save hashed password reset code into db
  user.passwordResetCode = hashedResetCode;
  // Add expiration time for password reset code (10 min)
  user.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  user.passwordResetVerified = false;

  await user.save();

  //   // 3) Send the reset code via email
  const message = `Hi ${user.firstName},
      \n We received a request to reset the password on your Clinic Square application Account.
      \n ${resetCode} \n Enter this code to complete the reset. 
      \n Thanks for helping us keep your account secure.
      \n The Clinic Square application Team❤️`;
  try {
    await sendEmail({
      email: user.email,
      subject: "Your password reset code (valid for 10 min)",
      message,
    });
  } catch (err) {
    user.passwordResetCode = undefined;
    user.passwordResetExpires = undefined;
    user.passwordResetVerified = undefined;

    await user.save();
    return next(new ApiError("There is an error in sending email", 500));
  }

  res
    .status(200)
    .json({ status: "Success", message: "Reset code sent to email" });
});

// // @desc    Verify password reset code
// // @route   POST /api/v1/auth/verifyResetCode
// // @access  Public
exports.verifyPassResetCode = asyncHandler(async (req, res, next) => {
  // 1) Get user based on reset code
  const hashedResetCode = crypto
    .createHash("sha256")
    .update(req.body.resetCode)
    .digest("hex");

  const [patient, doctor, lab, pharmacy, admin] = await Promise.all([
    Patients.findOne({
      passwordResetCode: hashedResetCode,
      passwordResetExpires: { $gt: Date.now() },
    }),
    Doctors.findOne({
      passwordResetCode: hashedResetCode,
      passwordResetExpires: { $gt: Date.now() },
    }),
    Labs.findOne({
      passwordResetCode: hashedResetCode,
      passwordResetExpires: { $gt: Date.now() },
    }),
    Pharmacies.findOne({
      passwordResetCode: hashedResetCode,
      passwordResetExpires: { $gt: Date.now() },
    }),
    Admins.findOne({
      passwordResetCode: hashedResetCode,
      passwordResetExpires: { $gt: Date.now() },
    }),
  ]);

  const user = patient || doctor || lab || pharmacy || admin;

  if (!user) {
    return next(new ApiError("Reset code invalid or expired"));
  }

  // 2) Reset code valid
  user.passwordResetVerified = true;
  await user.save();

  res.status(200).json({
    status: "Success",
  });
});

// // @desc    Reset password
// // @route   POST /api/v1/auth/resetPassword
// // @access  Public
exports.resetPassword = asyncHandler(async (req, res, next) => {
  // 1) Get user based on email
  const [patient, doctor, lab, pharmacy, admin] = await Promise.all([
    Patients.findOne({ email: req.body.email }),
    Doctors.findOne({ email: req.body.email }),
    Labs.findOne({ email: req.body.email }),
    Pharmacies.findOne({ email: req.body.email }),
    Admins.findOne({ email: req.body.email }),
  ]);

  const user = patient || doctor || lab || pharmacy || admin;
  if (!user) {
    return next(
      new ApiError(`There is no user with email ${req.body.email}`, 404)
    );
  }

  // 2) Check if reset code verified
  if (!user.passwordResetVerified) {
    return next(new ApiError("Reset code not verified", 400));
  }

  user.password = req.body.newPassword;
  user.passwordResetCode = undefined;
  user.passwordResetExpires = undefined;
  user.passwordResetVerified = undefined;

  await user.save();

  // 3) if everything is ok, generate token
  const token = createToken(user._id);
  res.status(200).json({ token });
});
