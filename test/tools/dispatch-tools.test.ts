import { describe, it, expect, vi } from "vitest";
import type { RmfClient } from "../../src/rmf-client.js";
import type { PluginConfig } from "../../src/types.js";
import { dispatchGoToPlaceTool } from "../../src/tools/dispatch-go-to-place.js";
import { dispatchPatrolTool } from "../../src/tools/dispatch-patrol.js";
import { dispatchCleanTool } from "../../src/tools/dispatch-clean.js";
import { dispatchDeliveryTool } from "../../src/tools/dispatch-delivery.js";
import { dispatchComposeTool } from "../../src/tools/dispatch-compose.js";
import { mockDispatchSuccess } from "../mock-responses.js";

const config: PluginConfig = {
  apiServerUrl: "http://localhost:8000",
  defaultRequester: "openclaw_plugin",
  useSimTime: false,
};

function mockClient(): RmfClient {
  return {
    dispatchTask: vi.fn().mockResolvedValue(mockDispatchSuccess),
    cancelTask: vi.fn(),
    getTaskState: vi.fn(),
    queryTasks: vi.fn(),
  } as unknown as RmfClient;
}

describe("dispatchGoToPlaceTool", () => {
  it("calls dispatchTask and returns formatted response", async () => {
    const client = mockClient();
    const tool = dispatchGoToPlaceTool(client, config);
    const result = await tool.execute("id", { place: "pantry" });

    expect(client.dispatchTask).toHaveBeenCalledTimes(1);
    expect(result.content[0].type).toBe("text");
    expect(JSON.parse(result.content[0].text)).toEqual(mockDispatchSuccess);
  });

  it("returns error text on failure", async () => {
    const client = mockClient();
    (client.dispatchTask as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("Network error")
    );
    const tool = dispatchGoToPlaceTool(client, config);
    const result = await tool.execute("id", { place: "pantry" });

    expect(result.content[0].text).toContain("Error");
    expect(result.content[0].text).toContain("Network error");
  });
});

describe("dispatchPatrolTool", () => {
  it("calls dispatchTask with patrol params", async () => {
    const client = mockClient();
    const tool = dispatchPatrolTool(client, config);
    await tool.execute("id", { places: ["A", "B"], rounds: 2 });

    expect(client.dispatchTask).toHaveBeenCalledTimes(1);
    const taskArg = (client.dispatchTask as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(taskArg.category).toBe("patrol");
  });
});

describe("dispatchCleanTool", () => {
  it("calls dispatchTask with clean params", async () => {
    const client = mockClient();
    const tool = dispatchCleanTool(client, config);
    await tool.execute("id", { zone: "cleaning_zone_1" });

    expect(client.dispatchTask).toHaveBeenCalledTimes(1);
    const taskArg = (client.dispatchTask as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(taskArg.category).toBe("compose");
  });
});

describe("dispatchDeliveryTool", () => {
  it("calls dispatchTask with delivery params", async () => {
    const client = mockClient();
    const tool = dispatchDeliveryTool(client, config);
    await tool.execute("id", {
      pickup_place: "pantry",
      pickup_handler: "coke_dispenser",
      dropoff_place: "hardware_2",
      dropoff_handler: "coke_ingestor",
    });

    expect(client.dispatchTask).toHaveBeenCalledTimes(1);
    const taskArg = (client.dispatchTask as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(taskArg.category).toBe("delivery");
  });
});

describe("dispatchComposeTool", () => {
  it("parses phases_json and dispatches", async () => {
    const client = mockClient();
    const tool = dispatchComposeTool(client, config);
    const phases = [{ activity: { category: "go_to_place", description: "A" } }];
    await tool.execute("id", {
      category: "custom",
      phases_json: JSON.stringify(phases),
    });

    expect(client.dispatchTask).toHaveBeenCalledTimes(1);
  });

  it("returns error on invalid JSON", async () => {
    const client = mockClient();
    const tool = dispatchComposeTool(client, config);
    const result = await tool.execute("id", {
      category: "custom",
      phases_json: "not valid json",
    });

    expect(result.content[0].text).toContain("Error");
  });
});
