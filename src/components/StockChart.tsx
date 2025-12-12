'use client';

import React from 'react';
import { LineChart, Line, ResponsiveContainer, YAxis, Tooltip } from 'recharts';

interface StockChartProps {
  data?: { value: number; time: string }[];
  color?: string;
}

// Generate mock data if none provided
const generateMockData = () => {
  const data = [];
  let value = 10;
  for (let i = 0; i < 20; i++) {
    value = value + (Math.random() - 0.4) * 5; // Slight upward trend
    if (value < 5) value = 5;
    data.push({ time: i, value });
  }
  return data;
};

export function StockChart({ data = generateMockData(), color = '#10B981' }: StockChartProps) {
  const isUp = data[data.length - 1].value >= data[0].value;
  const chartColor = isUp ? '#10B981' : '#EF4444';

  return (
    <div className="h-12 w-24">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <YAxis domain={['dataMin', 'dataMax']} hide />
          <Line
            type="monotone"
            dataKey="value"
            stroke={chartColor}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
