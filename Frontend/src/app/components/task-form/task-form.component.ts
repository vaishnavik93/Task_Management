import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { TaskService } from '../../services/task.service';
import { Task } from '../../models/task';
import { finalize } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './task-form.component.html'
})
export class TaskFormComponent implements OnInit {
  taskForm: FormGroup;
  isEditMode = false;
  taskId: number | null = null;
  errorMessage = signal<string>('');
  isSaving = signal<boolean>(false);

  constructor(
    private fb: FormBuilder,
    private taskService: TaskService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.taskForm = this.fb.group({
      id: [0],
      title: ['', [Validators.required, Validators.maxLength(100)]],
      description: [''],
      isCompleted: [false],
      dueDate: [new Date().toISOString().split('T')[0]]
    });
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEditMode = true;
      this.taskId = +idParam;
      this.loadTask(this.taskId);
    }
  }

  loadTask(id: number): void {
    this.taskService.getTask(id).subscribe({
      next: (task) => {
        const formattedDate = new Date(task.dueDate).toISOString().split('T')[0];
        this.taskForm.patchValue({
          ...task,
          dueDate: formattedDate
        });
      },
      error: (err) => {
        this.errorMessage.set('Failed to load task. It may have been deleted.');
        console.error(err);
      }
    });
  }

  onSubmit(): void {
    if (this.taskForm.invalid) {
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set('');
    const taskData: Task = this.taskForm.value;

    const request$: Observable<any> = this.isEditMode 
      ? this.taskService.updateTask(taskData.id, taskData)
      : this.taskService.createTask({ ...taskData, id: 0 });

    request$.pipe(
      finalize(() => this.isSaving.set(false))
    ).subscribe({
      next: () => {
        // Immediate navigation. Using replaceUrl avoids back-btn ghost states
        this.router.navigate(['/tasks'], { replaceUrl: true });
      },
      error: (err: any) => {
        this.errorMessage.set(`Failed to ${this.isEditMode ? 'update' : 'create'} task.`);
        console.error(err);
      }
    });
  }

  get f() { return this.taskForm.controls; }
}
