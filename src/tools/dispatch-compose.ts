import { Type } from "@sinclair/typebox";
import type { RmfClient } from "../rmf-client.js";
import { buildComposeTask } from "../task-builders.js";
import type { PluginConfig } from "../types.js";

export function dispatchComposeTool(client: RmfClient, config: PluginConfig) {
  return {
    name: "rmf_compose_task",
    description:
      "Dispatch an advanced compose task with custom phases. " +
      "Use this for complex multi-step tasks that don't fit the standard task types. " +
      "The phases_json parameter should be a JSON string representing an array of phase objects.",
    parameters: Type.Object({
      category: Type.String({
        description: "Task category label (e.g. 'multi_delivery', 'custom_workflow')",
      }),
      phases_json: Type.String({
        description:
          'JSON string of the phases array, e.g. ' +
          '[{"activity":{"category":"sequence","description":{"activities":[...]}}}]',
      }),
      fleet: Type.Optional(
        Type.String({ description: "Fleet name to restrict the task to (optional)" })
      ),
    }),
    async execute(
      _id: string,
      params: { category: string; phases_json: string; fleet?: string }
    ) {
      try {
        const phases = JSON.parse(params.phases_json) as unknown[];
        const task = buildComposeTask({
          category: params.category,
          phases,
          fleet: params.fleet,
          requester: config.defaultRequester,
          sim: config.useSimTime,
        });
        const response = await client.dispatchTask(task);
        return { content: [{ type: "text" as const, text: JSON.stringify(response, null, 2) }] };
      } catch (err) {
        return { content: [{ type: "text" as const, text: `Error: ${err}` }] };
      }
    },
  };
}
