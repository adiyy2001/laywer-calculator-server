"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
const databaseUtils_1 = require("./utils/databaseUtils");
const compression_1 = __importDefault(require("compression"));
(0, dotenv_1.config)();
const app = (0, express_1.default)();
const port = process.env.PORT || 3001;
app.use((0, compression_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: "500mb" }));
(0, databaseUtils_1.initDatabase)()
    .then(() => {
    console.log("Database initialized");
    app.use("/api", wiborRoutes_1.wiborRouter);
    app.use("/api", excelRoutes_1.excelRouter);
    app.get("/api/test", (req, res) => {
        res.json({ message: "Test endpoint is working!" });
    });
    app.use(errorHandler_1.errorHandler);
    const server = http_1.default.createServer(app);
    server.listen(port, () => __awaiter(void 0, void 0, void 0, function* () {
        console.log(`Server is running on http://localhost:${port}`);
    }));
})
    .catch((error) => {
    console.error("Failed to initialize database:", error);
});
