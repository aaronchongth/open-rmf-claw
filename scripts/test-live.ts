#!/usr/bin/env npx tsx
/**
 * Live integration test against a running rmf-web API server.
 *
 * Usage:
 *   # Start simulation + API server first, then:
 *   npx tsx scripts/test-live.ts
 *
 *   # Or with a custom API server URL:
 *   API_SERVER_URL=http://192.168.1.100:8000 npx tsx scripts/test-live.ts
 *
 *   # To dispatch a task (not just read-only):
 *   npx tsx scripts/test-live.ts --dispatch
 */

import { createHmac } from "node:crypto";
import { RmfClient } from "../src/rmf-client.js";
import {
  buildGoToPlaceTask,
  buildPatrolTask,
  buildCleanTask,
} from "../src/task-builders.js";

// --- JWT token generation for the default API server config ---
// Default config: jwt_secret="rmfisawesome", aud="rmf_api_server", iss="stub"

function makeJwt(
  secret: string,
  payload: Record<string, unknown>
): string {
  const header = { alg: "HS256", typ: "JWT" };
  const b64url = (obj: unknown) =>
    Buffer.from(JSON.stringify(obj))
      .toString("base64url");
  const segments = [b64url(header), b64url(payload)];
  const signature = createHmac("sha256", secret)
    .update(segments.join("."))
    .digest("base64url");
  segments.push(signature);
  return segments.join(".");
}

const JWT_SECRET = process.env.JWT_SECRET ?? "rmfisawesome";
const token = makeJwt(JWT_SECRET, {
  preferred_username: "admin",
  aud: "rmf_api_server",
  iss: "stub",
  exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
});

const API_URL = process.env.API_SERVER_URL ?? "http://localhost:8000";
const DISPATCH = process.argv.includes("--dispatch");
const USE_SIM_TIME = process.argv.includes("--sim");

const client = new RmfClient({
  apiServerUrl: API_URL,
  jwtToken: token,
  defaultRequester: "openclaw_plugin",
  useSimTime: USE_SIM_TIME,
});

async function testConnection() {
  console.log(`\n--- Connecting to API server at ${API_URL} ---\n`);
  try {
    const tasks = await client.queryTasks({ limit: 5 });
    console.log(`Connected. Found ${tasks.length} task(s).`);
    for (const t of tasks) {
      console.log(
        `  [${t.status ?? "unknown"}] ${t.booking.id} (${t.category ?? "?"})` +
          (t.assigned_to
            ? ` -> ${t.assigned_to.group}/${t.assigned_to.name}`
            : "")
      );
    }
    return true;
  } catch (err) {
    console.error(`Failed to connect: ${err}`);
    return false;
  }
}

async function testDispatch() {
  console.log(`\n--- Dispatching a go_to_place task ---\n`);

  // Build a simple go-to-place task. Change the place name to match your
  // simulation's nav graph waypoints.
  const task = buildGoToPlaceTask({ place: "pantry", sim: USE_SIM_TIME });
  console.log("Request payload:");
  console.log(JSON.stringify(task, null, 2));

  const response = await client.dispatchTask(task);
  console.log("\nResponse:");
  console.log(JSON.stringify(response, null, 2));

  if (response.success) {
    const taskId = response.state.booking.id;
    console.log(`\nTask dispatched: ${taskId}`);

    // Poll status once after a short delay
    await new Promise((r) => setTimeout(r, 2000));
    console.log("\n--- Checking task status ---\n");
    const state = await client.getTaskState(taskId);
    console.log(
      `Status: ${state.status}` +
        (state.assigned_to
          ? ` | Assigned to: ${state.assigned_to.group}/${state.assigned_to.name}`
          : "")
    );
  }
}

async function showBuilderExamples() {
  console.log(`\n--- Task builder output examples ---\n`);

  console.log(`go_to_place('pantry') [sim=${USE_SIM_TIME}]:`);
  console.log(JSON.stringify(buildGoToPlaceTask({ place: "pantry", sim: USE_SIM_TIME }), null, 2));

  console.log(`\npatrol(['A', 'B', 'C'], rounds=2) [sim=${USE_SIM_TIME}]:`);
  console.log(
    JSON.stringify(
      buildPatrolTask({ places: ["A", "B", "C"], rounds: 2, sim: USE_SIM_TIME }),
      null,
      2
    )
  );

  console.log(`\nclean('cleaning_zone_1') [sim=${USE_SIM_TIME}]:`);
  console.log(
    JSON.stringify(buildCleanTask({ zone: "cleaning_zone_1", sim: USE_SIM_TIME }), null, 2)
  );
}

async function main() {
  const connected = await testConnection();
  if (!connected) {
    console.log(
      "\nMake sure the API server is running:\n" +
        "  source ws/install/setup.bash\n" +
        "  export RMW_IMPLEMENTATION=rmw_cyclonedds_cpp\n" +
        "  cd rmf-web/packages/api-server && pnpm start\n"
    );
    process.exit(1);
  }

  if (DISPATCH) {
    await testDispatch();
  } else {
    await showBuilderExamples();
    console.log(
      "\nRun with --dispatch to actually send a task to the fleet manager."
    );
  }
}

main().catch(console.error);
