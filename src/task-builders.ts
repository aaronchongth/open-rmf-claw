import type { TaskRequest } from "./types.js";

function baseRequest(
  category: string,
  description: unknown,
  opts: { fleet?: string; requester?: string },
  sim: boolean
): TaskRequest {
  const now = sim ? 0 : Date.now();
  return {
    category,
    description,
    unix_millis_request_time: now,
    unix_millis_earliest_start_time: now,
    requester: opts.requester ?? "openclaw_plugin",
    labels: ["source=openclaw"],
    ...(opts.fleet && { fleet_name: opts.fleet }),
  };
}

/**
 * Build a go-to-place task (compose category).
 * Ref: dispatch_go_to_place.py:167-200
 */
export function buildGoToPlaceTask(params: {
  place: string;
  orientation?: number;
  fleet?: string;
  requester?: string;
  sim?: boolean;
}): TaskRequest {
  const placeJson: Record<string, unknown> = { waypoint: params.place };
  if (params.orientation !== undefined) {
    placeJson.orientation = (params.orientation * Math.PI) / 180.0;
  }

  const goToDescription = { one_of: [placeJson] };
  const goToActivity = {
    category: "go_to_place",
    description: goToDescription,
  };

  return baseRequest(
    "compose",
    {
      category: "go_to_place",
      phases: [{ activity: goToActivity }],
    },
    params,
    params.sim ?? false
  );
}

/**
 * Build a patrol task (patrol category).
 * Ref: dispatch_patrol.py:144-151
 */
export function buildPatrolTask(params: {
  places: string[];
  rounds?: number;
  fleet?: string;
  requester?: string;
  sim?: boolean;
}): TaskRequest {
  return baseRequest(
    "patrol",
    {
      places: params.places,
      rounds: params.rounds ?? 1,
    },
    params,
    params.sim ?? false
  );
}

/**
 * Build a clean task (compose category).
 * Ref: dispatch_clean.py:140-170
 */
export function buildCleanTask(params: {
  zone: string;
  fleet?: string;
  requester?: string;
  sim?: boolean;
}): TaskRequest {
  const activities = [
    {
      category: "go_to_place",
      description: params.zone,
    },
    {
      category: "perform_action",
      description: {
        unix_millis_action_duration_estimate: 60000,
        category: "clean",
        expected_finish_location: params.zone,
        description: { zone: params.zone },
        use_tool_sink: true,
      },
    },
  ];

  return baseRequest(
    "compose",
    {
      category: "clean",
      phases: [
        {
          activity: {
            category: "sequence",
            description: { activities },
          },
        },
      ],
    },
    params,
    params.sim ?? false
  );
}

/**
 * Build a single delivery task (delivery category).
 * Ref: dispatch_delivery.py:242-247
 */
export function buildDeliveryTask(params: {
  pickup: { place: string; handler: string; payload?: string };
  dropoff: { place: string; handler: string; payload?: string };
  fleet?: string;
  requester?: string;
  sim?: boolean;
}): TaskRequest {
  return baseRequest(
    "delivery",
    {
      pickup: {
        place: params.pickup.place,
        handler: params.pickup.handler,
        payload: params.pickup.payload
          ? [{ sku: params.pickup.payload, quantity: 1 }]
          : [],
      },
      dropoff: {
        place: params.dropoff.place,
        handler: params.dropoff.handler,
        payload: params.dropoff.payload
          ? [{ sku: params.dropoff.payload, quantity: 1 }]
          : [],
      },
    },
    params,
    params.sim ?? false
  );
}

/**
 * Build a freeform compose task (advanced).
 * User provides the raw category and phases array.
 */
export function buildComposeTask(params: {
  category: string;
  phases: unknown[];
  fleet?: string;
  requester?: string;
  sim?: boolean;
}): TaskRequest {
  return baseRequest(
    "compose",
    {
      category: params.category,
      phases: params.phases,
    },
    params,
    params.sim ?? false
  );
}
