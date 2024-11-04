const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
require("dotenv").config();

const paymentRoutes = require("./routes/paymentRoutes");
const { connectDB } = require("./config/database");
const paymentController = require("./controllers/paymentController");

const app = express();
const port = process.env.PORT || 3001;

// Connect to the database
connectDB();

// Pour la route webhook, utiliser le corps brut avant bodyParser
app.post(
  "/payments/webhook",
  bodyParser.raw({ type: "application/json" }),
  paymentController.webhookHandler
);

app.use(cors());
app.use(bodyParser.json());
app.use(express.json());

// Use payment routes
app.use("/payments", paymentRoutes);

app.listen(port, () => console.log(`Server running on port ${port}`));
