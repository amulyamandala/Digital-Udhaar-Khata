const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  try {
    const token = req.cookies?.token || req.headers?.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Authentication token is required" });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET || "secret_key");
    req.user = decodedToken;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired, please login again" });
    }
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

module.exports = { verifyToken };