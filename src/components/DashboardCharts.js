import React, { useMemo } from 'react';

// Vertical Dual Bar Chart matching Siohioma Revenue Chart
function VerticalDualBarChart({ leads }) {
  // Aggregate revenue won vs pending per city
  const cityData = useMemo(() => {
    const cities = {};
    leads.forEach(lead => {
      const city = lead.city || 'Other';
      if (!cities[city]) {
        cities[city] = { won: 0, pending: 0 };
      }
      if (lead.status === 'Contract Won') {
        cities[city].won += lead.deal_value || 0;
      } else {
        cities[city].pending += lead.deal_value || 0;
      }
    });

    // Take top 5 cities by total value
    return Object.keys(cities)
      .map(city => ({
        city,
        won: cities[city].won,
        pending: cities[city].pending,
        total: cities[city].won + cities[city].pending
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [leads]);

  // Max value to scale height
  const maxVal = useMemo(() => {
    const values = cityData.map(c => Math.max(c.won, c.pending));
    const highest = Math.max(...values, 10000);
    return highest * 1.1; // Add 10% padding
  }, [cityData]);

  // Overall Total Won Revenue for header
  const totalWonRevenue = useMemo(() => {
    return leads
      .filter(l => l.status === 'Contract Won')
      .reduce((sum, l) => sum + (l.deal_value || 0), 0);
  }, [leads]);

  // SVG dimensions
  const svgWidth = 500;
  const svgHeight = 280;
  const paddingLeft = 60;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 40;

  const chartHeight = svgHeight - paddingTop - paddingBottom;
  const chartWidth = svgWidth - paddingLeft - paddingRight;

  const getBarHeight = (val) => (val / maxVal) * chartHeight;

  return (
    <div className="card" style={{ flexGrow: 1 }}>
      <div className="card-title-area" style={{ marginBottom: '0.75rem' }}>
        <h3>Revenue</h3>
        <div className="chart-legend-indicator">
          <div className="legend-item">
            <span className="legend-dot income"></span>
            <span>Won</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot expenses"></span>
            <span>Pending</span>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '1.25rem' }}>
        <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          {new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0
          }).format(totalWonRevenue)}
        </span>
        <span className="trend-up" style={{ fontSize: '0.82rem', fontWeight: 700, marginLeft: '0.5rem' }}>
          ↑ +35% <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>from last month</span>
        </span>
      </div>

      <div style={{ position: 'relative', height: `${svgHeight}px` }}>
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} style={{ width: '100%', height: '100%' }}>
          {/* Y Axis Grid Lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
            const yPos = paddingTop + (1 - ratio) * chartHeight;
            const valueLabel = Math.round(ratio * maxVal);
            return (
              <g key={index}>
                <line
                  x1={paddingLeft}
                  y1={yPos}
                  x2={svgWidth - paddingRight}
                  y2={yPos}
                  className="chart-line-grid"
                />
                <text
                  x={paddingLeft - 10}
                  y={yPos + 4}
                  textAnchor="end"
                  style={{ fontSize: '10px', fill: 'var(--text-secondary)' }}
                >
                  ${(valueLabel / 1000).toFixed(0)}K
                </text>
              </g>
            );
          })}

          {/* Render paired bars for each city */}
          {cityData.map((item, index) => {
            const colWidth = chartWidth / cityData.length;
            const groupCenterX = paddingLeft + index * colWidth + colWidth / 2;
            const barWidth = 14;
            const spacing = 4;

            // X-coordinates for the dual bars
            const leftBarX = groupCenterX - barWidth - spacing / 2;
            const rightBarX = groupCenterX + spacing / 2;

            // Y-coordinates and heights
            const leftHeight = getBarHeight(item.won);
            const rightHeight = getBarHeight(item.pending);

            const leftY = paddingTop + chartHeight - leftBarX; // placeholder for calc
            const actualLeftY = paddingTop + chartHeight - leftHeight;
            const actualRightY = paddingTop + chartHeight - rightHeight;

            return (
              <g key={item.city} className="chart-bar-group">
                {/* City Label */}
                <text
                  x={groupCenterX}
                  y={svgHeight - paddingBottom + 18}
                  textAnchor="middle"
                  style={{ fontSize: '10px', fontWeight: 600, fill: 'var(--text-secondary)' }}
                >
                  {item.city.length > 10 ? `${item.city.substring(0, 8)}...` : item.city}
                  <title>{item.city}</title>
                </text>

                {/* Left Bar (Won Revenue - Dark Green) */}
                <rect
                  x={leftBarX}
                  y={actualLeftY}
                  width={barWidth}
                  height={Math.max(leftHeight, 2)}
                  rx={4}
                  fill="var(--sidebar-bg)"
                  className="chart-filled-bar"
                >
                  <title>Won: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(item.won)}</title>
                </rect>

                {/* Right Bar (Pending Revenue - Lime Green) */}
                <rect
                  x={rightBarX}
                  y={actualRightY}
                  width={barWidth}
                  height={Math.max(rightHeight, 2)}
                  rx={4}
                  fill="var(--sidebar-accent)"
                  className="chart-filled-bar"
                >
                  <title>Pending: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(item.pending)}</title>
                </rect>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

// Horizontal Single Bar Chart matching Siohioma Sales Report
function HorizontalSingleBarChart({ leads }) {
  // Aggregate pipelines status count
  const stats = useMemo(() => {
    const totalLeads = leads.length;
    let wonCount = 0;
    let wonRevenue = 0;
    let lostCount = 0;

    leads.forEach(l => {
      if (l.status === 'Contract Won') {
        wonCount++;
        wonRevenue += l.deal_value || 0;
      } else if (l.status === 'Contract Lost') {
        lostCount++;
      }
    });

    const formattedRevenue = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(wonRevenue);

    return [
      { label: 'Won', value: wonCount, displayLabel: `Contracts Won (${wonCount}) - ${formattedRevenue}` },
      { label: 'Lost', value: lostCount, displayLabel: `Contracts Lost (${lostCount})` },
      { label: 'Total', value: totalLeads, displayLabel: `Total Leads (${totalLeads})` }
    ];
  }, [leads]);

  // Max value to scale bars
  const maxVal = useMemo(() => {
    const highest = Math.max(...stats.map(s => s.value), 10);
    return highest * 1.15;
  }, [stats]);

  // SVG Dimensions
  const svgWidth = 500;
  const svgHeight = 220;
  const paddingLeft = 190;
  const paddingRight = 40;
  const paddingTop = 20;
  const paddingBottom = 30;

  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  return (
    <div className="card" style={{ flexGrow: 1 }}>
      <div className="card-title-area" style={{ marginBottom: '1.25rem' }}>
        <h3>Sales Report</h3>
        <span className="dots-menu">•••</span>
      </div>

      <div style={{ position: 'relative', height: `${svgHeight}px` }}>
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} style={{ width: '100%', height: '100%' }}>
          
          {/* X Axis Grid Lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
            const xPos = paddingLeft + ratio * chartWidth;
            const gridVal = Math.round(ratio * maxVal);
            return (
              <g key={index}>
                <line
                  x1={xPos}
                  y1={paddingTop}
                  x2={xPos}
                  y2={svgHeight - paddingBottom}
                  className="chart-line-grid"
                />
                <text
                  x={xPos}
                  y={svgHeight - paddingBottom + 16}
                  textAnchor="middle"
                  style={{ fontSize: '9px', fill: 'var(--text-secondary)', fontWeight: 600 }}
                >
                  {gridVal}
                </text>
              </g>
            );
          })}

          {/* Render horizontal bars */}
          {stats.map((item, index) => {
            const barSpacing = 16;
            const barHeight = 24;
            const yPos = paddingTop + index * (barHeight + barSpacing) + 8;
            const barWidth = (item.value / maxVal) * chartWidth;

            return (
              <g key={item.label} className="chart-bar-group">
                {/* Label left of bar */}
                <text
                  x={paddingLeft - 10}
                  y={yPos + barHeight / 2 + 4}
                  textAnchor="end"
                  style={{ fontSize: '10px', fontWeight: 600, fill: 'var(--text-secondary)' }}
                >
                  {item.displayLabel}
                </text>

                {/* Track background */}
                <rect
                  x={paddingLeft}
                  y={yPos}
                  width={chartWidth}
                  height={barHeight}
                  rx={6}
                  fill="#f1f5f9"
                />

                {/* Filled bar (lime green matching Siohioma) */}
                <rect
                  x={paddingLeft}
                  y={yPos}
                  width={Math.max(barWidth, 4)}
                  height={barHeight}
                  rx={6}
                  fill="#a3e635"
                  className="chart-filled-bar"
                >
                  <title>{item.label}: {item.value}</title>
                </rect>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

export default function DashboardCharts({ leads }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <VerticalDualBarChart leads={leads} />
      <HorizontalSingleBarChart leads={leads} />
    </div>
  );
}
