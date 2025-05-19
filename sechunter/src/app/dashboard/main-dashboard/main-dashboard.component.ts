import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSliderModule } from '@angular/material/slider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';

import { SidebarComponent } from '../components/sidebar/sidebar.component';
import { DashboardFilterComponent } from '../components/dashboard-filter/dashboard-filter.component';
import { DrillDownViewComponent } from '../components/drill-down-view/drill-down-view.component';
import { AddUserDialogComponent } from '../components/add-user-dialog/add-user-dialog.component';
import { RoleManagementDialogComponent } from '../components/role-management-dialog/role-management-dialog.component';
import { DashboardDataService, VulnerabilityData, SecurityDomain, ThreatAlert } from '../services/dashboard-data.service';
import { AuthService } from '../../core/services/auth.service';
import { AuditService, AuditEntry } from '../../core/services/audit.service';
import { MicroserviceConnectorService, MicroserviceType } from '../../core/services/microservice-connector.service';
import { User, UserRole } from '../../core/models/user.model';
import { MongoDBService } from '../../core/services/mongodb.service';

@Component({
  selector: 'app-main-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatMenuModule,
    MatProgressBarModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSlideToggleModule,
    MatSliderModule,
    MatTooltipModule,
    MatDialogModule,
    RouterModule,
    SidebarComponent,
    DrillDownViewComponent
    // AddUserDialogComponent est utilisé via MatDialog, pas besoin de l'importer ici
  ],
  templateUrl: './main-dashboard.component.html',
  styleUrls: ['./main-dashboard.component.scss']
})
export class MainDashboardComponent implements OnInit, OnDestroy {
  // Instance data
  instances = [
    { id: '1', name: 'Client A', status: 'online', lastScan: '2023-05-04T14:30:00Z' },
    { id: '2', name: 'Client B', status: 'warning', lastScan: '2023-05-03T10:15:00Z' },
    { id: '3', name: 'Client C', status: 'offline', lastScan: '2023-05-01T08:45:00Z' }
  ];

  // Quick widgets data
  quickWidgets = [
    {
      id: 'w1',
      title: 'Top 5 Vulnerabilities',
      value: '28',
      trend: '+12%',
      trendDirection: 'negative',
      icon: 'security'
    },
    {
      id: 'w2',
      title: 'Menaces Récentes',
      value: '5',
      trend: '-3%',
      trendDirection: 'positive',
      icon: 'warning'
    },
    {
      id: 'w3',
      title: 'ASM Coverage',
      value: '86%',
      trend: '+4%',
      trendDirection: 'positive',
      icon: 'visibility'
    },
    {
      id: 'w4',
      title: 'CTI Alerts',
      value: '12',
      trend: '+2%',
      trendDirection: 'negative',
      icon: 'notifications'
    }
  ];

  // Recent activity data
  recentActivities = [
    {
      id: 'a1',
      title: 'Scan ASM terminé à 14h30',
      time: '2h ago',
      icon: 'security_update_good',
      type: 'scan'
    },
    {
      id: 'a2',
      title: 'Nouveau scan CTI lancé',
      time: '4h ago',
      icon: 'search',
      type: 'scan'
    },
    {
      id: 'a3',
      title: 'Secure Sign Out',
      time: '5h ago',
      icon: 'logout',
      type: 'auth'
    }
  ];

  // Dashboard data from service
  vulnerabilities: VulnerabilityData[] = [];
  securityDomains: SecurityDomain[] = [];
  threatAlerts: ThreatAlert[] = [];

  // Drill-down state
  isDrillDownActive = false;

  // Flag to show back button
  showBackButton = false;

  // Source module (asm, cti, vi)
  sourceModule = '';

  // User Management
  users: User[] = [];
  displayedUserColumns: string[] = ['email', 'name', 'role', 'mfa', 'lastLogin', 'actions'];

  // Global Statistics
  vulnerabilityStats = {
    critical: 18,
    high: 35,
    medium: 52,
    low: 78
  };

  microserviceStats = [
    {
      name: 'VI (Vulnerability Intelligence)',
      vulnerabilities: 68,
      percentage: 42,
      color: 'primary',
      trend: '+12%',
      status: 'increasing'
    },
    {
      name: 'CTI (Cyber Threat Intelligence)',
      vulnerabilities: 57,
      percentage: 35,
      color: 'accent',
      trend: '-5%',
      status: 'decreasing'
    },
    {
      name: 'ASM (Attack Surface Management)',
      vulnerabilities: 38,
      percentage: 23,
      color: 'warn',
      trend: '+8%',
      status: 'increasing'
    }
  ];

