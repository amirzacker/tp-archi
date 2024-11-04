import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import api from "../api";

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY);

const CheckoutForm = () => {
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    anneeNaissance: "", // Champ pour l'année de naissance
    ville: "",
    vehicule: "",
    token: "",
  });

  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { nom, prenom, anneeNaissance, ville, vehicule } = formData;

    // Vérifie si tous les champs obligatoires sont remplis
    if (!nom || !prenom || !anneeNaissance || !ville || !vehicule) {
      alert("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    // Calcule l'âge à partir de l'année de naissance
    const age = new Date().getFullYear() - parseInt(anneeNaissance);

    try {
      const response = await api.post("/create-checkout-session", {
        nom,
        prenom,
        age, // Utilise l'âge calculé
        ville,
        vehicule,
        token: process.env.APPUP_TOKEN,
      });

      const { sessionId } = response.data;
      const { error } = await stripe.redirectToCheckout({ sessionId });

      if (error) {
        console.error("Error redirecting to checkout:", error);
        navigate("/failure");
      }
    } catch (error) {
      console.error("Error creating checkout session:", error);
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
        type="text"
        name="prenom"
        value={formData.prenom}
        onChange={handleChange}
        placeholder="Prénom"
        required
      />
      <input
        type="number"
        name="anneeNaissance" // Champ pour l'année de naissance
        value={formData.anneeNaissance}
        onChange={handleChange}
        placeholder="Année de naissance"
        required
      />
      <select
        name="ville"
        value={formData.ville}
        onChange={handleChange}
        required
      >
        <option value="">Ville de location</option>
        <option value="Paris">Paris</option>
        <option value="Lyon">Lyon</option>
        <option value="Marseille">Marseille</option>
      </select>
      <select
        name="vehicule"
        value={formData.vehicule}
        onChange={handleChange}
        required
      >
        <option value="">Véhicule à louer</option>
        <option value="Aston Martin">Aston Martin</option>
        <option value="Bentley">Bentley</option>
        <option value="Cadillac">Cadillac</option>
        <option value="Ferrari">Ferrari</option>
        <option value="Jaguar">Jaguar</option>
      </select>
      <button type="submit" disabled={!stripe || !elements}>
        Payer
      </button>
    </form>
  );
};

const WrappedCheckoutForm = () => (
  <Elements stripe={stripePromise}>
    <CheckoutForm />
  </Elements>
);

export default WrappedCheckoutForm;
