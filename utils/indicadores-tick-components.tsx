/**
 * Custom Recharts tick components that wrap long text to multiple lines
 * using SVG <tspan> elements, instead of truncating with "…".
 *
 * Replaces tickFormatter={tickShort} on axis definitions.
 * Uses recharts' built-in <Text> component for auto-wrapping.
 */
import React from 'react';
import { Text } from 'recharts';

/**
 * YAxis tick for horizontal bar charts (category axis).
 * Wraps text when it exceeds the available width.
 *
 * Usage:
 *   <YAxis width={180} tick={<YAxisTick />} />
 */
export const YAxisTick: React.FC<{
  x?: number;
  y?: number;
  payload?: { value: string };
  width?: number;
  [key: string]: unknown;
}> = (props) => {
  const { x, y, payload, width } = props;
  if (!payload?.value) return null;

  return (
    <Text
      x={x}
      y={y}
      width={(width ?? 180) - 10}
      textAnchor="end"
      verticalAnchor="end"
      lineHeight={14}
      fontSize={11}
      fill="currentColor"
    >
      {payload.value}
    </Text>
  );
};

/**
 * XAxis tick for vertical bar charts.
 * Wraps text when it exceeds the available width.
 *
 * Usage:
 *   <XAxis tick={<XAxisTick />} />
 */
export const XAxisTick: React.FC<{
  x?: number;
  y?: number;
  payload?: { value: string };
  width?: number;
  [key: string]: unknown;
}> = (props) => {
  const { x, y, payload, width } = props;
  if (!payload?.value) return null;

  return (
    <Text
      x={x}
      y={y}
      width={(width ?? 80) - 4}
      textAnchor="middle"
      verticalAnchor="start"
      lineHeight={13}
      fontSize={11}
      fill="currentColor"
    >
      {payload.value}
    </Text>
  );
};
