const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");

router.post(
  "/create-checkout-session",
  paymentController.createCheckoutSession
);
router.post(
  "/send-confirmation-email",
  paymentController.sendConfirmationEmail
);
router.get("/retrieve-session", paymentController.retrieveSession);
router.get("/list-payments", paymentController.listPayments);
router.post("/webhook", paymentController.webhookHandler);
router.post("/handle-payment", paymentController.handlePayment);
router.get("/get-balance", paymentController.getBalance);
router.get("/payment/:paymentId", paymentController.getPaymentDetails);

module.exports = router;
