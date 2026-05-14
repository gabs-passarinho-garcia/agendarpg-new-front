import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { StateService } from '../services/state/state.service';

@Injectable({
  providedIn: 'root'
})
export class ActivityCreationGuard implements CanActivate {
  private readonly allowedRoles = ['NRD', 'CRD', 'ADM'];

  constructor(
    private readonly stateService: StateService,
    private readonly router: Router,
    private readonly snackBar: MatSnackBar
  ) {}

  canActivate(): boolean {
    if (!this.stateService.isLoggedIn) {
      this.snackBar.open('Você precisa estar logado para criar atividades.', 'Fechar', {
        duration: 3000,
        panelClass: ['snackbar-error']
      });
      this.router.navigate(['/login']);
      return false;
    }

    const userType = this.stateService.userData?.tipo || '';
    if (!this.allowedRoles.includes(userType)) {
      this.snackBar.open('Seu perfil não possui permissão para criar atividades.', 'Fechar', {
        duration: 3500,
        panelClass: ['snackbar-error']
      });
      this.router.navigate(['/dashboard']);
      return false;
    }

    return true;
  }
}
