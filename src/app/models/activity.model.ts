import { ActivityType } from './activity-type.enum';

export interface ActivityModel {
  id?: number;
  eventoId: number;
  tipo: ActivityType;
  nome: string;
  descricao: string;
  inicio: string;
  fim: string;
  localComplemento: string;
  sistema?: string | null;
  numeroVagas?: number | null;
  tags?: string[] | null;
  narradorId?: string | number | null;
  tema?: string | null;
  palestranteId?: number | null;
  participantes?: number[] | null;
}

export type CreateActivityPayload = Omit<ActivityModel, 'id' | 'eventoId' | 'participantes'>;
export type UpdateActivityPayload = CreateActivityPayload;
