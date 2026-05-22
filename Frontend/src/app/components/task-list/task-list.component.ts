import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { finalize } from 'rxjs/operators';
import { TaskService } from '../../services/task.service';
import { ProjectService, Project } from '../../services/project.service';
import { AuthService } from '../../services/auth.service';
import { Task } from '../../models/task';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './task-list.component.html',
  animations: [
    trigger('listAnimation', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(20px)' }),
          stagger(100, [
            animate('0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true }),
        query(':leave', [
          stagger(50, [
            animate('0.3s ease-out', style({ opacity: 0, transform: 'scale(0.9)' }))
          ])
        ], { optional: true })
      ])
    ])
  ]
})
export class TaskListComponent implements OnInit {
  tasks = signal<Task[]>([]);
  projects = signal<Project[]>([]);
  selectedProjectId = signal<number | null>(null);
  isLoading = signal<boolean>(true);
  successMessage = signal<string>('');
  errorMessage = signal<string>('');

  private taskService = inject(TaskService);
  private projectService = inject(ProjectService);
  private authService = inject(AuthService);

  totalTasks = computed(() => this.tasks().length);
  completedTasks = computed(() => this.tasks().filter(t => t.status === 'Completed').length);
  inProgressTasks = computed(() => this.tasks().filter(t => t.status === 'In Progress').length);
  todoTasks = computed(() => this.tasks().filter(t => t.status === 'Todo' || !t.status).length);

  ngOnInit(): void {
    this.loadProjects();
    this.loadTasks();
  }

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  getCurrentUserId(): number {
    return this.authService.getCurrentUser()?.userId || 0;
  }

  loadProjects(): void {
    this.projectService.getProjects().subscribe({
      next: (projs) => this.projects.set(projs),
      error: (err) => console.error('Failed to load projects', err)
    });
  }

  loadTasks(): void {
    this.isLoading.set(true);
    const projId = this.selectedProjectId();
    this.taskService.getTasks(projId || undefined)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (data) => this.tasks.set(data),
        error: (err) => console.error('Error loading tasks', err)
      });
  }

  onProjectFilterChange(selectElem: HTMLSelectElement): void {
    const val = selectElem.value;
    if (val === '') {
      this.selectedProjectId.set(null);
    } else {
      this.selectedProjectId.set(parseInt(val));
    }
    this.loadTasks();
  }

  deleteTask(id: number): void {
    if (!this.isAdmin()) return;
    if (confirm('Are you sure you want to delete this task?')) {
      this.taskService.deleteTask(id).subscribe({
        next: () => {
          this.tasks.update(t => t.filter(task => task.id !== id));
          this.successMessage.set('Task deleted successfully.');
          setTimeout(() => this.successMessage.set(''), 3000);
        },
        error: (err) => console.error('Error deleting task', err)
      });
    }
  }

  changeStatus(task: Task, newStatus: string): void {
    // Both Admin and assigned members can change status
    const updatedFields = { status: newStatus };
    
    this.taskService.updateTask(task.id, updatedFields).subscribe({
      next: () => {
        // Local state update
        this.tasks.update(t => t.map(tItem => tItem.id === task.id ? { ...tItem, status: newStatus } : tItem));
        this.successMessage.set(`Task status updated to "${newStatus}".`);
        setTimeout(() => this.successMessage.set(''), 3000);
      },
      error: (err) => {
        this.errorMessage.set('Failed to update task status.');
        setTimeout(() => this.errorMessage.set(''), 4000);
        console.error('Error updating status', err);
      }
    });
  }

  cycleStatus(task: Task): void {
    // Convenience cycling on click
    let nextStatus = 'Todo';
    if (task.status === 'Todo' || !task.status) {
      nextStatus = 'In Progress';
    } else if (task.status === 'In Progress') {
      nextStatus = 'Completed';
    } else if (task.status === 'Completed') {
      nextStatus = 'Todo';
    }
    this.changeStatus(task, nextStatus);
  }

  isTaskOverdue(task: Task): boolean {
    if (task.status === 'Completed') return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(task.dueDate) < today;
  }
}
