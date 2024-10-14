const express = require("express");
const { loginValidator } = require("../utils/validators/authValidator");
const {
  login,
  forgotPassword,
  verifyPassResetCode,
  resetPassword,
  checkRole,
  logout,
  signup,
} = require("../Controllers/authController");
const { resizeImage, uploadImage } = require("../Controllers/imageController");
const validateMiddleware = require("../Middlewares/newValidatorMiddleware");
const AdminModel = require("../Models/AdminModel");

const router = express.Router();

router.post("/signup/admin", (req, res, next) => {
  signup(AdminModel, req, res, next);
});

router.post(
  "/signup",
  uploadImage,
  resizeImage,
  validateMiddleware,
  (req, res, next) => {
    checkRole(req, res, next);
  }
);

router.post("/login", loginValidator, login);
router.post("/logout", logout);
router.post("/forgotPassword", forgotPassword);
router.post("/verifyResetCode", verifyPassResetCode);
router.put("/resetPassword", resetPassword);

module.exports = router;
