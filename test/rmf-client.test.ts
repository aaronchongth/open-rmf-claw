import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { RmfClient } from "../src/rmf-client.js";
import type { PluginConfig } from "../src/types.js";
import {
  mockDispatchSuccess,
  mockCancelSuccess,
  mockTaskState,
  mockTaskList,
} from "./mock-responses.js";

const baseConfig: PluginConfig = {
  apiServerUrl: "http://localhost:8000",
  defaultRequester: "openclaw_plugin",
  useSimTime: false,
};

const authConfig: PluginConfig = {
  ...baseConfig,
  jwtToken: "test-jwt-token",
};

let fetchSpy: ReturnType<typeof vi.fn>;

function mockFetch(body: unknown, status = 200) {
  fetchSpy = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 400,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  });
  vi.stubGlobal("fetch", fetchSpy);
}

beforeEach(() => {
  fetchSpy = vi.fn();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("RmfClient", () => {
  describe("dispatchTask", () => {
    it("sends correct POST request", async () => {
      mockFetch(mockDispatchSuccess);
      const client = new RmfClient(baseConfig);
      const task = { category: "patrol", description: { places: ["A"] } };

      const result = await client.dispatchTask(task);

      expect(fetchSpy).toHaveBeenCalledWith(
        "http://localhost:8000/tasks/dispatch_task",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ type: "dispatch_task_request", request: task }),
        })
      );
      expect(result).toEqual(mockDispatchSuccess);
    });

    it("includes Authorization header when JWT configured", async () => {
      mockFetch(mockDispatchSuccess);
      const client = new RmfClient(authConfig);
      await client.dispatchTask({ category: "patrol", description: {} });

      const callArgs = fetchSpy.mock.calls[0][1];
      expect(callArgs.headers.Authorization).toBe("Bearer test-jwt-token");
    });

    it("returns failure response on 400 without throwing", async () => {
      const failResponse = {
        success: false,
        errors: [{ detail: "No fleet" }],
      };
      mockFetch(failResponse, 400);
      const client = new RmfClient(baseConfig);

      const result = await client.dispatchTask({
        category: "patrol",
        description: {},
      });
      expect(result.success).toBe(false);
    });

    it("throws on non-400 error status", async () => {
      mockFetch("Internal Server Error", 500);
      const client = new RmfClient(baseConfig);

      await expect(
        client.dispatchTask({ category: "patrol", description: {} })
      ).rejects.toThrow("dispatch_task failed: 500");
    });
  });

  describe("cancelTask", () => {
    it("sends correct POST request", async () => {
      mockFetch(mockCancelSuccess);
      const client = new RmfClient(baseConfig);

      const result = await client.cancelTask("task_123");

      expect(fetchSpy).toHaveBeenCalledWith(
        "http://localhost:8000/tasks/cancel_task",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            type: "cancel_task_request",
            task_id: "task_123",
          }),
        })
      );
      expect(result).toEqual(mockCancelSuccess);
    });

    it("includes labels when provided", async () => {
      mockFetch(mockCancelSuccess);
      const client = new RmfClient(baseConfig);

      await client.cancelTask("task_123", ["reason=user_request"]);

      const body = JSON.parse(fetchSpy.mock.calls[0][1].body);
      expect(body.labels).toEqual(["reason=user_request"]);
    });
  });

  describe("getTaskState", () => {
    it("sends correct GET request", async () => {
      mockFetch(mockTaskState);
      const client = new RmfClient(baseConfig);

      const result = await client.getTaskState("task_123");

      expect(fetchSpy).toHaveBeenCalledWith(
        "http://localhost:8000/tasks/task_123/state",
        expect.objectContaining({ headers: expect.any(Object) })
      );
      expect(result).toEqual(mockTaskState);
    });

    it("encodes task ID in URL", async () => {
      mockFetch(mockTaskState);
      const client = new RmfClient(baseConfig);

      await client.getTaskState("task/with spaces");

      expect(fetchSpy.mock.calls[0][0]).toBe(
        "http://localhost:8000/tasks/task%2Fwith%20spaces/state"
      );
    });
  });

  describe("queryTasks", () => {
    it("sends GET request without filters", async () => {
      mockFetch(mockTaskList);
      const client = new RmfClient(baseConfig);

      const result = await client.queryTasks();

      expect(fetchSpy).toHaveBeenCalledWith(
        "http://localhost:8000/tasks",
        expect.any(Object)
      );
      expect(result).toEqual(mockTaskList);
    });

    it("adds query params from filters", async () => {
      mockFetch(mockTaskList);
      const client = new RmfClient(baseConfig);

      await client.queryTasks({ status: "underway", limit: 10 });

      const url = fetchSpy.mock.calls[0][0] as string;
      expect(url).toContain("status=underway");
      expect(url).toContain("limit=10");
    });

    it("skips undefined filter values", async () => {
      mockFetch(mockTaskList);
      const client = new RmfClient(baseConfig);

      await client.queryTasks({ status: "queued", category: undefined });

      const url = fetchSpy.mock.calls[0][0] as string;
      expect(url).toContain("status=queued");
      expect(url).not.toContain("category");
    });
  });

  describe("trailing slash handling", () => {
    it("strips trailing slashes from base URL", async () => {
      mockFetch(mockTaskList);
      const client = new RmfClient({
        ...baseConfig,
        apiServerUrl: "http://localhost:8000///",
      });

      await client.queryTasks();

      expect(fetchSpy.mock.calls[0][0]).toBe("http://localhost:8000/tasks");
    });
  });
});
