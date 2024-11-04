const Stripe = require("stripe");
const jwt = require("jsonwebtoken");
const Payment = require("../models/paymentModel");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const createCheckoutSession = async (data) => {
  const { token, name, email, restaurantId, reservationDate, numberOfGuests } =
    data;

  // Create a JWT containing reservation details
  const reservationDataJwt = jwt.sign(
    { name, email, restaurantId, reservationDate, numberOfGuests, token },
    process.env.JWT_SECRET_KEY
  );

  // Create a Stripe Checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "eur",
          product_data: {
            name: "Reservation Payment",
          },
          unit_amount: 5000, // Example: €50 reservation fee
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    payment_intent_data: {
      capture_method: "manual",
      setup_future_usage: "off_session",
    },
    metadata: {
      name,
      email,
      restaurantId,
      reservationDate,
      numberOfGuests,
      reservationDataJwt,
      token,
    },
    customer_creation: "always",
    success_url: `${process.env.CLIENT_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.CLIENT_URL}/`,
  });

  // Save initial payment data to the database
  const payment = new Payment({
    name,
    email,
    restaurantId,
    reservationDate,
    numberOfGuests,
    amount: session.amount_total / 100,
    transactionId: session.id,
    paymentStatus: "Pending",
  });
  await payment.save();

  return session;
};

const retrieveSession = async (sessionId) => {
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  const paymentIntent = await stripe.paymentIntents.retrieve(
    session.payment_intent
  );
  const paymentMethod = await stripe.paymentMethods.retrieve(
    paymentIntent.payment_method
  );

  const metadata = session.metadata;

  // Decrypt the JWT to get the reservation data
  const reservationData = jwt.verify(
    metadata.reservationDataJwt,
    process.env.JWT_SECRET_KEY
  );

  // Update payment status in the database
  await Payment.findOneAndUpdate(
    { transactionId: sessionId },
    { paymentStatus: "Completed" }
  );

  const details = {
    name: reservationData.name,
    email: reservationData.email,
    restaurantId: reservationData.restaurantId,
    reservationDate: reservationData.reservationDate,
    numberOfGuests: reservationData.numberOfGuests,
    amount: session.amount_total / 100,
    card_last4: paymentMethod.card.last4,
    transaction_id: session.id,
  };

  return details;
};

const listPayments = async () => {
  // Retrieve payments from the database
  const payments = await Payment.find();
  return payments;
};

const getPaymentDetails = async (paymentId) => {
  const payment = await Payment.findById(paymentId);
  return payment;
};

const getCustomerEmail = async (customerId) => {
  if (!customerId || customerId === "null") {
    throw new Error("Customer ID is missing or invalid");
  }
  const customer = await stripe.customers.retrieve(customerId);
  return customer.email;
};

const getBalance = async () => {
  const balance = await stripe.balance.retrieve();
  return balance.available[0].amount; // Retourne le solde disponible
};

const handlePayment = async (data) => {
  const { action, paymentIntentId, amount } = data;

  if (!paymentIntentId || !action) {
    throw new Error("Missing required parameters");
  }

  let paymentIntent;
  if (action === "capture") {
    paymentIntent = await stripe.paymentIntents.capture(paymentIntentId, {
      amount_to_capture: amount, // Utiliser le montant personnalisé
    });
  } else if (action === "release") {
    paymentIntent = await stripe.paymentIntents.cancel(paymentIntentId);
  } else {
    throw new Error("Invalid action");
  }

  return paymentIntent;
};

const webhookHandler = async (req) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body, // Utiliser le corps brut
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    throw new Error(`Webhook Error: ${err.message}`);
  }

  // Traitement des événements
  if (event.type === "payment_intent.captured") {
    const paymentIntent = event.data.object;
    const { reservationDataJwt } = paymentIntent.metadata;
    const reservationData = jwt.verify(
      reservationDataJwt,
      process.env.JWT_SECRET_KEY
    );

    // Mise à jour du statut du paiement dans la base de données
    await Payment.findOneAndUpdate(
      { transactionId: paymentIntent.id },
      { paymentStatus: "Captured" }
    );

    // Vous pouvez ajouter une logique pour envoyer un email de confirmation
  }

  if (event.type === "payment_intent.canceled") {
    const paymentIntent = event.data.object;
    const { reservationDataJwt } = paymentIntent.metadata;
    const reservationData = jwt.verify(
      reservationDataJwt,
      process.env.JWT_SECRET_KEY
    );

    // Mise à jour du statut du paiement dans la base de données
    await Payment.findOneAndUpdate(
      { transactionId: paymentIntent.id },
      { paymentStatus: "Canceled" }
    );
  }
  return;
};
module.exports = {
  createCheckoutSession,
  retrieveSession,
  listPayments,
  getPaymentDetails,
  getCustomerEmail,
  getBalance,
  handlePayment,
  webhookHandler,
};
