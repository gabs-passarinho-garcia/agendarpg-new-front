import { Component } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-relogin-required-modal',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Atualização de acesso</h2>
    <mat-dialog-content>
      Para concluir a atualização do e-mail, faça login novamente com o novo e-mail.
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-raised-button color="primary" (click)="onOk()">OK</button>
    </mat-dialog-actions>
  `
})
export class ReloginRequiredModalComponent {
  constructor(private dialogRef: MatDialogRef<ReloginRequiredModalComponent>) {}

  onOk(): void {
    this.dialogRef.close(true);
  }
}
