const WS_URL = 'ws://localhost:8000/ws';
let socket;
const prices = {};

const statusDot = document.getElementById('connection-dot');
const statusText = document.getElementById('connection-status');
const grid = document.getElementById('ticker-grid');
const subscribeBtn = document.getElementById('subscribe-btn');
const subscriptionInput = document.getElementById('subscription-input');

let currentViewedTicker = null;
let chart = null;
let candleSeries = null;
let lastCandle = null;

function connect() {
    socket = new WebSocket(WS_URL);

    socket.onopen = () => {
        statusDot.className = 'status-dot live';
        statusText.textContent = 'Live';
        
        updateSubscription();
    };

    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'tick') {
            updateCard(data.ticker, data.price);
        }
    };

    socket.onclose = () => {
        statusDot.className = 'status-dot disconnected';
        statusText.textContent = 'Disconnected - Reconnecting...';
        setTimeout(connect, 3000);
    };

    socket.onerror = (error) => {
        console.error('WebSocket Error:', error);
    };
}

function updateCard(ticker, newPrice) {
    let card = document.getElementById(`card-${ticker}`);
    
    if (!card) {
        card = document.createElement('div');
        card.id = `card-${ticker}`;
        card.className = 'card cursor-pointer';
        card.onclick = () => openTradingView(ticker);
        card.innerHTML = `
            <div class="ticker">${ticker}</div>
            <div class="price" id="price-${ticker}">$${newPrice.toFixed(2)}</div>
        `;
        grid.appendChild(card);
        prices[ticker] = newPrice;
        return;
    }

    const priceElement = document.getElementById(`price-${ticker}`);
    const oldPrice = prices[ticker];
    
    priceElement.textContent = `$${newPrice.toFixed(2)}`;
    
    card.classList.remove('flash-up', 'flash-down', 'flash-neutral');
    
    void card.offsetWidth;
    
    if (newPrice > oldPrice) {
        card.classList.add('flash-up');
    } else if (newPrice < oldPrice) {
        card.classList.add('flash-down');
    } else {
        card.classList.add('flash-neutral');
    }
    
    prices[ticker] = newPrice;

    if (currentViewedTicker === ticker && candleSeries) {
        document.getElementById('trading-price').textContent = `$${newPrice.toFixed(2)}`;
        
        const historyList = document.getElementById('trade-history');
        const li = document.createElement('li');
        const timeStr = new Date().toLocaleTimeString();
        let color = '#fff';
        if (newPrice > oldPrice) color = '#26a69a';
        if (newPrice < oldPrice) color = '#ef5350';
        li.innerHTML = `<span>${timeStr}</span> <span style="color:${color}">$${newPrice.toFixed(2)}</span>`;
        historyList.prepend(li);
        if (historyList.children.length > 50) historyList.lastChild.remove();
        
        const now = Math.floor(Date.now() / 1000);
        const coeff = 60;
        const roundedTime = Math.floor(now / coeff) * coeff;
        
        if (lastCandle && lastCandle.time === roundedTime) {
            lastCandle.close = newPrice;
            lastCandle.high = Math.max(lastCandle.high, newPrice);
            lastCandle.low = Math.min(lastCandle.low, newPrice);
            candleSeries.update(lastCandle);
        } else {
            const newCandle = {
                time: roundedTime,
                open: newPrice,
                high: newPrice,
                low: newPrice,
                close: newPrice
            };
            candleSeries.update(newCandle);
            lastCandle = newCandle;
        }
    }
}

async function openTradingView(ticker) {
    currentViewedTicker = ticker;
    document.getElementById('ticker-grid').classList.add('hidden');
    document.getElementById('grid-controls').classList.add('hidden');
    document.getElementById('trading-view').classList.remove('hidden');
    
    let titleHtml = ticker;
    if (symbolNames[ticker]) {
        titleHtml = `${ticker} <span style="font-size: 0.9rem; color: #888; font-weight: normal; margin-left: 10px;">${symbolNames[ticker]}</span>`;
    }
    
    document.getElementById('trading-symbol').innerHTML = titleHtml;
    
    const priceStr = prices[ticker] !== undefined ? `$${prices[ticker].toFixed(2)}` : "Loading...";
    document.getElementById('trading-price').textContent = priceStr;
    document.getElementById('trade-history').innerHTML = '';
    
    initChart();
    
    try {
        const response = await fetch(`http://localhost:8000/api/history/${ticker}`);
        const data = await response.json();
        
        if (data && data.length > 0) {
            const formattedData = data.map(d => ({
                time: d.time,
                open: d.open,
                high: d.high,
                low: d.low,
                close: d.close
            })).sort((a, b) => a.time - b.time);
            
            candleSeries.setData(formattedData);
            lastCandle = formattedData[formattedData.length - 1];
            
            if (formattedData.length > 5) {
                chart.timeScale().setVisibleLogicalRange({
                    from: Math.max(0, formattedData.length - 30),
                    to: formattedData.length
                });
            } else {
                chart.timeScale().fitContent();
            }
        }
    } catch (e) {
        console.error("Failed to fetch history", e);
    }
}

