import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';

import { EventModelV2 } from '../../../../models/event.model';

export interface EventFormModalData {
  event?: EventModelV2 | null;
}

export interface EventFormModalResult {
  id?: number | null;
  nome: string;
  local: string;
  inicio: string;
  fim: string;
}

@Component({
  selector: 'app-event-form-modal',
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
    MatSelectModule
  ],
  templateUrl: './event-form-modal.component.html',
  styleUrls: ['./event-form-modal.component.scss']
})
export class EventFormModalComponent implements OnInit {
  readonly availableHours = this.buildAvailableHours();

  eventForm = this.fb.group(
    {
      id: [null as number | null],
      nome: ['', [Validators.required, Validators.minLength(3)]],
      local: ['', [Validators.required, Validators.minLength(3)]],
      inicioData: [null as Date | null, [Validators.required]],
      inicioHora: [null as string | null, [Validators.required]],
      fimData: [null as Date | null, [Validators.required]],
      fimHora: [null as string | null, [Validators.required]]
    },
    { validators: [this.dateRangeValidator()] }
  );

  constructor(
    private readonly fb: FormBuilder,
    private readonly dialogRef: MatDialogRef<EventFormModalComponent>,
    @Inject(MAT_DIALOG_DATA) public readonly data: EventFormModalData
  ) {}

  ngOnInit(): void {
    const event = this.data.event;
    if (event) {
      const inicio = this.parseDateTimeValue(event.inicio);
      const fim = this.parseDateTimeValue(event.fim);

      this.eventForm.patchValue({
        id: event.id ?? null,
        nome: event.nome,
        local: event.local,
        inicioData: inicio.date,
        inicioHora: inicio.hour,
        fimData: fim.date,
        fimHora: fim.hour
      });
    }
  }

  save(): void {
    if (this.eventForm.invalid) {
      this.eventForm.markAllAsTouched();
      return;
    }

    const value = this.eventForm.value;
    const inicio = this.combineDateAndTime(value.inicioData ?? null, value.inicioHora ?? null);
    const fim = this.combineDateAndTime(value.fimData ?? null, value.fimHora ?? null);

    if (!inicio || !fim) {
      return;
    }

    const result: EventFormModalResult = {
      id: value.id ?? null,
      nome: value.nome ?? '',
      local: value.local ?? '',
      inicio,
      fim
    };

    this.dialogRef.close(result);
  }

  close(): void {
    this.dialogRef.close(null);
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

      return new Date(fim).getTime() > new Date(inicio).getTime() ? null : { invalidDateRange: true };
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

    const pad = (value: number): string => `${value}`.padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:00`;
  }

  private parseDateTimeValue(value: string): { date: Date; hour: string } {
    const date = new Date(value);
    const pad = (numberValue: number): string => `${numberValue}`.padStart(2, '0');

    return {
      date,
      hour: `${pad(date.getHours())}:${pad(date.getMinutes())}`
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
}
