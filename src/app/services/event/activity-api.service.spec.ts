import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivityApiService } from './activity-api.service';
import { StateService } from '../state/state.service';

describe('ActivityApiService', () => {
  let service: ActivityApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ActivityApiService,
        {
          provide: StateService,
          useValue: { token: 'mock-token' }
        }
      ]
    });

    service = TestBed.inject(ActivityApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('deve buscar atividades por evento sem auth', () => {
    service.getByEvent(1).subscribe((response) => {
      expect(response.data.length).toBe(1);
    });

    const req = httpMock.expectOne('http://localhost:8080/api/events/1/activities');
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({ statusCode: 200, data: [{ id: 1, eventoId: 1, tipo: 'RPG_MESA', nome: 'Mesa', descricao: 'Desc', inicio: '2026-01-01T10:00:00', fim: '2026-01-01T12:00:00', localComplemento: 'Sala' }] });
  });

  it('deve enviar token ao inscrever em atividade', () => {
    service.register(7).subscribe();

    const req = httpMock.expectOne('http://localhost:8080/api/activities/7/register');
    expect(req.request.method).toBe('POST');
    expect(req.request.headers.get('Authorization')).toBe('Bearer mock-token');
    req.flush({ statusCode: 200, data: {} });
  });
});
