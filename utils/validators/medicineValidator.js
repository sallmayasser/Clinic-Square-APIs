const slugify = require("slugify");
const { check, body } = require("express-validator");
const validatorMiddleware = require("../../Middlewares/validatorMiddleware");
const PharmacyMedicineModel = require("../../Models/pharmacies-medicinesModel");
const ApiError = require("../apiError");

exports.getMedicineValidator = [
  check("id").isMongoId().withMessage("Invalid Medicine id format"),
  validatorMiddleware,
];

exports.createMedicineValidator = [
  // Name validation
  check("name")
    .notEmpty()
    .withMessage("Medicine name is required")
    .isLength({ min: 3 })
    .withMessage("Medicine name is too short")
    .isLength({ max: 32 })
    .withMessage("Medicine name is too long")
    .custom((val, { req }) => {
      req.body.slug = slugify(val);
      return true;
    }),

  // Cost validation
  check("cost").notEmpty().withMessage("The medicine cost must be assigned"),

  validatorMiddleware,
];

exports.deleteMedicineValidator = [
  check("id").isMongoId().withMessage("Invalid Medicine id format"),
  validatorMiddleware,
];

exports.updateMedicineValidator = [
  // Optional name validation (only validates if provided)
  check("name")
    .optional()
    .isLength({ min: 3 })
    .withMessage("Medicine name is too short")
    .isLength({ max: 32 })
    .withMessage("Medicine name is too long")
    .custom((val, { req }) => {
      req.body.slug = slugify(val);
      return true;
    }),

  // Optional cost validation
  check("cost")
    .optional()
    .notEmpty()
    .withMessage("The medicine cost must be assigned"),
  validatorMiddleware,
];

exports.createPharmacyMedicineValidator = [
  // Validate medicine
  check("medicine")
    .notEmpty()
    .withMessage("Medicine ID is required")
    .custom(async (medicineId) => {
      const medicineExists = await PharmacyMedicineModel.findOne({
        medicine: medicineId,
      });
      if (medicineExists) {
        throw new ApiError("This medicine already exists in the pharmacy", 400);
      }
      return true;
    }),

  // Validate pharmacy
  check("pharmacy").notEmpty().withMessage("Pharmacy ID is required"),

  // Validate stock
  check("stock")
    .notEmpty()
    .withMessage("Stock is required")
    .isInt({ gt: 0 }) // Check if the stock is a positive integer
    .withMessage("Stock must be a positive number"),

  validatorMiddleware,
];

// Create validation for updating a PharmacyMedicine
exports.stockValidator = [
  check("stock")
    .notEmpty()
    .withMessage("you must enter stock amount")
    .isInt({ gt: 0 }) // Check if the stock is a positive integer
    .withMessage("Stock must be a positive number"),
  validatorMiddleware,
];
