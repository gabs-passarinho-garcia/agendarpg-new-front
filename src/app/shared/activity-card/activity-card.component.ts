import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ActivityModel } from '../../models/activity.model';
import { ActivityType } from '../../models/activity-type.enum';

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
export class ActivityCardComponent {
  @Input() activity!: ActivityModel;
  @Output() cardClicked = new EventEmitter<ActivityModel>();

  ActivityType = ActivityType;

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

  onClick(): void {
    this.cardClicked.emit(this.activity);
  }
}
