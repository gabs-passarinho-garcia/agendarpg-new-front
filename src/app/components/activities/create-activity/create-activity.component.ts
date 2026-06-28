import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatAutocompleteModule, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ActivityType } from '../../../models/activity-type.enum';
import { CreateActivityPayload } from '../../../models/activity.model';
import { EventModelV2 } from '../../../models/event.model';
import { TagModel } from '../../../models/tag.model';
import { ActivityApiService } from '../../../services/event/activity-api.service';
import { EventApiService } from '../../../services/event/event-api.service';
import { StateService } from '../../../services/state/state.service';
import { TagApiService } from '../../../services/tag/tag-api.service';
import { ActivityTypeLabelPipe } from '../../../pipes/activity-type-label.pipe';

@Component({
  selector: 'app-create-activity',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatAutocompleteModule,
    MatChipsModule,
    MatDatepickerModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatNativeDateModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    ActivityTypeLabelPipe
  ],
  templateUrl: './create-activity.component.html',
  styleUrls: ['./create-activity.component.scss']
})
export class CreateActivityComponent implements OnInit {
  @ViewChild(MatAutocompleteTrigger) tagsAutocompleteTrigger?: MatAutocompleteTrigger;

  loading = true;
  submitting = false;
  hasEligibleEvents = true;

  events: EventModelV2[] = [];
  selectedEvent: EventModelV2 | null = null;
  minAllowedDate: Date | null = null;
  maxAllowedDate: Date | null = null;
  availableTags: TagModel[] = [];
  filteredTags: TagModel[] = [];
  selectedTags: TagModel[] = [];
  loadingTags = false;

  readonly activityTypes = [ActivityType.RPG_MESA, ActivityType.WORKSHOP];
  readonly activityType = ActivityType;
  availableStartHours: string[] = [];
  availableEndHours: string[] = [];

  activityForm!: FormGroup;

  constructor(
    private readonly fb: FormBuilder,
    private readonly eventApiService: EventApiService,
    private readonly activityApiService: ActivityApiService,
    private readonly tagApiService: TagApiService,
    private readonly stateService: StateService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.setupTagsFilter();
    this.loadEvents();
    this.loadTags();
  }

  get isRpgActivity(): boolean {
    return this.activityForm.get('tipo')?.value === ActivityType.RPG_MESA;
  }

  get isWorkshopActivity(): boolean {
    return this.activityForm.get('tipo')?.value === ActivityType.WORKSHOP;
  }

