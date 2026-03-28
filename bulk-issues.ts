import { spawnSync } from "child_process";
import path from "path";
import { extractUniqueLabels, loadBulkData, saveBulkData } from "./lib/bulk-data";
import { readPackageMeta } from "./lib/project-meta";
import { printHeader, printSummary } from "./lib/report";
import { buildCommandArgs } from "./lib/cmd-utils";
import { BulkEntry, ProjectMeta } from "./types/types";
import { verifyLabelsOnGitHub } from "./lib/single-issue";


/* get json Path */
const [filePath] = process.argv.slice(2);

/* check dry run */
const isDryRun = process.env.DRY_RUN !== "false";

if (!filePath) {
  console.error("\n❌ Error: Specify the JSON file path.");
  process.exit(1);
}

const absolutePath = path.resolve(process.cwd(), filePath);
const fileName = path.basename(absolutePath);


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

  /* load data to create issues */
  const data = loadBulkData(absolutePath);

  if (!isDryRun) {
    console.log("🔍 [PRE-FLIGHT] Verifying GitHub labels...");
    const requiredLabels = extractUniqueLabels(data);
    
    // This will halt execution if any label is missing
    verifyLabelsOnGitHub(requiredLabels);
    
    console.log("✅ [PRE-FLIGHT] Environment check passed.");
  }  
  
  // --- EXTRACT META,  PRINT HEADER & START PROCESS */
  const { name: projectName, version: projectVersion, author: projectAuthor, repository: projectRepo } =
  readPackageMeta();
  const meta: ProjectMeta = { name: projectName, version: projectVersion, author: projectAuthor, repository: projectRepo };
  printHeader(meta, fileName, absolutePath, isDryRun);

  const { created, skipped } = processAllEntries(data, isDryRun, absolutePath, fileName);

  printSummary(projectName, { created, skipped, total: data.length }, isDryRun);
} catch (error: any) {
  console.error("\n❌ Critical Error:", error.message);
}


