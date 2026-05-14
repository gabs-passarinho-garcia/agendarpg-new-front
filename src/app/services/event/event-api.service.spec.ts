import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { EventApiService } from './event-api.service';
import { StateService } from '../state/state.service';

describe('EventApiService', () => {
  let service: EventApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        EventApiService,
        {
          provide: StateService,
          useValue: { token: 'mock-token' }
        }
      ]
    });

    service = TestBed.inject(EventApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('deve buscar eventos publicos', () => {
    service.getEvents().subscribe((response) => {
      expect(response.data.length).toBe(1);
      expect(response.data[0].nome).toBe('Evento Teste');
    });

    const req = httpMock.expectOne('http://localhost:8080/api/events');
    expect(req.request.method).toBe('GET');
    req.flush({
      statusCode: 200,
      statusMessage: 'OK',
      data: [
        {
          id: 1,
          nome: 'Evento Teste',
          local: 'Local',
          inicio: '2026-12-01T10:00:00',
          fim: '2026-12-01T12:00:00',
          atividades: []
        }
      ]
    });
  });

  it('deve enviar token ao criar evento', () => {
    service.createEvent({
      nome: 'Novo',
      local: 'Centro',
      inicio: '2026-12-01T10:00:00',
      fim: '2026-12-01T12:00:00'
    }).subscribe();

    const req = httpMock.expectOne('http://localhost:8080/api/events');
    expect(req.request.method).toBe('POST');
    expect(req.request.headers.get('Authorization')).toBe('Bearer mock-token');
    req.flush({ statusCode: 201, data: {} });
  });

  it('deve buscar eventos criados com token', () => {
    service.myCreatedEvents().subscribe((response) => {
      expect(response.statusCode).toBe(200);
      expect(response.data.length).toBe(1);
      expect(response.data[0].nome).toBe('Evento Criado');
    });

    const req = httpMock.expectOne('http://localhost:8080/api/events/my-created');
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('Authorization')).toBe('Bearer mock-token');
    req.flush({
      statusCode: 200,
      statusMessage: 'OK',
      data: [
        {
          id: 5,
          nome: 'Evento Criado',
          local: 'Biblioteca',
          inicio: '2026-05-17T15:00:00',
          fim: '2026-05-17T18:00:00',
          creatorUserId: 1,
          atividades: []
        }
      ]
    });
  });
});
