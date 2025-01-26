/**
 * @file src/services/api.ts
 * Current Date and Time (UTC - YYYY-MM-DD HH:MM:SS formatted): 2025-01-26 00:50:06
 * Current User's Login: jake1318
 */

import { config } from "./config";
import { ApplicationError, handleApiError } from "./errorHandling";
import type { SearchApiResponse } from "./types";

export class ApiService {
  private static async fetchWithTimeout(
    input: RequestInfo,
    init?: RequestInit
  ): Promise<Response> {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), config.api.timeout);

    try {
      const response = await fetch(input, {
        ...init,
        signal: controller.signal,
      });
      clearTimeout(id);
      return response;
    } catch (error) {
      clearTimeout(id);
      throw error;
    }
  }

  static async search(query: string): Promise<SearchApiResponse> {
    try {
      const response = await this.fetchWithTimeout(
        `${config.api.baseUrl}/api/generate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ prompt: query }),
        }
      );

      if (!response.ok) {
        throw new ApplicationError("Search request failed", response.status);
      }

      const data = await response.json();
      return {
        success: true,
        data,
      };
    } catch (error) {
      const handledError = handleApiError(error);
      return {
        success: false,
        error: handledError.message,
      };
    }
  }
}
