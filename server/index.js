const express = require("express");
const bodyParser = require("body-parser");
const Stripe = require("stripe");
const jwt = require("jsonwebtoken");
const SibApiV3Sdk = require("sib-api-v3-sdk");
const cors = require("cors");
require("dotenv").config();

const app = express();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const port = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());

// Endpoint to create a Stripe Checkout session
app.post("/create-checkout-session", async (req, res) => {
  const { token, nom, prenom, age, ville, vehicule } = req.body;

  try {
    // Créer un JWT contenant toutes les informations du formulaire
    const formDataJwt = jwt.sign(
      {
        nom,
        prenom,
        age,
        ville,
        vehicule,
        token,
      },
      process.env.JWT_SECRET_KEY // Utilise ta clé secrète pour le JWT
    );

    // Créer une session de paiement Stripe Checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: "Dépôt de garantie location voiture",
            },
            unit_amount: 500000,
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
        nom: nom,
        prenom: prenom,
        age: age,
        ville: ville,
        vehicule: vehicule,
        formDataJwt: formDataJwt, // Ajouter le JWT dans les métadonnées
        token: token,
      },
      customer_creation: "always",
      success_url: `${process.env.CLIENT_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/`,
    });

    res.json({ sessionId: session.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Configuration de l'API Brevo (Sendinblue)
const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications["api-key"];
apiKey.apiKey = process.env.BREVO_API_KEY;

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

app.post("/send-confirmation-email", async (req, res) => {
  const {
    nom,
    prenom,
    age,
    ville,
    vehicule,
    email,
    amount,
    card_last4,
    transaction_id,
  } = req.body;

  try {
    // Vérifiez que tous les champs nécessaires sont présents
    if (
      !nom ||
      !prenom ||
      !email ||
      !amount ||
      !card_last4 ||
      !transaction_id
    ) {
      throw new Error("Missing required fields");
    }

    // Création de l'email à envoyer
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.sender = {
      name: "Luxury Car Rental",
      email: process.env.BREVO_USER,
    };
    sendSmtpEmail.to = [{ email: email, name: `${prenom} ${nom}` }];
    sendSmtpEmail.subject = "Confirmation de paiement";
    sendSmtpEmail.htmlContent = `
      <h2>Merci pour votre paiement.</h2>
      <p>Récapitulatif</p>
      <ul>
        <li>Conducteur : ${nom} ${prenom} ${age} ans</li>
        <li>Véhicule : ${vehicule}</li>
        <li>Ville : ${ville}</li>
        <li>Email : ${email}</li>
        <li>Montant du dépôt de garantie : ${amount}€</li>
        <li>Versement réalisé avec une carte bancaire se terminant par : ${card_last4}</li>
        <li>Numéro de transaction : ${transaction_id}</li>
      </ul>
    `;

    // Envoi de l'email
    const response = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log("Email sent successfully:", response);
    res.status(200).json({ message: "Email sent successfully" });
  } catch (error) {
    console.error(
      "Error sending email:",
      error.response ? error.response.text : error.message
    );
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to retrieve session details
app.get("/retrieve-session", async (req, res) => {
  const { session_id } = req.query;

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);

    console.log(session);

    const paymentIntent = await stripe.paymentIntents.retrieve(
      session.payment_intent
    );

    const paymentMethod = await stripe.paymentMethods.retrieve(
      paymentIntent.payment_method
    );

    const metadata = session.metadata;

    // Décrypter le JWT pour obtenir les informations du formulaire
    const formData = jwt.verify(
      metadata.formDataJwt,
      process.env.JWT_SECRET_KEY
    );

    const details = {
      nom: formData.nom,
      prenom: formData.prenom,
      age: formData.age,
      ville: formData.ville,
      vehicule: formData.vehicule,
      email: session.customer_details.email,
      amount: session.amount_total / 100,
      card_last4: paymentMethod.card.last4,
      transaction_id: session.id,
    };

    res.json(details);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to list payments for the dashboard
app.get("/list-payments", async (req, res) => {
  try {
    const payments = await stripe.checkout.sessions.list({
      limit: 100,
    });
    res.json(payments.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to handle Stripe webhooks
app.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handling successful payment intent capture
    if (event.type === "payment_intent.captured") {
      const paymentIntent = event.data.object;

      // Retrieve metadata from payment intent
      const { formDataJwt } = paymentIntent.metadata;

      // Decrypt the JWT to get user data
      const formData = jwt.verify(formDataJwt, process.env.JWT_SECRET_KEY);

      // Calculate the captured amount in euros
      const capturedAmount = paymentIntent.amount_received / 100;
      const totalAmount = paymentIntent.amount / 100;

      // Determine user status based on captured amount
      let userStatus;
      if (capturedAmount < totalAmount / 2) {
        userStatus = "moyen";
      } else if (capturedAmount > totalAmount / 2) {
        userStatus = "banni";
      } else {
        userStatus = "certifiés";
      }

      // Send email to user
      await sendEmail(formData, capturedAmount, userStatus, paymentIntent.id);
    }

    // Handling payment intent cancellation
    if (event.type === "payment_intent.canceled") {
      const paymentIntent = event.data.object;

      // Retrieve metadata from payment intent
      const { formDataJwt } = paymentIntent.metadata;

      // Decrypt the JWT to get user data
      const formData = jwt.verify(formDataJwt, process.env.JWT_SECRET_KEY);

      // Send email to user
      await sendEmail(formData, 0, "certifiés", paymentIntent.id);
    }

    res.json({ received: true });
  }
);

// Helper function to send email via Brevo
const sendEmail = async (formData, amount, userStatus, transactionId) => {
  const { nom, prenom, ville, vehicule, email } = formData;

  const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
  sendSmtpEmail.sender = {
    name: "Luxury Car Rental",
    email: process.env.BREVO_USER,
  };
  sendSmtpEmail.to = [{ email: email, name: `${prenom} ${nom}` }];
  sendSmtpEmail.subject = "Notification de paiement";
  sendSmtpEmail.htmlContent = `
      <p>Bonjour ${nom} ${prenom},</p>
      <p>Merci pour votre location de votre ${vehicule} à ${ville}.</p>
      <p>Nous vous informons que nous avons ${
        amount === 0 ? "libéré" : "capturé"
      } votre caution ${amount !== 0 ? "de " + amount + "€" : ""}.</p>
      <p>Référence unique : ${transactionId}</p>
      <p>Merci pour votre confiance.</p>
    `;

  try {
    const response = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log("Email sent successfully:", response);
  } catch (error) {
    console.error(
      "Error sending email:",
      error.response ? error.response.text : error.message
    );
  }
};

// Endpoint to handle capture and release of payment intents
app.post("/handle-payment", async (req, res) => {
  const { action, paymentIntentId, amount } = req.body;

  try {
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

    res.json(paymentIntent);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint pour récupérer le solde du compte Stripe
app.get("/get-balance", async (req, res) => {
  try {
    const balance = await stripe.balance.retrieve();
    res.json({ balance: balance.available[0].amount }); // Renvoie le solde disponible
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to get payment details
app.get("/payment/:paymentId", async (req, res) => {
  try {
    const payment = await stripe.paymentIntents.retrieve(req.params.paymentId);
    console.log(payment);
    res.json(payment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint pour récupérer l'email du client à partir de customer_id
app.get("/customer/:customerId", async (req, res) => {
  try {
    const customerId = req.params.customerId;
    if (!customerId || customerId === "null") {
      throw new Error("Customer ID is missing or invalid");
    }
    const customer = await stripe.customers.retrieve(customerId);
    console.log(customer);
    res.json({ email: customer.email });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Ajouter cette route pour récupérer l'email du client en fonction de l'ID du client
app.get("/customer/:customerId", async (req, res) => {
  try {
    const customer = await stripe.customers.retrieve(req.params.customerId);
    res.json({ email: customer.email });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => console.log(`Server running on port ${port}`));
