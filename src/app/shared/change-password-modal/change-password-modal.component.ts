import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { UserService } from '../../services/user/user.service';
import { ChangePasswordProfileModel } from '../../models/changePasswordProfile';

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
        <h2 mat-dialog-title>Alterar Senha</h2>
        <button mat-icon-button (click)="onClose()">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <mat-dialog-content class="modal-content">
        <form [formGroup]="passwordForm" class="password-form">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Senha Atual</mat-label>
            <input
              matInput
              [type]="hideCurrentPassword ? 'password' : 'text'"
              formControlName="currentPassword"
              placeholder="Digite sua senha atual"
              autocomplete="current-password">
            <button
              mat-icon-button
              matSuffix
              type="button"
              (click)="hideCurrentPassword = !hideCurrentPassword"
              [attr.aria-label]="'Hide password'"
              [attr.aria-pressed]="hideCurrentPassword">
              <mat-icon>{{hideCurrentPassword ? 'visibility_off' : 'visibility'}}</mat-icon>
            </button>
            <mat-error *ngIf="passwordForm.get('currentPassword')?.hasError('required')">
              Senha atual é obrigatória
            </mat-error>
          </mat-form-field>

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
              [attr.aria-label]="'Hide password'"
              [attr.aria-pressed]="hideNewPassword">
              <mat-icon>{{hideNewPassword ? 'visibility_off' : 'visibility'}}</mat-icon>
            </button>
            <mat-error *ngIf="passwordForm.get('newPassword')?.hasError('required')">
              Nova senha é obrigatória
            </mat-error>
            <mat-error *ngIf="passwordForm.get('newPassword')?.hasError('minlength')">
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
              [attr.aria-label]="'Hide password'"
              [attr.aria-pressed]="hideConfirmPassword">
              <mat-icon>{{hideConfirmPassword ? 'visibility_off' : 'visibility'}}</mat-icon>
            </button>
            <mat-error *ngIf="passwordForm.get('confirmPassword')?.hasError('required')">
              Confirmação de senha é obrigatória
            </mat-error>
            <mat-error *ngIf="passwordForm.hasError('passwordMismatch') && !passwordForm.get('confirmPassword')?.hasError('required')">
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
      </mat-dialog-content>

      <mat-dialog-actions class="modal-actions">
        <button mat-stroked-button (click)="onClose()" [disabled]="loading">
          Cancelar
        </button>
        <button
          mat-raised-button
          color="primary"
          (click)="onChangePassword()"
          [disabled]="!passwordForm.valid || loading">
          <mat-icon *ngIf="loading">hourglass_empty</mat-icon>
          {{loading ? 'Alterando...' : 'Alterar Senha'}}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styleUrls: ['./change-password-modal.component.scss']
})
export class ChangePasswordModalComponent {
  passwordForm: FormGroup;
  hideCurrentPassword = true;
  hideNewPassword = true;
  hideConfirmPassword = true;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<ChangePasswordModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  private passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');

    if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

  onChangePassword(): void {
    if (this.passwordForm.valid) {
      this.loading = true;

      const changePasswordData: ChangePasswordProfileModel = {
        senhaAtual: this.passwordForm.get('currentPassword')?.value,
        novaSenha: this.passwordForm.get('newPassword')?.value,
        confirmacaoNovaSenha: this.passwordForm.get('confirmPassword')?.value
      };

      this.userService.changePassword(changePasswordData).subscribe({
        next: (response) => {
          this.loading = false;
          this.snackBar.open(
            'Senha alterada com sucesso!',
            'Fechar',
            {
              duration: 3000,
              panelClass: ['snackbar-success']
            }
          );
          this.dialogRef.close(true);
        },
        error: (error) => {
          this.loading = false;
          console.error('Erro ao alterar senha:', error);

          let errorMessage = 'Erro ao alterar senha. Tente novamente.';

          // Verificar se é erro de senha atual incorreta
          if (error.status === 400 || error.status === 401) {
            errorMessage = 'Senha atual incorreta. Verifique e tente novamente.';
          } else if (error.status === 422) {
            errorMessage = 'Dados inválidos. Verifique os campos e tente novamente.';
          }

          this.snackBar.open(
            errorMessage,
            'Fechar',
            {
              duration: 4000,
              panelClass: ['snackbar-error']
            }
          );
        }
      });
    }
  }

  onClose(): void {
    this.dialogRef.close(false);
  }
}
