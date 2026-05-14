import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { UserModel } from '../../../../models/user';

@Component({
  selector: 'app-user-details-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './user-details-modal.component.html',
  styleUrls: ['./user-details-modal.component.scss']
})
export class UserDetailsModalComponent {
  constructor(
    public dialogRef: MatDialogRef<UserDetailsModalComponent>,
    @Inject(MAT_DIALOG_DATA) public user: UserModel
  ) {}

  close(): void {
    this.dialogRef.close();
  }

  getTipoLabel(tipo: string): string {
    const tipos: { [key: string]: string } = {
      'JGD': 'Jogador',
      'NRD': 'Narrador',
      'CRD': 'Coordenador',
      'ADM': 'Administrador'
    };
    return tipos[tipo] || tipo;
  }

  getMenorLabel(menor: string): string {
    return menor === 'S' ? 'Sim' : 'Não';
  }

  formatPhone(phone: string): string {
    if (!phone) return 'Não informado';
    
    // Remove todos os caracteres não numéricos
    const cleaned = phone.replace(/\D/g, '');
    
    // Verifica se tem 11 dígitos (formato celular)
    if (cleaned.length === 11) {
      return `(${cleaned.substring(0, 2)})${cleaned.substring(2, 7)}-${cleaned.substring(7)}`;
    }
    
    // Verifica se tem 10 dígitos (formato fixo)
    if (cleaned.length === 10) {
      return `(${cleaned.substring(0, 2)})${cleaned.substring(2, 6)}-${cleaned.substring(6)}`;
    }
    
    // Retorna o telefone original se não estiver em um formato reconhecido
    return phone;
  }

  formatDate(date: string): string {
    if (!date) return 'Não informado';
    
    // Verifica se a data está no formato ISO (YYYY-MM-DD)
    if (date.includes('-')) {
      const parts = date.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
    }
    
    // Verifica se já está no formato dd/mm/yyyy
    if (date.includes('/')) {
      return date;
    }
    
    // Retorna a data original se não for reconhecida
    return date;
  }
}
