import { useState, useEffect } from 'react'
import AdminLayout from '../components/AdminLayout'
import { 
  Users,
  TrendingUp,
  Wallet,
  CreditCard,
  RefreshCw,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  FileCheck,
  ArrowUpCircle,
  ArrowDownCircle,
  Trophy
} from 'lucide-react'
import { API_URL } from '../config/api'

const AdminOverview = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeToday: 0,
    newThisWeek: 0,
    totalDeposits: 0,
    totalWithdrawals: 0,
    pendingKYC: 0,
    pendingWithdrawals: 0,
    activeTrades: 0
  })
  const [pendingActions, setPendingActions] = useState([])
  const [pendingSummary, setPendingSummary] = useState({ total: 0 })
  const [actionLoading, setActionLoading] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch users
      const usersResponse = await fetch(`${API_URL}/admin/users`)
      if (usersResponse.ok) {
        const data = await usersResponse.json()
        setUsers(data.users || [])
      }
      
      // Fetch dashboard stats
      const statsResponse = await fetch(`${API_URL}/admin/dashboard-stats`)
      if (statsResponse.ok) {
        const data = await statsResponse.json()
        if (data.success) {
          setStats({
            totalUsers: data.stats.totalUsers || 0,
            activeToday: data.stats.totalUsers || 0,
            newThisWeek: data.stats.newThisWeek || 0,
            totalDeposits: data.stats.totalDeposits || 0,
            totalWithdrawals: data.stats.totalWithdrawals || 0,
            pendingKYC: data.stats.pendingKYC || 0,
            pendingWithdrawals: data.stats.pendingWithdrawals || 0,
            activeTrades: data.stats.activeTrades || 0
          })
        }
      }

      // Fetch pending actions
      const token = localStorage.getItem('adminToken')
      const pendingResponse = await fetch(`${API_URL}/admin/pending-actions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (pendingResponse.ok) {
        const data = await pendingResponse.json()
        if (data.success) {
          setPendingSummary(data.summary)
          // Combine all pending items into one array
          const allPending = []
          Object.values(data.pendingActions).forEach(items => {
            if (Array.isArray(items)) allPending.push(...items)
          })
          setPendingActions(allPending.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)))
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    }
    setLoading(false)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatDateTime = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTypeIcon = (type) => {
    switch(type) {
      case 'KYC': return <FileCheck size={14} className="text-blue-500" />
      case 'Withdrawal': return <ArrowUpCircle size={14} className="text-red-500" />
      case 'Deposit': return <ArrowDownCircle size={14} className="text-green-500" />
      case 'Master Trader': return <Users size={14} className="text-purple-500" />
      case 'Challenge': return <Trophy size={14} className="text-yellow-500" />
      default: return <Clock size={14} className="text-gray-500" />
    }
  }

  const getTypeColor = (type) => {
    switch(type) {
      case 'KYC': return 'bg-blue-500/20 text-blue-500'
      case 'Withdrawal': return 'bg-red-500/20 text-red-500'
      case 'Deposit': return 'bg-green-500/20 text-green-500'
      case 'Master Trader': return 'bg-purple-500/20 text-purple-500'
      case 'Challenge': return 'bg-yellow-500/20 text-yellow-500'
      default: return 'bg-gray-500/20 text-gray-500'
    }
  }

  const handleApprove = async (type, id) => {
    setActionLoading(id)
    try {
      const token = localStorage.getItem('adminToken')
      let endpoint = ''
      let method = 'PUT'
      
      switch(type) {
        case 'KYC': endpoint = `${API_URL}/kyc/admin/approve/${id}`; method = 'POST'; break
        case 'Withdrawal': endpoint = `${API_URL}/wallet/admin/approve/${id}`; break
        case 'Deposit': endpoint = `${API_URL}/wallet/admin/approve/${id}`; break
        case 'Master Trader': endpoint = `${API_URL}/copy-trading/admin/approve-master/${id}`; method = 'POST'; break
        case 'Challenge': endpoint = `${API_URL}/prop-firm/admin/approve/${id}`; method = 'POST'; break
        default: return
      }

      const res = await fetch(endpoint, {
        method: method,
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      })
      const data = await res.json()
      if (data.success) {
        fetchData()
      } else {
        alert(data.message || 'Action failed')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Action failed')
    }
    setActionLoading(null)
  }

  const handleReject = async (type, id) => {
    const reason = prompt('Enter rejection reason:')
    if (!reason) return
    
    setActionLoading(id)
    try {
      const token = localStorage.getItem('adminToken')
      let endpoint = ''
      let method = 'PUT'
      
      switch(type) {
        case 'KYC': endpoint = `${API_URL}/kyc/admin/reject/${id}`; method = 'POST'; break
        case 'Withdrawal': endpoint = `${API_URL}/wallet/admin/reject/${id}`; break
        case 'Deposit': endpoint = `${API_URL}/wallet/admin/reject/${id}`; break
        case 'Master Trader': endpoint = `${API_URL}/copy-trading/admin/reject-master/${id}`; method = 'POST'; break
        case 'Challenge': endpoint = `${API_URL}/prop-firm/admin/reject/${id}`; method = 'POST'; break
        default: return
      }

      const res = await fetch(endpoint, {
        method: method,
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      })
      const data = await res.json()
      if (data.success) {
        fetchData()
      } else {
        alert(data.message || 'Action failed')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Action failed')
    }
    setActionLoading(null)
  }

  const statCards = [
    { 
      title: 'Total Users', 
      value: stats.totalUsers, 
      icon: Users, 
      color: 'blue'
    },
    { 
      title: 'New This Week', 
      value: stats.newThisWeek, 
      icon: TrendingUp, 
      color: 'green'
    },
    { 
      title: 'Total Deposits', 
      value: `$${stats.totalDeposits.toLocaleString()}`, 
      icon: Wallet, 
      color: 'purple'
    },
    { 
      title: 'Total Withdrawals', 
      value: `$${stats.totalWithdrawals.toLocaleString()}`, 
      icon: CreditCard, 
      color: 'orange'
    },
  ]

  return (
    <AdminLayout title="Overview Dashboard" subtitle="Welcome back, Admin">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-dark-800 rounded-xl p-5 border border-gray-800">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 bg-${stat.color}-500/20 rounded-lg flex items-center justify-center`}>
                <stat.icon size={20} className={`text-${stat.color}-500`} />
              </div>
            </div>
            <p className="text-gray-500 text-sm mb-1">{stat.title}</p>
            <p className="text-white text-2xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <div className="bg-dark-800 rounded-xl p-5 border border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold">Recent Users</h2>
            <button 
              onClick={fetchData}
              className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
            >
              <RefreshCw size={16} className={`text-gray-400 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <div className="space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw size={20} className="text-gray-500 animate-spin" />
              </div>
            ) : users.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No users registered yet</p>
            ) : (
              users.slice(0, 5).map((user, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-dark-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-accent-green/20 rounded-full flex items-center justify-center">
                      <span className="text-accent-green font-medium">
                        {user.firstName?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div>
                      <p className="text-white font-medium">{user.firstName || 'Unknown'}</p>
                      <p className="text-gray-500 text-sm">{user.email}</p>
                    </div>
                  </div>
                  <span className="text-gray-500 text-sm">{formatDate(user.createdAt)}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-dark-800 rounded-xl p-5 border border-gray-800">
          <h2 className="text-white font-semibold mb-4">Platform Overview</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-dark-700 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Users size={18} className="text-blue-500" />
                </div>
                <span className="text-gray-400">New Users This Week</span>
              </div>
              <span className="text-white font-semibold">{stats.newThisWeek}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-dark-700 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                  <Calendar size={18} className="text-yellow-500" />
                </div>
                <span className="text-gray-400">Pending KYC</span>
              </div>
              <span className="text-white font-semibold">{stats.pendingKYC}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-dark-700 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <TrendingUp size={18} className="text-green-500" />
                </div>
                <span className="text-gray-400">Active Trades</span>
              </div>
              <span className="text-white font-semibold">{stats.activeTrades}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-dark-700 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <Wallet size={18} className="text-purple-500" />
                </div>
                <span className="text-gray-400">Pending Withdrawals</span>
              </div>
              <span className="text-white font-semibold">{stats.pendingWithdrawals}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Actions Section */}
      {pendingActions.length > 0 && (
        <div className="mt-6 bg-dark-800 rounded-xl border border-gray-800 overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <Clock size={20} className="text-yellow-500" />
              </div>
              <div>
                <h2 className="text-white font-semibold">Pending Actions</h2>
                <p className="text-gray-500 text-sm">{pendingSummary.total} items require your attention</p>
              </div>
            </div>
            <button 
              onClick={fetchData}
              className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
            >
              <RefreshCw size={16} className={`text-gray-400 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <div className="divide-y divide-gray-800 max-h-96 overflow-y-auto">
            {pendingActions.slice(0, 10).map((item) => (
              <div key={item._id} className="p-4 hover:bg-dark-700/50 transition-colors">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2 rounded-lg ${getTypeColor(item.type)}`}>
                      {getTypeIcon(item.type)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getTypeColor(item.type)}`}>
                          {item.type}
                        </span>
                        <span className="text-white font-medium truncate">
                          {item.user?.firstName} {item.user?.lastName || item.user?.email}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                        {item.amount && <span className="font-medium">${item.amount.toFixed(2)}</span>}
                        {item.method && <span>• {item.method}</span>}
                        <span>• {formatDateTime(item.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleApprove(item.type, item._id)}
                      disabled={actionLoading === item._id}
                      className="px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-500 rounded-lg text-sm font-medium flex items-center gap-1 transition-colors disabled:opacity-50"
                    >
                      {actionLoading === item._id ? (
                        <RefreshCw size={14} className="animate-spin" />
                      ) : (
                        <CheckCircle size={14} />
                      )}
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(item.type, item._id)}
                      disabled={actionLoading === item._id}
                      className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-500 rounded-lg text-sm font-medium flex items-center gap-1 transition-colors disabled:opacity-50"
                    >
                      <XCircle size={14} />
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

export default AdminOverview
