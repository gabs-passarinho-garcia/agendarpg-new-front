import { Component, Input } from '@angular/core';
import { CommonModule }      from '@angular/common';
import { MatCardModule }     from '@angular/material/card';
import { MatChipsModule }    from '@angular/material/chips';
import { EventModelV2 } from '../../models/event.model';
import { MatDialog } from '@angular/material/dialog';
import { EventModalComponent } from '../event-modal/event-modal.component';

@Component({
  selector: 'app-event-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatChipsModule
  ],
  templateUrl: './event-card.component.html',
  styleUrl: './event-card.component.scss'
})
export class EventCardComponent {
  @Input() event!: EventModelV2;

  constructor(private dialog: MatDialog) {}

  get periodo(): string {
    const inicio = new Date(this.event.inicio).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    const fim = new Date(this.event.fim).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    return `${inicio} - ${fim}`;
  }

  openModal(): void {
    const dialogRef = this.dialog.open(EventModalComponent, {
      data: this.event,
      maxWidth: '90vw',
      maxHeight: '90vh'
    });

  }
}
