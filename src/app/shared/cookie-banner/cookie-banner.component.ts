import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { Subscription } from 'rxjs';
import { CookieConsentService } from '../../services/cookie-consent/cookie-consent.service';

@Component({
  selector: 'app-cookie-banner',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule
  ],
  templateUrl: './cookie-banner.component.html',
  styleUrls: ['./cookie-banner.component.scss']
})
export class CookieBannerComponent implements OnInit, OnDestroy {
  showBanner = false;
  showDetails = false;
  private subscription?: Subscription;

  constructor(private cookieConsentService: CookieConsentService) {}

  ngOnInit(): void {
    this.subscription = this.cookieConsentService.consent$.subscribe(consent => {
      this.showBanner = consent === null;
    });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  onAccept(): void {
    this.cookieConsentService.setConsent(true);
    this.showBanner = false;
  }

  onReject(): void {
    this.cookieConsentService.setConsent(false);
    this.showBanner = false;

    // Avisa o usuário sobre as limitações
    this.showRejectionWarning();
  }

  private showRejectionWarning(): void {
    // Informação mais amigável sobre a rejeição
    alert('Cookies rejeitados. Você ainda pode usar o site normalmente, mas precisará fazer login a cada nova sessão.');
  }

  toggleDetails(): void {
    this.showDetails = !this.showDetails;
  }
}
