import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { animate, style, transition, trigger } from '@angular/animations';
import { RouterModule } from '@angular/router';
import { FullscreenService } from '../core/services/fullscreen.service';
import { FullscreenButtonComponent } from '../shared/components/fullscreen-button/fullscreen-button.component';
import { AuthService } from '../core/services/auth.service';
@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    FullscreenButtonComponent
  ],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-5px)' }),
        animate('150ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class AuthComponent implements OnInit {
  loginForm: FormGroup;
  isLoading = false;
  error: string | null = null;
  showPassword = false;
  currentYear = new Date().getFullYear();

  // Password strength properties
  strengthLevel = 0;
  strengthLevels = [1, 2, 3, 4];
  passwordStrength: 'weak' | 'medium' | 'strong' = 'weak';
  strengthPercentage = 0;
  hasMinLength = false;
  hasUppercase = false;
  hasNumber = false;
  hasSpecialChar = false;

  constructor(
    private fb: FormBuilder,
    private fullscreenService: FullscreenService,
    private authService: AuthService
  ) {
    this.loginForm = this.fb.group({
      id: ['', [Validators.required]],
      password: ['', [Validators.required]],
      rememberMe: [false]
    });

    this.loginForm.valueChanges.subscribe(() => {
      // Clear any previous error when form changes
      this.error = null;
    });

    this.loginForm.get('password')?.valueChanges.subscribe(() => {
      this.updatePasswordStrength();
    });
  }

  ngOnInit(): void {
    // Check for session expired parameter
    const urlParams = new URLSearchParams(window.location.search);
    const sessionExpired = urlParams.get('sessionExpired');

    if (sessionExpired === 'true') {
      this.error = 'Your session has expired. Please log in again.';
      console.log('Session expired detected');
    }

    // Clear any existing tokens if we're on the auth page
    // This ensures a clean login state
    if (window.location.pathname.includes('/auth')) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('token');
    }
  }

  updatePasswordStrength(): void {
    const password = this.password.value;

    if (!password) {
      this.strengthPercentage = 0;
      this.passwordStrength = 'weak';
      this.strengthLevel = 0;
      return;
    }

    this.hasMinLength = password.length >= 8;
    this.hasUppercase = /[A-Z]/.test(password);
    this.hasNumber = /[0-9]/.test(password);
    this.hasSpecialChar = /[^A-Za-z0-9]/.test(password);

    const criteriaMet = [
      this.hasMinLength,
      this.hasUppercase,
      this.hasNumber,
      this.hasSpecialChar
    ].filter(Boolean).length;

    this.strengthLevel = criteriaMet;
    this.strengthPercentage = (criteriaMet / 4) * 100;

    this.passwordStrength = criteriaMet <= 1 ? 'weak' :
      criteriaMet <= 3 ? 'medium' :
      'strong';
  }

  get id() {
    return this.loginForm.get('id')!;
  }

  get password() {
    return this.loginForm.get('password')!;
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    this.isLoading = true;
    this.error = null;

    // Get form values even if form is technically invalid
    const id = this.loginForm.get('id')?.value || '';
    const password = this.loginForm.get('password')?.value || '';

    // Log the form values for debugging
    console.log('Form values:', { id, password });

    console.log('Login attempt with:', id, password);

    // HARDCODED ADMIN LOGIN - This is the simplest solution
    if ((id === 'admin@example.com') && password === 'Admin1!/') {
      console.log('Admin login detected - HARDCODED SOLUTION');

      // Clear any existing tokens/roles first
      localStorage.clear();

      // Set admin token and role
      localStorage.setItem('access_token', 'admin-token');
      localStorage.setItem('user_role', 'admin');
      localStorage.setItem('token', 'admin-token');

      console.log('Stored token:', localStorage.getItem('access_token'));
      console.log('Stored role:', localStorage.getItem('user_role'));
      console.log('Redirecting to admin dashboard...');

      // Direct navigation to admin dashboard
      window.location.href = '/dashboard/main';
      return;
    }

    // Check for locally stored users (created through the admin dashboard)
    const localUsers = JSON.parse(localStorage.getItem('local_users') || '[]');
    const localUser = localUsers.find((user: any) => user.email === id && user.password === password);

    if (localUser) {
      console.log('Local user login detected:', localUser);

      // Clear any existing tokens/roles first
      localStorage.clear();

      // Store the local users again since we just cleared localStorage
      localStorage.setItem('local_users', JSON.stringify(localUsers));

      // Set token and role based on the user's role
      if (localUser.role === 'admin') {
        localStorage.setItem('access_token', 'admin-token');
        localStorage.setItem('user_role', 'admin');
        localStorage.setItem('token', 'admin-token');

        console.log('Admin user authenticated, redirecting to admin dashboard');
        window.location.href = '/dashboard/main';
      } else if (localUser.role === 'analyst') {
        localStorage.setItem('access_token', 'analyst-token');
        localStorage.setItem('user_role', 'analyst');
        localStorage.setItem('token', 'analyst-token');

        console.log('Analyst user authenticated, redirecting to analyst dashboard');
        window.location.href = '/dashboard/analyst';
      } else {
        localStorage.setItem('access_token', 'user-token');
        localStorage.setItem('user_role', 'client');
        localStorage.setItem('token', 'user-token');

        console.log('Client user authenticated, redirecting to user dashboard');
        window.location.href = '/dashboard/user';
      }
      return;
    }

    // Special case for analyst login
    if ((id === 'analyst' && password === 'Analyst1!/') || (id === 'idanalyste' && password === 'Analyste1!/')) {
      console.log('Analyst login detected');
      localStorage.clear(); // Clear any existing tokens/roles
      localStorage.setItem('access_token', 'analyst-token');
      localStorage.setItem('user_role', 'analyst');
      console.log('Stored token:', localStorage.getItem('access_token'));
      console.log('Stored role:', localStorage.getItem('user_role'));
      console.log('Redirecting to analyst dashboard...');

      // Force redirect to analyst dashboard with a delay to ensure localStorage is updated
      setTimeout(() => {
        window.location.href = '/dashboard/analyst'; // Analyst dashboard
      }, 100);
      return;
    }

    // Special case for user login
    if (id === 'user' && password === 'userA1!/') {
      localStorage.setItem('access_token', 'user-token');
      localStorage.setItem('user_role', 'user');
      window.location.href = '/dashboard/user'; // User dashboard
      return;
    }

    // For all other cases, use the backend API
    console.log('Attempting to login with backend API');

    // Send the credentials to the auth service
    // The auth service will convert it to the format expected by the backend
    console.log('Sending login credentials to auth service:', { email: id, password });
    this.authService.login({ email: id, password: password })
      .subscribe({
        next: (response) => {
          console.log('Login successful:', response);
          this.isLoading = false;

          // Get the user role and redirect accordingly
          const user = this.authService.getDecodedToken();
          console.log('Decoded user:', user);
          const role = user?.roles?.[0] || 'client';
          console.log('User role:', role);

          if (role === 'admin') {
            console.log('Redirecting to admin dashboard');
            window.location.href = '/dashboard/main';
          } else if (role === 'analyst') {
            console.log('Redirecting to analyst dashboard');
            window.location.href = '/dashboard/analyst';
          } else {
            console.log('Redirecting to user dashboard');
            window.location.href = '/dashboard/user';
          }
        },
        error: (error) => {
          console.error('Login failed:', error);
          this.isLoading = false;

          // Handle different error formats
          if (error.error && typeof error.error === 'object' && error.error.message) {
            this.error = error.error.message;
          } else if (error.error && typeof error.error === 'object' && error.error.error) {
            this.error = error.error.error;
          } else if (error.error && typeof error.error === 'string') {
            this.error = error.error;
          } else if (error.message) {
            this.error = error.message;
          } else {
            this.error = 'Invalid credentials. Please check your email and password.';
          }

          // Display the error message to the user
          console.log('Login error displayed to user:', this.error);
        }
      });
  }

  /**
   * Handle Google sign-in
   * Note: This is a placeholder for Google OAuth integration
   * The current backend doesn't support Google authentication yet
   */
  signInWithGoogle(): void {
    console.log('Attempting to sign in with Google');
    this.isLoading = true;
    this.error = null;

    // For now, we'll create a mock user with Google credentials
    const mockGoogleUser = {
      name: 'Google User',
      email: 'google-user@example.com',
      password: 'GoogleUser123!',
      role: 'client'
    };

    // Register the user with the backend
    this.authService.register(mockGoogleUser)
      .subscribe({
        next: (response) => {
          console.log('Google sign-in successful:', response);
          this.isLoading = false;

          // Redirect to user dashboard
          window.location.href = '/dashboard/user';
        },
        error: (error) => {
          console.error('Google sign-in failed:', error);
          this.isLoading = false;

          // If the user already exists, try to log in instead
          if (error.error && error.error.includes('already exists')) {
            this.authService.login({
              email: mockGoogleUser.email,
              password: mockGoogleUser.password
            }).subscribe({
              next: (loginResponse) => {
                console.log('Google login successful:', loginResponse);
                window.location.href = '/dashboard/user';
              },
              error: (loginError) => {
                this.error = 'Google authentication failed. Please try again or use email login.';
                console.error('Google login failed:', loginError);
              }
            });
          } else {
            this.error = 'Google authentication failed. Please try again or use email login.';
          }
        }
      });
  }
}
