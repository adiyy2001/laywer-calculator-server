"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const wiborRoutes_1 = require("./routes/wiborRoutes");
const excelRoutes_1 = require("./routes/excelRoutes");
const errorHandler_1 = require("./middleware/errorHandler");
const dotenv_1 = require("dotenv");
const http_1 = __importDefault(require("http"));
const compression_1 = __importDefault(require("compression"));
// Inicjalizacja środowiska
(0, dotenv_1.config)();
const app = (0, express_1.default)();
const port = process.env.PORT || 3001;
app.use((0, compression_1.default)());
// Opcje CORS
const corsOptions = {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"], // Allow specific headers
};
app.use(express_1.default.json({ limit: "1gb" }));
app.use(express_1.default.urlencoded({ limit: "1gb", extended: true }));
app.use((0, cors_1.default)(corsOptions));
// Użyj routerów
app.use("/api", wiborRoutes_1.wiborRouter);
app.use("/api", excelRoutes_1.excelRouter);
app.get("/api/test", (req, res) => {
    res.json({ message: "Test endpoint is working!" });
});
// Użyj middleware do obsługi błędów
app.use(errorHandler_1.errorHandler);
// Utworzenie serwera
const server = http_1.default.createServer(app);
server.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
