/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { UserAdminService } from './user-admin.service';

describe('Service: UserAdmin', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [UserAdminService]
    });
  });

  it('should ...', inject([UserAdminService], (service: UserAdminService) => {
    expect(service).toBeTruthy();
  }));
});
