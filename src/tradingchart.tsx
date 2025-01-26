/**
 * @file src/TradingChart.tsx
 * Current Date and Time (UTC - YYYY-MM-DD HH:MM:SS formatted): 2025-01-25 20:10:18
 * Author: jake1318
 */

import "./tradingchart.css";
import { useEffect, useRef, useState } from "react";
import {
  createChart,
  IChartApi,
  Time,
  LineStyle,
  ColorType,
  ISeriesApi,
  SeriesType,
} from "lightweight-charts";
import { Candlestick } from "./types";

interface TradingChartProps {
  candlesticks: Candlestick[];
  width?: number;
  height?: number;
}

type TimeFrame = "1min" | "1H" | "4H" | "1D" | "1W" | "1M";
type Indicator = "MA" | "EMA" | "RSI" | "NONE";

export function TradingChart({
  candlesticks,
  width = 800,
  height = 400,
}: TradingChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const [timeFrame, setTimeFrame] = useState<TimeFrame>("1D");
  const [indicator, setIndicator] = useState<Indicator>("NONE");
  const indicatorSeriesRef = useRef<ISeriesApi<SeriesType> | null>(null);

  // Calculate Moving Average
  const calculateMA = (data: Candlestick[], period: number) => {
    return data
      .map((candle, index) => {
        if (index < period - 1) return null;
        const sum = data
          .slice(index - period + 1, index + 1)
          .reduce((acc, curr) => acc + curr.close, 0);
        return {
          time: formatTime(candle.time) as Time,
          value: sum / period,
        };
      })
      .filter((item): item is { time: Time; value: number } => item !== null);
  };

  // Calculate EMA
  const calculateEMA = (data: Candlestick[], period: number) => {
    const multiplier = 2 / (period + 1);
    const emaData: { time: Time; value: number }[] = [];

    let ema = data[0].close;
    emaData.push({
      time: formatTime(data[0].time) as Time,
      value: ema,
    });

    for (let i = 1; i < data.length; i++) {
      ema = (data[i].close - ema) * multiplier + ema;
      emaData.push({
        time: formatTime(data[i].time) as Time,
        value: ema,
      });
    }

    return emaData;
  };

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

    // Create chart instance with updated options
    chartRef.current = createChart(chartContainerRef.current, {
      width,
      height,
      layout: {
        background: { color: "#1E1E1E" as ColorType },
        textColor: "#DDD" as ColorType,
      },
      grid: {
        vertLines: { color: "#2B2B43" as ColorType, style: LineStyle.Dotted },
        horzLines: { color: "#2B2B43" as ColorType, style: LineStyle.Dotted },
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: "#555",
          width: 1,
          style: LineStyle.Solid,
          labelBackgroundColor: "#2B2B43",
        },
        horzLine: {
          color: "#555",
          width: 1,
          style: LineStyle.Solid,
          labelBackgroundColor: "#2B2B43",
        },
      },
      rightPriceScale: {
        borderColor: "transparent", // Remove right scale border
        scaleMargins: {
          top: 0.1,
          bottom: 0.2,
        },
      },
      timeScale: {
        borderColor: "transparent", // Remove bottom scale border
        timeVisible: true,
        secondsVisible: false,
        barSpacing: 12,
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
      priceScaleId: "volume",
    });

    // Set the scale margins for the volume series
    chartRef.current.priceScale("volume").applyOptions({
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
      visible: true,
      borderColor: "transparent", // Remove volume scale border
    });

    // Format and set data
    const formattedCandlesticks = candlesticks
      .map((candle) => ({
        time: formatTime(candle.time) as Time,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
      }))
      .sort((a, b) => Number(a.time) - Number(b.time));

    const formattedVolumes = candlesticks
      .map((candle) => ({
        time: formatTime(candle.time) as Time,
        value: candle.volume || 0,
        color: candle.close >= candle.open ? "#26a69a55" : "#ef535055",
      }))
      .sort((a, b) => Number(a.time) - Number(b.time));

    candlestickSeries.setData(formattedCandlesticks);
    volumeSeries.setData(formattedVolumes);

    // Cleanup
    return () => {
      if (chartRef.current) {
        chartRef.current.remove();
      }
    };
  }, [candlesticks, width, height]);

  // Update indicator
  useEffect(() => {
    if (!chartRef.current) return;

    // Remove previous indicator if it exists
    if (indicatorSeriesRef.current) {
      chartRef.current.removeSeries(indicatorSeriesRef.current);
      indicatorSeriesRef.current = null;
    }

    // Add new indicator with LineStyle
    if (indicator !== "NONE") {
      const lineSeries = chartRef.current.addLineSeries({
        color: indicator === "MA" ? "#2962FF" : "#FF6D00",
        lineWidth: 2,
        lineStyle: indicator === "MA" ? LineStyle.Solid : LineStyle.Dashed,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 4,
        lastPriceAnimation: 1,
      });

      const indicatorData =
        indicator === "MA"
          ? calculateMA(candlesticks, 20) // 20-period MA
          : calculateEMA(candlesticks, 20); // 20-period EMA

      lineSeries.setData(indicatorData);
      indicatorSeriesRef.current = lineSeries;
    }
  }, [indicator, candlesticks]);

  return (
    <div className="chart-wrapper">
      <div className="chart-controls">
        <div className="timeframe-selector">
          {["1min", "1H", "4H", "1D", "1W", "1M"].map((tf) => (
            <button
              key={tf}
              className={`timeframe-button ${timeFrame === tf ? "active" : ""}`}
              onClick={() => setTimeFrame(tf as TimeFrame)}
            >
              {tf}
            </button>
          ))}
        </div>
        <div className="indicator-selector">
          {["NONE", "MA", "EMA"].map((ind) => (
            <button
              key={ind}
              className={`indicator-button ${
                indicator === ind ? "active" : ""
              }`}
              onClick={() => setIndicator(ind as Indicator)}
            >
              {ind}
            </button>
          ))}
        </div>
      </div>
      <div ref={chartContainerRef} />
    </div>
  );
}
