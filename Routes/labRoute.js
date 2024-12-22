const express = require("express");
const {
  createFilterObj,
  updateLoggedUserPassword,
  deleteLoggedUserData,
  getLoggedUserData,
  setMailToBody,
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
  updateTest,
} = require("../Controllers/lab-testController");
const newTest = require("../Controllers/testController");
const {
  getLabReservations,
} = require("../Controllers/labReservationController");
const {
  updateSchedule,
  addNewSchedule,
  deleteSchedule,
} = require("../Controllers/scheduleController");
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
router.put(
  "/update-day",
  authController.allowedTo("lab"),
  getLoggedUserData,
  validators.updateScheduleValidator,
  updateSchedule(LabModel)
);
router.post(
  "/add-day",
  authController.allowedTo("lab"),
  getLoggedUserData,
  validators.addScheduleValidator,
  addNewSchedule(LabModel)
);
router.delete(
  "/delete-schedule-day",
  authController.allowedTo("lab"),
  getLoggedUserData,
  deleteSchedule(LabModel)
);
// test Routes
router
  .route("/All-Labs-tests")
  .get(authController.allowedTo("patient","admin"), getTests);

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
    setMailToBody,
    newTest.addTest
  );
router
  .route("/tests/:id")
  .get(authController.allowedTo("lab"), getTest)
  .delete(authController.allowedTo("lab"), deleteTest)
  .patch(
    authController.allowedTo("lab"),
    // getLoggedUserData,
    validator.updateTestValidator,
    updateTest
  );

// admin routes

router.route("/").get(authController.allowedTo("admin", "patient"), getLabs);

router.route("/lab-tests/:id").get(
  authController.allowedTo("patient"),
  (req, res, next) => {
    createFilterObj(req, res, next, "lab");
  },
  getTests
);
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
