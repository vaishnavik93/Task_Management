export interface Task {
  id: number;
  title: string;
  description: string;
  status: string; // "Todo", "In Progress", "Completed"
  dueDate: string;
  projectId: number;
  assignedToUserId?: number | null;
  project?: any;
  assignedToUser?: any;
}
