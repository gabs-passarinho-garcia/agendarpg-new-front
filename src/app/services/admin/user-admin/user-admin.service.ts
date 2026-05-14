import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { StateService } from '../../state/state.service';
import { Observable } from 'rxjs';
import { ResponseModel } from '../../../models/response';
import { UserModel } from '../../../models/user';

export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface UserSearchParams {
  page?: number; // Padrão: 0
  size?: number; // Padrão: 3
  tipos?: string; // Ex: "ADM,CRD" - tipos de usuário separados por vírgula
  menor?: 'S' | 'N'; // Filtro para menores de idade
  sort?: 'nomeCompleto' | 'email' | 'apelido'; // Campo para ordenação. Padrão: 'nomeCompleto'
  dir?: 'asc' | 'desc'; // Direção da ordenação. Padrão: 'asc'
}

@Injectable({
  providedIn: 'root'
})
export class UserAdminService {
  API_URL = environment.apiUrl + `/user`;

  constructor(
      private http: HttpClient,
      private stateService: StateService
  ) { }

  validateUserIsAdmin(): Observable<ResponseModel<boolean>> {
    const token = this.stateService.token;
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.post<ResponseModel<boolean>>(
      `${this.API_URL}/validate-admin`,
      {},
      { headers }
    );
  }

  /**
   * Busca usuários com sistema de paginação e filtros opcionais
   * @param searchParams - Parâmetros de busca e paginação
   * @returns Observable com resposta paginada de usuários
   *
   * Exemplo de uso:
   * searchUsers({
   *   page: 0,
   *   size: 10,
   *   tipos: 'ADM,CRD',
   *   menor: 'N',
   *   sort: 'nomeCompleto',
   *   dir: 'asc'
   * })
   */
  searchUsers(searchParams?: UserSearchParams): Observable<ResponseModel<PagedResponse<UserModel>>> {
    const token = this.stateService.token;
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    // Configurar parâmetros HTTP com valores padrão
    let params = new HttpParams();

    // Paginação com valores padrão
    params = params.set('page', searchParams?.page !== undefined ? searchParams.page.toString() : '0');
    params = params.set('size', searchParams?.size !== undefined ? searchParams.size.toString() : '3');

    if (searchParams) {
      // Filtros opcionais - tipos de usuário (ex: "ADM,CRD")
      if (searchParams.tipos) {
        params = params.set('tipos', searchParams.tipos);
      }

      // Filtro para menores de idade ("S" ou "N")
      if (searchParams.menor) {
        params = params.set('menor', searchParams.menor);
      }

      // Ordenação com valores padrão
      const sort = searchParams.sort || 'nomeCompleto';
      const dir = searchParams.dir || 'asc';
      params = params.set('sort', sort);
      params = params.set('dir', dir);
    } else {
      // Valores padrão se nenhum parâmetro foi fornecido
      params = params.set('sort', 'nomeCompleto');
      params = params.set('dir', 'asc');
    }

    return this.http.get<ResponseModel<PagedResponse<UserModel>>>(
      `${this.API_URL}/search`,
      { headers, params }
    );
  }

  createUser(userData: UserModel): Observable<ResponseModel<UserModel>> {
    const token = this.stateService.token;
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.post<ResponseModel<UserModel>>(
      `${this.API_URL}`,
      userData,
      { headers }
    );
  }

  updateUser(userData: UserModel): Observable<ResponseModel<UserModel>> {
    const token = this.stateService.token;
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.put<ResponseModel<UserModel>>(
      `${this.API_URL}/${userData.id}`,
      userData,
      { headers }
    );
  }

  deleteUser(userId: number): Observable<ResponseModel<void>> {
    const token = this.stateService.token;
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.delete<ResponseModel<void>>(
      `${this.API_URL}/${userId}`,
      { headers }
    );
  }

}
