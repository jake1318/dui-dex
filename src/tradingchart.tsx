// src/TradingChart.tsx
// Last updated: 2025-01-23 07:44:15 UTC
// Author: jake1318

import { useEffect, useRef } from "react";
import {
  createChart,
  IChartApi,
  Time,
  LineStyle,
  ColorType,
} from "lightweight-charts";
import { Candlestick } from "./types";

interface TradingChartProps {
  candlesticks: Candlestick[];
  width?: number;
  height?: number;
}

export function TradingChart({
  candlesticks,
  width = 800,
  height = 400,
}: TradingChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  // Helper function to format date to Unix timestamp
  const formatTime = (time: string | number): number => {
    if (typeof time === "string") {
      return Math.floor(new Date(time).getTime() / 1000);
    }
    return typeof time === "number" && time > 1e10
      ? Math.floor(time / 1000)
      : time;
  };

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create chart instance
    chartRef.current = createChart(chartContainerRef.current, {
      width,
      height,
      layout: {
        background: { color: "#1E1E1E" as ColorType },
        textColor: "#DDD" as ColorType,
      },
      grid: {
        vertLines: { color: "#2B2B43" as ColorType },
        horzLines: { color: "#2B2B43" as ColorType },
      },
      crosshair: {
        mode: 1,
      },
      rightPriceScale: {
        borderColor: "#2B2B43",
      },
      timeScale: {
        borderColor: "#2B2B43",
        timeVisible: true,
        secondsVisible: false,
      },
    });

    // Add candlestick series
    const candlestickSeries = chartRef.current.addCandlestickSeries({
      upColor: "#26a69a",
      downColor: "#ef5350",
      borderVisible: false,
      wickUpColor: "#26a69a",
      wickDownColor: "#ef5350",
    });

    // Add volume series
    const volumeSeries = chartRef.current.addHistogramSeries({
      color: "#26a69a",
      priceFormat: {
        type: "volume",
      },
      priceScaleId: "",
    });

    try {
      // Format data with proper timestamps
      const formattedCandlesticks = candlesticks
        .map((candle) => ({
          time: formatTime(candle.time) as Time,
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
        }))
        .sort((a, b) => Number(a.time) - Number(b.time)); // Ensure ascending order

      const formattedVolumes = candlesticks
        .map((candle) => ({
          time: formatTime(candle.time) as Time,
          value: candle.volume,
          color: candle.close >= candle.open ? "#26a69a55" : "#ef535055",
        }))
        .sort((a, b) => Number(a.time) - Number(b.time)); // Ensure ascending order

      // Set data
      candlestickSeries.setData(formattedCandlesticks);
      volumeSeries.setData(formattedVolumes);

      // Add price line for last price
      const lastPrice =
        formattedCandlesticks[formattedCandlesticks.length - 1]?.close;
      if (lastPrice) {
        candlestickSeries.createPriceLine({
          price: lastPrice,
          color: "#2962FF",
          lineWidth: 1,
          lineStyle: LineStyle.Dotted,
          axisLabelVisible: true,
          title: "Last Price",
        });
      }

      // Fit content
      chartRef.current.timeScale().fitContent();
    } catch (error) {
      console.error("Error formatting chart data:", error);
    }

    // Cleanup
    return () => {
      if (chartRef.current) {
        chartRef.current.remove();
      }
    };
  }, [candlesticks, width, height]);

  return (
    <div className="relative">
      <div ref={chartContainerRef} className="rounded-lg overflow-hidden" />
      {candlesticks.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75">
          <p className="text-gray-400">No data available</p>
        </div>
      )}
    </div>
  );
}
