import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { UserAdminService, PagedResponse, UserSearchParams } from '../../../services/admin/user-admin/user-admin.service';
import { UserModel } from '../../../models/user';
import { UserDetailsModalComponent } from './user-details-modal/user-details-modal.component';
import { UserEditModalComponent } from './user-edit-modal/user-edit-modal.component';
import { UserCreateModalComponent } from './user-create-modal/user-create-modal.component';
import { ConfirmDeleteDialogComponent } from './confirm-delete-dialog/confirm-delete-dialog.component';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatSelectModule,
    MatFormFieldModule,
    MatDialogModule,
    MatExpansionModule,
    ReactiveFormsModule
  ],
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.scss']
})
export class UserManagementComponent implements OnInit {
  loading = true;
  displayedColumns: string[] = ['nomeCompleto', 'email', 'telefone', 'tipo', 'acoes'];
  dataSource: UserModel[] = [];
  totalElements = 0;
  totalPages = 0;
  currentPage = 0;
  pageSize = 10;

  // Formulário de filtros
  filterForm!: FormGroup;

  // Opções para os filtros
  userTypes = [
    { value: '', label: 'Todos' },
    { value: 'JGD', label: 'Jogador' },
    { value: 'NRD', label: 'Narrador' },
    { value: 'CRD', label: 'Coordenador' },
    { value: 'ADM', label: 'Administrador' }
  ];

  minorOptions = [
    { value: 'S', label: 'Sim' },
    { value: 'N', label: 'Não' }
  ];

  sortOptions = [
    { value: 'nomeCompleto', label: 'Nome' },
    { value: 'email', label: 'Email' },
    { value: 'apelido', label: 'Apelido' }
  ];

  directionOptions = [
    { value: 'asc', label: 'Crescente' },
    { value: 'desc', label: 'Decrescente' }
  ];

  constructor(
    private userAdminService: UserAdminService,
    private snackBar: MatSnackBar,
    private fb: FormBuilder,
    private dialog: MatDialog
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.loadUsers();
  }

  /**
   * Inicializa o formulário de filtros
   */
  initializeForm(): void {
    this.filterForm = this.fb.group({
      tipos: [''],
      menor: [''],
      sort: ['nomeCompleto'],
      dir: ['asc']
    });
  }

  /**
   * Aplica os filtros e recarrega a tabela
   */
  applyFilters(): void {
    this.currentPage = 0; // Volta para primeira página ao filtrar
    this.loadUsers();
  }

  /**
   * Limpa todos os filtros
   */
  clearFilters(): void {
    this.filterForm.reset({
      tipos: '',
      menor: '',
      sort: 'nomeCompleto',
      dir: 'asc'
    });
    this.currentPage = 0;
    this.loadUsers();
  }

  loadUsers(page: number = 0): void {
    this.loading = true;

    // Construir objeto de parâmetros com os filtros aplicados
    const searchParams: UserSearchParams = {
      page,
      size: this.pageSize,
      sort: this.filterForm.get('sort')?.value || 'nomeCompleto',
      dir: this.filterForm.get('dir')?.value || 'asc'
    };

    // Adicionar filtros opcionais se preenchidos
    const tipos = this.filterForm.get('tipos')?.value;
    if (tipos && tipos !== '') {
      searchParams.tipos = tipos;
    }

    const menor = this.filterForm.get('menor')?.value;
    if (menor) {
      searchParams.menor = menor;
    }

    this.userAdminService.searchUsers(searchParams).subscribe({
      next: (response) => {
        this.loading = false;
        const pagedData = response.data as PagedResponse<UserModel>;
        this.dataSource = pagedData.content;
        this.totalElements = pagedData.totalElements;
        this.totalPages = pagedData.totalPages;
        this.currentPage = pagedData.number;
      },
      error: (error) => {
        this.loading = false;
        console.error('Erro ao carregar usuários:', error);
        this.snackBar.open(
          'Erro ao carregar usuários. Tente novamente.',
          'Fechar',
          { duration: 3000, panelClass: ['snackbar-error'] }
        );
      }
    });
  }

  /**
   * Retorna um array com os números de página para exibir na paginação
   * Mostra no máximo 5 números de página
   */
  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(0, this.currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(this.totalPages, startPage + maxPagesToShow);

    // Ajusta o startPage se estivermos perto do final
    if (endPage - startPage < maxPagesToShow) {
      startPage = Math.max(0, endPage - maxPagesToShow);
    }

    for (let i = startPage; i < endPage; i++) {
      pages.push(i);
    }

    return pages;
  }

  createUser(): void {
    const dialogRef = this.dialog.open(UserCreateModalComponent, {
      width: '800px',
      maxWidth: '95vw',
      panelClass: 'user-create-dialog'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.saveNewUser(result);
      }
    });
  }

  saveNewUser(userData: Partial<UserModel>): void {
    this.userAdminService.createUser(userData as UserModel).subscribe({
      next: (response) => {
        this.snackBar.open(
          'Usuário criado com sucesso!',
          'Fechar',
          { duration: 3000, panelClass: ['snackbar-success'] }
        );
        this.loadUsers(this.currentPage);
      },
      error: (error) => {
        console.error('Erro ao criar usuário:', error);
        this.snackBar.open(
          'Erro ao criar usuário. Tente novamente.',
          'Fechar',
          { duration: 3000, panelClass: ['snackbar-error'] }
        );
      }
    });
  }

  viewUserDetails(user: UserModel): void {
    this.dialog.open(UserDetailsModalComponent, {
      width: '700px',
      maxWidth: '90vw',
      data: user,
      panelClass: 'user-details-dialog'
    });
  }

  editUser(user: UserModel): void {
    const dialogRef = this.dialog.open(UserEditModalComponent, {
      width: '800px',
      maxWidth: '95vw',
      data: user,
      panelClass: 'user-edit-dialog'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.updateUser(result);
      }
    });
  }

  updateUser(userData: UserModel): void {
    this.userAdminService.updateUser(userData).subscribe({
      next: (response) => {
        this.snackBar.open(
          'Usuário atualizado com sucesso!',
          'Fechar',
          { duration: 3000, panelClass: ['snackbar-success'] }
        );
        this.loadUsers(this.currentPage);
      },
      error: (error) => {
        console.error('Erro ao atualizar usuário:', error);
        this.snackBar.open(
          'Erro ao atualizar usuário. Tente novamente.',
          'Fechar',
          { duration: 3000, panelClass: ['snackbar-error'] }
        );
      }
    });
  }

  deleteUser(user: UserModel): void {
    const dialogRef = this.dialog.open(ConfirmDeleteDialogComponent, {
      width: '400px',
      data: { userName: user.nomeCompleto }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.confirmDeleteUser(user);
      }
    });
  }

  confirmDeleteUser(user: UserModel): void {
    if (!user.id) {
      this.snackBar.open(
        'ID do usuário não encontrado.',
        'Fechar',
        { duration: 3000, panelClass: ['snackbar-error'] }
      );
      return;
    }

    this.userAdminService.deleteUser(user.id).subscribe({
      next: () => {
        this.snackBar.open(
          'Usuário deletado com sucesso!',
          'Fechar',
          { duration: 3000, panelClass: ['snackbar-success'] }
        );
        this.loadUsers(this.currentPage);
      },
      error: (error) => {
        console.error('Erro ao deletar usuário:', error);
        this.snackBar.open(
          'Erro ao deletar usuário. Tente novamente.',
          'Fechar',
          { duration: 3000, panelClass: ['snackbar-error'] }
        );
      }
    });
  }
}
