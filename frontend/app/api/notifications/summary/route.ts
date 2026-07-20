import { proxyBackendGet } from "../../_lib/backendProxy";

export async function GET() {
  return proxyBackendGet("/notifications/summary");
}
