import React, { useEffect, useRef, useState } from 'react';
import { createChart } from 'lightweight-charts';
import './TradingView.css';

export default function TradingView({ ticker, titleName, currentPrice, onBack }) {
    const chartContainerRef = useRef(null);
    const chartRef = useRef(null);
    const seriesRef = useRef(null);
    const lastCandleRef = useRef(null);
    const [history, setHistory] = useState([]);

    useEffect(() => {
        if (!chartContainerRef.current) return;

        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: 'solid', color: '#131722' },
                textColor: '#d1d4dc',
            },
            grid: {
                vertLines: { color: '#2b2b43' },
                horzLines: { color: '#2b2b43' },
            },
            crosshair: { mode: 0 },
            rightPriceScale: { borderColor: '#2b2b43' },
            timeScale: {
                borderColor: '#2b2b43',
                timeVisible: true,
            },
        });
        chartRef.current = chart;

        const series = chart.addCandlestickSeries({
            upColor: '#26a69a',
            downColor: '#ef5350',
            borderDownColor: '#ef5350',
            borderUpColor: '#26a69a',
            wickDownColor: '#ef5350',
            wickUpColor: '#26a69a',
        });
        seriesRef.current = series;

        const handleResize = () => {
            if (chartContainerRef.current) {
                chart.applyOptions({ 
                    width: chartContainerRef.current.clientWidth,
                    height: chartContainerRef.current.clientHeight 
                });
            }
        };

        const resizeObserver = new ResizeObserver(entries => {
            if (entries.length === 0 || entries[0].target !== chartContainerRef.current) return;
            handleResize();
        });
        resizeObserver.observe(chartContainerRef.current);

        return () => {
            resizeObserver.disconnect();
            chart.remove();
        };
    }, [ticker]);

    useEffect(() => {
        let isMounted = true;
        const fetchHistory = async () => {
            try {
                const response = await fetch(`http://localhost:8000/api/history/${ticker}`);
                const data = await response.json();
                
                if (data && data.length > 0 && isMounted && seriesRef.current) {
                    const formattedData = data.map(d => ({
                        time: d.time,
                        open: d.open,
                        high: d.high,
                        low: d.low,
                        close: d.close
                    })).sort((a, b) => a.time - b.time);
                    seriesRef.current.setData(formattedData);
                    lastCandleRef.current = formattedData[formattedData.length - 1];
                    
                    if (chartRef.current) {
                        if (formattedData.length > 5) {
                            chartRef.current.timeScale().setVisibleLogicalRange({
                                from: Math.max(0, formattedData.length - 30),
                                to: formattedData.length
                            });
                        } else {
                            chartRef.current.timeScale().fitContent();
                        }
                    }
                }
            } catch (err) {
                console.error("Failed to fetch history:", err);
            }
        };
        fetchHistory();
        return () => { isMounted = false; };
    }, [ticker]);

    useEffect(() => {
        if (!seriesRef.current || currentPrice === undefined) return;

        setHistory(prev => {
            const timeStr = new Date().toLocaleTimeString();
            const lastPrice = prev.length > 0 ? prev[0].price : currentPrice;
            const color = currentPrice >= lastPrice ? '#26a69a' : '#ef5350';
            const newItem = { time: timeStr, price: currentPrice, color };
            const newHistory = [newItem, ...prev];
            if (newHistory.length > 50) newHistory.pop();
            return newHistory;
        });

        const now = Math.floor(Date.now() / 1000);
        const coeff = 60;
        const roundedTime = Math.floor(now / coeff) * coeff;

        const lastC = lastCandleRef.current;

        if (lastC && lastC.time === roundedTime) {
            lastC.close = currentPrice;
            lastC.high = Math.max(lastC.high, currentPrice);
            lastC.low = Math.min(lastC.low, currentPrice);
            seriesRef.current.update(lastC);
        } else {
            const newCandle = {
                time: roundedTime,
                open: currentPrice,
                high: currentPrice,
                low: currentPrice,
                close: currentPrice
            };
            seriesRef.current.update(newCandle);
            lastCandleRef.current = newCandle;
        }

    }, [currentPrice]);

    const handleZoomIn = () => {
        if (!chartRef.current) return;
        const logicalRange = chartRef.current.timeScale().getVisibleLogicalRange();
        if (logicalRange) {
            const diff = logicalRange.to - logicalRange.from;
            chartRef.current.timeScale().setVisibleLogicalRange({
                from: logicalRange.from + diff * 0.1,
                to: logicalRange.to - diff * 0.1
            });
        }
    };

    const handleZoomOut = () => {
        if (!chartRef.current) return;
        const logicalRange = chartRef.current.timeScale().getVisibleLogicalRange();
        if (logicalRange) {
            const diff = logicalRange.to - logicalRange.from;
            chartRef.current.timeScale().setVisibleLogicalRange({
                from: logicalRange.from - diff * 0.1,
                to: logicalRange.to + diff * 0.1
            });
        }
    };

    const handleResetZoom = () => {
        if (!chartRef.current) return;
        chartRef.current.timeScale().fitContent();
    };

    const displayPrice = currentPrice !== undefined && currentPrice !== 0 ? `$${currentPrice.toFixed(2)}` : "Loading...";

    return (
        <section id="trading-view">
            <div className="trading-header">
                <button id="back-btn" onClick={onBack}>← Back to Grid</button>
                <h2>
                    {ticker} 
                    {titleName && <span style={{ fontSize: '0.9rem', color: '#888', fontWeight: 'normal', marginLeft: '10px' }}>{titleName}</span>}
                </h2>
                <div className="trading-price">{displayPrice}</div>
                <div className="zoom-controls">
                    <button onClick={handleZoomIn} title="Zoom In">+</button>
                    <button onClick={handleZoomOut} title="Zoom Out">-</button>
                    <button onClick={handleResetZoom} title="Reset Zoom">Reset</button>
                </div>
            </div>
            
            <div className="trading-body">
                <div className="trading-sidebar left-sidebar">
                    <h3>History</h3>
                    <ul>
                        {history.map((h, i) => (
                            <li key={i}>
                                <span>{h.time}</span>
                                <span style={{ color: h.color }}>${h.price.toFixed(2)}</span>
                            </li>
                        ))}
                    </ul>
                </div>
                
                <div className="trading-chart-container" ref={chartContainerRef}></div>
                
                <div className="trading-sidebar right-sidebar">
                    <div className="order-panel">
                        <h3>Place Order</h3>
                        <div className="amount-input">
                            <label>Amount</label>
                            <input type="number" defaultValue="1000" />
                        </div>
                        <button className="trade-btn up-btn">UP</button>
                        <button className="trade-btn down-btn">DOWN</button>
                    </div>
                </div>
            </div>
        </section>
    );
}
