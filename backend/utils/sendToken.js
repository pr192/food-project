const jwt = require("jsonwebtoken");

const sendToken = (user, statusCode, res) => {

  const token = user.getJWTToken();

  const isProduction = process.env.NODE_ENV === "PRODUCTION";

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_EXPIRES_TIME * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    // In production the frontend and backend live on different domains
    // (e.g. vercel.app and onrender.com), so the cookie must be marked
    // SameSite=None; Secure for the browser to send it on cross-site
    // requests. Locally (same-origin via the Vite proxy) this isn't needed.
    sameSite: isProduction ? "none" : "lax",
    secure: isProduction,
  };

  res.cookie("jwt", token, cookieOptions);

  user.password = undefined;

  res.status(statusCode).json({
    success: true,
    token,
    data: { user },
  });
};

module.exports = sendToken;