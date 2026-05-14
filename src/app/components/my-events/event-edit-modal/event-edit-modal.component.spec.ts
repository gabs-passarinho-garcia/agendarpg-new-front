import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

import { EventEditModalComponent } from './event-edit-modal.component';
import { EventApiService } from '../../../services/event/event-api.service';
import { EventUpdateService } from '../../../services/event/event-update.service';

describe('EventEditModalComponent', () => {
  let component: EventEditModalComponent;
  let fixture: ComponentFixture<EventEditModalComponent>;
  let eventApiServiceSpy: jasmine.SpyObj<EventApiService>;
  let eventUpdateServiceSpy: jasmine.SpyObj<EventUpdateService>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<EventEditModalComponent>>;

  beforeEach(async () => {
    eventApiServiceSpy = jasmine.createSpyObj('EventApiService', ['updateEvent']);
    eventUpdateServiceSpy = jasmine.createSpyObj('EventUpdateService', ['notifyEventUpdated']);
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [EventEditModalComponent, NoopAnimationsModule],
      providers: [
        { provide: EventApiService, useValue: eventApiServiceSpy },
        { provide: EventUpdateService, useValue: eventUpdateServiceSpy },
        { provide: MatDialogRef, useValue: dialogRefSpy },
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            id: 5,
            nome: 'Evento teste',
            local: 'Biblioteca',
            inicio: '2026-05-17T15:00:00',
            fim: '2026-05-17T18:00:00'
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EventEditModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('deve criar o componente', () => {
    expect(component).toBeTruthy();
  });

  it('deve salvar evento valido', () => {
    eventApiServiceSpy.updateEvent.and.returnValue(of({ statusCode: 200, statusMessage: 'OK', data: {} as any }));

    component.save();

    expect(eventApiServiceSpy.updateEvent).toHaveBeenCalled();
    expect(eventUpdateServiceSpy.notifyEventUpdated).toHaveBeenCalledWith('5');
    expect(dialogRefSpy.close).toHaveBeenCalledWith(true);
  });

  it('nao deve salvar formulario invalido', () => {
    component.editForm.patchValue({
      nome: '',
      local: '',
      inicio: '',
      fim: ''
    });

    component.save();

    expect(eventApiServiceSpy.updateEvent).not.toHaveBeenCalled();
  });

  it('deve manter modal aberto em erro ao salvar', () => {
    eventApiServiceSpy.updateEvent.and.returnValue(throwError(() => ({ status: 500 })));

    component.save();

    expect(dialogRefSpy.close).not.toHaveBeenCalledWith(true);
  });
});
