import bcrypt from "bcryptjs";

async function generarHash() {
  const hash = await bcrypt.hash("Demo1234*", 10);
  console.log("--- HASH GENERADO ---");
  console.log(hash);
  console.log("---------------------");
}

generarHash();