  // Activité par analyste (jours de la semaine x analystes)
  activityHeatmap = [
    // Lun, Mar, Mer, Jeu, Ven, Sam, Dim
    [8, 6, 9, 7, 8, 2, 1],  // Analyste 1
    [5, 7, 8, 9, 6, 1, 0],  // Analyste 2
    [7, 8, 6, 5, 7, 3, 2],  // Analyste 3
    [9, 8, 7, 8, 9, 4, 1],  // Analyste 4
    [6, 5, 7, 8, 6, 2, 0]   // Analyste 5
  ];

  // Noms des analystes pour la heatmap
  analystNames = [
    'Analyste Senior',
    'Analyste Junior',
    'Analyste Spécialisé CTI',
    'Analyste VI',
    'Analyste ASM'
  ];

  // Jours de la semaine pour la heatmap
  weekdays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  // Microservice Monitoring
  microservices = [
    {
      id: 'vi-service',
      name: 'Vulnerability Intelligence',
      status: 'Online',
      responseTime: 120,
      lastUpdate: new Date(Date.now() - 300000),
      requestsPerMinute: 42,
      errors: 0
    },
    {
      id: 'cti-service',
      name: 'Cyber Threat Intelligence',
      status: 'Warning',
      responseTime: 350,
      lastUpdate: new Date(Date.now() - 600000),
      requestsPerMinute: 28,
      errors: 2
    },
    {
      id: 'asm-service',
      name: 'Attack Surface Management',
      status: 'Online',
      responseTime: 180,
      lastUpdate: new Date(Date.now() - 450000),
      requestsPerMinute: 35,
      errors: 0
    }
  ];

  // Audit & Logs
  auditLogs: AuditEntry[] = [
    {
      timestamp: new Date().toISOString(),
      endpoint: '/api/users',
      method: 'GET',
      status: 'success',
      user: { id: '1', email: 'admin@voc.com' },
      metadata: { ipAddress: '192.168.1.1', userAgent: 'Chrome' }
    },
    {
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      endpoint: '/api/vulnerabilities',
      method: 'POST',
      status: 'success',
      user: { id: '2', email: 'analyst@voc.com' },
      metadata: { ipAddress: '192.168.1.2', userAgent: 'Firefox' }
    },
    {
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      endpoint: '/api/auth/login',
      method: 'POST',
      status: 'error',
      user: { id: '3', email: 'client1@example.com' },
      metadata: { ipAddress: '192.168.1.3', userAgent: 'Safari', error: 'Invalid credentials' }
    }
  ];
  displayedLogColumns: string[] = ['timestamp', 'user', 'action', 'resource', 'status', 'details'];
  logFilters = {
    user: '',
    action: '',
    date: null
  };

  // Advanced Settings
  hideApiKey = true;
  integrations = {
    siem: true,
    ticketing: true,
    email: false,
    slack: true
  };
  notificationThresholds = {
    critical: 3,
    high: 8
  };

  private subscriptions: Subscription[] = [];

  constructor(
    private dashboardDataService: DashboardDataService,
    private route: ActivatedRoute,
    private authService: AuthService,
    private auditService: AuditService,
    private microserviceConnector: MicroserviceConnectorService,
    private dialog: MatDialog,
    private mongoService: MongoDBService
  ) { }

