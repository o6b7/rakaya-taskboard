export type Priority = "Low" | "Medium" | "High";

export type ColumnType = "backlog" | "todo" | "inprogress" | "needreview" | "done";

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  column: ColumnType;
  assigneeIds?: string[]; 
  attachments?: string[]; 
  comments?: string[]; 
  createdAt: string;
  deadline: string;
  projectId?: string;
}

export type NewTask = Omit<Task, "id">;
