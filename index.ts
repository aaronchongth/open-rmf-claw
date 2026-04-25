import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { RmfClient } from "./src/rmf-client.js";
import type { PluginConfig } from "./src/types.js";
import { cancelTaskTool } from "./src/tools/cancel-task.js";
import { dispatchCleanTool } from "./src/tools/dispatch-clean.js";
import { dispatchComposeTool } from "./src/tools/dispatch-compose.js";
import { dispatchDeliveryTool } from "./src/tools/dispatch-delivery.js";
import { dispatchGoToPlaceTool } from "./src/tools/dispatch-go-to-place.js";
import { dispatchPatrolTool } from "./src/tools/dispatch-patrol.js";
import { getTaskStatusTool } from "./src/tools/get-task-status.js";
import { listTasksTool } from "./src/tools/list-tasks.js";

export default definePluginEntry({
  register(api) {
    const config: PluginConfig = {
      apiServerUrl:
        (api.config.apiServerUrl as string) ?? "http://localhost:8000",
      jwtToken: api.config.jwtToken as string | undefined,
      defaultRequester:
        (api.config.defaultRequester as string) ?? "openclaw_plugin",
      useSimTime: (api.config.useSimTime as boolean) ?? false,
    };

    const client = new RmfClient(config);

    api.registerTool(dispatchGoToPlaceTool(client, config));
    api.registerTool(dispatchPatrolTool(client, config));
    api.registerTool(dispatchCleanTool(client, config));
    api.registerTool(dispatchDeliveryTool(client, config));
    api.registerTool(dispatchComposeTool(client, config));
    api.registerTool(cancelTaskTool(client));
    api.registerTool(getTaskStatusTool(client));
    api.registerTool(listTasksTool(client));
  },
});
