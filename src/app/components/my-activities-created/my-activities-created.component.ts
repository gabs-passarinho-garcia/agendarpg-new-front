import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivityModel } from '../../models/activity.model';
import { UserActivityApiService } from '../../services/user/user-activity-api.service';
import { EventUpdateService } from '../../services/event/event-update.service';
import { ActivityEditModalComponent } from './activity-edit-modal/activity-edit-modal.component';

@Component({
  selector: 'app-my-activities-created',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule
  ],
  templateUrl: './my-activities-created.component.html',
  styleUrls: ['./my-activities-created.component.scss']
})
export class MyActivitiesCreatedComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  activities: ActivityModel[] = [];
  readonly displayedColumns = ['nome', 'tipo', 'inicio', 'fim', 'local', 'acoes'];
  readonly dataSource = new MatTableDataSource<ActivityModel>([]);
  loading = true;
  private updateSubscription?: Subscription;

  constructor(
    private readonly userActivityApiService: UserActivityApiService,
    private readonly eventUpdateService: EventUpdateService,
    private readonly dialog: MatDialog,
    private readonly snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadMyCreatedActivities();
    this.updateSubscription = this.eventUpdateService.eventUpdated$.subscribe(() => {
      this.loadMyCreatedActivities();
    });
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  ngOnDestroy(): void {
    this.updateSubscription?.unsubscribe();
  }

  loadMyCreatedActivities(): void {
    this.loading = true;
    this.userActivityApiService.myCreations().subscribe({
      next: (response) => {
        this.activities = [...(response.data ?? [])]
          .sort((a, b) => new Date(b.inicio).getTime() - new Date(a.inicio).getTime());
        this.dataSource.data = this.activities;
        this.dataSource.paginator = this.paginator;
        this.loading = false;
      },
      error: (error) => {
        console.error('Erro ao carregar atividades criadas:', error);
        this.snackBar.open('Erro ao carregar atividades', 'Fechar', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  editActivity(activity: ActivityModel): void {
    const dialogRef = this.dialog.open(ActivityEditModalComponent, {
      width: '760px',
      maxWidth: '95vw',
      data: activity,
      panelClass: 'activity-edit-dialog'
    });

    dialogRef.afterClosed().subscribe((updated) => {
      if (updated) {
        this.loadMyCreatedActivities();
      }
    });
  }

  deleteActivity(activity: ActivityModel): void {
    if (!activity.id) {
      this.snackBar.open('Erro: ID da atividade não encontrado', 'Fechar', { duration: 3000 });
      return;
    }
    if (confirm(`Deseja realmente deletar a atividade "${activity.nome}"?`)) {
      const activityId = activity.id;
      this.userActivityApiService.deleteActivity(activityId).subscribe({
        next: () => {
          this.snackBar.open('Atividade deletada com sucesso', 'OK', { duration: 3000 });
          this.loadMyCreatedActivities();
          this.eventUpdateService.notifyEventUpdated();
        },
        error: (error) => {
          console.error('Erro ao deletar atividade:', error);
          this.snackBar.open('Erro ao deletar atividade', 'Fechar', { duration: 3000 });
        }
      });
    }
  }
}
