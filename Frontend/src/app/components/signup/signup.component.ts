import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="auth-container">
      <div class="glass-card auth-card">
        <div class="auth-header">
          <span class="auth-logo">🚀</span>
          <h2 class="auth-title">Create Account</h2>
          <p class="auth-subtitle">Join us to manage and collaborate on projects</p>
        </div>

        <form [formGroup]="signupForm" (ngSubmit)="onSubmit()">
          <div *ngIf="errorMessage()" class="alert alert-danger">
            <span class="alert-icon">⚠️</span> {{ errorMessage() }}
          </div>

          <div class="form-group">
            <label class="form-label" for="username">Full Name</label>
            <input 
              id="username" 
              type="text" 
              class="form-control" 
              placeholder="John Doe"
              formControlName="username"
              [class.is-invalid]="f['username'].touched && f['username'].invalid"
            />
            <div *ngIf="f['username'].touched && f['username'].invalid" class="error-message">
              Full name is required (max 50 chars).
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="email">Email Address</label>
            <input 
              id="email" 
              type="email" 
              class="form-control" 
              placeholder="name@example.com"
              formControlName="email"
              [class.is-invalid]="f['email'].touched && f['email'].invalid"
            />
            <div *ngIf="f['email'].touched && f['email'].invalid" class="error-message">
              Please enter a valid email address.
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="password">Password</label>
            <input 
              id="password" 
              type="password" 
              class="form-control" 
              placeholder="••••••••"
              formControlName="password"
              [class.is-invalid]="f['password'].touched && f['password'].invalid"
            />
            <div *ngIf="f['password'].touched && f['password'].invalid" class="error-message">
              Password must be at least 6 characters long.
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="role">Account Role</label>
            <select id="role" class="form-control select-custom" formControlName="role">
              <option value="Member">Team Member (Views assigned tasks & updates status)</option>
              <option value="Admin">System Admin (Creates projects, teams, and tasks)</option>
            </select>
          </div>

          <button type="submit" class="btn btn-primary w-100" [disabled]="signupForm.invalid || isLoading()">
            <span *ngIf="isLoading()" class="spinner-small"></span>
            {{ isLoading() ? 'Creating account...' : 'Create Account' }}
          </button>
        </form>

        <div class="auth-footer">
          <p>Already have an account? <a routerLink="/login" class="auth-link">Sign in</a></p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: calc(85vh - 100px);
      padding: 1rem;
    }
    .auth-card {
      width: 100%;
      max-width: 450px;
      padding: 3rem 2.5rem;
    }
    .auth-header {
      text-align: center;
      margin-bottom: 2rem;
    }
    .auth-logo {
      font-size: 3rem;
      display: inline-block;
      margin-bottom: 1rem;
      filter: drop-shadow(0 0 15px var(--secondary));
    }
    .auth-title {
      font-size: 2.2rem;
      font-weight: 700;
      color: #fff;
      margin-bottom: 0.5rem;
      background: linear-gradient(135deg, var(--secondary), var(--primary));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .auth-subtitle {
      color: var(--text-muted);
      font-size: 0.95rem;
    }
    .auth-footer {
      text-align: center;
      margin-top: 2rem;
      color: var(--text-muted);
      font-size: 0.95rem;
    }
    .auth-link {
      color: var(--secondary);
      text-decoration: none;
      font-weight: 600;
      transition: all 0.3s ease;
    }
    .auth-link:hover {
      color: var(--primary);
      text-shadow: 0 0 10px rgba(181, 0, 255, 0.4);
    }
    .alert {
      padding: 1rem 1.2rem;
      border-radius: 10px;
      margin-bottom: 1.5rem;
      display: flex;
      align-items: center;
      gap: 0.8rem;
      font-size: 0.95rem;
    }
    .alert-danger {
      background: rgba(255, 71, 87, 0.15);
      border: 1px solid rgba(255, 71, 87, 0.3);
      color: #ff7675;
    }
    .w-100 {
      width: 100%;
    }
    .select-custom {
      cursor: pointer;
    }
    .select-custom option {
      background: #0b0f19;
      color: #fff;
    }
    .spinner-small {
      width: 18px;
      height: 18px;
      border: 2px solid rgba(255,255,255,0.2);
      border-left-color: #fff;
      border-radius: 50%;
      display: inline-block;
      animation: spin 0.8s linear infinite;
      margin-right: 0.5rem;
    }
    @keyframes spin {
      100% { transform: rotate(360deg); }
    }
  `]
})
export class SignupComponent {
  signupForm: FormGroup;
  isLoading = signal<boolean>(false);
  errorMessage = signal<string>('');

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.signupForm = this.fb.group({
      username: ['', [Validators.required, Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: ['Member', [Validators.required]]
    });
  }

  get f() { return this.signupForm.controls; }

  onSubmit(): void {
    if (this.signupForm.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.authService.register(this.signupForm.value)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: () => {
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          this.errorMessage.set(err.error?.message || 'Failed to create account. Email may already be in use.');
          console.error(err);
        }
      });
  }
}
