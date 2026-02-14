import { ConvexHttpClient } from "convex/browser";

let _client: ConvexHttpClient | null = null;

export function getConvexClient(): ConvexHttpClient {
  if (!_client) {
    const url = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!url) {
      throw new Error(
        "NEXT_PUBLIC_CONVEX_URL is not set. Please configure it in your .env file.\n" +
          "See .env.example for the required format."
      );
    }
    _client = new ConvexHttpClient(url);
  }
  return _client;
}
