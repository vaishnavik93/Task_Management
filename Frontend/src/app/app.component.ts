import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule],
  template: `
    <nav class="navbar">
      <div class="navbar-container">
        <a routerLink="/tasks" class="navbar-brand">
          <span class="icon">✨</span> <strong>Task Management System</strong>
        </a>
        <div class="navbar-menu">
          <a routerLink="/tasks" class="nav-btn">Dashboard</a>
          <a routerLink="/tasks/add" class="nav-btn nav-btn-primary">+ New Task</a>
        </div>
      </div>
    </nav>
    <main class="main-content">
      <router-outlet></router-outlet>
    </main>
  `
})
export class AppComponent { }
