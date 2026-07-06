import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ActivityModel } from '../../models/activity.model';
import { ActivityType } from '../../models/activity-type.enum';
import { UserService } from '../../services/user/user.service';
import { StateService } from '../../services/state/state.service';

@Component({
  selector: 'app-activity-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatChipsModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './activity-card.component.html',
  styleUrl: './activity-card.component.scss'
})
export class ActivityCardComponent implements OnChanges {
  @Input() activity!: ActivityModel;
  @Output() cardClicked = new EventEmitter<ActivityModel>();

  ActivityType = ActivityType;
  participantNicknames: string[] = [];

  constructor(
    private userService: UserService,
    private stateService: StateService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['activity']) {
      this.loadParticipantNicknames();
    }
  }

  get periodo(): string {
    const inicio = new Date(this.activity.inicio).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    const fim = new Date(this.activity.fim).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    return `${inicio} - ${fim}`;
  }

  get tipoLabel(): string {
    return this.activity.tipo === ActivityType.RPG_MESA ? 'Mesa de RPG' : 'Workshop';
  }

  get sistemaOuTema(): string {
    return this.activity.tipo === ActivityType.RPG_MESA
      ? this.activity.sistema || 'Sistema não especificado'
      : this.activity.tema || 'Tema não especificado';
  }

  get isFull(): boolean {
    if (this.activity.tipo !== ActivityType.RPG_MESA) {
      return false;
    }

    const total = this.activity.numeroVagas ?? 0;
    const occupied = this.activity.participantes?.length ?? 0;
    return total > 0 && occupied >= total;
  }

  get vacancySlots(): boolean[] {
    if (this.activity.tipo !== ActivityType.RPG_MESA) {
      return [];
    }

    const total = Math.max(0, this.activity.numeroVagas ?? 0);
    const occupied = Math.min(total, Math.max(0, this.activity.participantes?.length ?? 0));

    return Array.from({ length: total }, (_, index) => index < occupied);
  }

  get vacancyAriaLabel(): string {
    const slots = this.vacancySlots;
    const occupied = slots.filter(Boolean).length;
    return `Vagas ocupadas ${occupied} de ${slots.length}`;
  }

  onClick(): void {
    this.cardClicked.emit(this.activity);
  }

  private loadParticipantNicknames(): void {
    const participantIds = (this.activity?.participantes ?? []).filter(
      (id): id is number => id !== null && id !== undefined
    );

    if (participantIds.length === 0 || !this.stateService.isLoggedIn) {
      this.participantNicknames = [];
      return;
    }

    const requests = participantIds.map((id) =>
      this.userService.getUserName(id).pipe(
        catchError(() => of(null))
      )
    );

    forkJoin(requests).subscribe((responses) => {
      this.participantNicknames = responses.map((response, index) =>
        response?.data?.apelido || response?.data?.nomeCompleto || `Jogador #${participantIds[index]}`
      );
    });
  }
}
