import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

import { TagModel } from '../../../../models/tag.model';
import { TagUpsertPayload } from '../../../../services/tag/tag-api.service';

@Component({
  selector: 'app-tag-edit-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule
  ],
  templateUrl: './tag-edit-modal.component.html',
  styleUrls: ['./tag-edit-modal.component.scss']
})
export class TagEditModalComponent {
  readonly form = this.fb.group({
    tag: [this.data.nome, [Validators.required, Validators.minLength(2)]]
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly dialogRef: MatDialogRef<TagEditModalComponent>,
    @Inject(MAT_DIALOG_DATA) public readonly data: TagModel
  ) {}

  close(): void {
    this.dialogRef.close(null);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload: TagUpsertPayload = {
      id: this.data.id,
      tag: this.form.get('tag')?.value?.trim() ?? ''
    };

    this.dialogRef.close(payload);
  }
}
