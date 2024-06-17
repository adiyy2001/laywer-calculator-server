"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wiborRouter = void 0;
const express_1 = require("express");
const wiborService_1 = require("../services/wiborService");
const asyncHandler_1 = require("../utils/asyncHandler");
exports.wiborRouter = (0, express_1.Router)();
exports.wiborRouter.get('/fetch-wibor-rates', (0, asyncHandler_1.asyncHandler)(wiborService_1.fetchWiborRatesHandler));
