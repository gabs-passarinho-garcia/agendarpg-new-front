import { ActivityModel } from './activity.model';

export interface EventModelV2 {
  id?: number;
  nome: string;
  local: string;
  inicio: string;
  fim: string;
  creatorUserId?: number;
  atividades?: ActivityModel[];
}

export type CreateEventPayload = Omit<EventModelV2, 'id' | 'atividades'>;
export type UpdateEventPayload = CreateEventPayload;
