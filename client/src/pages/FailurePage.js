import React from 'react';
import { Link } from 'react-router-dom';

const FailurePage = () => {
  return (
    <div>
      <h1>Échec du paiement</h1>
      <p>Nous sommes désolés, votre paiement n'a pas pu être traité. Veuillez réessayer.</p>
      <Link to="/">Retour à l'accueil</Link>
    </div>
  );
};

export default FailurePage;
