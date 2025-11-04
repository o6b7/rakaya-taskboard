export interface Project {
  id: string;
  name: string;
  description: string;
  iconName: string;
  createdAt: string;
  deadline: string;
  ownerId: string; 
  members?: string[]; 
  visibility: string;
  tags?: string[];
}

export type NewProject = Omit<Project, "id">;
