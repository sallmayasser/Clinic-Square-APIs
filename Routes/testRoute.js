const express = require("express");
const test = require("../Controllers/testController");
const {
  addTest,
  getTests,
  getTestById,
  deleteTest,
  updateTest,
} = require("../Controllers/testController");
const validator = require("../utils/validators/testValidator");
const authController = require("../Controllers/authController");
const { verify } = require("../Controllers/handlerFactory");

const router = express.Router({ mergeParams: true });
router.use(authController.protect);

router
  .route("/")
  .get(authController.allowedTo("lab", "patient", "admin"), getTests)
  .post(
    authController.allowedTo("admin"),
    validator.createTestValidator,
    verify,
    addTest
  );

router
  .route("/:id")
  .get(
    authController.allowedTo("lab", "patient", "admin"),
    validator.getTestValidator,
    getTestById
  )
  .delete(
    authController.allowedTo("admin"),
    validator.deleteTestValidator,
    deleteTest
  )
  .patch(
    authController.allowedTo("admin"),
    validator.updateTestValidator,
    updateTest
  );

module.exports = router;
