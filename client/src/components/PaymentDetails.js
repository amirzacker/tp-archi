import React, { useState, useEffect } from "react";
import api from "../api";
import { useParams } from "react-router-dom";

const PaymentDetails = () => {
  const { id } = useParams();
  const [payment, setPayment] = useState(null);
  const [customerEmail, setCustomerEmail] = useState(null);
  const [captureAmount, setCaptureAmount] = useState(""); // État pour stocker le montant à capturer

  useEffect(() => {
    const fetchPayment = async () => {
      try {
        const response = await api.get(`/payment/${id}`);
        setPayment(response.data);

        const customerId = response.data.customer;
        if (customerId && customerId !== "null") {
          const customerResponse = await api.get(`/customer/${customerId}`);
          setCustomerEmail(customerResponse.data.email);
        } else {
          setCustomerEmail("Client inconnu");
        }
      } catch (error) {
        console.error("Error fetching payment details:", error);
      }
    };

    fetchPayment();
  }, [id]);

  const handleAction = async (action, amount) => {
    try {
      if (payment && payment.id) {
        const response = await api.post("/handle-payment", {
          action,
          paymentIntentId: payment.id,
          amount: amount ? parseInt(amount) * 100 : payment.amount, // Convertir en centimes
        });
        setPayment(response.data);
      } else {
        throw new Error("Invalid payment ID");
      }
    } catch (error) {
      console.error("Error handling payment:", error);
    }
  };

  const handlePartialCapture = () => {
    handleAction("capture", captureAmount);
  };

  const handleFullCapture = () => {
    handleAction("capture");
  };

  return (
    <div>
      {payment ? (
        <div>
          <ul>
            <li>Nom: {payment.metadata.nom}</li>
            <li>Prénom: {payment.metadata.prenom}</li>
            <li>Âge: {payment.metadata.age}</li>
            <li>Ville: {payment.metadata.ville}</li>
            <li>Véhicule: {payment.metadata.vehicule}</li>
            <li>Montant: {payment.amount / 100}€</li>
            <li>Email du client: {customerEmail}</li>
            <li>Status du paiment: {payment.status}</li>
          </ul>
          {payment.status === "requires_capture" && (
            <div>
              <input
                type="number"
                placeholder="Montant à capturer"
                value={captureAmount}
                onChange={(e) => setCaptureAmount(e.target.value)}
              />
              <button onClick={handlePartialCapture}>
                Capturer Partiellement
              </button>
              <button onClick={handleFullCapture}>
                Capturer Intégralement
              </button>
              <button onClick={() => handleAction("release")}>Libérer</button>
            </div>
          )}
        </div>
      ) : (
        <p>Chargement des détails...</p>
      )}
    </div>
  );
};

export default PaymentDetails;
