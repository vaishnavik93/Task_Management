import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TaskService } from '../../services/task.service';
import { ProjectService, Project } from '../../services/project.service';
import { AuthService } from '../../services/auth.service';
import { Task } from '../../models/task';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="dashboard-welcome">
      <h1 class="welcome-title">Welcome back, <span class="user-highlight">{{ currentUser()?.username }}</span>!</h1>
      <p class="welcome-subtitle">Here is a quick overview of your team's task progress and project metrics.</p>
    </div>

    <!-- Error message alert -->
    <div *ngIf="errorMessage()" class="alert alert-danger">
      <span class="alert-icon">⚠️</span> {{ errorMessage() }}
    </div>

    <!-- Loading spinner -->
    <div *ngIf="isLoading()" class="loader-container">
      <div class="spinner"></div>
      <p>Analyzing dashboard statistics...</p>
    </div>

    <div *ngIf="!isLoading()" class="dashboard-content animate-fade-in">
      
      <!-- Metrics Grid -->
      <div class="metrics-grid">
        
        <!-- Total Tasks Widget -->
        <div class="metric-card glass-card purple-glow">
          <div class="metric-header">
            <span class="metric-icon">📋</span>
            <span class="metric-label">Total Tasks</span>
          </div>
          <div class="metric-value">{{ totalTasks() }}</div>
          <div class="metric-meta">Assigned or visible to you</div>
        </div>

        <!-- In Progress Widget -->
        <div class="metric-card glass-card amber-glow">
          <div class="metric-header">
            <span class="metric-icon">⚡</span>
            <span class="metric-label">In Progress</span>
          </div>
          <div class="metric-value">{{ inProgressTasks() }}</div>
          <div class="metric-meta">Active execution</div>
        </div>

        <!-- Completed Widget -->
        <div class="metric-card glass-card cyan-glow">
          <div class="metric-header">
            <span class="metric-icon">✓</span>
            <span class="metric-label">Completed</span>
          </div>
          <div class="metric-value">{{ completedTasks() }}</div>
          <div class="metric-meta">
            {{ completionRate() }}% Completion Rate
          </div>
          <!-- Glowing Progress Bar -->
          <div class="progress-bar-container">
            <div class="progress-bar-fill" [style.width.%]="completionRate()"></div>
          </div>
        </div>

        <!-- Overdue Widget -->
        <div class="metric-card glass-card red-glow">
          <div class="metric-header">
            <span class="metric-icon">🚨</span>
            <span class="metric-label">Overdue</span>
          </div>
          <div class="metric-value" [class.danger-text]="overdueTasks() > 0">{{ overdueTasks() }}</div>
          <div class="metric-meta">{{ overdueTasks() > 0 ? 'Urgent attention required' : 'All clear!' }}</div>
        </div>

      </div>

      <!-- Main Layout Details -->
      <div class="dashboard-details-layout">
        
        <!-- Urgency & Overdue Tasks -->
        <div class="details-section glass-card list-section">
          <div class="section-header">
            <h2>⚠️ Critical & Pending Tasks</h2>
            <a routerLink="/tasks" class="view-all-link">Manage All Tasks</a>
          </div>

          <div class="task-mini-list">
            <div *ngFor="let task of urgentTasks()" class="mini-task-item" [class.is-overdue]="isTaskOverdue(task)">
              <div class="task-indicator" [class.status-in-progress]="task.status === 'In Progress'"></div>
              <div class="mini-task-content">
                <h4 class="mini-task-title">{{ task.title }}</h4>
                <div class="mini-task-row">
                  <span class="mini-task-project">📁 {{ getProjectName(task.projectId) }}</span>
                  <span class="mini-task-date">📅 Due: {{ task.dueDate | date:'mediumDate' }}</span>
                </div>
              </div>
              <span class="mini-status-badge" [class.badge-overdue]="isTaskOverdue(task)" [class.badge-in-progress]="task.status === 'In Progress'">
                {{ isTaskOverdue(task) ? 'Overdue' : task.status }}
              </span>
            </div>

            <div *ngIf="urgentTasks().length === 0" class="no-critical-tasks">
              🎉 No pending or critical tasks. Great job!
            </div>
          </div>
        </div>

        <!-- Project Performance -->
        <div class="details-section glass-card list-section">
          <div class="section-header">
            <h2>📁 Project Health Overview</h2>
            <a routerLink="/projects" class="view-all-link">Manage Teams</a>
          </div>

          <div class="project-mini-list">
            <div *ngFor="let p of projectStats()" class="mini-project-item">
              <div class="mini-project-info">
                <h4 class="mini-project-name">{{ p.name }}</h4>
                <p class="mini-project-desc">{{ p.description || 'No description' }}</p>
              </div>
              <div class="mini-project-metric">
                <div class="mini-progress-circle">
                  <span class="circle-val">{{ p.completionRate }}%</span>
                </div>
                <span class="mini-project-task-count">{{ p.completedCount }}/{{ p.totalCount }} Tasks</span>
              </div>
            </div>

            <div *ngIf="projectStats().length === 0" class="no-projects">
              📁 No projects currently tracked.
            </div>
          </div>
        </div>

      </div>

    </div>
  `,
  styles: [`
    .dashboard-welcome {
      margin-bottom: 2.5rem;
    }
    .welcome-title {
      font-size: 2.5rem;
      font-weight: 700;
      color: #fff;
      margin-bottom: 0.5rem;
    }
    .user-highlight {
      background: linear-gradient(135deg, var(--secondary), var(--primary));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      text-shadow: 0 0 20px rgba(0, 242, 254, 0.3);
    }
    .welcome-subtitle {
      color: var(--text-muted);
      font-size: 1.1rem;
    }
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.8rem;
      margin-bottom: 3rem;
    }
    .metric-card {
      padding: 2rem;
      border-radius: 16px;
      display: flex;
      flex-direction: column;
      position: relative;
      overflow: hidden;
      transition: all 0.3s ease;
    }
    .metric-card:hover {
      transform: translateY(-4px);
    }
    .metric-header {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      margin-bottom: 1rem;
    }
    .metric-icon {
      font-size: 1.5rem;
    }
    .metric-label {
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--text-muted);
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .metric-value {
      font-size: 3.2rem;
      font-weight: 700;
      color: #fff;
      line-height: 1;
      margin-bottom: 0.5rem;
    }
    .metric-meta {
      font-size: 0.85rem;
      color: var(--text-muted);
    }
    .purple-glow:hover {
      box-shadow: 0 10px 30px rgba(181, 0, 255, 0.25), 0 0 10px inset rgba(181, 0, 255, 0.15);
      border-color: rgba(181, 0, 255, 0.3);
    }
    .amber-glow:hover {
      box-shadow: 0 10px 30px rgba(234, 179, 8, 0.25), 0 0 10px inset rgba(234, 179, 8, 0.15);
      border-color: rgba(234, 179, 8, 0.3);
    }
    .cyan-glow:hover {
      box-shadow: 0 10px 30px rgba(0, 242, 254, 0.25), 0 0 10px inset rgba(0, 242, 254, 0.15);
      border-color: rgba(0, 242, 254, 0.3);
    }
    .red-glow:hover {
      box-shadow: 0 10px 30px rgba(255, 71, 87, 0.25), 0 0 10px inset rgba(255, 71, 87, 0.15);
      border-color: rgba(255, 71, 87, 0.3);
    }
    .danger-text {
      color: #ff4757;
      text-shadow: 0 0 15px rgba(255, 71, 87, 0.6);
    }
    .progress-bar-container {
      width: 100%;
      height: 6px;
      background: rgba(255,255,255,0.08);
      border-radius: 20px;
      margin-top: 0.8rem;
      overflow: hidden;
    }
    .progress-bar-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--primary), var(--secondary));
      border-radius: 20px;
      box-shadow: 0 0 8px var(--secondary);
      transition: width 0.8s ease-in-out;
    }
    .dashboard-details-layout {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
      gap: 2.5rem;
    }
    .details-section {
      padding: 2.2rem;
      border-radius: 20px;
      display: flex;
      flex-direction: column;
    }
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.8rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      padding-bottom: 1rem;
    }
    .section-header h2 {
      font-size: 1.3rem;
      color: #fff;
      font-weight: 600;
    }
    .view-all-link {
      font-size: 0.9rem;
      color: var(--secondary);
      text-decoration: none;
      font-weight: 600;
      transition: all 0.3s ease;
    }
    .view-all-link:hover {
      color: var(--primary);
      text-shadow: 0 0 8px rgba(181, 0, 255, 0.4);
    }
    .task-mini-list, .project-mini-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .mini-task-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.04);
      padding: 0.9rem 1.2rem;
      border-radius: 12px;
      transition: all 0.3s ease;
    }
    .mini-task-item:hover {
      background: rgba(255, 255, 255, 0.06);
      border-color: rgba(255, 255, 255, 0.08);
      transform: translateX(4px);
    }
    .task-indicator {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #94a3b8;
    }
    .task-indicator.status-in-progress {
      background: #eab308;
      box-shadow: 0 0 8px #eab308;
    }
    .is-overdue .task-indicator {
      background: #ff4757;
      box-shadow: 0 0 8px #ff4757;
    }
    .mini-task-content {
      flex: 1;
    }
    .mini-task-title {
      font-size: 0.95rem;
      font-weight: 600;
      color: #fff;
      margin-bottom: 0.25rem;
    }
    .mini-task-row {
      display: flex;
      gap: 1rem;
      font-size: 0.8rem;
      color: var(--text-muted);
    }
    .mini-status-badge {
      font-size: 0.75rem;
      font-weight: 600;
      background: rgba(255,255,255,0.05);
      color: var(--text-muted);
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
    }
    .mini-status-badge.badge-in-progress {
      background: rgba(234,179,8,0.1);
      color: #eab308;
    }
    .mini-status-badge.badge-overdue {
      background: rgba(255,71,87,0.15);
      color: #ff4757;
      border: 1px solid rgba(255,71,87,0.2);
    }
    .no-critical-tasks, .no-projects, .no-members {
      padding: 2rem;
      text-align: center;
      color: var(--text-muted);
      font-size: 0.95rem;
      background: rgba(0,0,0,0.1);
      border-radius: 12px;
      border: 1px dashed rgba(255,255,255,0.06);
    }
    .mini-project-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.04);
      padding: 1rem 1.4rem;
      border-radius: 12px;
      transition: all 0.3s ease;
    }
    .mini-project-item:hover {
      background: rgba(255, 255, 255, 0.06);
      border-color: rgba(255, 255, 255, 0.08);
      transform: translateX(4px);
    }
    .mini-project-info {
      flex: 1;
      padding-right: 1.5rem;
    }
    .mini-project-name {
      font-size: 1.05rem;
      color: #fff;
      font-weight: 600;
      margin-bottom: 0.25rem;
    }
    .mini-project-desc {
      font-size: 0.85rem;
      color: var(--text-muted);
      display: -webkit-box;
      -webkit-line-clamp: 1;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .mini-project-metric {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 0.4rem;
    }
    .mini-progress-circle {
      background: rgba(0, 242, 254, 0.08);
      border: 1px solid rgba(0, 242, 254, 0.2);
      width: 44px;
      height: 44px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 10px rgba(0, 242, 254, 0.1);
    }
    .circle-val {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--secondary);
    }
    .mini-project-task-count {
      font-size: 0.75rem;
      color: var(--text-muted);
    }
  `]
})
export class DashboardComponent implements OnInit {
  projects = signal<Project[]>([]);
  tasks = signal<Task[]>([]);

  isLoading = signal<boolean>(false);
  errorMessage = signal<string>('');

  // Metrics Signals
  totalTasks = signal<number>(0);
  inProgressTasks = signal<number>(0);
  completedTasks = signal<number>(0);
  overdueTasks = signal<number>(0);
  completionRate = signal<number>(0);

  // Lists Signals
  urgentTasks = signal<Task[]>([]);
  projectStats = signal<any[]>([]);

  constructor(
    private taskService: TaskService,
    private projectService: ProjectService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.loadDashboardData();
  }

  currentUser() {
    return this.authService.getCurrentUser();
  }

  loadDashboardData(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    forkJoin({
      projects: this.projectService.getProjects(),
      tasks: this.taskService.getTasks()
    }).pipe(
      finalize(() => this.isLoading.set(false))
    ).subscribe({
      next: ({ projects, tasks }) => {
        this.projects.set(projects);
        this.tasks.set(tasks);

        this.calculateMetrics(tasks, projects);
      },
      error: (err) => {
        this.errorMessage.set('Failed to load dashboard data.');
        console.error(err);
      }
    });
  }

  calculateMetrics(tasks: Task[], projects: Project[]): void {
    const total = tasks.length;
    this.totalTasks.set(total);

    const inProgress = tasks.filter(t => t.status === 'In Progress').length;
    this.inProgressTasks.set(inProgress);

    const completed = tasks.filter(t => t.status === 'Completed').length;
    this.completedTasks.set(completed);

    // Overdue = status is not completed and due date < today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const overdue = tasks.filter(t => {
      if (t.status === 'Completed') return false;
      const dueDate = new Date(t.dueDate);
      return dueDate < today;
    }).length;
    this.overdueTasks.set(overdue);

    // Completion rate
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    this.completionRate.set(rate);

    // Urgent tasks: Overdue OR In Progress tasks sorted by nearest due date
    const urgent = tasks
      .filter(t => t.status !== 'Completed')
      .map(t => ({
        ...t,
        isOverdue: this.isTaskOverdue(t)
      }))
      .sort((a, b) => {
        // Overdue first, then sort by due date ascending
        if (a.isOverdue && !b.isOverdue) return -1;
        if (!a.isOverdue && b.isOverdue) return 1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      })
      .slice(0, 5);

    this.urgentTasks.set(urgent);

    // Project Performance Stats
    const stats = projects.map(p => {
      const projTasks = tasks.filter(t => t.projectId === p.id);
      const projTotal = projTasks.length;
      const projCompleted = projTasks.filter(t => t.status === 'Completed').length;
      const projRate = projTotal > 0 ? Math.round((projCompleted / projTotal) * 100) : 0;

      return {
        id: p.id,
        name: p.name,
        description: p.description,
        totalCount: projTotal,
        completedCount: projCompleted,
        completionRate: projRate
      };
    });

    this.projectStats.set(stats);
  }

  isTaskOverdue(task: Task): boolean {
    if (task.status === 'Completed') return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(task.dueDate) < today;
  }

  getProjectName(projectId: number): string {
    const proj = this.projects().find(p => p.id === projectId);
    return proj ? proj.name : 'Unknown Project';
  }
}
