/**
 * Seed Firestore with companies, subsidiaries, departments, and employees.
 *
 * Run with:
 *   pnpm seed                       # uses FIREBASE_* env vars
 *   pnpm seed -- --dry-run          # print without writing
 *
 * Targets the project configured by FIREBASE_PROJECT_ID. Run it
 * once per environment (prod, staging).
 */
import { NestFactory } from "@nestjs/core";
import { AppModule } from "../app.module";
import { FirebaseService } from "../firebase/firebase.service";
import {
  COMPANIES,
  SUBSIDIARIES,
  DEPARTMENTS,
  EMPLOYEES,
} from "./data";

async function run() {
  const dryRun = process.argv.includes("--dry-run");
  const label = dryRun ? "[DRY-RUN] " : "";

  console.log(
    `${label}Seeding project: ${process.env.FIREBASE_PROJECT_ID ?? "(unset)"}`,
  );
  console.log(
    `${label}  ${COMPANIES.length} companies, ${SUBSIDIARIES.length} subsidiaries, ${DEPARTMENTS.length} departments, ${EMPLOYEES.length} employees`,
  );

  if (dryRun) {
    console.log(`${label}Skipping writes.`);
    return;
  }

  // Bootstrap Nest to get FirebaseService.
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ["error", "warn"],
  });
  const firebase = app.get(FirebaseService);
  const fs = firebase.firestore;

  const collections = [
    { name: "companies", docs: COMPANIES },
    { name: "subsidiaries", docs: SUBSIDIARIES },
    { name: "departments", docs: DEPARTMENTS },
    { name: "employees", docs: EMPLOYEES },
  ];

  let total = 0;
  for (const { name, docs } of collections) {
    const col = fs.collection(name);
    const batch = fs.batch();
    for (const doc of docs) {
      batch.set(col.doc(doc.id), doc as unknown as Record<string, unknown>);
    }
    await batch.commit();
    console.log(`${label}  ${name}: ${docs.length} docs written`);
    total += docs.length;
  }

  console.log(`${label}Done. ${total} total docs.`);
  await app.close();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
