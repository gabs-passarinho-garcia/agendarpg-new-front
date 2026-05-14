import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

import { ChangePasswordModalComponent } from './change-password-modal.component';
import { UserService } from '../../services/user/user.service';
import { ChangePasswordProfileModel } from '../../models/changePasswordProfile';

describe('ChangePasswordModalComponent', () => {
  let component: ChangePasswordModalComponent;
  let fixture: ComponentFixture<ChangePasswordModalComponent>;
  let mockUserService: jasmine.SpyObj<UserService>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<ChangePasswordModalComponent>>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;

  beforeEach(async () => {
    const userServiceSpy = jasmine.createSpyObj('UserService', ['changePassword']);
    const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);

    await TestBed.configureTestingModule({
      imports: [
        ChangePasswordModalComponent,
        NoopAnimationsModule
      ],
      providers: [
        { provide: UserService, useValue: userServiceSpy },
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: MAT_DIALOG_DATA, useValue: {} }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ChangePasswordModalComponent);
    component = fixture.componentInstance;
    mockUserService = TestBed.inject(UserService) as jasmine.SpyObj<UserService>;
    mockDialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<ChangePasswordModalComponent>>;
    mockSnackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with validators', () => {
    expect(component.passwordForm.get('currentPassword')?.hasError('required')).toBeTrue();
    expect(component.passwordForm.get('newPassword')?.hasError('required')).toBeTrue();
    expect(component.passwordForm.get('confirmPassword')?.hasError('required')).toBeTrue();
  });

  it('should validate password match', () => {
    component.passwordForm.patchValue({
      currentPassword: 'current123',
      newPassword: 'new123',
      confirmPassword: 'different123'
    });

    expect(component.passwordForm.hasError('passwordMismatch')).toBeTrue();
  });

  it('should validate minimum password length', () => {
    component.passwordForm.get('newPassword')?.setValue('123');
    expect(component.passwordForm.get('newPassword')?.hasError('minlength')).toBeTrue();
  });

  it('should call changePassword service on valid form submission', () => {
    const changePasswordData: ChangePasswordProfileModel = {
      senhaAtual: 'current123',
      novaSenha: 'newpassword123',
      confirmacaoNovaSenha: 'newpassword123'
    };

    component.passwordForm.patchValue(changePasswordData);
    mockUserService.changePassword.and.returnValue(of({
      success: true,
      data: undefined,
      message: 'Success',
      statusCode: 200,
      satusMessage: 'OK'
    }));

    component.onChangePassword();

    expect(mockUserService.changePassword).toHaveBeenCalledWith(changePasswordData);
    expect(mockSnackBar.open).toHaveBeenCalledWith(
      'Senha alterada com sucesso!',
      'Fechar',
      jasmine.objectContaining({
        duration: 3000,
        panelClass: ['snackbar-success']
      })
    );
    expect(mockDialogRef.close).toHaveBeenCalledWith(true);
  });

  it('should handle error on password change', () => {
    const changePasswordData: ChangePasswordProfileModel = {
      senhaAtual: 'wrong123',
      novaSenha: 'newpassword123',
      confirmacaoNovaSenha: 'newpassword123'
    };

    component.passwordForm.patchValue(changePasswordData);
    mockUserService.changePassword.and.returnValue(throwError({ status: 401 }));

    component.onChangePassword();

    expect(mockSnackBar.open).toHaveBeenCalledWith(
      'Senha atual incorreta. Verifique e tente novamente.',
      'Fechar',
      jasmine.objectContaining({
        duration: 4000,
        panelClass: ['snackbar-error']
      })
    );
  });

  it('should close dialog when onClose is called', () => {
    component.onClose();
    expect(mockDialogRef.close).toHaveBeenCalledWith(false);
  });

  it('should toggle password visibility', () => {
    expect(component.hideCurrentPassword).toBeTrue();
    component.hideCurrentPassword = !component.hideCurrentPassword;
    expect(component.hideCurrentPassword).toBeFalse();
  });
});
