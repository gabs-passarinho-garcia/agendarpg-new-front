import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { finalize, Subscription } from 'rxjs';
import { MatAutocompleteModule, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialog } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivityModel, CreateActivityPayload } from '../../../models/activity.model';
import { ActivityType } from '../../../models/activity-type.enum';
import { EventModelV2 } from '../../../models/event.model';
import { TagModel } from '../../../models/tag.model';
import { ActivityApiService } from '../../../services/event/activity-api.service';
import { EventApiService } from '../../../services/event/event-api.service';
import { StateService } from '../../../services/state/state.service';
import { TagApiService } from '../../../services/tag/tag-api.service';
import { EventFormModalComponent, EventFormModalResult } from './event-form-modal/event-form-modal.component';

@Component({
  selector: 'app-event-management',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTableModule,
    MatPaginatorModule,
    MatTooltipModule,
    MatExpansionModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatAutocompleteModule,
    MatChipsModule
  ],
  templateUrl: './event-management.component.html',
  styleUrls: ['./event-management.component.scss']
})
export class EventManagementComponent implements OnInit, OnDestroy {
  @ViewChild(MatAutocompleteTrigger) tagsAutocompleteTrigger?: MatAutocompleteTrigger;

  @ViewChild('eventsPaginator') set eventsPaginator(paginator: MatPaginator | undefined) {
    this.eventsDataSource.paginator = paginator ?? null;
  }

  @ViewChild('activitiesPaginator') set activitiesPaginator(paginator: MatPaginator | undefined) {
    this.activitiesDataSource.paginator = paginator ?? null;
  }

  loading = true;
  submittingEvent = false;
  submittingActivity = false;

  events: EventModelV2[] = [];
  activities: ActivityModel[] = [];
  selectedEventId: number | null = null;
  showActivityForm = false;

  readonly activityTypes = [ActivityType.RPG_MESA, ActivityType.WORKSHOP];
  readonly activityType = ActivityType;
  readonly availableHours = this.buildAvailableHours();
  readonly eventsColumns = ['nome', 'local', 'periodo', 'acoes'];
  readonly activitiesColumns = ['nome', 'tipo', 'periodo', 'acoes'];
  readonly pageSizeOptions = [5, 10, 25];

  eventsDataSource = new MatTableDataSource<EventModelV2>([]);
  activitiesDataSource = new MatTableDataSource<ActivityModel>([]);

  availableTags: TagModel[] = [];
  filteredTags: TagModel[] = [];
  selectedTags: TagModel[] = [];
  loadingTags = false;

  activityForm!: FormGroup;

  private readonly subscriptions = new Subscription();

