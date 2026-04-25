/**
 * TypeScript interfaces matching the rmf-web API server Pydantic models.
 * See: rmf-web/packages/api-server/api_server/models/rmf_api/
 */

// --- Task Request ---

export interface TaskRequest {
  unix_millis_earliest_start_time?: number;
  unix_millis_request_time?: number;
  priority?: Record<string, unknown>;
  category: string;
  description: unknown;
  labels?: string[];
  requester?: string;
  fleet_name?: string;
}

export interface DispatchTaskRequest {
  type: "dispatch_task_request";
  request: TaskRequest;
}

// --- Task Response ---

export interface ApiError {
  code?: number;
  category?: string;
  detail?: string;
}

export interface TaskDispatchResponseSuccess {
  success: true;
  state: TaskState;
}

export interface TaskDispatchResponseFailure {
  success: false;
  errors?: ApiError[];
}

export type TaskDispatchResponse =
  | TaskDispatchResponseSuccess
  | TaskDispatchResponseFailure;

// --- Cancel Task ---

export interface CancelTaskRequest {
  type: "cancel_task_request";
  task_id: string;
  labels?: string[];
}

export interface TaskCancelResponse {
  success: boolean;
}

// --- Task State ---

export interface TaskBooking {
  id: string;
  unix_millis_earliest_start_time?: number;
  unix_millis_request_time?: number;
  priority?: Record<string, unknown> | string;
  labels?: string[];
  requester?: string;
}

export interface AssignedTo {
  group: string;
  name: string;
}

export interface TaskAssignment {
  fleet_name?: string;
  expected_robot_name?: string;
}

export interface TaskDispatch {
  status:
    | "queued"
    | "selected"
    | "dispatched"
    | "failed_to_assign"
    | "canceled_in_flight";
  assignment?: TaskAssignment;
  errors?: ApiError[];
}

export type TaskStatus =
  | "uninitialized"
  | "blocked"
  | "error"
  | "failed"
  | "queued"
  | "standby"
  | "underway"
  | "delayed"
  | "skipped"
  | "canceled"
  | "killed"
  | "completed";

export interface TaskState {
  booking: TaskBooking;
  category?: string;
  detail?: unknown;
  unix_millis_start_time?: number;
  unix_millis_finish_time?: number;
  status?: TaskStatus;
  assigned_to?: AssignedTo;
  dispatch?: TaskDispatch;
}

// --- Query Filters ---

export interface TaskQueryFilters {
  task_id?: string;
  category?: string;
  assigned_to?: string;
  requester?: string;
  status?: string;
  label?: string;
  limit?: number;
  offset?: number;
}

// --- Plugin Config ---

export interface PluginConfig {
  apiServerUrl: string;
  jwtToken?: string;
  defaultRequester: string;
  useSimTime: boolean;
}
