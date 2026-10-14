import { createServer, Server, IncomingMessage, ServerResponse } from "http";
import { SpatialIndexer } from "@/lib/qcom/spatial.indexer";
import { eventBus, DomainEvent } from "@/lib/events/event-bus";

export class QComWebSocketServer {
  private static server: Server | null = null;
  private static sseClients: Set<ServerResponse> = new Set();

  /**
   * Start standalone HTTP & SSE Telemetry server for live updates
   */
  public static start(port: number = 8080): void {
    if (this.server) return;

    this.server = createServer((req: IncomingMessage, res: ServerResponse) => {
      // 1. Enable CORS
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");

      if (req.method === "OPTIONS") {
        res.writeHead(200);
        res.end();
        return;
      }

      // 2. Server-Sent Events (SSE) Endpoint for real-time telemetry streaming
      if (req.url === "/ws" || req.url === "/events") {
        res.writeHead(200, {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive"
        });

        this.sseClients.add(res);

        req.on("close", () => {
          this.sseClients.delete(res);
        });
        return;
      }

      // 3. Telemetry Ping Endpoint: POST /api/telemetry
      if (req.url === "/api/telemetry" && req.method === "POST") {
        let body = "";
        req.on("data", (chunk) => { body += chunk; });
        req.on("end", async () => {
          try {
            const msg = JSON.parse(body);
            if (msg.riderId && msg.lat && msg.lng) {
              await SpatialIndexer.updateRiderLocation(msg.riderId, msg.lat, msg.lng);
            }
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: true }));
          } catch {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Invalid JSON" }));
          }
        });
        return;
      }

      res.writeHead(404);
      res.end("Not Found");
    });

    this.server.listen(port, () => {
      console.log(`[QCOM TELEMETRY SERVER] Listening on http://localhost:${port}`);
    });

    // Subscribe to central Event Bus to stream domain events to connected clients
    eventBus.subscribe("*", (event: DomainEvent) => {
      const payload = `data: ${JSON.stringify(event)}\n\n`;
      for (const client of this.sseClients) {
        client.write(payload);
      }
    });
  }
}
