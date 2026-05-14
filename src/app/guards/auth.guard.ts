import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { StateService } from '../services/state/state.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private stateService: StateService,
    private router: Router
  ) {}

  canActivate(): boolean {
    if (this.stateService.isLoggedIn && this.stateService.token) {
      return true;
    }

    console.error('Usuário não autenticado, redirecionando para login');
    this.router.navigate(['/login']);
    return false;
  }
}
