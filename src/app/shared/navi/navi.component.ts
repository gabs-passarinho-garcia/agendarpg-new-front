import { Component, ViewChild }     from '@angular/core';
import { CommonModule }             from '@angular/common';
import { MatSidenav }               from '@angular/material/sidenav';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable, map, take }    from 'rxjs';
import { Router, RouterModule }     from '@angular/router';
import { StateService }             from '../../services/state/state.service';
import { CookieConsentService }     from '../../services/cookie-consent/cookie-consent.service';

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule }    from '@angular/material/icon';
import { MatListModule }    from '@angular/material/list';
import { MatButtonModule }  from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';

@Component({
  selector: 'app-navi',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatSidenavModule,
    MatIconModule,
    MatListModule,
    MatButtonModule,
    MatExpansionModule
  ],
  templateUrl: './navi.component.html',
  styleUrls: ['./navi.component.scss']
})
export class NaviComponent {
  @ViewChild('drawer') drawer!: MatSidenav;
  isHandset$: Observable<boolean> = this.breakpointObserver
    .observe(Breakpoints.Handset)
    .pipe(map(res => res.matches));

  constructor(
    private breakpointObserver: BreakpointObserver,
    private stateService: StateService,
    private router: Router,
    private cookieConsentService: CookieConsentService
  ) {}

  get isLoggedIn(): boolean {
    return this.stateService.isLoggedIn;
  }

  get userName(): string {
    return this.stateService.userData?.apelido || this.stateService.userData?.nomeCompleto || '';
  }

  get userType(): string {
    return this.stateService.userData?.tipo || '';
  }

  get canCreateEvents(): boolean {
    const allowedTypes = ['CRD', 'ADM'];
    return this.isLoggedIn && allowedTypes.includes(this.userType);
  }

  get canCreateActivities(): boolean {
    const allowedTypes = ['NRD', 'CRD', 'ADM'];
    return this.isLoggedIn && allowedTypes.includes(this.userType);
  }

  get isAdmin(): boolean {
    const adminTypes = ['CRD', 'ADM'];
    return this.isLoggedIn && adminTypes.includes(this.userType);
  }

  onLinkClick(): void {
    this.isHandset$.pipe(take(1)).subscribe(isHandset => {
      if (isHandset) this.drawer.close();
    });
  }

  logout(): void {
    this.stateService.logout();
    this.onLinkClick();
    this.router.navigate(['/login']);
  }

  resetCookieConsent(): void {
    this.cookieConsentService.resetConsent();
    this.onLinkClick();
    // Recarrega a página para mostrar o banner novamente
    window.location.reload();
  }
}
