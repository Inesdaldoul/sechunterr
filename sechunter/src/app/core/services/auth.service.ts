import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, of, throwError } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { User, UserRole } from '../models/user.model';
import { Router } from '@angular/router';
import { JwtHelperService } from '@auth0/angular-jwt';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl; // URL from environment
  private authApiUrl = environment.authApiUrl; // Auth API URL from environment
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  // Property to store the URL that the user tried to access before being redirected to login
  redirectUrl: string | null = null;

  constructor(private http: HttpClient, private router: Router, private jwtHelper: JwtHelperService) {
    // Check if a token exists in localStorage
    const token = localStorage.getItem('token') || localStorage.getItem('access_token');
    if (token) {
      this.loadUserFromToken(token);
    }
  }

  login(credentials: { email: string, password: string }): Observable<any> {
    console.log('Attempting login with credentials:', credentials);

    // Special case for admin login
    if ((credentials.email === 'admin' || credentials.email === 'admin@example.com') &&
        credentials.password === 'Admin1!/') {
      console.log('Admin credentials detected, using special case login');

      // Clear any existing tokens/roles first
      localStorage.clear();

      // Set admin token and role
      localStorage.setItem('access_token', 'admin-token');
      localStorage.setItem('user_role', 'admin');
      localStorage.setItem('token', 'admin-token');

      // Create a mock admin user
      const adminUser: User = {
        id: 'admin',
        email: 'admin@example.com',
        name: 'Administrator',
        roles: ['admin'],
        mfaEnabled: false
      };

      // Update the current user subject
      this.currentUserSubject.next(adminUser);

      return of({ success: true, token: 'admin-token' });
    }

    // Log the API URL and request
    console.log('Sending login request to:', `${this.authApiUrl}/login`);

    // Convert the credentials to the format expected by the backend
    // The backend expects { email: string, password: string }
    const payload = {
      email: credentials.email,
      password: credentials.password
    };

    console.log('Request payload:', payload);

    // Set headers for the request
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    return this.http.post<any>(`${this.authApiUrl}/login`, payload, { headers })
      .pipe(
        tap(response => {
          console.log('Login response from backend:', response);

          // Handle different response formats
          if (response.token) {
            // Format: { token: "..." }
            localStorage.setItem('token', response.token);
            localStorage.setItem('access_token', response.token);

            // After setting the token, fetch the user data
            this.loadUserFromToken(response.token);
          } else if (response.success && response.data && response.data.token) {
            // Format: { success: true, data: { token: "..." } }
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('access_token', response.data.token);

            // After setting the token, fetch the user data
            this.loadUserFromToken(response.data.token);
          } else if (response.success && response.token) {
            // Format: { success: true, token: "..." }
            localStorage.setItem('token', response.token);
            localStorage.setItem('access_token', response.token);

            // After setting the token, fetch the user data
            this.loadUserFromToken(response.token);
          }
        }),
        catchError(error => {
          console.error('Login error from backend:', error);

          // Try to extract the most useful error message
          let errorMessage = 'Login failed';

          if (error.error) {
            if (typeof error.error === 'object') {
              if (error.error.message) {
                errorMessage = error.error.message;
              } else if (error.error.error) {
                errorMessage = error.error.error;
              }
            } else if (typeof error.error === 'string') {
              errorMessage = error.error;
            }
          } else if (error.message) {
            errorMessage = error.message;
          }

          return throwError(() => ({ success: false, error: errorMessage }));
        })
      );
  }

  register(userData: { name: string, email: string, password: string, role?: string }): Observable<any> {
    console.log('Sending registration request to:', `${this.authApiUrl}/register`);

    // Make sure we have all required fields
    const payload = {
      name: userData.name,
      email: userData.email,
      password: userData.password,
      role: userData.role || 'client' // Default to client role if not specified
    };

    console.log('Request payload:', payload);

    // Special case for admin and analyst users
    // This is for testing purposes until the backend is fully integrated
    if (payload.role === 'admin' || payload.role === 'analyst') {
      console.log(`Creating special ${payload.role} user`);

      // Create a mock response for admin/analyst users
      const mockUser = {
        id: Date.now().toString(),
        email: payload.email,
        name: payload.name,
        role: payload.role,
        roles: [payload.role],
        mfaEnabled: false,
        lastLogin: new Date()
      };

      // Store the user in localStorage for testing
      const localUsers = JSON.parse(localStorage.getItem('local_users') || '[]');
      localUsers.push({
        email: payload.email,
        password: payload.password,
        role: payload.role,
        name: payload.name
      });
      localStorage.setItem('local_users', JSON.stringify(localUsers));

      console.log('User stored locally for testing:', mockUser);
      return of(mockUser);
    }

    // Set headers for the request
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    // For regular users, send to the backend
    return this.http.post<any>(`${this.authApiUrl}/register`, payload, { headers })
      .pipe(
        tap(response => {
          console.log('Registration response from backend:', response);

          // Handle different response formats
          if (response.token) {
            // Format: { token: "..." }
            localStorage.setItem('token', response.token);
            localStorage.setItem('access_token', response.token);

            // After setting the token, fetch the user data
            this.loadUserFromToken(response.token);
          } else if (response.success && response.data && response.data.token) {
            // Format: { success: true, data: { token: "..." } }
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('access_token', response.data.token);

            // After setting the token, fetch the user data
            this.loadUserFromToken(response.data.token);
          } else if (response.success && response.token) {
            // Format: { success: true, token: "..." }
            localStorage.setItem('token', response.token);
            localStorage.setItem('access_token', response.token);

            // After setting the token, fetch the user data
            this.loadUserFromToken(response.token);
          }
        }),
        catchError(error => {
          console.error('Registration error from backend:', error);

          // Try to extract the most useful error message
          let errorMessage = 'Registration failed';

          if (error.error) {
            if (typeof error.error === 'object') {
              if (error.error.message) {
                errorMessage = error.error.message;
              } else if (error.error.error) {
                errorMessage = error.error.error;
              }
            } else if (typeof error.error === 'string') {
              errorMessage = error.error;
            }
          } else if (error.message) {
            errorMessage = error.message;
          }

          return throwError(() => ({ success: false, error: errorMessage }));
        })
      );
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_role');
    this.currentUserSubject.next(null);
    this.router.navigate(['/auth']);
  }

  isAuthenticated(): boolean {
    const token = localStorage.getItem('token') || localStorage.getItem('access_token');

    // Special case tokens are always valid
    if (token === 'admin-token' || token === 'analyst-token' || token === 'user-token') {
      console.log('Special token detected:', token);
      return true;
    }

    // For regular tokens, check if they exist and are not expired
    if (token) {
      try {
        const isValid = !this.jwtHelper.isTokenExpired(token);
        console.log('Token validation result:', isValid);
        return isValid;
      } catch (error) {
        console.error('Error validating token:', error);
        return false;
      }
    }

    return false;
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  hasRole(role: string): boolean {
    const user = this.currentUserSubject.value;
    return user ? user.roles.includes(role) : false;
  }

  private loadUserFromToken(token: string): void {
    console.log('Loading user from token:', token);

    // Special case tokens
    if (token === 'admin-token') {
      const adminUser: User = {
        id: 'admin',
        email: 'admin@example.com',
        name: 'Administrator',
        roles: ['admin'],
        mfaEnabled: false
      };
      this.currentUserSubject.next(adminUser);
      localStorage.setItem('user_role', 'admin');
      return;
    }

    if (token === 'analyst-token') {
      const analystUser: User = {
        id: 'analyst',
        email: 'analyst@voc.com',
        name: 'Analyst',
        roles: ['analyst'],
        mfaEnabled: false
      };
      this.currentUserSubject.next(analystUser);
      localStorage.setItem('user_role', 'analyst');
      return;
    }

    if (token === 'user-token') {
      const regularUser: User = {
        id: 'user',
        email: 'user@voc.com',
        name: 'User',
        roles: ['client'],
        mfaEnabled: false
      };
      this.currentUserSubject.next(regularUser);
      localStorage.setItem('user_role', 'client');
      return;
    }

    // Try to decode the token first
    try {
      const decodedToken = this.jwtHelper.decodeToken(token);
      console.log('Decoded token:', decodedToken);

      if (decodedToken) {
        // Extract user info from token
        const tokenUser: User = {
          id: decodedToken.id || decodedToken._id || decodedToken.sub || '',
          email: decodedToken.email || '',
          name: decodedToken.name || '',
          roles: [decodedToken.role || 'client'],
          mfaEnabled: false
        };

        console.log('User extracted from token:', tokenUser);

        // Store user role in localStorage
        localStorage.setItem('user_role', tokenUser.roles[0]);

        // Update the current user subject
        this.currentUserSubject.next(tokenUser);

        // Still fetch user data from API for complete info
      }
    } catch (error) {
      console.error('Error decoding token:', error);
      // Continue with API call to get user data
    }

    // For real tokens from the backend
    console.log('Fetching user data from API');
    this.http.get<any>(`${this.authApiUrl}/me`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .pipe(
        catchError(error => {
          console.error('Error loading user from token:', error);
          // Don't remove the token on error, it might be a temporary API issue
          return of(null);
        })
      )
      .subscribe(response => {
        console.log('User data response from API:', response);

        if (response) {
          let userData: User;

          // Handle different response formats
          if (response.success && response.data) {
            // Format: { success: true, data: {...} }
            userData = {
              id: response.data._id || response.data.id || '',
              email: response.data.email || '',
              name: response.data.name || '',
              roles: [response.data.role || 'client'], // Convert single role to array of roles
              mfaEnabled: false, // Default value as backend doesn't have this yet
              lastLogin: response.data.lastLogin ? new Date(response.data.lastLogin) : undefined
            };

            // Store user role in localStorage for easy access
            localStorage.setItem('user_role', response.data.role || 'client');
          } else {
            // Format: direct user object
            userData = {
              id: response._id || response.id || '',
              email: response.email || '',
              name: response.name || '',
              roles: [response.role || 'client'], // Convert single role to array of roles
              mfaEnabled: false,
              lastLogin: response.lastLogin ? new Date(response.lastLogin) : undefined
            };

            // Store user role in localStorage for easy access
            localStorage.setItem('user_role', response.role || 'client');
          }

          console.log('Processed user data:', userData);

          // Update the current user subject
          this.currentUserSubject.next(userData);
        }
      });
  }

  /**
   * Get the current access token from localStorage
   */
  getAccessToken(): string | null {
    return localStorage.getItem('access_token') || localStorage.getItem('token');
  }

  /**
   * Get the user's role from localStorage
   */
  getUserRole(): string {
    return localStorage.getItem('user_role') || 'client';
  }

  /**
   * Decode the JWT token and return the user information
   */
  getDecodedToken(): User | null {
    const token = this.getAccessToken();
    if (!token) return null;

    // Special case for admin token
    if (token === 'admin-token') {
      return {
        id: 'admin',
        email: 'admin@example.com',
        name: 'Administrator',
        roles: ['admin'],
        mfaEnabled: false
      };
    }

    // Special case for analyst token
    if (token === 'analyst-token') {
      return {
        id: 'analyst',
        email: 'analyst@voc.com',
        name: 'Analyst',
        roles: ['analyst'],
        mfaEnabled: false
      };
    }

    // Special case for user token
    if (token === 'user-token') {
      return {
        id: 'user',
        email: 'user@voc.com',
        name: 'User',
        roles: ['client'],
        mfaEnabled: false
      };
    }

    try {
      // Try to decode the token using JwtHelperService
      const decodedToken = this.jwtHelper.decodeToken(token);
      if (decodedToken) {
        // The Node.js backend uses 'id' as the identifier in the JWT payload
        return {
          id: decodedToken.id || '',
          email: decodedToken.email || '',
          name: decodedToken.name || '',
          // The backend uses a single role string, convert to array for frontend
          roles: Array.isArray(decodedToken.roles) ? decodedToken.roles : [decodedToken.role || this.getUserRole()],
          mfaEnabled: false,
          // Add JWT specific fields
          iat: decodedToken.iat,
          exp: decodedToken.exp
        } as User;
      }
    } catch (error) {
      console.error('Error decoding token:', error);
    }

    // Fallback: If we can't decode the token, return the current user
    return this.getCurrentUser();
  }

  /**
   * Refresh the access token
   * Note: The current backend doesn't have a refresh token endpoint,
   * so this is a placeholder for future implementation
   */
  refreshToken(): Observable<any> {
    // Since the backend doesn't support refresh tokens yet,
    // we'll just return the current token if it exists
    const token = this.getAccessToken();

    if (token) {
      return of({ success: true, token });
    }

    // If no token exists, force logout
    this.logout();
    return throwError(() => new Error('No token available to refresh'));
  }

  /**
   * Toggle Multi-Factor Authentication for the current user
   * Note: The current backend doesn't support MFA yet,
   * so this is a placeholder for future implementation
   */
  toggleMFA(): Observable<any> {
    // Return a mock response since the backend doesn't support MFA yet
    console.log('MFA toggle requested - this feature is not yet implemented in the backend');

    // Get the current user
    const user = this.getCurrentUser();
    if (!user) {
      return throwError(() => new Error('User not authenticated'));
    }

    // Toggle the MFA status in the user object
    const newMfaStatus = !user.mfaEnabled;

    // Update the user object
    const updatedUser: User = {
      ...user,
      mfaEnabled: newMfaStatus
    };

    // Update the current user subject
    this.currentUserSubject.next(updatedUser);

    // Return a mock response
    if (newMfaStatus) {
      return of({
        success: true,
        enabled: true,
        qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAEAAQMAAABmvDolAAAABlBMVEX///8AAABVwtN+AAAB30lEQVR42uyYMY7sIBBEa+QrcAWuwBW4MlfgClxhLzD7/0+YHlpWO96ZHY1WlpYStuiuV9XGQK1atWrVqlWrVq1atWrVqvUDy0Q0gKhvNay0rrQA6JdasfpjrQgAXLKVlwBYC4C+ZCsvAbAWAJcA9CUA1gJgLQDWAmAtANYCYC0A1gJgLQDWAmAtANYCYC0A1gJgLQDWAmAtANYCYC0A1gJgLQDWAmAtANYCYC0A1gJgLQDWAmAtANYCYC0A1gJgLQDWAmAtANYCYC0A1gJgLQDWAmAtANYCYC0A1gJgLQDWAmAtANYCYC0A1gJgLQDWAmAtANYCYC0A1gJgLQDWAmAtANYCYC0A1gJgLQDWAmAtANYCYC0A1gJgLQDWAmAtANYCYC0A1gJgLQDWAmAtANYCYC0A1gJgLQDWAmAtANYCYC0A1gJgLQDWAmAtANYCYC0A1gJgLQDWAmAtANYCYC0A1gJgLQDWAmAtANYCYC0A1gJgLQDWAmAtANYCYC0A1gJgLQDWAmAtANYCYC0A1gJgLQDWAmAtANYCYC0A1gJgLQDWAmAtANYCYC0A1gJgLQDWAmAtANYCYC0A1gJgLQDWAmAtANYCYC0A1gJgLQDWAmAtANYCYC0A1gJgLQDWAmAtANYC4P8B/AUTif/Qd9Q4UAAAAABJRU5ErkJggg=='
      });
    } else {
      return of({
        success: true,
        enabled: false
      });
    }
  }
}
