export async function readApiError(response: Response, fallback: string): Promise<string> {
  try {
    const data = (await response.json()) as { error?: string };
    if (data.error?.trim()) return data.error;
  } catch {
    // Response body is not JSON.
  }
  return fallback;
}
