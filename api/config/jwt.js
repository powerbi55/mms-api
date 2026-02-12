// config/jwt.js
console.log("=" .repeat(50));
console.log("🔑 JWT CONFIG LOADED");
console.log("🔑 JWT_SECRET exists:", !!process.env.JWT_SECRET);
console.log("🔑 JWT_SECRET length:", process.env.JWT_SECRET?.length);
console.log("🔑 JWT_SECRET value:", process.env.JWT_SECRET); // แสดงค่าจริงเพื่อ debug
console.log("=" .repeat(50));

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is missing");
}

module.exports = {
  secret: process.env.JWT_SECRET,
  expiresIn: '1d'
};