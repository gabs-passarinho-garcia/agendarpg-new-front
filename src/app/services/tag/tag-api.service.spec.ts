import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { StateService } from '../state/state.service';
import { TagApiService } from './tag-api.service';

describe('TagApiService', () => {
  let service: TagApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        TagApiService,
        {
          provide: StateService,
          useValue: { token: 'mock-token' }
        }
      ]
    });

    service = TestBed.inject(TagApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('deve buscar tags com resposta em envelope', () => {
    service.getTags().subscribe((tags) => {
      expect(tags.length).toBe(2);
      expect(tags[0].nome).toBe('fantasia');
    });

    const req = httpMock.expectOne('http://localhost:8080/api/tags');
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('Authorization')).toBe('Bearer mock-token');

    req.flush({
      statusCode: 200,
      data: [
        { id: 1, nome: 'fantasia' },
        { id: 2, nome: 'aventura' }
      ]
    });
  });

  it('deve mapear campo tag quando nome nao estiver presente', () => {
    service.getTags().subscribe((tags) => {
      expect(tags.length).toBe(2);
      expect(tags[0].nome).toBe('Dungeons & Dragons');
      expect(tags[1].nome).toBe('Pathfinder');
    });

    const req = httpMock.expectOne('http://localhost:8080/api/tags');
    expect(req.request.method).toBe('GET');

    req.flush({
      statusCode: 200,
      statusMessage: 'OK',
      data: [
        { id: 1, tag: 'Dungeons & Dragons' },
        { id: 2, tag: 'Pathfinder' }
      ]
    });
  });

  it('deve buscar tags com resposta em array puro', () => {
    service.getTags().subscribe((tags) => {
      expect(tags.length).toBe(1);
      expect(tags[0].id).toBe(10);
      expect(tags[0].nome).toBe('horror');
    });

    const req = httpMock.expectOne('http://localhost:8080/api/tags');
    expect(req.request.method).toBe('GET');

    req.flush([
      { id: 10, nome: 'horror' }
    ]);
  });

  it('deve retornar lista vazia para payload inválido', () => {
    service.getTags().subscribe((tags) => {
      expect(tags).toEqual([]);
    });

    const req = httpMock.expectOne('http://localhost:8080/api/tags');
    expect(req.request.method).toBe('GET');

    req.flush({ statusCode: 200, data: { invalid: true } });
  });
});
