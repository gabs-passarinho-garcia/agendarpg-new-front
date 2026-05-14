import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { TagEditModalComponent } from './tag-edit-modal.component';

describe('TagEditModalComponent', () => {
  let component: TagEditModalComponent;
  let fixture: ComponentFixture<TagEditModalComponent>;

  const dialogRefSpy = {
    close: jasmine.createSpy('close')
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TagEditModalComponent, NoopAnimationsModule],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { id: 1, nome: 'Dungeons & Dragons' } },
        { provide: MatDialogRef, useValue: dialogRefSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TagEditModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('deve criar o modal', () => {
    expect(component).toBeTruthy();
  });

  it('deve retornar payload ao salvar', () => {
    component.form.patchValue({ tag: 'Pathfinder' });
    component.save();

    expect(dialogRefSpy.close).toHaveBeenCalledWith({ id: 1, tag: 'Pathfinder' });
  });
});
