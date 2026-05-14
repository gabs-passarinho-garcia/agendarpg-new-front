import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';

import { NewEventComponent } from './new-event.component';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { EventApiService } from '../../services/event/event-api.service';

describe('NewEventComponent', () => {
  let component: NewEventComponent;
  let fixture: ComponentFixture<NewEventComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewEventComponent, NoopAnimationsModule],
      providers: [
        { provide: EventApiService, useValue: { createEvent: () => of({ statusCode: 201, statusMessage: 'Created', data: {} }) } },
        { provide: Router, useValue: { navigate: jasmine.createSpy('navigate') } },
        { provide: MatSnackBar, useValue: { open: jasmine.createSpy('open') } }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NewEventComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('deve ter availableHours preenchido', () => {
    expect(component.availableHours.length).toBeGreaterThan(0);
    expect(component.availableHours[0]).toMatch(/^\d{2}:\d{2}$/);
  });
});
