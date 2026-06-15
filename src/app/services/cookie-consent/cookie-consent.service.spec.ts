import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';

import { CookieConsentService } from './cookie-consent.service';

describe('CookieConsentService', () => {
  let service: CookieConsentService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    });
    service = TestBed.inject(CookieConsentService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return null for consent when no consent is given', () => {
    // Reset any existing consent
    service.resetConsent();
    expect(service.getConsent()).toBeNull();
  });

  it('should return true when consent is accepted', () => {
    service.setConsent(true);
    expect(service.getConsent()).toBe(true);
  });

  it('should return false when consent is rejected', () => {
    service.setConsent(false);
    expect(service.getConsent()).toBe(false);
  });

  it('should show banner when consent is null', () => {
    service.resetConsent();
    expect(service.shouldShowBanner()).toBe(true);
  });

  it('should not show banner when consent is given', () => {
    service.setConsent(true);
    expect(service.shouldShowBanner()).toBe(false);
  });

  it('should allow cookies when consent is true', () => {
    service.setConsent(true);
    expect(service.canUseCookies()).toBe(true);
  });

  it('should not allow cookies when consent is false', () => {
    service.setConsent(false);
    expect(service.canUseCookies()).toBe(false);
  });

  it('should keep functional cookies when only resetting consent', () => {
    document.cookie = 'auth_token=test-token; path=/;';

    service.resetConsent();

    expect(document.cookie).toContain('auth_token=test-token');

    document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  });

  it('should not show banner during server-side rendering', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'server' }
      ]
    });

    const serverService = TestBed.inject(CookieConsentService);

    expect(serverService.shouldShowBanner()).toBe(false);
  });
});
