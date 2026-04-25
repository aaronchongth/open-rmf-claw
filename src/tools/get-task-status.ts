import { Type } from "@sinclair/typebox";
import type { RmfClient } from "../rmf-client.js";

export function getTaskStatusTool(client: RmfClient) {
  return {
    name: "rmf_task_status",
    description:
      "Get the current status and details of a specific Open-RMF task by its ID. " +
      "Returns the task state including status, assigned robot, and progress.",
    parameters: Type.Object({
      task_id: Type.String({ description: "The ID of the task to check" }),
    }),
    async execute(_id: string, params: { task_id: string }) {
      try {
        const state = await client.getTaskState(params.task_id);
        return { content: [{ type: "text" as const, text: JSON.stringify(state, null, 2) }] };
      } catch (err) {
        return { content: [{ type: "text" as const, text: `Error: ${err}` }] };
      }
    },
  };
}
