/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { ForgotPasswordService } from './forgot-password.service';

describe('Service: ForgotPassword', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ForgotPasswordService, provideHttpClient()]
    });
  });

  it('should ...', inject([ForgotPasswordService], (service: ForgotPasswordService) => {
    expect(service).toBeTruthy();
  }));
});
