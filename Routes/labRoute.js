const express = require("express");
const {
  createFilterObj,
  updateLoggedUserPassword,
  deleteLoggedUserData,
  getLoggedUserData,
} = require("../Controllers/handlerFactory");
const {
  getLab,
  getLabs,
  deleteLab,
  updateLab,
  setLabToBody,
  updateLoggedLabData,
} = require("../Controllers/labController");
const validators = require("../utils/validators/labValidator");

const { resizeImage, uploadImage } = require("../Controllers/imageController");
const authController = require("../Controllers/authController");
const LabModel = require("../Models/labModel");

const router = express.Router({ mergeParams: true });

router.use(authController.protect);

// Lab routes
router.get(
  "/getMe",
  authController.allowedTo("lab"),
  getLoggedUserData,
  getLab
);
router.put(
  "/changeMyPassword",
  authController.allowedTo("lab"),
  validators.changeLabPasswordValidator,
  updateLoggedUserPassword(LabModel)
);
router.put(
  "/updateMe",
  authController.allowedTo("lab"),
  getLoggedUserData,
  uploadImage,
  setLabToBody,
  resizeImage,
  validators.updateLoggedLabValidator,
  updateLoggedLabData
);


// admin routes

router.route("/").get(authController.allowedTo("admin"), getLabs);

router
  .route("/:id")
  .get(validators.getLabValidator, getLab)
  .put(
    authController.allowedTo("admin"),
    uploadImage,
    resizeImage,
    validators.updateLabValidator,
    updateLab
  )
  .delete(
    authController.allowedTo("admin"),
    validators.deleteLabValidator,
    deleteLab
  );

module.exports = router;

module.exports = router;
