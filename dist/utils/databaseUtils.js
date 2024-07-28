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
exports.exportRatesToJSON = exports.getLatestRate = exports.getAllRates = exports.saveRatesToDatabase = exports.initDatabase = void 0;
const promise_1 = require("mysql2/promise");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
let pool;
const initDatabase = () => __awaiter(void 0, void 0, void 0, function* () {
    pool = yield (0, promise_1.createPool)({
        host: 'roundhouse.proxy.rlwy.net',
        user: 'root',
        password: 'OXhKSPlISeQkFbHEYhQlXxKPugTZnxia',
        database: 'railway',
        port: 50560,
        waitForConnections: true,
    });
    yield pool.query(`
    CREATE TABLE IF NOT EXISTS rates (
      id INT AUTO_INCREMENT PRIMARY KEY,
      date DATE NOT NULL,
      wibor3m text,
      wibor6m text
    )
  `);
});
exports.initDatabase = initDatabase;
const saveRatesToDatabase = (rates) => __awaiter(void 0, void 0, void 0, function* () {
    const connection = yield pool.getConnection();
    try {
        yield connection.beginTransaction();
        for (const rate of rates) {
            yield connection.query('INSERT INTO rates (date, wibor3m, wibor6m) VALUES (?, ?, ?)', [rate.date, rate.wibor3m, rate.wibor6m]);
        }
        yield connection.commit();
    }
    catch (error) {
        yield connection.rollback();
        throw error;
    }
    finally {
        connection.release();
    }
});
exports.saveRatesToDatabase = saveRatesToDatabase;
const getAllRates = () => __awaiter(void 0, void 0, void 0, function* () {
    const [rows] = yield pool.query('SELECT * FROM rates');
    return rows;
});
exports.getAllRates = getAllRates;
const getLatestRate = () => __awaiter(void 0, void 0, void 0, function* () {
    const [rows] = yield pool.query('SELECT * FROM rates ORDER BY date DESC LIMIT 1');
    return rows.length ? rows[0] : null;
});
exports.getLatestRate = getLatestRate;
const exportRatesToJSON = () => __awaiter(void 0, void 0, void 0, function* () {
    const [rows] = yield pool.query('SELECT * FROM rates');
    const filePath = path_1.default.join(__dirname, 'rates.json');
    fs_1.default.writeFileSync(filePath, JSON.stringify(rows, null, 2), 'utf-8');
    return filePath;
});
exports.exportRatesToJSON = exportRatesToJSON;
