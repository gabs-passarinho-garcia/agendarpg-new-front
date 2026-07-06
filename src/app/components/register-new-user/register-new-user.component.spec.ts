import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';

import { RegisterNewUserComponent } from './register-new-user.component';

describe('RegisterNewUserComponent', () => {
  let component: RegisterNewUserComponent;
  let fixture: ComponentFixture<RegisterNewUserComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterNewUserComponent],
      providers: [provideHttpClient(), provideRouter([]), provideNoopAnimations()]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RegisterNewUserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
