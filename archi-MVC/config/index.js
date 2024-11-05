module.exports = {
  port: process.env.PORT || 3001,
  mongoUri: process.env.MONGODB_URI,
  secretJwtToken: process.env.SECRET_JWT_TOKEN,
  ADMIN_COOKIE_PASSWORD: process.env.ADMIN_COOKIE_PASSWORD,
  SESSION_SECRET: process.env.SESSION_SECRET,
  ADMIN_COOKIE_NAME: process.env.ADMIN_COOKIE_NAME,
  ADMIN_EMAIL: process.env.ADMIN_EMAIL,
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
};
