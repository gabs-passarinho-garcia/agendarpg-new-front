import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { MyActivitiesCreatedComponent } from './my-activities-created.component';
import { UserActivityApiService } from '../../services/user/user-activity-api.service';
import { EventUpdateService } from '../../services/event/event-update.service';

describe('MyActivitiesCreatedComponent', () => {
  let component: MyActivitiesCreatedComponent;
  let fixture: ComponentFixture<MyActivitiesCreatedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyActivitiesCreatedComponent, NoopAnimationsModule],
      providers: [
        {
          provide: UserActivityApiService,
          useValue: {
            myCreations: () => of({ statusCode: 200, data: [] }),
            deleteActivity: () => of({ statusCode: 200, data: null })
          }
        },
        {
          provide: EventUpdateService,
          useValue: {
            eventUpdated$: of(undefined),
            notifyEventUpdated: jasmine.createSpy('notifyEventUpdated')
          }
        },
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MyActivitiesCreatedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load my created activities on init', () => {
    const userActivityApiService = TestBed.inject(UserActivityApiService);
    spyOn(userActivityApiService, 'myCreations').and.returnValue(of({
      statusCode: 200,
      data: [
        {
          id: 1,
          nome: 'Atividade Teste',
          tipo: 'RPG_MESA' as any,
          eventoId: 1,
          inicio: '2026-12-01T10:00:00',
          fim: '2026-12-01T12:00:00',
          descricao: 'Descrição teste',
          localComplemento: 'Local teste',
          numeroVagas: 5
        }
      ]
    }));

    component.loadMyCreatedActivities();

    expect(component.activities.length).toBe(1);
    expect(component.activities[0].nome).toBe('Atividade Teste');
  });

  it('should open edit modal when clicking edit activity', () => {
    const dialogOpenSpy = spyOn((component as any).dialog, 'open').and.returnValue({
      afterClosed: () => of(false)
    });

    const activity = {
      id: 1,
      eventoId: 10,
      tipo: 'RPG_MESA' as any,
      nome: 'Mesa Editavel',
      descricao: 'Descricao de teste',
      inicio: '2026-12-01T10:00:00',
      fim: '2026-12-01T12:00:00',
      localComplemento: 'Sala 3'
    };

    component.editActivity(activity);

    expect(dialogOpenSpy).toHaveBeenCalled();
  });
});
