import { Type } from "@sinclair/typebox";
import type { RmfClient } from "../rmf-client.js";
import { buildCleanTask } from "../task-builders.js";
import type { PluginConfig } from "../types.js";

export function dispatchCleanTool(client: RmfClient, config: PluginConfig) {
  return {
    name: "rmf_clean",
    description:
      "Send a robot to clean a specific zone. " +
      "The robot will navigate to the zone and perform the cleaning action.",
    parameters: Type.Object({
      zone: Type.String({ description: "Name of the zone to clean" }),
      fleet: Type.Optional(
        Type.String({ description: "Fleet name to restrict the task to (optional)" })
      ),
    }),
    async execute(_id: string, params: { zone: string; fleet?: string }) {
      try {
        const task = buildCleanTask({ ...params, requester: config.defaultRequester, sim: config.useSimTime });
        const response = await client.dispatchTask(task);
        return { content: [{ type: "text" as const, text: JSON.stringify(response, null, 2) }] };
      } catch (err) {
        return { content: [{ type: "text" as const, text: `Error: ${err}` }] };
      }
    },
  };
}
