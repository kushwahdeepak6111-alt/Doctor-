import React from 'react';
import { Baby, Bone, Brain, HeartHandshake, HeartPulse, Sparkles, Stethoscope } from 'lucide-react';
import type { Specialization } from '../types/clinic';

export function SpecializationIcon({
  iconKey,
  className = 'w-5 h-5',
}: {
  iconKey: Specialization['iconKey'];
  className?: string;
}) {
  switch (iconKey) {
    case 'heart':
      return <HeartPulse className={className} aria-hidden="true" />;
    case 'baby':
      return <Baby className={className} aria-hidden="true" />;
    case 'bone':
      return <Bone className={className} aria-hidden="true" />;
    case 'brain':
      return <Brain className={className} aria-hidden="true" />;
    case 'female':
      return <HeartHandshake className={className} aria-hidden="true" />;
    case 'sparkles':
      return <Sparkles className={className} aria-hidden="true" />;
    case 'stethoscope':
    default:
      return <Stethoscope className={className} aria-hidden="true" />;
  }
}
