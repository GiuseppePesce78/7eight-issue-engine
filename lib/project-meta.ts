import fs from "fs";
import path from "path";
import { ProjectMeta } from "../types/types";

/* =============================================
   DEFAULT PROJECT METADATA
   - Fallback values if package.json is missing or incomplete
============================================= */
export const DEFAULT_PROJECT_META: ProjectMeta = {
  name: "Unknown Project",
  version: "0.0.0",
  author: "Unknown Author",
  repository: "Unknown Repo",
};

/* =============================================
   RAW PACKAGE.JSON INTERFACE
   - Represents the raw structure of package.json
   - Handles both string and object forms for author & repository
============================================= */
export interface RawPackageJson {
  name?: string;
  version?: string;
  author?: string | { name?: string };
  repository?: string | { url?: string };
}

/* =============================================
   READ PACKAGE META
   - Loads package.json and extracts key metadata
   - Falls back to DEFAULT_PROJECT_META on error
============================================= */

/**
 * Reads the project metadata from package.json.
 * Provides safe defaults if fields are missing or file is unreadable.
 * @param cwd - Directory to look for package.json (default: process.cwd())
 * @returns ProjectMeta object with name, version, author, repository
 */
export function readPackageMeta(cwd: string = process.cwd()): ProjectMeta {
  const packagePath = path.resolve(cwd, "package.json");

  try {
    const raw = fs.readFileSync(packagePath, "utf-8");
    const json = JSON.parse(raw) as RawPackageJson;

    // 🔹 Extract name, with fallback
    const name = json.name?.trim() || DEFAULT_PROJECT_META.name;
    
    // 🔹 Extract version, with fallback
    const version = json.version?.trim() || DEFAULT_PROJECT_META.version;

    // 🔹 Extract author: handle string or { name } object
    const author =
      typeof json.author === "string"
        ? json.author.trim() || DEFAULT_PROJECT_META.author
        : json.author && typeof json.author === "object" && json.author.name
        ? json.author.name.trim()
        : DEFAULT_PROJECT_META.author;

    // 🔹 Extract repository: handle string or { url } object
    const repository =
    typeof json.repository === "string"
    ? json.repository.trim() || DEFAULT_PROJECT_META.repository
    : json.repository && typeof json.repository === "object" && json.repository.url
    ? json.repository.url.trim()
    : DEFAULT_PROJECT_META.repository;
    return { name, version, author, repository };
  } catch {
    // ⚠️ Safe fallback if package.json cannot be read or parsed
    console.error(
      "⚠️  Warning: Could not read package.json — using fallback metadata."
    );
    return DEFAULT_PROJECT_META;
  }
}