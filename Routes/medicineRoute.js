const express = require("express");
const {
  addMedicine,
  getMedicines,
  getMedicineById,
  deleteMedicine,
  updateMedicine
} = require("../Controllers/medicineController");
const validator = require("../utils/validators/medicineValidator");
const authController = require("../Controllers/authController");
const { verify } = require("../Controllers/handlerFactory");
const { uploadImage, resizeImage } = require("../Controllers/imageController");
const { setPharmacyToBody } = require("../Controllers/pharmacyController");

const router = express.Router({ mergeParams: true });
router.use(authController.protect);

router
  .route("/")
  .get(authController.allowedTo("pharmacy", "patient", "admin"), getMedicines)
  .post(
    authController.allowedTo("admin"),
    uploadImage,
    setPharmacyToBody,
    resizeImage,
    validator.createMedicineValidator,
    verify,
    addMedicine
  );

router
  .route("/:id")
  .get(
    authController.allowedTo("pharmacy", "patient", "admin"),
    validator.getMedicineValidator,
    getMedicineById
  )
  .delete(
    authController.allowedTo("admin"),
    validator.deleteMedicineValidator,
    deleteMedicine
  )
  .patch(
    authController.allowedTo("admin"),
    validator.updateMedicineValidator,
    updateMedicine
  );

module.exports = router;
