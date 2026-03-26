import { execSync, spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import { loadBulkData, saveBulkData } from "./lib/bulk-data";
import { readPackageMeta } from "./lib/project-meta";
import { printHeader, printSummary } from "./lib/report";
import { buildCommandArgs } from "./lib/cmd-utils";
import { IssueState, Issue, BulkEntry, ProjectMeta } from "./types/types";

const [filePath] = process.argv.slice(2);
const isDryRun = process.env.DRY_RUN !== "false";

if (!filePath) {
  console.error("\n❌ Error: Specify the JSON file path.");
  process.exit(1);
}

const absolutePath = path.resolve(process.cwd(), filePath);
const fileName = path.basename(absolutePath);

// --- METADATA EXTRACTION ---
const { name: projectName, version: projectVersion, author: projectAuthor, repository: projectRepo } =
  readPackageMeta();

const OWNER = "7eightDev";

function processEntryOld(entry: BulkEntry, isDryRun: boolean, absolutePath: string, fileName: string): boolean {
  // Skip if already created
  if (entry.state === "created") {
    console.log(`\x1b[90m[SKIPPED]\x1b[0m ${entry.issue.title}`);
    return false; // not processed
  }

  const args = buildCommandArgs(entry.issue);

  
  const command = `npx ${args.join(" ")}`; // For now, keep string for compatibility, but TODO: use execSync with array

  if (isDryRun) {
    console.log(`\x1b[33m[PENDING]\x1b[0m ${entry.issue.title}`);
    return false;
  }

  console.log(`\x1b[32m[CREATING...]\x1b[0m ${entry.issue.title}`);

  try {
    const result = spawnSync("npx", ["tsx", "create-issue.ts", ...args], { 
    stdio: "inherit",
    shell: true 
    });
    
    if (result.status !== 0) {
      throw new Error(`Il processo figlio è terminato con codice ${result.status}`);
    }

    entry.state = "created";
    entry.createdAt = new Date().toLocaleString("it-IT");
    return true;
    /* execSync(command, { stdio: "inherit" });

    entry.state = "created";
    entry.createdAt = new Date().toLocaleString("it-IT");
    return true; // processed successfully */
  } catch (e: any) {
    const errorMsg = e.stderr?.toString()?.trim() || e.message || "Unknown error";
    console.error(`\x1b[31m[FAILED]\x1b[0m ${entry.issue.title}`);
    console.error(`   ${errorMsg}`);

    entry.state = "failed";
    entry.error = errorMsg;
    entry.failedAt = new Date().toLocaleString("it-IT");
    throw new Error(`Execution halted. Progress saved in: ${fileName}`);
  }
}

function processEntry(entry: BulkEntry, isDryRun: boolean, absolutePath: string, fileName: string): boolean {
  // 1. Salta se già creato
  if (entry.state === "created") {
    console.log(`\x1b[90m[SKIPPED]\x1b[0m ${entry.issue.title}`);
    return false;
  }

  // 2. Ottieni gli argomenti come ARRAY (importante per evitare errori di shell)
  // Assicurati che buildCommandArgs in lib/cmd-utils.ts ritorni string[]
  const args = buildCommandArgs(entry.issue);

  if (isDryRun) {
    console.log(`\x1b[33m[PENDING]\x1b[0m ${entry.issue.title}`);
    return false;
  }

  console.log(`\x1b[32m[CREATING...]\x1b[0m ${entry.issue.title}`);

  try {
    // 3. Esecuzione sicura tramite spawnSync
    // Passiamo gli argomenti singolarmente, evitando che la shell interpreti caratteri speciali
    const result = spawnSync("npx", ["tsx", "create-issue.ts", ...args], { 
      stdio: "inherit",
      // shell: false è più sicuro per evitare l'errore delle parentesi nel body
      shell: process.platform === 'win32' // true solo su Windows per risolvere .cmd
    });
    
    if (result.status !== 0) {
      throw new Error(`Il processo figlio è terminato con codice ${result.status}`);
    }

    // 4. Aggiornamento stato
    entry.state = "created";
    // Usiamo toISOString o un formato standard per evitare problemi di localizzazione
    entry.createdAt = new Date().toISOString(); 
    return true;

  } catch (e: any) {
    const errorMsg = e.message || "Unknown error";
    console.error(`\x1b[31m[FAILED]\x1b[0m ${entry.issue.title}`);
    console.error(`   ${errorMsg}`);

    entry.state = "failed";
    entry.error = errorMsg;
    entry.failedAt = new Date().toISOString();
    
    // Interrompiamo l'esecuzione per non corrompere altri dati
    throw new Error(`Execution halted. Progress saved in: ${fileName}`);
  }
}

function processAllEntries(data: BulkEntry[], isDryRun: boolean, absolutePath: string, fileName: string): { created: number; skipped: number } {
  let createdCount = 0;
  let skippedCount = 0;

  for (const entry of data) {
    try {
      if (processEntry(entry, isDryRun, absolutePath, fileName)) {
        createdCount++;
      } else {
        skippedCount++;
      }

      if (!isDryRun) {
        saveBulkData(absolutePath, data);
      }
    } catch (e) {
      // Re-throw to halt execution
      throw e;
    }
  }

  return { created: createdCount, skipped: skippedCount };
}




try {
  const data = loadBulkData(absolutePath);

  const meta: ProjectMeta = { name: projectName, version: projectVersion, author: projectAuthor, repository: projectRepo };
  printHeader(meta, fileName, absolutePath, isDryRun);

  const { created, skipped } = processAllEntries(data, isDryRun, absolutePath, fileName);

  printSummary(projectName, { created, skipped, total: data.length }, isDryRun);
} catch (error: any) {
  console.error("\n❌ Critical Error:", error.message);
}
