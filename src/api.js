const BASE = 'http://www.hyeumine.com';

async function getText(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Network error: ${res.status}`);
  return res.text();
}

export async function fetchCard(bcode) {
  if (!bcode) throw new Error('Missing bcode');
  const url = `${BASE}/getcard.php?bcode=${encodeURIComponent(bcode)}`;
  const text = await getText(url);
  if (text.trim() === '0') return { notFound: true };
  try {
    return JSON.parse(text);
  } catch (e) {
    return { raw: text };
  }
}

export async function checkWin(playcard_token) {
  if (!playcard_token) throw new Error('Missing playcard_token');
  const url = `${BASE}/checkwin.php?playcard_token=${encodeURIComponent(playcard_token)}`;
  const text = await getText(url);
  // API returns '0' for not found or not winning, '1' for winning
  if (text.trim() === '0') return { win: false };
  if (text.trim() === '1') return { win: true };
  try {
    return JSON.parse(text);
  } catch (e) {
    return { raw: text };
  }
}

export async function getDrawnBalls(bcode) {
  if (!bcode) throw new Error('Missing bcode');
  const url = `${BASE}/getball.php?bcode=${encodeURIComponent(bcode)}`;
  const text = await getText(url);
  try {
    const parsed = JSON.parse(text);
    // Assume API returns { balls: [...] } or similar structure
    if (Array.isArray(parsed)) return parsed;
    if (parsed && Array.isArray(parsed.balls)) return parsed.balls;
    return [];
  } catch {
    return [];
  }
}

export async function getGameboard(bcode) {
  if (!bcode) throw new Error('Missing bcode');
  const url = `http://www.hyeumine.com/bingodashboard.php?bcode=${encodeURIComponent(bcode)}`;
  const text = await getText(url);
  
  try {
    // Try parsing as JSON first
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed;
    if (parsed && Array.isArray(parsed.balls)) return parsed.balls;
    if (parsed && Array.isArray(parsed.drawn)) return parsed.drawn;
    if (parsed && Array.isArray(parsed.numbers)) return parsed.numbers;
    return [];
  } catch {
    // If not JSON, try to extract numbers from HTML
    // Look for patterns like data-number="42" or class containing numbers
    const numberMatches = text.match(/data-number="(\d+)"/gi);
    if (numberMatches) {
      return numberMatches.map(m => {
        const regex = /(\d+)/;
        const num = regex.exec(m);
        return num ? Number.parseInt(num[0], 10) : null;
      }).filter(n => n !== null);
    }
    
    // Alternative: look for highlighted/called balls in various HTML structures
    const highlightMatches = text.match(/class=".*?called.*?">(\d+)</gi);
    if (highlightMatches) {
      return highlightMatches.map(m => {
        const regex = /(\d+)/;
        const num = regex.exec(m);
        return num ? Number.parseInt(num[0], 10) : null;
      }).filter(n => n !== null);
    }
    
    // Last resort: extract all numbers that appear in numeric patterns
    const allNumbers = text.match(/\b([1-9]|[1-8]\d|9\d)\b/g);
    return allNumbers ? [...new Set(allNumbers.map(n => Number.parseInt(n, 10)))].sort((a, b) => a - b) : [];
  }
}

export default {
  fetchCard,
  checkWin,
  getDrawnBalls,
  getGameboard,
};
