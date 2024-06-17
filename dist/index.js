"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const wiborRoutes_1 = require("./routes/wiborRoutes");
const errorHandler_1 = require("./middleware/errorHandler");
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
const app = (0, express_1.default)();
const port = process.env.PORT || 3001;
app.use(express_1.default.json());
app.use('/api', wiborRoutes_1.wiborRouter);
// Testowy endpoint do sprawdzenia
app.get('/api/test', (req, res) => {
    res.json({ message: 'Test endpoint is working!' });
});
app.use(errorHandler_1.errorHandler);
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
