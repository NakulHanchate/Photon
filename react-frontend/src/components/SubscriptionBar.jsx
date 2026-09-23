import React, { useState, useEffect, useRef } from 'react';
import './SubscriptionBar.css';

export default function SubscriptionBar({ onSubscribe, onInstantView }) {
    const [inputValue, setInputValue] = useState('');
    const [results, setResults] = useState([]);
    const [showResults, setShowResults] = useState(false);
    const timeoutRef = useRef(null);
    const containerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setShowResults(false);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const handleChange = (e) => {
        const value = e.target.value;
        setInputValue(value);
        
        const parts = value.split(',');
        const currentTerm = parts[parts.length - 1].trim();

        if (currentTerm.length < 2) {
            setResults([]);
            setShowResults(false);
            return;
        }

        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        timeoutRef.current = setTimeout(async () => {
            try {
                const response = await fetch(`http://localhost:8000/api/search?q=${currentTerm}`);
                const data = await response.json();
                setResults(data);
                setShowResults(data.length > 0);
            } catch (err) {
                console.error("Search failed:", err);
            }
        }, 300);
    };

    const handleResultClick = (result) => {
        const parts = inputValue.split(',');
        parts[parts.length - 1] = ' ' + result.symbol;
        const newValue = parts.join(',').trim();
        setInputValue(newValue);
        setResults([]);
        setShowResults(false);
        
        // Instant view workflow
        const allTickers = newValue.split(',').map(t => t.trim()).filter(t => t.length > 0);
        onSubscribe(allTickers);
        onInstantView(result.symbol, result.description);
    };

    const handleUpdate = () => {
        const allTickers = inputValue.split(',').map(t => t.trim()).filter(t => t.length > 0);
        onSubscribe(allTickers);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleUpdate();
            setShowResults(false);
        }
    };

    return (
        <section className="controls" ref={containerRef}>
            <div className="search-container">
                <input 
                    type="text" 
                    value={inputValue}
                    onChange={handleChange}
                    onKeyDown={handleKeyPress}
                    placeholder="e.g. AAPL, GOOGL (leave blank for all)" 
                    autoComplete="off" 
                />
                {showResults && (
                    <ul className="search-results">
                        {results.map((result, idx) => (
                            <li key={idx} onClick={() => handleResultClick(result)}>
                                <span className="symbol">{result.symbol}</span>
                                <span className="desc">{result.description}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            <button onClick={handleUpdate}>Update Subscription</button>
        </section>
    );
}
