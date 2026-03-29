import path from 'path';
import { extractUniqueLabels, loadBulkData } from './lib/bulk-data';
import { readPackageMeta } from './lib/project-meta';
import { printHeader, printSummary } from './lib/report';
import { ProjectMeta } from './types/types';
import { verifyLabelsOnGitHub } from './lib/single-issue';
import { processAllEntries } from './bulk-processor';

/* Get JSON file path from CLI arguments */
const [filePath] = process.argv.slice(2);

/* Check if dry-run mode is active via environment variable */
const isDryRun = process.env.DRY_RUN !== 'false';

/* If no file path was provided, exit immediately */
if (!filePath) {
  console.error('\n❌ Error: Specify the JSON file path.');
  process.exit(1);
}

/* Resolve absolute path and file name for logging and saving purposes */
const absolutePath = path.resolve(process.cwd(), filePath);
const fileName = path.basename(absolutePath);

try {
    /* Load and validate JSON containing the issues to be created */
  const data = loadBulkData(absolutePath);

  if (!isDryRun) {
    console.log('🔍 [PRE-FLIGHT] Verifying GitHub labels...');
    /* Extract all unique labels from the issue data */
    const requiredLabels = extractUniqueLabels(data);

    /* Ensure all required labels exist on GitHub.
       ⚠️ This will halt execution if even one label is missing */
    verifyLabelsOnGitHub(requiredLabels);

    console.log('✅ [PRE-FLIGHT] Environment check passed.');
  }

  /* Extract metadata from package.json and print header */
  const {
    name: projectName,
    version: projectVersion,
    author: projectAuthor,
    repository: projectRepo
  } = readPackageMeta();

  /* Create a metadata object for reporting */
  const meta: ProjectMeta = {
    name: projectName,
    version: projectVersion,
    author: projectAuthor,
    repository: projectRepo
  };

  /* Print the header for this run, showing project info and plan file */
  printHeader(meta, fileName, absolutePath, isDryRun);

  /* Process all entries, updating each entry's state 
     depending on the result (created / skipped / failed) */
  const { created, skipped } = processAllEntries(
    data,
    isDryRun,
    absolutePath,
    fileName
  );

  /* Print a summary of the run, showing created, skipped, and total */
  printSummary(projectName, { created, skipped, total: data.length }, isDryRun);
} catch (error: any) {
  /* Critical error handling: log the message and exit */
  console.error('\n❌ Critical Error:', error.message);
}
