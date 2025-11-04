export type Priority = "Low" | "Medium" | "High";

export type ColumnType = "backlog" | "todo" | "inprogress" | "needreview" | "done";

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  assigneeId: string;
  column: ColumnType;
  tags?: string[];
  createdAt: string;
  deadline: string;
  projectId?: string;
}

export type NewTask = Omit<Task, "id">;
