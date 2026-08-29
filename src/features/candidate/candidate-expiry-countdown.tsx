import { useEffect, useState } from 'react';

import { AppText } from '@/components/ui';
import { developmentCopy } from '@/constants/development-copy';

type CandidateExpiryCountdownProps = {
  expiresAt: string;
  serverTime: string;
};

export function getCandidateRemainingSeconds(expiresAt: string, serverTime: string, elapsedMs = 0) {
  const expiry = Date.parse(expiresAt);
  const serverNow = Date.parse(serverTime);
  if (!Number.isFinite(expiry) || !Number.isFinite(serverNow) || !Number.isFinite(elapsedMs)) return null;
  return Math.max(0, Math.ceil((expiry - serverNow - Math.max(0, elapsedMs)) / 1000));
}

export function formatCandidateRemainingTime(seconds: number) {
  if (seconds <= 0) return developmentCopy.candidate.mayBeExpired;
  if (seconds < 60) return `${developmentCopy.candidate.expiresIn} ${developmentCopy.candidate.lessThanMinute}`;
  const minutes = Math.ceil(seconds / 60);
  const unit = minutes === 1 ? developmentCopy.candidate.minute : developmentCopy.candidate.minutes;
  return `${developmentCopy.candidate.expiresIn} ${minutes} ${unit}`;
}

export function advanceCandidateElapsed(previousMs: number, observedAtMs: number, currentMs: number) {
  return Math.max(previousMs, Math.max(0, currentMs - observedAtMs));
}

export function CandidateExpiryCountdown({ expiresAt, serverTime }: CandidateExpiryCountdownProps) {
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    const observedAt = Date.now();
    const timer = setInterval(() => {
      setElapsedMs((previous) => advanceCandidateElapsed(previous, observedAt, Date.now()));
    }, 30_000);
    return () => clearInterval(timer);
  }, []);

  const remaining = getCandidateRemainingSeconds(expiresAt, serverTime, elapsedMs);
  if (remaining === null) return null;
  const label = formatCandidateRemainingTime(remaining);

  // This is display-only. Accept/reroll always relies on the authoritative server response.
  return <AppText accessibilityLabel={label} tone="secondary" variant="label">{label}</AppText>;
}
