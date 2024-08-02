import { Datastore } from "@google-cloud/datastore";
import { config } from "dotenv";
import fs from "fs";
import path from "path";

// Załaduj zmienne środowiskowe
config();

// Ścieżka do katalogu z poświadczeniami
const dir = path.resolve(__dirname, "../../");
console.log(`Resolved dir: ${dir}`);

// Ścieżka do pliku credentials.json (tylko dla development)
const devCredentialsPath = path.join(dir, "credentials.json");

let serviceAccountPath: string = "";

if (process.env.NODE_ENV === "production") {
  // Produkcja: użyj zmiennej środowiskowej
  const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  if (!credentialsJson) {
    throw new Error(
      "GOOGLE_APPLICATION_CREDENTIALS_JSON environment variable is not set."
    );
  }

  // Zapisz poświadczenia do tymczasowego pliku (tylko w razie potrzeby)
  console.log(`Service Account Path: ${serviceAccountPath}`);

  if (!fs.existsSync(serviceAccountPath)) {
    throw new Error(`The file at ${serviceAccountPath} does not exist.`);
  }
} else {
  // Development: użyj pliku credentials.json
  if (!fs.existsSync(devCredentialsPath)) {
    throw new Error(`The file at ${devCredentialsPath} does not exist.`);
  }
  serviceAccountPath = devCredentialsPath;
  console.log(`Using development credentials: ${serviceAccountPath}`);
}

const datastore = new Datastore({
  projectId: "lawyer-calculator", // Zamień na ID swojego projektu
  keyFilename: serviceAccountPath,
});

// Po zainicjalizowaniu Datastore, usuń tymczasowy plik z poświadczeniami (tylko produkcja)
if (process.env.NODE_ENV === "production") {
  fs.unlinkSync(serviceAccountPath);
}

export { datastore };