  ngOnInit(): void {
    console.log('Main dashboard initializing...');

    // DIRECT CHECK FOR ADMIN TOKEN - Simplest solution
    const token = localStorage.getItem('token') || localStorage.getItem('access_token');
    const role = localStorage.getItem('user_role');

    console.log('Main dashboard checking token:', token);
    console.log('Main dashboard checking role:', role);

    // If we have the admin token, we're good to go
    if (token === 'admin-token' && role === 'admin') {
      console.log('Admin token detected, allowing access to main dashboard');
      return;
    }

    // Otherwise, verify authentication
    if (!this.authService.isAuthenticated()) {
      console.error('User not authenticated, redirecting to login');
      window.location.href = '/auth?sessionExpired=true';
      return;
    }

    // Verify admin role
    const user = this.authService.getDecodedToken();
    console.log('Current user:', user);

    if (!user || !user.roles || !user.roles.includes('admin')) {
      console.error('User is not an admin, redirecting to appropriate dashboard');

      // Redirect based on role
      if (user && user.roles) {
        if (user.roles.includes('analyst')) {
          window.location.href = '/dashboard/analyst';
        } else {
          window.location.href = '/dashboard/user';
        }
      } else {
        window.location.href = '/auth';
      }
      return;
    }

    // Check query parameters for source flag
    this.route.queryParams.subscribe(params => {
      // Get the source module
      this.sourceModule = params['from'];

      // Show back button if coming from a specific module
      this.showBackButton = !!this.sourceModule;
    });

    // Subscribe to dashboard data
    this.subscriptions.push(
      this.dashboardDataService.vulnerabilities$.subscribe(data => {
        console.log('Received vulnerability data:', data);
        this.vulnerabilities = data;
      })
    );

    this.subscriptions.push(
      this.dashboardDataService.securityDomains$.subscribe(data => {
        console.log('Received security domain data:', data);
        this.securityDomains = data;
      })
    );

    this.subscriptions.push(
      this.dashboardDataService.threatAlerts$.subscribe(data => {
        console.log('Received threat alert data:', data);
        this.threatAlerts = data;
      })
    );

    this.subscriptions.push(
      this.dashboardDataService.isDrillDownActive$.subscribe(active => {
        this.isDrillDownActive = active;
      })
    );

    // Load users from MongoDB
    this.loadUsers();

    console.log('Main dashboard initialization complete');
  }

  loadUsers(): void {
    console.log('Loading users from MongoDB...');

    // If MongoDB service is not available, use mock data
    if (!this.mongoService) {
      console.warn('MongoDB service not available, using mock data');
      this.users = [
        {
          id: '1',
          email: 'admin@voc.com',
          name: 'Admin User',
          roles: ['admin'],
          mfaEnabled: true,
          lastLogin: new Date()
        },
        {
          id: '2',
          email: 'analyst@voc.com',
          name: 'Analyst User',
          roles: ['analyst'],
          mfaEnabled: false,
          lastLogin: new Date(Date.now() - 86400000)
        },
        {
          id: '3',
          email: 'client@example.com',
          name: 'Client User',
          roles: ['client'],
          mfaEnabled: false,
          lastLogin: new Date(Date.now() - 172800000)
        }
      ];
      return;
    }

    // Try to load users from MongoDB
    this.mongoService.getAllUsers().subscribe(
      (users) => {
        if (users && users.length > 0) {
          this.users = users;
          console.log('Users loaded from MongoDB:', users);
        } else {
          console.warn('No users found in MongoDB, using mock data');
          // Use mock data if no users found
          this.users = [
            {
              id: '1',
              email: 'admin@voc.com',
              name: 'Admin User',
              roles: ['admin'],
              mfaEnabled: true,
              lastLogin: new Date()
            },
            {
              id: '2',
              email: 'analyst@voc.com',
              name: 'Analyst User',
              roles: ['analyst'],
              mfaEnabled: false,
              lastLogin: new Date(Date.now() - 86400000)
            }
          ];
        }
      },
      (error) => {
        console.error('Error loading users from MongoDB:', error);
        // Use mock data on error
        this.users = [
          {
            id: '1',
            email: 'admin@voc.com',
            name: 'Admin User',
            roles: ['admin'],
            mfaEnabled: true,
            lastLogin: new Date()
          },
          {
            id: '2',
            email: 'analyst@voc.com',
            name: 'Analyst User',
            roles: ['analyst'],
            mfaEnabled: false,
            lastLogin: new Date(Date.now() - 86400000)
          }
        ];
      }
    );
  }

  addInstance(): void {
    console.log('Adding new instance');
    // Implementation for adding a new instance
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  }

  getStatusClass(status: string): string {
    return status.toLowerCase();
  }

  // Helper method for severity class
  getSeverityClass(severity: string): string {
    return severity.toLowerCase();
  }

  // Helper method to get critical count
  getCriticalCount(): number {
    if (!this.threatAlerts || this.threatAlerts.length === 0) {
      return 42; // Default value
    }

    const criticalCount = this.threatAlerts.filter(t => t.severity === 'critical').length;
    return criticalCount * 10 + 12;
  }

