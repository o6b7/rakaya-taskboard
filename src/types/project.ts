export interface Project {
  id: string;
  name: string;
  description: string;
  iconName: string;
  createdAt: string;
  deadline: string;
  ownerId: string; 
  members?: string[]; 
}

export type NewProject = Omit<Project, "id">;
