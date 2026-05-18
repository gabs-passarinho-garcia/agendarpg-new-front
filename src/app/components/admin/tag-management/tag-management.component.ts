import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TagApiService, TagUpsertPayload } from '../../../services/tag/tag-api.service';
import { TagModel } from '../../../models/tag.model';
import { TagEditModalComponent } from './tag-edit-modal/tag-edit-modal.component';

@Component({
  selector: 'app-tag-management',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatTableModule
  ],
  templateUrl: './tag-management.component.html',
  styleUrls: ['./tag-management.component.scss']
})
export class TagManagementComponent implements OnInit {
  @ViewChild(MatPaginator) set paginator(paginator: MatPaginator | undefined) {
    this.dataSource.paginator = paginator ?? null;
  }

  loading = true;
  saving = false;
  deletingId: string | number | null = null;
  searchTerm = '';

  readonly displayedColumns = ['tag', 'acoes'];
  readonly pageSizeOptions = [5, 10, 25];

  dataSource = new MatTableDataSource<TagModel>([]);

  tagForm = this.fb.group({
    id: [null as string | number | null],
    tag: ['', [Validators.required, Validators.minLength(2)]]
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly tagApiService: TagApiService,
    private readonly snackBar: MatSnackBar,
    private readonly dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadTags();
  }

  get title(): string {
    return 'Nova tag';
  }

  get submitLabel(): string {
    return 'Criar tag';
  }

  loadTags(): void {
    this.loading = true;

    this.tagApiService.getTags().pipe(
      finalize(() => {
        this.loading = false;
      })
    ).subscribe({
      next: (tags) => {
        this.dataSource.data = tags;
        this.applyFilter(this.searchTerm);
      },
      error: () => {
        this.showError('Não foi possível carregar as tags.');
      }
    });
  }

  applyFilter(value: string): void {
    this.searchTerm = value;
    const normalized = value.trim().toLowerCase();

    this.dataSource.filterPredicate = (tag, filter) => {
      const haystack = `${tag.nome}`.toLowerCase();
      return haystack.includes(filter);
    };

    this.dataSource.filter = normalized;
  }

  clearFilter(): void {
    this.applyFilter('');
  }

  createNew(): void {
    this.tagForm.reset({
      id: null,
      tag: ''
    });
  }

  editTag(tag: TagModel): void {
    const dialogRef = this.dialog.open(TagEditModalComponent, {
      width: '480px',
      maxWidth: '95vw',
      data: tag
    });

    dialogRef.afterClosed().subscribe((payload: TagUpsertPayload | null | undefined) => {
      if (!payload) {
        return;
      }

      this.updateTag(payload);
    });
  }

  saveTag(): void {
    if (this.tagForm.invalid) {
      this.tagForm.markAllAsTouched();
      return;
    }

    const value = this.tagForm.value;
    const payload: TagUpsertPayload = {
      tag: value.tag?.trim() ?? ''
    };

    this.saving = true;
    this.tagApiService.createTag(payload).pipe(
      finalize(() => {
        this.saving = false;
      })
    ).subscribe({
      next: () => {
        this.showSuccess('Tag criada com sucesso.');
        this.createNew();
        this.loadTags();
      },
      error: () => {
        this.showError('Erro ao criar tag.');
      }
    });
  }

  private updateTag(payload: TagUpsertPayload): void {
    this.tagApiService.updateTag(payload).subscribe({
      next: () => {
        this.showSuccess('Tag atualizada com sucesso.');
        this.loadTags();
      },
      error: () => {
        this.showError('Erro ao atualizar tag.');
      }
    });
  }

  deleteTag(tag: TagModel): void {
    const confirmed = window.confirm(`Excluir a tag "${tag.nome}"?`);
    if (!confirmed) {
      return;
    }

    this.deletingId = tag.id;
    this.tagApiService.deleteTag(tag.id).pipe(
      finalize(() => {
        this.deletingId = null;
      })
    ).subscribe({
      next: () => {
        this.showSuccess('Tag removida com sucesso.');
        this.loadTags();
      },
      error: () => {
        this.showError('Erro ao remover tag.');
      }
    });
  }

  trackById(index: number, tag: TagModel): string | number {
    return tag.id;
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