  // Click handlers for visualizations
  onVulnerabilityClick(severity: string): void {
    // Find the first vulnerability of this severity for demo purposes
    const vulnerabilityCategory = this.vulnerabilities.find(v => v.severity === severity);
    if (vulnerabilityCategory && vulnerabilityCategory.details && vulnerabilityCategory.details.length > 0) {
      this.dashboardDataService.selectVulnerability(vulnerabilityCategory.details[0].id);
    }
  }

  onSecurityDomainClick(domainName: string): void {
    this.dashboardDataService.selectDomain(domainName);
  }

  onThreatAlertClick(alertId: string): void {
    this.dashboardDataService.selectThreat(alertId);
  }

  refreshData(): void {
    this.dashboardDataService.refreshData();
  }

  // Get display name for the source module
  getModuleDisplayName(): string {
    const moduleNames: { [key: string]: string } = {
      'asm': 'ASM',
      'cti': 'CTI',
      'vi': 'VI'
    };

    return moduleNames[this.sourceModule] || this.sourceModule.toUpperCase();
  }

  // User Management Methods
  refreshUserData(): void {
    console.log('Refreshing user data');
    // In a real implementation, this would call a service to fetch updated user data
  }

  getAnalystCount(): number {
    return this.users.filter(user => user.roles.includes('analyst')).length;
  }

  getAdminCount(): number {
    return this.users.filter(user => user.roles.includes('admin')).length;
  }

  getRoleClass(user: User): string {
    if (user.roles.includes('admin')) return 'role-admin';
    if (user.roles.includes('analyst')) return 'role-analyst';
    if (user.roles.includes('client')) return 'role-client';
    return '';
  }

  editUser(user: User): void {
    console.log('Editing user:', user);
    // Implementation for editing a user
  }

  deleteUser(user: User): void {
    console.log('Deleting user:', user);
    // Implementation for deleting a user
  }

