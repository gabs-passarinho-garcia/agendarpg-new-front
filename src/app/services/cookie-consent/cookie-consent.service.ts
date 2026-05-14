import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CookieConsentService {
  private readonly CONSENT_COOKIE = 'cookie_consent';
  private readonly CONSENT_DATE_COOKIE = 'cookie_consent_date';
  
  private consentSubject = new BehaviorSubject<boolean | null>(null);
  public consent$ = this.consentSubject.asObservable();

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.initializeConsent();
  }

  private initializeConsent(): void {
    const consent = this.getConsent();
    this.consentSubject.next(consent);
  }

  /**
   * Verifica se o usuário já deu consentimento para cookies
   */
  getConsent(): boolean | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }

    const consent = this.getBasicCookie(this.CONSENT_COOKIE);
    if (consent === null) {
      return null; // Nunca foi perguntado
    }
    return consent === 'true';
  }

  /**
   * Define o consentimento do usuário
   */
  setConsent(accepted: boolean): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    // Salva o consentimento usando apenas cookies essenciais
    this.setBasicCookie(this.CONSENT_COOKIE, accepted.toString());
    this.setBasicCookie(this.CONSENT_DATE_COOKIE, new Date().toISOString());
    
    this.consentSubject.next(accepted);

    // Se rejeitou, limpa todos os cookies não essenciais
    if (!accepted) {
      this.clearNonEssentialCookies();
    }
  }

  /**
   * Verifica se podemos usar cookies funcionais/analíticos
   */
  canUseCookies(): boolean {
    const consent = this.getConsent();
    return consent === true;
  }

  /**
   * Verifica se o banner deve ser mostrado
   */
  shouldShowBanner(): boolean {
    return this.getConsent() === null;
  }

  /**
   * Remove o consentimento (para testes ou reset)
   */
  resetConsent(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.deleteBasicCookie(this.CONSENT_COOKIE);
    this.deleteBasicCookie(this.CONSENT_DATE_COOKIE);
    this.clearNonEssentialCookies();
    this.consentSubject.next(null);
  }

  /**
   * Métodos para cookies básicos (sempre permitidos para funcionamento essencial)
   */
  private setBasicCookie(name: string, value: string): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    // Cookie essencial com 1 ano de validade
    const expirationDate = new Date();
    expirationDate.setFullYear(expirationDate.getFullYear() + 1);
    
    let cookieString = `${name}=${encodeURIComponent(value)}`;
    cookieString += `; expires=${expirationDate.toUTCString()}`;
    cookieString += '; Path=/';
    cookieString += '; SameSite=strict';
    
    if (location.protocol === 'https:') {
      cookieString += '; Secure';
    }

    document.cookie = cookieString;
  }

  private getBasicCookie(name: string): string | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }

    const nameEQ = name + '=';
    const ca = document.cookie.split(';');

    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) {
        return decodeURIComponent(c.substring(nameEQ.length, c.length));
      }
    }
    return null;
  }

  private deleteBasicCookie(name: string): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  }

  /**
   * Remove todos os cookies não essenciais
   */
  private clearNonEssentialCookies(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    // Lista de cookies não essenciais que devem ser removidos se o usuário rejeitar
    const nonEssentialCookies = [
      'auth_token',
      'user_data'
      // Adicione outros cookies não essenciais aqui
    ];

    nonEssentialCookies.forEach(cookieName => {
      this.deleteBasicCookie(cookieName);
    });
  }

  /**
   * Obtém informações sobre o consentimento
   */
  getConsentInfo(): { consent: boolean | null, date: string | null } {
    const consent = this.getConsent();
    const dateStr = this.getBasicCookie(this.CONSENT_DATE_COOKIE);
    
    return {
      consent,
      date: dateStr
    };
  }
}
