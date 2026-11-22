import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge Tailwind class names, letting later classes win over conflicting earlier ones. */
export function cn(...classValues) {
  return twMerge(clsx(classValues));
}
