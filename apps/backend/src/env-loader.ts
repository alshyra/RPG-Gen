import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment-specific .env file based on NODE_ENV
const envFile = process.env.NODE_ENV === "docker" ? ".env.docker" : ".env.local";
const envPath = path.join(__dirname, "..", envFile);

dotenv.config({ path: envPath });
