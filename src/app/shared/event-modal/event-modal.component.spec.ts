import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of } from 'rxjs';

import { EventModalComponent } from './event-modal.component';
import { ActivityApiService } from '../../services/event/activity-api.service';
import { EventUpdateService } from '../../services/event/event-update.service';
import { StateService } from '../../services/state/state.service';
import { UserService } from '../../services/user/user.service';

describe('EventModalComponent', () => {
  let component: EventModalComponent;
  let fixture: ComponentFixture<EventModalComponent>;
  const stateServiceMock = { isLoggedIn: false, userData: {} as any };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventModalComponent],
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            id: 1,
            nome: 'Evento Teste',
            local: 'Local',
            inicio: '2026-12-01T10:00:00',
            fim: '2026-12-01T12:00:00',
            atividades: []
          }
        },
        { provide: MatDialogRef, useValue: { close: jasmine.createSpy('close') } },
        { provide: ActivityApiService, useValue: { getByEvent: () => of({ data: [] }), register: () => of({}), unregister: () => of({}) } },
        { provide: EventUpdateService, useValue: { notifyEventUpdated: jasmine.createSpy('notifyEventUpdated') } },
        { provide: UserService, useValue: { getNarratorName: () => of({ data: { apelido: 'Narrador' } }) } },
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

    const activity = {
      id: 10,
      eventoId: 1,
      tipo: component.activityType.RPG_MESA,
      nome: 'Mesa Teste',
      descricao: 'Descricao',
      inicio: '2026-12-01T10:00:00',
      fim: '2026-12-01T12:00:00',
      localComplemento: 'Sala 1',
      narradorId: 7,
      participantes: []
    } as any;

    expect(component.isNarrator(activity)).toBeTrue();
    expect(component.canRegister(activity)).toBeFalse();
    expect(component.actionButtonText(activity)).toBe('Narrador nao pode se inscrever');
  });
});
