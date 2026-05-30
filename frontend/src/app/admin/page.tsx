'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/axios';
import { Users, Music, DollarSign, CheckCircle, XCircle, Clock, Radio, Plus, Trash2, Mail, ShieldAlert, KeyRound, Loader2 } from 'lucide-react';

export default function AdminPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  const [activeTab, setActiveTab] = useState<'users' | 'artists' | 'radio' | 'settings'>('artists');
  const [stats, setStats] = useState<any>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [artists, setArtists] = useState<any[]>([]);
  const [stations, setStations] = useState<any[]>([]);
  const [newStation, setNewStation] = useState({ name: '', stream_url: '', genre: '' });
  const [walletTestingMode, setWalletTestingMode] = useState<boolean>(true);
  const [redeemCodes, setRedeemCodes] = useState<any[]>([]);
  const [newCodeAmount, setNewCodeAmount] = useState('');
  const [newCodeQuantity, setNewCodeQuantity] = useState('1');
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'id', direction: 'desc' });

  const fetchData = () => {
    api.get('/api/admin/stats').then(res => setStats(res.data)).catch(err => console.error('Stats error:', err));
    api.get('/api/admin/users').then(res => setUsersList(res.data)).catch(err => console.error('Users error:', err));
    api.get('/api/admin/artists').then(res => setArtists(res.data)).catch(err => console.error('Artists error:', err));
    api.get('/api/admin/radio').then(res => setStations(res.data)).catch(err => console.error('Radio error:', err));
    api.get('/api/admin/settings').then(res => setWalletTestingMode(res.data.wallet_testing_mode)).catch(err => console.error('Settings error:', err));
    fetchRedeemCodes();
  };

  const fetchRedeemCodes = () => {
    api.get('/api/admin/redeem-codes').then(res => setRedeemCodes(res.data.codes)).catch(err => console.error('Redeem codes error:', err));
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
            <div className="p-6 border-b border-white/10">
                <h2 className="text-xl font-bold">User Management</h2>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-white/5 text-xs font-bold uppercase text-muted-foreground">
                        <tr>
                            <th className="px-6 py-4">Name</th>
                            <th className="px-6 py-4">Email</th>
                            <th className="px-6 py-4">Role</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {usersList.map(user => (
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
                                        'bg-blue-500/20 text-blue-500'
                                    }`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end space-x-2">
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
          </div>

          <div className="mt-12">
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
    </div>
  );
}
