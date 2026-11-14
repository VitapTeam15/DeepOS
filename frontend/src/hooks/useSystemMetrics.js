import { useState, useEffect } from 'react';

export function useSystemMetrics() {
  const [metrics, setMetrics] = useState(null);
  const [history, setHistory] = useState([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let ws;
    let reconnectTimer;
    const connect = () => {
      ws = new WebSocket(`ws://127.0.0.1:8000/ws`);
      ws.onopen = () => setConnected(true);
      ws.onmessage = (e) => {
        const rawData = JSON.parse(e.data);
        if (rawData.type === 'metrics' && rawData.data) {
          const mappedData = {
            ...rawData,
            cpu: rawData.data.cpu_percent,
            ram: rawData.data.memory_percent,
            disk: rawData.data.disk_percent,
            timestamp: rawData.data.timestamp || new Date().toISOString()
          };
          setMetrics(mappedData);
          setHistory(prev => [...prev.slice(-59), mappedData]);
        }
      };
      ws.onclose = () => {
        setConnected(false);
        reconnectTimer = setTimeout(connect, 2000);
      };
    };
    connect();
    return () => { clearTimeout(reconnectTimer); if(ws) ws.close(); };
  }, []);

  return { metrics, history, connected };
}