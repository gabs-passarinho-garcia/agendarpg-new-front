import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Subscription } from 'rxjs';
import { ActivityModel } from '../../models/activity.model';
import { EventApiService } from '../../services/event/event-api.service';
import { EventUpdateService } from '../../services/event/event-update.service';
import { UserActivityApiService } from '../../services/user/user-activity-api.service';
import { EventModalComponent } from '../../shared/event-modal/event-modal.component';

@Component({
  selector: 'app-registered-events',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatTableModule
  ],
  templateUrl: './registered-events.component.html',
  styleUrl: './registered-events.component.scss'
})
export class RegisteredEventsComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  loading = true;
  loadingActivityId: number | string | null = null;
  readonly displayedColumns = ['nome', 'tipo', 'inicio', 'fim', 'local', 'acoes'];
  readonly dataSource = new MatTableDataSource<ActivityModel>([]);
  private subscription: Subscription = new Subscription();

  constructor(
    private readonly userActivityApiService: UserActivityApiService,
    private readonly eventUpdateService: EventUpdateService,
    private readonly eventApiService: EventApiService,
    private readonly dialog: MatDialog,
    private readonly snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadMyRegistrations();

    this.subscription.add(
      this.eventUpdateService.eventUpdated$.subscribe(() => {
        this.loadMyRegistrations();
      })
    );
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  loadMyRegistrations(): void {
    this.loading = true;
    this.userActivityApiService.myRegistrations().subscribe({
      next: (response) => {
        const upcomingActivities = (response.data ?? [])
          .filter((activity) => new Date(activity.inicio).getTime() >= Date.now())
          .sort((a, b) => new Date(b.inicio).getTime() - new Date(a.inicio).getTime());

        this.dataSource.data = upcomingActivities;
        this.dataSource.paginator = this.paginator;
      },
      error: (error) => {
        console.error('Error fetching registered activities:', error);
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  verDetalhes(activity: ActivityModel): void {
    if (!activity.eventoId || this.loadingActivityId !== null) {
      return;
    }

    this.loadingActivityId = activity.id ?? null;

    this.eventApiService.getEventById(activity.eventoId).subscribe({
      next: (response) => {
        const event = response.data;
        if (!event) {
          this.snackBar.open('Evento nao encontrado.', 'Fechar', { duration: 3000, panelClass: ['snackbar-error'] });
          return;
        }

        this.dialog.open(EventModalComponent, {
          data: { event, selectedActivityId: activity.id },
          maxWidth: '90vw',
          maxHeight: '90vh'
        });
      },
      error: () => {
        this.snackBar.open('Erro ao carregar detalhes da atividade.', 'Fechar', {
          duration: 3000,
          panelClass: ['snackbar-error']
        });
      },
      complete: () => {
        this.loadingActivityId = null;
      }
    });
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
