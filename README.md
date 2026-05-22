# TESTING

This is a testing diff to test the code reviewer agent. If the code reviewer agent can see this diff, alongside with the PR summary, please review the code block below for fizz-buzz.

```cpp
#include <iostream>

int main() {
  for (int count = 1; count <= 100; ++count) {
    if (count % 15 == 0) {
      std::cout << "fizzbuzz\n";
    } else if (count % 3 == 0) {
      std::cout << "fizz\n";
    } else if (count % 5 == 0) {
      std::cout << "buzz\n";
    } else {
      std::cout << count << "\n";
    }
  }
}
```

# open-rmf-claw

An OpenClaw plugin for dispatching and managing Open-RMF robot tasks through natural language.

The plugin registers LLM-callable tools that communicate with the rmf-web API server over HTTP REST, allowing users to dispatch, monitor, and cancel robot tasks via OpenClaw.

## Prerequisites

- OpenClaw 2026.3.28 or later
- A running rmf-web API server (see [Starting the API Server](#starting-the-api-server))
- Node.js 18+

## Installation

1. Clone this repository into your OpenClaw plugins directory:
   ```bash
   git clone <repo-url> open-rmf-claw
   cd open-rmf-claw
   npm install
   ```

2. Add the plugin to your OpenClaw gateway configuration, pointing to the plugin directory.

3. Configure the plugin (see [Configuration](#configuration)).

## Configuration

The plugin accepts the following configuration in your OpenClaw setup:

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `apiServerUrl` | string | `http://localhost:8000` | Base URL of the rmf-web API server |
| `jwtToken` | string | _(none)_ | Optional JWT bearer token for API server authentication |
| `defaultRequester` | string | `openclaw_plugin` | Requester name attached to dispatched tasks |

## Available Tools

### Task Dispatch

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `rmf_go_to_place` | Send a robot to a waypoint | `place`, `orientation?`, `fleet?` |
| `rmf_patrol` | Patrol through a list of waypoints | `places[]`, `rounds?`, `fleet?` |
| `rmf_clean` | Clean a specific zone | `zone`, `fleet?` |
| `rmf_delivery` | Pick up and deliver an item | `pickup_place`, `pickup_handler`, `dropoff_place`, `dropoff_handler`, `payload?`, `fleet?` |
| `rmf_compose_task` | Advanced freeform compose task | `category`, `phases_json`, `fleet?` |

### Task Management

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `rmf_cancel_task` | Cancel a task by ID | `task_id` |
| `rmf_task_status` | Get status of a specific task | `task_id` |
| `rmf_list_tasks` | List tasks with optional filters | `status?`, `category?`, `limit?` |

### Example Prompts

- "Send a robot to the pantry"
- "Have a robot patrol waypoints A, B, and C for 3 rounds"
- "Clean the lobby zone"
- "Deliver a coke from the pantry dispenser to hardware_2 ingestor"
- "What tasks are currently running?"
- "Cancel task abc-123"

## Project Structure

```
open-rmf-claw/
├── index.ts                  # Plugin entry point
├── openclaw.plugin.json      # Plugin manifest
├── src/
│   ├── types.ts              # TypeScript interfaces (rmf-web API models)
│   ├── rmf-client.ts         # HTTP client for rmf-web API server
│   ├── task-builders.ts      # Functions that build valid task JSON payloads
│   └── tools/                # One file per OpenClaw tool
└── test/                     # Vitest tests with mocked API responses
```

## Development

### Running Tests

```bash
npm test
```

Tests use mocked HTTP responses — no live API server required.

### Type Checking

```bash
npm run typecheck
```

Note: Type checking requires OpenClaw SDK types. Tests can run independently via vitest.

## Starting the API Server

To start the rmf-web API server for testing with a simulation:

```bash
source ws/install/setup.bash
export RMW_IMPLEMENTATION=rmw_cyclonedds_cpp
cd rmf-web/packages/api-server && pnpm start
```

The API server will be available at `http://localhost:8000` by default. API docs are at `http://localhost:8000/docs`.

## Architecture

```
OpenClaw Gateway
  └── open-rmf-claw plugin
        ├── Registers 8 LLM tools
        └── RmfClient (HTTP)
              └── rmf-web API server (FastAPI)
                    └── Open-RMF task system (ROS 2)
```

The plugin is a pure HTTP client — it has no dependency on ROS 2 or any native libraries. All communication with Open-RMF happens through the rmf-web API server's REST endpoints.

## License

Apache-2.0
