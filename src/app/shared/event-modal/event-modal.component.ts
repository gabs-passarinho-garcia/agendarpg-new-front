import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ActivityTypeLabelPipe } from '../../pipes/activity-type-label.pipe';
import { ActivityModel } from '../../models/activity.model';
import { ActivityType } from '../../models/activity-type.enum';
import { EventModelV2 } from '../../models/event.model';
import { ActivityApiService } from '../../services/event/activity-api.service';
import { EventUpdateService } from '../../services/event/event-update.service';
import { StateService } from '../../services/state/state.service';
import { UserService } from '../../services/user/user.service';

export interface EventModalData {
  event: EventModelV2;
  selectedActivityId?: number | string;
}

@Component({
  selector: 'app-event-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatChipsModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    ActivityTypeLabelPipe
  ],
  templateUrl: './event-modal.component.html',
  styleUrls: ['./event-modal.component.scss']
})
export class EventModalComponent implements OnInit {
  activities: ActivityModel[] = [];
  loadingActivities = true;
  narratorNames: Record<string, string> = {};
  readonly activityType = ActivityType;
  readonly event: EventModelV2;
  private readonly selectedActivityId?: number | string;

  constructor(
    @Inject(MAT_DIALOG_DATA) data: EventModalData,
    public dialogRef: MatDialogRef<EventModalComponent>,
    private stateService: StateService,
    private activityApiService: ActivityApiService,
    private eventUpdateService: EventUpdateService,
    private userService: UserService,
    private snackBar: MatSnackBar
  ) {
    this.event = data.event;
    this.selectedActivityId = data.selectedActivityId;
  }

  ngOnInit(): void {
    this.loadActivities();
  }

  get isLoggedIn(): boolean {
    return this.stateService.isLoggedIn;
  }

  get periodText(): string {
    return `${this.formatDateTime(this.event.inicio)} - ${this.formatDateTime(this.event.fim)}`;
  }

  loadActivities(): void {
    if (!this.event.id) {
      this.loadingActivities = false;
      return;
    }

    this.activityApiService.getByEvent(this.event.id).subscribe({
      next: (response) => {
        const allActivities = response.data ?? [];
        this.activities = this.selectedActivityId !== undefined
          ? allActivities.filter((activity) => String(activity.id) === String(this.selectedActivityId))
          : allActivities;
        this.preloadNarratorNames(this.activities);
      },
      error: (error) => {
        console.error('Erro ao carregar atividades:', error);
        this.activities = [];
      },
      complete: () => {
        this.loadingActivities = false;
      }
    });
  }

  preloadNarratorNames(activities: ActivityModel[]): void {
    const narratorIds = activities
      .map(activity => activity.narradorId)
      .filter((id): id is string | number => (typeof id === 'number' || typeof id === 'string') && String(id).trim().length > 0);

    narratorIds.forEach((id) => {
      const narratorIdAsString = String(id).trim();

      if (this.narratorNames[narratorIdAsString]) {
        return;
      }

      this.narratorNames[narratorIdAsString] = `Narrador #${narratorIdAsString}`;

      this.userService.getNarratorName(id).subscribe({
        next: (response) => {
          this.narratorNames[narratorIdAsString] = response.data?.apelido || `Narrador #${narratorIdAsString}`;
        },
        error: () => {
          this.narratorNames[narratorIdAsString] = `Narrador #${narratorIdAsString}`;
        }
      });
    });
  }

  getNarratorName(activity: ActivityModel): string {
    if (!activity.narradorId) {
      return '-';
    }
    const narratorIdAsString = String(activity.narradorId);
    return this.narratorNames[narratorIdAsString] || `Narrador #${narratorIdAsString}`;
  }

  isUserRegistered(activity: ActivityModel): boolean {
    const userId = this.stateService.userData?.id;
    if (!this.isLoggedIn || userId === undefined || userId === null) {
      return false;
    }

    const userIdAsString = String(userId);
    const participants = activity.participantes ?? [];

    return participants.some((participant) => String(participant) === userIdAsString);
  }

