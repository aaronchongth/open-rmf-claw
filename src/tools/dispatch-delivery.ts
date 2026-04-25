import { Type } from "@sinclair/typebox";
import type { RmfClient } from "../rmf-client.js";
import { buildDeliveryTask } from "../task-builders.js";
import type { PluginConfig } from "../types.js";

export function dispatchDeliveryTool(client: RmfClient, config: PluginConfig) {
  return {
    name: "rmf_delivery",
    description:
      "Send a robot to pick up an item from one location and deliver it to another. " +
      "Requires specifying pickup and dropoff places with their handler names.",
    parameters: Type.Object({
      pickup_place: Type.String({ description: "Waypoint name for the pickup location" }),
      pickup_handler: Type.String({
        description: "Name of the pickup handler (e.g. dispenser name)",
      }),
      dropoff_place: Type.String({ description: "Waypoint name for the dropoff location" }),
      dropoff_handler: Type.String({
        description: "Name of the dropoff handler (e.g. ingestor name)",
      }),
      payload: Type.Optional(
        Type.String({ description: "Payload SKU identifier (optional)" })
      ),
      fleet: Type.Optional(
        Type.String({ description: "Fleet name to restrict the task to (optional)" })
      ),
    }),
    async execute(
      _id: string,
      params: {
        pickup_place: string;
        pickup_handler: string;
        dropoff_place: string;
        dropoff_handler: string;
        payload?: string;
        fleet?: string;
      }
    ) {
      try {
        const task = buildDeliveryTask({
          pickup: {
            place: params.pickup_place,
            handler: params.pickup_handler,
            payload: params.payload,
          },
          dropoff: {
            place: params.dropoff_place,
            handler: params.dropoff_handler,
            payload: params.payload,
          },
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
