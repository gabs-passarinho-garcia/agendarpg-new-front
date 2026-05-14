import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { delay, map, catchError } from 'rxjs/operators';
import { StateService } from '../services/state/state.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UserAdminService } from '../services/admin/user-admin/user-admin.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  constructor(
    private stateService: StateService,
    private router: Router,
    private snackBar: MatSnackBar,
    private userAdminService: UserAdminService
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    // Verificar se o usuário está logado
    if (!this.stateService.isLoggedIn) {
      this.snackBar.open(
        'Você precisa estar logado para acessar esta página.',
        'Fechar',
        { duration: 3000, panelClass: ['snackbar-error'] }
      );
      this.router.navigate(['/login']);
      return of(false);
    }

    // Mock de validação de permissão com delay
    // Aqui você substituirá pelo endpoint real da API
    return this.validateAdminPermission().pipe(
      map(isAdmin => {
        if (!isAdmin) {
          this.snackBar.open(
            'Você não tem permissão para acessar esta página.',
            'Fechar',
            { duration: 3000, panelClass: ['snackbar-error'] }
          );
          this.router.navigate(['/dashboard']);
          return false;
        }
        return true;
      })
    );
  }

  /**
   * Validação de permissão de administrador via API
   */
  private validateAdminPermission(): Observable<boolean> {
    return this.userAdminService.validateUserIsAdmin().pipe(
      map(response => response.data || false),
      catchError(error => {
        console.error('Erro ao validar permissão de admin:', error);
        // Em caso de erro, nega o acesso
        return of(false);
      })
    );
  }
}
