import { Type } from "@sinclair/typebox";
import type { RmfClient } from "../rmf-client.js";

export function listTasksTool(client: RmfClient) {
  return {
    name: "rmf_list_tasks",
    description:
      "List Open-RMF tasks with optional filters. " +
      "Use this to see what tasks are active, completed, or queued.",
    parameters: Type.Object({
      status: Type.Optional(
        Type.String({
          description:
            "Filter by status: queued, underway, completed, failed, canceled (comma-separated for multiple)",
        })
      ),
      category: Type.Optional(
        Type.String({
          description: "Filter by task category: compose, patrol, delivery, etc.",
        })
      ),
      limit: Type.Optional(
        Type.Number({ description: "Maximum number of tasks to return (default: 100)" })
      ),
    }),
    async execute(
      _id: string,
      params: { status?: string; category?: string; limit?: number }
    ) {
      try {
        const tasks = await client.queryTasks(params);
        const summary = tasks.map((t) => ({
          id: t.booking.id,
          category: t.category,
          status: t.status,
          assigned_to: t.assigned_to
            ? `${t.assigned_to.group}/${t.assigned_to.name}`
            : null,
          requester: t.booking.requester,
        }));
        return {
          content: [{ type: "text" as const, text: JSON.stringify(summary, null, 2) }],
        };
      } catch (err) {
        return { content: [{ type: "text" as const, text: `Error: ${err}` }] };
      }
    },
  };
}
