import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import { EventModelV2 } from '../../models/event.model';
import { ActivityModel } from '../../models/activity.model';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { ActivityCardComponent } from '../../shared/activity-card/activity-card.component';
import { EventModalComponent } from '../../shared/event-modal/event-modal.component';
import { EventUpdateService } from '../../services/event/event-update.service';
import { Subscription } from 'rxjs';
import { EventApiService } from '../../services/event/event-api.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    ActivityCardComponent,
    MatProgressSpinnerModule,
    MatExpansionModule,
    MatDialogModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit, OnDestroy {
  loading: boolean = true;
  events: EventModelV2[] = [];
  private eventUpdateSubscription: Subscription = new Subscription();

  constructor(
    @Inject(PLATFORM_ID) private readonly platformId: Object,
    private eventApiService: EventApiService,
    private eventUpdateService: EventUpdateService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      this.loading = false;
      return;
    }

    this.getAllEvents();
    this.subscribeToEventUpdates();
  }

  ngOnDestroy(): void {
    this.eventUpdateSubscription.unsubscribe();
  }

  subscribeToEventUpdates(): void {
    this.eventUpdateSubscription = this.eventUpdateService.eventUpdated$.subscribe(() => {
      this.refreshEvents();
    });
  }

  refreshEvents(): void {
    this.getAllEventsWithoutLoading();
  }

  getAllEventsWithoutLoading(): void {
    this.eventApiService.getEvents().subscribe({
      next: (response) => {
        this.events = this.filterAndSortUpcomingEvents(response.data ?? []);
      },
      error: (error) => {
        console.error('Error fetching events:', error);
      }
    });
  }

  getAllEvents(): void {
    this.eventApiService.getEvents().subscribe({
      next: (response) => {
        this.events = this.filterAndSortUpcomingEvents(response.data ?? []);
      },
      complete: () => {
        this.loading = false;
      },
      error: (error) => {
        console.error('Error fetching events:', error);
        this.loading = false;
      }
    });
  }

  private filterAndSortUpcomingEvents(events: EventModelV2[]): EventModelV2[] {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    return events
      .filter((event) => {
        const eventDate = new Date(event.inicio);
        return eventDate >= now;
      })
      .sort((a, b) => new Date(a.inicio).getTime() - new Date(b.inicio).getTime());
  }

  onActivityClicked(activity: ActivityModel, event: EventModelV2): void {
    this.dialog.open(EventModalComponent, {
      data: { event, selectedActivityId: activity.id },
      maxWidth: '90vw',
      maxHeight: '90vh'
    });
  }

  getActivityCountText(count: number): string {
    return count === 1 ? '1 atividade' : `${count} atividades`;
  }

  formatDateTime(dateTime: string): string {
    return new Date(dateTime).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
