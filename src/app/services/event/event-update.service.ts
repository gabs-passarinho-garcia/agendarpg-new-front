import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EventUpdateService {
  private eventUpdated = new Subject<string | void>();

  eventUpdated$ = this.eventUpdated.asObservable();

  notifyEventUpdated(eventId?: string): void {
    this.eventUpdated.next(eventId);
  }
}
