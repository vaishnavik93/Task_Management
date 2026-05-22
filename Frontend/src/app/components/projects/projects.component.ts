import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProjectService, Project } from '../../services/project.service';
import { AuthService } from '../../services/auth.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="page-header">
      <h1 class="page-title">✨ Projects & Teams</h1>
      <button *ngIf="isAdmin()" (click)="showCreateModal.set(true)" class="btn btn-primary">
        + Create Project
      </button>
    </div>

    <!-- Error message alert -->
    <div *ngIf="errorMessage()" class="alert alert-danger">
      <span class="alert-icon">⚠️</span> {{ errorMessage() }}
    </div>

    <!-- Success message alert -->
    <div *ngIf="successMessage()" class="alert alert-success">
      <span class="alert-icon">✓</span> {{ successMessage() }}
    </div>

    <!-- Loading spinner -->
    <div *ngIf="isLoading()" class="loader-container">
      <div class="spinner"></div>
      <p>Loading projects...</p>
    </div>

    <!-- Empty state -->
    <div *ngIf="!isLoading() && projects().length === 0" class="empty-state glass-card">
      <span class="empty-icon">📁</span>
      <h3>No Projects Found</h3>
      <p class="text-muted">
        {{ isAdmin() ? 'Click "+ Create Project" to start organizing tasks.' : 'You have not been assigned to any projects yet.' }}
      </p>
    </div>

    <!-- Projects Grid -->
    <div *ngIf="!isLoading() && projects().length > 0" class="projects-grid">
      <div *ngFor="let project of projects()" class="glass-card project-card">
        <div class="project-header">
          <h2 class="project-name">{{ project.name }}</h2>
          <button *ngIf="isAdmin()" (click)="deleteProject(project.id)" class="btn-icon btn-delete-project" title="Delete Project">
            🗑️
          </button>
        </div>
        <p class="project-desc">{{ project.description || 'No description provided.' }}</p>

        <!-- Project Members Section -->
        <div class="project-members-section">
          <div class="section-title-bar">
            <h3>👥 Project Team</h3>
            <span class="members-count">{{ membersMap[project.id]?.length || 0 }} Members</span>
          </div>

          <!-- Add Member Panel (Admin Only) -->
          <div *ngIf="isAdmin()" class="add-member-form">
            <select #userSelect class="form-control form-control-sm select-users">
              <option value="">-- Add Team Member --</option>
              <option *ngFor="let u of availableUsers()" [value]="u.id">
                {{ u.username }} ({{ u.role }})
              </option>
            </select>
            <button (click)="addMember(project.id, userSelect)" class="btn btn-primary btn-sm">
              Add
            </button>
          </div>

          <!-- Members list -->
          <div class="members-list">
            <div *ngFor="let member of membersMap[project.id]" class="member-badge">
              <span class="member-info" [title]="member.email">
                <strong class="user-avatar">{{ member.username.substring(0, 2).toUpperCase() }}</strong>
                {{ member.username }}
                <span class="member-role-label">{{ member.role }}</span>
              </span>
              <button *ngIf="isAdmin() && member.userId !== currentUser()?.userId" (click)="removeMember(project.id, member.userId)" class="btn-remove-member" title="Remove Member">
                ✕
              </button>
            </div>
            <div *ngIf="!membersMap[project.id] || membersMap[project.id].length === 0" class="no-members">
              No assigned members yet.
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Project Glassmorphic Modal -->
    <div *ngIf="showCreateModal()" class="modal-overlay">
      <div class="glass-card modal-card">
        <div class="modal-header">
          <h2>Create New Project</h2>
          <button (click)="showCreateModal.set(false)" class="btn-close-modal">✕</button>
        </div>

        <form [formGroup]="projectForm" (ngSubmit)="onCreateSubmit()">
          <div class="form-group">
            <label class="form-label" for="projName">Project Name</label>
            <input 
              id="projName" 
              type="text" 
              class="form-control" 
              placeholder="e.g. Website Redesign"
              formControlName="name"
            />
            <div *ngIf="f['name'].touched && f['name'].invalid" class="error-message">
              Project name is required (max 100 chars).
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="projDesc">Description</label>
            <textarea 
              id="projDesc" 
              class="form-control" 
              rows="4"
              placeholder="Provide a detailed description of the project..."
              formControlName="description"
            ></textarea>
          </div>

          <div class="modal-footer">
            <button type="button" (click)="showCreateModal.set(false)" class="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" class="btn btn-primary" [disabled]="projectForm.invalid || isSaving()">
              {{ isSaving() ? 'Saving...' : 'Create Project' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .projects-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(450px, 1fr));
      gap: 2rem;
      margin-top: 1rem;
    }
    .project-card {
      display: flex;
      flex-direction: column;
      height: 100%;
      border-radius: 16px;
      padding: 2rem;
    }
    .project-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }
    .project-name {
      font-size: 1.6rem;
      font-weight: 700;
      color: #fff;
      background: linear-gradient(135deg, var(--secondary), #fff);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .btn-delete-project {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 1.2rem;
      padding: 0.4rem;
      border-radius: 50%;
      transition: all 0.3s ease;
    }
    .btn-delete-project:hover {
      background: rgba(255, 71, 87, 0.2);
      transform: scale(1.1);
    }
    .project-desc {
      color: var(--text-muted);
      font-size: 0.95rem;
      line-height: 1.6;
      margin-bottom: 1.5rem;
      flex-grow: 1;
    }
    .project-members-section {
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      padding-top: 1.5rem;
      margin-top: auto;
    }
    .section-title-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }
    .section-title-bar h3 {
      font-size: 1.05rem;
      color: #fff;
      font-weight: 600;
    }
    .members-count {
      font-size: 0.8rem;
      background: rgba(0, 242, 254, 0.1);
      color: var(--secondary);
      padding: 0.2rem 0.6rem;
      border-radius: 20px;
      font-weight: 600;
    }
    .add-member-form {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }
    .select-users {
      flex: 1;
      padding: 0.5rem;
      font-size: 0.9rem;
      background: rgba(0,0,0,0.3);
    }
    .select-users option {
      background: #0b0f19;
    }
    .btn-sm {
      padding: 0.5rem 1rem;
      font-size: 0.85rem;
      border-radius: 6px;
    }
    .members-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.6rem;
      max-height: 150px;
      overflow-y: auto;
    }
    .member-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.06);
      padding: 0.4rem 0.8rem;
      border-radius: 30px;
      font-size: 0.85rem;
      color: #e2e8f0;
      transition: all 0.3s ease;
    }
    .member-badge:hover {
      background: rgba(255, 255, 255, 0.08);
      border-color: rgba(255, 255, 255, 0.15);
    }
    .member-info {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
    }
    .user-avatar {
      background: linear-gradient(135deg, var(--primary), var(--secondary));
      color: #fff;
      width: 22px;
      height: 22px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      font-size: 0.7rem;
      margin-right: 0.2rem;
      box-shadow: 0 0 5px rgba(0, 242, 254, 0.4);
    }
    .member-role-label {
      font-size: 0.7rem;
      color: var(--text-muted);
      background: rgba(255,255,255,0.05);
      padding: 0.1rem 0.3rem;
      border-radius: 4px;
      margin-left: 0.2rem;
    }
    .btn-remove-member {
      background: none;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      font-size: 0.75rem;
      padding: 0.1rem 0.2rem;
      border-radius: 50%;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 16px;
      height: 16px;
    }
    .btn-remove-member:hover {
      background: rgba(255, 71, 87, 0.3);
      color: #fff;
    }
    .no-members {
      color: var(--text-muted);
      font-size: 0.85rem;
      padding: 0.5rem 0;
      width: 100%;
    }
    .alert {
      padding: 0.8rem 1.2rem;
      border-radius: 8px;
      margin-bottom: 1.5rem;
      display: flex;
      align-items: center;
      gap: 0.8rem;
    }
    .alert-danger {
      background: rgba(255, 71, 87, 0.15);
      border: 1px solid rgba(255, 71, 87, 0.3);
      color: #ff7675;
    }
    .alert-success {
      background: rgba(0, 242, 254, 0.1);
      border: 1px solid rgba(0, 242, 254, 0.3);
      color: var(--secondary);
    }

    /* Modal Overlay & Card */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(7, 10, 18, 0.8);
      backdrop-filter: blur(8px);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }
    .modal-card {
      width: 90%;
      max-width: 550px;
      padding: 2.5rem;
      border-radius: 20px;
      box-shadow: 0 20px 50px rgba(0,0,0,0.6);
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.8rem;
    }
    .modal-header h2 {
      font-size: 1.8rem;
      font-weight: 700;
      color: #fff;
    }
    .btn-close-modal {
      background: none;
      border: none;
      color: var(--text-muted);
      font-size: 1.3rem;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    .btn-close-modal:hover {
      color: #fff;
      transform: scale(1.1);
    }
    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      margin-top: 2rem;
    }
  `]
})
export class ProjectsComponent implements OnInit {
  projects = signal<Project[]>([]);
  availableUsers = signal<any[]>([]);
  membersMap: { [projectId: number]: any[] } = {};

  isLoading = signal<boolean>(false);
  isSaving = signal<boolean>(false);
  showCreateModal = signal<boolean>(false);
  errorMessage = signal<string>('');
  successMessage = signal<string>('');

  projectForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private projectService: ProjectService,
    private authService: AuthService
  ) {
    this.projectForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['']
    });
  }

  ngOnInit(): void {
    this.loadProjects();
    if (this.isAdmin()) {
      this.loadUsers();
    }
  }

  get f() { return this.projectForm.controls; }

  currentUser() {
    return this.authService.getCurrentUser();
  }

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  loadProjects(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.projectService.getProjects()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (projs) => {
          this.projects.set(projs);
          projs.forEach(p => this.loadProjectMembers(p.id));
        },
        error: (err) => {
          this.errorMessage.set('Failed to load projects.');
          console.error(err);
        }
      });
  }

  loadProjectMembers(projectId: number): void {
    this.projectService.getProjectMembers(projectId).subscribe({
      next: (members) => {
        this.membersMap[projectId] = members;
      },
      error: (err) => {
        console.error(`Failed to load members for project ${projectId}`, err);
      }
    });
  }

  loadUsers(): void {
    this.authService.getUsers().subscribe({
      next: (users) => {
        this.availableUsers.set(users);
      },
      error: (err) => {
        console.error('Failed to load users', err);
      }
    });
  }

  onCreateSubmit(): void {
    if (this.projectForm.invalid) return;

    this.isSaving.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.projectService.createProject(this.projectForm.value)
      .pipe(finalize(() => {
        this.isSaving.set(false);
        this.showCreateModal.set(false);
      }))
      .subscribe({
        next: (newProj) => {
          this.successMessage.set(`Project "${newProj.name}" created successfully!`);
          this.projectForm.reset();
          this.loadProjects();
          setTimeout(() => this.successMessage.set(''), 4000);
        },
        error: (err) => {
          this.errorMessage.set('Failed to create project.');
          console.error(err);
        }
      });
  }

  deleteProject(id: number): void {
    if (!confirm('Are you sure you want to delete this project? This will also delete all associated tasks!')) return;

    this.errorMessage.set('');
    this.successMessage.set('');

    this.projectService.deleteProject(id).subscribe({
      next: () => {
        this.successMessage.set('Project deleted successfully.');
        this.loadProjects();
        setTimeout(() => this.successMessage.set(''), 4000);
      },
      error: (err) => {
        this.errorMessage.set('Failed to delete project.');
        console.error(err);
      }
    });
  }

  addMember(projectId: number, selectElem: HTMLSelectElement): void {
    const userIdVal = selectElem.value;
    if (!userIdVal) return;

    const userId = parseInt(userIdVal);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.projectService.addProjectMember(projectId, userId).subscribe({
      next: () => {
        this.successMessage.set('Team member added successfully!');
        selectElem.value = '';
        this.loadProjectMembers(projectId);
        setTimeout(() => this.successMessage.set(''), 4000);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Failed to add member.');
        console.error(err);
      }
    });
  }

  removeMember(projectId: number, userId: number): void {
    if (!confirm('Remove this member from the project?')) return;

    this.errorMessage.set('');
    this.successMessage.set('');

    this.projectService.removeProjectMember(projectId, userId).subscribe({
      next: () => {
        this.successMessage.set('Team member removed successfully.');
        this.loadProjectMembers(projectId);
        setTimeout(() => this.successMessage.set(''), 4000);
      },
      error: (err) => {
        this.errorMessage.set('Failed to remove member.');
        console.error(err);
      }
    });
  }
}
