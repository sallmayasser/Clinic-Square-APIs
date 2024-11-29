const express = require('express');

const {
  addToCart,
  getLoggedUserCart,
  removeItemFromCart,
  clearCart,
  updateItemQuantity,
 // applyCoupon,
} = require('../Controllers/CartController');
const authService = require('../Controllers/authController');


const router = express.Router({ mergeParams: true });

router.use(authService.protect, authService.allowedTo('patient'));

router
  .route('/')
  .post(addToCart)
  .get(getLoggedUserCart)
  .delete(clearCart);

//router.put('/applyCoupon', applyCoupon);

router
  .route('/:itemId')
  .put(updateItemQuantity)
  .delete(removeItemFromCart);

module.exports = router;
