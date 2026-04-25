import type {
  TaskCancelResponse,
  TaskDispatchResponse,
  TaskState,
} from "../src/types.js";

export const mockTaskState: TaskState = {
  booking: {
    id: "test_task_123",
    unix_millis_earliest_start_time: 1700000000000,
    unix_millis_request_time: 1700000000000,
    labels: ["source=openclaw"],
    requester: "openclaw_plugin",
  },
  category: "compose",
  status: "queued",
  assigned_to: { group: "tinyRobot", name: "tinyRobot1" },
  dispatch: {
    status: "dispatched",
    assignment: {
      fleet_name: "tinyRobot",
      expected_robot_name: "tinyRobot1",
    },
  },
};

export const mockDispatchSuccess: TaskDispatchResponse = {
  success: true,
  state: mockTaskState,
};

export const mockDispatchFailure: TaskDispatchResponse = {
  success: false,
  errors: [
    {
      code: 1,
      category: "task_dispatch",
      detail: "No fleet available to accept the task",
    },
  ],
};

export const mockCancelSuccess: TaskCancelResponse = {
  success: true,
};

export const mockTaskList: TaskState[] = [
  mockTaskState,
  {
    booking: {
      id: "test_task_456",
      unix_millis_request_time: 1700000001000,
      requester: "openclaw_plugin",
    },
    category: "patrol",
    status: "underway",
    assigned_to: { group: "tinyRobot", name: "tinyRobot2" },
  },
];
