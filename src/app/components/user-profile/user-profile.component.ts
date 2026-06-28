import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { StateService } from '../../services/state/state.service';
import { UserService } from '../../services/user/user.service';
import { UserModel } from '../../models/user';
import { Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ChangePasswordModalComponent } from '../../shared/change-password-modal/change-password-modal.component';
import { ChangeEmailModalComponent, ChangeEmailModalResult } from '../../shared/change-email-modal/change-email-modal.component';
import { ReloginRequiredModalComponent } from '../../shared/relogin-required-modal/relogin-required-modal.component';
import { PhoneMask } from '../../utils/phone-mask';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatDialogModule,
    ReactiveFormsModule,
    FormsModule,
    MatSnackBarModule
  ],
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.scss'
})
export class UserProfileComponent implements OnInit {
  profileForm!: FormGroup;
  isEditing = false;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private stateService: StateService,
    private userService: UserService,
    private router: Router,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.loadUserProfile();
  }

  get isMinor(): boolean {
    return this.profileForm.get('menor')?.value === 'S';
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
    this.profileForm.get(fieldName)?.setValue(maskedValue, { emitEvent: false });
  }

  initForm(): void {
    this.profileForm = this.fb.group({
      id: [''],
      nomeCompleto: [{ value: '', disabled: true }],
      apelido: ['', [Validators.required, Validators.minLength(2)]],
      email: [{ value: '', disabled: true }, [Validators.required, Validators.email]],
      telefone: ['', [this.phoneValidator]],
      dataDeNascimento: [{ value: '', disabled: true }],
      tipo: [{ value: '', disabled: true }],
      menor: [''],
      password: [''],
      responsavel: [''],
      telefoneResponsavel: ['', [this.phoneValidator]]
    });
  }

  loadUserProfile(): void {
    this.loading = true;
    this.userService.getUserProfile().subscribe({
      next: (response) => {
        if (response.data) {
          this.profileForm.patchValue({
            id: response.data.id,
            nomeCompleto: response.data.nomeCompleto,
            apelido: response.data.apelido,
            email: response.data.email,
            telefone: PhoneMask.applyMask(response.data.telefone || ''),
            dataDeNascimento: this.formatBirthDateForDisplay(response.data.dataDeNascimento),
            tipo: response.data.tipo,
            menor: response.data.menor,
            password: response.data.password || '',
            responsavel: response.data.responsavel || '',
            telefoneResponsavel: PhoneMask.applyMask(response.data.telefoneResponsavel || '')
          });
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Erro ao carregar perfil:', error);
        // Fallback para dados do StateService
        const userData = this.stateService.userData;
        if (userData) {
          this.profileForm.patchValue({
            id: userData.id,
            nomeCompleto: userData.nomeCompleto,
            apelido: userData.apelido,
            email: userData.email,
            telefone: PhoneMask.applyMask(userData.telefone || ''),
            dataDeNascimento: this.formatBirthDateForDisplay(userData.dataDeNascimento),
            tipo: userData.tipo,
            menor: userData.menor,
            password: userData.password || '',
            responsavel: userData.responsavel || '',
            telefoneResponsavel: PhoneMask.applyMask(userData.telefoneResponsavel || '')
          });
        }
        this.loading = false;
      }
    });
  }

  onEditModeChange(): void {
    if (!this.isEditing) {
      // Cancelar edição - recarregar dados
      this.loadUserProfile();
    }
  }

  toggleEdit(): void {
    this.isEditing = !this.isEditing;
    if (!this.isEditing) {
      // Cancelar edição - recarregar dados
      this.loadUserProfile();
    }
  }

  onSave(): void {
    if (this.profileForm.valid) {
      this.loading = true;

      // Preparar dados do usuário para enviar ao backend
      // Usar getRawValue() para incluir campos disabled
      const formData = this.profileForm.getRawValue();

      const updatedUser: UserModel = {
        id: formData.id,
        email: formData.email,
        password: formData.password,
        nomeCompleto: formData.nomeCompleto,
        apelido: formData.apelido,
        dataDeNascimento: this.formatBirthDateForRequest(formData.dataDeNascimento),
        tipo: formData.tipo,
        telefone: PhoneMask.formatForBackend(formData.telefone || ''),
        menor: formData.menor,
        responsavel: formData.responsavel || '',
        telefoneResponsavel: PhoneMask.formatForBackend(formData.telefoneResponsavel || '')
      };


      this.userService.updateUserProfile(updatedUser).subscribe({
        next: (response) => {
          if (response.data) {

            // Atualizar dados no StateService
            this.updateStateServiceData();

            // Recarregar dados atualizados
            this.loadUserProfile();

            // Sair do modo de edição
            this.isEditing = false;
          }
          this.loading = false;

          this.snackBar.open(
            'Perfil atualizado com sucesso!',
            'Fechar',
            {
              duration: 3000,
              panelClass: ['snackbar-success']
            }
          );
        },
        error: (error) => {
          console.error('Erro ao atualizar perfil:', error);
          this.loading = false;
          this.snackBar.open(
            'Erro ao atualizar perfil. Tente novamente mais tarde.',
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

  private updateStateServiceData(): void {
    const formData = this.profileForm.getRawValue();
    const currentUserData = this.stateService.userData;
    if (currentUserData) {
      this.stateService.userData = {
        ...currentUserData,
        nomeCompleto: formData.nomeCompleto,
        apelido: formData.apelido,
        email: formData.email,
        telefone: formData.telefone,
        dataDeNascimento: this.formatBirthDateForRequest(formData.dataDeNascimento)
      };
    }
  }

  private formatBirthDateForDisplay(value: string | null | undefined): string {
    if (!value) {
      return '';
    }

    if (value.includes('/')) {
      return value;
    }

    const [datePart] = value.split('T');
    const parts = datePart.split('-');
    if (parts.length !== 3) {
      return value;
    }

    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  }

  private formatBirthDateForRequest(value: string | null | undefined): string {
    if (!value) {
      return '';
    }

    if (value.includes('-')) {
      return value.split('T')[0];
    }

    const parts = value.split('/');
    if (parts.length !== 3) {
      return value;
    }

    const [day, month, year] = parts;
    return `${year}-${month}-${day}`;
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  openChangePasswordModal(): void {
    const dialogRef = this.dialog.open(ChangePasswordModalComponent, {
      width: '500px',
      maxWidth: '90vw',
      disableClose: false,
      autoFocus: true,
      panelClass: 'change-password-dialog'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        // Senha alterada com sucesso
        console.log('Senha alterada com sucesso');
      }
    });
  }

  openChangeEmailModal(): void {
    const dialogRef = this.dialog.open(ChangeEmailModalComponent, {
      width: '500px',
      maxWidth: '90vw',
      disableClose: false,
      autoFocus: true,
      panelClass: 'change-email-dialog'
    });

    dialogRef.afterClosed().subscribe((result: ChangeEmailModalResult | undefined) => {
      if (result?.success && result.newEmail) {
        this.profileForm.patchValue({ email: result.newEmail });

        const currentUserData = this.stateService.userData;
        if (currentUserData) {
          this.stateService.userData = {
            ...currentUserData,
            email: result.newEmail
          };
        }

        const reloginDialogRef = this.dialog.open(ReloginRequiredModalComponent, {
          width: '450px',
          maxWidth: '90vw',
          disableClose: true,
          autoFocus: true
        });

        reloginDialogRef.afterClosed().subscribe((confirmRelogin: boolean) => {
          if (confirmRelogin) {
            this.stateService.logout();
            this.router.navigate(['/login']);
          }
        });
      }
    });
  }
}
