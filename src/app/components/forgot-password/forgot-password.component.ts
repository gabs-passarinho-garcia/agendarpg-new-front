import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatStepperModule } from '@angular/material/stepper';
import { Router } from '@angular/router';
import { ForgotPasswordService } from '../../services/user/forgot-password.service';
import { StateService } from '../../services/state/state.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatStepperModule,
    MatSnackBarModule
  ],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent implements OnInit {
  emailForm!: FormGroup;
  codeForm!: FormGroup;
  passwordForm!: FormGroup;

  currentStep = 1;
  loading = false;
  userEmail = '';
  resetToken = '';
  hidePassword = true;
  hideConfirmPassword = true;

  // Controles de estado das etapas
  emailSent = false;           // Etapa 1 concluída
  codeValidated = false;       // Etapa 2 concluída
  passwordChanged = false;     // Etapa 3 concluída

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private forgotPasswordService: ForgotPasswordService,
    private stateService: StateService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.initForms();
    this.validateCurrentStep();
  }

  // Validar se o usuário pode estar na etapa atual
  validateCurrentStep(): void {
    if (!this.canGoToStep(this.currentStep)) {
      this.currentStep = 1;
      this.resetAllStates();
    }
  }

  // Resetar todos os estados
  resetAllStates(): void {
    this.emailSent = false;
    this.codeValidated = false;
    this.passwordChanged = false;
    this.resetToken = '';
    this.userEmail = '';
    this.emailForm.reset();
    this.codeForm.reset();
    this.passwordForm.reset();
  }

  initForms(): void {
    this.emailForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });

    this.codeForm = this.fb.group({
      code: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(5)]]
    });

    this.passwordForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validator: this.passwordMatchValidator });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }

    if (confirmPassword?.errors?.['passwordMismatch']) {
      delete confirmPassword.errors['passwordMismatch'];
      if (Object.keys(confirmPassword.errors).length === 0) {
        confirmPassword.setErrors(null);
      }
    }

    return null;
  }

  // Etapa 1: Enviar código por email
  sendResetCode(): void {
    if (this.emailForm.valid) {
      this.loading = true;
      this.userEmail = this.emailForm.value.email;

      this.forgotPasswordService.sendRecoverCode(this.userEmail).subscribe({
        next: (response) => {
          this.emailSent = true;
          this.currentStep = 2;
          this.loading = false;
        },
        error: (error) => {
          console.error('Erro ao enviar código:', error);
          this.loading = false;
          // TODO: Mostrar mensagem de erro
        }
      });
    }
  }

  // Etapa 2: Validar código
  validateCode(): void {
    if (!this.canGoToStep(2)) {
      this.currentStep = 1;
      return;
    }

    if (this.codeForm.valid) {
      this.loading = true;
      const code = this.codeForm.value.code;

      this.forgotPasswordService.validateRecoverCode(this.userEmail, code).subscribe({
        next: (response) => {
          this.resetToken = response.data;
          this.codeValidated = true;
          this.currentStep = 3;
          this.loading = false;
        },
        error: (error) => {
          console.error('Erro ao validar código:', error);
          this.loading = false;
          // TODO: Mostrar mensagem de erro
        }
      });
    }
  }

  // Etapa 3: Alterar senha
  changePassword(): void {
    if (!this.canGoToStep(3)) {
      this.currentStep = 1;
      return;
    }

    if (this.passwordForm.valid) {
      this.loading = true;
      const newPassword = this.passwordForm.value.newPassword;

      this.forgotPasswordService.changePassword(this.userEmail, this.resetToken, newPassword).subscribe({
        next: (response) => {
          this.passwordChanged = true;
          this.loading = false;
          this.snackBar.open(
            'Senha alterada com sucesso!',
            'Fechar',
            {
              duration: 3000,
              panelClass: ['snackbar-success']
            }
          );
          this.router.navigate(['/login']);
        },
        error: (error) => {
          console.error('Erro ao alterar senha:', error);
          this.loading = false;
          this.snackBar.open(
            'Erro ao trocar senha.',
            'Fechar',
            {
              duration: 3000,
              panelClass: ['snackbar-error']
            }
          );
        }
      });
    }
  }

  goBack(): void {
    if (this.currentStep > 1) {
      this.currentStep--;

      // Resetar estados das etapas posteriores quando voltar
      if (this.currentStep === 1) {
        this.emailSent = false;
        this.codeValidated = false;
        this.resetToken = '';
        this.codeForm.reset();
        this.passwordForm.reset();
      } else if (this.currentStep === 2) {
        this.codeValidated = false;
        this.resetToken = '';
        this.passwordForm.reset();
      }
    } else {
      this.router.navigate(['/login']);
    }
  }

  // Método para verificar se pode avançar para uma etapa
  canGoToStep(step: number): boolean {
    switch (step) {
      case 1: return true;
      case 2: return this.emailSent;
      case 3: return this.emailSent && this.codeValidated;
      default: return false;
    }
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
