import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { TaskService } from '../../services/task.service';
import { ProjectService, Project } from '../../services/project.service';
import { AuthService } from '../../services/auth.service';
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

  // Lists for dropdowns
  projects = signal<Project[]>([]);
  projectMembers = signal<any[]>([]);

  private fb = inject(FormBuilder);
  private taskService = inject(TaskService);
  private projectService = inject(ProjectService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  constructor() {
    this.taskForm = this.fb.group({
      id: [0],
      title: ['', [Validators.required, Validators.maxLength(100)]],
      description: [''],
      status: ['Todo', [Validators.required]],
      dueDate: [new Date().toISOString().split('T')[0], [Validators.required]],
      projectId: ['', [Validators.required]],
      assignedToUserId: ['']
    });
  }

  ngOnInit(): void {
    // RBAC: Verify if the user is an Admin. If not, redirect to dashboard.
    if (!this.authService.isAdmin()) {
      this.router.navigate(['/dashboard']);
      return;
    }

    this.loadProjects();

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEditMode = true;
      this.taskId = +idParam;
      this.loadTask(this.taskId);
    }

    // Subscribe to projectId changes to load that project's members dynamically
    this.taskForm.get('projectId')?.valueChanges.subscribe(projId => {
      if (projId) {
        this.loadProjectMembers(projId);
      } else {
        this.projectMembers.set([]);
      }
    });
  }

  loadProjects(): void {
    this.projectService.getProjects().subscribe({
      next: (projs) => this.projects.set(projs),
      error: (err) => console.error('Failed to load projects', err)
    });
  }

  loadProjectMembers(projectId: number): void {
    this.projectService.getProjectMembers(projectId).subscribe({
      next: (members) => {
        this.projectMembers.set(members);
      },
      error: (err) => console.error('Failed to load project members', err)
    });
  }

  loadTask(id: number): void {
    this.taskService.getTask(id).subscribe({
      next: (task) => {
        const formattedDate = new Date(task.dueDate).toISOString().split('T')[0];
        
        // Load members of this project first
        this.loadProjectMembers(task.projectId);

        this.taskForm.patchValue({
          id: task.id,
          title: task.title,
          description: task.description,
          status: task.status || 'Todo',
          dueDate: formattedDate,
          projectId: task.projectId,
          assignedToUserId: task.assignedToUserId || ''
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
    
    const formValue = this.taskForm.value;
    const taskData = {
      ...formValue,
      projectId: parseInt(formValue.projectId),
      assignedToUserId: formValue.assignedToUserId ? parseInt(formValue.assignedToUserId) : null
    };

    const request$: Observable<any> = this.isEditMode 
      ? this.taskService.updateTask(taskData.id, taskData)
      : this.taskService.createTask({ ...taskData, id: 0 });

    request$.pipe(
      finalize(() => this.isSaving.set(false))
    ).subscribe({
      next: () => {
        this.router.navigate(['/tasks'], { replaceUrl: true });
      },
      error: (err: any) => {
        this.errorMessage.set(err.error?.message || `Failed to ${this.isEditMode ? 'update' : 'create'} task.`);
        console.error(err);
      }
    });
  }

  get f() { return this.taskForm.controls; }
}
