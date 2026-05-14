import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { UserModel } from '../../../../models/user';

@Component({
  selector: 'app-user-create-modal',
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
  templateUrl: './user-create-modal.component.html',
  styleUrls: ['./user-create-modal.component.scss']
})
export class UserCreateModalComponent implements OnInit {
  createForm!: FormGroup;

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
    public dialogRef: MatDialogRef<UserCreateModalComponent>,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  initializeForm(): void {
    this.createForm = this.fb.group({
      nomeCompleto: ['', [Validators.required, Validators.minLength(3)]],
      apelido: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      senha: ['', [Validators.required, Validators.minLength(6)]],
      telefone: ['', [Validators.required, this.validatePhone.bind(this)]],
      dataDeNascimento: ['', [Validators.required, this.validateDate.bind(this)]],
      tipo: ['JGD', [Validators.required]],
      menor: ['N', [Validators.required]],
      responsavel: [''],
      telefoneResponsavel: ['', [this.validatePhone.bind(this)]]
    });

    // Observa mudanças no campo 'dataDeNascimento' para atualizar automaticamente o campo 'menor'
    this.createForm.get('dataDeNascimento')?.valueChanges.subscribe(value => {
      if (value && this.isValidDate(value)) {
        const isMinor = this.calculateIsMinor(value);
        this.createForm.get('menor')?.setValue(isMinor ? 'S' : 'N', { emitEvent: true });
      }
    });

    // Observa mudanças no campo 'menor' para validar campos de responsável
    this.createForm.get('menor')?.valueChanges.subscribe(value => {
      const responsavelControl = this.createForm.get('responsavel');
      const telefoneResponsavelControl = this.createForm.get('telefoneResponsavel');

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
    if (this.createForm.valid) {
      const formData = this.createForm.value;

      // Formatar dados antes de enviar
      const newUser: any = {
        nomeCompleto: formData.nomeCompleto,
        apelido: formData.apelido,
        email: formData.email,
        password: formData.senha, // Renomeia 'senha' para 'password'
        telefone: this.cleanPhone(formData.telefone),
        dataDeNascimento: this.formatDateToISO(formData.dataDeNascimento),
        tipo: formData.tipo,
        menor: formData.menor,
        responsavel: formData.responsavel || undefined,
        telefoneResponsavel: formData.telefoneResponsavel ? this.cleanPhone(formData.telefoneResponsavel) : undefined
      };

      this.dialogRef.close(newUser);
    }
  }

  /**
   * Remove formatação do telefone, retornando apenas os números
   */
  cleanPhone(phone: string): string {
    if (!phone) return '';
    return phone.replace(/\D/g, '');
  }

  /**
   * Converte data de dd/mm/yyyy para yyyy-mm-dd
   */
  formatDateToISO(date: string): string {
    if (!date || !this.isValidDate(date)) return '';

    const parts = date.split('/');
    const day = parts[0];
    const month = parts[1];
    const year = parts[2];

    return `${year}-${month}-${day}`;
  }

  applyPhoneMask(event: any): void {
    let value = event.target.value.replace(/\D/g, '');

    if (value.length <= 10) {
      value = value.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1)$2-$3');
    } else {
      value = value.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1)$2-$3');
    }

    event.target.value = value;
    this.createForm.get(event.target.getAttribute('formControlName'))?.setValue(value, { emitEvent: false });
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
    this.createForm.get('dataDeNascimento')?.setValue(value, { emitEvent: false });
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
