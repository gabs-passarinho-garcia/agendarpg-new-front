import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of } from 'rxjs';

import { ActivityEditModalComponent } from './activity-edit-modal.component';
import { ActivityApiService } from '../../../services/event/activity-api.service';
import { EventUpdateService } from '../../../services/event/event-update.service';
import { TagApiService } from '../../../services/tag/tag-api.service';
import { ActivityType } from '../../../models/activity-type.enum';

describe('ActivityEditModalComponent', () => {
  let component: ActivityEditModalComponent;
  let fixture: ComponentFixture<ActivityEditModalComponent>;
  let activityApiService: jasmine.SpyObj<ActivityApiService>;
  let dialogRef: jasmine.SpyObj<MatDialogRef<ActivityEditModalComponent>>;

  const dialogData = {
    id: 10,
    eventoId: 2,
    tipo: ActivityType.RPG_MESA,
    nome: 'Mesa Teste',
    descricao: 'Descricao da atividade',
    inicio: '2026-12-01T10:00:00',
    fim: '2026-12-01T12:00:00',
    localComplemento: 'Sala 1',
    sistema: 'D&D 5e',
    numeroVagas: 5,
    tags: ['fantasia']
  };

  beforeEach(async () => {
    const activityApiServiceSpy = jasmine.createSpyObj('ActivityApiService', ['update']);
    const tagApiServiceSpy = jasmine.createSpyObj('TagApiService', ['getTags']);
    const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    activityApiServiceSpy.update.and.returnValue(of({ statusCode: 200, data: dialogData }));
    tagApiServiceSpy.getTags.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [ActivityEditModalComponent, NoopAnimationsModule, HttpClientTestingModule],
      providers: [
        { provide: ActivityApiService, useValue: activityApiServiceSpy },
        { provide: TagApiService, useValue: tagApiServiceSpy },
        { provide: EventUpdateService, useValue: { notifyEventUpdated: jasmine.createSpy('notifyEventUpdated') } },
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: dialogData }
      ]
    }).compileComponents();

    activityApiService = TestBed.inject(ActivityApiService) as jasmine.SpyObj<ActivityApiService>;
    dialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<ActivityEditModalComponent>>;

    fixture = TestBed.createComponent(ActivityEditModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('deve criar o componente', () => {
    expect(component).toBeTruthy();
  });

  it('deve salvar atividade valida', () => {
    // Preencher o formulário com dados válidos
    component.editForm.patchValue({
      tipo: ActivityType.RPG_MESA,
      nome: 'Mesa Teste',
      descricao: 'Descricao da atividade',
      inicioData: new Date('2026-12-01'),
      inicioHora: '10:00',
      fimData: new Date('2026-12-01'),
      fimHora: '12:00',
      localComplemento: 'Sala 1',
      sistema: 'D&D 5e',
      numeroVagas: 5
    });

    // Adicionar tags selecionadas
    component.selectedTags = [{ id: 1, nome: 'fantasia' }];

    component.save();

    expect(activityApiService.update).toHaveBeenCalled();
    expect(dialogRef.close).toHaveBeenCalledWith(true);
  });
});
