import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivityCardComponent } from './activity-card.component';
import { ActivityModel } from '../../models/activity.model';
import { ActivityType } from '../../models/activity-type.enum';

describe('ActivityCardComponent', () => {
  let component: ActivityCardComponent;
  let fixture: ComponentFixture<ActivityCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActivityCardComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ActivityCardComponent);
    component = fixture.componentInstance;

    // Mock de atividade RPG_MESA
    component.activity = {
      id: 1,
      eventoId: 1,
      tipo: ActivityType.RPG_MESA,
      nome: 'Mesa de RPG - D&D 5e',
      descricao: 'Uma emocionante sessão de D&D',
      inicio: '2026-05-15T19:00:00',
      fim: '2026-05-15T23:00:00',
      localComplemento: 'Sala 101',
      sistema: 'D&D 5e',
      numeroVagas: 5,
      tags: ['fantasy', 'combat'],
      narradorId: 10,
      participantes: [1, 2, 3]
    };

    fixture.detectChanges();
  });

  it('deve criar o componente', () => {
    expect(component).toBeTruthy();
  });

  it('deve exibir o período formatado', () => {
    const periodo = component.periodo;
    expect(periodo).toContain('15/05/2026');
  });

  it('deve retornar "Mesa de RPG" para tipo RPG_MESA', () => {
    expect(component.tipoLabel).toBe('Mesa de RPG');
  });

  it('deve emitir cardClicked ao clicar no card', () => {
    spyOn(component.cardClicked, 'emit');
    component.onClick();
    expect(component.cardClicked.emit).toHaveBeenCalledWith(component.activity);
  });
});
