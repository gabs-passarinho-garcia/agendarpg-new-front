import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { CreateActivityComponent } from './create-activity.component';
import { ActivityApiService } from '../../../services/event/activity-api.service';
import { EventApiService } from '../../../services/event/event-api.service';
import { StateService } from '../../../services/state/state.service';
import { TagApiService } from '../../../services/tag/tag-api.service';

describe('CreateActivityComponent', () => {
  let component: CreateActivityComponent;
  let fixture: ComponentFixture<CreateActivityComponent>;

  function toLocalDateTime(value: Date): string {
    const pad = (n: number): string => `${n}`.padStart(2, '0');
    return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}T${pad(value.getHours())}:${pad(value.getMinutes())}:00`;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateActivityComponent, NoopAnimationsModule],
      providers: [
        {
          provide: EventApiService,
          useValue: {
            getEvents: () => of({ data: [] })
          }
        },
        {
          provide: ActivityApiService,
          useValue: {
            create: () => of({ data: {} })
          }
        },
        {
          provide: StateService,
          useValue: {
            userData: {
              id: 1,
              tipo: 'NRD'
            }
          }
        },
        {
          provide: TagApiService,
          useValue: {
            getTags: () => of([
              { id: 1, nome: 'fantasia' },
              { id: 2, nome: 'horror' }
            ])
          }
        },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: new Map()
            }
          }
        },
        {
          provide: Router,
          useValue: {
            navigate: jasmine.createSpy('navigate')
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CreateActivityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('deve filtrar e manter somente eventos futuros', () => {
    const eventApiService = TestBed.inject(EventApiService);
    const now = new Date();
    const past = new Date(now.getTime() - 60 * 60 * 1000);
    const future = new Date(now.getTime() + 60 * 60 * 1000);

    spyOn(eventApiService, 'getEvents').and.returnValue(of({
      statusCode: 200,
      data: [
        { id: 1, nome: 'Evento Passado', local: 'A', inicio: toLocalDateTime(past), fim: toLocalDateTime(future) },
        { id: 2, nome: 'Evento Futuro', local: 'B', inicio: toLocalDateTime(future), fim: toLocalDateTime(new Date(future.getTime() + 60 * 60 * 1000)) }
      ]
    }));

    component.loadEvents();

    expect(component.events.length).toBe(1);
    expect(component.events[0].nome).toBe('Evento Futuro');
    expect(component.hasEligibleEvents).toBeTrue();
  });

  it('deve bloquear submit sem eventos elegíveis', () => {
    const activityApiService = TestBed.inject(ActivityApiService);
    const createSpy = spyOn(activityApiService, 'create').and.returnValue(of({
      statusCode: 200,
      data: {
        id: 10,
        eventoId: 2,
        tipo: 'RPG_MESA' as any,
        nome: 'Mesa Teste',
        descricao: 'Descricao valida de teste',
        inicio: '2026-12-01T10:00:00',
        fim: '2026-12-01T12:00:00',
        localComplemento: 'Sala 1'
      }
    }));

    component.events = [];
    component.hasEligibleEvents = false;
    component.selectedEvent = null;

    component.activityForm.patchValue({
      tipo: 'RPG_MESA',
      nome: 'Mesa Teste',
      descricao: 'Descricao valida de teste',
      inicioData: new Date('2026-12-01T00:00:00'),
      inicioHora: '10:00',
      fimData: new Date('2026-12-01T00:00:00'),
      fimHora: '12:00',
      localComplemento: 'Sala 1',
      sistema: 'D&D 5e',
      numeroVagas: 4,
      tagsText: 'fantasia'
    });

    component.submit();

    expect(createSpy).not.toHaveBeenCalled();
  });

  it('deve serializar data e hora para ISO no submit', () => {
    const activityApiService = TestBed.inject(ActivityApiService);
    const createSpy = spyOn(activityApiService, 'create').and.returnValue(of({
      statusCode: 200,
      data: {
        id: 11,
        eventoId: 2,
        tipo: 'RPG_MESA' as any,
        nome: 'Mesa ISO',
        descricao: 'Descricao de serializacao',
        inicio: '2026-12-01T10:00:00',
        fim: '2026-12-01T12:00:00',
        localComplemento: 'Sala A'
      }
    }));

    component.events = [
      {
        id: 2,
        nome: 'Evento Futuro',
        local: 'Centro',
        inicio: '2026-12-01T08:00:00',
        fim: '2026-12-01T20:00:00'
      }
    ];
    component.hasEligibleEvents = true;
    component.selectEvent(2);
    component.selectedTags = [{ id: 1, nome: 'fantasia' }];

    component.activityForm.patchValue({
      tipo: 'RPG_MESA',
      nome: 'Mesa ISO',
      descricao: 'Descricao de serializacao',
      inicioData: new Date('2026-12-01T00:00:00'),
      inicioHora: '10:00',
      fimData: new Date('2026-12-01T00:00:00'),
      fimHora: '12:00',
      localComplemento: 'Sala A',
      sistema: 'D&D 5e',
      numeroVagas: 5,
      tagsText: 'fantasia'
    });

    component.submit();

    expect(createSpy).toHaveBeenCalled();
    const payload = createSpy.calls.mostRecent().args[1];
    expect(payload.inicio).toBe('2026-12-01T10:00:00');
    expect(payload.fim).toBe('2026-12-01T12:00:00');
  });

  it('deve bloquear submit quando fim não for maior que início', () => {
    const activityApiService = TestBed.inject(ActivityApiService);
    const createSpy = spyOn(activityApiService, 'create').and.returnValue(of({
      statusCode: 200,
      data: {
        id: 12,
        eventoId: 2,
        tipo: 'RPG_MESA' as any,
        nome: 'Mesa Invalida',
        descricao: 'Descricao',
        inicio: '2026-12-01T10:00:00',
        fim: '2026-12-01T12:00:00',
        localComplemento: 'Sala'
      }
    }));

    component.events = [
      {
        id: 2,
        nome: 'Evento Futuro',
        local: 'Centro',
        inicio: '2026-12-01T08:00:00',
        fim: '2026-12-01T20:00:00'
      }
    ];
    component.hasEligibleEvents = true;
    component.selectEvent(2);

    component.activityForm.patchValue({
      tipo: 'RPG_MESA',
      nome: 'Mesa Invalida',
      descricao: 'Descricao valida de teste',
      inicioData: new Date('2026-12-01T00:00:00'),
      inicioHora: '12:00',
      fimData: new Date('2026-12-01T00:00:00'),
      fimHora: '12:00',
      localComplemento: 'Sala 1',
      sistema: 'D&D 5e',
      numeroVagas: 4,
      tagsText: 'fantasia'
    });

    component.submit();

    expect(createSpy).not.toHaveBeenCalled();
  });

  it('deve carregar tags da API', () => {
    const tagApiService = TestBed.inject(TagApiService);
    spyOn(tagApiService, 'getTags').and.returnValue(of([
      { id: 10, nome: 'mistério' },
      { id: 11, nome: 'investigação' }
    ]));

    component.loadTags();

    expect(component.availableTags.length).toBe(2);
    expect(component.availableTags[0].nome).toBe('mistério');
  });

  it('deve adicionar sem duplicar e remover tag selecionada', () => {
    const tag = { id: 1, nome: 'fantasia' };

    component.addTag(tag);
    component.addTag(tag);

    expect(component.selectedTags.length).toBe(1);

    component.removeTag(tag);

    expect(component.selectedTags.length).toBe(0);
  });

  it('deve bloquear submit de RPG_MESA sem tag selecionada', () => {
    const activityApiService = TestBed.inject(ActivityApiService);
    const createSpy = spyOn(activityApiService, 'create').and.returnValue(of({
      statusCode: 200,
      data: {
        id: 13,
        eventoId: 2,
        tipo: 'RPG_MESA' as any,
        nome: 'Mesa Sem Tag',
        descricao: 'Descricao',
        inicio: '2026-12-01T10:00:00',
        fim: '2026-12-01T12:00:00',
        localComplemento: 'Sala'
      }
    }));

    component.events = [
      {
        id: 2,
        nome: 'Evento Futuro',
        local: 'Centro',
        inicio: '2026-12-01T08:00:00',
        fim: '2026-12-01T20:00:00'
      }
    ];
    component.hasEligibleEvents = true;
    component.selectEvent(2);
    component.selectedTags = [];

    component.activityForm.patchValue({
      tipo: 'RPG_MESA',
      nome: 'Mesa Sem Tag',
      descricao: 'Descricao valida de teste',
      inicioData: new Date('2026-12-01T00:00:00'),
      inicioHora: '10:00',
      fimData: new Date('2026-12-01T00:00:00'),
      fimHora: '12:00',
      localComplemento: 'Sala 1',
      sistema: 'D&D 5e',
      numeroVagas: 4,
      tagsText: ''
    });

    component.submit();

    expect(createSpy).not.toHaveBeenCalled();
  });

  it('deve enviar narradorId string sem converter para numero', () => {
    const stateService = TestBed.inject(StateService);
    (stateService.userData as any).id = '4f8aef70-2cb1-4fc6-a6a8-2b7a604f7ed5';

    const activityApiService = TestBed.inject(ActivityApiService);
    const createSpy = spyOn(activityApiService, 'create').and.returnValue(of({
      statusCode: 200,
      data: {
        id: 14,
        eventoId: 2,
        tipo: 'RPG_MESA' as any,
        nome: 'Mesa UUID',
        descricao: 'Descricao',
        inicio: '2026-12-01T10:00:00',
        fim: '2026-12-01T12:00:00',
        localComplemento: 'Sala'
      }
    }));

    component.events = [
      {
        id: 2,
        nome: 'Evento Futuro',
        local: 'Centro',
        inicio: '2026-12-01T08:00:00',
        fim: '2026-12-01T20:00:00'
      }
    ];
    component.hasEligibleEvents = true;
    component.selectEvent(2);
    component.selectedTags = [{ id: 'tag-uuid-1', nome: 'Savage Worlds' }];

    component.activityForm.patchValue({
      tipo: 'RPG_MESA',
      nome: 'Mesa UUID',
      descricao: 'Descricao valida de teste',
      inicioData: new Date('2026-12-01T00:00:00'),
      inicioHora: '10:00',
      fimData: new Date('2026-12-01T00:00:00'),
      fimHora: '12:00',
      localComplemento: 'Sala 1',
      sistema: 'Savage Worlds',
      numeroVagas: 5,
      tagsText: 'Savage Worlds'
    });

    component.submit();

    expect(createSpy).toHaveBeenCalled();
    const payload = createSpy.calls.mostRecent().args[1];
    expect(payload.narradorId).toBe('4f8aef70-2cb1-4fc6-a6a8-2b7a604f7ed5');
  });
});
