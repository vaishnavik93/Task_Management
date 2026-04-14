import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { finalize } from 'rxjs/operators';
import { TaskService } from '../../services/task.service';
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
  isLoading = signal<boolean>(true);

  totalTasks = computed(() => this.tasks().length);
  completedTasks = computed(() => this.tasks().filter(t => t.isCompleted).length);
  pendingTasks = computed(() => this.tasks().filter(t => !t.isCompleted).length);

  constructor(private taskService: TaskService) { }

  ngOnInit(): void {
    this.loadTasks();
  }

  loadTasks(): void {
    this.isLoading.set(true);
    this.taskService.getTasks()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (data) => this.tasks.set(data),
        error: (err) => console.error('Error loading tasks', err)
      });
  }

  deleteTask(id: number): void {
    if (confirm('Are you sure you want to delete this task?')) {
      this.taskService.deleteTask(id).subscribe({
        next: () => {
          // Update signal locally for instant UI feedback or reload
          this.tasks.update(t => t.filter(task => task.id !== id));
        },
        error: (err) => console.error('Error deleting task', err)
      });
    }
  }

  toggleComplete(task: Task): void {
    const updatedTask = { ...task, isCompleted: !task.isCompleted };
    this.taskService.updateTask(task.id, updatedTask).subscribe({
      next: () => {
        // Optimistic UI update via signal
        this.tasks.update(t => t.map(tItem => tItem.id === task.id ? updatedTask : tItem));
      },
      error: (err) => console.error('Error updating task', err)
    });
  }
}
