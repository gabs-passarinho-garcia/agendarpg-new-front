import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { StateService } from '../state/state.service';
import { UserActivityApiService } from './user-activity-api.service';

describe('UserActivityApiService', () => {
  let service: UserActivityApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        UserActivityApiService,
        {
          provide: StateService,
          useValue: { token: 'mock-token' }
        }
      ]
    });

    service = TestBed.inject(UserActivityApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('deve buscar minhas inscricoes com auth', () => {
    service.myRegistrations().subscribe((response) => {
      expect(response.data.length).toBe(1);
    });

    const req = httpMock.expectOne('http://localhost:8080/api/user-app/activities/my-registrations');
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('Authorization')).toBe('Bearer mock-token');
    req.flush({ statusCode: 200, data: [{ id: 1 }] });
  });

  it('deve buscar minhas criacoes com auth', () => {
    service.myCreations().subscribe((response) => {
      expect(response.data.length).toBe(0);
    });

    const req = httpMock.expectOne('http://localhost:8080/api/user-app/activities/my-creations');
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('Authorization')).toBe('Bearer mock-token');
    req.flush({ statusCode: 200, data: [] });
  });
});
