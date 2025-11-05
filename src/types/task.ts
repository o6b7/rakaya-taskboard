export type Priority = "Low" | "Medium" | "High";

export type ColumnType = "backlog" | "todo" | "inprogress" | "needreview" | "done";

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  column: ColumnType;
  creatorId: string;
  assigneeIds?: string[]; 
  attachments?: string[]; 
  comments?: string[]; 
  createdAt: string;
  deadline: string;
  projectId: string;
  pinned?: boolean;
}

export type NewTask = Omit<Task, "id">;

