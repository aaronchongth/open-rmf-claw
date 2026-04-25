import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  buildGoToPlaceTask,
  buildPatrolTask,
  buildCleanTask,
  buildDeliveryTask,
  buildComposeTask,
} from "../src/task-builders.js";

// Freeze Date.now() for deterministic timestamps
const NOW = 1700000000000;

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("buildGoToPlaceTask", () => {
  it("builds correct compose structure for go_to_place", () => {
    const task = buildGoToPlaceTask({ place: "pantry" });

    expect(task.category).toBe("compose");
    expect(task.unix_millis_request_time).toBe(NOW);
    expect(task.unix_millis_earliest_start_time).toBe(NOW);
    expect(task.requester).toBe("openclaw_plugin");
    expect(task.labels).toEqual(["source=openclaw"]);

    const desc = task.description as {
      category: string;
      phases: Array<{
        activity: { category: string; description: { one_of: Array<{ waypoint: string }> } };
      }>;
    };
    expect(desc.category).toBe("go_to_place");
    expect(desc.phases).toHaveLength(1);
    expect(desc.phases[0].activity.category).toBe("go_to_place");
    expect(desc.phases[0].activity.description.one_of).toEqual([
      { waypoint: "pantry" },
    ]);
  });

  it("converts orientation from degrees to radians", () => {
    const task = buildGoToPlaceTask({ place: "pantry", orientation: 90 });
    const desc = task.description as {
      phases: Array<{
        activity: {
          description: { one_of: Array<{ waypoint: string; orientation: number }> };
        };
      }>;
    };
    const orient = desc.phases[0].activity.description.one_of[0].orientation;
    expect(orient).toBeCloseTo(Math.PI / 2, 10);
  });

  it("sets fleet_name when provided", () => {
    const task = buildGoToPlaceTask({ place: "pantry", fleet: "tinyRobot" });
    expect(task.fleet_name).toBe("tinyRobot");
  });

  it("omits fleet_name when not provided", () => {
    const task = buildGoToPlaceTask({ place: "pantry" });
    expect(task.fleet_name).toBeUndefined();
  });
});

describe("buildPatrolTask", () => {
  it("builds correct patrol structure", () => {
    const task = buildPatrolTask({ places: ["A", "B", "C"], rounds: 3 });

    expect(task.category).toBe("patrol");
    const desc = task.description as { places: string[]; rounds: number };
    expect(desc.places).toEqual(["A", "B", "C"]);
    expect(desc.rounds).toBe(3);
  });

  it("defaults rounds to 1", () => {
    const task = buildPatrolTask({ places: ["A"] });
    const desc = task.description as { places: string[]; rounds: number };
    expect(desc.rounds).toBe(1);
  });
});

describe("buildCleanTask", () => {
  it("builds correct compose/clean structure", () => {
    const task = buildCleanTask({ zone: "cleaning_zone_1" });

    expect(task.category).toBe("compose");

    const desc = task.description as {
      category: string;
      phases: Array<{
        activity: {
          category: string;
          description: {
            activities: Array<{
              category: string;
              description: unknown;
            }>;
          };
        };
      }>;
    };

    expect(desc.category).toBe("clean");
    expect(desc.phases).toHaveLength(1);

    const phase = desc.phases[0];
    expect(phase.activity.category).toBe("sequence");

    const activities = phase.activity.description.activities;
    expect(activities).toHaveLength(2);

    // First activity: go_to_place
    expect(activities[0].category).toBe("go_to_place");
    expect(activities[0].description).toBe("cleaning_zone_1");

    // Second activity: perform_action (clean)
    expect(activities[1].category).toBe("perform_action");
    const actionDesc = activities[1].description as Record<string, unknown>;
    expect(actionDesc.unix_millis_action_duration_estimate).toBe(60000);
    expect(actionDesc.category).toBe("clean");
    expect(actionDesc.expected_finish_location).toBe("cleaning_zone_1");
    expect(actionDesc.description).toEqual({ zone: "cleaning_zone_1" });
    expect(actionDesc.use_tool_sink).toBe(true);
  });
});