  constructor(
    private readonly fb: FormBuilder,
    private readonly eventApiService: EventApiService,
    private readonly activityApiService: ActivityApiService,
    private readonly tagApiService: TagApiService,
    private readonly stateService: StateService,
    private readonly snackBar: MatSnackBar,
    private readonly dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.initForms();
    this.loadEvents();
    this.loadTags();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  get userRole(): string {
    return this.stateService.userData?.tipo || '';
  }

  get canManageEvents(): boolean {
    return this.userRole === 'ADM' || this.userRole === 'CRD';
  }

  get canManageActivities(): boolean {
    return this.userRole === 'ADM' || this.userRole === 'CRD' || this.userRole === 'NRD';
  }

  get hasManagementPermission(): boolean {
    return this.canManageEvents || this.canManageActivities;
  }

  get isRpgActivity(): boolean {
    return this.activityForm.get('tipo')?.value === ActivityType.RPG_MESA;
  }

  get isWorkshopActivity(): boolean {
    return this.activityForm.get('tipo')?.value === ActivityType.WORKSHOP;
  }

  get selectedEventName(): string {
    return this.events.find((event) => event.id === this.selectedEventId)?.nome ?? '';
  }

  initForms(): void {
    this.activityForm = this.fb.group(
      {
        id: [null],
        tipo: [ActivityType.RPG_MESA, Validators.required],
        nome: ['', [Validators.required, Validators.minLength(3)]],
        descricao: ['', [Validators.required, Validators.minLength(5)]],
        inicioData: [null, Validators.required],
        inicioHora: [null, Validators.required],
        fimData: [null, Validators.required],
        fimHora: [null, Validators.required],
        localComplemento: ['', [Validators.required, Validators.minLength(2)]],
        sistema: [''],
        numeroVagas: [null],
        tagsText: [''],
        narradorId: [null],
        tema: [''],
        palestranteId: [null]
      },
      { validators: [this.dateRangeValidator('inicioData', 'inicioHora', 'fimData', 'fimHora')] }
    );

    const tagsSubscription = this.activityForm.get('tagsText')?.valueChanges.subscribe(() => {
      this.updateFilteredTags();
    });

    if (tagsSubscription) {
      this.subscriptions.add(tagsSubscription);
    }
  }

  loadEvents(autoSelectFirst = true): void {
    this.loading = true;

    this.eventApiService.getEvents().pipe(
      finalize(() => {
        this.loading = false;
      })
    ).subscribe({
      next: (response) => {
        this.events = response.data ?? [];
        this.eventsDataSource.data = this.events;

        if (!this.events.length) {
          this.selectedEventId = null;
          this.activities = [];
          this.activitiesDataSource.data = [];
          return;
        }

        const selectedStillExists = this.selectedEventId !== null && this.events.some((event) => event.id === this.selectedEventId);
        if (selectedStillExists) {
          return;
        }

        if (autoSelectFirst) {
          this.selectEvent(this.events[0].id || null);
          return;
        }

        this.selectedEventId = null;
        this.activities = [];
        this.activitiesDataSource.data = [];
      },
      error: () => {
        this.showError('Erro ao carregar eventos.');
      }
    });
  }

  loadTags(): void {
    this.loadingTags = true;

    this.tagApiService.getTags().pipe(
      finalize(() => {
        this.loadingTags = false;
      })
    ).subscribe({
      next: (tags) => {
        this.availableTags = tags;
        this.updateFilteredTags();
      },
      error: () => {
        this.showError('Não foi possível carregar as tags.');
      }
    });
  }

  selectEvent(eventId: number | null): void {
    this.selectedEventId = eventId;
    this.activities = [];
    this.activitiesDataSource.data = [];
    this.showActivityForm = false;

    if (!eventId) {
      return;
    }

    this.loadActivities(eventId);
  }

  loadActivities(eventId: number): void {
    this.activityApiService.getByEvent(eventId).subscribe({
      next: (response) => {
        this.activities = response.data ?? [];
        this.activitiesDataSource.data = this.activities;
      },
      error: () => {
        this.showError('Erro ao carregar atividades do evento.');
      }
    });
  }

  openEventForm(event?: EventModelV2): void {
    const dialogRef = this.dialog.open(EventFormModalComponent, {
      width: '760px',
      maxWidth: '95vw',
      data: { event: event ?? null }
    });

    const dialogSubscription = dialogRef.afterClosed().subscribe((result: EventFormModalResult | null | undefined) => {
      if (!result) {
        return;
      }

      this.saveEvent(result);
    });

    this.subscriptions.add(dialogSubscription);
  }

  private saveEvent(formValue: EventFormModalResult): void {
    const payload = {
      nome: formValue.nome,
      local: formValue.local,
      inicio: formValue.inicio,
      fim: formValue.fim
    };

    this.submittingEvent = true;
    const request$ = formValue.id
      ? this.eventApiService.updateEvent(formValue.id, payload)
      : this.eventApiService.createEvent(payload);

    request$.pipe(
      finalize(() => {
        this.submittingEvent = false;
      })
    ).subscribe({
      next: () => {
        this.showSuccess(formValue.id ? 'Evento atualizado com sucesso.' : 'Evento criado com sucesso.');
        this.loadEvents(true);
      },
      error: () => {
        this.showError(formValue.id ? 'Erro ao atualizar evento.' : 'Erro ao criar evento.');
      }
    });
  }

  openActivityForm(activity?: ActivityModel): void {
    if (!this.selectedEventId) {
      return;
    }

    if (activity) {
      const { date: inicioData, hour: inicioHora } = this.parseDateTimeValue(activity.inicio);
      const { date: fimData, hour: fimHora } = this.parseDateTimeValue(activity.fim);
      this.selectedTags = this.availableTags.filter((tag) => ((activity.tags ?? []) as string[]).includes(tag.nome));

      this.activityForm.patchValue({
        id: activity.id,
        tipo: activity.tipo,
        nome: activity.nome,
        descricao: activity.descricao,
        inicioData,
        inicioHora,
        fimData,
        fimHora,
        localComplemento: activity.localComplemento,
        sistema: activity.sistema ?? '',
        numeroVagas: activity.numeroVagas ?? null,
        narradorId: activity.narradorId ?? null,
        tema: activity.tema ?? '',
        palestranteId: activity.palestranteId ?? null,
        tagsText: ''
      });
    } else {
      this.resetActivityForm();
    }

    this.showActivityForm = true;
  }

  submitActivity(): void {
    if (!this.canManageActivities || !this.selectedEventId || this.activityForm.invalid) {
      this.activityForm.markAllAsTouched();
      return;
    }

    const payload = this.buildActivityPayload();
    if (!payload) {
      return;
    }

    this.submittingActivity = true;
    const value = this.activityForm.value;
    const request$ = value.id
      ? this.activityApiService.update(value.id, payload)
      : this.activityApiService.create(this.selectedEventId, payload);

    request$.pipe(
      finalize(() => {
        this.submittingActivity = false;
      })
    ).subscribe({
      next: () => {
        this.showSuccess(value.id ? 'Atividade atualizada com sucesso.' : 'Atividade criada com sucesso.');
        this.showActivityForm = false;
        this.resetActivityForm();
        this.loadActivities(this.selectedEventId as number);
      },
      error: () => {
        this.showError(value.id ? 'Erro ao atualizar atividade.' : 'Erro ao criar atividade.');
      }
    });
  }

  deleteEvent(eventId?: number): void {
    if (!this.canManageEvents || !eventId) {
      return;
    }

    this.eventApiService.deleteEvent(eventId).subscribe({
      next: () => {
        this.showSuccess('Evento removido com sucesso.');
        if (this.selectedEventId === eventId) {
          this.selectedEventId = null;
          this.activities = [];
          this.activitiesDataSource.data = [];
        }

        this.loadEvents(false);
      },
      error: () => {
        this.showError('Erro ao remover evento.');
      }
    });
  }

  deleteActivity(activityId?: number): void {
    if (!activityId || !this.selectedEventId || !this.canManageActivities) {
      return;
    }

    this.activityApiService.delete(activityId).subscribe({
      next: () => {
        this.showSuccess('Atividade removida com sucesso.');
        this.loadActivities(this.selectedEventId as number);
      },
      error: () => {
        this.showError('Erro ao remover atividade.');
      }
    });
  }

  getFilteredTags(): TagModel[] {
    return this.filteredTags;
  }

  addTag(tag: TagModel): void {
    if (this.selectedTags.some((selectedTag) => selectedTag.id === tag.id)) {
      return;
    }

    this.selectedTags = [...this.selectedTags, tag];
    this.activityForm.patchValue({ tagsText: '' });
    this.updateFilteredTags();
  }

  removeTag(tag: TagModel): void {
    this.selectedTags = this.selectedTags.filter((selectedTag) => selectedTag.id !== tag.id);
    this.updateFilteredTags();
  }

  onTagsInputFocus(): void {
    this.updateFilteredTags();
    this.tagsAutocompleteTrigger?.openPanel();
  }

  resetActivityForm(): void {
    this.selectedTags = [];
    this.activityForm.reset({
      id: null,
      tipo: ActivityType.RPG_MESA,
      nome: '',
      descricao: '',
      inicioData: null,
      inicioHora: null,
      fimData: null,
      fimHora: null,
      localComplemento: '',
      sistema: '',
      numeroVagas: null,
      tagsText: '',
      narradorId: this.resolveLoggedUserId(),
      tema: '',
      palestranteId: null
    });
    this.updateFilteredTags();
  }

  private updateFilteredTags(): void {
    const query = `${this.activityForm.get('tagsText')?.value || ''}`.trim().toLowerCase();
    this.filteredTags = this.availableTags.filter((tag) => {
      const matchesQuery = query.length === 0 || tag.nome.toLowerCase().includes(query);
      const notSelected = !this.selectedTags.some((selectedTag) => selectedTag.id === tag.id);
      return matchesQuery && notSelected;
    });
  }

  private buildActivityPayload(): CreateActivityPayload | null {
    const value = this.activityForm.value;
    const inicio = this.combineDateAndTime(value.inicioData, value.inicioHora);
    const fim = this.combineDateAndTime(value.fimData, value.fimHora);

    if (!inicio || !fim) {
      this.showError('Informe data e hora válidas para início e fim da atividade.');
      return null;
    }

    const payload: CreateActivityPayload = {
      tipo: value.tipo,
      nome: value.nome,
      descricao: value.descricao,
      inicio,
      fim,
      localComplemento: value.localComplemento
    };

    if (value.tipo === ActivityType.RPG_MESA) {
      const tags = this.selectedTags.map((tag) => tag.nome.trim()).filter((nome) => nome.length > 0);
      const narratorId = this.normalizeIdentifier(value.narradorId) ?? this.resolveLoggedUserId();

      if (!value.sistema || !value.numeroVagas || value.numeroVagas <= 0 || !narratorId || tags.length === 0) {
        this.showError('Para RPG_MESA informe sistema, vagas, ID do narrador e tags.');
        return null;
      }

      payload.sistema = value.sistema;
      payload.numeroVagas = Number(value.numeroVagas);
      payload.narradorId = narratorId;
      payload.tags = tags;
    }

    if (value.tipo === ActivityType.WORKSHOP) {
      if (!value.tema || !value.palestranteId) {
        this.showError('Para WORKSHOP informe tema e ID do palestrante.');
        return null;
      }

      payload.tema = value.tema;
      payload.palestranteId = Number(value.palestranteId);
    }

    return payload;
  }

  private normalizeIdentifier(value: unknown): string | number | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string') {
      const normalized = value.trim();
      return normalized.length > 0 ? normalized : null;
    }

