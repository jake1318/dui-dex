/**
 * @file scripts/copy-backend.js
 * Current Date and Time (UTC - YYYY-MM-DD HH:MM:SS formatted): 2025-01-26 23:06:51
 * Current User's Login: jake1318
 */

import { cp } from "fs/promises";
import { join } from "path";

async function copyBackend() {
  try {
    await cp(
      join(process.cwd(), "backend"),
      join(process.cwd(), "dist", "backend"),
      { recursive: true }
    );
    console.log("Backend files copied successfully");
  } catch (error) {
    console.error("Error copying backend files:", error);
    process.exit(1);
  }
}

copyBackend();
