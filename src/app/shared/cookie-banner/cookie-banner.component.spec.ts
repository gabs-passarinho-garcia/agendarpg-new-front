import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { BehaviorSubject } from 'rxjs';
import { CookieBannerComponent } from './cookie-banner.component';
import { CookieConsentService } from '../../services/cookie-consent/cookie-consent.service';
import { PLATFORM_ID } from '@angular/core';

describe('CookieBannerComponent', () => {
  let component: CookieBannerComponent;
  let fixture: ComponentFixture<CookieBannerComponent>;
  let cookieConsentService: jasmine.SpyObj<CookieConsentService>;
  let consentSubject: BehaviorSubject<boolean | null | undefined>;

  beforeEach(async () => {
    consentSubject = new BehaviorSubject<boolean | null | undefined>(undefined);
    const spy = jasmine.createSpyObj('CookieConsentService', [
      'setConsent'
    ]);
    Object.defineProperty(spy, 'consent$', {
      value: consentSubject.asObservable()
    });

    await TestBed.configureTestingModule({
      imports: [
        CookieBannerComponent,
        NoopAnimationsModule
      ],
      providers: [
        { provide: CookieConsentService, useValue: spy },
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CookieBannerComponent);
    component = fixture.componentInstance;
    cookieConsentService = TestBed.inject(CookieConsentService) as jasmine.SpyObj<CookieConsentService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show banner when consent is needed', () => {
    consentSubject.next(null);
    component.ngOnInit();
    expect(component.showBanner).toBe(true);
  });

  it('should not show banner when consent is already given', () => {
    consentSubject.next(true);
    component.ngOnInit();
    expect(component.showBanner).toBe(false);
  });

  it('should show banner again when consent is reset', () => {
    consentSubject.next(true);
    component.ngOnInit();

    consentSubject.next(null);

    expect(component.showBanner).toBe(true);
  });

  it('should keep banner hidden until consent is resolved', () => {
    component.ngOnInit();

    expect(component.showBanner).toBe(false);
  });

  it('should accept cookies and hide banner', () => {
    component.showBanner = true;
    component.onAccept();

    expect(cookieConsentService.setConsent).toHaveBeenCalledWith(true);
    expect(component.showBanner).toBe(false);
  });

  it('should reject cookies and hide banner', () => {
    component.showBanner = true;
    spyOn(window, 'alert'); // Mock alert

    component.onReject();

    expect(cookieConsentService.setConsent).toHaveBeenCalledWith(false);
    expect(component.showBanner).toBe(false);
    expect(window.alert).toHaveBeenCalled();
  });
});
