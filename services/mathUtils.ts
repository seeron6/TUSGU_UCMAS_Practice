import { MathSequenceItem } from '../types';

const getRandomInt = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const generateSequence = (digits: number, terms: number): { sequence: MathSequenceItem[], expectedAnswer: number } => {
  const sequence: MathSequenceItem[] = [];
  let currentTotal = 0;
  
  const min = Math.pow(10, digits - 1);
  const max = Math.pow(10, digits) - 1;

  // First number is always positive
  let val = getRandomInt(min, max);
  sequence.push({ value: val, operation: '+' });
  currentTotal += val;

  for (let i = 1; i < terms; i++) {
    val = getRandomInt(min, max);
    
    // Simple logic to avoid negative totals for simpler levels if desired, 
    // but allowing standard mental math rules here.
    // Let's decide operation. 
    // If digits > 1, mostly addition to keep it simple or mix. 
    // Let's do a 70% chance of addition, 30% subtraction, ensuring total doesn't go below 0 for basic practice.
    
    let op: '+' | '-' = Math.random() > 0.4 ? '+' : '-';
    
    // Safety check: avoid negative result if that's a requirement (often is for basic mental math)
    if (op === '-' && currentTotal - val < 0) {
      op = '+';
    }

    sequence.push({ value: val, operation: op });
    if (op === '+') currentTotal += val;
    else currentTotal -= val;
  }

  return { sequence, expectedAnswer: currentTotal };
};
