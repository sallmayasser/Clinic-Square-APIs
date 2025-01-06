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
  check("name")
    .notEmpty()
    .withMessage("Name is required")
    .isString()
    .withMessage("Name must be a string")
    .matches(/^[A-Za-z0-9\s\(\)]+$/)
    .withMessage("medicine name can only contain letters, parentheses, spaces and numbers"),
  check("photo")
    .notEmpty()
    .withMessage("Photo is required")
    .isString()
    .withMessage("Photo must be a string"),
  check("cost")
    .notEmpty()
    .withMessage("Cost is required")
    .isNumeric()
    .withMessage("Cost must be a numeric value"),
  check("category")
    .notEmpty()
    .withMessage("Category is required")
    .isString()
    .withMessage("Category must be a string")
    .isIn([
      "Cosmetics",
      "Hair Care",
      "Every Day Essentials",
      "Medical Equipment & Supplies",
      "Mom & Baby",
      "Sexual Health",
      "Medicine",
      "Skin Care",
    ])
    .withMessage("Invalid category. Please select a valid category."),
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
    .matches(/^[A-Za-z0-9\s\(\)]+$/)
    .withMessage("medicine name can only contain letters, parentheses, spaces and numbers"),

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
    .custom(async (medicineId, { req }) => {
      return PharmacyMedicineModel.findOne({
        medicine: medicineId,
        pharmacy: req.user._id,
      }).then((medicineExists) => {
        if (medicineExists) {
          throw new ApiError("This test already exists in the Lab", 400);
        }
      });
    }),

  // Validate pharmacy
  // check("pharmacy").notEmpty().withMessage("Pharmacy ID is required"),

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