    return null;
  }

  private resolveLoggedUserId(): string | number | null {
    const userData = this.stateService.userData as unknown as Record<string, unknown> | null | undefined;
    const candidate = userData?.['id'] ?? userData?.['userId'] ?? userData?.['usuarioId'];
    return this.normalizeIdentifier(candidate);
  }

  private dateRangeValidator(dField: string, hField: string, dFimField: string, hFimField: string): ValidatorFn {
    return (group): ValidationErrors | null => {
      const inicioData = group.get(dField)?.value;
      const inicioHora = group.get(hField)?.value;
      const fimData = group.get(dFimField)?.value;
      const fimHora = group.get(hFimField)?.value;

      if (!inicioData || !inicioHora || !fimData || !fimHora) {
        return null;
      }

      const inicio = this.combineDateAndTime(inicioData, inicioHora);
      const fim = this.combineDateAndTime(fimData, fimHora);

      if (!inicio || !fim) {
        return null;
      }

      return new Date(fim).getTime() > new Date(inicio).getTime() ? null : { invalidDateRange: true };
    };
  }

  private buildAvailableHours(): string[] {
    const hours: string[] = [];
    for (let hour = 0; hour < 24; hour += 1) {
      for (const minute of [0, 30]) {
        const hh = `${hour}`.padStart(2, '0');
        const mm = `${minute}`.padStart(2, '0');
        hours.push(`${hh}:${mm}`);
      }
    }
    return hours;
  }

  private combineDateAndTime(dateValue: Date, hourValue: string): string | null {
    if (!dateValue || !hourValue) {
      return null;
    }

    const date = new Date(dateValue);
    const [hour, minute] = `${hourValue}`.split(':').map((part) => Number(part));
    if (Number.isNaN(hour) || Number.isNaN(minute)) {
      return null;
    }

    date.setHours(hour, minute, 0, 0);
    const pad = (value: number): string => `${value}`.padStart(2, '0');

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:00`;
  }

  private parseDateTimeValue(value: string): { date: Date; hour: string } {
    const date = new Date(value);
    const pad = (valueToPad: number): string => `${valueToPad}`.padStart(2, '0');

    return {
      date,
      hour: `${pad(date.getHours())}:${pad(date.getMinutes())}`
    };
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Fechar', {
      duration: 3000,
      panelClass: ['snackbar-success']
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Fechar', {
      duration: 3500,
      panelClass: ['snackbar-error']
    });
  }
}
