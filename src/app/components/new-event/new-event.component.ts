import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';
import { EventApiService } from '../../services/event/event-api.service';

@Component({
  selector: 'app-new-event',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatNativeDateModule,
    MatSelectModule,
    MatButtonModule,
    MatSnackBarModule
  ],
  templateUrl: './new-event.component.html',
  styleUrls: ['./new-event.component.scss']
})
export class NewEventComponent implements OnInit {
  eventForm!: FormGroup;
  submitting = false;
  readonly availableHours = this.buildAvailableHours();

  constructor(
    private readonly fb: FormBuilder,
    private readonly router: Router,
    private readonly eventApiService: EventApiService,
    private readonly snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.eventForm = this.fb.group({
      nome: ['', [Validators.required, Validators.minLength(3)]],
      local: ['', [Validators.required, Validators.minLength(3)]],
      inicioData: [null, Validators.required],
      inicioHora: [null, Validators.required],
      fimData: [null, Validators.required],
      fimHora: [null, Validators.required]
    }, { validators: [this.dateRangeValidator()] });

    this.eventForm.get('inicioData')?.valueChanges.subscribe(() => {
      this.suggestEndDateTime();
    });

    this.eventForm.get('inicioHora')?.valueChanges.subscribe(() => {
      this.suggestEndDateTime();
    });
  }

  onSubmit(): void {
    if (this.submitting) {
      return;
    }

    if (this.eventForm.invalid) {
      this.eventForm.markAllAsTouched();
      return;
    }

    const formData = this.eventForm.value;
    const inicio = this.combineDateAndTime(formData.inicioData, formData.inicioHora);
    const fim = this.combineDateAndTime(formData.fimData, formData.fimHora);

    if (!inicio || !fim) {
      this.snackBar.open('Informe data e hora validas para inicio e fim.', 'Fechar', {
        duration: 3500
      });
      return;
    }

    if (!this.isEndAfterStart(inicio, fim)) {
      this.snackBar.open('A data/hora de fim deve ser maior que a de inicio.', 'Fechar', {
        duration: 3500
      });
      return;
    }

    const payload = {
      nome: formData.nome,
      local: formData.local,
      inicio: this.formatToLocalDateTime(inicio),
      fim: this.formatToLocalDateTime(fim)
    };

    this.submitting = true;
    this.eventApiService.createEvent(payload).pipe(
      finalize(() => {
        this.submitting = false;
      })
    ).subscribe({
      next: () => {
        this.snackBar.open('Evento criado com sucesso!', 'Fechar', {
          duration: 3000
        });
        this.router.navigate(['/dashboard']);
      },
      error: () => {
        this.snackBar.open('Erro ao criar evento. Tente novamente.', 'Fechar', {
          duration: 3500
        });
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/dashboard']);
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

      return fim > inicio ? null : { invalidDateRange: true };
    };
  }

  private combineDateAndTime(date: Date | null, time: string | null): Date | null {
    if (!date || !time) {
      return null;
    }

    const [hours, minutes] = time.split(':');
    const combined = new Date(date);
    combined.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0);
    return combined;
  }

  private isEndAfterStart(inicio: Date, fim: Date): boolean {
    return fim > inicio;
  }

  private suggestEndDateTime(): void {
    const inicioData = this.eventForm.get('inicioData')?.value;
    const inicioHora = this.eventForm.get('inicioHora')?.value;

    if (!inicioData || !inicioHora) {
      return;
    }

    const inicio = this.combineDateAndTime(inicioData, inicioHora);
    if (!inicio) {
      return;
    }

    const fim = new Date(inicio);
    fim.setHours(fim.getHours() + 3);

    this.eventForm.patchValue(
      {
        fimData: new Date(fim.getFullYear(), fim.getMonth(), fim.getDate()),
        fimHora: `${String(fim.getHours()).padStart(2, '0')}:${String(fim.getMinutes()).padStart(2, '0')}`
      },
      { emitEvent: false }
    );
  }

  private formatToLocalDateTime(date: Date): string {
    const pad = (n: number): string => `${n}`.padStart(2, '0');

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:00`;
  }

  private buildAvailableHours(): string[] {
    const hours: string[] = [];
    for (let i = 0; i < 24; i++) {
      for (let j = 0; j < 60; j += 30) {
        hours.push(`${String(i).padStart(2, '0')}:${String(j).padStart(2, '0')}`);
      }
    }
    return hours;
  }
}
