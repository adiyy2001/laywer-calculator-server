import { Datastore } from "@google-cloud/datastore";
import { config } from "dotenv";
import fs from "fs";
import path from "path";

// Załaduj zmienne środowiskowe
config();

// Ścieżka do katalogu z poświadczeniami
const dir = path.resolve(__dirname, "../../");
console.log(`Resolved dir: ${dir}`);

// Produkcja: użyj zmiennej środowiskowej
const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
if (!credentialsJson) {
  throw new Error(
    "GOOGLE_APPLICATION_CREDENTIALS_JSON environment variable is not set."
  );
}
const datastore = new Datastore({
  projectId: "lawyer-calculator",
  keyFilename: credentialsJson,
});

export { datastore };
