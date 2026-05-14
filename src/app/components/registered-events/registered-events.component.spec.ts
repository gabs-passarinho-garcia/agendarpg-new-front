import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, Subject } from 'rxjs';

import { RegisteredEventsComponent } from './registered-events.component';
import { EventUpdateService } from '../../services/event/event-update.service';
import { UserActivityApiService } from '../../services/user/user-activity-api.service';

describe('RegisteredEventsComponent', () => {
  let component: RegisteredEventsComponent;
  let fixture: ComponentFixture<RegisteredEventsComponent>;

  beforeEach(async () => {
    const updates$ = new Subject<string | void>();

    await TestBed.configureTestingModule({
      imports: [RegisteredEventsComponent],
      providers: [
        { provide: UserActivityApiService, useValue: { myRegistrations: () => of({ statusCode: 200, data: [] }) } },
        { provide: EventUpdateService, useValue: { eventUpdated$: updates$.asObservable() } }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegisteredEventsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
