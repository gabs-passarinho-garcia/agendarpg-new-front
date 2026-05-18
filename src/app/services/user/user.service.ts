import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ResponseModel } from '../../models/response';
import { UserModel } from '../../models/user';
import { StateService } from '../state/state.service';
import { NarratorNicknameModel } from '../../models/narratorNickname';
import { ChangePasswordProfileModel } from '../../models/changePasswordProfile';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  API_URL = environment.apiUrl + `/user-app/user`;
  API_PUBLIC_URL = environment.apiUrl + `/public/user`;
  API_EMAIL_VERIFICATION_URL = environment.apiUrl + `/public/email-validation`;

  constructor(
    private http: HttpClient,
    private stateService: StateService
  ) { }

  getUserProfile(): Observable<ResponseModel<UserModel>> {
    const token = this.stateService.token
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<ResponseModel<UserModel>>(
      `${this.API_URL}/me`,
      { headers }
    );
  }

  registerUser(userData: UserModel): Observable<ResponseModel<UserModel>> {
    return this.http.post<ResponseModel<UserModel>>(
      `${this.API_PUBLIC_URL}/register`,
      userData
    );
  }

  getNarratorName(id: string | number): Observable<ResponseModel<NarratorNicknameModel>> {
    const token = this.stateService.token
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<ResponseModel<NarratorNicknameModel>>(
      `${this.API_URL}/narrator-name/${encodeURIComponent(String(id))}`,
      { headers }
    );
  }

  updateUserProfile(updatedData: UserModel): Observable<ResponseModel<UserModel>> {
    const token = this.stateService.token
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.put<ResponseModel<UserModel>>(
      `${this.API_URL}/update-profile/${updatedData.id}`,
      updatedData,
      { headers }
    );
  }

  changePassword(changePassword: ChangePasswordProfileModel): Observable<ResponseModel<void>> {
    const token = this.stateService.token
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.put<ResponseModel<void>>(
      `${this.API_URL}/change-password`,
      changePassword,
      { headers }
    );
  }

  resendActivationEmail(email: string): Observable<ResponseModel<void>> {
    return this.http.post<ResponseModel<void>>(
      `${this.API_EMAIL_VERIFICATION_URL}/resend-verification`,
      { email }
    );
  }

  verifyEmail(token: string): Observable<ResponseModel<void>> {
    return this.http.get<ResponseModel<void>>(
      `${this.API_EMAIL_VERIFICATION_URL}/verify-email?token=${token}`
    );
  }
}
