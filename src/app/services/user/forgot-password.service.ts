import { StateService } from './../state/state.service';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ResponseModel } from '../../models/response';
import { SendEmailResponseModel } from '../../models/sendEmailResponseModel';

@Injectable({
  providedIn: 'root'
})
export class ForgotPasswordService {
  API_PUBLIC_URL = environment.apiUrl + '/public/user';

  constructor(
    private http: HttpClient,
  ) { }

  sendRecoverCode(email: string): Observable<ResponseModel<SendEmailResponseModel>> {
    return this.http.post<ResponseModel<SendEmailResponseModel>>(`${this.API_PUBLIC_URL}/forgot-password`, { email });
  }

  validateRecoverCode(email: string, code: string): Observable<ResponseModel<string>> {
    return this.http.post<ResponseModel<string>>(`${this.API_PUBLIC_URL}/validate-reset-code`, { email, code });
  }

  changePassword(email: string, resetToken: string, newPassword: string): Observable<ResponseModel<boolean>> {
    return this.http.post<ResponseModel<boolean>>(`${this.API_PUBLIC_URL}/reset-password`, {
      email,
      resetToken,
      newPassword
    });
  }

}
