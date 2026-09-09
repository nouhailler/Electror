'use client';

import * as React from 'react';
import { ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';

export type ChartConfig = Record<
  string,
  { label?: React.ReactNode; color?: string }
>;

const INITIAL_DIMENSION = { width: 320, height: 200 } as const;

export function ChartContainer({
  className,
  children,
  config,
  initialDimension = INITIAL_DIMENSION,
  style,
  ...props
}: React.ComponentProps<'div'> & {
  config: ChartConfig;
  children: React.ComponentProps<typeof ResponsiveContainer>['children'];
  initialDimension?: { width: number; height: number };
}) {
  const colorVariables = Object.fromEntries(
    Object.entries(config)
      .filter(([, item]) => item.color)
      .map(([key, item]) => [`--color-${key}`, item.color]),
  ) as React.CSSProperties;

  return (
    <div
      data-slot="chart"
      className={cn(
        "flex justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-layer]:outline-hidden [&_.recharts-surface]:outline-hidden",
        className,
      )}
      style={{ ...colorVariables, ...style }}
      {...props}
    >
      <ResponsiveContainer initialDimension={initialDimension}>{children}</ResponsiveContainer>
    </div>
  );
}
