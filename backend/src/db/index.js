import mongoose from "mongoose";
import { DB_NAME } from "../../constants.js";

export const connectDB = async () => {
  // Disable query buffering so operations fail fast if DB connection fails
  mongoose.set("bufferCommands", false);

  try {
    let mongoUri = (process.env.MONGO_URI || "mongodb://127.0.0.1:27017").trim();
    let connectionString = mongoUri;

    try {
      const parsedUrl = new URL(mongoUri);
      if (!parsedUrl.pathname || parsedUrl.pathname === "/") {
        parsedUrl.pathname = `/${DB_NAME}`;
      }
      if (!parsedUrl.search && parsedUrl.protocol === "mongodb+srv:") {
        parsedUrl.search = "?retryWrites=true&w=majority";
      }
      connectionString = parsedUrl.toString();
    } catch {
      connectionString = `${mongoUri.replace(/\/+$/, "")}/${DB_NAME}`;
    }

    const connectionInstance = await mongoose.connect(connectionString, {
      serverSelectionTimeoutMS: 10000, // 10s timeout for remote cloud Atlas DNS/TLS negotiation
    });
    console.log(`[MongoDB] Connected successfully to cloud/cluster! Host: ${connectionInstance.connection.host}`);
    return connectionInstance;
  } catch (error) {
    console.warn(`[MongoDB] Database connection error (${error.message}). Operating in resilient in-memory fallback mode.`);
    return null;
  }
};

export default connectDB;
