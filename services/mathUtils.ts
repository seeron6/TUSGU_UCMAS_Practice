
import { MathSequenceItem } from '../types';

const getRandomInt = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const generateSequence = (digits: number, terms: number, onlyPositive: boolean = false): { sequence: MathSequenceItem[], expectedAnswer: number } => {
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
    
    let op: '+' | '-';

    if (onlyPositive) {
      op = '+';
    } else {
      // Standard mixed mode
      // 70% chance of addition, 30% subtraction
      op = Math.random() > 0.4 ? '+' : '-';
      
      // Safety check: avoid negative result for basic practice
      if (op === '-' && currentTotal - val < 0) {
        op = '+';
      }
    }

    sequence.push({ value: val, operation: op });
    if (op === '+') currentTotal += val;
    else currentTotal -= val;
  }

  return { sequence, expectedAnswer: currentTotal };
};
