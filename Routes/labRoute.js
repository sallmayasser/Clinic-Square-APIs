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
  setLabIdToBody,
} = require("../Controllers/labController");
const validators = require("../utils/validators/labValidator");
const validator = require("../utils/validators/testValidator");
const { resizeImage, uploadImage } = require("../Controllers/imageController");
const authController = require("../Controllers/authController");
const LabModel = require("../Models/labModel");
const {
  getTest,
  deleteTest,
  getTests,
  addTest,
} = require("../Controllers/lab-testController");
const newTest = require("../Controllers/testController");
const { getLabReservations } = require("../Controllers/labReservationController");
const router = express.Router({ mergeParams: true });

router.use(authController.protect);

// Lab routes
router.get(
  "/getMe",
  authController.allowedTo("lab"),
  getLoggedUserData,
  getLab
);
router.patch(
  "/changeMyPassword",
  authController.allowedTo("lab"),
  validators.changeLabPasswordValidator,
  updateLoggedUserPassword(LabModel)
);
router.patch(
  "/updateMe",
  authController.allowedTo("lab"),
  getLoggedUserData,
  uploadImage,
  setLabToBody,
  resizeImage,
  validators.updateLoggedLabValidator,
  updateLoggedLabData
);
router.route("/My-Reservations").get(
  getLoggedUserData,
  (req, res, next) => {
    createFilterObj(req, res, next, "lab");
  },
  authController.allowedTo("lab"),
  getLabReservations
);

// test Routes
router
  .route("/tests")
  .get(
    authController.allowedTo("lab"),
    getLoggedUserData,
    (req, res, next) => {
      createFilterObj(req, res, next, "lab");
    },
    getTests
  )
  .post(
    authController.allowedTo("lab"),
    getLoggedUserData,
    setLabIdToBody,
    validator.createLabTestValidator,
    addTest
  );
router
  .route("/newTest")
  .post(
    authController.allowedTo("lab"),
    validator.createTestValidator,
    newTest.addTest
  );
router
  .route("/tests/:id")
  .get(authController.allowedTo("lab"), getTest)
  .delete(authController.allowedTo("lab"), deleteTest);

// admin routes

router.route("/").get(authController.allowedTo("admin"), getLabs);

router
  .route("/:id")
  .get(validators.getLabValidator, getLab)
  .patch(
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
