const express = require("express");
const {
  getLoggedUserData,
  createFilterObj,
} = require("../Controllers/handlerFactory");
const {
  getLabReservation,
  getLabReservations,
  createLabReservation,
  deleteLabReservation,
  updateLabReservation,
} = require("../Controllers/labReservationController");
const validator = require("../utils/validators/labReservationValidator ");
const authController = require("../Controllers/authController");
const {
  setPatientToBody,
  setPatientIdToBody,
} = require("../Controllers/PatientController");
const { uploadImage, resizeImage } = require("../Controllers/imageController");

const router = express.Router({ mergeParams: true });

router.use(authController.protect);

router
  .route("/")
  .get(authController.allowedTo("admin"), getLabReservations)
  .post(
    authController.allowedTo("patient"),
    getLoggedUserData,
    setPatientIdToBody,
   // validator.createLabReservationValidator,
    createLabReservation
  );
router.route("/upload/:id").patch(
  authController.allowedTo("lab"),
  uploadImage,
  setPatientToBody,
  // validator.updateReservationValidator,
  resizeImage,
  (req, res) => {
    res.status(200).json({
      message: "Test result file uploaded and added successfully",
    });
  }
);
router
  .route("/:id")
  .get(
    authController.allowedTo("lab", "patient", "admin"),
    validator.getReservationValidator,
    getLabReservation
  )
  .patch(
    authController.allowedTo("lab", "patient"),
    validator.updateReservationValidator,
    updateLabReservation
  )
  .delete(
    authController.protect,
    authController.allowedTo("patient"),
    validator.deleteReservationValidator,
    deleteLabReservation
  );

module.exports = router;
