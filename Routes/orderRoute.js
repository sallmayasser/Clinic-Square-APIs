const express = require("express");
const {
  createOrder,
  getOrder,
  updateOrder,
  deleteOrder,
  getOrders,
} = require("../Controllers/orderController");
const authController = require("../Controllers/authController");
const {
  getLoggedUserData,
  createFilterObj,
} = require("../Controllers/handlerFactory");
const router = express.Router({ mergeParams: true });
router.use(authController.protect);

//Admin Route

router.route("/All-orders").get(authController.allowedTo("admin"), getOrders);

// patient Route
router
  .route("/")
  .post(authController.allowedTo("patient"), createOrder)
  .get(
    authController.allowedTo("patient"),
    getLoggedUserData,
    (req, res, next) => {
      createFilterObj(req, res, next, "patient");
    },
    getOrders
  );

router
  .route("/:id")
  .get(authController.allowedTo("patient", "pharmacy"), getOrder)
  .patch(authController.allowedTo("pharmacy"), updateOrder)
  .delete(authController.allowedTo("patient"), deleteOrder);

module.exports = router;
