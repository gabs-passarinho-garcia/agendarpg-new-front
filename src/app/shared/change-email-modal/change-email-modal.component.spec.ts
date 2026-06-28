import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

import { ChangeEmailModalComponent } from './change-email-modal.component';
import { UserService } from '../../services/user/user.service';

describe('ChangeEmailModalComponent', () => {
  let component: ChangeEmailModalComponent;
  let fixture: ComponentFixture<ChangeEmailModalComponent>;
  let mockUserService: jasmine.SpyObj<UserService>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<ChangeEmailModalComponent>>;

  beforeEach(async () => {
    const userServiceSpy = jasmine.createSpyObj('UserService', [
      'requestChangeEmailCode',
      'validateChangeEmailCode',
      'confirmChangeEmail'
    ]);
    const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);

    await TestBed.configureTestingModule({
      imports: [
        ChangeEmailModalComponent,
        NoopAnimationsModule
      ],
      providers: [
        { provide: UserService, useValue: userServiceSpy },
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: MAT_DIALOG_DATA, useValue: {} }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ChangeEmailModalComponent);
    component = fixture.componentInstance;
    mockUserService = TestBed.inject(UserService) as jasmine.SpyObj<UserService>;
    mockDialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<ChangeEmailModalComponent>>;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize forms and start at confirm step', () => {
    expect(component.step).toBe('confirm');
    expect(component.codeForm.get('code')?.hasError('required')).toBeTrue();
    expect(component.emailForm.get('newEmail')?.hasError('required')).toBeTrue();
  });

  it('should request code and move to code step', () => {
    mockUserService.requestChangeEmailCode.and.returnValue(of({
      statusCode: 200,
      satusMessage: 'OK',
      data: 'Codigo enviado'
    }));

    component.onRequestCode();

    expect(mockUserService.requestChangeEmailCode).toHaveBeenCalled();
    expect(component.step).toBe('code');
  });

  it('should validate code and move to new-email step with token', () => {
    component.step = 'code';
    component.codeForm.patchValue({ code: '123456' });

    mockUserService.validateChangeEmailCode.and.returnValue(of({
      statusCode: 200,
      satusMessage: 'OK',
      data: 'TOKEN_VERIFICACAO_AQUI'
    }));

    component.onValidateCode();

    expect(mockUserService.validateChangeEmailCode).toHaveBeenCalledWith('123456');
    expect(component.verificationToken).toBe('TOKEN_VERIFICACAO_AQUI');
    expect(component.step).toBe('new-email');
  });

  it('should show result success on email confirm success', () => {
    component.step = 'new-email';
    component.verificationToken = 'TOKEN_VERIFICACAO_AQUI';
    component.emailForm.patchValue({ newEmail: 'novo@email.com' });

    mockUserService.confirmChangeEmail.and.returnValue(of({
      statusCode: 200,
      satusMessage: 'OK',
      data: undefined
    }));

    component.onConfirmEmailChange();

    expect(component.step).toBe('result');
    expect(component.resultSuccess).toBeTrue();
  });

  it('should show result error on email confirm failure', () => {
    component.step = 'new-email';
    component.verificationToken = 'TOKEN_VERIFICACAO_AQUI';
    component.emailForm.patchValue({ newEmail: 'novo@email.com' });

    mockUserService.confirmChangeEmail.and.returnValue(throwError(() => ({ status: 500 })));

    component.onConfirmEmailChange();

    expect(component.step).toBe('result');
    expect(component.resultSuccess).toBeFalse();
  });

  it('should close dialog with success and updated email', () => {
    component.resultSuccess = true;
    component.updatedEmail = 'novo@email.com';

    component.onClose();

    expect(mockDialogRef.close).toHaveBeenCalledWith({
      success: true,
      newEmail: 'novo@email.com'
    });
  });

  it('should keep invalid email form as invalid', () => {
    component.emailForm.patchValue({ newEmail: 'email-invalido' });
    expect(component.emailForm.valid).toBeFalse();
  });
});
