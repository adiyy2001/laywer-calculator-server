import * as admin from "firebase-admin";
import path from "path";
import { config } from "dotenv";
import fs from "fs";

// Załaduj zmienne środowiskowe
config();

// Ścieżka do katalogu z poświadczeniami
const dir = path.resolve(__dirname, "../../");
console.log(`Resolved dir: ${dir}`);

// Ścieżka do pliku credentials.json
const serviceAccountPath = path.join(dir, "credentials.json");
console.log(`Service Account Path: ${serviceAccountPath}`);

// Sprawdź, czy plik istnieje
if (!fs.existsSync(serviceAccountPath)) {
  throw new Error(`The file at ${serviceAccountPath} does not exist.`);
}

// Inicjalizacja Firebase
admin.initializeApp({
  credential: admin.credential.cert(require(serviceAccountPath)),
  databaseURL:
    process.env.DATABASE_URL || "https://lawyer-calculator.firebaseio.com",
});

// Uzyskanie dostępu do Firestore
const db = admin.firestore();

export { db };
