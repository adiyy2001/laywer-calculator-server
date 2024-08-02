import { Datastore } from "@google-cloud/datastore";
import { config } from "dotenv";

// Załaduj zmienne środowiskowe
config();

// Produkcja: użyj zmiennej środowiskowej
const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
if (!credentialsJson) {
  throw new Error(
    "GOOGLE_APPLICATION_CREDENTIALS_JSON environment variable is not set."
  );
}

let credentials;
try {
  credentials = JSON.parse(credentialsJson);
} catch (error) {
  throw new Error(
    "Invalid JSON in GOOGLE_APPLICATION_CREDENTIALS_JSON environment variable."
  );
}

const datastore = new Datastore({
  projectId: credentials.project_id,
  credentials: {
    client_email: credentials.client_email,
    private_key: credentials.private_key,
  },
});

export { datastore };
