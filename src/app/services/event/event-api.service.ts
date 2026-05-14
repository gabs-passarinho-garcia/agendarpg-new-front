import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateEventPayload, EventModelV2, UpdateEventPayload } from '../../models/event.model';
import { ResponseModel } from '../../models/response';
import { StateService } from '../state/state.service';

@Injectable({
  providedIn: 'root'
})
export class EventApiService {
  private readonly API_URL = `${environment.apiUrl}/events`;

  constructor(
    private readonly http: HttpClient,
    private readonly stateService: StateService
  ) {}

  getEvents(): Observable<ResponseModel<EventModelV2[]>> {
    return this.http.get<ResponseModel<EventModelV2[]>>(this.API_URL);
  }

  getEventById(id: number): Observable<ResponseModel<EventModelV2>> {
    return this.http.get<ResponseModel<EventModelV2>>(`${this.API_URL}/${id}`);
  }

  createEvent(payload: CreateEventPayload): Observable<ResponseModel<EventModelV2>> {
    return this.http.post<ResponseModel<EventModelV2>>(this.API_URL, payload, {
      headers: this.getAuthHeaders()
    });
  }

  updateEvent(id: number, payload: UpdateEventPayload): Observable<ResponseModel<EventModelV2>> {
    return this.http.put<ResponseModel<EventModelV2>>(`${this.API_URL}/${id}`, payload, {
      headers: this.getAuthHeaders()
    });
  }

  deleteEvent(id: number): Observable<ResponseModel<void>> {
    return this.http.delete<ResponseModel<void>>(`${this.API_URL}/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  myCreatedEvents(): Observable<ResponseModel<EventModelV2[]>> {
    return this.http.get<ResponseModel<EventModelV2[]>>(`${this.API_URL}/my-created`, {
      headers: this.getAuthHeaders()
    });
  }

  private getAuthHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${this.stateService.token}`
    });
  }
}
