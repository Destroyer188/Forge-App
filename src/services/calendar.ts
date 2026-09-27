import * as Calendar from 'expo-calendar/legacy';
import { GymTemplate } from '../types';

export async function exportGymTemplateToCalendar(template: GymTemplate) {
  const permission = await Calendar.requestCalendarPermissionsAsync();
  if (permission.status !== 'granted') throw new Error('Calendar permission was denied.');
  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  let calendar = calendars.find(c => c.allowsModifications && c.isPrimary) ?? calendars.find(c => c.allowsModifications);
  if (!calendar) {
    const defaultSource = calendars.find(c => c.source?.type === 'com.apple')?.source ?? { name: 'Forge', type: 'local', isLocalAccount: true };
    const id = await Calendar.createCalendarAsync({ title: 'Forge Training', color: '#111111', entityType: Calendar.EntityTypes.EVENT, sourceId: defaultSource.id, source: defaultSource as any, name: 'Forge Training', ownerAccount: 'Forge' } as any);
    calendar = { id } as any;
  }
  for (const day of template.days) {
    if (day.rest) continue;
    const now = new Date(); const delta = (day.dayOfWeek - now.getDay() + 7) % 7 || 7; const start = new Date(now); start.setDate(start.getDate() + delta); start.setHours(18, 0, 0, 0); const end = new Date(start); end.setMinutes(18 + 60);
    await Calendar.createEventAsync(calendar.id, { title: `Forge — ${day.name}`, startDate: start, endDate: end, notes: `${template.name}\n${day.exercises.map(e => `${e.name}: ${e.sets} × ${e.reps}`).join('\n')}`, alarms: [{ relativeOffset: -30 }] });
  }
}
