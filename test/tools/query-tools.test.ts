import { describe, it, expect, vi } from "vitest";
import type { RmfClient } from "../../src/rmf-client.js";
import { cancelTaskTool } from "../../src/tools/cancel-task.js";
import { getTaskStatusTool } from "../../src/tools/get-task-status.js";
import { listTasksTool } from "../../src/tools/list-tasks.js";
import {
  mockCancelSuccess,
  mockTaskState,
  mockTaskList,
} from "../mock-responses.js";

function mockClient(): RmfClient {
  return {
    dispatchTask: vi.fn(),
    cancelTask: vi.fn().mockResolvedValue(mockCancelSuccess),
    getTaskState: vi.fn().mockResolvedValue(mockTaskState),
    queryTasks: vi.fn().mockResolvedValue(mockTaskList),
  } as unknown as RmfClient;
}

describe("cancelTaskTool", () => {
  it("calls cancelTask and returns response", async () => {
    const client = mockClient();
    const tool = cancelTaskTool(client);
    const result = await tool.execute("id", { task_id: "task_123" });

    expect(client.cancelTask).toHaveBeenCalledWith("task_123");
    expect(JSON.parse(result.content[0].text)).toEqual(mockCancelSuccess);
  });

  it("returns error on failure", async () => {
    const client = mockClient();
    (client.cancelTask as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("Not found")
    );
    const tool = cancelTaskTool(client);
    const result = await tool.execute("id", { task_id: "bad_id" });

    expect(result.content[0].text).toContain("Error");
  });
});

describe("getTaskStatusTool", () => {
  it("calls getTaskState and returns response", async () => {
    const client = mockClient();
    const tool = getTaskStatusTool(client);
    const result = await tool.execute("id", { task_id: "task_123" });

    expect(client.getTaskState).toHaveBeenCalledWith("task_123");
    expect(JSON.parse(result.content[0].text)).toEqual(mockTaskState);
  });
});

describe("listTasksTool", () => {
  it("calls queryTasks and returns summary", async () => {
    const client = mockClient();
    const tool = listTasksTool(client);
    const result = await tool.execute("id", { status: "underway" });

    expect(client.queryTasks).toHaveBeenCalledWith({ status: "underway" });
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed).toHaveLength(2);
    expect(parsed[0].id).toBe("test_task_123");
    expect(parsed[0].assigned_to).toBe("tinyRobot/tinyRobot1");
    expect(parsed[1].assigned_to).toBe("tinyRobot/tinyRobot2");
  });

  it("returns tasks with no filters", async () => {
    const client = mockClient();
    const tool = listTasksTool(client);
    await tool.execute("id", {});

    expect(client.queryTasks).toHaveBeenCalledWith({});
  });
});
