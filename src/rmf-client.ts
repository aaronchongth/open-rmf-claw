import type {
  CancelTaskRequest,
  DispatchTaskRequest,
  PluginConfig,
  TaskCancelResponse,
  TaskDispatchResponse,
  TaskQueryFilters,
  TaskRequest,
  TaskState,
} from "./types.js";

export class RmfClient {
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor(config: PluginConfig) {
    this.baseUrl = config.apiServerUrl.replace(/\/+$/, "");
    this.headers = { "Content-Type": "application/json" };
    if (config.jwtToken) {
      this.headers["Authorization"] = `Bearer ${config.jwtToken}`;
    }
  }

  async dispatchTask(request: TaskRequest): Promise<TaskDispatchResponse> {
    const body: DispatchTaskRequest = {
      type: "dispatch_task_request",
      request,
    };
    const res = await fetch(`${this.baseUrl}/tasks/dispatch_task`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify(body),
    });
    if (!res.ok && res.status !== 400) {
      throw new Error(
        `dispatch_task failed: ${res.status} ${await res.text()}`
      );
    }
    return (await res.json()) as TaskDispatchResponse;
  }

  async cancelTask(
    taskId: string,
    labels?: string[]
  ): Promise<TaskCancelResponse> {
    const body: CancelTaskRequest = {
      type: "cancel_task_request",
      task_id: taskId,
      ...(labels && { labels }),
    };
    const res = await fetch(`${this.baseUrl}/tasks/cancel_task`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      throw new Error(
        `cancel_task failed: ${res.status} ${await res.text()}`
      );
    }
    return (await res.json()) as TaskCancelResponse;
  }

  async getTaskState(taskId: string): Promise<TaskState> {
    const res = await fetch(
      `${this.baseUrl}/tasks/${encodeURIComponent(taskId)}/state`,
      { headers: this.headers }
    );
    if (!res.ok) {
      throw new Error(
        `get_task_state failed: ${res.status} ${await res.text()}`
      );
    }
    return (await res.json()) as TaskState;
  }

  async queryTasks(filters?: TaskQueryFilters): Promise<TaskState[]> {
    const params = new URLSearchParams();
    if (filters) {
      for (const [key, value] of Object.entries(filters)) {
        if (value !== undefined) {
          params.set(key, String(value));
        }
      }
    }
    const query = params.toString();
    const url = `${this.baseUrl}/tasks${query ? `?${query}` : ""}`;
    const res = await fetch(url, { headers: this.headers });
    if (!res.ok) {
      throw new Error(`query_tasks failed: ${res.status} ${await res.text()}`);
    }
    return (await res.json()) as TaskState[];
  }
}
