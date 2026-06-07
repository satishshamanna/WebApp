'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import DashboardCharts from '@/components/DashboardCharts';

export default function Home() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Layout Tab State ('overview' or 'leads')
  const [activeTab, setActiveTab] = useState('overview');

  // Filters State
  const [minRating, setMinRating] = useState(0);
  const [maxRating, setMaxRating] = useState(5);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedServices, setSelectedServices] = useState([]);
  
  // Search Filter
  const [searchQuery, setSearchQuery] = useState('');

  // Dropdown / Popover UI states
  const [showFilterPopover, setShowFilterPopover] = useState(false);
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
  const [serviceMenuOpen, setServiceMenuOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Add Lead Form State
  const [newLead, setNewLead] = useState({
    name: '',
    service: 'Plumbing',
    address: '',
    deal_value: '',
    rating: '4.0',
    status: 'lead'
  });

  const filterPopoverRef = useRef(null);
  const serviceDropdownRef = useRef(null);

  // Fetch leads on mount
  useEffect(() => {
    async function fetchLeads() {
      try {
        setLoading(true);
        const res = await fetch('/api/leads');
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to fetch leads');
        }
        const data = await res.json();
        setLeads(data.leads || []);
      } catch (err) {
        console.error('Error fetching leads:', err);
        setError(err.message || 'An unexpected error occurred while loading dashboard.');
      } finally {
        setLoading(false);
      }
    }
    fetchLeads();
  }, []);

  // Close popovers/dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (filterPopoverRef.current && !filterPopoverRef.current.contains(event.target)) {
        setShowFilterPopover(false);
      }
      if (serviceDropdownRef.current && !serviceDropdownRef.current.contains(event.target)) {
        setServiceMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Get unique list of services from all leads
  const uniqueServices = useMemo(() => {
    const services = leads.map(l => l.service);
    return Array.from(new Set(services)).sort();
  }, [leads]);

  // Handle toggling service selection
  const toggleService = (service) => {
    setSelectedServices(prev => {
      if (prev.includes(service)) {
        return prev.filter(s => s !== service);
      } else {
        return [...prev, service];
      }
    });
  };

  const resetFilters = () => {
    setMinRating(0);
    setMaxRating(5);
    setStartDate('');
    setEndDate('');
    setSelectedServices([]);
    setSearchQuery('');
  };

  // Filter logic
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      // 1. Search Query Filter
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const matchesName = lead.name && lead.name.toLowerCase().includes(query);
        const matchesCity = lead.city && lead.city.toLowerCase().includes(query);
        const matchesService = lead.service && lead.service.toLowerCase().includes(query);
        if (!matchesName && !matchesCity && !matchesService) return false;
      }

      // 2. Rating Filter
      const rating = lead.rating !== null ? lead.rating : 0;
      if (rating < minRating || rating > maxRating) return false;

      // 3. Date Range Filter
      if (startDate && lead.date_created && lead.date_created < startDate) return false;
      if (endDate && lead.date_created && lead.date_created > endDate) return false;

      // 4. Service Filter
      if (selectedServices.length > 0 && !selectedServices.includes(lead.service)) return false;

      return true;
    });
  }, [leads, minRating, maxRating, startDate, endDate, selectedServices, searchQuery]);

  // Metrics calculations
  const metrics = useMemo(() => {
    const totalLeads = filteredLeads.length;
    let totalRevenue = 0;
    let contractsWon = 0;

    filteredLeads.forEach(lead => {
      if (lead.status === 'Contract Won') {
        contractsWon += 1;
        totalRevenue += lead.deal_value;
      }
    });

    const convRate = totalLeads > 0 ? (contractsWon / totalLeads) * 100 : 0;

    return {
      totalLeads,
      totalRevenue,
      contractsWon,
      convRate
    };
  }, [filteredLeads]);

  // Recent leads list (top 8 leads sorted by date or simply sliced from leads)
  const recentLeads = useMemo(() => {
    return [...filteredLeads]
      .sort((a, b) => {
        if (!a.date_created) return 1;
        if (!b.date_created) return -1;
        return new Date(b.date_created) - new Date(a.date_created);
      })
      .slice(0, 8);
  }, [filteredLeads]);

  // Lead service distribution for donut chart
  const serviceDistribution = useMemo(() => {
    const counts = {};
    filteredLeads.forEach(lead => {
      const service = lead.service || 'Other';
      counts[service] = (counts[service] || 0) + 1;
    });
    const total = filteredLeads.length || 1;
    return Object.keys(counts).map(service => ({
      name: service,
      count: counts[service],
      percentage: Math.round((counts[service] / total) * 100)
    })).sort((a, b) => b.count - a.count).slice(0, 3);
  }, [filteredLeads]);

  // Handle adding mock lead locally
  const handleAddLeadSubmit = (e) => {
    e.preventDefault();
    if (!newLead.name) return;

    // Helper to get city from address
    const getCityFromAddress = (addr) => {
      if (!addr) return 'Bengaluru';
      const parts = addr.split(',').map(p => p.trim());
      if (parts.length >= 2) return parts[parts.length - 2] || 'Bengaluru';
      return parts[0] || 'Bengaluru';
    };

    const added = {
      id: `mock-${Date.now()}`,
      name: newLead.name,
      service: newLead.service,
      address: newLead.address || 'MG Road, Bengaluru',
      city: getCityFromAddress(newLead.address),
      website: '',
      rating: parseFloat(newLead.rating) || 4.0,
      email: 'contact@' + newLead.name.toLowerCase().replace(/\s+/g, '') + '.com',
      phone: '+91 99999 88888',
      date_created: new Date().toISOString().split('T')[0],
      deal_value: parseFloat(newLead.deal_value) || 0,
      status: newLead.status
    };

    setLeads(prev => [added, ...prev]);
    setShowAddLeadModal(false);
    setNewLead({
      name: '',
      service: 'Plumbing',
      address: '',
      deal_value: '',
      rating: '4.0',
      status: 'lead'
    });
  };

  if (loading) {
    return (
      <div className="spinner-container">
        <div className="custom-spinner"></div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', fontWeight: 600 }}>
          Fetching lead analytics from Airtable...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container glass-card" style={{ margin: '10% auto', background: '#fff' }}>
        <svg style={{ width: '3rem', height: '3rem', fill: 'var(--danger)', marginBottom: '1rem' }} viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
        </svg>
        <h3>Configuration or Fetch Error</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>{error}</p>
        <button className="btn-primary" onClick={() => window.location.reload()}>Retry Connection</button>
      </div>
    );
  }

  return (
    <div className="dashboard-wrapper">
      {/* Mobile Sidebar overlay */}
      {mobileSidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setMobileSidebarOpen(false)}></div>
      )}

      {/* ========================== LEFT SIDEBAR ========================== */}
      <aside className={`sidebar ${mobileSidebarOpen ? 'mobile-open' : ''}`}>
        {/* Mobile close button */}
        <button className="mobile-sidebar-close" onClick={() => setMobileSidebarOpen(false)}>
          <svg viewBox="0 0 24 24">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
        <div className="sidebar-brand">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ borderRadius: '8px' }}>
            <rect width="32" height="32" fill="var(--sidebar-accent)"/>
            <text x="16" y="21" textAnchor="middle" fill="var(--sidebar-bg)" style={{ fontWeight: 800, fontSize: '13px', fontFamily: 'var(--font-family)' }}>NS</text>
          </svg>
          <span style={{ fontSize: '1.05rem', fontWeight: 700, lineHeight: 1.2 }}>Niyati & Sanjana AI Consultants LLP</span>
        </div>

        <div className="sidebar-menu-section">
          <h3 className="sidebar-menu-title">Menu</h3>
          <ul className="sidebar-menu">
            <li 
              className={`sidebar-item ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <svg viewBox="0 0 24 24">
                <path d="M4 13h6c.55 0 1-.45 1-1V4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v8c0 .55.45 1 1 1zm0 8h6c.55 0 1-.45 1-1v-4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v4c0 .55.45 1 1 1zm10 0h6c.55 0 1-.45 1-1v-8c0-.55-.45-1-1-1h-6c-.55 0-1 .45-1 1v8c0 .55.45 1 1 1zM13 4v4c0 .55.45 1 1 1h6c.55 0 1-.45 1-1V4c0-.55-.45-1-1-1h-6c-.55 0-1 .45-1 1z"/>
              </svg>
              <span>Overview</span>
            </li>
            <li 
              className="sidebar-item" 
              onClick={() => setActiveTab('overview')}
            >
              <svg viewBox="0 0 24 24">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
              </svg>
              <span>Statistics</span>
            </li>
            <li 
              className={`sidebar-item ${activeTab === 'leads' ? 'active' : ''}`}
              onClick={() => setActiveTab('leads')}
            >
              <svg viewBox="0 0 24 24">
                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
              </svg>
              <span>Customers</span>
            </li>
            <li 
              className={`sidebar-item ${activeTab === 'leads' ? 'active' : ''}`}
              onClick={() => setActiveTab('leads')}
            >
              <svg viewBox="0 0 24 24">
                <path d="M19 14V6c0-1.1-.9-2-2-2H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zm-2-8v8H3V6h14zm4 10v-8h-2v8H5v2c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-2h-2z"/>
              </svg>
              <span>Transactions</span>
              <span className="sidebar-item-badge">{metrics.totalLeads}</span>
            </li>
          </ul>
        </div>

        <div className="sidebar-menu-section">
          <h3 className="sidebar-menu-title">General</h3>
          <ul className="sidebar-menu">
            <li className="sidebar-item" onClick={() => setActiveTab('leads')}>
              <svg viewBox="0 0 24 24">
                <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
              </svg>
              <span>Settings</span>
            </li>
            <li className="sidebar-item" onClick={() => setActiveTab('overview')}>
              <svg viewBox="0 0 24 24">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
              </svg>
              <span>Security</span>
            </li>
          </ul>
        </div>

        <div className="sidebar-users-container" style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1rem' }}>
          {/* Niyati Satish */}
          <div className="sidebar-user" style={{ borderTop: 'none', padding: 0 }}>
            <div className="user-avatar" style={{ background: '#111827', border: '1px solid #1f2937', boxShadow: '0 0 10px rgba(255,255,255,0.1)', flexShrink: 0 }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="12" fill="#111827"/>
                <text x="12" y="16" textAnchor="middle" fill="#ffffff" style={{ fontWeight: 800, fontSize: '11px', fontFamily: 'var(--font-family)' }}>N</text>
              </svg>
            </div>
            <div className="user-info">
              <span className="user-name">Niyati Satish</span>
              <span className="user-email" title="niyatisatish416@gmail.com">niyatisatish416@gmail.com</span>
            </div>
          </div>

          {/* Sanjana Satish */}
          <div className="sidebar-user" style={{ borderTop: 'none', padding: 0 }}>
            <div className="user-avatar" style={{ background: '#111827', border: '1px solid #1f2937', boxShadow: '0 0 10px rgba(255,255,255,0.1)', flexShrink: 0 }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="12" fill="#111827"/>
                <text x="12" y="16" textAnchor="middle" fill="#ffffff" style={{ fontWeight: 800, fontSize: '11px', fontFamily: 'var(--font-family)' }}>S</text>
              </svg>
            </div>
            <div className="user-info">
              <span className="user-name">Sanjana Satish</span>
              <span className="user-email" title="sanjanasatish416@gmail.com">sanjanasatish416@gmail.com</span>
            </div>
          </div>
        </div>
      </aside>

      {/* ========================== MAIN CONTENT AREA ========================== */}
      <main className="main-content">
        {/* Top Header */}
        <header className="top-header">
          <div className="header-left">
            <button 
              className="mobile-menu-toggle" 
              onClick={() => setMobileSidebarOpen(prev => !prev)}
            >
              <svg viewBox="0 0 24 24">
                <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
              </svg>
            </button>
            <span className="header-role-name">Sales Admin</span>
            <svg style={{ width: '18px', height: '18px', fill: 'var(--text-secondary)' }} viewBox="0 0 24 24">
              <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
            </svg>
          </div>

          <div className="header-search-container">
            <svg className="search-icon" viewBox="0 0 24 24">
              <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
            <input 
              type="text" 
              className="search-input" 
              placeholder="Search leads, cities, or services..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="header-right">
            <div className="header-btn-icon">
              <svg viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H7c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.04-.42 1.99-1.07 2.75z"/>
              </svg>
            </div>
            
            <button className="btn-primary" onClick={() => setShowAddLeadModal(true)}>
              <svg viewBox="0 0 24 24">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
              </svg>
              <span>Add new lead</span>
            </button>
          </div>
        </header>

        {/* Dashboard Scroll Body */}
        <div className="content-body">
          {/* Header row inside content body */}
          <div className="dashboard-heading">
            <div>
              <h2>Dashboard</h2>
              <p>Manage and analyze leads with care and precision.</p>
            </div>

            {/* Collapsible Filter Trigger & Popover */}
            <div style={{ position: 'relative' }} ref={filterPopoverRef}>
              <div 
                className="date-selector-trigger" 
                onClick={() => setShowFilterPopover(prev => !prev)}
              >
                <svg viewBox="0 0 24 24">
                  <path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"/>
                </svg>
                <span>
                  {startDate || endDate 
                    ? `${startDate || '2020'} to ${endDate || '2030'}` 
                    : 'Filter Date / Service'}
                </span>
                <svg style={{ width: '12px', height: '12px', marginLeft: '4px' }} viewBox="0 0 24 24">
                  <path d="M7 10l5 5 5-5H7z" />
                </svg>
              </div>

              {/* Filter Popover Form */}
              {showFilterPopover && (
                <div className="filter-dropdown-popover">
                  <div className="filter-section-title">Filters</div>
                  
                  {/* Service filter */}
                  <div className="filter-input-row">
                    <span className="filter-input-label">Services</span>
                    <div className="filter-multiselect-list">
                      {uniqueServices.map(service => (
                        <label key={service} className="filter-multiselect-item">
                          <input
                            type="checkbox"
                            className="filter-checkbox"
                            checked={selectedServices.includes(service)}
                            onChange={() => toggleService(service)}
                          />
                          <span>{service}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Date Range inputs */}
                  <div className="filter-input-row">
                    <span className="filter-input-label">Created Date Range</span>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input
                        type="date"
                        className="search-input"
                        style={{ padding: '0.4rem 0.75rem' }}
                        value={startDate}
                        min="2020-01-01"
                        max="2030-12-31"
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                      <input
                        type="date"
                        className="search-input"
                        style={{ padding: '0.4rem 0.75rem' }}
                        value={endDate}
                        min="2020-01-01"
                        max="2030-12-31"
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Rating range */}
                  <div className="filter-input-row">
                    <span className="filter-input-label">Rating: {minRating} - {maxRating}</span>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Min</span>
                        <input
                          type="range"
                          min="0"
                          max="5"
                          step="0.1"
                          value={minRating}
                          onChange={(e) => setMinRating(parseFloat(e.target.value))}
                          style={{ width: '100%', accentColor: 'var(--sidebar-bg)' }}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Max</span>
                        <input
                          type="range"
                          min="0"
                          max="5"
                          step="0.1"
                          value={maxRating}
                          onChange={(e) => setMaxRating(parseFloat(e.target.value))}
                          style={{ width: '100%', accentColor: 'var(--sidebar-bg)' }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Reset button */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                    <button 
                      className="btn-secondary" 
                      style={{ width: 'auto', padding: '0.4rem 1rem' }} 
                      onClick={resetFilters}
                    >
                      Reset Filters
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tab Content Router */}
          {activeTab === 'overview' ? (
            <>
              {/* ========================== THREE TOP KPI CARDS ========================== */}
              <section className="top-kpis-grid">
                {/* 1. Siohioma Green Update Card */}
                <div className="card kpi-update-card">
                  <div className="update-badge">Update</div>
                  <div className="update-text">
                    Sales revenue increased by <span>+15%</span> this month.
                  </div>
                  <div className="update-date">Updated just now</div>
                  <a href="#stats" className="update-link" onClick={(e) => { e.preventDefault(); setActiveTab('leads'); }}>
                    See Statistics &gt;
                  </a>
                </div>

                {/* 2. Net Income (Total Revenue) Card */}
                <div className="card metric-card">
                  <div className="metric-card-header">
                    <span className="metric-card-title">Net Income</span>
                    <span className="dots-menu">•••</span>
                  </div>
                  <div className="metric-card-value">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                      maximumFractionDigits: 0
                    }).format(metrics.totalRevenue)}
                  </div>
                  <div className="metric-card-trend trend-up">
                    <span>↑ +35%</span>
                    <span className="trend-subtext">from last month</span>
                  </div>
                </div>

                {/* 3. Conversion Rate / Return Card */}
                <div className="card metric-card">
                  <div className="metric-card-header">
                    <span className="metric-card-title">Conversion Rate</span>
                    <span className="dots-menu">•••</span>
                  </div>
                  <div className="metric-card-value">
                    {metrics.convRate.toFixed(1)}%
                  </div>
                  <div className="metric-card-trend trend-up">
                    <span>↑ +2.4%</span>
                    <span className="trend-subtext">won contracts ({metrics.contractsWon} won)</span>
                  </div>
                </div>
              </section>

              {/* ========================== MAIN GRID (3 COLUMNS) ========================== */}
              <section className="dashboard-grid-layout">
                
                {/* COLUMN 1: TRANSACTION LEADS LIST */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                  <div className="card-title-area">
                    <h3>Recent Leads</h3>
                    <span className="dots-menu">•••</span>
                  </div>
                  <div className="transaction-list">
                    {recentLeads.length === 0 ? (
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '2rem 0' }}>
                        No leads found
                      </p>
                    ) : (
                      recentLeads.map(lead => (
                        <div key={lead.id} className="transaction-item">
                          <div className="item-icon-wrapper">
                            {lead.name.substring(0, 1).toUpperCase()}
                          </div>
                          <div className="item-details">
                            <span className="item-name" title={lead.name}>{lead.name}</span>
                            <span className="item-meta">{lead.date_created || 'N/A'}</span>
                          </div>
                          <div className="item-status-value">
                            <span className="item-deal-value">
                              {lead.deal_value > 0 
                                ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(lead.deal_value)
                                : '-'
                              }
                            </span>
                            <span className={`item-status-badge ${lead.status === 'Contract Won' ? 'status-completed' : 'status-pending'}`}>
                              {lead.status === 'Contract Won' ? 'Completed' : 'Pending'}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* COLUMN 2: ANALYTICS BAR CHARTS */}
                <div className="analytics-column">
                  <DashboardCharts leads={filteredLeads} />
                </div>

                {/* COLUMN 3: DONUT & PROMO */}
                <div className="right-column">
                  
                  {/* Total View Performance Card */}
                  <div className="card">
                    <div className="card-title-area">
                      <h3>Service Share</h3>
                    </div>
                    
                    <div className="donut-chart-container">
                      {/* SVG Donut Chart */}
                      <svg width="180" height="180" viewBox="0 0 180 180">
                        {/* Circular Donut Slices */}
                        <circle cx="90" cy="90" r="70" fill="transparent" stroke="#051d13" strokeWidth="20" strokeDasharray="300 440" strokeDashoffset="0" />
                        <circle cx="90" cy="90" r="70" fill="transparent" stroke="#55c32b" strokeWidth="20" strokeDasharray="100 440" strokeDashoffset="-300" />
                        <circle cx="90" cy="90" r="70" fill="transparent" stroke="#f97316" strokeWidth="20" strokeDasharray="40 440" strokeDashoffset="-400" />
                      </svg>
                      
                      <div className="donut-center-label">
                        <span className="donut-center-sub">Total</span>
                        <span className="donut-center-val">{metrics.totalLeads}</span>
                      </div>
                    </div>

                    <p className="donut-tip-text">
                      Distribution of top services based on leads.
                    </p>

                    <button className="btn-secondary" onClick={() => setActiveTab('leads')}>
                      Guide Views
                    </button>

                    <div className="donut-legend-row">
                      {serviceDistribution.map((item, idx) => {
                        const colors = ['#051d13', '#55c32b', '#f97316'];
                        return (
                          <div key={item.name} className="donut-legend-item">
                            <span className="donut-legend-dot" style={{ background: colors[idx] || '#cbd5e1' }}></span>
                            <span>{item.name.substring(0, 10)} ({item.percentage}%)</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Promo Siohioma Yellow Banner */}
                  <div className="card promo-banner-card">
                    <h3 className="promo-title">Level up your sales managing to the next level.</h3>
                    <p className="promo-desc">Analyze conversion rates and close deal pipelines with care and precision.</p>
                    <button className="btn-promo" onClick={() => alert('Niyati & Sanjana AI Consultants LLP Pro Upgrade Coming Soon!')}>
                      Update to Niyati & Sanjana+
                    </button>
                  </div>

                </div>

              </section>
            </>
          ) : (
            /* ========================== LEADS TABLE TAB VIEW ========================== */
            <section className="table-section-card">
              <div className="table-controls-row">
                <div>
                  <h3>Lead Records Directory</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                    {filteredLeads.length} leads matching filters
                  </p>
                </div>
                <div>
                  <button 
                    className="btn-secondary" 
                    style={{ width: 'auto', padding: '0.5rem 1rem' }} 
                    onClick={resetFilters}
                  >
                    Clear Search & Filters
                  </button>
                </div>
              </div>

              <div className="leads-table-container">
                {filteredLeads.length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '4rem 0' }}>
                    No leads found matching current criteria.
                  </div>
                ) : (
                  <table className="leads-table">
                    <thead>
                      <tr>
                        <th>Business Name</th>
                        <th>Service</th>
                        <th>City</th>
                        <th>Rating</th>
                        <th>Deal Value</th>
                        <th>Date Created</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLeads.map(lead => (
                        <tr key={lead.id}>
                          <td style={{ fontWeight: 600 }}>{lead.name}</td>
                          <td>{lead.service}</td>
                          <td style={{ color: 'var(--text-secondary)' }}>{lead.city}</td>
                          <td>
                            {lead.rating !== null ? (
                              <span className={`badge ${lead.rating >= 4.0 ? 'badge-rating-high' : 'badge-rating-mid'}`}>
                                ★ {lead.rating.toFixed(1)}
                              </span>
                            ) : (
                              <span style={{ color: 'var(--text-muted)' }}>N/A</span>
                            )}
                          </td>
                          <td style={{ fontWeight: 600 }}>
                            {lead.deal_value > 0 ? (
                              new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: 'USD',
                                maximumFractionDigits: 0
                              }).format(lead.deal_value)
                            ) : (
                              <span style={{ color: 'var(--text-muted)' }}>-</span>
                            )}
                          </td>
                          <td style={{ color: 'var(--text-secondary)' }}>{lead.date_created || '-'}</td>
                          <td>
                            <span className={`badge badge-status-${lead.status === 'Contract Won' ? 'won' : 'lead'}`}>
                              {lead.status === 'Contract Won' ? 'Contract Won' : 'Lead'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>
          )}
        </div>
      </main>

      {/* ========================== ADD LEAD MODAL ========================== */}
      {showAddLeadModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3>Create New Lead</h3>
              <button className="modal-close-btn" onClick={() => setShowAddLeadModal(false)}>
                <svg viewBox="0 0 24 24">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            </div>

            <form className="modal-form" onSubmit={handleAddLeadSubmit}>
              <div className="modal-form-group">
                <label>Business Name *</label>
                <input 
                  type="text" 
                  className="modal-input" 
                  placeholder="e.g. Acme Corporation" 
                  required
                  value={newLead.name}
                  onChange={(e) => setNewLead(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="modal-form-group">
                <label>Service Category</label>
                <select 
                  className="modal-input" 
                  value={newLead.service}
                  onChange={(e) => setNewLead(prev => ({ ...prev, service: e.target.value }))}
                >
                  <option value="Plumbing">Plumbing</option>
                  <option value="Restoration">Restoration</option>
                  <option value="Roofing">Roofing</option>
                  <option value="Solar">Solar</option>
                  <option value="Pest Control">Pest Control</option>
                  <option value="HVAC">HVAC</option>
                  <option value="Electrical">Electrical</option>
                </select>
              </div>

              <div className="modal-form-group">
                <label>Address / Location</label>
                <input 
                  type="text" 
                  className="modal-input" 
                  placeholder="e.g. Indiranagar, Bengaluru" 
                  value={newLead.address}
                  onChange={(e) => setNewLead(prev => ({ ...prev, address: e.target.value }))}
                />
              </div>

              <div className="modal-form-group">
                <label>Deal Value ($) *</label>
                <input 
                  type="number" 
                  className="modal-input" 
                  placeholder="e.g. 15000" 
                  required
                  value={newLead.deal_value}
                  onChange={(e) => setNewLead(prev => ({ ...prev, deal_value: e.target.value }))}
                />
              </div>

              <div className="modal-form-group">
                <label>Rating (0.0 to 5.0)</label>
                <input 
                  type="number" 
                  step="0.1" 
                  min="0" 
                  max="5"
                  className="modal-input" 
                  value={newLead.rating}
                  onChange={(e) => setNewLead(prev => ({ ...prev, rating: e.target.value }))}
                />
              </div>

              <div className="modal-form-group">
                <label>Pipeline Status</label>
                <select 
                  className="modal-input"
                  value={newLead.status}
                  onChange={(e) => setNewLead(prev => ({ ...prev, status: e.target.value }))}
                >
                  <option value="lead">Lead</option>
                  <option value="Contract Won">Contract Won</option>
                </select>
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn-secondary" 
                  style={{ width: 'auto' }}
                  onClick={() => setShowAddLeadModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
