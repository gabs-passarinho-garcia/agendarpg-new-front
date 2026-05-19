import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatAutocompleteModule, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { ActivityModel, UpdateActivityPayload } from '../../../models/activity.model';
import { ActivityType } from '../../../models/activity-type.enum';
import { NarratorOption } from '../../../models/narrator-option.model';
import { TagModel } from '../../../models/tag.model';
import { ActivityApiService } from '../../../services/event/activity-api.service';
import { EventUpdateService } from '../../../services/event/event-update.service';
import { TagApiService } from '../../../services/tag/tag-api.service';
import { UserService } from '../../../services/user/user.service';
import { ActivityTypeLabelPipe } from '../../../pipes/activity-type-label.pipe';

@Component({
  selector: 'app-activity-edit-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule,
    MatAutocompleteModule,
    MatChipsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    ActivityTypeLabelPipe
  ],
  templateUrl: './activity-edit-modal.component.html',
  styleUrl: './activity-edit-modal.component.scss'
})
export class ActivityEditModalComponent implements OnInit {
  @ViewChild(MatAutocompleteTrigger) tagsAutocompleteTrigger?: MatAutocompleteTrigger;

  readonly activityTypes = [ActivityType.RPG_MESA, ActivityType.WORKSHOP];
  readonly availableHours = this.buildAvailableHours();

  editForm!: FormGroup;
  saving = false;

  availableTags: TagModel[] = [];
  filteredTags: TagModel[] = [];
  selectedTags: TagModel[] = [];
  loadingTags = false;

  narrators: NarratorOption[] = [];
  loadingNarrators = false;

  constructor(
    private readonly fb: FormBuilder,
    private readonly activityApiService: ActivityApiService,
    private readonly eventUpdateService: EventUpdateService,
    private readonly snackBar: MatSnackBar,
    private readonly tagApiService: TagApiService,
    private readonly userService: UserService,
    private readonly dialogRef: MatDialogRef<ActivityEditModalComponent>,
    @Inject(MAT_DIALOG_DATA) public readonly activity: ActivityModel
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.setupTagsFilter();
    this.loadTags();
    this.loadNarrators();
  }

  get isRpgActivity(): boolean {
    return this.editForm.get('tipo')?.value === ActivityType.RPG_MESA;
  }

  get isWorkshopActivity(): boolean {
    return this.editForm.get('tipo')?.value === ActivityType.WORKSHOP;
  }

  save(): void {
    if (!this.activity.id || this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }

    const payload = this.buildPayload();
    if (!payload) {
      return;
    }

    this.saving = true;
    this.activityApiService.update(this.activity.id, payload).pipe(
      finalize(() => {
        this.saving = false;
      })
    ).subscribe({
      next: () => {
        this.snackBar.open('Atividade atualizada com sucesso!', 'Fechar', {
          duration: 3000,
          panelClass: ['snackbar-success']
        });
        this.eventUpdateService.notifyEventUpdated();
        this.dialogRef.close(true);
      },
      error: () => {
        this.snackBar.open('Nao foi possivel salvar as alteracoes da atividade.', 'Fechar', {
          duration: 3500,
          panelClass: ['snackbar-error']
        });
      }
    });
  }

  cancel(): void {
    this.dialogRef.close(false);
  }

  private initializeForm(): void {
    const { inicioData, inicioHora } = this.parseDateTimeValue(this.activity.inicio);
    const { inicioData: fimData, inicioHora: fimHora } = this.parseDateTimeValue(this.activity.fim);

    this.editForm = this.fb.group({
      tipo: [this.activity.tipo, [Validators.required]],
      nome: [this.activity.nome, [Validators.required, Validators.minLength(3)]],
      descricao: [this.activity.descricao, [Validators.required, Validators.minLength(5)]],
      inicioData: [inicioData, Validators.required],
      inicioHora: [inicioHora, Validators.required],
      fimData: [fimData, Validators.required],
      fimHora: [fimHora, Validators.required],
      localComplemento: [this.activity.localComplemento, [Validators.required, Validators.minLength(2)]],
      sistema: [this.activity.sistema ?? ''],
      numeroVagas: [this.activity.numeroVagas ?? null],
      tagsText: [''],
      tema: [this.activity.tema ?? ''],
      palestranteId: [this.activity.palestranteId ?? null],
      narradorId: [this.activity.narradorId ?? null]
    }, { validators: [this.dateRangeValidator()] });
  }

