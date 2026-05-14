import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Subscription } from 'rxjs';
import { ActivityModel } from '../../models/activity.model';
import { EventUpdateService } from '../../services/event/event-update.service';
import { UserActivityApiService } from '../../services/user/user-activity-api.service';

@Component({
  selector: 'app-registered-events',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './registered-events.component.html',
  styleUrl: './registered-events.component.scss'
})
export class RegisteredEventsComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  loading = true;
  readonly displayedColumns = ['nome', 'tipo', 'inicio', 'fim', 'local'];
  readonly dataSource = new MatTableDataSource<ActivityModel>([]);
  private subscription: Subscription = new Subscription();

  constructor(
    private readonly userActivityApiService: UserActivityApiService,
    private readonly eventUpdateService: EventUpdateService
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
