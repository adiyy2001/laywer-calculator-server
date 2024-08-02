import { Datastore } from "@google-cloud/datastore";
import path from "path";
import { config } from "dotenv";
import fs from "fs";
config();

const dir = path.resolve(__dirname, "../../");
console.log(`Resolved dir: ${dir}`);

const serviceAccountPath = path.join(dir, "credentials.json");
console.log(`Service Account Path: ${serviceAccountPath}`);

if (!fs.existsSync(serviceAccountPath)) {
  throw new Error(`The file at ${serviceAccountPath} does not exist.`);
}

const datastore = new Datastore({
  projectId: "lawyer-calculator", // Zamień na ID swojego projektu
  keyFilename: serviceAccountPath,
});

export { datastore };
