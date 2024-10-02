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
} = require("../controllers/authController");
const { resizeImage, uploadImage } = require("../controllers/imageController");
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
router.get("/logout", logout);
router.post("/forgotPassword", forgotPassword);
router.post("/verifyResetCode", verifyPassResetCode);
router.put("/resetPassword", resetPassword);

module.exports = router;
