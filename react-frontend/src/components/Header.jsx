import React from 'react';
import './Header.css';

export default function Header({ status }) {
    return (
        <header className="app-header">
            <h1>Photon</h1>
            <div className="status-container">
                <span className={`status-dot ${status === 'Live' ? 'live' : status.startsWith('Connecting') ? 'connecting' : 'disconnected'}`}></span>
                <span id="connection-status">{status}</span>
            </div>
        </header>
    );
}
