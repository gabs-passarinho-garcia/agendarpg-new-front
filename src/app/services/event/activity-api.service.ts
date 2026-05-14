import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ActivityModel, CreateActivityPayload, UpdateActivityPayload } from '../../models/activity.model';
import { ResponseModel } from '../../models/response';
import { StateService } from '../state/state.service';

@Injectable({
  providedIn: 'root'
})
export class ActivityApiService {
  private readonly BASE_API_URL = environment.apiUrl;

  constructor(
    private readonly http: HttpClient,
    private readonly stateService: StateService
  ) {}

  getByEvent(eventId: number): Observable<ResponseModel<ActivityModel[]>> {
    return this.http.get<ResponseModel<ActivityModel[]>>(`${this.BASE_API_URL}/events/${eventId}/activities`);
  }

  getById(id: number): Observable<ResponseModel<ActivityModel>> {
    return this.http.get<ResponseModel<ActivityModel>>(`${this.BASE_API_URL}/activities/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  create(eventId: number, payload: CreateActivityPayload): Observable<ResponseModel<ActivityModel>> {
    return this.http.post<ResponseModel<ActivityModel>>(`${this.BASE_API_URL}/events/${eventId}/activities`, payload, {
      headers: this.getAuthHeaders()
    });
  }

  update(id: number, payload: UpdateActivityPayload): Observable<ResponseModel<ActivityModel>> {
    return this.http.put<ResponseModel<ActivityModel>>(`${this.BASE_API_URL}/activities/${id}`, payload, {
      headers: this.getAuthHeaders()
    });
  }

  delete(id: number): Observable<ResponseModel<void>> {
    return this.http.delete<ResponseModel<void>>(`${this.BASE_API_URL}/activities/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  register(id: number): Observable<ResponseModel<ActivityModel>> {
    return this.http.post<ResponseModel<ActivityModel>>(`${this.BASE_API_URL}/activities/${id}/register`, {}, {
      headers: this.getAuthHeaders()
    });
  }

  unregister(id: number): Observable<ResponseModel<ActivityModel>> {
    return this.http.delete<ResponseModel<ActivityModel>>(`${this.BASE_API_URL}/activities/${id}/register`, {
      headers: this.getAuthHeaders()
    });
  }

  private getAuthHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${this.stateService.token}`
    });
  }
}
