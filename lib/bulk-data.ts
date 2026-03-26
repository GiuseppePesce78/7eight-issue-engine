import fs from "fs";
import { BulkEntry } from "../types/types";


export function loadBulkData(pathToJson: string): BulkEntry[] {
  try {
    const raw = fs.readFileSync(pathToJson, "utf-8");
    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      throw new Error("Bulk file must be a JSON array of issue entries.");
    }

    // Basic validation: ensure each entry has state and issue
    for (const entry of parsed) {
      if (typeof entry !== "object" || entry === null) {
        throw new Error("Each entry must be an object.");
      }
      if (!entry.state || !entry.issue) {
        throw new Error("Each entry must have 'state' and 'issue' properties.");
      }
      if (typeof entry.issue !== "object" || !entry.issue.title || !entry.issue.body) {
        throw new Error("Each issue must have 'title' and 'body'.");
      }
    }

    return parsed as BulkEntry[];
  } catch (e: any) {
    throw new Error(`Could not load bulk data from ${pathToJson}: ${e.message}`);
  }
}

export function saveBulkData(pathToJson: string, data: BulkEntry[]): void {
  try {
    fs.writeFileSync(pathToJson, JSON.stringify(data, null, 2));
  } catch (e: any) {
    throw new Error(`Could not save bulk data to ${pathToJson}: ${e.message}`);
  }
}