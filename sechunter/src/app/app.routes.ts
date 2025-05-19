import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { RoleGuard } from './core/guards/role.guard';
import { UserRole } from './core/models/user.model';

export const routes: Routes = [
  {
    path: 'auth',
    loadComponent: () => import('./auth/auth.component').then(m => m.AuthComponent),
    title: 'Security Authentication'
  },
  {
    path: 'user-dashboard',
    loadComponent: () => import('./dashboard/user-dashboard/user-dashboard.component').then(m => m.UserDashboardComponent),
    title: 'User Dashboard'
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard],
    data: { animation: 'dashboardFade' },
    children: [
      {
        path: '',
        canActivate: [RoleGuard],
        data: {
          roles: [UserRole.ADMIN, UserRole.CLIENT, UserRole.ANALYST],
          redirect: '/dashboard/main'
        },
        loadComponent: () => import('./dashboard/dashboard-redirect/dashboard-redirect.component').then(m => m.DashboardRedirectComponent)
      },
      {
        path: 'main',
        loadComponent: () => import('./dashboard/main-dashboard/main-dashboard.component').then(m => m.MainDashboardComponent),
        // No guards to ensure admin login works
        title: 'Security Operations Dashboard'
      },
      {
        path: 'user',
        loadComponent: () => import('./dashboard/user-dashboard/user-dashboard.component').then(m => m.UserDashboardComponent),
        title: 'User Dashboard'
      },
      {
        path: 'vi',
        loadComponent: () => import('./modules/vi/components/vi-page/vi.component').then(m => m.ViComponent),
        title: 'Threat Intelligence'
      },
      {
        path: 'asm',
        loadComponent: () => import('./modules/asm/components/asm-page/asm.component').then(m => m.AsmComponent),
        title: 'Attack Surface Analysis'
      },
      {
        path: 'cti',
        loadComponent: () => import('./modules/cti/components/cti-page/cti.component').then(m => m.CtiComponent),
        title: 'Threat Intelligence'
      },

      {
        path: 'visualizations',
        loadComponent: () => import('./dashboard/visualization-dashboard/visualization-dashboard.component').then(m => m.VisualizationDashboardComponent),
        title: 'Security Visualizations Dashboard'
      },
      {
        path: 'charts',
        loadComponent: () => import('./dashboard/dashboard-charts/charts-dashboard/charts-dashboard.component').then(m => m.ChartsDashboardComponent),
        title: 'Security Analytics Charts'
      },
      {
        path: 'profile',
        loadComponent: () => import('./modules/user-profile/user-profile.component').then(m => m.UserProfileComponent),
        data: { animation: 'profileSlide' },
        title: 'User Security Settings'
      },
      {
        path: 'admin',
        loadComponent: () => import('./modules/admin/admin.component').then(m => m.AdminComponent),
        canActivate: [RoleGuard],
        data: {
          requiredRole: 'admin',
          animation: 'adminSlide'
        },
        title: 'Administration Panel'
      },
      {
        path: 'analyst',
        loadComponent: () => import('./dashboard/analyst-dashboard/analyst-dashboard.component').then(m => m.AnalystDashboardComponent),
        canActivate: [RoleGuard],
        data: {
          roles: [UserRole.ANALYST],
          animation: 'analystSlide',
          redirect: '/dashboard/analyst'
        },
        title: 'Analyst Dashboard'
      },
      {
        path: 'info',
        loadComponent: () => import('./shared/components/global-info/global-info.component').then(m => m.GlobalInfoComponent),
        title: 'Information & Contact'
      }
    ]
  },
  { path: '', redirectTo: 'user-dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: 'user-dashboard' }
];
