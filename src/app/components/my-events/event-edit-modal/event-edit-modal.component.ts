import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';
import { EventModelV2 } from '../../../models/event.model';
import { EventApiService } from '../../../services/event/event-api.service';
import { EventUpdateService } from '../../../services/event/event-update.service';

@Component({
  selector: 'app-event-edit-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatNativeDateModule,
    MatSelectModule,
    MatSnackBarModule
  ],
  templateUrl: './event-edit-modal.component.html',
  styleUrl: './event-edit-modal.component.scss'
})
export class EventEditModalComponent implements OnInit {
  editForm!: FormGroup;
  saving = false;
  readonly availableHours = this.buildAvailableHours();

  constructor(
    private readonly fb: FormBuilder,
    private readonly eventApiService: EventApiService,
    private readonly eventUpdateService: EventUpdateService,
    private readonly snackBar: MatSnackBar,
    private readonly dialogRef: MatDialogRef<EventEditModalComponent>,
    @Inject(MAT_DIALOG_DATA) public readonly event: EventModelV2
  ) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  save(): void {
    if (this.editForm.invalid || !this.event.id) {
      this.editForm.markAllAsTouched();
      return;
    }

    const formValue = this.editForm.value;
    const inicio = this.combineDateAndTime(formValue.inicioData, formValue.inicioHora);
    const fim = this.combineDateAndTime(formValue.fimData, formValue.fimHora);

    if (!inicio || !fim) {
      this.editForm.markAllAsTouched();
      return;
    }

    const payload = {
      nome: formValue.nome,
      local: formValue.local,
      inicio,
      fim
    };

    this.saving = true;
    this.eventApiService.updateEvent(this.event.id, payload).pipe(
      finalize(() => {
        this.saving = false;
      })
    ).subscribe({
      next: () => {
        this.snackBar.open('Evento atualizado com sucesso!', 'Fechar', {
          duration: 3000,
          panelClass: ['snackbar-success']
        });
        this.eventUpdateService.notifyEventUpdated(this.event.id?.toString());
        this.dialogRef.close(true);
      },
      error: () => {
        this.snackBar.open('Nao foi possivel salvar as alteracoes do evento.', 'Fechar', {
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
    const inicio = this.parseDateTimeValue(this.event.inicio);
    const fim = this.parseDateTimeValue(this.event.fim);

    this.editForm = this.fb.group({
      nome: [this.event.nome, [Validators.required, Validators.minLength(3)]],
      local: [this.event.local, [Validators.required, Validators.minLength(3)]],
      inicioData: [inicio.date, [Validators.required]],
      inicioHora: [inicio.hour, [Validators.required]],
      fimData: [fim.date, [Validators.required]],
      fimHora: [fim.hour, [Validators.required]]
    }, { validators: [this.dateRangeValidator()] });
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

  private parseDateTimeValue(value: string): { date: Date; hour: string } {
    const date = new Date(value);
    const pad = (n: number): string => `${n}`.padStart(2, '0');

    return {
      date,
      hour: `${pad(date.getHours())}:${pad(date.getMinutes())}`
    };
  }

  private combineDateAndTime(dateValue: Date | null, hourValue: string | null): string | null {
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
}
