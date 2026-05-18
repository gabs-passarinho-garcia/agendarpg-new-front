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
    MatSnackBarModule
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
  availableTags: TagModel[] = [];
  filteredTags: TagModel[] = [];
  selectedTags: TagModel[] = [];
  loadingTags = false;

  readonly activityTypes = [ActivityType.RPG_MESA, ActivityType.WORKSHOP];
  readonly activityType = ActivityType;
  readonly availableHours = this.buildAvailableHours();

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
      inicioData: [null, Validators.required],
      inicioHora: [null, Validators.required],
      fimData: [null, Validators.required],
      fimHora: [null, Validators.required],
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
    this.activityForm.patchValue({ eventId });
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
    const inicio = this.combineDateAndTime(value.inicioData, value.inicioHora);
    const fim = this.combineDateAndTime(value.fimData, value.fimHora);

    if (!inicio || !fim) {
      this.showError('Informe data e hora válidas para início e fim.');
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
      inicioData: null,
      inicioHora: null,
      fimData: null,
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
    const inicio = this.combineDateAndTime(value.inicioData, value.inicioHora);
    const fim = this.combineDateAndTime(value.fimData, value.fimHora);

    if (!inicio || !fim) {
      this.showError('Informe data e hora válidas para início e fim.');
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
      const inicioData = group.get('inicioData')?.value;
      const inicioHora = group.get('inicioHora')?.value;
      const fimData = group.get('fimData')?.value;
      const fimHora = group.get('fimHora')?.value;

      if (!inicioData || !inicioHora || !fimData || !fimHora) {
        return null;
      }

      const inicio = this.combineDateAndTime(inicioData, inicioHora);
      const fim = this.combineDateAndTime(fimData, fimHora);

      if (!inicio || !fim) {
        return null;
      }

      return new Date(fim) > new Date(inicio) ? null : { invalidDateRange: true };
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
