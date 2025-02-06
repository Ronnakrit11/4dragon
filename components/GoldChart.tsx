'use client';

import { useEffect, useRef } from 'react';
import { useTheme } from '@/lib/theme-provider';

declare global {
  interface Window {
    TradingView: any;
  }
}

export function GoldChart() {
  const container = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      if (container.current) {
        new window.TradingView.widget({
          container_id: 'tradingview_chart',
          symbol: 'OANDA:XAUUSD',
          interval: 'D',
          timezone: 'Asia/Bangkok',
          theme: isDark ? 'dark' : 'light',
          style: '1',
          locale: 'th_TH',
          toolbar_bg: isDark ? '#151515' : '#f1f3f6',
          enable_publishing: false,
          hide_side_toolbar: false,
          allow_symbol_change: true,
          save_image: false,
          height: 500,
          width: '100%',
          backgroundColor: isDark ? '#151515' : '#ffffff',
          gridColor: isDark ? '#2A2A2A' : '#e9e9ea',
          studies: [
            {
              id: 'MAExp@tv-basicstudies',
              inputs: {
                length: 9,
                source: 'close'
              }
            },
            {
              id: 'MAExp@tv-basicstudies',
              inputs: {
                length: 19,
                source: 'close'
              }
            }
          ],
          overrides: {
            'mainSeriesProperties.candleStyle.upColor': '#4CAF50',
            'mainSeriesProperties.candleStyle.downColor': '#ef5350',
            'mainSeriesProperties.candleStyle.borderUpColor': '#4CAF50',
            'mainSeriesProperties.candleStyle.borderDownColor': '#ef5350',
            'mainSeriesProperties.candleStyle.wickUpColor': '#4CAF50',
            'mainSeriesProperties.candleStyle.wickDownColor': '#ef5350',
          }
        });
      }
    };
    document.head.appendChild(script);

    return () => {
      script.remove();
    };
  }, [isDark]);

  return (
    <div className="w-full">
      <div id="tradingview_chart" ref={container} className={isDark ? 'bg-[#151515]' : 'bg-white'} />
    </div>
  );
}