  initForm(): void {
    this.activityForm = this.fb.group({
      eventId: [null, Validators.required],
      tipo: [ActivityType.RPG_MESA, Validators.required],
      nome: ['', [Validators.required, Validators.minLength(3)]],
      descricao: ['', [Validators.required, Validators.minLength(5)]],
      dataAtividade: [{ value: null, disabled: true }, Validators.required],
      inicioHora: [{ value: null, disabled: true }, Validators.required],
      fimHora: [{ value: null, disabled: true }, Validators.required],
      localComplemento: ['', [Validators.required, Validators.minLength(2)]],
      sistema: [''],
      numeroVagas: [null],
      tagsText: [''],
      tema: [''],
      palestranteId: [null]
    }, { validators: [this.dateRangeValidator()] });
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
      error: (error) => {
        console.error('Erro ao carregar tags:', error);
        this.showError('Não foi possível carregar as tags.');
      }
    });
  }

  loadEvents(): void {
    this.loading = true;

    this.eventApiService.getEvents().pipe(
      finalize(() => {
        this.loading = false;
      })
    ).subscribe({
      next: (response) => {
        this.events = this.filterUpcomingEvents(response.data ?? []);
        this.hasEligibleEvents = this.events.length > 0;

        const routeEventId = Number(this.route.snapshot.queryParamMap.get('eventoId'));
        const initialEvent = this.events.find((event) => event.id === routeEventId) ?? this.events[0] ?? null;

        if (initialEvent?.id) {
          this.selectEvent(initialEvent.id);
        } else {
          this.selectedEvent = null;
          this.setScheduleControlsEnabled(false);
        }
      },
      error: (error) => {
        console.error('Erro ao carregar eventos:', error);
        this.showError('Erro ao carregar eventos disponíveis.');
      }
    });
  }

  selectEvent(eventId: number | null): void {
    const event = this.events.find((item) => item.id === eventId) ?? null;
    this.selectedEvent = event;
    this.setScheduleControlsEnabled(!!event);
    this.activityForm.patchValue({
      eventId,
      dataAtividade: null,
      inicioHora: null,
      fimHora: null
    });
    this.updateScheduleConstraints(event);
  }

  submit(): void {
    if (this.submitting) {
      return;
    }

    if (!this.hasEligibleEvents) {
      this.showError('Não existem eventos futuros disponíveis para criar atividade.');
      return;
    }

    if (this.activityForm.invalid) {
      this.activityForm.markAllAsTouched();
      return;
    }

    if (!this.selectedEvent?.id) {
      this.showError('Selecione um evento para criar a atividade.');
      return;
    }

    const value = this.activityForm.value;
    const inicio = this.combineDateAndTime(value.dataAtividade, value.inicioHora);
    const fim = this.combineDateAndTime(value.dataAtividade, value.fimHora);

    if (!inicio || !fim) {
      this.showError('Informe uma data e horários válidos para início e fim.');
      return;
    }

    if (!this.isEndAfterStart(inicio, fim)) {
      this.showError('A data/hora de fim da atividade deve ser maior que a de início.');
      return;
    }

    if (!this.isInsideEventWindow(inicio, fim)) {
      this.showError('A atividade deve estar dentro da janela do evento selecionado.');
      return;
    }

    const payload = this.buildPayload();
    if (!payload) {
      return;
    }

    this.submitting = true;
    this.activityApiService.create(this.selectedEvent.id as number, payload).pipe(
      finalize(() => {
        this.submitting = false;
      })
    ).subscribe({
      next: () => {
        this.showSuccess('Atividade criada com sucesso.');
        this.resetForm(false);
        // Redirecionar para home após snackbar ser exibido (1500ms)
        setTimeout(() => {
          this.router.navigate(['/']);
        }, 1500);
      },
      error: (error) => {
        console.error('Erro ao criar atividade:', error);
        this.showError('Erro ao criar atividade.');
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/dashboard']);
  }

  resetForm(resetEventSelection = true): void {
    const eventId = resetEventSelection ? null : this.selectedEvent?.id || null;

    this.activityForm.reset({
      eventId,
      tipo: ActivityType.RPG_MESA,
      nome: '',
      descricao: '',
      dataAtividade: null,
      inicioHora: null,
      fimHora: null,
      localComplemento: '',
      sistema: '',
      numeroVagas: null,
      tagsText: '',
      tema: '',
      palestranteId: null
    });
    this.selectedTags = [];

    if (eventId) {
      this.activityForm.patchValue({ eventId });
    }
  }

  private filterUpcomingEvents(events: EventModelV2[]): EventModelV2[] {
    const now = Date.now();
    return events.filter((event) => new Date(event.inicio).getTime() >= now);
  }

  private buildPayload(): CreateActivityPayload | null {
    const value = this.activityForm.value;
    const inicio = this.combineDateAndTime(value.dataAtividade, value.inicioHora);
    const fim = this.combineDateAndTime(value.dataAtividade, value.fimHora);

    if (!inicio || !fim) {
      this.showError('Informe uma data e horários válidos para início e fim.');
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
      const tags = this.selectedTags.map((tag) => tag.nome.trim()).filter((name) => name.length > 0);
      const narratorId = this.resolveNarratorId();

      if (!value.sistema || !value.numeroVagas || Number(value.numeroVagas) <= 0 || !narratorId || tags.length === 0) {
        this.showError('Para RPG_MESA informe sistema, vagas e tags. O narrador será o usuário logado.');
        return null;
      }

      payload.sistema = value.sistema;
      payload.numeroVagas = Number(value.numeroVagas);
      payload.narradorId = narratorId;
      payload.tags = tags;
    }

    if (value.tipo === ActivityType.WORKSHOP) {
      if (!value.tema || !value.palestranteId) {
        this.showError('Para WORKSHOP informe tema e palestrante.');
        return null;
      }

      payload.tema = value.tema;
      payload.palestranteId = Number(value.palestranteId);
    }

    return payload;
  }

  private resolveNarratorId(): string | number | null {
    const userData = this.stateService.userData as unknown as Record<string, unknown> | null | undefined;
    const candidateId = userData?.['id'] ?? userData?.['userId'] ?? userData?.['usuarioId'];

    if (typeof candidateId === 'number' && Number.isFinite(candidateId)) {
      return candidateId;
    }

    if (typeof candidateId === 'string') {
      const normalizedId = candidateId.trim();
      return normalizedId.length > 0 ? normalizedId : null;
    }

    return null;
  }

  private dateRangeValidator(): ValidatorFn {
    return (group): ValidationErrors | null => {
      const dataAtividade = group.get('dataAtividade')?.value;
      const inicioHora = group.get('inicioHora')?.value;
      const fimHora = group.get('fimHora')?.value;

      if (!dataAtividade || !inicioHora || !fimHora) {
        return null;
      }

      const inicio = this.combineDateAndTime(dataAtividade, inicioHora);
      const fim = this.combineDateAndTime(dataAtividade, fimHora);

      if (!inicio || !fim) {
        return null;
      }

      if (new Date(fim) <= new Date(inicio)) {
        return { invalidDateRange: true };
      }

      return this.isInsideEventWindow(inicio, fim) ? null : { invalidDateRange: true };
    };
  }

  private isInsideEventWindow(inicio: string, fim: string): boolean {
    if (!this.selectedEvent) {
      return false;
    }

    const eventStart = new Date(this.selectedEvent.inicio).getTime();
    const eventEnd = new Date(this.selectedEvent.fim).getTime();
    const activityStart = new Date(inicio).getTime();
    const activityEnd = new Date(fim).getTime();

    return activityStart >= eventStart && activityEnd <= eventEnd;
  }

  private isEndAfterStart(inicio: string, fim: string): boolean {
    return new Date(fim).getTime() > new Date(inicio).getTime();
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

    const pad = (n: number): string => `${n}`.padStart(2, '0');

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:00`;
  }

  private updateScheduleConstraints(event: EventModelV2 | null): void {
    if (!event) {
      this.minAllowedDate = null;
      this.maxAllowedDate = null;
      this.availableStartHours = [];
      this.availableEndHours = [];
      return;
    }

    const eventStart = new Date(event.inicio);
    const eventEnd = new Date(event.fim);

    this.minAllowedDate = this.startOfDay(eventStart);
    this.maxAllowedDate = this.startOfDay(eventEnd);
    this.availableStartHours = this.buildAvailableStartHours(eventStart, eventEnd);
    this.availableEndHours = this.buildAvailableEndHours(eventStart, eventEnd);
  }

  private buildAvailableStartHours(eventStart: Date, eventEnd: Date): string[] {
    const start = this.anchorTime(eventStart);
    const end = this.anchorTime(eventEnd);
    end.setHours(end.getHours() - 1, end.getMinutes(), 0, 0);

    return this.buildHourlySlots(start, end);
  }

  private buildAvailableEndHours(eventStart: Date, eventEnd: Date): string[] {
    const start = this.anchorTime(eventStart);
    start.setHours(start.getHours() + 1, start.getMinutes(), 0, 0);
    const end = this.anchorTime(eventEnd);

    return this.buildHourlySlots(start, end);
  }

  private buildHourlySlots(start: Date, end: Date): string[] {
    if (start.getTime() > end.getTime()) {
      return [];
    }

    const hours = new Set<string>();
    const cursor = new Date(start.getTime());

    while (cursor.getTime() <= end.getTime()) {
      const hh = `${cursor.getHours()}`.padStart(2, '0');
      const mm = `${cursor.getMinutes()}`.padStart(2, '0');
      hours.add(`${hh}:${mm}`);
      cursor.setMinutes(cursor.getMinutes() + 30);
    }

    return Array.from(hours);
  }

  private startOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  private anchorTime(date: Date): Date {
    return new Date(2000, 0, 1, date.getHours(), date.getMinutes(), 0, 0);
  }

  isDateAllowed = (date: Date | null): boolean => {
    if (!date || !this.minAllowedDate || !this.maxAllowedDate) {
      return false;
    }

    const day = this.startOfDay(date).getTime();
    return day >= this.minAllowedDate.getTime() && day <= this.maxAllowedDate.getTime();
  }

  private setScheduleControlsEnabled(enabled: boolean): void {
    const controls = ['dataAtividade', 'inicioHora', 'fimHora'];

    for (const controlName of controls) {
      const control = this.activityForm.get(controlName);
      if (!control) {
        continue;
      }

      if (enabled) {
        control.enable({ emitEvent: false });
      } else {
        control.disable({ emitEvent: false });
      }
    }
  }

  getFilteredTags(): TagModel[] {
    return this.filteredTags;
  }

  onTagsInputFocus(): void {
    this.updateFilteredTags();
    this.tagsAutocompleteTrigger?.openPanel();
  }

  private setupTagsFilter(): void {
    this.activityForm.get('tagsText')?.valueChanges.subscribe(() => {
      this.updateFilteredTags();
    });
  }

  private updateFilteredTags(): void {
    const query = `${this.activityForm.get('tagsText')?.value || ''}`.trim().toLowerCase();
    this.filteredTags = this.availableTags.filter((tag) => {
      const matchesQuery = query.length === 0 || tag.nome.toLowerCase().includes(query);
      const notSelected = !this.selectedTags.some((selected) => selected.id === tag.id);
      return matchesQuery && notSelected;
    });
  }

  addTag(tag: TagModel): void {
    const exists = this.selectedTags.some((item) => item.nome.toLowerCase() === tag.nome.toLowerCase());
    if (exists) {
      return;
    }

    this.selectedTags = [...this.selectedTags, tag];
    this.activityForm.patchValue({ tagsText: '' });
    this.updateFilteredTags();
  }

  removeTag(tag: TagModel): void {
    this.selectedTags = this.selectedTags.filter((item) => item.id !== tag.id);
    this.updateFilteredTags();
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
