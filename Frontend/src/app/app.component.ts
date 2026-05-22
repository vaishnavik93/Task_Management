import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule, CommonModule],
  template: `
    <nav class="navbar">
      <div class="navbar-container">
        <a routerLink="/" class="navbar-brand">
          <span class="icon">✨</span> <strong>Task Manager</strong>
        </a>
        
        <div class="navbar-menu">
          <ng-container *ngIf="isLoggedIn(); else guestNav">
            <a routerLink="/dashboard" routerLinkActive="active-link" class="nav-btn">Dashboard</a>
            <a routerLink="/projects" routerLinkActive="active-link" class="nav-btn">Projects & Teams</a>
            <a routerLink="/tasks" routerLinkActive="active-link" class="nav-btn">Tasks</a>
            <a *ngIf="isAdmin()" routerLink="/tasks/add" class="nav-btn nav-btn-primary">+ New Task</a>
            
            <div class="user-profile-badge">
              <span class="user-avatar">{{ username().substring(0, 2).toUpperCase() }}</span>
              <div class="profile-details">
                <span class="profile-name">{{ username() }}</span>
                <span class="profile-role">{{ role() }}</span>
              </div>
            </div>
            <button (click)="logout()" class="nav-btn logout-btn" title="Sign Out">
              🚪
            </button>
          </ng-container>
          
          <ng-template #guestNav>
            <a routerLink="/login" routerLinkActive="active-link" class="nav-btn">Sign In</a>
            <a routerLink="/signup" routerLinkActive="active-link" class="nav-btn nav-btn-primary">Sign Up</a>
          </ng-template>
        </div>
      </div>
    </nav>
    <main class="main-content">
      <router-outlet></router-outlet>
    </main>
  `,
  styles: [`
    .active-link {
      color: var(--secondary) !important;
      text-shadow: 0 0 8px rgba(0, 242, 254, 0.4);
    }
    .user-profile-badge {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.06);
      padding: 0.3rem 0.8rem;
      border-radius: 30px;
      margin-left: 0.5rem;
    }
    .user-avatar {
      background: linear-gradient(135deg, var(--secondary), var(--primary));
      color: #fff;
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      font-size: 0.75rem;
      font-weight: 700;
      box-shadow: 0 0 8px rgba(0, 242, 254, 0.3);
    }
    .profile-details {
      display: flex;
      flex-direction: column;
    }
    .profile-name {
      font-size: 0.85rem;
      font-weight: 600;
      color: #fff;
      line-height: 1.1;
    }
    .profile-role {
      font-size: 0.7rem;
      color: var(--text-muted);
    }
    .logout-btn {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 1.2rem;
      padding: 0.4rem;
      border-radius: 50%;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .logout-btn:hover {
      background: rgba(255, 71, 87, 0.15);
      transform: scale(1.05);
    }
  `]
})
export class AppComponent {
  private authService = inject(AuthService);

  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  username(): string {
    return this.authService.getCurrentUser()?.username || '';
  }

  role(): string {
    return this.authService.getCurrentUser()?.role || '';
  }

  logout(): void {
    this.authService.logout();
  }
}
