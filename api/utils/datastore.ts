import { Datastore } from "@google-cloud/datastore";
import { config } from "dotenv";
import fs from "fs";
import path from "path";

// Załaduj zmienne środowiskowe
config();

// Ścieżka do katalogu z poświadczeniami
const dir = path.resolve(__dirname, "../../");
console.log(`Resolved dir: ${dir}`);

const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
if (!credentialsJson) {
  throw new Error(
    "GOOGLE_APPLICATION_CREDENTIALS_JSON environment variable is not set."
  );
}

// Zapisz poświadczenia do tymczasowego pliku (tylko w razie potrzeby)
const serviceAccountPath = path.join(dir, "temp-credentials.json");
fs.writeFileSync(serviceAccountPath, credentialsJson);

console.log(`Service Account Path: ${serviceAccountPath}`);

if (!fs.existsSync(serviceAccountPath)) {
  throw new Error(`The file at ${serviceAccountPath} does not exist.`);
}

const datastore = new Datastore({
  projectId: "lawyer-calculator", // Zamień na ID swojego projektu
  keyFilename: serviceAccountPath,
});

// Po zainicjalizowaniu Datastore, usuń tymczasowy plik z poświadczeniami
fs.unlinkSync(serviceAccountPath);

export { datastore };
