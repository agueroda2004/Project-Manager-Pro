import {
  PROJECT_STATUS_LABELS,
  TASK_STATUS_LABELS,
  PRIORITY_LABELS,
  MILESTONE_STATUS_LABELS,
  TASK_STATUS_COLORS,
  PRIORITY_COLORS,
  PROJECT_STATUS_COLORS,
  MILESTONE_STATUS_COLORS,
  type ProjectStatus,
  type TaskStatus,
  type Priority,
  type MilestoneStatus,
} from "../../types";
import { Badge } from "./Badge";

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  const color = PROJECT_STATUS_COLORS[status];
  return (
    <Badge tone="neutral" variant="soft">
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
      {PROJECT_STATUS_LABELS[status]}
    </Badge>
  );
}

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const color = TASK_STATUS_COLORS[status];
  return (
    <Badge tone="neutral" variant="soft">
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
      {TASK_STATUS_LABELS[status]}
    </Badge>
  );
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const color = PRIORITY_COLORS[priority];
  return (
    <Badge tone="neutral" variant="soft">
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
      {PRIORITY_LABELS[priority]}
    </Badge>
  );
}

export function MilestoneStatusBadge({ status }: { status: MilestoneStatus }) {
  const color = MILESTONE_STATUS_COLORS[status];
  return (
    <Badge tone="neutral" variant="soft">
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
      {MILESTONE_STATUS_LABELS[status]}
    </Badge>
  );
}
