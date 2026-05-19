import { Pipe, PipeTransform } from '@angular/core';
import { ActivityType } from '../models/activity-type.enum';

@Pipe({
  name: 'activityTypeLabel',
  standalone: true
})
export class ActivityTypeLabelPipe implements PipeTransform {
  private readonly labels: Record<ActivityType, string> = {
    [ActivityType.RPG_MESA]: 'Mesa de RPG',
    [ActivityType.WORKSHOP]: 'Workshop'
  };

  transform(type: ActivityType | string): string {
    if (!type) {
      return '';
    }
    return this.labels[type as ActivityType] || String(type);
  }
}
