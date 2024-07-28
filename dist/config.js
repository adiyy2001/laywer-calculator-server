"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WIBOR_URL = exports.PORT = void 0;
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
exports.PORT = process.env.PORT || 3001;
exports.WIBOR_URL = process.env.WIBOR_URL || 'https://www.bankier.pl/mieszkaniowe/stopy-procentowe/wibor';
