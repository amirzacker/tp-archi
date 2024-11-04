import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api";

const Dashboard = () => {
  const [payments, setPayments] = useState([]);
  const [balance, setBalance] = useState(0); // État pour stocker le solde du compte Stripe

  useEffect(() => {
    const fetchPayments = async () => {
      const response = await api.get("/list-payments");
      setPayments(response.data);
    };

    const fetchBalance = async () => {
      const response = await api.get("/get-balance"); // Endpoint à créer côté serveur pour récupérer le solde
      setBalance(response.data.balance);
    };

    fetchPayments();
    fetchBalance();
  }, []);

  console.log(payments);

  const getPaymentStatusIcon = (status) => {
    switch (status) {
      case "succeeded":
        return "✔️"; // Icône pour les paiements réussis
      case "pending":
        return "..."; // Icône pour les paiements en attente
      case "failed":
        return "❌"; // Icône pour les paiements échoués
      case "requires_capture":
        return "⌛"; // Icône pour les paiements échoués
      default:
        return "";
    }
  };

  return (
    <div>
      <h2>Tableau de bord des paiements</h2>
      <p>Solde du compte Stripe: {balance}€</p>
      <ul>
        {payments.map((payment) => (
          <li key={payment.id}>
            <Link to={`/payment/${payment.id}`}>
              {getPaymentStatusIcon(payment.status)}{" "}
              {/* Affichage de l'icône en fonction de l'état du paiement */}
              {payment.metadata.nom} {payment.metadata.prenom} -{" "}
              {payment.amount_total / 100}€
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Dashboard;
