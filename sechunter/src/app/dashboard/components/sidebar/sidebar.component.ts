import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule, Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { VisualizationSelectionService } from '../../../shared/services/visualization-selection.service';

interface MenuItem {
  path: string;
  title: string;
  icon: string;
  roles: string[];
  notificationCount?: number;
}

interface InstanceItem {
  id: string;
  name: string;
  status: 'online' | 'warning' | 'offline';
}

interface WidgetItem {
  id: string;
  title: string;
  pinned: boolean;
}

interface ActionItem {
  id: string;
  description: string;
  timestamp: Date;
  type?: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    RouterModule,
    MatSnackBarModule
  ],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {
  @Output() menuSelection = new EventEmitter<string>();

  menuItems: MenuItem[] = [
    {
      path: '/dashboard/main',
      title: 'Dashboard',
      icon: 'dashboard',
      roles: ['admin', 'client', 'analyst']
    },
    {
      path: '/dashboard/asm',
      title: 'Attack Surface',
      icon: 'security',
      roles: ['admin', 'client', 'analyst']
    },
    {
      path: '/dashboard/vi',
      title: 'Vulnerability Intel',
      icon: 'bug_report',
      roles: ['admin', 'client', 'analyst']
    },
    {
      path: '/dashboard/cti',
      title: 'Cyber Threat Intel',
      icon: 'gpp_maybe',
      roles: ['admin', 'client', 'analyst'],
      notificationCount: 5
    },

    {
      path: '/dashboard/visualizations',
      title: 'Security Visualizations',
      icon: 'insights',
      roles: ['admin', 'client', 'analyst']
    },
    {
      path: '/dashboard/charts',
      title: 'Analytics Charts',
      icon: 'bar_chart',
      roles: ['admin', 'client', 'analyst']
    },
    {
      path: '/dashboard/info',
      title: 'Information & Contact',
      icon: 'info',
      roles: ['admin', 'client', 'analyst']
    },
    {
      path: '/dashboard/analyst',
      title: 'Analyst Dashboard',
      icon: 'analytics',
      roles: ['analyst']
    }
  ];

  instances: InstanceItem[] = [
    { id: '1', name: 'Client A', status: 'online' },
    { id: '2', name: 'Client B', status: 'warning' },
    { id: '3', name: 'Client C', status: 'offline' }
  ];

  widgets: WidgetItem[] = [
    { id: 'w1', title: 'Top 5 Vulnerabilities', pinned: true },
    { id: 'w2', title: 'Menaces Récentes', pinned: true },
    { id: 'w3', title: 'ASM Coverage', pinned: false },
    { id: 'w4', title: 'CTI Alerts', pinned: false }
  ];

  recentActions: ActionItem[] = [
    {
      id: 'a1',
      description: 'Scan ASM terminé à 14h30',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      type: 'scan'
    },
    {
      id: 'a2',
      description: 'Nouveau scan CTI lancé',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
      type: 'scan'
    },
    {
      id: 'a3',
      description: 'Secure Sign Out',
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
      type: 'auth'
    }
  ];

  userRole: string = 'admin'; // Default to admin for demo
  collapsed = false;

  constructor(
    private visualizationSelectionService: VisualizationSelectionService,
    private router: Router,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    // Get user role from localStorage
    const role = localStorage.getItem('user_role');
    if (role) {
      this.userRole = role;
    }
  }

  onMenuItemClick(title: string): void {
    // Special handling for analyst clicking on Dashboard
    if (this.userRole === 'analyst' && title === 'Dashboard') {
      console.log('Analyst clicked on Dashboard, redirecting to analyst dashboard');
      this.router.navigate(['/dashboard/analyst']);
    }

    this.visualizationSelectionService.setSelectedTab(title);
  }

  toggleSidebar(): void {
    this.collapsed = !this.collapsed;
  }

  addInstance(): void {
    console.log('Adding new instance');
    // Implementation for adding a new instance
  }

  toggleWidgetPin(widget: WidgetItem): void {
    widget.pinned = !widget.pinned;
  }

  formatTimestamp(timestamp: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHrs < 1) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return `${diffMins}m ago`;
    } else if (diffHrs < 24) {
      return `${diffHrs}h ago`;
    } else {
      const diffDays = Math.floor(diffHrs / 24);
      return `${diffDays}d ago`;
    }
  }

  showMenuItem(item: MenuItem): boolean {
    return item.roles.includes(this.userRole);
  }

  /**
   * Handle click on disabled menu items for regular users
   */
  onDisabledMenuClick(menuTitle: string): void {
    // Show message about creating an account
    this.snackBar.open(
      'Create an account and sign in for details',
      'Sign In',
      {
        duration: 5000,
        panelClass: ['premium-snackbar'],
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
      }
    ).onAction().subscribe(() => {
      // Navigate to auth page when "Sign In" is clicked
      this.router.navigate(['/auth']);
    });

    // Still emit the menu selection for the user dashboard to show the appropriate image
    this.menuSelection.emit(menuTitle);
  }

  signOut(): void {
    // Clear user data from localStorage
    localStorage.clear(); // Clear all localStorage items
    console.log('Sidebar - Signed out, cleared all localStorage items');

    // Add a record to recent actions
    const signOutAction: ActionItem = {
      id: `a${Date.now()}`,
      description: 'Secure Sign Out',
      timestamp: new Date(),
      type: 'auth'
    };
    this.recentActions.unshift(signOutAction);

    // Navigate to auth component
    this.router.navigate(['/auth']);
  }

  /**
   * Navigate to sign in page
   */
  navigateToSignIn(): void {
    this.router.navigate(['/auth']);
  }
}


