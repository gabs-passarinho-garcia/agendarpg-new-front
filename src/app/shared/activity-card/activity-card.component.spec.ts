import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ActivityCardComponent } from './activity-card.component';
import { ActivityModel } from '../../models/activity.model';
import { ActivityType } from '../../models/activity-type.enum';
import { UserService } from '../../services/user/user.service';
import { StateService } from '../../services/state/state.service';

describe('ActivityCardComponent', () => {
  let component: ActivityCardComponent;
  let fixture: ComponentFixture<ActivityCardComponent>;
  let userServiceSpy: jasmine.SpyObj<UserService>;
  const stateServiceMock = { isLoggedIn: true };

  beforeEach(async () => {
    stateServiceMock.isLoggedIn = true;
    userServiceSpy = jasmine.createSpyObj<UserService>('UserService', ['getUserName']);
    userServiceSpy.getUserName.and.returnValue(of({ data: { apelido: 'Jogador' } } as any));

    await TestBed.configureTestingModule({
      imports: [ActivityCardComponent],
      providers: [
        { provide: UserService, useValue: userServiceSpy },
        { provide: StateService, useValue: stateServiceMock }
      ]
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

  it('deve indicar lotado quando participantes atingem numero de vagas', () => {
    component.activity.participantes = [1, 2, 3, 4, 5];
    expect(component.isFull).toBeTrue();
  });

  it('nao deve indicar lotado quando ainda ha vagas', () => {
    component.activity.participantes = [1, 2, 3, 4];
    expect(component.isFull).toBeFalse();
  });

  it('deve montar os icones de vaga preenchidos e vazios', () => {
    component.activity.numeroVagas = 4;
    component.activity.participantes = [1, 2];

    expect(component.vacancySlots).toEqual([true, true, false, false]);
    expect(component.vacancyAriaLabel).toBe('Vagas ocupadas 2 de 4');
  });

  it('deve carregar os apelidos dos participantes inscritos', () => {
    userServiceSpy.getUserName.and.callFake((id) =>
      of({ data: { apelido: `Apelido${id}` } } as any)
    );

    component.ngOnChanges({ activity: {} as any });

    expect(userServiceSpy.getUserName).toHaveBeenCalledTimes(3);
    expect(component.participantNicknames).toEqual(['Apelido1', 'Apelido2', 'Apelido3']);
  });

  it('deve usar nome de fallback quando a busca de apelido falha', () => {
    userServiceSpy.getUserName.and.returnValue(throwError(() => new Error('erro')));

    component.ngOnChanges({ activity: {} as any });

    expect(component.participantNicknames).toEqual(['Jogador #1', 'Jogador #2', 'Jogador #3']);
  });

  it('nao deve buscar apelidos quando o usuario nao esta logado', () => {
    stateServiceMock.isLoggedIn = false;

    component.ngOnChanges({ activity: {} as any });

    expect(userServiceSpy.getUserName).not.toHaveBeenCalled();
    expect(component.participantNicknames).toEqual([]);
  });
});
