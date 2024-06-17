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
exports.fetchWiborRates = void 0;
const puppeteer_core_1 = __importDefault(require("puppeteer-core"));
const chromium_1 = __importDefault(require("@sparticuz/chromium"));
const config_1 = require("../config");
const fetchWiborRates = (startDateString) => __awaiter(void 0, void 0, void 0, function* () {
    let browser = null;
    try {
        browser = yield puppeteer_core_1.default.launch({
            args: chromium_1.default.args,
            defaultViewport: chromium_1.default.defaultViewport,
            executablePath: yield chromium_1.default.executablePath(),
            headless: chromium_1.default.headless,
            ignoreHTTPSErrors: true,
        });
        const page = yield browser.newPage();
        yield page.goto(config_1.WIBOR_URL, { waitUntil: 'networkidle2' });
        const startDate = new Date(startDateString);
        const endDate = new Date();
        const ratesList = [];
        const datesToFetch = getBusinessDates(startDate, endDate);
        const ratePromises = datesToFetch.map((date) => getRatesForDate(page, date));
        const ratesResults = yield Promise.all(ratePromises);
        ratesResults.forEach((rates) => {
            if (rates) {
                ratesList.push(rates);
            }
        });
        return ratesList;
    }
    catch (error) {
        console.error('Error fetching WIBOR rates:', error);
        throw error;
    }
    finally {
        if (browser) {
            yield browser.close();
        }
    }
});
exports.fetchWiborRates = fetchWiborRates;
const getRatesForDate = (page, date) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`Fetching rates for date: ${date}`);
    try {
        yield page.evaluate((date) => {
            const dateInput = document.querySelector('#rateDate');
            const submitButton = document.querySelector('#rateDatePickerSubmit');
            if (dateInput && submitButton) {
                dateInput.value = date;
                submitButton.click();
            }
            else {
                console.error('Date input or submit button not found on the page');
            }
        }, date);
        yield page.waitForNavigation({ waitUntil: 'networkidle2' });
        yield page.waitForSelector('.summaryTable', { timeout: 10000 });
        const rates = yield page.evaluate((date) => {
            const rows = document.querySelectorAll('.summaryTable tr');
            let wibor3m = '';
            let wibor6m = '';
            rows.forEach((row) => {
                var _a, _b;
                const cells = row.querySelectorAll('td');
                if (cells.length > 1) {
                    const label = ((_a = cells[0].textContent) === null || _a === void 0 ? void 0 : _a.trim()) || '';
                    const value = ((_b = cells[1].textContent) === null || _b === void 0 ? void 0 : _b.trim()) || '';
                    const cleanedValue = value.split('\n')[0].trim();
                    if (label === 'WIBOR 3M') {
                        wibor3m = cleanedValue;
                    }
                    if (label === 'WIBOR 6M') {
                        wibor6m = cleanedValue;
                    }
                }
            });
            return wibor3m && wibor6m ? { date, wibor3m, wibor6m } : null;
        }, date);
        console.log(`Fetched rates for date: ${date} - 3M: ${rates === null || rates === void 0 ? void 0 : rates.wibor3m}, 6M: ${rates === null || rates === void 0 ? void 0 : rates.wibor6m}`);
        return rates;
    }
    catch (error) {
        console.error(`Error fetching rates for date: ${date}`, error);
        return null;
    }
});
const getBusinessDates = (startDate, endDate) => {
    const dates = [];
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
        const day = currentDate.getDay();
        if (day !== 0 && day !== 6) {
            dates.push(currentDate.toISOString().split('T')[0]);
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
};
