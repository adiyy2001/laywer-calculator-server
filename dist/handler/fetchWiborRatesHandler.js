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
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchWiborRatesHandler = void 0;
const puppeteerUtils_1 = require("../utils/puppeteerUtils");
const databaseUtils_1 = require("../utils/databaseUtils");
const defaultDateString = "2024-06-30";
const fetchWiborRatesHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const startDate = req.body.startDate
        ? new Date(req.body.startDate)
        : new Date(defaultDateString);
    try {
        const rates = yield (0, puppeteerUtils_1.fetchWiborRates)(startDate);
        yield (0, databaseUtils_1.saveRatesToDatabase)(rates);
        res.json(rates);
    }
    catch (error) {
        next(error);
    }
});
exports.fetchWiborRatesHandler = fetchWiborRatesHandler;
