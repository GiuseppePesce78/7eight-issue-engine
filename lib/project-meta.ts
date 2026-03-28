import fs from "fs";
import path from "path";
import { ProjectMeta } from "../types/types";

export const DEFAULT_PROJECT_META: ProjectMeta = {
  name: "Unknown Project",
  version: "0.0.0",
  author: "Unknown Author",
  repository: "Unknown Repo",
};

export interface RawPackageJson {
  name?: string;
  version?: string;
  author?: string | { name?: string };
  repository?: string | { url?: string };
}

export function readPackageMeta(cwd: string = process.cwd()): ProjectMeta {
  const packagePath = path.resolve(cwd, "package.json");

  try {
    const raw = fs.readFileSync(packagePath, "utf-8");
    const json = JSON.parse(raw) as RawPackageJson;

    const name = json.name?.trim() || DEFAULT_PROJECT_META.name;
    const version = json.version?.trim() || DEFAULT_PROJECT_META.version;
    const author =
      typeof json.author === "string"
        ? json.author.trim() || DEFAULT_PROJECT_META.author
        : json.author && typeof json.author === "object" && json.author.name
        ? json.author.name.trim()
        : DEFAULT_PROJECT_META.author;

    const repository =
    typeof json.repository === "string"
    ? json.repository.trim() || DEFAULT_PROJECT_META.repository
    : json.repository && typeof json.repository === "object" && json.repository.url
    ? json.repository.url.trim()
    : DEFAULT_PROJECT_META.repository;
    return { name, version, author, repository };
  } catch {
    console.error(
      "⚠️  Warning: Could not read package.json — using fallback metadata."
    );
    return DEFAULT_PROJECT_META;
  }
}