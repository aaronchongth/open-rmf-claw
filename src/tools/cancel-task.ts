import { Type } from "@sinclair/typebox";
import type { RmfClient } from "../rmf-client.js";

export function cancelTaskTool(client: RmfClient) {
  return {
    name: "rmf_cancel_task",
    description:
      "Cancel an active Open-RMF task by its task ID. " +
      "Use this when the user wants to stop a task that is queued or underway.",
    parameters: Type.Object({
      task_id: Type.String({ description: "The ID of the task to cancel" }),
    }),
    async execute(_id: string, params: { task_id: string }) {
      try {
        const response = await client.cancelTask(params.task_id);
        return { content: [{ type: "text" as const, text: JSON.stringify(response, null, 2) }] };
      } catch (err) {
        return { content: [{ type: "text" as const, text: `Error: ${err}` }] };
      }
    },
  };
}
