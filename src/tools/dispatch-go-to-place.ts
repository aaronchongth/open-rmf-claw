import { Type } from "@sinclair/typebox";
import type { RmfClient } from "../rmf-client.js";
import { buildGoToPlaceTask } from "../task-builders.js";
import type { PluginConfig } from "../types.js";

export function dispatchGoToPlaceTool(client: RmfClient, config: PluginConfig) {
  return {
    name: "rmf_go_to_place",
    description:
      "Send a robot to a specific location or waypoint in the facility. " +
      "Use this when the user wants a robot to navigate to a named place.",
    parameters: Type.Object({
      place: Type.String({ description: "Name of the waypoint to navigate to" }),
      orientation: Type.Optional(
        Type.Number({ description: "Desired orientation in degrees (optional)" })
      ),
      fleet: Type.Optional(
        Type.String({ description: "Fleet name to restrict the task to (optional)" })
      ),
    }),
    async execute(_id: string, params: { place: string; orientation?: number; fleet?: string }) {
      try {
        const task = buildGoToPlaceTask({ ...params, requester: config.defaultRequester, sim: config.useSimTime });
        const response = await client.dispatchTask(task);
        return { content: [{ type: "text" as const, text: JSON.stringify(response, null, 2) }] };
      } catch (err) {
        return { content: [{ type: "text" as const, text: `Error: ${err}` }] };
      }
    },
  };
}
