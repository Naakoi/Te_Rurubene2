'use client';

import { useEffect, useState, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/axios';
import { Users, Music, DollarSign, CheckCircle, XCircle, Clock, Radio, Plus, Trash2, Mail, ShieldAlert, KeyRound, Loader2, RefreshCw, Building, FileText, Coins, ArrowUpRight, ArrowDownLeft, BarChart3, ChevronDown, ChevronRight, TrendingUp, Scale } from 'lucide-react';

export default function AdminPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  const [activeTab, setActiveTab] = useState<'users' | 'artists' | 'radio' | 'settings' | 'bank_deposits' | 'withdrawals' | 'ledger'>('artists');
  const [stats, setStats] = useState<any>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [artists, setArtists] = useState<any[]>([]);
  const [stations, setStations] = useState<any[]>([]);
  const [newStation, setNewStation] = useState({ name: '', stream_url: '', genre: '' });
  const [walletTestingMode, setWalletTestingMode] = useState<boolean>(true);
  const [platformFeePct, setPlatformFeePct] = useState<number>(10);
  const [pendingFeePct, setPendingFeePct] = useState<number>(10);
  const [isUpdatingFee, setIsUpdatingFee] = useState(false);
  const [feeUpdateMsg, setFeeUpdateMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [redeemCodes, setRedeemCodes] = useState<any[]>([]);
  const [newCodeAmount, setNewCodeAmount] = useState('');
  const [newCodeQuantity, setNewCodeQuantity] = useState('1');
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'id', direction: 'desc' });

  // Bank Deposits Submissions State
  const [bankDeposits, setBankDeposits] = useState<any[]>([]);
  const [depositLoading, setDepositLoading] = useState<number | null>(null);  // deposit id being processed
  const [depositMsg, setDepositMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [rejectingId, setRejectingId] = useState<number | null>(null);        // id of deposit showing reject form
  const [rejectNote, setRejectNote] = useState('');
  const [isRefreshingDeposits, setIsRefreshingDeposits] = useState(false);

  // Withdrawals Moderation State
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [withdrawalLoading, setWithdrawalLoading] = useState<number | null>(null);
  const [withdrawalMsg, setWithdrawalMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [rejectingWithdrawalId, setRejectingWithdrawalId] = useState<number | null>(null);
  const [rejectWithdrawalNote, setRejectWithdrawalNote] = useState('');
  const [approvingId, setApprovingId] = useState<number | null>(null);  // withdrawal id where file input is showing
  const [approvalReceipt, setApprovalReceipt] = useState<File | null>(null);
  const [isRefreshingWithdrawals, setIsRefreshingWithdrawals] = useState(false);

  // System Ledger State
  const [ledger, setLedger] = useState<any>(null);
  const [ledgerTxns, setLedgerTxns] = useState<any[]>([]);
  const [ledgerTxnMeta, setLedgerTxnMeta] = useState<any>(null);
  const [ledgerTxnPage, setLedgerTxnPage] = useState(1);
  const [ledgerTxnTypeFilter, setLedgerTxnTypeFilter] = useState('');
  const [ledgerTxnSourceFilter, setLedgerTxnSourceFilter] = useState('');
  const [expandedRoles, setExpandedRoles] = useState<Record<string, boolean>>({});
  const [isLoadingLedger, setIsLoadingLedger] = useState(false);
  const [ledgerUserSearch, setLedgerUserSearch] = useState('');
  const [ledgerSortBy, setLedgerSortBy] = useState('created_at');
  const [ledgerSortDir, setLedgerSortDir] = useState<'asc' | 'desc'>('desc');

  // Platform Revenue Transactions
  const [revTxns, setRevTxns] = useState<any[]>([]);
  const [revTxnMeta, setRevTxnMeta] = useState<any>(null);
  const [revTxnPage, setRevTxnPage] = useState(1);
  const [revTxnSearch, setRevTxnSearch] = useState('');
  const [isLoadingRevTxns, setIsLoadingRevTxns] = useState(false);

  // Users Filter & Sort States
  const [userRoleFilter, setUserRoleFilter] = useState<string>('all');
  const [userSortKey, setUserSortKey] = useState<string>('name');
  const [userSortDirection, setUserSortDirection] = useState<'asc' | 'desc'>('asc');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // User Wallet Transaction Modal States
  const [selectedUserForTx, setSelectedUserForTx] = useState<any>(null);
  const [txHistory, setTxHistory] = useState<any[]>([]);
  const [loadingTx, setLoadingTx] = useState<boolean>(false);

  // Manual Wallet Adjust States
  const [adjustingUser, setAdjustingUser] = useState<any>(null);
  const [adjustAmount, setAdjustAmount] = useState<string>('');
  const [adjustType, setAdjustType] = useState<'credit' | 'debit'>('credit');
  const [adjustNote, setAdjustNote] = useState<string>('');
  const [adjustLoading, setAdjustLoading] = useState<boolean>(false);
  const [userMsg, setUserMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchData = () => {
    api.get('/api/admin/stats').then(res => setStats(res.data)).catch(err => console.error('Stats error:', err));
    api.get('/api/admin/users').then(res => setUsersList(res.data)).catch(err => console.error('Users error:', err));
    api.get('/api/admin/artists').then(res => setArtists(res.data)).catch(err => console.error('Artists error:', err));
    api.get('/api/admin/radio').then(res => setStations(res.data)).catch(err => console.error('Radio error:', err));
    api.get('/api/admin/settings').then(res => {
      setWalletTestingMode(res.data.wallet_testing_mode);
      setPlatformFeePct(res.data.platform_fee_pct ?? 10);
      setPendingFeePct(res.data.platform_fee_pct ?? 10);
    }).catch(err => console.error('Settings error:', err));
    api.get('/api/admin/bank-deposits').then(res => setBankDeposits(res.data)).catch(err => console.error('Bank deposits error:', err));
    api.get('/api/admin/withdrawals').then(res => setWithdrawals(res.data)).catch(err => console.error('Withdrawals error:', err));
    fetchRedeemCodes();
  };

  const fetchRedeemCodes = () => {
    api.get('/api/admin/redeem-codes').then(res => setRedeemCodes(res.data.codes)).catch(err => console.error('Redeem codes error:', err));
  };

  const fetchLedger = () => {
    setIsLoadingLedger(true);
    api.get('/api/admin/ledger')
      .then(res => setLedger(res.data))
      .catch(err => console.error('Ledger error:', err))
      .finally(() => setIsLoadingLedger(false));
  };

  const fetchLedgerTxns = (
    page = 1,
    type = ledgerTxnTypeFilter,
    source = ledgerTxnSourceFilter,
    userSearch = ledgerUserSearch,
    sortBy = ledgerSortBy,
    sortDir = ledgerSortDir
  ) => {
    const params: Record<string, string | number> = { page, sort_by: sortBy, sort_dir: sortDir };
    if (type)       params.type        = type;
    if (source)     params.source      = source;
    if (userSearch) params.user_search = userSearch;
    api.get('/api/admin/ledger/transactions', { params })
      .then(res => {
        setLedgerTxns(res.data.data || []);
        setLedgerTxnMeta(res.data);
      })
      .catch(err => console.error('Ledger transactions error:', err));
  };

  const handleLedgerSort = (col: string) => {
    const newDir = ledgerSortBy === col && ledgerSortDir === 'desc' ? 'asc' : 'desc';
    setLedgerSortBy(col);
    setLedgerSortDir(newDir);
    setLedgerTxnPage(1);
    fetchLedgerTxns(1, ledgerTxnTypeFilter, ledgerTxnSourceFilter, ledgerUserSearch, col, newDir);
  };

  const fetchRevTxns = (page = 1, search = revTxnSearch) => {
    setIsLoadingRevTxns(true);
    const params: Record<string, string | number> = { page };
    if (search) params.search = search;
    api.get('/api/admin/revenue-transactions', { params })
      .then(res => {
        setRevTxns(res.data.data || []);
        setRevTxnMeta(res.data);
      })
      .catch(err => console.error('Revenue txns error:', err))
      .finally(() => setIsLoadingRevTxns(false));
  };

  useEffect(() => {
    // Wait for AuthInitializer to populate the user
    if (user === null) {
      // If we've waited a bit and still no user, or if we explicitly failed
      const timer = setTimeout(() => {
        if (!localStorage.getItem('auth_token')) {
           router.push('/login');
        }
      }, 1000);
      return () => clearTimeout(timer);
    }

    if (user.role !== 'admin') {
      router.push('/'); // Redirect non-admins to home
      return;
    }

    setIsAuthorized(true);
    fetchData();
  }, [user, router]);

  if (isAuthorized === null) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-primary">
        <Loader2 size={48} className="animate-spin mb-4" />
        <p className="font-bold animate-pulse">Verifying Security Clearances...</p>
      </div>
    );
  }

  const handleVerify = (id: number, status: string) => {
    api.post(`/api/admin/artists/${id}/verify`, { status }).then(() => fetchData());
  };

  const handleAddStation = (e: React.FormEvent) => {
    e.preventDefault();
    api.post('/api/admin/radio', newStation).then(() => {
        setNewStation({ name: '', stream_url: '', genre: '' });
        fetchData();
    });
  };

  const handleDeleteStation = (id: number) => {
    api.delete(`/api/admin/radio/${id}`).then(() => fetchData());
  };

  const handleDeleteUser = (id: number) => {
    if (confirm('Are you sure you want to delete this user?')) {
        api.delete(`/api/admin/users/${id}`).then(() => fetchData());
    }
  };

  const handleResetPassword = (id: number) => {
    const newPass = prompt('Enter new password (min 8 chars):');
    if (newPass && newPass.length >= 8) {
        api.post(`/api/admin/users/${id}/reset-password`, { password: newPass })
            .then(() => alert('Password reset successfully!'))
            .catch(err => alert('Failed to reset password.'));
    }
  };

  const handleToggleTestingMode = async (enabled: boolean) => {
    try {
      await api.post('/api/admin/settings', { wallet_testing_mode: enabled });
      setWalletTestingMode(enabled);
    } catch (err) {
      console.error('Failed to toggle testing mode', err);
    }
  };

  const handleUpdateFee = async () => {
    if (pendingFeePct === platformFeePct) return;
    setIsUpdatingFee(true);
    setFeeUpdateMsg(null);
    try {
      await api.post('/api/admin/settings', { platform_fee_pct: pendingFeePct });
      setPlatformFeePct(pendingFeePct);
      setFeeUpdateMsg({ type: 'success', text: `Platform fee updated to ${pendingFeePct}%. All artists & studios have been notified.` });
    } catch (err) {
      setFeeUpdateMsg({ type: 'error', text: 'Failed to update fee. Please try again.' });
    } finally {
      setIsUpdatingFee(false);
      setTimeout(() => setFeeUpdateMsg(null), 5000);
    }
  };

  const handleCreateCode = async () => {
    if (!newCodeAmount || isNaN(Number(newCodeAmount))) return;
    try {
      await api.post('/api/admin/redeem-codes', { 
        amount: Number(newCodeAmount),
        quantity: Number(newCodeQuantity) || 1
      });
      setNewCodeAmount('');
      setNewCodeQuantity('1');
      fetchRedeemCodes();
    } catch (err) {
      console.error('Failed to create code', err);
    }
  };

  const handleDeleteCode = async (id: number) => {
    try {
      await api.delete(`/api/admin/redeem-codes/${id}`);
      fetchRedeemCodes();
    } catch (err) {
      console.error('Failed to delete code', err);
    }
  };

  const showDepositMsg = (type: 'success' | 'error', text: string) => {
    setDepositMsg({ type, text });
    setTimeout(() => setDepositMsg(null), 4000);
  };

  const fetchBankDeposits = () => {
    setIsRefreshingDeposits(true);
    api.get('/api/admin/bank-deposits')
      .then(res => setBankDeposits(res.data))
      .catch(err => console.error('Bank deposits error:', err))
      .finally(() => setIsRefreshingDeposits(false));
  };

  const handleApproveDeposit = async (id: number) => {
    setDepositLoading(id);
    try {
      await api.post(`/api/admin/bank-deposits/${id}/approve`);
      showDepositMsg('success', 'Deposit approved — wallet has been credited.');
      fetchData();
    } catch (err: any) {
      showDepositMsg('error', err.response?.data?.message || 'Failed to approve deposit.');
    } finally {
      setDepositLoading(null);
    }
  };

  const handleRejectDeposit = async (id: number) => {
    setDepositLoading(id);
    try {
      await api.post(`/api/admin/bank-deposits/${id}/reject`, { note: rejectNote.trim() || 'Receipt could not be verified.' });
      showDepositMsg('success', 'Deposit rejected.');
      setRejectingId(null);
      setRejectNote('');
      fetchData();
    } catch (err: any) {
      showDepositMsg('error', err.response?.data?.message || 'Failed to reject deposit.');
    } finally {
      setDepositLoading(null);
    }
  };

  const showWithdrawalMsg = (type: 'success' | 'error', text: string) => {
    setWithdrawalMsg({ type, text });
    setTimeout(() => setWithdrawalMsg(null), 4000);
  };

  const fetchWithdrawals = () => {
    setIsRefreshingWithdrawals(true);
    api.get('/api/admin/withdrawals')
      .then(res => setWithdrawals(res.data))
      .catch(err => console.error('Withdrawals error:', err))
      .finally(() => setIsRefreshingWithdrawals(false));
  };

  const handleApproveWithdrawal = async (id: number) => {
    if (!approvalReceipt) {
      showWithdrawalMsg('error', 'Please select a transfer receipt file first.');
      return;
    }
    setWithdrawalLoading(id);
    const formData = new FormData();
    formData.append('receipt', approvalReceipt);

    try {
      await api.post(`/api/admin/withdrawals/${id}/approve`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      showWithdrawalMsg('success', 'Withdrawal approved and receipt uploaded.');
      setApprovalReceipt(null);
      setApprovingId(null);
      fetchData();
    } catch (err: any) {
      showWithdrawalMsg('error', err.response?.data?.message || 'Failed to approve withdrawal.');
    } finally {
      setWithdrawalLoading(null);
    }
  };

  const handleRejectWithdrawal = async (id: number) => {
    setWithdrawalLoading(id);
    try {
      await api.post(`/api/admin/withdrawals/${id}/reject`, {
        note: rejectWithdrawalNote.trim() || 'Details could not be verified.',
      });
      showWithdrawalMsg('success', 'Withdrawal request rejected.');
      setRejectingWithdrawalId(null);
      setRejectWithdrawalNote('');
      fetchData();
    } catch (err: any) {
      showWithdrawalMsg('error', err.response?.data?.message || 'Failed to reject withdrawal request.');
    } finally {
      setWithdrawalLoading(null);
    }
  };


  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedCodes = [...redeemCodes].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  const handleViewUserTransactions = (selectedUser: any) => {
    setSelectedUserForTx(selectedUser);
    setLoadingTx(true);
    setTxHistory([]);
    api.get(`/api/admin/users/${selectedUser.id}/transactions`)
      .then(res => {
        setTxHistory(res.data.transactions || []);
      })
      .catch(err => {
        console.error('Failed to load user transactions', err);
      })
      .finally(() => {
        setLoadingTx(false);
      });
  };

  // User Filtering, Sorting, and Refreshing logic
  const handleRefreshUsers = () => {
    setIsRefreshing(true);
    fetchData();
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const handleAdjustWallet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingUser || !adjustAmount || isNaN(Number(adjustAmount)) || Number(adjustAmount) <= 0) {
      setUserMsg({ type: 'error', text: 'Please enter a valid amount.' });
      return;
    }
    setAdjustLoading(true);
    api.post(`/api/admin/users/${adjustingUser.id}/adjust-wallet`, {
      amount: Number(adjustAmount),
      type: adjustType,
      note: adjustNote,
    })
      .then(res => {
        setUserMsg({ type: 'success', text: res.data.message });
        setAdjustingUser(null);
        setAdjustAmount('');
        setAdjustNote('');
        fetchData();
      })
      .catch(err => {
        setUserMsg({ type: 'error', text: err.response?.data?.message || 'Failed to adjust wallet balance.' });
      })
      .finally(() => {
        setAdjustLoading(false);
      });
  };

  const handleUserSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (userSortKey === key && userSortDirection === 'asc') {
      direction = 'desc';
    }
    setUserSortKey(key);
    setUserSortDirection(direction);
  };

  const filteredUsers = usersList.filter(u => {
    if (userRoleFilter === 'all') return true;
    return u.role === userRoleFilter;
  });

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    let valA: any = a[userSortKey];
    let valB: any = b[userSortKey];

    if (userSortKey === 'wallet') {
      valA = a.wallet ? Number(a.wallet.balance) : 0;
      valB = b.wallet ? Number(b.wallet.balance) : 0;
    }

    if (valA === undefined || valA === null) valA = '';
    if (valB === undefined || valB === null) valB = '';

    if (typeof valA === 'string' && typeof valB === 'string') {
      return userSortDirection === 'asc' 
        ? valA.localeCompare(valB) 
        : valB.localeCompare(valA);
    } else {
      const numA = Number(valA);
      const numB = Number(valB);
      if (!isNaN(numA) && !isNaN(numB)) {
        return userSortDirection === 'asc' ? numA - numB : numB - numA;
      }
      return userSortDirection === 'asc' 
        ? (valA < valB ? -1 : 1) 
        : (valA > valB ? -1 : 1);
    }
  });

  const totalWalletSum = sortedUsers.reduce((sum, u) => {
    return sum + (u.wallet ? Number(u.wallet.balance) : 0);
  }, 0);

  return (
    <div className="p-8 pb-24 h-full overflow-y-auto">
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-3xl font-bold">Admin Control Center</h1>
        <div className="flex bg-white/5 p-1 rounded-xl">
            <button 
                onClick={() => setActiveTab('users')}
                className={`px-6 py-2 rounded-lg font-bold transition ${activeTab === 'users' ? 'bg-primary text-primary-foreground' : 'hover:bg-white/5'}`}
            >
                Users
            </button>
            <button 
                onClick={() => setActiveTab('artists')}
                className={`px-6 py-2 rounded-lg font-bold transition ${activeTab === 'artists' ? 'bg-primary text-primary-foreground' : 'hover:bg-white/5'}`}
            >
                Artists
            </button>
            <button 
                onClick={() => setActiveTab('radio')}
                className={`px-6 py-2 rounded-lg font-bold transition ${activeTab === 'radio' ? 'bg-primary text-primary-foreground' : 'hover:bg-white/5'}`}
            >
                Radio
            </button>
            <button 
                onClick={() => setActiveTab('settings')}
                className={`px-6 py-2 rounded-lg font-bold transition ${activeTab === 'settings' ? 'bg-primary text-primary-foreground' : 'hover:bg-white/5'}`}
            >
                Settings
            </button>
            <button 
                onClick={() => setActiveTab('bank_deposits')}
                className={`px-6 py-2 rounded-lg font-bold transition ${activeTab === 'bank_deposits' ? 'bg-primary text-primary-foreground' : 'hover:bg-white/5'}`}
            >
                Bank Deposits
            </button>
            <button 
                onClick={() => setActiveTab('withdrawals')}
                className={`px-6 py-2 rounded-lg font-bold transition ${activeTab === 'withdrawals' ? 'bg-primary text-primary-foreground' : 'hover:bg-white/5'}`}
            >
                Withdrawals
            </button>
            <button 
                onClick={() => { setActiveTab('ledger'); fetchLedger(); fetchLedgerTxns(1); fetchRevTxns(1); }}
                className={`px-6 py-2 rounded-lg font-bold transition flex items-center space-x-1.5 ${activeTab === 'ledger' ? 'bg-primary text-primary-foreground' : 'hover:bg-white/5'}`}
            >
                <Scale size={14} />
                <span>Ledger</span>
            </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <div className="glass-card p-6 rounded-3xl">
            <div className="flex items-center justify-between mb-4">
                <Users className="text-blue-500" />
                <span className="text-xs font-bold text-muted-foreground uppercase">Users</span>
            </div>
            <p className="text-3xl font-bold">{stats?.total_users || 0}</p>
        </div>
        <div className="glass-card p-6 rounded-3xl">
            <div className="flex items-center justify-between mb-4">
                <Music className="text-purple-500" />
                <span className="text-xs font-bold text-muted-foreground uppercase">Artists</span>
            </div>
            <p className="text-3xl font-bold">{stats?.total_artists || 0}</p>
        </div>
        <div className="glass-card p-6 rounded-3xl">
            <div className="flex items-center justify-between mb-4">
                <DollarSign className="text-green-500" />
                <span className="text-xs font-bold text-muted-foreground uppercase">Revenue</span>
            </div>
            <p className="text-3xl font-bold">${stats?.revenue?.toLocaleString() || '0'}</p>
        </div>
        <div className="glass-card p-6 rounded-3xl">
            <div className="flex items-center justify-between mb-4">
                <Clock className="text-orange-500" />
                <span className="text-xs font-bold text-muted-foreground uppercase">Pending</span>
            </div>
            <p className="text-3xl font-bold">{stats?.pending_verifications || 0}</p>
        </div>
      </div>

      {activeTab === 'users' && (
          <div className="glass-card rounded-3xl overflow-hidden">
            <div className="p-6 border-b border-white/10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold">User Management</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Filter, sort, and manage user accounts & wallet balances</p>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                    {/* Role Filter */}
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-muted-foreground uppercase font-bold">Role:</span>
                      <select 
                        value={userRoleFilter} 
                        onChange={(e) => setUserRoleFilter(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-sm font-bold text-white focus:border-primary focus:outline-none"
                      >
                        <option value="all" className="bg-[#0f1322]">All Roles</option>
                        <option value="admin" className="bg-[#0f1322]">Admin</option>
                        <option value="studio" className="bg-[#0f1322]">Studio</option>
                        <option value="artist" className="bg-[#0f1322]">Artist</option>
                        <option value="client" className="bg-[#0f1322]">Client (Listener)</option>
                      </select>
                    </div>

                    {/* Total Wallet Sum Display */}
                    <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-1.5 flex items-center space-x-2">
                      <span className="text-xs text-muted-foreground uppercase font-bold">Total Wallet:</span>
                      <span className="text-primary font-black">${totalWalletSum.toFixed(2)}</span>
                    </div>

                    {/* Refresh Button */}
                    <button 
                      onClick={handleRefreshUsers}
                      disabled={isRefreshing}
                      className="p-2.5 bg-primary/10 hover:bg-primary/25 border border-primary/20 text-primary rounded-xl flex items-center justify-center transition active:scale-95 disabled:opacity-50"
                      title="Refresh Wallet Balances"
                    >
                      <RefreshCw size={16} className={`transition-transform duration-700 ${isRefreshing ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-white/5 text-xs font-bold uppercase text-muted-foreground">
                        <tr>
                            <th className="px-6 py-4 cursor-pointer hover:text-white transition" onClick={() => handleUserSort('name')}>
                              Name {userSortKey === 'name' && (userSortDirection === 'asc' ? '↑' : '↓')}
                            </th>
                            <th className="px-6 py-4 cursor-pointer hover:text-white transition" onClick={() => handleUserSort('email')}>
                              Email {userSortKey === 'email' && (userSortDirection === 'asc' ? '↑' : '↓')}
                            </th>
                            <th className="px-6 py-4 cursor-pointer hover:text-white transition" onClick={() => handleUserSort('role')}>
                              Role {userSortKey === 'role' && (userSortDirection === 'asc' ? '↑' : '↓')}
                            </th>
                            <th className="px-6 py-4 cursor-pointer hover:text-white transition" onClick={() => handleUserSort('wallet')}>
                              Wallet Balance {userSortKey === 'wallet' && (userSortDirection === 'asc' ? '↑' : '↓')}
                            </th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {sortedUsers.map(user => (
                            <tr key={user.id} className="hover:bg-white/5 transition">
                                <td className="px-6 py-4 font-medium flex items-center space-x-3">
                                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
                                        {user.name.charAt(0)}
                                    </div>
                                    <span>{user.name}</span>
                                </td>
                                <td className="px-6 py-4 text-muted-foreground">
                                    <div className="flex items-center space-x-2">
                                        <Mail size={14} />
                                        <span>{user.email}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                                        user.role === 'admin' ? 'bg-red-500/20 text-red-500' :
                                        user.role === 'artist' ? 'bg-purple-500/20 text-purple-500' :
                                        user.role === 'studio' ? 'bg-green-500/20 text-green-500' :
                                        'bg-blue-500/20 text-blue-500'
                                    }`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="font-bold text-white">
                                      ${user.wallet ? Number(user.wallet.balance).toFixed(2) : '0.00'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end space-x-2">
                                        <button 
                                            onClick={() => {
                                                setAdjustingUser(user);
                                                setAdjustAmount('');
                                                setAdjustType('credit');
                                                setAdjustNote('');
                                                setUserMsg(null);
                                            }}
                                            className="p-2 text-muted-foreground hover:text-[#00e5ff] transition"
                                            title="Adjust Wallet Balance (Top-up/Debit)"
                                        >
                                            <Coins size={18} />
                                        </button>
                                        <button 
                                            onClick={() => handleViewUserTransactions(user)}
                                            className="p-2 text-muted-foreground hover:text-green-500 transition"
                                            title="View Wallet Transactions"
                                        >
                                            <DollarSign size={18} />
                                        </button>
                                        <button 
                                            onClick={() => handleResetPassword(user.id)}
                                            className="p-2 text-muted-foreground hover:text-primary transition"
                                            title="Reset Password"
                                        >
                                            <KeyRound size={18} />
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteUser(user.id)}
                                            className="p-2 text-muted-foreground hover:text-red-500 transition"
                                            title="Delete User"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          </div>
      )}

      {activeTab === 'artists' && (
        <div className="glass-card rounded-3xl overflow-hidden">
            <div className="p-6 border-b border-white/10">
                <h2 className="text-xl font-bold">Artist Moderation</h2>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-white/5 text-xs font-bold uppercase text-muted-foreground">
                        <tr>
                            <th className="px-6 py-4">Artist Name</th>
                            <th className="px-6 py-4">Email</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {artists.map(artist => (
                            <tr key={artist.id} className="hover:bg-white/5 transition">
                                <td className="px-6 py-4 font-medium">{artist.name}</td>
                                <td className="px-6 py-4 text-muted-foreground">{artist.user?.email}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                                        artist.verification_status === 'approved' ? 'bg-green-500/20 text-green-500' :
                                        artist.verification_status === 'declined' ? 'bg-red-500/20 text-red-500' :
                                        'bg-orange-500/20 text-orange-500'
                                    }`}>
                                        {artist.verification_status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end space-x-2">
                                        <button 
                                            onClick={() => handleVerify(artist.id, 'approved')}
                                            className="p-2 glass rounded-lg hover:text-green-500 transition"
                                        >
                                            <CheckCircle size={18} />
                                        </button>
                                        <button 
                                            onClick={() => handleVerify(artist.id, 'declined')}
                                            className="p-2 glass rounded-lg hover:text-red-500 transition"
                                        >
                                            <XCircle size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      )}

      {activeTab === 'radio' && (
        <div className="space-y-8">
            <div className="glass-card rounded-3xl p-8">
                <h2 className="text-xl font-bold mb-6 flex items-center space-x-2">
                    <Plus size={20} className="text-primary" />
                    <span>Add New Radio Station</span>
                </h2>
                <form onSubmit={handleAddStation} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <input 
                        type="text" 
                        placeholder="Station Name" 
                        className="bg-white/5 border border-white/10 rounded-xl p-3 focus:border-primary outline-none"
                        value={newStation.name}
                        onChange={(e) => setNewStation({...newStation, name: e.target.value})}
                        required
                    />
                    <input 
                        type="url" 
                        placeholder="Stream URL" 
                        className="bg-white/5 border border-white/10 rounded-xl p-3 focus:border-primary outline-none"
                        value={newStation.stream_url}
                        onChange={(e) => setNewStation({...newStation, stream_url: e.target.value})}
                        required
                    />
                    <div className="flex space-x-4">
                        <input 
                            type="text" 
                            placeholder="Genre" 
                            className="bg-white/5 border border-white/10 rounded-xl p-3 focus:border-primary outline-none flex-1"
                            value={newStation.genre}
                            onChange={(e) => setNewStation({...newStation, genre: e.target.value})}
                        />
                        <button type="submit" className="px-6 bg-primary text-primary-foreground rounded-xl font-bold hover:opacity-90 transition">
                            Add
                        </button>
                    </div>
                </form>
            </div>

            <div className="glass-card rounded-3xl overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-white/5 text-xs font-bold uppercase text-muted-foreground border-b border-white/10">
                        <tr>
                            <th className="px-6 py-4">Station Name</th>
                            <th className="px-6 py-4">Genre</th>
                            <th className="px-6 py-4">Stream URL</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {stations.map(station => (
                            <tr key={station.id} className="hover:bg-white/5 transition">
                                <td className="px-6 py-4 font-bold flex items-center space-x-3">
                                    <div className="p-2 bg-primary/10 text-primary rounded-lg">
                                        <Radio size={16} />
                                    </div>
                                    <span>{station.name}</span>
                                </td>
                                <td className="px-6 py-4 text-muted-foreground">{station.genre || 'Live Radio'}</td>
                                <td className="px-6 py-4 font-mono text-[10px] text-primary max-w-xs truncate">{station.stream_url}</td>
                                <td className="px-6 py-4 text-right">
                                    <button 
                                        onClick={() => handleDeleteStation(station.id)}
                                        className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="glass-card rounded-3xl p-8 max-w-2xl">
          <h2 className="text-xl font-bold mb-6 flex items-center space-x-2">
            <KeyRound size={20} className="text-primary" />
            <span>System Settings</span>
          </h2>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between p-6 bg-white/5 rounded-2xl border border-white/5">
              <div className="flex-1 pr-6">
                <h3 className="font-bold text-white mb-1">E-Wallet Testing Mode</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  When enabled, mock simulation checkouts are active, allowing listeners to top-up wallets using virtual play funds.
                </p>
              </div>
              <button
                onClick={() => handleToggleTestingMode(!walletTestingMode)}
                className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 focus:outline-none ${
                  walletTestingMode ? 'bg-primary' : 'bg-white/10'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full bg-white transition-transform duration-300 ${
                    walletTestingMode ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {!walletTestingMode ? (
              <div className="flex items-start space-x-3 p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl">
                <ShieldAlert size={20} className="text-orange-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-orange-400">Testing Mode Disabled</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Simulation gateways and webhook routes are completely closed for security. Only real payment processor credentials will trigger wallet credit.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-start space-x-3 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl">
                <ShieldAlert size={20} className="text-yellow-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-yellow-400">Testing Mode Active</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Any user can load wallet credits instantly using the mock checkout screen. Turn this off for staging/production deployments.
                  </p>
                </div>
              </div>
            )}
            {/* ── Platform Fee Control ── */}
            <div className="p-6 bg-white/5 rounded-2xl border border-white/5 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white flex items-center gap-2">
                    <TrendingUp size={16} className="text-primary" />
                    Platform Service Fee
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Controls the % taken from every purchase. Applies to <span className="font-bold text-white">new transactions only</span>. All artists &amp; studios are notified on change.
                  </p>
                </div>
                <div className="text-right shrink-0 ml-6">
                  <div className="text-3xl font-black text-primary">{pendingFeePct}%</div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-widest">Current: {platformFeePct}%</div>
                </div>
              </div>

              {/* Slider */}
              <div className="space-y-2">
                <input
                  type="range"
                  min={5}
                  max={30}
                  step={1}
                  value={pendingFeePct}
                  onChange={e => setPendingFeePct(Number(e.target.value))}
                  className="w-full h-2 appearance-none rounded-full bg-white/10 accent-primary cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground font-bold">
                  <span>5% (min)</span>
                  <span>10% (default)</span>
                  <span>20%</span>
                  <span>30% (max)</span>
                </div>
              </div>

              {/* Split Preview */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
                  <div className="text-lg font-black text-blue-400">{(100 - pendingFeePct).toFixed(0)}%</div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">Independent Artist</div>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
                  <div className="text-lg font-black text-emerald-400">{((100 - pendingFeePct) * 0.778).toFixed(0)}% / {((100 - pendingFeePct) * 0.222).toFixed(0)}%</div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">Studio Artist / Studio</div>
                </div>
                <div className="bg-primary/10 border border-primary/20 rounded-xl p-3">
                  <div className="text-lg font-black text-primary">{pendingFeePct}%</div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">Platform</div>
                </div>
              </div>

              {/* Feedback message */}
              {feeUpdateMsg && (
                <div className={`flex items-start gap-2 p-3 rounded-xl text-sm ${
                  feeUpdateMsg.type === 'success' ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'
                }`}>
                  {feeUpdateMsg.type === 'success' ? <CheckCircle size={16} className="shrink-0 mt-0.5" /> : <ShieldAlert size={16} className="shrink-0 mt-0.5" />}
                  <span>{feeUpdateMsg.text}</span>
                </div>
              )}

              {/* Apply button */}
              <button
                onClick={handleUpdateFee}
                disabled={isUpdatingFee || pendingFeePct === platformFeePct}
                className="w-full py-3 rounded-xl font-bold bg-primary text-primary-foreground hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isUpdatingFee ? (
                  <><Loader2 size={16} className="animate-spin" /> Updating…</>
                ) : pendingFeePct === platformFeePct ? (
                  'No Changes'
                ) : (
                  <>Apply {pendingFeePct}% Fee &amp; Notify Creators</>
                )}
              </button>

              <p className="text-[10px] text-muted-foreground text-center">
                ⚠ This action sends an in-app notification to every artist and studio account.
              </p>
            </div>


            <h2 className="text-xl font-bold mb-6 flex items-center space-x-2">
              <KeyRound size={20} className="text-primary" />
              <span>Redeem Codes</span>
            </h2>
            <div className="bg-white/5 p-6 rounded-2xl border border-white/5 space-y-6">
              <div className="flex space-x-4">
                <input
                  type="number"
                  placeholder="Amount (e.g. 50)"
                  value={newCodeAmount}
                  onChange={e => setNewCodeAmount(e.target.value)}
                  className="bg-white/10 px-4 py-2 rounded-xl focus:outline-none w-48"
                />
                <input
                  type="number"
                  placeholder="Qty (e.g. 10)"
                  value={newCodeQuantity}
                  onChange={e => setNewCodeQuantity(e.target.value)}
                  className="bg-white/10 px-4 py-2 rounded-xl focus:outline-none w-32"
                  min="1"
                  max="50"
                />
                <button
                  onClick={handleCreateCode}
                  disabled={!newCodeAmount || !newCodeQuantity}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-xl font-bold transition disabled:opacity-50"
                >
                  Generate Codes
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-muted-foreground text-sm">
                      <th className="py-3 px-4 font-bold cursor-pointer hover:text-white" onClick={() => handleSort('code')}>
                        Code {sortConfig.key === 'code' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="py-3 px-4 font-bold cursor-pointer hover:text-white" onClick={() => handleSort('amount')}>
                        Amount {sortConfig.key === 'amount' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="py-3 px-4 font-bold cursor-pointer hover:text-white" onClick={() => handleSort('status')}>
                        Status {sortConfig.key === 'status' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="py-3 px-4 font-bold cursor-pointer hover:text-white" onClick={() => handleSort('created_at')}>
                        Created {sortConfig.key === 'created_at' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="py-3 px-4 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedCodes.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-4 text-center text-muted-foreground">No codes generated yet.</td>
                      </tr>
                    ) : (
                      sortedCodes.map((code) => (
                        <tr key={code.id} className="border-b border-white/5 hover:bg-white/5 transition">
                          <td className="py-3 px-4 font-mono font-bold text-primary">{code.code}</td>
                          <td className="py-3 px-4 font-bold">${Number(code.amount).toFixed(2)}</td>
                          <td className="py-3 px-4">
                            {code.status === 'active' ? (
                              <span className="text-green-400 bg-green-400/10 px-2 py-1 rounded text-xs font-bold border border-green-400/20">UNUSED</span>
                            ) : (
                              <span className="text-red-400 bg-red-400/10 px-2 py-1 rounded text-xs font-bold border border-red-400/20">USED</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-sm text-muted-foreground">
                            {new Date(code.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {code.status === 'active' && (
                              <button onClick={() => handleDeleteCode(code.id)} className="text-red-400 hover:text-red-300 transition">
                                <Trash2 size={16} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'bank_deposits' && (
        <div className="space-y-4">
          {/* Toast notification */}
          {depositMsg && (
            <div className={`flex items-center space-x-3 px-5 py-4 rounded-2xl font-semibold text-sm border ${
              depositMsg.type === 'success'
                ? 'bg-green-500/10 border-green-500/30 text-green-400'
                : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}>
              {depositMsg.type === 'success' ? <CheckCircle size={16} /> : <XCircle size={16} />}
              <span>{depositMsg.text}</span>
            </div>
          )}

          <div className="glass-card rounded-3xl overflow-hidden animate-in fade-in duration-300">
            <div className="p-6 border-b border-white/10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">ANZ Bank Transfer Verification</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Review, approve, or reject user internet banking receipts.
                  {bankDeposits.filter((d: any) => d.status === 'pending').length > 0 && (
                    <span className="ml-2 text-yellow-400 font-bold">
                      {bankDeposits.filter((d: any) => d.status === 'pending').length} pending
                    </span>
                  )}
                </p>
              </div>
              <button
                onClick={fetchBankDeposits}
                disabled={isRefreshingDeposits}
                className="flex items-center space-x-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl transition text-sm font-bold border border-white/10 disabled:opacity-60"
              >
                <RefreshCw size={16} className={isRefreshingDeposits ? 'animate-spin' : ''} />
                <span>{isRefreshingDeposits ? 'Refreshing…' : 'Refresh Submissions'}</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-white/5 text-xs font-bold uppercase text-muted-foreground">
                  <tr>
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Submission Date</th>
                    <th className="px-6 py-4">Receipt Proof</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {bankDeposits.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-muted-foreground italic">No bank deposit submissions found.</td>
                    </tr>
                  ) : (
                    bankDeposits.map((dep: any) => (
                      <Fragment key={dep.id}>
                        <tr className="hover:bg-white/5 transition text-sm align-top">
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="font-bold text-white">{dep.user?.name}</span>
                              <span className="text-xs text-muted-foreground">{dep.user?.email}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-bold text-primary">
                            ${Number(dep.amount).toFixed(2)} AUD
                          </td>
                          <td className="px-6 py-4 text-muted-foreground text-xs">
                            {new Date(dep.created_at).toLocaleString()}
                          </td>
                          <td className="px-6 py-4">
                            <a
                              href={dep.receipt_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline font-bold flex items-center space-x-1"
                            >
                              <FileText size={14} />
                              <span>View Receipt</span>
                            </a>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              dep.status === 'approved' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                              dep.status === 'rejected' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                              'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 animate-pulse'
                            }`}>
                              {dep.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {dep.status === 'pending' ? (
                              <div className="flex items-center justify-end space-x-2">
                                <button
                                  onClick={() => handleApproveDeposit(dep.id)}
                                  disabled={depositLoading === dep.id}
                                  className="px-3.5 py-1.5 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1 shadow-md shadow-green-500/20"
                                >
                                  {depositLoading === dep.id ? (
                                    <Loader2 size={14} className="animate-spin" />
                                  ) : (
                                    <CheckCircle size={14} />
                                  )}
                                  <span>Approve</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setRejectingId(rejectingId === dep.id ? null : dep.id);
                                    setRejectNote('');
                                  }}
                                  disabled={depositLoading === dep.id}
                                  className={`px-3.5 py-1.5 border rounded-xl text-xs font-bold transition flex items-center space-x-1 ${
                                    rejectingId === dep.id
                                      ? 'bg-red-500 border-red-500 text-white shadow-md shadow-red-500/20'
                                      : 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white'
                                  }`}
                                >
                                  <XCircle size={14} />
                                  <span>Reject</span>
                                </button>
                              </div>
                            ) : (
                              <div className="text-xs text-muted-foreground">
                                Processed by Admin • {dep.admin_note ? `"${dep.admin_note}"` : 'No notes'}
                              </div>
                            )}
                          </td>
                        </tr>
                        {rejectingId === dep.id && dep.status === 'pending' && (
                          <tr className="bg-red-950/20 border-t border-red-500/10">
                            <td colSpan={6} className="px-6 py-4 text-left">
                              <div className="flex items-end space-x-3">
                                <div className="flex-1">
                                  <label className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-1.5 block">
                                    Rejection Reason (optional — press Enter to confirm)
                                  </label>
                                  <input
                                    type="text"
                                    value={rejectNote}
                                    onChange={e => setRejectNote(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleRejectDeposit(dep.id)}
                                    placeholder="e.g. Receipt could not be verified, amount mismatch…"
                                    className="w-full bg-white/5 border border-red-500/20 focus:border-red-500/60 rounded-xl px-4 py-2.5 text-sm focus:outline-none text-white placeholder:text-white/20"
                                    autoFocus
                                  />
                                </div>
                                <button
                                  onClick={() => handleRejectDeposit(dep.id)}
                                  disabled={depositLoading === dep.id}
                                  className="px-4 py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shrink-0"
                                >
                                  {depositLoading === dep.id ? (
                                    <Loader2 size={13} className="animate-spin" />
                                  ) : (
                                    <XCircle size={13} />
                                  )}
                                  <span>Confirm Reject</span>
                                </button>
                                <button
                                  onClick={() => { setRejectingId(null); setRejectNote(''); }}
                                  className="px-3 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold text-muted-foreground transition shrink-0"
                                >
                                  Cancel
                                </button>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'withdrawals' && (
        <div className="space-y-4">
          {/* Toast notification */}
          {withdrawalMsg && (
            <div className={`flex items-center space-x-3 px-5 py-4 rounded-2xl font-semibold text-sm border ${
              withdrawalMsg.type === 'success'
                ? 'bg-green-500/10 border-green-500/30 text-green-400'
                : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}>
              {withdrawalMsg.type === 'success' ? <CheckCircle size={16} /> : <XCircle size={16} />}
              <span>{withdrawalMsg.text}</span>
            </div>
          )}

          <div className="glass-card rounded-3xl overflow-hidden animate-in fade-in duration-300">
            <div className="p-6 border-b border-white/10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">User Withdrawals Processing</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Review and process user withdrawal requests. Transfer funds via ANZ/mPaisa first, upload receipt to approve, or reject request.
                  {withdrawals.filter((w: any) => w.status === 'pending').length > 0 && (
                    <span className="ml-2 text-yellow-400 font-bold">
                      {withdrawals.filter((w: any) => w.status === 'pending').length} pending
                    </span>
                  )}
                </p>
              </div>
              <button
                onClick={fetchWithdrawals}
                disabled={isRefreshingWithdrawals}
                className="flex items-center space-x-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl transition text-sm font-bold border border-white/10 disabled:opacity-60"
              >
                <RefreshCw size={16} className={isRefreshingWithdrawals ? 'animate-spin' : ''} />
                <span>{isRefreshingWithdrawals ? 'Refreshing…' : 'Refresh Requests'}</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-white/5 text-xs font-bold uppercase text-muted-foreground">
                  <tr>
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Payout Method & Details</th>
                    <th className="px-6 py-4">Request Date</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {withdrawals.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-muted-foreground italic">No withdrawal requests found.</td>
                    </tr>
                  ) : (
                    withdrawals.map((w: any) => (
                      <Fragment key={w.id}>
                        <tr className="hover:bg-white/5 transition text-sm align-top">
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="font-bold text-white">{w.user?.name}</span>
                              <span className="text-xs text-muted-foreground">{w.user?.email}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-bold text-primary">
                            ${Number(w.amount).toFixed(2)} AUD
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-bold text-white">{w.account_name}</div>
                            <div className="text-xs text-muted-foreground">
                              {w.bank_name} • {w.account_number} ({w.method.toUpperCase()})
                            </div>
                          </td>
                          <td className="px-6 py-4 text-muted-foreground text-xs">
                            {new Date(w.created_at).toLocaleString()}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              w.status === 'confirmed' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                              w.status === 'approved' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                              w.status === 'rejected' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                              'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 animate-pulse'
                            }`}>
                              {w.status === 'approved' ? 'Awaiting user confirmation' : w.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {w.status === 'pending' ? (
                              <div className="flex items-center justify-end space-x-2">
                                <button
                                  onClick={() => {
                                    setApprovingId(approvingId === w.id ? null : w.id);
                                    setRejectingWithdrawalId(null);
                                    setApprovalReceipt(null);
                                  }}
                                  disabled={withdrawalLoading === w.id}
                                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1 ${
                                    approvingId === w.id
                                      ? 'bg-green-500 text-white shadow-md shadow-green-500/20'
                                      : 'bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500 hover:text-white'
                                  }`}
                                >
                                  <CheckCircle size={14} />
                                  <span>Approve</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setRejectingWithdrawalId(rejectingWithdrawalId === w.id ? null : w.id);
                                    setApprovingId(null);
                                    setRejectWithdrawalNote('');
                                  }}
                                  disabled={withdrawalLoading === w.id}
                                  className={`px-3.5 py-1.5 border rounded-xl text-xs font-bold transition flex items-center space-x-1 ${
                                    rejectingWithdrawalId === w.id
                                      ? 'bg-red-500 border-red-500 text-white shadow-md shadow-red-500/20'
                                      : 'bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white'
                                  }`}
                                >
                                  <XCircle size={14} />
                                  <span>Reject</span>
                                </button>
                              </div>
                            ) : (
                              <div className="text-xs text-muted-foreground">
                                {w.receipt_url ? (
                                  <a
                                    href={w.receipt_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline font-bold inline-flex items-center space-x-1"
                                  >
                                    <FileText size={12} />
                                    <span>View Payout Receipt</span>
                                  </a>
                                ) : (
                                  <span>Processed</span>
                                )}
                                {w.admin_notes && <div className="text-white/40 italic">Note: "{w.admin_notes}"</div>}
                              </div>
                            )}
                          </td>
                        </tr>
                        {approvingId === w.id && w.status === 'pending' && (
                          <tr className="bg-green-950/20 border-t border-green-500/10">
                            <td colSpan={6} className="px-6 py-4 text-left">
                              <div className="flex items-end space-x-3">
                                <div className="flex-1">
                                  <label className="text-[10px] font-bold text-green-400 uppercase tracking-wider mb-1.5 block">
                                    Upload ANZ Transfer Receipt / Payout Proof (JPG, PNG, PDF)
                                  </label>
                                  <input
                                    type="file"
                                    onChange={e => setApprovalReceipt(e.target.files?.[0] || null)}
                                    className="w-full bg-white/5 border border-green-500/20 focus:border-green-500/60 rounded-xl px-4 py-2 text-sm focus:outline-none text-white file:mr-4 file:py-1 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-green-500/20 file:text-green-400 hover:file:bg-green-500/30"
                                    accept="image/*,application/pdf"
                                  />
                                </div>
                                <button
                                  onClick={() => handleApproveWithdrawal(w.id)}
                                  disabled={withdrawalLoading === w.id || !approvalReceipt}
                                  className="px-4 py-2.5 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shrink-0"
                                >
                                  {withdrawalLoading === w.id ? (
                                    <Loader2 size={13} className="animate-spin" />
                                  ) : (
                                    <CheckCircle size={13} />
                                  )}
                                  <span>Confirm Approval & Upload</span>
                                </button>
                                <button
                                  onClick={() => { setApprovingId(null); setApprovalReceipt(null); }}
                                  className="px-3 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold text-muted-foreground transition shrink-0"
                                >
                                  Cancel
                                </button>
                              </div>
                            </td>
                          </tr>
                        )}
                        {rejectingWithdrawalId === w.id && w.status === 'pending' && (
                          <tr className="bg-red-950/20 border-t border-red-500/10">
                            <td colSpan={6} className="px-6 py-4 text-left">
                              <div className="flex items-end space-x-3">
                                <div className="flex-1">
                                  <label className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-1.5 block">
                                    Rejection Reason (optional — press Enter to confirm)
                                  </label>
                                  <input
                                    type="text"
                                    value={rejectWithdrawalNote}
                                    onChange={e => setRejectWithdrawalNote(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleRejectWithdrawal(w.id)}
                                    placeholder="e.g. Account number invalid, details mismatch…"
                                    className="w-full bg-white/5 border border-red-500/20 focus:border-red-500/60 rounded-xl px-4 py-2.5 text-sm focus:outline-none text-white placeholder:text-white/20"
                                    autoFocus
                                  />
                                </div>
                                <button
                                  onClick={() => handleRejectWithdrawal(w.id)}
                                  disabled={withdrawalLoading === w.id}
                                  className="px-4 py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shrink-0"
                                >
                                  {withdrawalLoading === w.id ? (
                                    <Loader2 size={13} className="animate-spin" />
                                  ) : (
                                    <XCircle size={13} />
                                  )}
                                  <span>Confirm Reject</span>
                                </button>
                                <button
                                  onClick={() => { setRejectingWithdrawalId(null); setRejectWithdrawalNote(''); }}
                                  className="px-3 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold text-muted-foreground transition shrink-0"
                                >
                                  Cancel
                                </button>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}


      {activeTab === 'ledger' && (
        <div className="space-y-8 animate-in fade-in duration-300">

          {/* ── Summary Cards ── */}
          {isLoadingLedger ? (
            <div className="flex items-center justify-center py-20 text-muted-foreground">
              <Loader2 size={32} className="animate-spin mr-3" />
              <span className="font-bold">Loading financial data…</span>
            </div>
          ) : ledger ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {[
                  { label: 'System Balance', value: ledger.system_total_balance, icon: <Scale size={20} className="text-primary" />, color: 'text-primary', note: 'All wallets combined' },
                  { label: 'Total Money In', value: ledger.total_credits_in, icon: <ArrowUpRight size={20} className="text-green-400" />, color: 'text-green-400', note: 'All-time credits' },
                  { label: 'Total Money Out', value: ledger.total_debits_out, icon: <ArrowDownLeft size={20} className="text-red-400" />, color: 'text-red-400', note: 'All-time debits' },
                  { label: 'Pending Outflows', value: ledger.pending_outflows, icon: <Clock size={20} className="text-yellow-400" />, color: 'text-yellow-400', note: 'Awaiting confirmation' },
                  { label: 'Net Position', value: ledger.net_position, icon: <TrendingUp size={20} className="text-blue-400" />, color: 'text-blue-400', note: 'Credits minus debits' },
                ].map(({ label, value, icon, color, note }) => (
                  <div key={label} className="glass-card p-5 rounded-3xl">
                    <div className="flex items-center justify-between mb-3">
                      {icon}
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{label}</span>
                    </div>
                    <p className={`text-2xl font-black ${color}`}>${Number(value).toFixed(2)}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{note}</p>
                  </div>
                ))}
              </div>

              {/* ── Reconciliation Alert ── */}
              <div className="flex items-start space-x-3 p-5 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
                <Scale size={20} className="text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-blue-300 text-sm">Bank Reconciliation Guide</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    <span className="text-white font-bold">Real bank balance ≈ Total Money In (${Number(ledger.total_credits_in).toFixed(2)}) − Confirmed Withdrawals Out (${Number(ledger.withdrawals_out).toFixed(2)}) = ${(ledger.total_credits_in - ledger.withdrawals_out).toFixed(2)}</span>
                    {' '}— Pending outflows of <span className="text-yellow-400 font-bold">${Number(ledger.pending_outflows).toFixed(2)}</span> are still held in wallets but owed to users.
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {/* ── Balance by Role ── */}
                <div className="glass-card rounded-3xl overflow-hidden">
                  <div className="p-5 border-b border-white/10 flex items-center space-x-2">
                    <Users size={18} className="text-primary" />
                    <h3 className="font-bold">Balance by Role</h3>
                    <span className="text-xs text-muted-foreground ml-auto">Click row to expand individuals</span>
                  </div>
                  <table className="w-full text-sm">
                    <thead className="bg-white/5 text-xs font-bold uppercase text-muted-foreground">
                      <tr>
                        <th className="px-5 py-3 text-left">Role</th>
                        <th className="px-5 py-3 text-right">Users</th>
                        <th className="px-5 py-3 text-right">Total Balance</th>
                        <th className="px-5 py-3 text-right">Share</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {ledger.balance_by_role?.map((row: any) => {
                        const pct = ledger.system_total_balance > 0
                          ? ((row.total_balance / ledger.system_total_balance) * 100).toFixed(1)
                          : '0.0';
                        const isExpanded = expandedRoles[row.role];
                        const individuals: any[] = ledger.users_by_role?.[row.role] ?? [];
                        return (
                          <Fragment key={row.role}>
                            <tr
                              className="hover:bg-white/5 transition cursor-pointer select-none"
                              onClick={() => setExpandedRoles(prev => ({ ...prev, [row.role]: !prev[row.role] }))}
                            >
                              <td className="px-5 py-3 font-bold flex items-center space-x-2 capitalize">
                                {isExpanded ? <ChevronDown size={14} className="text-primary" /> : <ChevronRight size={14} className="text-muted-foreground" />}
                                <span>{row.role}</span>
                              </td>
                              <td className="px-5 py-3 text-right text-muted-foreground">{row.user_count}</td>
                              <td className="px-5 py-3 text-right font-bold text-primary">${Number(row.total_balance).toFixed(2)}</td>
                              <td className="px-5 py-3 text-right">
                                <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full font-bold">{pct}%</span>
                              </td>
                            </tr>
                            {isExpanded && individuals.map((u: any) => (
                              <tr key={u.id} className="bg-white/[0.02] text-sm border-t border-white/5">
                                <td className="pl-10 pr-5 py-2 text-muted-foreground" colSpan={2}>
                                  <div className="font-medium text-white">{u.name}</div>
                                  <div className="text-xs text-muted-foreground">{u.email}</div>
                                </td>
                                <td className="px-5 py-2 text-right font-bold text-white">${Number(u.balance).toFixed(2)}</td>
                                <td className="px-5 py-2 text-right text-muted-foreground text-xs">{u.currency}</td>
                              </tr>
                            ))}
                          </Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* ── Revenue by Source ── */}
                <div className="glass-card rounded-3xl overflow-hidden">
                  <div className="p-5 border-b border-white/10 flex items-center space-x-2">
                    <BarChart3 size={18} className="text-green-400" />
                    <h3 className="font-bold">Credits by Source</h3>
                  </div>
                  <table className="w-full text-sm">
                    <thead className="bg-white/5 text-xs font-bold uppercase text-muted-foreground">
                      <tr>
                        <th className="px-5 py-3 text-left">Source</th>
                        <th className="px-5 py-3 text-right">Transactions</th>
                        <th className="px-5 py-3 text-right">Total Credited</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {ledger.revenue_by_source?.length === 0 ? (
                        <tr><td colSpan={3} className="px-5 py-6 text-center text-muted-foreground italic">No credit transactions yet.</td></tr>
                      ) : ledger.revenue_by_source?.map((row: any) => (
                        <tr key={row.source} className="hover:bg-white/5 transition">
                          <td className="px-5 py-3 font-bold capitalize">{row.source.replace(/_/g, ' ')}</td>
                          <td className="px-5 py-3 text-right text-muted-foreground">{row.count}</td>
                          <td className="px-5 py-3 text-right font-bold text-green-400">${Number(row.total).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* ── Platform Revenue (10% Fee) ── */}
                <div className="glass-card rounded-3xl overflow-hidden border border-primary/20">
                  <div className="p-5 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-primary/10 to-transparent">
                    <div className="flex items-center space-x-2">
                      <TrendingUp size={18} className="text-primary" />
                      <h3 className="font-bold">Platform Revenue</h3>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary/70 bg-primary/10 px-2 py-1 rounded-full border border-primary/20">10% Fee</span>
                  </div>

                  {/* Total Revenue Hero */}
                  <div className="p-5 border-b border-white/10">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total Income (All-Time)</p>
                    <p className="text-3xl font-black text-primary mt-1">${Number(ledger.platform_revenue ?? 0).toFixed(2)} <span className="text-base font-bold text-muted-foreground">AUD</span></p>
                    <p className="text-xs text-muted-foreground mt-1">Collected from 10% platform fee on purchases</p>
                  </div>

                  {/* Monthly Breakdown */}
                  <table className="w-full text-sm">
                    <thead className="bg-white/5 text-xs font-bold uppercase text-muted-foreground">
                      <tr>
                        <th className="px-5 py-3 text-left">Month</th>
                        <th className="px-5 py-3 text-right">Purchases</th>
                        <th className="px-5 py-3 text-right">Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {!ledger.platform_revenue_by_month?.length ? (
                        <tr><td colSpan={3} className="px-5 py-6 text-center text-muted-foreground italic">No revenue yet.</td></tr>
                      ) : ledger.platform_revenue_by_month.map((row: any) => (
                        <tr key={row.month} className="hover:bg-white/5 transition">
                          <td className="px-5 py-3 font-bold font-mono">{row.month}</td>
                          <td className="px-5 py-3 text-right text-muted-foreground">{row.count}</td>
                          <td className="px-5 py-3 text-right font-bold text-primary">${Number(row.total).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>


              {/* ── Revenue Transactions (Platform 10% Fee) ── */}
              <div className="glass-card rounded-3xl overflow-hidden border border-primary/10">
                <div className="p-5 border-b border-white/10 flex flex-col md:flex-row md:items-center gap-4 bg-gradient-to-r from-primary/5 to-transparent">
                  <div className="flex items-center space-x-2">
                    <TrendingUp size={18} className="text-primary" />
                    <h3 className="font-bold">Revenue Transactions</h3>
                    <span className="text-[10px] font-bold text-primary/80 bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full uppercase tracking-widest">10% Platform Fee</span>
                    {revTxnMeta && (
                      <span className="text-xs text-muted-foreground">({revTxnMeta.total} total)</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 md:ml-auto">
                    <input
                      type="text"
                      placeholder="Search buyer, creator or title…"
                      value={revTxnSearch}
                      onChange={e => setRevTxnSearch(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { setRevTxnPage(1); fetchRevTxns(1, revTxnSearch); } }}
                      className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:border-primary w-64"
                    />
                    <button
                      onClick={() => { setRevTxnPage(1); fetchRevTxns(1, revTxnSearch); }}
                      className="p-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition"
                      title="Search"
                    >
                      <RefreshCw size={14} />
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  {isLoadingRevTxns ? (
                    <div className="flex items-center justify-center py-12 text-muted-foreground">
                      <Loader2 size={24} className="animate-spin mr-2" />
                      <span className="text-sm font-bold">Loading revenue transactions…</span>
                    </div>
                  ) : (
                    <table className="w-full text-sm">
                      <thead className="bg-white/5 text-xs font-bold uppercase text-muted-foreground">
                        <tr>
                          <th className="px-5 py-3 text-left">Purchase #</th>
                          <th className="px-5 py-3 text-left">Buyer</th>
                          <th className="px-5 py-3 text-left">Content</th>
                          <th className="px-5 py-3 text-left">Artist / Creator</th>
                          <th className="px-5 py-3 text-right">Sale Amount</th>
                          <th className="px-5 py-3 text-right">Platform Cut (10%)</th>
                          <th className="px-5 py-3 text-center">Status</th>
                          <th className="px-5 py-3 text-right">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {revTxns.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="px-5 py-10 text-center text-muted-foreground italic">
                              No revenue transactions yet.
                            </td>
                          </tr>
                        ) : revTxns.map((row: any) => (
                          <tr key={row.id} className="hover:bg-white/5 transition group">
                            {/* Purchase ID */}
                            <td className="px-5 py-3 font-mono font-bold text-primary text-xs">
                              #{row.purchase_id}
                            </td>

                            {/* Buyer */}
                            <td className="px-5 py-3">
                              <div className="flex items-center space-x-2">
                                <div className="w-7 h-7 rounded-full bg-blue-500/20 flex items-center justify-center text-[10px] font-bold text-blue-400 shrink-0">
                                  {row.buyer_name?.charAt(0) ?? '?'}
                                </div>
                                <div>
                                  <div className="font-semibold text-white text-xs leading-tight">{row.buyer_name ?? '—'}</div>
                                  <div className="text-[10px] text-muted-foreground truncate max-w-[130px]">{row.buyer_email}</div>
                                </div>
                              </div>
                            </td>

                            {/* Content */}
                            <td className="px-5 py-3">
                              <div className="font-medium text-white text-xs truncate max-w-[150px]">{row.content_title ?? '—'}</div>
                              <div className="text-[10px] text-muted-foreground capitalize">{row.content_type ?? 'unknown'}</div>
                            </td>

                            {/* Creator */}
                            <td className="px-5 py-3">
                              <div className="flex items-center space-x-2">
                                <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center text-[10px] font-bold text-emerald-400 shrink-0">
                                  {row.creator_name?.charAt(0) ?? '?'}
                                </div>
                                <div>
                                  <div className="font-semibold text-white text-xs leading-tight">{row.creator_name ?? '—'}</div>
                                  {row.creator_email && <div className="text-[10px] text-muted-foreground truncate max-w-[130px]">{row.creator_email}</div>}
                                </div>
                              </div>
                            </td>

                            {/* Sale Amount */}
                            <td className="px-5 py-3 text-right font-bold text-white">
                              ${Number(row.sale_amount ?? 0).toFixed(2)}
                            </td>

                            {/* Platform Cut */}
                            <td className="px-5 py-3 text-right font-black text-primary">
                              +${Number(row.platform_cut ?? 0).toFixed(2)}
                            </td>

                            {/* Status */}
                            <td className="px-5 py-3 text-center">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                row.status === 'available' ? 'bg-green-500/20 text-green-400' :
                                row.status === 'pending'   ? 'bg-yellow-500/20 text-yellow-400' :
                                'bg-white/10 text-white'
                              }`}>
                                {row.status}
                              </span>
                            </td>

                            {/* Date */}
                            <td className="px-5 py-3 text-right text-muted-foreground text-xs whitespace-nowrap">
                              {new Date(row.created_at).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Pagination */}
                {revTxnMeta && revTxnMeta.last_page > 1 && (
                  <div className="p-4 border-t border-white/10 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground text-xs">
                      Page {revTxnMeta.current_page} of {revTxnMeta.last_page} ({revTxnMeta.total} rows)
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        disabled={revTxnMeta.current_page <= 1}
                        onClick={() => { const p = revTxnPage - 1; setRevTxnPage(p); fetchRevTxns(p); }}
                        className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition font-bold text-xs"
                      >← Prev</button>
                      <button
                        disabled={revTxnMeta.current_page >= revTxnMeta.last_page}
                        onClick={() => { const p = revTxnPage + 1; setRevTxnPage(p); fetchRevTxns(p); }}
                        className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition font-bold text-xs"
                      >Next →</button>
                    </div>
                  </div>
                )}
              </div>

              {/* ── System Transaction Log ── */}

              <div className="glass-card rounded-3xl overflow-hidden">
                <div className="p-5 border-b border-white/10 flex flex-col gap-4">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex items-center space-x-2">
                      <FileText size={18} className="text-primary" />
                      <h3 className="font-bold">System Transaction Log</h3>
                      {ledgerTxnMeta && (
                        <span className="text-xs text-muted-foreground">({ledgerTxnMeta.total} total)</span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 md:ml-auto">
                      <select
                        value={ledgerTxnTypeFilter}
                        onChange={e => { setLedgerTxnTypeFilter(e.target.value); setLedgerTxnPage(1); fetchLedgerTxns(1, e.target.value, ledgerTxnSourceFilter, ledgerUserSearch); }}
                        className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:border-primary"
                      >
                        <option value="" className="bg-[#0f1322]">All Types</option>
                        <option value="credit" className="bg-[#0f1322]">Credits only</option>
                        <option value="debit" className="bg-[#0f1322]">Debits only</option>
                      </select>
                      <select
                        value={ledgerTxnSourceFilter}
                        onChange={e => { setLedgerTxnSourceFilter(e.target.value); setLedgerTxnPage(1); fetchLedgerTxns(1, ledgerTxnTypeFilter, e.target.value, ledgerUserSearch); }}
                        className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:border-primary"
                      >
                        <option value="" className="bg-[#0f1322]">All Sources</option>
                        <option value="bank_deposit" className="bg-[#0f1322]">Bank Deposit</option>
                        <option value="stripe" className="bg-[#0f1322]">Stripe</option>
                        <option value="withdrawal" className="bg-[#0f1322]">Withdrawal</option>
                        <option value="redeem_code" className="bg-[#0f1322]">Redeem Code</option>
                        <option value="royalty" className="bg-[#0f1322]">Royalty</option>
                        <option value="tip" className="bg-[#0f1322]">Tip</option>
                        <option value="subscription" className="bg-[#0f1322]">Subscription</option>
                        <option value="admin_adjustment" className="bg-[#0f1322]">Admin Adjustment</option>
                      </select>
                      <button
                        onClick={() => fetchLedgerTxns(ledgerTxnPage)}
                        className="p-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition"
                        title="Refresh"
                      >
                        <RefreshCw size={14} />
                      </button>
                    </div>
                  </div>
                  {/* User search bar */}
                  <div className="relative">
                    <input
                      type="text"
                      value={ledgerUserSearch}
                      onChange={e => setLedgerUserSearch(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          setLedgerTxnPage(1);
                          fetchLedgerTxns(1, ledgerTxnTypeFilter, ledgerTxnSourceFilter, e.currentTarget.value);
                        }
                      }}
                      placeholder="Search by user name or email… (press Enter)"
                      className="w-full bg-white/5 border border-white/10 focus:border-primary rounded-xl px-4 py-2 text-sm focus:outline-none text-white placeholder:text-white/30"
                    />
                    {ledgerUserSearch && (
                      <button
                        onClick={() => { setLedgerUserSearch(''); setLedgerTxnPage(1); fetchLedgerTxns(1, ledgerTxnTypeFilter, ledgerTxnSourceFilter, ''); }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition"
                      >
                        <XCircle size={14} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-white/5 text-xs font-bold uppercase text-muted-foreground">
                      <tr>
                        {[['created_at','Date'],['user','User'],['role','Role'],['type','Type'],['source','Source'],['amount','Amount'],['description','Description']].map(([col, label]) => {
                          const sortable = ['created_at','amount','type','source'].includes(col);
                          const isActive = ledgerSortBy === col;
                          return (
                            <th
                              key={col}
                              className={`px-5 py-3 ${col === 'amount' ? 'text-right' : 'text-left'} ${sortable ? 'cursor-pointer select-none hover:text-white transition' : ''}`}
                              onClick={() => sortable && handleLedgerSort(col)}
                            >
                              <span className="inline-flex items-center gap-1">
                                {label}
                                {sortable && (
                                  <span className={`text-[10px] transition-opacity ${isActive ? 'opacity-100 text-primary' : 'opacity-25'}`}>
                                    {isActive ? (ledgerSortDir === 'desc' ? '↓' : '↑') : '↕'}
                                  </span>
                                )}
                              </span>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {ledgerTxns.length === 0 ? (
                        <tr><td colSpan={7} className="px-5 py-10 text-center text-muted-foreground italic">No transactions found.</td></tr>
                      ) : ledgerTxns.map((tx: any) => (
                        <tr key={tx.id} className="hover:bg-white/5 transition">
                          <td className="px-5 py-3 text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(tx.created_at).toLocaleString()}
                          </td>
                          <td className="px-5 py-3">
                            <div className="font-medium text-white whitespace-nowrap">{tx.wallet?.user?.name ?? '—'}</div>
                            <div className="text-xs text-muted-foreground">{tx.wallet?.user?.email}</div>
                          </td>
                          <td className="px-5 py-3">
                            <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full font-bold capitalize">
                              {tx.wallet?.user?.role ?? '—'}
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                              tx.type === 'credit'
                                ? 'bg-green-500/15 text-green-400 border border-green-500/20'
                                : 'bg-red-500/15 text-red-400 border border-red-500/20'
                            }`}>
                              {tx.type}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-xs text-muted-foreground capitalize">
                            {tx.source?.replace(/_/g, ' ')}
                          </td>
                          <td className={`px-5 py-3 text-right font-bold whitespace-nowrap ${
                            tx.type === 'credit' ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {tx.type === 'credit' ? '+' : ''}${Math.abs(Number(tx.amount)).toFixed(2)}
                          </td>
                          <td className="px-5 py-3 text-xs text-muted-foreground max-w-xs truncate">
                            {tx.description ?? '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {ledgerTxnMeta && ledgerTxnMeta.last_page > 1 && (
                  <div className="p-4 border-t border-white/10 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground text-xs">
                      Page {ledgerTxnMeta.current_page} of {ledgerTxnMeta.last_page} &nbsp;·&nbsp; {ledgerTxnMeta.total} records
                    </span>
                    <div className="flex space-x-2">
                      <button
                        disabled={ledgerTxnMeta.current_page <= 1}
                        onClick={() => { const p = ledgerTxnPage - 1; setLedgerTxnPage(p); fetchLedgerTxns(p); }}
                        className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold disabled:opacity-40 transition"
                      >
                        ← Prev
                      </button>
                      <button
                        disabled={ledgerTxnMeta.current_page >= ledgerTxnMeta.last_page}
                        onClick={() => { const p = ledgerTxnPage + 1; setLedgerTxnPage(p); fetchLedgerTxns(p); }}
                        className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold disabled:opacity-40 transition"
                      >
                        Next →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-20 text-muted-foreground">
              <Scale size={40} className="mx-auto mb-4 opacity-30" />
              <p>Click the Ledger tab to load financial data.</p>
            </div>
          )}
        </div>
      )}

      {/* ── User Wallet Transactions Modal ── */}
      {selectedUserForTx && (
        <div 
          onClick={() => setSelectedUserForTx(null)}
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300"
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="relative w-full max-w-2xl bg-gradient-to-b from-[#0a122c] to-[#050716] p-8 rounded-[2.5rem] border border-[#00e5ff]/20 shadow-2xl shadow-[#00e5ff]/10 animate-in zoom-in-95 duration-300"
          >
            {/* Close Button */}
            <button 
              onClick={() => setSelectedUserForTx(null)} 
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/5 text-muted-foreground hover:text-white transition"
            >
              <XCircle size={24} />
            </button>

            <div className="mb-6">
              <h3 className="text-2xl font-black italic tracking-tighter text-white">
                WALLET TRANSACTIONS
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Viewing transaction history for <span className="text-white font-bold">{selectedUserForTx.name}</span> ({selectedUserForTx.email})
              </p>
            </div>

            {/* User Wallet Info */}
            <div className="bg-white/5 rounded-2xl p-4 border border-white/5 mb-6 flex justify-between items-center">
              <div>
                <span className="text-xs text-muted-foreground uppercase font-bold">Current Balance</span>
                <p className="text-3xl font-black text-primary mt-1">
                  ${selectedUserForTx.wallet ? Number(selectedUserForTx.wallet.balance).toFixed(2) : '0.00'}
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-muted-foreground uppercase font-bold">Account Role</span>
                <p className="text-sm font-bold uppercase text-white mt-1">{selectedUserForTx.role}</p>
              </div>
            </div>

            {/* Transactions List */}
            <div className="max-h-[300px] overflow-y-auto pr-2 space-y-3">
              {loadingTx ? (
                <div className="flex flex-col items-center justify-center py-12 text-primary">
                  <Loader2 size={36} className="animate-spin mb-2" />
                  <p className="text-sm font-bold animate-pulse">Loading transaction logs...</p>
                </div>
              ) : txHistory.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm border border-dashed border-white/10 rounded-2xl">
                  No transaction records found for this user.
                </div>
              ) : (
                <div className="space-y-3">
                  {txHistory.map((tx: any) => {
                    const isCredit = tx.type === 'deposit' || tx.type === 'topup' || tx.type === 'earning' || tx.type === 'credit' || tx.type === 'refund';
                    return (
                      <div key={tx.id} className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between hover:bg-white/10 transition">
                        <div>
                          <p className="font-bold text-white text-sm capitalize">{tx.type} {tx.description ? `• ${tx.description}` : ''}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(tx.created_at).toLocaleString()}
                          </p>
                          {tx.related_user && (
                            <p className="text-[10px] text-primary font-bold uppercase mt-1">
                              To/From: {tx.related_user.name}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <span className={`font-black text-lg ${isCredit ? 'text-green-400' : 'text-red-400'}`}>
                            {isCredit ? '+' : '-'}${Number(tx.amount).toFixed(2)}
                          </span>
                          <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-bold">{tx.status || 'completed'}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Read-Only Notice */}
            <div className="mt-8 text-center text-xs text-muted-foreground bg-white/5 p-3 rounded-xl border border-white/5 font-semibold">
              🔒 This interface is read-only. Admins cannot amend or manually credit/debit these logs.
            </div>
          </div>
        </div>
      )}

      {/* ── Manual Wallet Balance Adjustment Modal ── */}
      {adjustingUser && (
        <div 
          onClick={() => setAdjustingUser(null)}
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300"
        >
          <form 
            onSubmit={handleAdjustWallet}
            onClick={(e) => e.stopPropagation()} 
            className="relative w-full max-w-md bg-gradient-to-b from-[#0a122c] to-[#050716] p-8 rounded-[2.5rem] border border-[#00e5ff]/20 shadow-2xl shadow-[#00e5ff]/10 animate-in zoom-in-95 duration-300 space-y-6"
          >
            {/* Close Button */}
            <button 
              type="button"
              onClick={() => setAdjustingUser(null)} 
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/5 text-muted-foreground hover:text-white transition"
            >
              <XCircle size={24} />
            </button>

            <div>
              <h3 className="text-2xl font-black italic tracking-tighter text-white">
                ADJUST WALLET BALANCE
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Manually credit or debit <span className="text-white font-bold">{adjustingUser.name}</span>
              </p>
            </div>

            {/* Current Balance card */}
            <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex justify-between items-center">
              <div>
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Current Balance</span>
                <p className="text-2xl font-black text-[#00e5ff] mt-0.5">
                  ${adjustingUser.wallet ? Number(adjustingUser.wallet.balance).toFixed(2) : '0.00'} AUD
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">User ID</span>
                <p className="text-xs font-bold text-white mt-1">#{adjustingUser.id}</p>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              {/* Adjustment Type Selection */}
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                  Adjustment Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setAdjustType('credit')}
                    className={`py-2.5 rounded-xl font-bold text-sm border transition flex items-center justify-center space-x-2 ${
                      adjustType === 'credit'
                        ? 'bg-green-500/10 border-green-500/40 text-green-400 shadow shadow-green-500/5'
                        : 'bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <span>➕ Credit (Top-up)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType('debit')}
                    className={`py-2.5 rounded-xl font-bold text-sm border transition flex items-center justify-center space-x-2 ${
                      adjustType === 'debit'
                        ? 'bg-red-500/10 border-red-500/40 text-red-400 shadow shadow-red-500/5'
                        : 'bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <span>➖ Debit (Deduct)</span>
                  </button>
                </div>
              </div>

              {/* Amount Input */}
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                  Amount (AUD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max="100000"
                  required
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  placeholder="e.g. 50.00"
                  className="w-full bg-white/5 border border-white/10 focus:border-[#00e5ff] rounded-xl px-4 py-2.5 text-sm focus:outline-none text-white font-bold"
                  autoFocus
                />
              </div>

              {/* Note / Reason */}
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                  Adjustment Note (Optional)
                </label>
                <input
                  type="text"
                  value={adjustNote}
                  onChange={(e) => setAdjustNote(e.target.value)}
                  placeholder="e.g. Approved manual bank deposit, refund…"
                  className="w-full bg-white/5 border border-white/10 focus:border-[#00e5ff] rounded-xl px-4 py-2.5 text-sm focus:outline-none text-white"
                />
              </div>
            </div>

            {/* Error/Success Feedbacks */}
            {userMsg && (
              <div className={`p-3.5 rounded-xl text-xs font-semibold border ${
                userMsg.type === 'success'
                  ? 'bg-green-500/10 border-green-500/30 text-green-400'
                  : 'bg-red-500/10 border-red-500/30 text-red-400'
              }`}>
                {userMsg.text}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center space-x-3 pt-2">
              <button
                type="submit"
                disabled={adjustLoading}
                className={`flex-1 py-3 rounded-xl font-bold text-sm transition flex items-center justify-center space-x-2 text-white shadow-lg ${
                  adjustType === 'credit'
                    ? 'bg-green-500 hover:bg-green-600 shadow-green-500/20'
                    : 'bg-red-500 hover:bg-red-600 shadow-red-500/20'
                } disabled:opacity-50`}
              >
                {adjustLoading ? <Loader2 size={16} className="animate-spin" /> : null}
                <span>
                  Confirm {adjustType === 'credit' ? 'Credit' : 'Debit'}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setAdjustingUser(null)}
                className="px-5 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-bold text-muted-foreground hover:text-white transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
