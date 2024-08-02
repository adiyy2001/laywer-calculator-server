import { datastore } from "./datastore";
import path from "path";
import fs from "fs";

const kind = "rates";

// Funkcja do zapisywania danych
export const saveRatesToDatabase = async (
  rates: { date: string; wibor3m: string; wibor6m: string }[]
) => {
  const entities = rates.map((rate) => {
    return {
      key: datastore.key([kind, rate.date]),
      data: {
        date: rate.date,
        wibor3m: rate.wibor3m,
        wibor6m: rate.wibor6m,
      },
    };
  });

  await datastore.save(entities);
};

// Funkcja do pobierania wszystkich danych
export const getAllRates = async () => {
  const query = datastore.createQuery(kind);
  const [entities] = await datastore.runQuery(query);
  return entities.map((entity) => ({
    date: entity.date,
    wibor3m: entity.wibor3m,
    wibor6m: entity.wibor6m,
  }));
};

// Funkcja do pobierania najnowszego wpisu
export const getLatestRate = async () => {
  const query = datastore
    .createQuery(kind)
    .order("date", { descending: true })
    .limit(1);
  const [entities] = await datastore.runQuery(query);
  return entities.length ? entities[0] : null;
};

// Funkcja do eksportowania danych do JSON
export const exportRatesToJSON = async () => {
  const rates = await getAllRates();

  // Usuwanie duplikatów po dacie
  const uniqueRates = Array.from(
    new Map(rates.map((rate) => [rate.date, rate])).values()
  );

  // Sortowanie od najstarszych do najnowszych
  uniqueRates.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const filePath = path.join(__dirname, "rates.json");
  fs.writeFileSync(filePath, JSON.stringify(uniqueRates, null, 2), "utf-8");
  return filePath;
};
