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
const fetchWiborRatesHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const startDateString = req.query.startDate;
    if (!startDateString) {
        return res.status(400).send('Start date is required');
    }
    try {
        const rates = yield (0, puppeteerUtils_1.fetchWiborRates)(startDateString);
        res.json(rates);
    }
    catch (error) {
        next(error);
    }
});
exports.fetchWiborRatesHandler = fetchWiborRatesHandler;
