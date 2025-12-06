import React, { useState, useEffect } from 'react';
import './App.css';
import api from './api';
import BingoCard from './components/BingoCard';

function App() {
  const [bcode, setBcode] = useState('');
  const [cards, setCards] = useState(() => {
    // Load cards from localStorage on first render
    const saved = localStorage.getItem('bingo-cards');
    return saved ? JSON.parse(saved) : [];
  });
  const [loading, setLoading] = useState(false);
  const [drawnBalls, setDrawnBalls] = useState([]);

  // Save cards to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('bingo-cards', JSON.stringify(cards));
  }, [cards]);

  // Poll for drawn balls every second
  useEffect(() => {
    if (!bcode) return;
    const interval = setInterval(async () => {
      try {
        const balls = await api.getGameboard(bcode);
        if (balls && balls.length > 0) {
          setDrawnBalls(balls);
        }
      } catch (err) {
        console.error('Error fetching gameboard:', err);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [bcode]);

  const addCard = async () => {
    if (!bcode) return alert('Enter a Game Code (bcode)');
    setLoading(true);
    try {
      const data = await api.fetchCard(bcode.trim());
      if (data && data.notFound) {
        alert('Game code not found');
      } else {
        const item = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
          ...data,
          status: null,
        };
        setCards(prev => [...prev, item]);
      }
    } catch (e) {
      alert('Error fetching card: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const removeCard = (id) => {
    setCards(prev => prev.filter(c => c.id !== id));
  };

  const checkCard = async (item) => {
    const token = item.playcard_token || item.playcard || item.token;
    if (!token) return alert('No playcard token available for this card');
    try {
      const res = await api.checkWin(token);
      setCards(prev => prev.map(c => (c.id === item.id ? { ...c, status: res } : c)));
    } catch (e) {
      alert('Error checking win: ' + e.message);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Bingo Card App</h1>
        <div className="controls">
          <input value={bcode} onChange={e => setBcode(e.target.value)} placeholder="Game Code (bcode)" />
          <button onClick={addCard} disabled={loading}>{loading ? 'Loading…' : 'Add Card'}</button>
        </div>
      </header>

      <main className="cards-area">
        {cards.length === 0 ? (
          <div className="empty">No cards yet — add a Game Code to get cards.</div>
        ) : (
          <div className="cards-grid">
            {cards.map((item, idx) => (
              <BingoCard
                key={item.id}
                item={item}
                cardNumber={idx + 1}
                drawnBalls={drawnBalls}
                onRemove={removeCard}
                onCheck={checkCard}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
