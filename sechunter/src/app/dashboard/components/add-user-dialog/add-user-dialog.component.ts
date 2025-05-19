import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

@Component({
  selector: 'app-add-user-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatIconModule,
    MatSlideToggleModule
  ],
  templateUrl: './add-user-dialog.component.html',
  styleUrls: ['./add-user-dialog.component.scss']
})
export class AddUserDialogComponent {
  userForm: FormGroup;
  hidePassword = true;
  availableRoles = [
    { value: 'admin', label: 'Administrateur' },
    { value: 'superuser', label: 'Super Utilisateur' },
    { value: 'analyst', label: 'Analyste' }
  ];

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<AddUserDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.userForm = this.fb.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      roles: [['analyst'], [Validators.required]],
      mfaEnabled: [true]
    });
  }

  // Ajouter une méthode pour générer un mot de passe aléatoire
  generateRandomPassword(): void {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
    let password = '';

    // Assurer au moins une majuscule, une minuscule, un chiffre et un caractère spécial
    password += 'A' + 'a' + '1' + '!';

    // Ajouter des caractères aléatoires pour atteindre une longueur de 12
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // Mélanger le mot de passe
    password = password.split('').sort(() => 0.5 - Math.random()).join('');

    this.userForm.get('password')?.setValue(password);
  }

  onSubmit(): void {
    if (this.userForm.valid) {
      // Get form values
      const formValues = this.userForm.value;

      // Format the user data for the backend
      // The backend expects a single role string, but our form uses an array
      const primaryRole = Array.isArray(formValues.roles) && formValues.roles.length > 0
        ? formValues.roles[0]
        : 'analyst';

      // Create the user object with the format expected by the backend
      const newUser = {
        id: Date.now().toString(), // Temporary ID, will be replaced by the backend
        name: formValues.name,
        email: formValues.email,
        password: formValues.password,
        role: primaryRole, // Send the primary role
        roles: formValues.roles, // Keep the full roles array for the frontend
        mfaEnabled: formValues.mfaEnabled,
        lastLogin: new Date()
      };

      console.log('Submitting new user:', newUser);
      this.dialogRef.close(newUser);
    } else {
      // Mark all fields as touched to display errors
      Object.keys(this.userForm.controls).forEach(key => {
        const control = this.userForm.get(key);
        control?.markAsTouched();
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  getEmailErrorMessage(): string {
    const emailControl = this.userForm.get('email');
    if (emailControl?.hasError('required')) {
      return 'L\'email est requis';
    }
    return emailControl?.hasError('email') ? 'Email invalide' : '';
  }

  getPasswordErrorMessage(): string {
    const passwordControl = this.userForm.get('password');
    if (passwordControl?.hasError('required')) {
      return 'Le mot de passe est requis';
    }
    return passwordControl?.hasError('minlength') ? 'Le mot de passe doit contenir au moins 8 caractères' : '';
  }
}