  private buildPayload(): UpdateActivityPayload | null {
    const formValue = this.editForm.value;
    const tipo = formValue.tipo as ActivityType;

    const inicio = this.combineDateAndTime(formValue.inicioData, formValue.inicioHora);
    const fim = this.combineDateAndTime(formValue.fimData, formValue.fimHora);

    if (!inicio || !fim) {
      this.snackBar.open('Informe data e hora válidas para início e fim.', 'Fechar', {
        duration: 3500,
        panelClass: ['snackbar-error']
      });
      return null;
    }

    const payload: UpdateActivityPayload = {
      tipo,
      nome: formValue.nome,
      descricao: formValue.descricao,
      inicio,
      fim,
      localComplemento: formValue.localComplemento
    };

    if (tipo === ActivityType.RPG_MESA) {
      const tags = this.selectedTags.map((tag) => tag.nome.trim()).filter((name) => name.length > 0);

      if (!formValue.sistema || !formValue.numeroVagas || Number(formValue.numeroVagas) <= 0 || tags.length === 0) {
        this.snackBar.open('Para RPG_MESA informe sistema, vagas e tags.', 'Fechar', {
          duration: 3500,
          panelClass: ['snackbar-error']
        });
        return null;
      }

      payload.sistema = formValue.sistema;
      payload.numeroVagas = Number(formValue.numeroVagas);
      payload.narradorId = formValue.narradorId ?? null;
      payload.tags = tags;
    }

    if (tipo === ActivityType.WORKSHOP) {
      if (!formValue.tema || !formValue.palestranteId) {
        this.snackBar.open('Para WORKSHOP informe tema e palestrante.', 'Fechar', {
          duration: 3500,
          panelClass: ['snackbar-error']
        });
        return null;
      }

      payload.tema = formValue.tema;
      payload.palestranteId = Number(formValue.palestranteId);
    }

    return payload;
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

    const pad = (n: number): string => `${n}`.padStart(2, '0');

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:00`;
  }

  private parseDateTimeValue(value: string): { inicioData: Date; inicioHora: string } {
    const date = new Date(value);
    const pad = (n: number): string => `${n}`.padStart(2, '0');
    const hour = `${pad(date.getHours())}:${pad(date.getMinutes())}`;

    return {
      inicioData: date,
      inicioHora: hour
    };
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
        this.prepareSelectedTags();
      },
      error: (error) => {
        console.error('Erro ao carregar tags:', error);
        this.snackBar.open('Não foi possível carregar as tags.', 'Fechar', {
          duration: 3500,
          panelClass: ['snackbar-error']
        });
      }
    });
  }

  loadNarrators(): void {
    this.loadingNarrators = true;
    this.userService.getNarrators().pipe(
      finalize(() => {
        this.loadingNarrators = false;
      })
    ).subscribe({
      next: (response) => {
        this.narrators = response.data ?? [];
      },
      error: (error) => {
        console.error('Erro ao carregar narradores:', error);
        this.narrators = [];
        this.snackBar.open('Não foi possível carregar a lista de narradores.', 'Fechar', {
          duration: 3500,
          panelClass: ['snackbar-error']
        });
      }
    });
  }

  private setupTagsFilter(): void {
    this.editForm.get('tagsText')?.valueChanges.subscribe(() => {
      this.updateFilteredTags();
    });
  }

  private updateFilteredTags(): void {
    const query = `${this.editForm.get('tagsText')?.value || ''}`.trim().toLowerCase();
    this.filteredTags = this.availableTags.filter((tag) => {
      const matchesQuery = query.length === 0 || tag.nome.toLowerCase().includes(query);
      const notSelected = !this.selectedTags.some((selected) => selected.id === tag.id);
      return matchesQuery && notSelected;
    });
  }

  getFilteredTags(): TagModel[] {
    return this.filteredTags;
  }

  addTag(tag: TagModel): void {
    const exists = this.selectedTags.some((item) => item.nome.toLowerCase() === tag.nome.toLowerCase());
    if (exists) {
      return;
    }

    this.selectedTags = [...this.selectedTags, tag];
    this.editForm.patchValue({ tagsText: '' });
    this.updateFilteredTags();
  }

  removeTag(tag: TagModel): void {
    this.selectedTags = this.selectedTags.filter((item) => item.id !== tag.id);
    this.updateFilteredTags();
  }

  onTagsInputFocus(): void {
    this.updateFilteredTags();
    this.tagsAutocompleteTrigger?.openPanel();
  }

  private prepareSelectedTags(): void {
    if (this.activity.tags && Array.isArray(this.activity.tags)) {
      const tagNames = this.activity.tags as string[];
      this.selectedTags = this.availableTags.filter((tag) =>
        tagNames.includes(tag.nome)
      );
    }
  }
}
