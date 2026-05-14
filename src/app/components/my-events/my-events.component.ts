import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { finalize, Subscription } from 'rxjs';
import { EventModelV2 } from '../../models/event.model';
import { EventUpdateService } from '../../services/event/event-update.service';
import { EventApiService } from '../../services/event/event-api.service';
import { EventEditModalComponent } from './event-edit-modal/event-edit-modal.component';

@Component({
  selector: 'app-my-events',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatTableModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatSnackBarModule
  ],
  templateUrl: './my-events.component.html',
  styleUrl: './my-events.component.scss'
})
export class MyEventsComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  loading = true;
  readonly displayedColumns = ['nome', 'local', 'inicio', 'fim', 'acoes'];
  readonly dataSource = new MatTableDataSource<EventModelV2>([]);
  private subscription: Subscription = new Subscription();

  constructor(
    private readonly eventApiService: EventApiService,
    private readonly eventUpdateService: EventUpdateService,
    private readonly dialog: MatDialog,
    private readonly snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadMyCreatedEvents();

    this.subscription.add(
      this.eventUpdateService.eventUpdated$.subscribe(() => {
        this.loadMyCreatedEvents();
      })
    );
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  loadMyCreatedEvents(): void {
    this.loading = true;
    this.eventApiService.myCreatedEvents().pipe(
      finalize(() => {
        this.loading = false;
      })
    ).subscribe({
      next: (response) => {
        const sortedEvents = [...(response.data ?? [])].sort((a, b) => {
          return new Date(b.inicio).getTime() - new Date(a.inicio).getTime();
        });
        this.dataSource.data = sortedEvents;
        this.dataSource.paginator = this.paginator;
        this.paginator?.firstPage();
      },
      error: () => {
        this.dataSource.data = [];
        this.snackBar.open('Nao foi possivel carregar seus eventos criados.', 'Fechar', {
          duration: 3500
        });
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

  editEvent(event: EventModelV2): void {
    this.dialog.open(EventEditModalComponent, {
      width: '720px',
      maxWidth: '95vw',
      data: event,
      panelClass: 'event-edit-dialog'
    });
  }
}
