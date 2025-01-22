import { useEffect, useRef, useState } from "react";
import {
  createChart,
  ColorType,
  IChartApi,
  DeepPartial,
  ChartOptions,
  HistogramSeriesOptions,
} from "lightweight-charts";
import type { ChartData } from "./orderbooks";

interface PriceChartProps {
  data: ChartData[];
  containerWidth?: number;
  containerHeight?: number;
}

type TimeFrame = "1D" | "1W" | "1M" | "3M" | "1Y" | "ALL";

const chartOptions: DeepPartial<ChartOptions> = {
  layout: {
    background: { type: ColorType.Solid, color: "#1F2937" },
    textColor: "#D1D5DB",
  },
  grid: {
    vertLines: { color: "#374151" },
    horzLines: { color: "#374151" },
  },
  rightPriceScale: {
    borderColor: "#374151",
    scaleMargins: {
      top: 0.1,
      bottom: 0.3,
    },
  },
  timeScale: {
    borderColor: "#374151",
    timeVisible: true,
    secondsVisible: false,
  },
  crosshair: {
    vertLine: {
      color: "#9CA3AF",
      width: 1,
      style: 3,
      labelBackgroundColor: "#374151",
    },
    horzLine: {
      color: "#9CA3AF",
      width: 1,
      style: 3,
      labelBackgroundColor: "#374151",
    },
  },
};

const volumeSeriesOptions: DeepPartial<HistogramSeriesOptions> = {
  color: "#60A5FA",
  priceFormat: {
    type: "volume",
  },
  priceScaleId: "",
};

export function PriceChart({
  data,
  containerWidth = 800,
  containerHeight = 400,
}: PriceChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const [timeFrame, setTimeFrame] = useState<TimeFrame>("1D");
  const [isLoading, setIsLoading] = useState(false);

  // Filter data based on selected time frame
  const getFilteredData = (timeFrame: TimeFrame) => {
    const now = new Date();
    const filterDate = new Date();

    switch (timeFrame) {
      case "1D":
        filterDate.setDate(now.getDate() - 1);
        break;
      case "1W":
        filterDate.setDate(now.getDate() - 7);
        break;
      case "1M":
        filterDate.setMonth(now.getMonth() - 1);
        break;
      case "3M":
        filterDate.setMonth(now.getMonth() - 3);
        break;
      case "1Y":
        filterDate.setFullYear(now.getFullYear() - 1);
        break;
      case "ALL":
        return data;
    }

    return data.filter((item) => new Date(item.time) >= filterDate);
  };

  useEffect(() => {
    if (!chartContainerRef.current) return;

    setIsLoading(true);

    const chart = createChart(chartContainerRef.current, {
      ...chartOptions,
      width: containerWidth,
      height: containerHeight,
    });

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: "#22C55E",
      downColor: "#EF4444",
      borderVisible: false,
      wickUpColor: "#22C55E",
      wickDownColor: "#EF4444",
    });

    const volumeSeries = chart.addHistogramSeries(volumeSeriesOptions);

    // Set the scale margins after creating the series
    chart.priceScale("").applyOptions({
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });

    const filteredData = getFilteredData(timeFrame);
    candlestickSeries.setData(filteredData);

    volumeSeries.setData(
      filteredData.map((item) => ({
        time: item.time,
        value: item.volume || 0,
        color: item.close >= item.open ? "#22C55E" : "#EF4444",
      }))
    );

    chartRef.current = chart;
    setIsLoading(false);

    // Handle window resize
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [data, containerWidth, containerHeight, timeFrame]);

  const timeFrameButtons: TimeFrame[] = ["1D", "1W", "1M", "3M", "1Y", "ALL"];

  return (
    <div className="flex flex-col w-full h-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">Price Chart</h2>
        <div className="flex space-x-2">
          {timeFrameButtons.map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeFrame(tf)}
              className={`px-3 py-1 rounded ${
                timeFrame === tf
                  ? "bg-blue-500 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>
      <div className="relative flex-grow">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        )}
        <div ref={chartContainerRef} className="w-full h-full" />
      </div>
    </div>
  );
}