describe("buildDeliveryTask", () => {
  it("builds correct delivery structure", () => {
    const task = buildDeliveryTask({
      pickup: { place: "pantry", handler: "coke_dispenser" },
      dropoff: { place: "hardware_2", handler: "coke_ingestor" },
    });

    expect(task.category).toBe("delivery");

    const desc = task.description as {
      pickup: { place: string; handler: string; payload: unknown[] };
      dropoff: { place: string; handler: string; payload: unknown[] };
    };

    expect(desc.pickup.place).toBe("pantry");
    expect(desc.pickup.handler).toBe("coke_dispenser");
    expect(desc.pickup.payload).toEqual([]);
    expect(desc.dropoff.place).toBe("hardware_2");
    expect(desc.dropoff.handler).toBe("coke_ingestor");
    expect(desc.dropoff.payload).toEqual([]);
  });

  it("includes payload when specified", () => {
    const task = buildDeliveryTask({
      pickup: { place: "pantry", handler: "dispenser", payload: "coke" },
      dropoff: { place: "lounge", handler: "ingestor", payload: "coke" },
    });

    const desc = task.description as {
      pickup: { payload: Array<{ sku: string; quantity: number }> };
      dropoff: { payload: Array<{ sku: string; quantity: number }> };
    };

    expect(desc.pickup.payload).toEqual([{ sku: "coke", quantity: 1 }]);
    expect(desc.dropoff.payload).toEqual([{ sku: "coke", quantity: 1 }]);
  });
});

describe("buildComposeTask", () => {
  it("passes through raw category and phases", () => {
    const phases = [
      {
        activity: {
          category: "sequence",
          description: {
            activities: [
              { category: "go_to_place", description: "A" },
              { category: "go_to_place", description: "B" },
            ],
          },
        },
      },
    ];
    const task = buildComposeTask({ category: "custom", phases });

    expect(task.category).toBe("compose");
    const desc = task.description as { category: string; phases: unknown[] };
    expect(desc.category).toBe("custom");
    expect(desc.phases).toEqual(phases);
  });
});

describe("common fields", () => {
  it("all builders set timestamps and labels", () => {
    const tasks = [
      buildGoToPlaceTask({ place: "A" }),
      buildPatrolTask({ places: ["A"] }),
      buildCleanTask({ zone: "A" }),
      buildDeliveryTask({
        pickup: { place: "A", handler: "h" },
        dropoff: { place: "B", handler: "h" },
      }),
      buildComposeTask({ category: "c", phases: [] }),
    ];

    for (const task of tasks) {
      expect(task.unix_millis_request_time).toBe(NOW);
      expect(task.unix_millis_earliest_start_time).toBe(NOW);
      expect(task.labels).toEqual(["source=openclaw"]);
      expect(task.requester).toBe("openclaw_plugin");
    }
  });

  it("uses custom requester when provided", () => {
    const task = buildGoToPlaceTask({ place: "A", requester: "custom_user" });
    expect(task.requester).toBe("custom_user");
  });

  it("sets timestamps to 0 when sim=true", () => {
    const tasks = [
      buildGoToPlaceTask({ place: "A", sim: true }),
      buildPatrolTask({ places: ["A"], sim: true }),
      buildCleanTask({ zone: "A", sim: true }),
      buildDeliveryTask({
        pickup: { place: "A", handler: "h" },
        dropoff: { place: "B", handler: "h" },
        sim: true,
      }),
      buildComposeTask({ category: "c", phases: [], sim: true }),
    ];

    for (const task of tasks) {
      expect(task.unix_millis_request_time).toBe(0);
      expect(task.unix_millis_earliest_start_time).toBe(0);
    }
  });

  it("uses real timestamps when sim=false", () => {
    const task = buildGoToPlaceTask({ place: "A", sim: false });
    expect(task.unix_millis_request_time).toBe(NOW);
    expect(task.unix_millis_earliest_start_time).toBe(NOW);
  });
});
