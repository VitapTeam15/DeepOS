import React, { useState } from 'react';
import { useProcesses } from '../hooks/useProcesses';
import ProcessTable from '../components/Process/ProcessTable';
import { Search, RefreshCw, Cpu, Database, Layers, ArrowUpDown, Shield } from 'lucide-react';
import LoadingSkeleton from '../components/Common/LoadingSkeleton';

const ProcessesPage = () => {
  const { processes, totalCount, loading, error, refetch } = useProcesses();
  const [filter, setFilter] = useState('');
  const [sortBy, setSortBy] = useState('cpu_percent'); // cpu_percent, memory_percent, name, pid
  const [sortDesc, setSortDesc] = useState(true);

  const handleSort = (key) => {
    if (sortBy === key) {
      setSortDesc(!sortDesc);
    } else {
      setSortBy(key);
      setSortDesc(true);
    }
  };

  const sortedProcesses = [...processes].sort((a, b) => {
    let valA = a[sortBy];
    let valB = b[sortBy];
    if (typeof valA === 'string') valA = valA.toLowerCase();
    if (typeof valB === 'string') valB = valB.toLowerCase();
    
    if (valA < valB) return sortDesc ? 1 : -1;
    if (valA > valB) return sortDesc ? -1 : 1;
    return 0;
  });

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-header-title">Process Manager</h1>
          <p className="page-header-desc">
            Monitoring {totalCount} active OS processes & hardware allocations
          </p>
        </div>
        <button className="btn btn-secondary" onClick={refetch} disabled={loading}>
          <RefreshCw size={15} className={loading ? 'spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          Failed to fetch processes: {error}
        </div>
      )}

      {/* Control Bar: Search and Sort */}
      <div className="card" style={{ padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          {/* Search Box */}
          <div className="search-wrapper" style={{ flex: '1', maxWidth: '360px' }}>
            <Search size={16} className="search-icon" />
            <input 
              type="text" 
              placeholder="Filter by process name or PID..." 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)} 
              className="form-input"
            />
          </div>

          {/* Sort Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Sort by:</span>
            
            <button 
              className={`btn btn-sm ${sortBy === 'cpu_percent' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => handleSort('cpu_percent')}
            >
              <Cpu size={13} />
              <span>CPU</span>
              {sortBy === 'cpu_percent' && <ArrowUpDown size={11} />}
            </button>

            <button 
              className={`btn btn-sm ${sortBy === 'memory_percent' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => handleSort('memory_percent')}
            >
              <Database size={13} />
              <span>Memory</span>
              {sortBy === 'memory_percent' && <ArrowUpDown size={11} />}
            </button>

            <button 
              className={`btn btn-sm ${sortBy === 'name' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => handleSort('name')}
            >
              <span>Name</span>
              {sortBy === 'name' && <ArrowUpDown size={11} />}
            </button>

            <button 
              className={`btn btn-sm ${sortBy === 'pid' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => handleSort('pid')}
            >
              <span>PID</span>
              {sortBy === 'pid' && <ArrowUpDown size={11} />}
            </button>
          </div>
        </div>
      </div>

      {/* Process Table Content */}
      {loading && processes.length === 0 ? (
        <LoadingSkeleton type="table" rows={8} />
      ) : (
        <ProcessTable 
          processes={sortedProcesses} 
          filter={filter} 
          onProcessTerminated={refetch}
        />
      )}
    </div>
  );
};

export default ProcessesPage;