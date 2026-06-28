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

  it('deve preservar a data/hora final escolhida manualmente em evento de varios dias', () => {
    const eventApiService = TestBed.inject(EventApiService);
    const createSpy = spyOn(eventApiService, 'createEvent').and.returnValue(of({
      statusCode: 201,
      statusMessage: 'Created',
      data: {
        id: 1,
        nome: 'Semana do RPG Noturno',
        local: 'Casa',
        inicio: '2026-06-29T18:00:00',
        fim: '2026-07-03T21:00:00',
        creatorUserId: 1,
        atividades: []
      }
    }));

    component.eventForm.patchValue({
      nome: 'Semana do RPG Noturno',
      local: 'Casa',
      inicioData: new Date('2026-06-29T00:00:00'),
      inicioHora: '18:00',
      fimData: new Date('2026-07-03T00:00:00'),
      fimHora: '21:00'
    });

    component.eventForm.patchValue({
      inicioData: new Date('2026-06-30T00:00:00'),
      inicioHora: '18:00'
    });

    component.onSubmit();

    expect(createSpy).toHaveBeenCalled();
    const payload = createSpy.calls.mostRecent().args[0];
    expect(payload.inicio).toBe('2026-06-30T18:00:00');
    expect(payload.fim).toBe('2026-07-03T21:00:00');
  });
});
