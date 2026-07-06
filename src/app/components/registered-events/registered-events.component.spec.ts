import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, Subject } from 'rxjs';

import { RegisteredEventsComponent } from './registered-events.component';
import { ActivityModel } from '../../models/activity.model';
import { ActivityType } from '../../models/activity-type.enum';
import { EventApiService } from '../../services/event/event-api.service';
import { EventUpdateService } from '../../services/event/event-update.service';
import { UserActivityApiService } from '../../services/user/user-activity-api.service';

describe('RegisteredEventsComponent', () => {
  let component: RegisteredEventsComponent;
  let fixture: ComponentFixture<RegisteredEventsComponent>;
  let eventApiServiceSpy: jasmine.SpyObj<EventApiService>;
  let matDialogSpy: jasmine.SpyObj<MatDialog>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;

  beforeEach(async () => {
    const updates$ = new Subject<string | void>();

    eventApiServiceSpy = jasmine.createSpyObj<EventApiService>('EventApiService', ['getEventById']);
    matDialogSpy = jasmine.createSpyObj<MatDialog>('MatDialog', ['open']);
    snackBarSpy = jasmine.createSpyObj<MatSnackBar>('MatSnackBar', ['open']);

    await TestBed.configureTestingModule({
      imports: [RegisteredEventsComponent, NoopAnimationsModule],
      providers: [
        { provide: UserActivityApiService, useValue: { myRegistrations: () => of({ statusCode: 200, data: [] }) } },
        { provide: EventUpdateService, useValue: { eventUpdated$: updates$.asObservable() } },
        { provide: EventApiService, useValue: eventApiServiceSpy },
        { provide: MatDialog, useValue: matDialogSpy },
        { provide: MatSnackBar, useValue: snackBarSpy }
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

  it('deve buscar o evento pai e abrir o modal ao ver detalhes', () => {
    const activity = { id: 5, eventoId: 42, tipo: ActivityType.RPG_MESA } as ActivityModel;
    const event = { id: 42, nome: 'Evento Teste' };
    eventApiServiceSpy.getEventById.and.returnValue(of({ statusCode: 200, data: event } as any));

    component.verDetalhes(activity);

    expect(eventApiServiceSpy.getEventById).toHaveBeenCalledWith(42);
    expect(matDialogSpy.open).toHaveBeenCalledWith(jasmine.any(Function), jasmine.objectContaining({
      data: { event, selectedActivityId: 5 }
    }));
    expect(component.loadingActivityId).toBeNull();
  });

  it('nao deve abrir o modal quando o evento nao e encontrado', () => {
    const activity = { id: 5, eventoId: 42, tipo: ActivityType.RPG_MESA } as ActivityModel;
    eventApiServiceSpy.getEventById.and.returnValue(of({ statusCode: 404, data: null } as any));

    component.verDetalhes(activity);

    expect(matDialogSpy.open).not.toHaveBeenCalled();
    expect(snackBarSpy.open).toHaveBeenCalled();
  });
});
