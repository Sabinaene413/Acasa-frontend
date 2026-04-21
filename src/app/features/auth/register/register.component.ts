import { Component, inject } from '@angular/core';

import { RouterLink, Router } from '@angular/router';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  FormGroup,
  AbstractControl,
} from '@angular/forms';
import { AuthService } from '../../../core/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
})
export class RegisterComponent {
  registerForm!: FormGroup;
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private toastService = inject(ToastService);

  constructor() {
    this.registerForm = this.fb.group(
      {
        name: ['', [Validators.required, Validators.minLength(3)]],
        email: ['', [Validators.required, Validators.email]],
        phoneNumber: ['', [Validators.required, Validators.pattern(/^[0-9+ ]{10,15}$/)]],
        password: [
          '',
          [Validators.required, Validators.minLength(6), this.passwordStrengthValidator],
        ],
        confirmPassword: ['', [Validators.required]],
      },
      {
        validators: this.passwordMatchValidator,
      },
    );
  }

  passwordMatchValidator(g: FormGroup) {
    return g.get('password')?.value === g.get('confirmPassword')?.value
      ? null
      : { mismatch: true };
  }

  registerGroup(controlName: string) {
    return this.registerForm.get(controlName)!;
  }

  passwordStrengthValidator(control: AbstractControl) {
    const value = control.value as string;
    if (!value) return null;

    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasDigit = /[0-9]/.test(value);
    const hasSpecial = /[^a-zA-Z0-9]/.test(value);

    const errors: Record<string, boolean> = {};
    if (!hasUpperCase) errors['requiresUpperCase'] = true;
    if (!hasLowerCase) errors['requiresLowerCase'] = true;
    if (!hasDigit) errors['requiresDigit'] = true;
    if (!hasSpecial) errors['requiresSpecial'] = true;

    return Object.keys(errors).length > 0 ? errors : null;
  }

  onSubmit() {
    if (this.registerForm.valid) {
      const { name, email, phoneNumber, password } = this.registerForm.value;
      this.authService.register({ name, email, phoneNumber, password }).subscribe({
        next: (response) => {
          this.toastService.success(
            'Succes',
            'Contul tău a fost creat cu succes!',
          );
          this.router.navigate(['/login']);
        },
        error: (err) => {
          this.toastService.error(
            'Eroare',
            'A apărut o eroare la crearea contului.',
          );
        },
      });
    }
  }
}
