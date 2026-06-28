import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { StateService } from '../services/state/state.service';
import { UserAdminService } from '../services/admin/user-admin/user-admin.service';

@Injectable({
  providedIn: 'root'
})
export class CoordinatorAdminGuard implements CanActivate {
  constructor(
    private stateService: StateService,
    private router: Router,
    private snackBar: MatSnackBar,
    private userAdminService: UserAdminService
  ) {}

  canActivate(): Observable<boolean> {
    if (!this.stateService.isLoggedIn) {
      this.snackBar.open(
        'Você precisa estar logado para acessar esta página.',
        'Fechar',
        { duration: 3000, panelClass: ['snackbar-error'] }
      );
      this.router.navigate(['/login']);
      return of(false);
    }

    return this.userAdminService.validateUserIsCoordinatorOrAdmin().pipe(
      map(response => {
        if (!response.data) {
          this.snackBar.open(
            'Você não tem permissão para acessar esta página.',
            'Fechar',
            { duration: 3000, panelClass: ['snackbar-error'] }
          );
          this.router.navigate(['/dashboard']);
          return false;
        }

        return true;
      }),
      catchError(error => {
        console.error('Erro ao validar permissão de coordenador/admin:', error);
        return of(false);
      })
    );
  }
}
