const paymentService = require("../services/paymentService");
const emailService = require("../services/emailService");

const createCheckoutSession = async (req, res) => {
  try {
    const session = await paymentService.createCheckoutSession(req.body);
    res.json({ sessionId: session.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const sendConfirmationEmail = async (req, res) => {
  try {
    await emailService.sendConfirmationEmail(req.body);
    res.status(200).json({ message: "Email sent successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const retrieveSession = async (req, res) => {
  try {
    const details = await paymentService.retrieveSession(req.query.session_id);
    res.json(details);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const listPayments = async (req, res) => {
  try {
    const payments = await paymentService.listPayments();
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getPaymentDetails = async (req, res) => {
  try {
    const payment = await paymentService.getPaymentDetails(
      req.params.paymentId
    );
    res.json(payment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getCustomerEmail = async (req, res) => {
  try {
    const email = await paymentService.getCustomerEmail(req.params.customerId);
    res.json({ email });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getBalance = async (req, res) => {
  try {
    const balance = await paymentService.getBalance();
    res.json({ balance });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const handlePayment = async (req, res) => {
  try {
    const result = await paymentService.handlePayment(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const webhookHandler = async (req, res) => {
  try {
    await paymentService.webhookHandler(req);
    res.json({ received: true });
  } catch (error) {
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
};

module.exports = {
  createCheckoutSession,
  sendConfirmationEmail,
  retrieveSession,
  listPayments,
  getPaymentDetails,
  getCustomerEmail,
  getBalance,
  handlePayment,
  webhookHandler,
};
