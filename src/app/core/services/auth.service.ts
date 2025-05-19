import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { User } from '../models/user.model';
import { JwtHelperService } from '@auth0/angular-jwt';
import { HttpClient } from '@angular/common/http';
import { catchError, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private authStateSubject = new BehaviorSubject<boolean>(false);
  public authState$: Observable<boolean> = this.authStateSubject.asObservable();

  // Property to store the URL that the user tried to access before being redirected to login
  redirectUrl: string | null = null;

  // Mock user database for demonstration
  private users: { [key: string]: User } = {
    'admin': {
      id: '1',
      email: 'admin@sechunter.com',
      name: 'Admin User',
      roles: ['admin'],
      mfaEnabled: false,
      failedLoginAttempts: 0,
      accountLocked: false,
      lastLogin: new Date()
    },
    'client': {
      id: '2',
      email: 'client@example.com',
      name: 'Client User',
      roles: ['client'],
      mfaEnabled: false,
      failedLoginAttempts: 0,
      accountLocked: false,
      lastLogin: new Date()
    }
  };

  // Store passwords separately (in a real app, this would be hashed)
  private userPasswords: { [key: string]: string } = {
    'admin': 'Admin1!/',
    'client': 'Client1!/'
  };

  // Maximum failed login attempts before account lockout
  private MAX_FAILED_ATTEMPTS = 5;

  // Lockout duration in minutes
  private LOCKOUT_DURATION = 30;

  constructor(private jwtHelper: JwtHelperService, private http: HttpClient) {
    // Load registered users from storage
    this.loadUsersFromStorage();

    // Check if user is already authenticated
    const token = localStorage.getItem('access_token');
    const expString = localStorage.getItem('token_exp');

    if (token && expString) {
      try {
        // Check if token is expired
        const exp = parseInt(expString, 10);
        const now = Math.floor(Date.now() / 1000);

        if (now < exp) {
          // Token is valid
          this.authStateSubject.next(true);
          console.log('User authenticated from stored token');
        } else {
          // Token is expired
          console.log('Stored token is expired');
          this.logout();
        }
      } catch (error) {
        console.error('Invalid token data:', error);
        this.logout(); // Clear invalid token
      }
    } else {
      console.log('No valid authentication data found');
    }
  }

  isAuthenticated(): boolean {
    // First check the current auth state
    if (!this.authStateSubject.value) {
      return false;
    }

    // Then verify token expiration
    const token = localStorage.getItem('access_token');
    const expString = localStorage.getItem('token_exp');

    if (!token || !expString) {
      this.logout(); // Clear invalid state
      return false;
    }

    // Check if token is expired
    const exp = parseInt(expString, 10);
    const now = Math.floor(Date.now() / 1000);

    if (now >= exp) {
      console.log('Token expired');
      this.logout(); // Clear expired token
      return false;
    }

    return true;
  }

  login(username: string, password: string): { success: boolean; requireMfa?: boolean; error?: string } {
    // Check if user exists
    const user = this.users[username];
    if (!user) {
      console.log('Authentication failed: User not found');
      return { success: false, error: 'Invalid username or password' };
    }

    // Check if account is locked
    if (user.accountLocked) {
      const now = new Date();
      if (user.accountLockedUntil && user.accountLockedUntil > now) {
        const minutesLeft = Math.ceil((user.accountLockedUntil.getTime() - now.getTime()) / (60 * 1000));
        console.log(`Account locked. Try again in ${minutesLeft} minutes.`);
        return {
          success: false,
          error: `Account locked due to multiple failed attempts. Try again in ${minutesLeft} minutes.`
        };
      } else {
        // Reset lockout if duration has passed
        user.accountLocked = false;
        user.failedLoginAttempts = 0;
      }
    }

    // Validate credentials
    const storedPassword = this.userPasswords[username];
    const isValidCredentials = storedPassword && storedPassword === password;

    if (!isValidCredentials) {
      // Increment failed login attempts
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;

      // Check if account should be locked
      if (user.failedLoginAttempts >= this.MAX_FAILED_ATTEMPTS) {
        user.accountLocked = true;
        const lockoutUntil = new Date();
        lockoutUntil.setMinutes(lockoutUntil.getMinutes() + this.LOCKOUT_DURATION);
        user.accountLockedUntil = lockoutUntil;

        console.log(`Account locked until ${lockoutUntil}`);
        return {
          success: false,
          error: `Account locked due to multiple failed attempts. Try again in ${this.LOCKOUT_DURATION} minutes.`
        };
      }

      console.log(`Authentication failed. Attempts: ${user.failedLoginAttempts}/${this.MAX_FAILED_ATTEMPTS}`);
      return {
        success: false,
        error: `Invalid credentials. ${this.MAX_FAILED_ATTEMPTS - user.failedLoginAttempts} attempts remaining.`
      };
    }

    // Reset failed login attempts on successful login
    user.failedLoginAttempts = 0;
    user.accountLocked = false;
    user.lastLogin = new Date();

    // Check if MFA is enabled
    if (user.mfaEnabled) {
      // Store username in session for MFA verification
      sessionStorage.setItem('mfa_pending_user', username);
      console.log('MFA verification required');
      return { success: true, requireMfa: true };
    }

    // Create a mock token with expiration (24 hours from now)
    const now = Math.floor(Date.now() / 1000);
    const expiresIn = 24 * 60 * 60; // 24 hours in seconds
    const exp = now + expiresIn;

    // In a real app, this token would come from the server
    const mockToken = username === 'admin'
      ? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFkbWluIFVzZXIiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE1MTYyMzkwMjJ9'
      : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5ODc2NTQzMjEwIiwibmFtZSI6IkNsaWVudCBVc2VyIiwicm9sZSI6ImNsaWVudCIsImlhdCI6MTUxNjIzOTAyMn0';

    // Store auth data in localStorage
    localStorage.setItem('access_token', mockToken);
    localStorage.setItem('token_exp', exp.toString());
    localStorage.setItem('user_role', user.roles[0]);
    localStorage.setItem('user_name', user.name);
    localStorage.setItem('user_email', user.email);
    localStorage.setItem('user_id', user.id);

    // Update auth state
    this.authStateSubject.next(true);
    console.log('User authenticated successfully');
    return { success: true };
  }

  register(userData: any): boolean {
    // Check if username or email already exists
    const usernameExists = Object.keys(this.users).includes(userData.username);
    const emailExists = Object.values(this.users).some(user => user.email === userData.email);

    if (usernameExists || emailExists) {
      console.log('Registration failed: Username or email already exists');
      return false;
    }

    // Create new user
    const newUser: User = {
      id: (Object.keys(this.users).length + 1).toString(),
      email: userData.email,
      name: userData.fullName,
      roles: ['client'], // Default role for new users
      mfaEnabled: false,
      failedLoginAttempts: 0,
      accountLocked: false,
      lastLogin: new Date()
    };

    // Add user to users object with username as key
    this.users[userData.username] = newUser;

    // Store password separately (in a real app, this would be hashed)
    this.userPasswords = this.userPasswords || {};
    this.userPasswords[userData.username] = userData.password;

    // Store users in localStorage for persistence
    this.saveUsersToStorage();

    console.log('User registered successfully:', userData.username);
    return true;
  }

  private saveUsersToStorage(): void {
    // Save users to localStorage (in a real app, this would be in a database)
    localStorage.setItem('registered_users', JSON.stringify(this.users));
    localStorage.setItem('user_passwords', JSON.stringify(this.userPasswords));
  }

  private loadUsersFromStorage(): void {
    // Load users from localStorage
    const storedUsers = localStorage.getItem('registered_users');
    const storedPasswords = localStorage.getItem('user_passwords');

    if (storedUsers) {
      const parsedUsers = JSON.parse(storedUsers);
      // Merge with default users, keeping default users if there's a conflict
      this.users = { ...parsedUsers, ...this.users };
    }

    if (storedPasswords) {
      this.userPasswords = JSON.parse(storedPasswords);
    } else {
      // Initialize passwords for default users
      this.userPasswords = {
        'admin': 'Admin1!/',
        'client': 'Client1!/'
      };
    }
  }

  logout(): void {
    // Clear all auth-related data from localStorage
    localStorage.removeItem('access_token');
    localStorage.removeItem('token_exp');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_name');
    localStorage.removeItem('user_email');

    // Update auth state
    this.authStateSubject.next(false);
    console.log('User logged out');
  }

  getUserRole(): string {
    return localStorage.getItem('user_role') || 'client';
  }

  getUserName(): string {
    return localStorage.getItem('user_name') || 'User';
  }

  getUserEmail(): string {
    return localStorage.getItem('user_email') || '';
  }

  // MFA Methods
  enableMFA(username: string): { success: boolean; secret?: string; error?: string } {
    const user = this.users[username];
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // In a real app, this would generate a proper TOTP secret
    const mockSecret = 'ABCDEFGHIJKLMNOP';
    user.mfaEnabled = true;
    user.mfaSecret = mockSecret;
    user.mfaVerified = false;

    return { success: true, secret: mockSecret };
  }

  verifyMFA(username: string, code: string): boolean {
    const user = this.users[username];
    if (!user || !user.mfaEnabled || !user.mfaSecret) {
      return false;
    }

    // In a real app, this would validate the TOTP code against the user's secret
    // For demo purposes, accept any 6-digit code
    const isValidCode = /^\d{6}$/.test(code);

    if (isValidCode) {
      user.mfaVerified = true;
      return true;
    }

    return false;
  }

  completeMFALogin(username: string): boolean {
    const user = this.users[username];
    if (!user) {
      return false;
    }

    // Create a mock token with expiration (24 hours from now)
    const now = Math.floor(Date.now() / 1000);
    const expiresIn = 24 * 60 * 60; // 24 hours in seconds
    const exp = now + expiresIn;

    // In a real app, this token would come from the server
    const mockToken = username === 'admin'
      ? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFkbWluIFVzZXIiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE1MTYyMzkwMjJ9'
      : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5ODc2NTQzMjEwIiwibmFtZSI6IkNsaWVudCBVc2VyIiwicm9sZSI6ImNsaWVudCIsImlhdCI6MTUxNjIzOTAyMn0';

    // Store auth data in localStorage
    localStorage.setItem('access_token', mockToken);
    localStorage.setItem('token_exp', exp.toString());
    localStorage.setItem('user_role', user.roles[0]);
    localStorage.setItem('user_name', user.name);
    localStorage.setItem('user_email', user.email);
    localStorage.setItem('user_id', user.id);

    // Clear MFA pending user
    sessionStorage.removeItem('mfa_pending_user');

    // Update auth state
    this.authStateSubject.next(true);
    console.log('MFA verification successful');
    return true;
  }

  toggleMFAStatus(username: string): boolean {
    const user = this.users[username];
    if (!user) {
      return false;
    }

    if (user.mfaEnabled) {
      // Disable MFA
      user.mfaEnabled = false;
      user.mfaSecret = undefined;
      user.mfaVerified = false;
    } else {
      // Enable MFA
      this.enableMFA(username);
    }

    return true;
  }

  getMFAStatus(username: string): boolean {
    const user = this.users[username];
    return user ? user.mfaEnabled : false;
  }

  getCurrentUser(): User | null {
    const userId = localStorage.getItem('user_id');
    if (!userId) return null;

    // Find user by ID
    for (const username in this.users) {
      if (this.users[username].id === userId) {
        return this.users[username];
      }
    }

    return null;
  }

  /**
   * Get the current access token from localStorage
   */
  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  /**
   * Decode the JWT token and return the user information
   */
  getDecodedToken(): User | null {
    const token = this.getAccessToken();
    if (!token) return null;

    try {
      // Try to decode the token using JwtHelperService
      const decodedToken = this.jwtHelper.decodeToken(token);
      if (decodedToken) {
        return {
          ...decodedToken,
          id: decodedToken.sub || localStorage.getItem('user_id') || '',
          roles: decodedToken.roles || [this.getUserRole()],
          mfaEnabled: false
        } as User;
      }
    } catch (error) {
      console.error('Error decoding token:', error);
    }

    // Fallback: Create a user object based on localStorage data
    const userId = localStorage.getItem('user_id');
    const userRole = this.getUserRole();
    const userName = this.getUserName();
    const userEmail = this.getUserEmail();

    if (userId && userRole) {
      return {
        id: userId,
        email: userEmail || 'user@example.com',
        name: userName || 'User',
        roles: [userRole],
        mfaEnabled: false
      };
    }

    return null;
  }

  /**
   * Refresh the access token
   */
  refreshToken(): Observable<any> {
    // In a real app, this would call an API endpoint to refresh the token
    console.log('Refreshing token...');

    // For demo purposes, generate a new token with extended expiration
    const now = Math.floor(Date.now() / 1000);
    const expiresIn = 24 * 60 * 60; // 24 hours in seconds
    const exp = now + expiresIn;

    // Get current user role
    const userRole = this.getUserRole();

    // Generate a new mock token
    const mockToken = userRole === 'admin'
      ? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFkbWluIFVzZXIiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE1MTYyMzkwMjJ9'
      : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5ODc2NTQzMjEwIiwibmFtZSI6IkNsaWVudCBVc2VyIiwicm9sZSI6ImNsaWVudCIsImlhdCI6MTUxNjIzOTAyMn0';

    // Store the new token
    localStorage.setItem('access_token', mockToken);
    localStorage.setItem('token_exp', exp.toString());

    return of({ token: mockToken, exp });
  }

  /**
   * Toggle Multi-Factor Authentication for the current user
   */
  toggleMFA(): Observable<any> {
    const userId = localStorage.getItem('user_id');
    if (!userId) {
      return throwError(() => new Error('User not authenticated'));
    }

    // Find the current user
    let currentUser: User | null = null;
    let username = '';

    for (const uname in this.users) {
      if (this.users[uname].id === userId) {
        currentUser = this.users[uname];
        username = uname;
        break;
      }
    }

    if (!currentUser || !username) {
      return throwError(() => new Error('User not found'));
    }

    // Toggle MFA status
    const success = this.toggleMFAStatus(username);

    if (success) {
      if (currentUser.mfaEnabled) {
        // MFA was enabled, return QR code data
        return of({
          success: true,
          enabled: true,
          qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAEAAQMAAABmvDolAAAABlBMVEX///8AAABVwtN+AAAB30lEQVR42uyYMY7sIBBEa+QrcAWuwBW4MlfgClxhLzD7/0+YHlpWO96ZHY1WlpYStuiuV9XGQK1atWrVqlWrVq1atWrVqvUDy0Q0gKhvNay0rrQA6JdasfpjrQgAXLKVlwBYC4C+ZCsvAbAWAJcA9CUA1gJgLQDWAmAtANYCYC0A1gJgLQDWAmAtANYCYC0A1gJgLQDWAmAtANYCYC0A1gJgLQDWAmAtANYCYC0A1gJgLQDWAmAtANYCYC0A1gJgLQDWAmAtANYCYC0A1gJgLQDWAmAtANYCYC0A1gJgLQDWAmAtANYCYC0A1gJgLQDWAmAtANYCYC0A1gJgLQDWAmAtANYCYC0A1gJgLQDWAmAtANYCYC0A1gJgLQDWAmAtANYCYC0A1gJgLQDWAmAtANYCYC0A1gJgLQDWAmAtANYCYC0A1gJgLQDWAmAtANYCYC0A1gJgLQDWAmAtANYCYC0A1gJgLQDWAmAtANYCYC0A1gJgLQDWAmAtANYCYC0A1gJgLQDWAmAtANYCYC0A1gJgLQDWAmAtANYCYC0A1gJgLQDWAmAtANYCYC0A1gJgLQDWAmAtANYCYC0A1gJgLQDWAmAtANYCYC0A1gJgLQDWAmAtANYCYC0A1gJgLQDWAmAtANYC4P8B/AUTif/Qd9Q4UAAAAABJRU5ErkJggg=='
        });
      } else {
        // MFA was disabled
        return of({
          success: true,
          enabled: false
        });
      }
    }

    return throwError(() => new Error('Failed to toggle MFA status'));
  }
}
