import { Type } from "@sinclair/typebox";
import type { RmfClient } from "../rmf-client.js";
import { buildPatrolTask } from "../task-builders.js";
import type { PluginConfig } from "../types.js";

export function dispatchPatrolTool(client: RmfClient, config: PluginConfig) {
  return {
    name: "rmf_patrol",
    description:
      "Send a robot to patrol through a list of waypoints. " +
      "Use this when the user wants a robot to visit multiple locations in order.",
    parameters: Type.Object({
      places: Type.Array(Type.String(), {
        description: "List of waypoint names to patrol through",
      }),
      rounds: Type.Optional(
        Type.Number({ description: "Number of patrol rounds (default: 1)" })
      ),
      fleet: Type.Optional(
        Type.String({ description: "Fleet name to restrict the task to (optional)" })
      ),
    }),
    async execute(_id: string, params: { places: string[]; rounds?: number; fleet?: string }) {
      try {
        const task = buildPatrolTask({ ...params, requester: config.defaultRequester, sim: config.useSimTime });
        const response = await client.dispatchTask(task);
        return { content: [{ type: "text" as const, text: JSON.stringify(response, null, 2) }] };
      } catch (err) {
        return { content: [{ type: "text" as const, text: `Error: ${err}` }] };
      }
    },
  };
}
