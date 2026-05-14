import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, Subject } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { DashboardComponent } from './dashboard.component';
import { EventApiService } from '../../services/event/event-api.service';
import { EventUpdateService } from '../../services/event/event-update.service';
import { MatDialog } from '@angular/material/dialog';
import { EventModelV2 } from '../../models/event.model';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let eventApiService: jasmine.SpyObj<EventApiService>;
  let matDialog: jasmine.SpyObj<MatDialog>;

  const mockEvents: EventModelV2[] = [
    {
      id: 1,
      nome: 'Evento Futuro',
      local: 'São Paulo',
      inicio: new Date(Date.now() + 86400000).toISOString(),
      fim: new Date(Date.now() + 90000000).toISOString(),
      atividades: []
    }
  ];

  beforeEach(async () => {
    const updates$ = new Subject<string | void>();
    const eventApiServiceSpy = jasmine.createSpyObj('EventApiService', ['getEvents']);
    const matDialogSpy = jasmine.createSpyObj('MatDialog', ['open']);

    eventApiServiceSpy.getEvents.and.returnValue(of({ statusCode: 200, data: mockEvents }));

    await TestBed.configureTestingModule({
      imports: [DashboardComponent, NoopAnimationsModule],
      providers: [
        { provide: EventApiService, useValue: eventApiServiceSpy },
        { provide: EventUpdateService, useValue: { eventUpdated$: updates$.asObservable() } },
        { provide: MatDialog, useValue: matDialogSpy }
      ]
    })
    .compileComponents();

    eventApiService = TestBed.inject(EventApiService) as jasmine.SpyObj<EventApiService>;
    matDialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('deve criar o componente', () => {
    expect(component).toBeTruthy();
  });

  it('deve carregar eventos ao inicializar', () => {
    expect(eventApiService.getEvents).toHaveBeenCalled();
    expect(component.events.length).toBe(1);
  });

  it('deve filtrar apenas eventos futuros', () => {
    const pastDate = new Date(Date.now() - 86400000).toISOString();
    const futureDate = new Date(Date.now() + 86400000).toISOString();

    const events: EventModelV2[] = [
      {
        id: 1,
        nome: 'Evento Passado',
        local: 'São Paulo',
        inicio: pastDate,
        fim: pastDate,
        atividades: []
      },
      {
        id: 2,
        nome: 'Evento Futuro',
        local: 'Rio',
        inicio: futureDate,
        fim: futureDate,
        atividades: []
      }
    ];

    const filtered = component['filterAndSortUpcomingEvents'](events);
    expect(filtered.length).toBe(1);
    expect(filtered[0].id).toBe(2);
  });

  it('deve formatar data e hora corretamente', () => {
    const dateTime = '2026-05-15T19:00:00';
    const formatted = component.formatDateTime(dateTime);
    expect(formatted).toContain('15');
    expect(formatted).toContain('05');
  });
});
