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

type ChangeEmailStep = 'confirm' | 'code' | 'new-email' | 'result';

export interface ChangeEmailModalResult {
  success: boolean;
  newEmail?: string;
}

@Component({
  selector: 'app-change-email-modal',
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
    <div class="change-email-modal">
      <div class="modal-header">
        <h2 mat-dialog-title>{{ getTitle() }}</h2>
        <button mat-icon-button (click)="onClose()" [disabled]="loading">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <mat-dialog-content class="modal-content">
        <div *ngIf="step === 'confirm'" class="confirm-container">
          <p class="confirm-message">Você deseja alterar seu e-mail?</p>
          <p class="confirm-subtitle">Enviaremos um código para o seu e-mail atual.</p>
        </div>

        <form *ngIf="step === 'code'" [formGroup]="codeForm" class="modal-form">
          <p class="step-description">Digite o código recebido no e-mail atual.</p>

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

        <form *ngIf="step === 'new-email'" [formGroup]="emailForm" class="modal-form">
          <p class="step-description">Código validado. Informe o novo e-mail.</p>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Novo e-mail</mat-label>
            <input
              matInput
              formControlName="newEmail"
              type="email"
              placeholder="novo@email.com"
              autocomplete="email">
            <mat-icon matSuffix>mail</mat-icon>
            <mat-error *ngIf="emailForm.get('newEmail')?.hasError('required')">
              Novo e-mail é obrigatório
            </mat-error>
            <mat-error *ngIf="emailForm.get('newEmail')?.hasError('email')">
              Informe um e-mail válido
            </mat-error>
          </mat-form-field>
        </form>

        <div *ngIf="step === 'result'" class="result-container">
          <div class="result-icon" [class.success]="resultSuccess" [class.error]="!resultSuccess">
            <mat-icon>{{ resultSuccess ? 'check_circle' : 'cancel' }}</mat-icon>
          </div>
          <h3>{{ resultSuccess ? 'E-mail alterado com sucesso!' : 'Não foi possível alterar o e-mail' }}</h3>
          <p>
            {{ resultSuccess
              ? 'Seu e-mail foi atualizado no sistema.'
              : 'Houve um problema interno ao alterar o e-mail e ele não foi modificado.' }}
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
              {{ loading ? 'Enviando...' : 'Aceitar' }}
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
              {{ loading ? 'Validando...' : 'Confirmar Código' }}
            </button>
          </ng-container>

          <ng-container *ngSwitchCase="'new-email'">
            <button mat-stroked-button (click)="onClose()" [disabled]="loading">
              Cancelar
            </button>
            <button
              mat-raised-button
              color="primary"
              (click)="onConfirmEmailChange()"
              [disabled]="!emailForm.valid || loading">
              <mat-icon class="loading-icon" *ngIf="loading">hourglass_empty</mat-icon>
              {{ loading ? 'Alterando...' : 'Confirmar' }}
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
  styleUrls: ['./change-email-modal.component.scss']
})
export class ChangeEmailModalComponent {
  step: ChangeEmailStep = 'confirm';
  codeForm: FormGroup;
  emailForm: FormGroup;
  loading = false;
  verificationToken = '';
  resultSuccess = false;
  updatedEmail = '';

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<ChangeEmailModalComponent>
  ) {
    this.codeForm = this.fb.group({
      code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
    });

    this.emailForm = this.fb.group({
      newEmail: ['', [Validators.required, Validators.email]]
    });
  }

  getTitle(): string {
    if (this.step === 'confirm') {
      return 'Alterar E-mail';
    }

    if (this.step === 'code') {
      return 'Validar Código';
    }

    if (this.step === 'new-email') {
      return 'Novo E-mail';
    }

    return 'Resultado';
  }

  onRequestCode(): void {
    this.loading = true;

    this.userService.requestChangeEmailCode().subscribe({
      next: () => {
        this.loading = false;
        this.step = 'code';
        this.snackBar.open('Código enviado para o seu e-mail atual.', 'Fechar', {
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

    this.userService.validateChangeEmailCode(code).subscribe({
      next: (response) => {
        this.loading = false;
        this.verificationToken = response.data || '';
        this.step = 'new-email';
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

  onConfirmEmailChange(): void {
    if (!this.emailForm.valid || !this.verificationToken) {
      this.emailForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.updatedEmail = this.emailForm.get('newEmail')?.value || '';

    this.userService.confirmChangeEmail({
      novoEmail: this.updatedEmail,
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
    const result: ChangeEmailModalResult = {
      success: this.resultSuccess,
      newEmail: this.resultSuccess ? this.updatedEmail : undefined
    };
    this.dialogRef.close(result);
  }
}
