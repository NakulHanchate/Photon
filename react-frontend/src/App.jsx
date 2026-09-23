import React, { useState } from 'react';
import Header from './components/Header';
import SubscriptionBar from './components/SubscriptionBar';
import TickerGrid from './components/TickerGrid';
import TradingView from './components/TradingView';
import { useWebSocket } from './hooks/useWebSocket';

export default function App() {
    const { status, prices, sendSubscription } = useWebSocket();
    const [view, setView] = useState('grid');
    const [viewedTicker, setViewedTicker] = useState(null);
    const [viewedName, setViewedName] = useState(null);

    const handleSubscribe = (tickers) => {
        sendSubscription(tickers);
    };

    const handleInstantView = (ticker, name) => {
        setViewedTicker(ticker);
        setViewedName(name);
        setView('trading');
    };

    const handleCardClick = (ticker) => {
        setViewedTicker(ticker);
        setViewedName(null);
        setView('trading');
    };

    const handleBackToGrid = () => {
        setView('grid');
    };

    return (
        <div style={{ width: '100%', maxWidth: '1400px', margin: '0 auto', padding: '20px', boxSizing: 'border-box' }}>
            <Header status={status} />
            <main style={{ width: '100%' }}>
                {view === 'grid' && (
                    <>
                        <SubscriptionBar 
                            onSubscribe={handleSubscribe} 
                            onInstantView={handleInstantView} 
                        />
                        <TickerGrid 
                            prices={prices} 
                            onCardClick={handleCardClick} 
                        />
                    </>
                )}
                {view === 'trading' && (
                    <TradingView 
                        ticker={viewedTicker} 
                        titleName={viewedName}
                        currentPrice={prices[viewedTicker]} 
                        onBack={handleBackToGrid} 
                    />
                )}
            </main>
        </div>
    );
}