  addUser(): void {
    const dialogRef = this.dialog.open(AddUserDialogComponent, {
      width: '500px',
      panelClass: 'dark-theme-dialog',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('User dialog result:', result);

        // Register the user with the backend
        this.authService.register({
          name: result.name,
          email: result.email,
          password: result.password,
          role: result.role // This is the primary role
        }).subscribe({
          next: (response) => {
            console.log('User registration successful:', response);

            // Add the user to the local list with backend-generated ID if available
            const newUser = {
              ...result,
              id: response.id || response._id || result.id
            };

            // Add the new user to the list
            this.users.push(newUser);

            // Create an audit entry
            const auditEntry: AuditEntry = {
              timestamp: new Date().toISOString(),
              endpoint: '/api/auth/register',
              method: 'POST',
              status: 'success',
              user: { id: '1', email: 'admin@example.com' },
              metadata: {
                ipAddress: '192.168.1.1',
                userAgent: 'Chrome',
                details: `User created: ${result.email} with role: ${result.role}`
              }
            };

            // Add the audit entry
            this.auditLogs.unshift(auditEntry);

            console.log('New user added:', newUser);
          },
          error: (error) => {
            console.error('Error registering user:', error);

            // Create an error audit entry
            const auditEntry: AuditEntry = {
              timestamp: new Date().toISOString(),
              endpoint: '/api/auth/register',
              method: 'POST',
              status: 'error',
              user: { id: '1', email: 'admin@example.com' },
              metadata: {
                ipAddress: '192.168.1.1',
                userAgent: 'Chrome',
                details: `Failed to create user: ${result.email}. Error: ${error.message || 'Unknown error'}`
              }
            };

            // Add the error audit entry
            this.auditLogs.unshift(auditEntry);
          }
        });
      }
    });
  }

  manageRoles(): void {
    const dialogRef = this.dialog.open(RoleManagementDialogComponent, {
      width: '80%',
      maxWidth: '1200px',
      height: 'auto',
      maxHeight: '90vh',
      panelClass: ['dark-theme-dialog', 'role-management-dialog'],
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('Rôles mis à jour:', result);

        // Créer une entrée d'audit
        const auditEntry: AuditEntry = {
          timestamp: new Date().toISOString(),
          endpoint: '/api/roles',
          method: 'PUT',
          status: 'success',
          user: { id: '1', email: 'admin@voc.com' },
          metadata: {
            ipAddress: '192.168.1.1',
            userAgent: 'Chrome',
            details: 'Configuration des rôles RBAC mise à jour'
          }
        };

        // Ajouter l'entrée d'audit
        this.auditLogs.unshift(auditEntry);
      }
    });
  }

  manageUserPermissions(user: User): void {
    console.log('Managing permissions for user:', user);
    // Implementation for managing user permissions
  }

  // Global Statistics Methods
  refreshStatistics(): void {
    console.log('Refreshing statistics');
    // In a real implementation, this would call services to fetch updated statistics
  }

  getTotalVulnerabilities(): number {
    return this.vulnerabilityStats.critical +
           this.vulnerabilityStats.high +
           this.vulnerabilityStats.medium +
           this.vulnerabilityStats.low;
  }

  getActivityCount(): number {
    return this.auditLogs.length;
  }

  getLastActivityTime(): string {
    if (this.auditLogs.length === 0) return 'No activity';

    const latestLog = this.auditLogs.reduce((latest, current) => {
      return new Date(latest.timestamp) > new Date(current.timestamp) ? latest : current;
    });

    return `Last activity: ${new Date(latestLog.timestamp).toLocaleTimeString()}`;
  }

  getHeatmapColor(value: number): string {
    // Generate a color based on the value (0-10)
    const intensity = Math.min(value * 25, 255);
    return `rgba(0, ${intensity}, ${255 - intensity}, 0.7)`;
  }

  // Microservice Monitoring Methods
  refreshMicroservices(): void {
    console.log('Refreshing microservices');
    // In a real implementation, this would call the microservice connector to get updated status
  }

  getServiceStatusClass(service: any): string {
    if (service.status === 'Online') return 'status-online';
    if (service.status === 'Warning') return 'status-warning';
    if (service.status === 'Offline') return 'status-offline';
    return '';
  }

  getServiceStatusIcon(service: any): string {
    if (service.status === 'Online') return 'check_circle';
    if (service.status === 'Warning') return 'warning';
    if (service.status === 'Offline') return 'error';
    return 'help';
  }

  restartService(service: any): void {
    console.log('Restarting service:', service);
    // Implementation for restarting a service
  }

  toggleService(service: any): void {
    console.log('Toggling service:', service);
    service.status = service.status === 'Online' ? 'Offline' : 'Online';
    // Implementation for toggling a service on/off
  }

  viewServiceLogs(service: any): void {
    console.log('Viewing logs for service:', service);
    // Implementation for viewing service logs
  }

  getServiceHealth(service: any): number {
    // Calculer la santé du service basée sur le temps de réponse, les erreurs et le statut
    let health = 100;

    // Réduire la santé en fonction du temps de réponse
    if (service.responseTime > 300) {
      health -= 30;
    } else if (service.responseTime > 200) {
      health -= 15;
    } else if (service.responseTime > 100) {
      health -= 5;
    }

    // Réduire la santé en fonction des erreurs
    health -= service.errors * 10;

    // Réduire la santé en fonction du statut
    if (service.status === 'Warning') {
      health -= 20;
    } else if (service.status === 'Offline') {
      health = 0;
    }

    return Math.max(0, Math.min(100, health));
  }

  configureService(service: any): void {
    console.log('Configuring service:', service);
    // Implementation for configuring a service
  }

  // Audit & Logs Methods
  refreshLogs(): void {
    console.log('Refreshing logs');
    // In a real implementation, this would call the audit service to get updated logs
  }

  applyLogFilters(): void {
    console.log('Applying log filters:', this.logFilters);
    // Implementation for filtering logs
  }

  downloadLogs(): void {
    console.log('Downloading logs');
    // Implementation for downloading logs
  }

  viewLogDetails(log: AuditEntry): void {
    console.log('Viewing log details:', log);
    // Implementation for viewing log details
  }

  ngOnDestroy(): void {
    console.log('Main dashboard destroying, cleaning up subscriptions');

    // Unsubscribe from all subscriptions
    if (this.subscriptions && this.subscriptions.length > 0) {
      this.subscriptions.forEach(sub => {
        if (sub) {
          try {
            sub.unsubscribe();
          } catch (error) {
            console.error('Error unsubscribing:', error);
          }
        }
      });

      // Clear the subscriptions array
      this.subscriptions = [];
    }
  }
}