  isNarrator(activity: ActivityModel): boolean {
    const userId = this.stateService.userData?.id;
    if (!this.isLoggedIn || userId === undefined || userId === null || activity.narradorId === undefined || activity.narradorId === null) {
      return false;
    }

    return String(activity.narradorId) === String(userId);
  }

  isActivityFull(activity: ActivityModel): boolean {
    if (activity.tipo !== ActivityType.RPG_MESA) {
      return false;
    }

    const total = Math.max(0, activity.numeroVagas ?? 0);
    const enrolled = activity.participantes?.length ?? 0;
    return total > 0 && enrolled >= total;
  }

  getVacancySlots(activity: ActivityModel): boolean[] {
    if (activity.tipo !== ActivityType.RPG_MESA) {
      return [];
    }

    const total = Math.max(0, activity.numeroVagas ?? 0);
    const occupied = Math.min(total, Math.max(0, activity.participantes?.length ?? 0));

    return Array.from({ length: total }, (_, index) => index < occupied);
  }

  getVacancyAriaLabel(activity: ActivityModel): string {
    const slots = this.getVacancySlots(activity);
    const occupied = slots.filter(Boolean).length;
    return `Vagas ocupadas ${occupied} de ${slots.length}`;
  }

  isPastActivity(activity: ActivityModel): boolean {
    return new Date(activity.inicio).getTime() < Date.now();
  }

  canRegister(activity: ActivityModel): boolean {
    return this.isLoggedIn
      && !this.isPastActivity(activity)
      && !this.isUserRegistered(activity)
      && !this.isActivityFull(activity)
      && !this.isNarrator(activity);
  }

  canUnregister(activity: ActivityModel): boolean {
    return this.isLoggedIn && this.isUserRegistered(activity);
  }

  register(activity: ActivityModel): void {
    if (!activity.id || !this.canRegister(activity)) {
      return;
    }

    this.activityApiService.register(activity.id).subscribe({
      next: () => {
        this.snackBar.open('Inscricao realizada com sucesso!', 'Fechar', {
          duration: 3000,
          panelClass: ['snackbar-success']
        });
        this.afterMutation();
      },
      error: (error) => {
        const message = error?.status === 409
          ? 'Nao foi possivel se inscrever: atividade lotada ou inscricao duplicada.'
          : 'Erro ao realizar inscricao.';

        this.snackBar.open(message, 'Fechar', {
          duration: 3500,
          panelClass: ['snackbar-error']
        });
      }
    });
  }

  unregister(activity: ActivityModel): void {
    if (!activity.id || !this.canUnregister(activity)) {
      return;
    }

    this.activityApiService.unregister(activity.id).subscribe({
      next: () => {
        this.snackBar.open('Inscricao removida com sucesso!', 'Fechar', {
          duration: 3000,
          panelClass: ['snackbar-success']
        });
        this.afterMutation();
      },
      error: () => {
        this.snackBar.open('Erro ao remover inscricao.', 'Fechar', {
          duration: 3000,
          panelClass: ['snackbar-error']
        });
      }
    });
  }

  actionButtonText(activity: ActivityModel): string {
    if (!this.isLoggedIn) {
      return 'Faca login para se inscrever';
    }
    if (this.isNarrator(activity) && !this.isUserRegistered(activity)) {
      return 'Narrador nao pode se inscrever';
    }
    if (this.isPastActivity(activity) && !this.isUserRegistered(activity)) {
      return 'Inscricoes encerradas';
    }
    if (this.isUserRegistered(activity)) {
      return 'Cancelar inscricao';
    }
    if (this.isActivityFull(activity)) {
      return 'Atividade lotada';
    }
    return 'Inscrever-se';
  }

  formatDateTime(value: string): string {
    return new Date(value).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private afterMutation(): void {
    this.eventUpdateService.notifyEventUpdated(this.event.id?.toString());
    this.loadActivities();
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
