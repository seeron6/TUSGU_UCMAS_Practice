import { LocalNotifications } from '@capacitor/local-notifications';

export type Frequency = 'day' | 'week' | 'month';

export const scheduleReminders = async (frequency: Frequency, count: number) => {
  try {
    // 1. Request permission
    const perm = await LocalNotifications.requestPermissions();
    if (perm.display !== 'granted') return false;

    // 2. Clear existing notifications
    try {
      const pending = await LocalNotifications.getPending();
      if (pending.notifications.length > 0) {
          await LocalNotifications.cancel({ notifications: pending.notifications });
      }
    } catch (err) {
      console.warn('Error clearing pending notifications:', err);
    }

    const notifications = [];
    // CAUTION: Do not use 'extra: null', it can crash Android serialization. Use undefined.
    const baseContent = {
      title: "Time to Practice!",
      body: "Keep your mental math skills sharp. Do a quick 5-minute session now.",
      sound: undefined,
      attachments: undefined,
      actionTypeId: "",
    };

    // 3. Scheduling Logic
    if (frequency === 'day') {
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
      const days = [];
      if (count === 1) days.push(4);
      else if (count === 2) days.push(3, 7);
      else if (count === 3) days.push(2, 4, 6);
      else if (count >= 4) days.push(2, 3, 5, 6); 
      else days.push(2, 3, 4, 5, 6); 

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
    // @ts-ignore
    await LocalNotifications.schedule({ notifications });

    return true;
  } catch (error) {
    console.error("Failed to schedule notifications:", error);
    return false;
  }
};

export const cancelReminders = async () => {
  try {
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel({ notifications: pending.notifications });
    }
  } catch (error) {
    console.error("Failed to cancel notifications:", error);
  }
};

export const checkReminderStatus = async () => {
  try {
    const pending = await LocalNotifications.getPending();
    return pending.notifications.length > 0;
  } catch (error) {
    console.error("Failed to check reminder status:", error);
    return false;
  }
};