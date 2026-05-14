import { EventModelV2 } from './event.model';

export interface EventsByDate {
  date: string;
  displayDate: string;
  events: EventModelV2[];
  expanded?: boolean;
}