function initChart() {
    if (chart) {
        chart.remove();
    }
    const container = document.getElementById('chart-container');
    container.innerHTML = ''; 
    
    chart = LightweightCharts.createChart(container, {
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
    
    candleSeries = chart.addCandlestickSeries({
        upColor: '#26a69a',
        downColor: '#ef5350',
        borderDownColor: '#ef5350',
        borderUpColor: '#26a69a',
        wickDownColor: '#ef5350',
        wickUpColor: '#26a69a',
    });
    
    new ResizeObserver(entries => {
        if (entries.length === 0 || entries[0].target !== container) return;
        const newRect = entries[0].contentRect;
        chart.applyOptions({ height: newRect.height, width: newRect.width });
    }).observe(container);
}

document.getElementById('back-btn').addEventListener('click', () => {
    currentViewedTicker = null;
    document.getElementById('trading-view').classList.add('hidden');
    document.getElementById('ticker-grid').classList.remove('hidden');
    document.getElementById('grid-controls').classList.remove('hidden');
});

function updateSubscription() {
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    
    const inputVal = subscriptionInput.value;
    const tickers = inputVal.split(',').map(t => t.trim()).filter(t => t.length > 0);
    
    const msg = {
        action: 'subscribe',
        tickers: tickers
    };
    
    socket.send(JSON.stringify(msg));
    
    if (tickers.length > 0) {
        const upperTickers = tickers.map(t => t.toUpperCase());
        for (const ticker in prices) {
            if (!upperTickers.includes(ticker)) {
                const card = document.getElementById(`card-${ticker}`);
                if (card) {
                    card.remove();
                    delete prices[ticker];
                }
            }
        }
    }
}

subscribeBtn.addEventListener('click', updateSubscription);
subscriptionInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        updateSubscription();
    }
});

let searchTimeout = null;
const searchResultsContainer = document.getElementById('search-results');

const symbolNames = {};

subscriptionInput.addEventListener('input', (e) => {
    const parts = e.target.value.split(',');
    const currentTerm = parts[parts.length - 1].trim();
    
    if (currentTerm.length < 2) {
        searchResultsContainer.innerHTML = '';
        searchResultsContainer.classList.add('hidden');
        return;
    }

    if (searchTimeout) clearTimeout(searchTimeout);

    searchTimeout = setTimeout(async () => {
        try {
            const response = await fetch(`http://localhost:8000/api/search?q=${currentTerm}`);
            const results = await response.json();
            
            searchResultsContainer.innerHTML = '';
            
            if (results.length > 0) {
                results.forEach(result => {
                    symbolNames[result.symbol] = result.description;
                    
                    const li = document.createElement('li');
                    li.innerHTML = `<span class="symbol">${result.symbol}</span> <span class="desc">${result.description}</span>`;
                    li.addEventListener('click', () => {
                        parts[parts.length - 1] = ' ' + result.symbol;
                        subscriptionInput.value = parts.join(',').trim();
                        searchResultsContainer.innerHTML = '';
                        searchResultsContainer.classList.add('hidden');
                        
                        updateSubscription();
                        
                        if (prices[result.symbol] === undefined) {
                            prices[result.symbol] = 0; 
                        }
                        
                        openTradingView(result.symbol);
                    });
                    searchResultsContainer.appendChild(li);
                });
                searchResultsContainer.classList.remove('hidden');
            } else {
                searchResultsContainer.classList.add('hidden');
            }
        } catch (err) {
            console.error("Search failed:", err);
        }
    }, 300);
});

document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-container')) {
        searchResultsContainer.classList.add('hidden');
    }
});

document.getElementById('zoom-in-btn').addEventListener('click', () => {
    if (!chart) return;
    const logicalRange = chart.timeScale().getVisibleLogicalRange();
    if (logicalRange !== null) {
        const diff = logicalRange.to - logicalRange.from;
        chart.timeScale().setVisibleLogicalRange({
            from: logicalRange.from + diff * 0.1,
            to: logicalRange.to - diff * 0.1
        });
    }
});

document.getElementById('zoom-out-btn').addEventListener('click', () => {
    if (!chart) return;
    const logicalRange = chart.timeScale().getVisibleLogicalRange();
    if (logicalRange !== null) {
        const diff = logicalRange.to - logicalRange.from;
        chart.timeScale().setVisibleLogicalRange({
            from: logicalRange.from - diff * 0.1,
            to: logicalRange.to + diff * 0.1
        });
    }
});

document.getElementById('zoom-reset-btn').addEventListener('click', () => {
    if (!chart) return;
    chart.timeScale().fitContent();
});

connect();
