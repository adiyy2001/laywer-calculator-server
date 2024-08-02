import express from "express";
import cors from "cors";
import { wiborRouter } from "./routes/wiborRoutes";
import { excelRouter } from "./routes/excelRoutes";
import { errorHandler } from "./middleware/errorHandler";
import { config } from "dotenv";
import http from "http";
import compression from "compression";

// Inicjalizacja środowiska
config();

const app = express();
const port = process.env.PORT || 3001;
app.use(compression());

// Opcje CORS
const corsOptions = {
  origin: "*", // Allow all origins
  methods: ["GET", "POST", "PUT", "DELETE"], // Allow specific methods
  allowedHeaders: ["Content-Type", "Authorization"], // Allow specific headers
};

app.use(express.json({ limit: "1gb" }));
app.use(express.urlencoded({ limit: "1gb", extended: true }));
app.use(cors(corsOptions));

// Użyj routerów
app.use("/api", wiborRouter);
app.use("/api", excelRouter);

app.get("/api/test", (req, res) => {
  res.json({ message: "Test endpoint is working!" });
});

// Użyj middleware do obsługi błędów
app.use(errorHandler);

// Utworzenie serwera
const server = http.createServer(app);

server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
