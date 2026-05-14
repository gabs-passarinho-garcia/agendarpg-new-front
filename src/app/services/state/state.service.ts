import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { UserModel } from '../../models/user';
import { CookieConsentService } from '../cookie-consent/cookie-consent.service';

@Injectable({
  providedIn: 'root'
})
export class StateService {
  private readonly TOKEN_COOKIE = 'auth_token';
  private readonly USER_COOKIE = 'user_data';
  private readonly TOKEN_SESSION = 'session_auth_token';
  private readonly USER_SESSION = 'session_user_data';

  private _isLoggedIn: boolean = false;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private cookieConsentService: CookieConsentService
  ) {
    this.initializeFromCookies();
  }

  private initializeFromCookies(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    let token: string | null = null;
    let userData: UserModel | null = null;

    // Primeiro tenta cookies se permitido
    if (this.cookieConsentService.canUseCookies()) {
      token = this.getTokenFromCookie();
      userData = this.getUserDataFromCookie();
    } else {
      // Fallback para sessionStorage
      token = this.getTokenFromSession();
      userData = this.getUserDataFromSession();
    }

    if (token && userData) {
      this._isLoggedIn = true;
    }
  }

  get isLoggedIn(): boolean {
    return this._isLoggedIn;
  }

  set isLoggedIn(value: boolean) {
    this._isLoggedIn = value;
    if (!value) {
      this.clearCookies();
    }
  }

  get token(): string {
    if (this.cookieConsentService.canUseCookies()) {
      return this.getTokenFromCookie() || '';
    } else {
      return this.getTokenFromSession() || '';
    }
  }

  set token(value: string) {
    if (this.cookieConsentService.canUseCookies()) {
      // Usa cookies se permitido
      if (value) {
        // Cookie expira quando o navegador fechar (session cookie)
        this.setCookie(this.TOKEN_COOKIE, value, {
          secure: location.protocol === 'https:', // Apenas HTTPS em produção
          sameSite: 'strict' // Proteção CSRF
        });
      } else {
        this.deleteCookie(this.TOKEN_COOKIE);
      }
    } else {
      // Fallback para sessionStorage
      this.setTokenInSession(value);
    }
  }

  get userData(): UserModel {
    if (this.cookieConsentService.canUseCookies()) {
      return this.getUserDataFromCookie() || {} as UserModel;
    } else {
      return this.getUserDataFromSession() || {} as UserModel;
    }
  }

  set userData(value: UserModel) {
    if (this.cookieConsentService.canUseCookies()) {
      // Usa cookies se permitido
      if (value && Object.keys(value).length > 0) {
        // Criptografar dados sensíveis antes de salvar
        const encryptedData = this.encryptUserData(value);
        this.setCookie(this.USER_COOKIE, encryptedData, {
          secure: location.protocol === 'https:',
          sameSite: 'strict'
        });
      } else {
        this.deleteCookie(this.USER_COOKIE);
      }
    } else {
      // Fallback para sessionStorage
      this.setUserDataInSession(value);
    }
  }

  private setCookie(name: string, value: string, options: any = {}): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    let cookieString = `${name}=${encodeURIComponent(value)}`;

    if (options.secure) {
      cookieString += '; Secure';
    }

    if (options.sameSite) {
      cookieString += `; SameSite=${options.sameSite}`;
    }

    // Session cookie (sem expires/max-age)
    cookieString += '; Path=/';

    document.cookie = cookieString;
  }

  private getCookie(name: string): string | null {
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

  private deleteCookie(name: string): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  }

  private getTokenFromCookie(): string | null {
    return this.getCookie(this.TOKEN_COOKIE);
  }

  private getUserDataFromCookie(): UserModel | null {
    const encryptedData = this.getCookie(this.USER_COOKIE);
    if (encryptedData) {
      try {
        return this.decryptUserData(encryptedData);
      } catch (error) {
        console.error('Erro ao descriptografar dados do usuário:', error);
        this.clearCookies();
        return null;
      }
    }
    return null;
  }

  private encryptUserData(userData: UserModel): string {
    if (!isPlatformBrowser(this.platformId)) {
      return JSON.stringify(userData);
    }

    // Implementação simples de "criptografia" (Base64)
    // Em produção, use uma biblioteca de criptografia real
    const jsonString = JSON.stringify(userData);
    return btoa(jsonString);
  }

  private decryptUserData(encryptedData: string): UserModel {
    if (!isPlatformBrowser(this.platformId)) {
      return JSON.parse(encryptedData);
    }

    // Descriptografar dados
    const jsonString = atob(encryptedData);
    return JSON.parse(jsonString);
  }

  private clearCookies(): void {
    this.deleteCookie(this.TOKEN_COOKIE);
    this.deleteCookie(this.USER_COOKIE);
  }

  logout(): void {
    this.isLoggedIn = false;
    this.token = '';
    this.userData = {} as UserModel;
    // Limpa tanto cookies quanto sessionStorage por segurança
    this.clearCookies();
    this.clearSessionStorage();
  }

  /**
   * Verifica se cookies estão sendo utilizados
   */
  isUsingCookies(): boolean {
    return this.cookieConsentService.canUseCookies();
  }

  /**
   * Retorna informação sobre o método de armazenamento sendo usado
   */
  getStorageMethod(): string {
    return this.cookieConsentService.canUseCookies() ? 'cookies' : 'sessionStorage';
  }

  // ===== MÉTODOS PARA SESSIONSTORAGE (FALLBACK) =====

  private setTokenInSession(value: string): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    if (value) {
      sessionStorage.setItem(this.TOKEN_SESSION, value);
    } else {
      sessionStorage.removeItem(this.TOKEN_SESSION);
    }
  }

  private getTokenFromSession(): string | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }

    return sessionStorage.getItem(this.TOKEN_SESSION);
  }

  private setUserDataInSession(userData: UserModel): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    if (userData && Object.keys(userData).length > 0) {
      // Criptografar dados mesmo no sessionStorage por segurança
      const encryptedData = this.encryptUserData(userData);
      sessionStorage.setItem(this.USER_SESSION, encryptedData);
    } else {
      sessionStorage.removeItem(this.USER_SESSION);
    }
  }

  private getUserDataFromSession(): UserModel | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }

    const encryptedData = sessionStorage.getItem(this.USER_SESSION);
    if (encryptedData) {
      try {
        return this.decryptUserData(encryptedData);
      } catch (error) {
        console.error('Erro ao descriptografar dados do usuário do sessionStorage:', error);
        this.clearSessionStorage();
        return null;
      }
    }
    return null;
  }

  private clearSessionStorage(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    sessionStorage.removeItem(this.TOKEN_SESSION);
    sessionStorage.removeItem(this.USER_SESSION);
  }
}
