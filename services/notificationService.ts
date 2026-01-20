import { LocalNotifications } from '@capacitor/local-notifications';

export type Frequency = 'day' | 'week' | 'month';

// Helper to generate IDs
const generateIds = (count: number) => Array.from({ length: count }, (_, i) => i + 1);

export const scheduleReminders = async (frequency: Frequency, count: number) => {
  // 1. Request permission
  const perm = await LocalNotifications.requestPermissions();
  if (perm.display !== 'granted') return false;

  // 2. Clear existing notifications (Clearing IDs 1-50 to be safe)
  const pending = await LocalNotifications.getPending();
  if (pending.notifications.length > 0) {
      await LocalNotifications.cancel({ notifications: pending.notifications });
  }

  const notifications = [];
  const baseContent = {
    title: "Time to Practice!",
    body: "Keep your mental math skills sharp. Do a quick 5-minute session now.",
    sound: undefined,
    attachments: undefined,
    actionTypeId: "",
    extra: null
  };

  // 3. Scheduling Logic
  if (frequency === 'day') {
    // Spread 'count' times between 9:00 AM (9) and 8:00 PM (20)
    // Available hours = 11. 
    // If count is 1: 5 PM
    // If count is 2: 10 AM, 6 PM
    // If count is 3: 9 AM, 1 PM, 5 PM
    
    const startHour = 9;
    const endHour = 20;
    const interval = count > 1 ? (endHour - startHour) / (count - 1) : 0;

    for (let i = 0; i < count; i++) {
      const hour = count === 1 ? 17 : Math.round(startHour + (i * interval));
      notifications.push({
        ...baseContent,
        id: i + 1,
        schedule: { 
          every: 'day', 
          on: { hour: hour, minute: 0 } 
        }
      });
    }

  } else if (frequency === 'week') {
    // Spread 'count' times across the week (1 = Sunday, 7 = Saturday)
    // If count 1: Wednesday (4)
    // If count 2: Tuesday (3), Saturday (7)
    // If count 3: Mon (2), Wed (4), Fri (6)
    
    const days = [];
    if (count === 1) days.push(4);
    else if (count === 2) days.push(3, 7);
    else if (count === 3) days.push(2, 4, 6);
    else if (count >= 4) days.push(2, 3, 5, 6); // Just an example distribution
    else days.push(2, 3, 4, 5, 6); // 5+ times

    // Cap at 7
    const actualDays = days.slice(0, count);

    actualDays.forEach((dayOfWeek, idx) => {
      notifications.push({
        ...baseContent,
        id: idx + 1,
        schedule: { 
          every: 'week', 
          on: { weekday: dayOfWeek, hour: 17, minute: 0 } 
        }
      });
    });

  } else if (frequency === 'month') {
    // Spread 'count' times across the month
    // If count 1: 15th
    // If count 2: 10th, 20th
    // If count 3: 5th, 15th, 25th
    
    const dates = [];
    if (count === 1) dates.push(15);
    else if (count === 2) dates.push(10, 20);
    else if (count === 3) dates.push(5, 15, 25);
    else dates.push(1, 8, 15, 22);

    const actualDates = dates.slice(0, count);

    actualDates.forEach((date, idx) => {
       notifications.push({
        ...baseContent,
        id: idx + 1,
        schedule: { 
          every: 'month', 
          on: { day: date, hour: 17, minute: 0 } 
        }
       });
    });
  }

  // 4. Schedule Batch
  // @ts-ignore - The Capacitor types can be finicky with complex schedules, but passing the array works
  await LocalNotifications.schedule({ notifications });

  return true;
};

export const cancelReminders = async () => {
  const pending = await LocalNotifications.getPending();
  if (pending.notifications.length > 0) {
    await LocalNotifications.cancel({ notifications: pending.notifications });
  }
};

export const checkReminderStatus = async () => {
    const pending = await LocalNotifications.getPending();
    return pending.notifications.length > 0;
};