import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HourSelecterComponent } from './hour-selecter.component';

describe('HourSelecterComponent', () => {
  let component: HourSelecterComponent;
  let fixture: ComponentFixture<HourSelecterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HourSelecterComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(HourSelecterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
