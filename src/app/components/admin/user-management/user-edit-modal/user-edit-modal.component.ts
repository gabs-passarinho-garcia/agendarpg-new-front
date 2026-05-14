import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { UserModel } from '../../../../models/user';

@Component({
  selector: 'app-user-edit-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    ReactiveFormsModule
  ],
  templateUrl: './user-edit-modal.component.html',
  styleUrls: ['./user-edit-modal.component.scss']
})
export class UserEditModalComponent implements OnInit {
  editForm!: FormGroup;

  userTypes = [
    { value: 'JGD', label: 'Jogador' },
    { value: 'NRD', label: 'Narrador' },
    { value: 'CRD', label: 'Coordenador' },
    { value: 'ADM', label: 'Administrador' }
  ];

  minorOptions = [
    { value: 'S', label: 'Sim' },
    { value: 'N', label: 'Não' }
  ];

  constructor(
    public dialogRef: MatDialogRef<UserEditModalComponent>,
    @Inject(MAT_DIALOG_DATA) public user: UserModel,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  initializeForm(): void {
    this.editForm = this.fb.group({
      nomeCompleto: [this.user.nomeCompleto, [Validators.required, Validators.minLength(3)]],
      apelido: [this.user.apelido, [Validators.required]],
      email: [this.user.email, [Validators.required, Validators.email]],
      telefone: [this.formatPhoneForDisplay(this.user.telefone), [Validators.required, this.validatePhone.bind(this)]],
      dataDeNascimento: [this.formatDateForDisplay(this.user.dataDeNascimento), [Validators.required, this.validateDate.bind(this)]],
      tipo: [this.user.tipo, [Validators.required]],
      menor: [this.user.menor, [Validators.required]],
      responsavel: [this.user.responsavel || ''],
      telefoneResponsavel: [this.formatPhoneForDisplay(this.user.telefoneResponsavel || ''), [this.validatePhone.bind(this)]]
    });

    // Observa mudanças no campo 'dataDeNascimento' para atualizar automaticamente o campo 'menor'
    this.editForm.get('dataDeNascimento')?.valueChanges.subscribe(value => {
      if (value && this.isValidDate(value)) {
        const isMinor = this.calculateIsMinor(value);
        this.editForm.get('menor')?.setValue(isMinor ? 'S' : 'N', { emitEvent: true });
      }
    });

    // Observa mudanças no campo 'menor' para validar campos de responsável
    this.editForm.get('menor')?.valueChanges.subscribe(value => {
      const responsavelControl = this.editForm.get('responsavel');
      const telefoneResponsavelControl = this.editForm.get('telefoneResponsavel');

      if (value === 'S') {
        responsavelControl?.setValidators([Validators.required]);
        telefoneResponsavelControl?.setValidators([Validators.required, this.validatePhone.bind(this)]);
      } else {
        responsavelControl?.clearValidators();
        telefoneResponsavelControl?.clearValidators();
        telefoneResponsavelControl?.setValidators([this.validatePhone.bind(this)]);
      }

      responsavelControl?.updateValueAndValidity();
      telefoneResponsavelControl?.updateValueAndValidity();
    });
  }

  close(): void {
    this.dialogRef.close();
  }

  save(): void {
    if (this.editForm.valid) {
      const updatedUser: UserModel = {
        ...this.user,
        ...this.editForm.value
      };
      this.dialogRef.close(updatedUser);
    }
  }

  applyPhoneMask(event: any): void {
    let value = event.target.value.replace(/\D/g, '');

    if (value.length <= 10) {
      value = value.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1)$2-$3');
    } else {
      value = value.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1)$2-$3');
    }

    event.target.value = value;
    this.editForm.get(event.target.getAttribute('formControlName'))?.setValue(value, { emitEvent: false });
  }

  applyDateMask(event: any): void {
    let value = event.target.value.replace(/\D/g, '');

    if (value.length >= 8) {
      value = value.replace(/(\d{2})(\d{2})(\d{4})/, '$1/$2/$3');
    } else if (value.length >= 4) {
      value = value.replace(/(\d{2})(\d{2})/, '$1/$2/');
    } else if (value.length >= 2) {
      value = value.replace(/(\d{2})/, '$1/');
    }

    event.target.value = value;
    this.editForm.get('dataDeNascimento')?.setValue(value, { emitEvent: false });
  }

  formatPhoneForDisplay(phone: string): string {
    if (!phone) return '';

    const cleaned = phone.replace(/\D/g, '');

    if (cleaned.length === 11) {
      return `(${cleaned.substring(0, 2)})${cleaned.substring(2, 7)}-${cleaned.substring(7)}`;
    }

    if (cleaned.length === 10) {
      return `(${cleaned.substring(0, 2)})${cleaned.substring(2, 6)}-${cleaned.substring(6)}`;
    }

    return phone;
  }

  formatDateForDisplay(date: string): string {
    if (!date) return '';

    // Se a data está no formato ISO (YYYY-MM-DD), converte para dd/mm/yyyy
    if (date.includes('-')) {
      const parts = date.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
    }

    // Se já está no formato dd/mm/yyyy, retorna como está
    if (date.includes('/')) {
      return date;
    }

    return date;
  }

  // Validadores personalizados
  validatePhone(control: any): { [key: string]: boolean } | null {
    if (!control.value) return null;

    const cleaned = control.value.replace(/\D/g, '');

    if (cleaned.length !== 10 && cleaned.length !== 11) {
      return { invalidPhone: true };
    }

    return null;
  }

  validateDate(control: any): { [key: string]: boolean } | null {
    if (!control.value) return null;

    if (!this.isValidDate(control.value)) {
      return { invalidDate: true };
    }

    return null;
  }

  isValidDate(dateStr: string): boolean {
    if (!dateStr || dateStr.length !== 10) return false;

    const parts = dateStr.split('/');
    if (parts.length !== 3) return false;

    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);

    if (isNaN(day) || isNaN(month) || isNaN(year)) return false;
    if (day < 1 || day > 31) return false;
    if (month < 1 || month > 12) return false;
    if (year < 1900 || year > new Date().getFullYear()) return false;

    const date = new Date(year, month - 1, day);
    return date.getDate() === day && date.getMonth() === month - 1 && date.getFullYear() === year;
  }

  calculateIsMinor(dateStr: string): boolean {
    if (!this.isValidDate(dateStr)) return false;

    const parts = dateStr.split('/');
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);

    const birthDate = new Date(year, month - 1, day);
    const today = new Date();

    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age < 18;
  }
}
