export interface GameResult {
    id: string;
    date: string;
    type: 'listening' | 'flash';
    score: number;
    total: number;
    config: string; // Brief description of difficulty
  }
  
  const STORAGE_KEY = 'tusgu_stats_history';
  
  export const saveGameResult = (result: Omit<GameResult, 'id' | 'date'>) => {
    try {
      const historyStr = localStorage.getItem(STORAGE_KEY);
      const history: GameResult[] = historyStr ? JSON.parse(historyStr) : [];
      
      const newResult: GameResult = {
        ...result,
        id: Date.now().toString(),
        date: new Date().toISOString(),
      };
      
      // Keep last 50 games
      const updatedHistory = [newResult, ...history].slice(0, 50);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
    } catch (e) {
      console.error("Failed to save stats", e);
    }
  };
  
  export const getStats = (): GameResult[] => {
    try {
      const historyStr = localStorage.getItem(STORAGE_KEY);
      return historyStr ? JSON.parse(historyStr) : [];
    } catch (e) {
      return [];
    }
  };
  
  export const clearStats = () => {
      localStorage.removeItem(STORAGE_KEY);
  };
  
  export const getStreak = (): number => {
    const history = getStats();
    if (history.length === 0) return 0;
    
    // Sort by date descending
    const sorted = [...history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    const today = new Date().toDateString();
    let streak = 0;
    let currentDate = new Date();
    
    // Check if played today
    const playedToday = sorted.some(g => new Date(g.date).toDateString() === today);
    if (!playedToday) {
       // If not played today, check if played yesterday to maintain streak
       currentDate.setDate(currentDate.getDate() - 1);
       const playedYesterday = sorted.some(g => new Date(g.date).toDateString() === currentDate.toDateString());
       if (!playedYesterday) return 0;
    }
    
    // Count backwards
    // Reset current date to today or yesterday depending on play status
    currentDate = new Date();
    if (!playedToday) currentDate.setDate(currentDate.getDate() - 1);
    
    while (true) {
      const dateStr = currentDate.toDateString();
      const playedOnDate = sorted.some(g => new Date(g.date).toDateString() === dateStr);
      
      if (playedOnDate) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    return streak;
  };