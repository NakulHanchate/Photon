import React, { useEffect, useRef, useState } from 'react';
import './TickerGrid.css';

function usePrevious(value) {
    const ref = useRef();
    useEffect(() => {
        ref.current = value;
    });
    return ref.current;
}

export function TickerCard({ ticker, price, onClick }) {
    const prevPrice = usePrevious(price);
    const [flashClass, setFlashClass] = useState('');
    const timeoutRef = useRef(null);

    useEffect(() => {
        if (prevPrice !== undefined) {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            
            // Remove class to trigger reflow
            setFlashClass('');
            
            // Add slight delay before adding class again
            timeoutRef.current = setTimeout(() => {
                if (price > prevPrice) setFlashClass('flash-up');
                else if (price < prevPrice) setFlashClass('flash-down');
                else setFlashClass('flash-neutral');
            }, 10);
        }
    }, [price, prevPrice]);

    return (
        <div className={`card cursor-pointer ${flashClass}`} onClick={() => onClick(ticker)}>
            <div className="ticker">{ticker}</div>
            <div className="price">{price === 0 ? "Loading..." : `$${price.toFixed(2)}`}</div>
        </div>
    );
}

export default function TickerGrid({ prices, onCardClick }) {
    const tickers = Object.keys(prices);
    
    return (
        <section className="grid">
            {tickers.map(ticker => (
                <TickerCard 
                    key={ticker} 
                    ticker={ticker} 
                    price={prices[ticker]} 
                    onClick={onCardClick} 
                />
            ))}
        </section>
    );
}
