const express = require("express");
const {
  createFilterObj,
  updateLoggedUserPassword,
  deleteLoggedUserData,
  getLoggedUserData,
  setMailToBody,
} = require("../Controllers/handlerFactory");
const {
  getPharmacy,
  getPharmacys,
  deletePharmacy,
  updatePharmacy,
  setPharmacyToBody,
  updateLoggedPharmacyData,
  setPharmacyIdToBody,
} = require("../Controllers/pharmacyController");
const {
  addMedicine,
  getMedicines,
  getMedicine,
  deleteMedicine,
  updateMedicine,
} = require("../Controllers/Pharmacy-MedicineController");
const validators = require("../utils/validators/pharmacyValidator ");

const newMedicine = require("../Controllers/medicineController");
const validator = require("../utils/validators/medicineValidator");
const { resizeImage, uploadImage } = require("../Controllers/imageController");
const authController = require("../Controllers/authController");
const PharmacyModel = require("../Models/pharmacyModel");

const router = express.Router({ mergeParams: true });

router.use(authController.protect);

// Pharmacy routes
router.get(
  "/getMe",
  authController.allowedTo("pharmacy"),
  getLoggedUserData,
  getPharmacy
);
router.patch(
  "/changeMyPassword",
  authController.allowedTo("pharmacy"),
  validators.changePharmacyPasswordValidator,
  updateLoggedUserPassword(PharmacyModel)
);
router.patch(
  "/updateMe",
  authController.allowedTo("pharmacy"),
  getLoggedUserData,
  uploadImage,
  setPharmacyToBody,
  resizeImage,
  validators.updateLoggedpharmacyValidator,
  updateLoggedPharmacyData
);

// medincine route
router
  .route("/medicine")
  .get(
    authController.allowedTo("pharmacy"),
    getLoggedUserData,
    (req, res, next) => {
      createFilterObj(req, res, next, "pharmacy");
    },
    getMedicines
  )
  .post(
    authController.allowedTo("pharmacy"),
    getLoggedUserData,
    setPharmacyIdToBody,
    validator.createPharmacyMedicineValidator,
    addMedicine
  );
router
  .route("/medicine/:id")
  .get(authController.allowedTo("pharmacy"), getMedicine)
  .delete(authController.allowedTo("pharmacy"), deleteMedicine)
  .patch(
    authController.allowedTo("pharmacy"),
    validator.stockValidator,
    updateMedicine
  );

router
  .route("/newMedicine")
  .post(
    authController.allowedTo("pharmacy"),
    validator.createMedicineValidator,
    setMailToBody,
    newMedicine.addMedicine
  );
// admin routes

router.route("/").get(authController.allowedTo("admin"), getPharmacys);

router
  .route("/:id")
  .get(validators.getPharmacyValidator, getPharmacy)
  .patch(
    authController.allowedTo("admin"),
    uploadImage,
    resizeImage,
    validators.updatePharmacyValidator,
    updatePharmacy
  )
  .delete(
    authController.allowedTo("admin"),
    validators.deletePharmacyValidator,
    deletePharmacy
  );

module.exports = router;
