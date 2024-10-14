const express = require("express");
const authController = require("../Controllers/authController");
const { Approve, Decline } = require("../Controllers/adminController");

const router = express.Router({ mergeParams: true });

router
  .route("/Approve")
  .put(authController.protect, authController.allowedTo("admin"), Approve);
router
  .route("/Decline")
  .delete(authController.protect, authController.allowedTo("admin"), Decline);
module.exports = router;
