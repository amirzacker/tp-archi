const SibApiV3Sdk = require("sib-api-v3-sdk");
const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications["api-key"];
apiKey.apiKey = process.env.BREVO_API_KEY;

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

const sendConfirmationEmail = async (data) => {
  const {
    name,
    email,
    amount,
    card_last4,
    transaction_id,
    restaurantName,
    reservationDate,
    numberOfGuests,
  } = data;

  // Create the email content
  const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
  sendSmtpEmail.sender = {
    name: "Restaurant Reservation System",
    email: process.env.BREVO_USER,
  };

  sendSmtpEmail.to = [{ email, name }];
  sendSmtpEmail.subject = "Reservation Payment Confirmation";
  sendSmtpEmail.htmlContent = `
    <h2>Thank you for your payment.</h2>
    <p>Reservation Details:</p>
    <ul>
      <li>Name: ${name}</li>
      <li>Restaurant: ${restaurantName}</li>
      <li>Date: ${new Date(reservationDate).toLocaleString()}</li>
      <li>Number of Guests: ${numberOfGuests}</li>
      <li>Email: ${email}</li>
      <li>Payment Amount: €${amount}</li>
      <li>Payment made with card ending in: ${card_last4}</li>
      <li>Transaction ID: ${transaction_id}</li>
    </ul>
  `;
  // Send the email
  await apiInstance.sendTransacEmail(sendSmtpEmail);
};

module.exports = {
  sendConfirmationEmail,
};
