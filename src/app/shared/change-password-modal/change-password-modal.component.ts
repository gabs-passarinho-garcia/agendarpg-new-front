import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { UserService } from '../../services/user/user.service';

type ChangePasswordStep = 'confirm' | 'code' | 'new-password' | 'result';

@Component({
  selector: 'app-change-password-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    ReactiveFormsModule,
    MatSnackBarModule
  ],
  template: `
    <div class="change-password-modal">
      <div class="modal-header">
        <h2 mat-dialog-title>{{ getTitle() }}</h2>
        <button mat-icon-button (click)="onClose()" [disabled]="loading">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <mat-dialog-content class="modal-content">
        <div *ngIf="step === 'confirm'" class="confirm-container">
          <p class="confirm-message">Você realmente deseja trocar sua senha?</p>
          <p class="confirm-subtitle">Enviaremos um código de validação para o e-mail cadastrado.</p>
        </div>

        <form *ngIf="step === 'code'" [formGroup]="codeForm" class="password-form">
          <p class="step-description">Informe o código recebido por e-mail para continuar.</p>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Código de verificação</mat-label>
            <input
              matInput
              formControlName="code"
              placeholder="Digite o código de 6 dígitos"
              inputmode="numeric"
              maxlength="6"
              autocomplete="one-time-code">
            <mat-error *ngIf="codeForm.get('code')?.hasError('required')">
              Código é obrigatório
            </mat-error>
            <mat-error *ngIf="codeForm.get('code')?.hasError('pattern')">
              O código deve conter 6 dígitos
            </mat-error>
          </mat-form-field>
        </form>

        <form *ngIf="step === 'new-password'" [formGroup]="newPasswordForm" class="password-form">
          <p class="step-description">Código validado. Defina sua nova senha.</p>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Nova Senha</mat-label>
            <input
              matInput
              [type]="hideNewPassword ? 'password' : 'text'"
              formControlName="newPassword"
              placeholder="Digite a nova senha"
              autocomplete="new-password">
            <button
              mat-icon-button
              matSuffix
              type="button"
              (click)="hideNewPassword = !hideNewPassword"
              [attr.aria-label]="'Mostrar/ocultar senha'"
              [attr.aria-pressed]="hideNewPassword">
              <mat-icon>{{hideNewPassword ? 'visibility_off' : 'visibility'}}</mat-icon>
            </button>
            <mat-error *ngIf="newPasswordForm.get('newPassword')?.hasError('required')">
              Nova senha é obrigatória
            </mat-error>
            <mat-error *ngIf="newPasswordForm.get('newPassword')?.hasError('minlength')">
              Nova senha deve ter pelo menos 6 caracteres
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Confirmar Nova Senha</mat-label>
            <input
              matInput
              [type]="hideConfirmPassword ? 'password' : 'text'"
              formControlName="confirmPassword"
              placeholder="Confirme a nova senha"
              autocomplete="new-password">
            <button
              mat-icon-button
              matSuffix
              type="button"
              (click)="hideConfirmPassword = !hideConfirmPassword"
              [attr.aria-label]="'Mostrar/ocultar senha'"
              [attr.aria-pressed]="hideConfirmPassword">
              <mat-icon>{{hideConfirmPassword ? 'visibility_off' : 'visibility'}}</mat-icon>
            </button>
            <mat-error *ngIf="newPasswordForm.get('confirmPassword')?.hasError('required')">
              Confirmação de senha é obrigatória
            </mat-error>
            <mat-error *ngIf="newPasswordForm.hasError('passwordMismatch') && !newPasswordForm.get('confirmPassword')?.hasError('required')">
              As senhas não conferem
            </mat-error>
          </mat-form-field>

          <div class="password-requirements">
            <p><strong>Requisitos da senha:</strong></p>
            <ul>
              <li>Mínimo de 6 caracteres</li>
              <li>Recomendado: use uma combinação de letras, números e símbolos</li>
            </ul>
          </div>
        </form>

        <div *ngIf="step === 'result'" class="result-container">
          <div class="result-icon" [class.success]="resultSuccess" [class.error]="!resultSuccess">
            <mat-icon>{{ resultSuccess ? 'check_circle' : 'cancel' }}</mat-icon>
          </div>
          <h3>{{ resultSuccess ? 'Senha alterada com sucesso!' : 'Não foi possível alterar a senha' }}</h3>
          <p>
            {{ resultSuccess
              ? 'Sua senha foi atualizada. Use a nova senha no próximo login.'
              : 'Houve um problema interno ao trocar a senha e ela não foi alterada.' }}
          </p>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions class="modal-actions">
        <ng-container [ngSwitch]="step">
          <ng-container *ngSwitchCase="'confirm'">
            <button mat-stroked-button (click)="onClose()" [disabled]="loading">
              Cancelar
            </button>
            <button
              mat-raised-button
              color="primary"
              (click)="onRequestCode()"
              [disabled]="loading">
              <mat-icon class="loading-icon" *ngIf="loading">hourglass_empty</mat-icon>
              {{loading ? 'Enviando...' : 'Aceitar'}}
            </button>
          </ng-container>

          <ng-container *ngSwitchCase="'code'">
            <button mat-stroked-button (click)="onClose()" [disabled]="loading">
              Cancelar
            </button>
            <button
              mat-raised-button
              color="primary"
              (click)="onValidateCode()"
              [disabled]="!codeForm.valid || loading">
              <mat-icon class="loading-icon" *ngIf="loading">hourglass_empty</mat-icon>
              {{loading ? 'Validando...' : 'Validar Código'}}
            </button>
          </ng-container>

          <ng-container *ngSwitchCase="'new-password'">
            <button mat-stroked-button (click)="onClose()" [disabled]="loading">
              Cancelar
            </button>
            <button
              mat-raised-button
              color="primary"
              (click)="onConfirmPasswordChange()"
              [disabled]="!newPasswordForm.valid || loading">
              <mat-icon class="loading-icon" *ngIf="loading">hourglass_empty</mat-icon>
              {{loading ? 'Alterando...' : 'Alterar Senha'}}
            </button>
          </ng-container>

          <ng-container *ngSwitchCase="'result'">
            <button
              mat-raised-button
              color="primary"
              class="single-action"
              (click)="onClose()">
              OK
            </button>
          </ng-container>
        </ng-container>
      </mat-dialog-actions>
    </div>
  `,
  styleUrls: ['./change-password-modal.component.scss']
})
export class ChangePasswordModalComponent {
  step: ChangePasswordStep = 'confirm';
  codeForm: FormGroup;
  newPasswordForm: FormGroup;
  hideNewPassword = true;
  hideConfirmPassword = true;
  loading = false;
  verificationToken = '';
  resultSuccess = false;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<ChangePasswordModalComponent>
  ) {
    this.codeForm = this.fb.group({
      code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
    });

    this.newPasswordForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  getTitle(): string {
    if (this.step === 'confirm') {
      return 'Trocar Senha';
    }

    if (this.step === 'code') {
      return 'Validar Código';
    }

    if (this.step === 'new-password') {
      return 'Nova Senha';
    }

    return 'Resultado';
  }

  private passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');

    if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

  onRequestCode(): void {
    this.loading = true;
    this.userService.requestChangePasswordCode().subscribe({
      next: () => {
        this.loading = false;
        this.step = 'code';
        this.snackBar.open('Código enviado para o seu e-mail cadastrado.', 'Fechar', {
          duration: 3500,
          panelClass: ['snackbar-success']
        });
      },
      error: (error) => {
        this.loading = false;
        const errorMessage = error?.error?.message || 'Não foi possível solicitar o código agora. Tente novamente.';
        this.snackBar.open(errorMessage, 'Fechar', {
          duration: 4000,
          panelClass: ['snackbar-error']
        });
      }
    });
  }

  onValidateCode(): void {
    if (!this.codeForm.valid) {
      this.codeForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    const code = this.codeForm.get('code')?.value;

    this.userService.validateChangePasswordCode(code).subscribe({
      next: (response) => {
        this.loading = false;
        this.verificationToken = response.data || '';
        this.step = 'new-password';
      },
      error: (error) => {
        this.loading = false;
        const errorMessage = error?.error?.message || 'Código inválido ou expirado.';
        this.snackBar.open(errorMessage, 'Fechar', {
          duration: 4000,
          panelClass: ['snackbar-error']
        });
      }
    });
  }

  onConfirmPasswordChange(): void {
    if (!this.newPasswordForm.valid || !this.verificationToken) {
      this.newPasswordForm.markAllAsTouched();
      return;
    }

    this.loading = true;

    this.userService.confirmChangePassword({
      novaSenha: this.newPasswordForm.get('newPassword')?.value,
      confirmacaoNovaSenha: this.newPasswordForm.get('confirmPassword')?.value,
      tokenVerificacao: this.verificationToken
    }).subscribe({
      next: () => {
        this.loading = false;
        this.resultSuccess = true;
        this.step = 'result';
      },
      error: () => {
        this.loading = false;
        this.resultSuccess = false;
        this.step = 'result';
      }
    });
  }

  onClose(): void {
    this.dialogRef.close(this.resultSuccess);
  }
}
