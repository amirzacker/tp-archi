import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import api from "../api";
import { useNavigate } from "react-router-dom";

const SuccessPage = () => {
  const location = useLocation();
  const [details, setDetails] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const sessionId = query.get("session_id");

    const fetchDetails = async () => {
      const response = await api.get("/retrieve-session", {
        params: { session_id: sessionId },
      });
      setDetails(response.data);
    };

    if (sessionId) {
      fetchDetails();
    }
  }, [location]);

  const handleSendEmail = async () => {
    if (details) {
      await api.post("/send-confirmation-email", details);
      alert("Email de confirmation envoyé !");
      navigate("/");
    }
  };

  return (
    <div>
      {details ? (
        <div>
          <h2>Merci pour votre paiement.</h2>
          <p>Récapitulatif</p>
          <ul>
            <li>
              Conducteur : {details.nom} {details.prenom} {details.age} ans
            </li>
            <li>Véhicule : {details.vehicule}</li>
            <li>Ville : {details.ville}</li>
            <li>Email : {details.email}</li>
            <li>Montant du dépôt de garantie : {details.amount}€</li>
            <li>
              Versement réalisé avec une carte bancaire se terminant par :{" "}
              {details.card_last4}
            </li>
            <li>Numéro de transaction : {details.transaction_id}</li>
          </ul>
          <button onClick={handleSendEmail}>
            Recevoir une confirmation par mail
          </button>
        </div>
      ) : (
        <p>Chargement des détails...</p>
      )}
    </div>
  );
};

export default SuccessPage;
