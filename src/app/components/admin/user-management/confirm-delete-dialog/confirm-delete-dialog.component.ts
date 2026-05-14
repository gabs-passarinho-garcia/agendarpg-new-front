import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-confirm-delete-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="confirm-delete-dialog">
      <h2 mat-dialog-title>
        <mat-icon class="warning-icon">warning</mat-icon>
        Confirmar Exclusão
      </h2>

      <mat-dialog-content>
        <p>Tem certeza que deseja deletar o usuário:</p>
        <p class="user-name">{{ data.userName }}?</p>
        <p class="warning-text">Esta ação não pode ser desfeita.</p>
      </mat-dialog-content>

      <mat-dialog-actions>
        <button mat-stroked-button (click)="onCancel()">
          <mat-icon>close</mat-icon>
          Cancelar
        </button>
        <button mat-raised-button color="warn" (click)="onConfirm()">
          <mat-icon>delete</mat-icon>
          Deletar
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .confirm-delete-dialog {
      h2 {
        display: flex;
        align-items: center;
        gap: 12px;
        color: #d32f2f;
        margin: 0;
        padding: 20px 24px 16px;

        .warning-icon {
          color: #d32f2f;
          font-size: 28px;
          width: 28px;
          height: 28px;
        }
      }
    }

    mat-dialog-content {
      padding: 20px 24px;

      p {
        margin: 0 0 12px 0;
        color: #666;
        font-size: 16px;
      }

      .user-name {
        font-weight: 600;
        color: #333;
        font-size: 18px;
        margin: 16px 0;
      }

      .warning-text {
        color: #d32f2f;
        font-weight: 500;
        margin-top: 16px;
      }
    }

    mat-dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 16px 24px;
      border-top: 1px solid #e0e0e0;

      button {
        min-width: 120px;
        height: 40px;

        mat-icon {
          margin-right: 8px;
          font-size: 20px;
          width: 20px;
          height: 20px;
        }
      }
    }
  `]
})
export class ConfirmDeleteDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDeleteDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { userName: string }
  ) {}

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}
