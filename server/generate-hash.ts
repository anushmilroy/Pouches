import { hashPassword } from "./auth";

async function generateHash() {
  try {
    const hash = await hashPassword("admin123");
    console.log("Generated hash:", hash);
  } catch (error) {
    console.error("Error generating hash:", error);
  }
}

generateHash();
