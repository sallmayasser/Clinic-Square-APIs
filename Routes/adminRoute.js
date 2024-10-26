const express = require("express");
const authController = require("../Controllers/authController");
const {
  Approve,
  Decline,
  verifingObject,
  unverifiedObject,
} = require("../Controllers/adminController");

const router = express.Router({ mergeParams: true });

router
  .route("/Approve")
  .put(authController.protect, authController.allowedTo("admin"), Approve);
router
  .route("/VerifyObject")
  .put(
    authController.protect,
    authController.allowedTo("admin"),
    verifingObject
  );
router
  .route("/Decline")
  .delete(authController.protect, authController.allowedTo("admin"), Decline);
router
  .route("/UnverifiedObject")
  .delete(
    authController.protect,
    authController.allowedTo("admin"),
    unverifiedObject
  );
module.exports = router;
