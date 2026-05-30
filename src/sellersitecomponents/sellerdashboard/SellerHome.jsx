import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { FaBuilding, FaMoneyBillWave, FaLock, FaCreditCard, FaChartLine, FaSpinner, FaHome, FaExclamationTriangle } from 'react-icons/fa';
import '../../componentstyles/sellerdashboardstyles/SellerHome.css';
import BaseUrl from '../../utils/AppConstants';

export default function SellerHome() {
  const canvasRef = useRef(null);
  const [stats, setStats] = useState([
    { label: 'Spaces', value: '0', icon: <FaBuilding /> },
    { label: 'Total Earnings', value: 'PKR 0', icon: <FaMoneyBillWave /> },
    { label: 'Escrow Amount', value: 'PKR 0', icon: <FaLock /> },
    { label: 'Total Available', value: 'PKR 0', icon: <FaCreditCard /> },
  ]);
  const [chartData, setChartData] = useState([0, 0, 0, 0, 0]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get auth token
  const getAuthToken = () => localStorage.getItem('token');

  // Fetch spaces data
  const fetchSpacesData = async () => {
    try {
      const token = getAuthToken();
      const response = await axios.get(`${BaseUrl}api/spaces/owner/my-spaces`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success) {
        const spaces = response.data.spaces || [];
        const spaceCount = spaces.length;

        // Calculate total capacity from all spaces
        let totalCapacity = 0;
        let totalUnits = 0;
        
        spaces.forEach(space => {
          totalCapacity += space.total_capacity || 0;
          totalUnits += space.units?.length || 0;
        });

        // Update stats with real data
        setStats([
          { label: 'Spaces', value: spaceCount.toString(), icon: <FaBuilding /> },
          { label: 'Total Earnings', value: 'PKR 0', icon: <FaMoneyBillWave /> },
          { label: 'Escrow Amount', value: 'PKR 0', icon: <FaLock /> },
          { label: 'Total Available', value: 'PKR 0', icon: <FaCreditCard /> },
        ]);

        // Update chart data
        setChartData([spaceCount, totalUnits, totalCapacity, 0, 0]);
      } else {
        setError(response.data.message || 'Failed to load spaces');
      }
    } catch (err) {
      console.error('Failed to fetch spaces:', err);
      setError(err.response?.data?.message || 'Failed to load spaces data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch earnings data
  const fetchEarningsData = async () => {
    try {
      const token = getAuthToken();
    
    } catch (err) {
      console.error('Failed to fetch earnings:', err);
    }
  };

  useEffect(() => {
    Promise.all([fetchSpacesData(), fetchEarningsData()]);
  }, []);

  // Draw chart when data changes
  useEffect(() => {
    if (!loading) {
      drawChart();
    }
  }, [chartData, loading]);

  const drawChart = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const W = canvas.offsetWidth;
    const H = canvas.offsetHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    const chartLabels = ['Spaces', 'Units', 'Capacity', 'Earnings', 'Available'];
    const pL = 50, pR = 20, pT = 20, pB = 60;
    const cW = W - pL - pR;
    const cH = H - pT - pB;
    const maxDataValue = Math.max(...chartData, 1);
    const barW = (cW / chartLabels.length) * 0.5;
    const gap = cW / chartLabels.length;

    ctx.clearRect(0, 0, W, H);

    // Draw grid lines
    for (let i = 0; i <= 4; i++) {
      const y = pT + cH - (i / 4) * cH;
      ctx.strokeStyle = 'rgba(0,0,0,0.07)';
      ctx.setLineDash([5, 4]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(pL, y);
      ctx.lineTo(pL + cW, y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'right';
      const value = Math.round((i / 4) * maxDataValue);
      ctx.fillText(value, pL - 8, y + 4);
    }

    // Draw bars with gradient
    chartLabels.forEach((label, i) => {
      const x = pL + i * gap + (gap - barW) / 2;
      const barH = (chartData[i] / maxDataValue) * cH;
      const y = pT + cH - (barH > 0 ? barH : 0);
      
      // Gradient fill
      const gradient = ctx.createLinearGradient(x, y, x, y + barH);
      gradient.addColorStop(0, '#011CCD');
      gradient.addColorStop(1, '#667eea');
      ctx.fillStyle = gradient;
      
      ctx.beginPath();
      ctx.roundRect(x, y, barW, barH > 0 ? barH : 2, 6);
      ctx.fill();

      // Add value on top of bar
      if (barH > 5) {
        ctx.fillStyle = '#1f2937';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        let displayValue = chartData[i];
        if (label === 'Earnings' || label === 'Available') {
          displayValue = `PKR ${displayValue.toLocaleString()}`;
        }
        ctx.fillText(displayValue, x + barW / 2, y - 5);
      }

      // Draw label
      ctx.fillStyle = '#4b5563';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(label, x + barW / 2, pT + cH + 20);
    });
  };

  // Helper for rounded rectangle
  if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
      if (w < 2 * r) r = w / 2;
      if (h < 2 * r) r = h / 2;
      this.moveTo(x + r, y);
      this.lineTo(x + w - r, y);
      this.quadraticCurveTo(x + w, y, x + w, y + r);
      this.lineTo(x + w, y + h - r);
      this.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      this.lineTo(x + r, y + h);
      this.quadraticCurveTo(x, y + h, x, y + h - r);
      this.lineTo(x, y + r);
      this.quadraticCurveTo(x, y, x + r, y);
      return this;
    };
  }

  if (loading) {
    return (
      <main className="sh__main">
        <div className="sh__loading">
          <FaSpinner className="sh__spinner-icon" />
          <p>Loading dashboard data...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="sh__main">
        <div className="sh__error">
          <FaExclamationTriangle className="sh__error-icon" />
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="sh__retry-btn">
            <FaHome /> Try Again
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="sh__main">
      <h1 className="sh__title">Welcome To Seller Dashboard!</h1>

      <div className="sh__stats">
        {stats.map((s) => (
          <div key={s.label} className="sh__stat-card">
            <div className="sh__stat-icon">{s.icon}</div>
            <div className="sh__stat-content">
              <div className="sh__stat-label">{s.label}</div>
              <div className="sh__stat-val">{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      <h2 className="sh__section-title">
        <FaChartLine /> Overview
      </h2>
      <div className="sh__chart-wrap">
        <canvas ref={canvasRef} className="sh__chart" />
      </div>
    </main>
  );
}