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
const puppeteer_1 = __importDefault(require("puppeteer"));
const config_1 = require("../config");
const protocolTimeout = 30000; // Ustal timeout protokołu na 300 sekund (5 minut)
const fetchWiborRates = (startDate) => __awaiter(void 0, void 0, void 0, function* () {
    let browser = null;
    try {
        console.log('Launching browser...', process.env.NODE_ENV);
        browser = yield puppeteer_1.default.launch({
            args: [
                '--disable-setuid-sandbox',
                '--no-sandbox',
                '--single-process',
                '--no-zygote',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu'
            ],
            headless: true,
            timeout: protocolTimeout,
            defaultViewport: null
        });
        if (startDate.getDay() === 5) {
            startDate = getNextBusinessDay(startDate);
        }
        const endDate = new Date();
        const ratesList = [];
        const datesToFetch = getBusinessDates(startDate, endDate);
        const page = yield browser.newPage();
        yield page.goto(config_1.WIBOR_URL, { waitUntil: 'networkidle2', timeout: 30000 });
        for (const date of datesToFetch) {
            try {
                const rates = yield getRatesForDate(page, date);
                if (rates && rates.wibor3m && rates.wibor6m) {
                    ratesList.push(rates);
                }
            }
            catch (error) {
                console.error(`Error fetching rates for date ${date}:`, error);
            }
        }
        yield page.close();
        return ratesList;
    }
    catch (error) {
        console.error('Error fetching WIBOR rates:', error);
        throw error;
    }
    finally {
        if (browser) {
            console.log('Closing browser...');
            yield browser.close();
            console.log('Closed browser...');
        }
    }
});
exports.fetchWiborRates = fetchWiborRates;
const getNextBusinessDay = (date) => {
    const nextDay = new Date(date);
    nextDay.setDate(date.getDate() + (date.getDay() === 5 ? 3 : 1));
    return nextDay;
};
const getRatesForDate = (page, date) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log(`Setting date: ${date}...`);
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
        console.log(`Waiting for results...`);
        yield page.waitForSelector('.summaryTable', { timeout: 10000 });
        const rates = yield page.evaluate((date) => {
            const summaryTable = document.querySelector('.summaryTable');
            if (!summaryTable) {
                console.log(`No summary table found for date: ${date}`);
                return null;
            }
            const rows = summaryTable.querySelectorAll('tr');
            let wibor3m = '';
            let wibor6m = '';
            rows.forEach((row) => {
                var _a, _b;
                const cells = row.querySelectorAll('td');
                if (cells.length > 1) {
                    const label = ((_a = cells[0].textContent) === null || _a === void 0 ? void 0 : _a.trim()) || '';
                    let value = ((_b = cells[1].textContent) === null || _b === void 0 ? void 0 : _b.trim()) || '';
                    value = value.split('\n')[0].trim();
                    if (label.includes('WIBOR 3M')) {
                        wibor3m = value;
                    }
                    if (label.includes('WIBOR 6M')) {
                        wibor6m = value;
                    }
                }
            });
            return wibor3m && wibor6m ? { date, wibor3m, wibor6m } : null;
        }, date);
        console.log(`Fetched rates for date: ${date} - 3M: ${rates === null || rates === void 0 ? void 0 : rates.wibor3m}, 6M: ${rates === null || rates === void 0 ? void 0 : rates.wibor6m}`);
        return rates;
    }
    catch (error) {
        if (error.message.includes('Timeout')) {
            console.warn(`Timeout error occurred but skipped for date: ${date}`);
            return null;
        }
        console.error(`Error fetching rates for date ${date}:`, error);
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
