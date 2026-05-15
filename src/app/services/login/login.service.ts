import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { ResponseModel } from '../../models/response';
import { HttpClient } from '@angular/common/http';
import { LoginModel } from '../../models/login';

import { AuthTokenModel } from '../../models/auth';

@Injectable({
  providedIn: 'root'
})
export class LoginService {
  API_URL = environment.apiUrl;

  constructor(
    private http: HttpClient,
  ) { }

  login(credentials: LoginModel): Observable<ResponseModel<AuthTokenModel>> {
    return this.http.post<ResponseModel<AuthTokenModel>>(`${this.API_URL}/login`, credentials);
  }
}
