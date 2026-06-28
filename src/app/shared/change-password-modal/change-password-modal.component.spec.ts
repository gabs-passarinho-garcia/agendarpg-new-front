import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

import { ChangePasswordModalComponent } from './change-password-modal.component';
import { UserService } from '../../services/user/user.service';

describe('ChangePasswordModalComponent', () => {
  let component: ChangePasswordModalComponent;
  let fixture: ComponentFixture<ChangePasswordModalComponent>;
  let mockUserService: jasmine.SpyObj<UserService>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<ChangePasswordModalComponent>>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;

  beforeEach(async () => {
    const userServiceSpy = jasmine.createSpyObj('UserService', [
      'requestChangePasswordCode',
      'validateChangePasswordCode',
      'confirmChangePassword'
    ]);
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

  it('should initialize forms and start at confirm step', () => {
    expect(component.step).toBe('confirm');
    expect(component.codeForm.get('code')?.hasError('required')).toBeTrue();
    expect(component.newPasswordForm.get('newPassword')?.hasError('required')).toBeTrue();
    expect(component.newPasswordForm.get('confirmPassword')?.hasError('required')).toBeTrue();
  });

  it('should validate password match on new password form', () => {
    component.newPasswordForm.patchValue({
      newPassword: 'new123',
      confirmPassword: 'different123'
    });

    expect(component.newPasswordForm.hasError('passwordMismatch')).toBeTrue();
  });

  it('should request code and move to code step', () => {
    mockUserService.requestChangePasswordCode.and.returnValue(of({
      statusCode: 200,
      satusMessage: 'OK',
      data: 'Código enviado com sucesso'
    }));

    component.onRequestCode();

    expect(mockUserService.requestChangePasswordCode).toHaveBeenCalled();
    expect(component.step).toBe('code');
  });

  it('should validate code and move to new-password step with token', () => {
    component.step = 'code';
    component.codeForm.patchValue({ code: '123456' });

    mockUserService.validateChangePasswordCode.and.returnValue(of({
      statusCode: 200,
      satusMessage: 'OK',
      data: 'TOKEN_VERIFICACAO_AQUI'
    }));

    component.onValidateCode();

    expect(mockUserService.validateChangePasswordCode).toHaveBeenCalledWith('123456');
    expect(component.verificationToken).toBe('TOKEN_VERIFICACAO_AQUI');
    expect(component.step).toBe('new-password');
  });

  it('should show result success on password confirm success', () => {
    component.step = 'new-password';
    component.verificationToken = 'TOKEN_VERIFICACAO_AQUI';
    component.newPasswordForm.patchValue({
      newPassword: 'newpassword123',
      confirmPassword: 'newpassword123'
    });

    mockUserService.confirmChangePassword.and.returnValue(of({
      statusCode: 200,
      satusMessage: 'OK',
      data: undefined,
    }));

    component.onConfirmPasswordChange();

    expect(component.step).toBe('result');
    expect(component.resultSuccess).toBeTrue();
  });

  it('should show result error on password confirm failure', () => {
    component.step = 'new-password';
    component.verificationToken = 'TOKEN_VERIFICACAO_AQUI';
    component.newPasswordForm.patchValue({
      newPassword: 'newpassword123',
      confirmPassword: 'newpassword123'
    });

    mockUserService.confirmChangePassword.and.returnValue(throwError(() => ({ status: 500 })));

    component.onConfirmPasswordChange();

    expect(component.step).toBe('result');
    expect(component.resultSuccess).toBeFalse();
  });

  it('should close dialog with result state', () => {
    component.resultSuccess = true;
    component.onClose();
    expect(mockDialogRef.close).toHaveBeenCalledWith(true);
  });

  it('should toggle new password visibility', () => {
    expect(component.hideNewPassword).toBeTrue();
    component.hideNewPassword = !component.hideNewPassword;
    expect(component.hideNewPassword).toBeFalse();
  });
});
