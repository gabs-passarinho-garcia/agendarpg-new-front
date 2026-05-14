import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, Subject } from 'rxjs';

import { MyEventsComponent } from './my-events.component';
import { EventApiService } from '../../services/event/event-api.service';
import { EventUpdateService } from '../../services/event/event-update.service';

describe('MyEventsComponent', () => {
  let component: MyEventsComponent;
  let fixture: ComponentFixture<MyEventsComponent>;

  beforeEach(async () => {
    const updates$ = new Subject<string | void>();

    await TestBed.configureTestingModule({
      imports: [MyEventsComponent],
      providers: [
        { provide: EventApiService, useValue: { myCreatedEvents: () => of({ statusCode: 200, data: [] }) } },
        { provide: EventUpdateService, useValue: { eventUpdated$: updates$.asObservable() } }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MyEventsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
