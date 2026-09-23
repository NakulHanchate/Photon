import { useState, useEffect, useRef, useCallback } from 'react';

const WS_URL = 'ws://localhost:8000/ws';

export function useWebSocket() {
    const [status, setStatus] = useState('Connecting...');
    const [prices, setPrices] = useState({});
    const wsRef = useRef(null);

    const connect = useCallback(() => {
        const ws = new WebSocket(WS_URL);
        wsRef.current = ws;

        ws.onopen = () => {
            setStatus('Live');
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'tick') {
                    setPrices(prev => ({
                        ...prev,
                        [data.ticker]: data.price
                    }));
                }
            } catch (e) {
                console.error("Failed to parse websocket message", e);
            }
        };

        ws.onclose = () => {
            setStatus('Disconnected - Reconnecting...');
            setTimeout(connect, 3000);
        };

        ws.onerror = (error) => {
            console.error('WebSocket Error:', error);
        };
    }, []);

    useEffect(() => {
        connect();
        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, [connect]);

    const sendSubscription = useCallback((tickers) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                action: 'subscribe',
                tickers: tickers
            }));
            
            setPrices(prev => {
                if (tickers.length === 0) {
                    return {};
                }
                const upperTickers = tickers.map(t => t.toUpperCase());
                const newPrices = { ...prev };
                for (const ticker in newPrices) {
                    if (!upperTickers.includes(ticker)) {
                        delete newPrices[ticker];
                    }
                }
                upperTickers.forEach(ticker => {
                    if (newPrices[ticker] === undefined) {
                        newPrices[ticker] = 0;
                    }
                });
                return newPrices;
            });
        }
    }, []);

    return { status, prices, sendSubscription };
}
