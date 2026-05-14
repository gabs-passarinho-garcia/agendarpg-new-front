import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';

import { TagManagementComponent } from './tag-management.component';
import { TagApiService } from '../../../services/tag/tag-api.service';

describe('TagManagementComponent', () => {
  let component: TagManagementComponent;
  let fixture: ComponentFixture<TagManagementComponent>;

  const tagApiServiceSpy = jasmine.createSpyObj<TagApiService>('TagApiService', [
    'getTags',
    'createTag',
    'updateTag',
    'deleteTag'
  ]);
  const dialogSpy = jasmine.createSpyObj<MatDialog>('MatDialog', ['open']);

  beforeEach(async () => {
    tagApiServiceSpy.getTags.and.returnValue(of([]));
    tagApiServiceSpy.createTag.and.returnValue(of({}));
    tagApiServiceSpy.updateTag.and.returnValue(of({}));
    tagApiServiceSpy.deleteTag.and.returnValue(of({}));
    dialogSpy.open.and.returnValue({
      afterClosed: () => of(null)
    } as any);

    await TestBed.configureTestingModule({
      imports: [TagManagementComponent, NoopAnimationsModule],
      providers: [
        { provide: TagApiService, useValue: tagApiServiceSpy },
        { provide: MatDialog, useValue: dialogSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TagManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('deve criar o componente', () => {
    expect(component).toBeTruthy();
  });

  it('deve iniciar carregando as tags', () => {
    expect(tagApiServiceSpy.getTags).toHaveBeenCalled();
  });

  it('deve abrir modal ao editar tag', () => {
    component.editTag({ id: 1, nome: 'Dungeons & Dragons' });

    expect(dialogSpy.open).toHaveBeenCalled();
  });
});
