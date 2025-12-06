import React from 'react';
import './BingoCard.css';

function normalizeMatrix(cardData) {
  if (!cardData) return null;
  const COLUMNS = ['B', 'I', 'N', 'G', 'O'];

  if (cardData.card && typeof cardData.card === 'object' && !Array.isArray(cardData.card)) {
    const colData = cardData.card;
    if (COLUMNS.every(col => Array.isArray(colData[col]) && colData[col].length === 5)) {
      const matrix = [];
      for (let row = 0; row < 5; row++) {
        matrix.push(COLUMNS.map(col => colData[col][row]));
      }
      return matrix;
    }
  }

  if (Array.isArray(cardData.matrix)) return cardData.matrix;
  if (Array.isArray(cardData.card)) {
    const c = cardData.card;
    if (c.length === 25) {
      const out = [];
      for (let i = 0; i < c.length; i += 5) out.push(c.slice(i, i + 5));
      return out;
    }
    if (Array.isArray(c[0])) return c;
  }

  if (Array.isArray(cardData.numbers) && cardData.numbers.length === 25) {
    const out = [];
    for (let i = 0; i < cardData.numbers.length; i += 5) out.push(cardData.numbers.slice(i, i + 5));
    return out;
  }
  return null;
}

const COLUMNS = ['B', 'I', 'N', 'G', 'O'];

export default function BingoCard({ item, cardNumber = 1, drawnBalls = [], onRemove, onCheck }) {
  const matrix = normalizeMatrix(item) || [];
  const token = item.playcard_token || item.playcard || item.token || '';
  const [selectedCells, setSelectedCells] = React.useState(new Set());

  // ✅ Ensure all numbers are compared as numbers
  const drawnSet = new Set(drawnBalls.map(Number));

  const toggleCell = (rIdx, cIdx) => {
    const key = `${rIdx}-${cIdx}`;
    setSelectedCells(prev => {
      const updated = new Set(prev);
      if (updated.has(key)) updated.delete(key);
      else updated.add(key);
      return updated;
    });
  };

  return (
    <div className="bingo-card">
      <div className="card-title">Card {cardNumber}</div>

      {matrix.length === 0 ? (
        <pre className="raw">{JSON.stringify(item, null, 2)}</pre>
      ) : (
        <>
          <div className="card-grid">
            <div className="header-row">
              {COLUMNS.map(col => <div className="col-header" key={col}>{col}</div>)}
            </div>

            {matrix.map((row, rIdx) => (
              <div className="row" key={rIdx}>
                {row.map((cell, cIdx) => {
                  const isFree = rIdx === 2 && cIdx === 2;
                  const isSelected = selectedCells.has(`${rIdx}-${cIdx}`);
                  const isMarked = drawnSet.has(Number(cell));

                  return (
                    <div
                      key={`${rIdx}-${cIdx}`}
                      className={`cell ${isFree ? 'free' : ''} ${isMarked ? 'marked' : ''} ${isSelected ? 'selected' : ''}`}
                      onClick={() => !isFree && toggleCell(rIdx, cIdx)}
                    >
                      {isFree ? '★' : cell}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="card-footer">
            <div className="token-display"><small>Token:</small> <code>{token || '—'}</code></div>
            <div className="actions">
              <button onClick={() => onCheck(item)} className="check">Check Win</button>
              <button onClick={() => onRemove(item.id)} className="remove">Remove</button>
            </div>
          </div>
        </>
      )}

      {item.status && (
        <div className={`status ${item.status.win ? 'win' : 'no-win'}`}>
          {item.status.win ? '✓ Winning card!' : '✗ Not a winning card'}
        </div>
      )}
    </div>
  );
}
