import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router, RouterModule } from '@angular/router';
// Sidebar component removed

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatSnackBarModule,
    RouterModule
  ],
  templateUrl: './user-dashboard.component.html',
  styleUrls: ['./user-dashboard.component.scss']
})
export class UserDashboardComponent implements OnInit {
  // Renamed to "Page d'accueil" but keeping the component name for compatibility
  // Module type constants
  readonly ASM_MODULE = 'asm';
  readonly VI_MODULE = 'vi';
  readonly CTI_MODULE = 'cti';
  readonly SOAR_MODULE = 'soar';

  // Track which image is currently displayed
  activeModule: 'asm' | 'vi' | 'cti' | 'soar' | null = null;

  // Image paths
  imagePaths = {
    asm: 'assets/images/asm.png',
    vi: 'assets/images/vi.png',
    cti: 'assets/images/cti.png',
    soar: 'assets/images/soar.png'
  };

  // Module display names
  moduleNames = {
    asm: 'Attack Surface Management',
    vi: 'Vulnerability Intelligence',
    cti: 'Cyber Threat Intelligence',
    soar: 'Security Orchestration'
  };

  constructor(private snackBar: MatSnackBar, private router: Router) {}

  ngOnInit(): void {
    // Default to showing no image
  }

  /**
   * Show the image for the selected module
   * @param module The module to show (asm, vi, cti, or soar)
   */
  showModule(module: 'asm' | 'vi' | 'cti' | 'soar'): void {
    console.log('Showing module:', module);
    this.activeModule = module;
  }

  /**
   * Handle menu selection from sidebar
   */
  handleMenuSelection(menuTitle: string): void {
    // Convert menu title to module name (lowercase and extract first word)
    const title = menuTitle.toLowerCase();

    if (title.includes('attack') || title.includes('asm')) {
      this.showModule(this.ASM_MODULE);
    } else if (title.includes('vulnerability') || title.includes('vi')) {
      this.showModule(this.VI_MODULE);
    } else if (title.includes('cyber') || title.includes('threat') || title.includes('cti')) {
      this.showModule(this.CTI_MODULE);
    } else if (title.includes('security') || title.includes('orchestration') || title.includes('soar')) {
      this.showModule(this.SOAR_MODULE);
    }
  }

  /**
   * Handle click on an image
   */
  onImageClick(event?: MouseEvent): void {
    console.log('Image clicked');
    if (event) {
      event.stopPropagation();
    }
    this.showSignInMessage();
  }

  /**
   * Show a stylized message about creating an account
   */
  showSignInMessage(): void {
    console.log('Showing sign-in message');
    try {
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
        console.log('Sign In button clicked in snackbar');
        this.navigateToAuth();
      });
    } catch (error) {
      console.error('Error showing snackbar:', error);
      // Fallback to direct navigation if snackbar fails
      this.navigateToAuth();
    }
  }

  /**
   * Navigate to the authentication page
   */
  navigateToAuth(): void {
    console.log('Navigating to auth page');
    this.router.navigate(['/auth']);
  }

  /**
   * Navigate to the signup page
   */
  navigateToSignup(): void {
    console.log('Navigating to signup page');
    this.router.navigate(['/signup']);
  }
}
