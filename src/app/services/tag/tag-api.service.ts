import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ResponseModel } from '../../models/response';
import { TagModel } from '../../models/tag.model';
import { StateService } from '../state/state.service';

export interface TagUpsertPayload {
  id?: string | number;
  tag: string;
}

@Injectable({
  providedIn: 'root'
})
export class TagApiService {
  private readonly API_URL = `${environment.apiUrl}/tags`;

  constructor(
    private readonly http: HttpClient,
    private readonly stateService: StateService
  ) {}

  getTags(): Observable<TagModel[]> {
    return this.http.get<unknown>(this.API_URL, {
      headers: this.getAuthHeaders()
    }).pipe(
      map((response) => this.normalizeTagsResponse(response))
    );
  }

  createTag(payload: TagUpsertPayload): Observable<unknown> {
    return this.http.post<unknown>(this.API_URL, payload, {
      headers: this.getAuthHeaders()
    });
  }

  updateTag(payload: TagUpsertPayload): Observable<unknown> {
    return this.http.put<unknown>(this.API_URL, payload, {
      headers: this.getAuthHeaders()
    });
  }

  deleteTag(tagId: string | number): Observable<unknown> {
    return this.http.delete<unknown>(`${this.API_URL}/${tagId}`, {
      headers: this.getAuthHeaders()
    });
  }

  private normalizeTagsResponse(response: unknown): TagModel[] {
    if (Array.isArray(response)) {
      return this.mapTags(response);
    }

    const envelope = response as ResponseModel<unknown>;
    if (!envelope) {
      return [];
    }

    if (Array.isArray(envelope.data)) {
      return this.mapTags(envelope.data);
    }

    const dataObject = envelope.data as Record<string, unknown> | undefined;
    if (dataObject && Array.isArray(dataObject['content'])) {
      return this.mapTags(dataObject['content'] as unknown[]);
    }

    const responseObject = response as Record<string, unknown>;
    if (responseObject && Array.isArray(responseObject['content'])) {
      return this.mapTags(responseObject['content'] as unknown[]);
    }

    return [];
  }

  private mapTags(rawTags: unknown[]): TagModel[] {
    return rawTags
      .map((item) => {
        const tag = item as Record<string, unknown>;
        const id = tag['id'];
        const nome = tag['nome'];
        const tagName = tag['tag'];
        const resolvedName = typeof nome === 'string' ? nome : tagName;
        const hasValidId = typeof id === 'number' || typeof id === 'string';

        if (!hasValidId || typeof resolvedName !== 'string') {
          return null;
        }

        return {
          id,
          nome: resolvedName,
          descricao: typeof tag['descricao'] === 'string' ? tag['descricao'] : null,
          cor: typeof tag['cor'] === 'string' ? tag['cor'] : null
        } as TagModel;
      })
      .filter((tag): tag is TagModel => tag !== null);
  }

  private getAuthHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${this.stateService.token}`
    });
  }
}
