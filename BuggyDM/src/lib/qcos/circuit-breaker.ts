import type { CompiledLayoutTree } from "@/lib/qcos/types";

export type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

export class LayoutCircuitBreaker {
  private static state: CircuitState = "CLOSED";
  private static failureCount = 0;
  private static lastFailureTime: number | null = null;
  private static lastStateChangeTime: number = Date.now();

  private static readonly FAILURE_THRESHOLD = 3; // Trip after 3 failures
  private static readonly COOL_DOWN_PERIOD = 30000; // 30 seconds cooldown

  // Simple hardcoded baseline layout to act as ultimate fallback during outages
  private static readonly BOOTSTRAP_FALLBACK_LAYOUT: CompiledLayoutTree = {
    layoutId: 0,
    layoutName: "Outage Emergency Bootstrap Layout",
    pageName: "home",
    versionNumber: 0,
    theme: {
      id: 0,
      name: "Emergency Dark Theme",
      tokens: [
        { id: 0, theme_id: 0, token_key: "sys.color.primary", token_value: "#64748B", category: "color", created_at: new Date().toISOString() },
        { id: 0, theme_id: 0, token_key: "sys.color.surface", token_value: "#0F172A", category: "color", created_at: new Date().toISOString() }
      ]
    },
    sections: [
      {
        id: 0,
        name: "Emergency Hero Banner",
        display_order: 1,
        visibility_rules: null,
        constraints_json: null,
        widgets: [
          {
            id: 0,
            section_id: 0,
            widget_id: 1,
            display_order: 1,
            properties_json: JSON.stringify({
              imageUrl: "https://cdn.buggydelivery.com/banners/emergency-maintenance.webp",
              targetUrl: "/"
            }),
            widget: {
              id: 1,
              name: "BannerWidget",
              description: "Static hero promotional banner image block",
              min_version: "1.0.0"
            }
          }
        ]
      }
    ]
  };

  /**
   * Execute an operation inside the circuit breaker wrapper
   */
  public static async execute<T>(operation: () => Promise<T>): Promise<T | typeof LayoutCircuitBreaker.BOOTSTRAP_FALLBACK_LAYOUT> {
    const now = Date.now();

    // Handle cooldown transition from OPEN to HALF_OPEN
    if (this.state === "OPEN" && this.lastStateChangeTime + this.COOL_DOWN_PERIOD < now) {
      this.transitionTo("HALF_OPEN");
    }

    // If circuit is OPEN, return the local fallback layout immediately
    if (this.state === "OPEN") {
      console.warn(`[CircuitBreaker] Circuit is OPEN. Serving emergency bootstrap fallback layout.`);
      return this.BOOTSTRAP_FALLBACK_LAYOUT;
    }

    try {
      const result = await operation();

      // If a request succeeds in HALF_OPEN, close the circuit
      if (this.state === "HALF_OPEN") {
        this.transitionTo("CLOSED");
      }
      return result;
    } catch {
      this.recordFailure();

      // If we are in CLOSED or HALF_OPEN and hit a database error, serve emergency fallback
      console.error(`[CircuitBreaker] Operation failed. Serving fallback layout. State: ${this.state}, Failures: ${this.failureCount}`);
      return this.BOOTSTRAP_FALLBACK_LAYOUT;
    }
  }

  /**
   * Track operational failure and trip the circuit breaker if threshold reached
   */
  private static recordFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.state === "CLOSED" && this.failureCount >= this.FAILURE_THRESHOLD) {
      this.transitionTo("OPEN");
    } else if (this.state === "HALF_OPEN") {
      // Re-trip immediately on HALF_OPEN failure
      this.transitionTo("OPEN");
    }
  }

  /**
   * Move between circuit states
   */
  private static transitionTo(newState: CircuitState) {
    console.warn(`[CircuitBreaker] State transitioning from ${this.state} to ${newState}`);
    this.state = newState;
    this.lastStateChangeTime = Date.now();

    if (newState === "CLOSED") {
      this.failureCount = 0;
      this.lastFailureTime = null;
    }
  }

  /**
   * Get current state metadata (useful for dev check / diagnostics console)
   */
  public static getDiagnostics() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime,
      cooldownRemainingMs: this.state === "OPEN"
        ? Math.max(0, (this.lastStateChangeTime + this.COOL_DOWN_PERIOD) - Date.now())
        : 0
    };
  }
}
