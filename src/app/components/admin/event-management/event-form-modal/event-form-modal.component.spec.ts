import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { EventFormModalComponent } from './event-form-modal.component';

describe('EventFormModalComponent', () => {
  let component: EventFormModalComponent;
  let fixture: ComponentFixture<EventFormModalComponent>;

  const dialogRefSpy = {
    close: jasmine.createSpy('close')
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventFormModalComponent, NoopAnimationsModule],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { event: null } },
        { provide: MatDialogRef, useValue: dialogRefSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EventFormModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('deve criar o modal', () => {
    expect(component).toBeTruthy();
  });

  it('deve fechar ao cancelar', () => {
    component.close();
    expect(dialogRefSpy.close).toHaveBeenCalledWith(null);
  });
});
