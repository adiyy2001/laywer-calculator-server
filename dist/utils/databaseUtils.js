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
exports.exportRatesToJSON = exports.getLatestRate = exports.getAllRates = exports.saveRatesToDatabase = void 0;
const datastore_1 = require("./datastore");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const kind = "rates";
// Funkcja do zapisywania danych
const saveRatesToDatabase = (rates) => __awaiter(void 0, void 0, void 0, function* () {
    const entities = rates.map((rate) => {
        return {
            key: datastore_1.datastore.key([kind, rate.date]),
            data: {
                date: rate.date,
                wibor3m: rate.wibor3m,
                wibor6m: rate.wibor6m,
            },
        };
    });
    yield datastore_1.datastore.save(entities);
});
exports.saveRatesToDatabase = saveRatesToDatabase;
// Funkcja do pobierania wszystkich danych
const getAllRates = () => __awaiter(void 0, void 0, void 0, function* () {
    const query = datastore_1.datastore.createQuery(kind);
    const [entities] = yield datastore_1.datastore.runQuery(query);
    return entities.map((entity) => ({
        date: entity.date,
        wibor3m: entity.wibor3m,
        wibor6m: entity.wibor6m,
    }));
});
exports.getAllRates = getAllRates;
// Funkcja do pobierania najnowszego wpisu
const getLatestRate = () => __awaiter(void 0, void 0, void 0, function* () {
    const query = datastore_1.datastore
        .createQuery(kind)
        .order("date", { descending: true })
        .limit(1);
    const [entities] = yield datastore_1.datastore.runQuery(query);
    return entities.length ? entities[0] : null;
});
exports.getLatestRate = getLatestRate;
// Funkcja do eksportowania danych do JSON
const exportRatesToJSON = () => __awaiter(void 0, void 0, void 0, function* () {
    const rates = yield (0, exports.getAllRates)();
    // Usuwanie duplikatów po dacie
    const uniqueRates = Array.from(new Map(rates.map((rate) => [rate.date, rate])).values());
    // Sortowanie od najstarszych do najnowszych
    uniqueRates.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const filePath = path_1.default.join(__dirname, "rates.json");
    fs_1.default.writeFileSync(filePath, JSON.stringify(uniqueRates, null, 2), "utf-8");
    return filePath;
});
exports.exportRatesToJSON = exportRatesToJSON;
