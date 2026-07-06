import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of } from 'rxjs';

import { EventModalComponent } from './event-modal.component';
import { ActivityModel } from '../../models/activity.model';
import { ActivityApiService } from '../../services/event/activity-api.service';
import { EventUpdateService } from '../../services/event/event-update.service';
import { StateService } from '../../services/state/state.service';
import { UserService } from '../../services/user/user.service';

describe('EventModalComponent', () => {
  let component: EventModalComponent;
  let fixture: ComponentFixture<EventModalComponent>;
  let activityApiServiceSpy: jasmine.SpyObj<ActivityApiService>;
  let userServiceSpy: jasmine.SpyObj<UserService>;
  const stateServiceMock = { isLoggedIn: false, userData: {} as any };

  const createRpgActivity = (overrides: Partial<ActivityModel> = {}): ActivityModel => ({
    id: 10,
    eventoId: 1,
    tipo: component?.activityType.RPG_MESA,
    nome: 'Mesa Teste',
    descricao: 'Descricao',
    inicio: '2026-12-01T10:00:00',
    fim: '2026-12-01T12:00:00',
    localComplemento: 'Sala 1',
    narradorId: 7,
    numeroVagas: 5,
    participantes: [],
    ...overrides
  } as ActivityModel);

  beforeEach(async () => {
    activityApiServiceSpy = jasmine.createSpyObj<ActivityApiService>('ActivityApiService', ['getByEvent', 'register', 'unregister']);
    activityApiServiceSpy.getByEvent.and.returnValue(of({ data: [] } as any));
    activityApiServiceSpy.register.and.returnValue(of({} as any));
    activityApiServiceSpy.unregister.and.returnValue(of({} as any));

    userServiceSpy = jasmine.createSpyObj<UserService>('UserService', ['getNarratorName']);
    userServiceSpy.getNarratorName.and.returnValue(of({ data: { apelido: 'Narrador' } } as any));

    await TestBed.configureTestingModule({
      imports: [EventModalComponent],
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            event: {
              id: 1,
              nome: 'Evento Teste',
              local: 'Local',
              inicio: '2026-12-01T10:00:00',
              fim: '2026-12-01T12:00:00',
              atividades: []
            }
          }
        },
        { provide: MatDialogRef, useValue: { close: jasmine.createSpy('close') } },
        { provide: ActivityApiService, useValue: activityApiServiceSpy },
        { provide: EventUpdateService, useValue: { notifyEventUpdated: jasmine.createSpy('notifyEventUpdated') } },
        { provide: UserService, useValue: userServiceSpy },
        { provide: StateService, useValue: stateServiceMock }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EventModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should block narrator from registering as player', () => {
    stateServiceMock.isLoggedIn = true;
    stateServiceMock.userData = { id: 7 } as any;

    const activity = createRpgActivity();

    expect(component.isNarrator(activity)).toBeTrue();
    expect(component.canRegister(activity)).toBeFalse();
    expect(component.actionButtonText(activity)).toBe('Narrador nao pode se inscrever');
  });

  it('should detect registered user with mixed id types', () => {
    stateServiceMock.isLoggedIn = true;
    stateServiceMock.userData = { id: '7' } as any;

    const activity = createRpgActivity({ participantes: [7, 8] });

    expect(component.isUserRegistered(activity)).toBeTrue();
    expect(component.actionButtonText(activity)).toBe('Cancelar inscricao');
  });

  it('should block registration and show full label when activity is full', () => {
    stateServiceMock.isLoggedIn = true;
    stateServiceMock.userData = { id: 99 } as any;

    const activity = createRpgActivity({ numeroVagas: 2, participantes: [1, 2] });

    expect(component.isActivityFull(activity)).toBeTrue();
    expect(component.canRegister(activity)).toBeFalse();
    expect(component.actionButtonText(activity)).toBe('Atividade lotada');
  });

  it('should load narrator name for UUID ids', () => {
    const uuid = 'c4ca4238-a0b9-4382-adcc-509a6f75849b';
    userServiceSpy.getNarratorName.and.returnValue(of({ data: { apelido: 'Lucas' } } as any));

    component.preloadNarratorNames([createRpgActivity({ narradorId: uuid })]);

    expect(userServiceSpy.getNarratorName).toHaveBeenCalledWith(uuid);
    expect(component.getNarratorName(createRpgActivity({ narradorId: uuid }))).toBe('Lucas');
  });

  it('should build vacancy slots with filled and empty positions', () => {
    const activity = createRpgActivity({ numeroVagas: 4, participantes: [1, 2] });

    expect(component.getVacancySlots(activity)).toEqual([true, true, false, false]);
    expect(component.getVacancyAriaLabel(activity)).toBe('Vagas ocupadas 2 de 4');
  });
});
