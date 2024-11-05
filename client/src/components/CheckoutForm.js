import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, useStripe, useElements } from "@stripe/react-stripe-js";
import api from "../api";
import "./form.css";

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY);

const ReservationForm = () => {
  const [formData, setFormData] = useState({
    nom: "",
    email: "",
    telephone: "",
    dateReservation: "",
    heureReservation: "",
    nombrePersonnes: "",
    message: "",
    token: "",
  });

  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const prixParPersonne = 20;
  const totalPrix = formData.nombrePersonnes
    ? formData.nombrePersonnes * prixParPersonne
    : 0;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const {
      nom,
      email,
      telephone,
      dateReservation,
      heureReservation,
      nombrePersonnes,
      message,
    } = formData;

    if (
      !nom ||
      !email ||
      !telephone ||
      !dateReservation ||
      !heureReservation ||
      !nombrePersonnes
    ) {
      alert("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    try {
      const response = await api.post("/create-checkout-session", {
        nom,
        email,
        telephone,
        dateReservation,
        heureReservation,
        nombrePersonnes,
        message,
        totalPrix,
        token: process.env.APPUP_TOKEN,
      });

      const { sessionId } = response.data;
      const { error } = await stripe.redirectToCheckout({ sessionId });

      if (error) {
        console.error(
          "Erreur lors de la redirection vers le paiement :",
          error
        );
        navigate("/failure");
      }
    } catch (error) {
      console.error(
        "Erreur lors de la création de la session de paiement :",
        error
      );
      navigate("/failure");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        name="nom"
        value={formData.nom}
        onChange={handleChange}
        placeholder="Nom"
        required
      />
      <input
        type="email"
        name="email"
        value={formData.email}
        onChange={handleChange}
        placeholder="Email"
        required
      />
      <input
        type="tel"
        name="telephone"
        value={formData.telephone}
        onChange={handleChange}
        placeholder="Téléphone"
        required
      />
      <input
        type="date"
        name="dateReservation"
        value={formData.dateReservation}
        onChange={handleChange}
        required
      />
      <input
        type="time"
        name="heureReservation"
        value={formData.heureReservation}
        onChange={handleChange}
        required
      />
      <input
        type="number"
        name="nombrePersonnes"
        value={formData.nombrePersonnes}
        onChange={handleChange}
        placeholder="Nombre de personnes"
        required
      />
      <p>Prix par personne : ${prixParPersonne}</p>
      <p>Prix total : ${totalPrix}</p>
      <textarea
        name="message"
        value={formData.message}
        onChange={handleChange}
        placeholder="Message (optionnel)"
      />
      <button type="submit" disabled={!stripe || !elements}>
        Réserver
      </button>
    </form>
  );
};

const WrappedReservationForm = () => (
  <Elements stripe={stripePromise}>
    <ReservationForm />
  </Elements>
);

export default WrappedReservationForm;
