const express = require("express");

const {
  getLab,
  getLabs,
  createLab,
  deleteLab,
  updateLab,
} = require("../Controllers/labController");
const validator = require("../utils/validators/labValidator");

const router = express.Router({ mergeParams: true });

router
  .route("/")
  .get(getLabs)
  .post(validator.createLabValidator, createLab);

router
  .route("/:id")
  .get(validator.getLabValidator, getLab)
  .patch(validator.updateLabValidator, updateLab)
  .delete(validator.deleteLabValidator, deleteLab);

module.exports = router;
