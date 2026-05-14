import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, MAT_DATE_LOCALE, MAT_DATE_FORMATS, DateAdapter } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { UserService } from '../../services/user/user.service';
import { PhoneMask } from '../../utils/phone-mask';

// Configuração de formato de data brasileiro
export const BR_DATE_FORMATS = {
  parse: {
    dateInput: 'DD/MM/YYYY',
  },
  display: {
    dateInput: 'DD/MM/YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'DD/MM/YYYY',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

@Component({
  selector: 'app-register-new-user',
  standalone: true,
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'pt-BR' },
    { provide: MAT_DATE_FORMATS, useValue: BR_DATE_FORMATS },
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSelectModule,
    MatIconModule
  ],
  templateUrl: './register-new-user.component.html',
  styleUrl: './register-new-user.component.scss'
})
export class RegisterNewUserComponent implements OnInit {
  userForm!: FormGroup;
  hidePassword = true;
  loading = false;

  // Tipos de usuário disponíveis
  userTypes = [
    { value: 'JGD', label: 'Jogador' },
    { value: 'NRD', label: 'Narrador' }
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private userService: UserService,
    private dateAdapter: DateAdapter<Date>
  ) {}

  ngOnInit(): void {
    this.dateAdapter.setLocale('pt-BR');
    this.initForm();
  }

  // Validador customizado para telefone
  phoneValidator = (control: any) => {
    if (!control.value) return null;
    const isValid = PhoneMask.isValid(control.value);
    return isValid ? null : { invalidPhone: true };
  };

  // Aplica máscara no campo de telefone
  onPhoneInput(event: any, fieldName: string): void {
    const input = event.target;
    const maskedValue = PhoneMask.applyMask(input.value);

    // Atualiza o valor do input
    input.value = maskedValue;

    // Atualiza o FormControl
    this.userForm.get(fieldName)?.setValue(maskedValue, { emitEvent: false });
  }

  initForm(): void {
    this.userForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      nomeCompleto: ['', [Validators.required, Validators.minLength(3)]],
      apelido: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(25)]],
      dataDeNascimento: ['', Validators.required],
      tipo: ['JGD', Validators.required],
      telefone: ['', [Validators.required, this.phoneValidator]],
      responsavel: [''],
      telefoneResponsavel: ['', this.phoneValidator]
    });

    // Observar mudanças na data de nascimento para validações condicionais
    this.userForm.get('dataDeNascimento')?.valueChanges.subscribe(date => {
      const responsavelControl = this.userForm.get('responsavel');
      const telefoneResponsavelControl = this.userForm.get('telefoneResponsavel');

      if (this.isMenor) {
        responsavelControl?.setValidators([Validators.required]);
        telefoneResponsavelControl?.setValidators([
          Validators.required,
          this.phoneValidator
        ]);
      } else {
        responsavelControl?.clearValidators();
        telefoneResponsavelControl?.clearValidators();
      }

      responsavelControl?.updateValueAndValidity();
      telefoneResponsavelControl?.updateValueAndValidity();
    });
  }

  calculateAge(birthDate: Date): number {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    return age;
  }

  formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  onSubmit(): void {
    if (this.userForm.valid) {
      this.loading = true;
      const formData = this.userForm.value;

      const userData = {
        email: formData.email,
        password: formData.password,
        nomeCompleto: formData.nomeCompleto,
        apelido: formData.apelido,
        dataDeNascimento: this.formatDate(formData.dataDeNascimento),
        tipo: formData.tipo,
        telefone: PhoneMask.formatForBackend(formData.telefone), // Remove máscara
        menor: this.isMenor ? 'S' : 'N',
        responsavel: formData.responsavel || '',
        telefoneResponsavel: PhoneMask.formatForBackend(formData.telefoneResponsavel || '') // Remove máscara
      };


      this.userService.registerUser(userData).subscribe({
        next: (response) => {
          this.loading = false;
          // Redirecionar para página de confirmação de email
          this.router.navigate(['/confirmacao-email'], {
            state: { email: formData.email }
          });
        },
        error: (error) => {
          console.error('Erro ao criar usuário:', error);
          this.loading = false;
        }
      });

      // Placeholder - simular sucesso após 2 segundos
      // setTimeout(() => {
      //   this.loading = false;
      //   alert('Usuário cadastrado com sucesso! (Simulação)');
      //   this.router.navigate(['/login']);
      // }, 2000);
    }
  }

  onCancel(): void {
    this.router.navigate(['/login']);
  }

  get isMenor(): boolean {
    const birthDate = this.userForm.get('dataDeNascimento')?.value;
    if (!birthDate) return false;

    return this.calculateAge(birthDate) < 18;
  }
}
