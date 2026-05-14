import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ActivityModel } from '../../models/activity.model';
import { ResponseModel } from '../../models/response';
import { StateService } from '../state/state.service';

@Injectable({
  providedIn: 'root'
})
export class UserActivityApiService {
  private readonly API_URL = `${environment.apiUrl}/user-app/activities`;

  constructor(
    private readonly http: HttpClient,
    private readonly stateService: StateService
  ) {}

  myRegistrations(): Observable<ResponseModel<ActivityModel[]>> {
    return this.http.get<ResponseModel<ActivityModel[]>>(`${this.API_URL}/my-registrations`, {
      headers: this.getAuthHeaders()
    });
  }

  myCreations(): Observable<ResponseModel<ActivityModel[]>> {
    return this.http.get<ResponseModel<ActivityModel[]>>(`${this.API_URL}/my-creations`, {
      headers: this.getAuthHeaders()
    });
  }

  deleteActivity(id: number): Observable<ResponseModel<void>> {
    return this.http.delete<ResponseModel<void>>(`${environment.apiUrl}/activities/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  private getAuthHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${this.stateService.token}`
    });
  }
}
