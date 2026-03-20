import { useState, useEffect } from 'react'
import AdminLayout from '../components/AdminLayout'
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  FileCheck,
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  Users,
  Trophy,
  Eye,
  ChevronRight
} from 'lucide-react'
import { API_URL } from '../config/api'

const AdminPendingActions = () => {
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState({})
  const [pendingActions, setPendingActions] = useState({})
  const [activeTab, setActiveTab] = useState('all')
  const [actionLoading, setActionLoading] = useState(null)

  useEffect(() => {
    fetchPendingActions()
  }, [])

  const fetchPendingActions = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('adminToken')
      const res = await fetch(`${API_URL}/admin/pending-actions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success) {
        setSummary(data.summary)
        setPendingActions(data.pendingActions)
      }
    } catch (error) {
      console.error('Error fetching pending actions:', error)
    }
    setLoading(false)
  }

  const handleApprove = async (type, id) => {
    setActionLoading(id)
    try {
      const token = localStorage.getItem('adminToken')
      let endpoint = ''
      
      switch(type) {
        case 'KYC':
          endpoint = `${API_URL}/kyc/admin/approve/${id}`
          break
        case 'Withdrawal':
          endpoint = `${API_URL}/wallet/admin/approve/${id}`
          break
        case 'Deposit':
          endpoint = `${API_URL}/wallet/admin/approve-deposit/${id}`
          break
        case 'Master Trader':
          endpoint = `${API_URL}/copy-trading/admin/approve-master/${id}`
          break
        case 'Challenge':
          endpoint = `${API_URL}/prop-firm/admin/approve/${id}`
          break
        default:
          return
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      const data = await res.json()
      if (data.success) {
        fetchPendingActions()
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
      
      switch(type) {
        case 'KYC':
          endpoint = `${API_URL}/kyc/admin/reject/${id}`
          break
        case 'Withdrawal':
          endpoint = `${API_URL}/wallet/admin/reject/${id}`
          break
        case 'Deposit':
          endpoint = `${API_URL}/wallet/admin/reject-deposit/${id}`
          break
        case 'Master Trader':
          endpoint = `${API_URL}/copy-trading/admin/reject-master/${id}`
          break
        case 'Challenge':
          endpoint = `${API_URL}/prop-firm/admin/reject/${id}`
          break
        default:
          return
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      })
      const data = await res.json()
      if (data.success) {
        fetchPendingActions()
      } else {
        alert(data.message || 'Action failed')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Action failed')
    }
    setActionLoading(null)
  }

  const getTypeIcon = (type) => {
    switch(type) {
      case 'KYC': return <FileCheck size={16} className="text-blue-500" />
      case 'Withdrawal': return <ArrowUpCircle size={16} className="text-red-500" />
      case 'Deposit': return <ArrowDownCircle size={16} className="text-green-500" />
      case 'IB Withdrawal': return <Wallet size={16} className="text-orange-500" />
      case 'Master Trader': return <Users size={16} className="text-purple-500" />
      case 'Challenge': return <Trophy size={16} className="text-yellow-500" />
      default: return <Clock size={16} className="text-gray-500" />
    }
  }

  const getTypeColor = (type) => {
    switch(type) {
      case 'KYC': return 'bg-blue-500/20 text-blue-500'
      case 'Withdrawal': return 'bg-red-500/20 text-red-500'
      case 'Deposit': return 'bg-green-500/20 text-green-500'
      case 'IB Withdrawal': return 'bg-orange-500/20 text-orange-500'
      case 'Master Trader': return 'bg-purple-500/20 text-purple-500'
      case 'Challenge': return 'bg-yellow-500/20 text-yellow-500'
      default: return 'bg-gray-500/20 text-gray-500'
    }
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getAllPendingItems = () => {
    const all = []
    Object.entries(pendingActions).forEach(([key, items]) => {
      if (Array.isArray(items)) {
        all.push(...items)
      }
    })
    return all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }

  const getFilteredItems = () => {
    if (activeTab === 'all') return getAllPendingItems()
    return pendingActions[activeTab] || []
  }

  const tabs = [
    { key: 'all', label: 'All', count: summary.total || 0 },
    { key: 'kyc', label: 'KYC', count: summary.kyc || 0 },
    { key: 'withdrawals', label: 'Withdrawals', count: summary.withdrawals || 0 },
    { key: 'deposits', label: 'Deposits', count: summary.deposits || 0 },
    { key: 'masterTraders', label: 'Master Traders', count: summary.masterTraders || 0 },
    { key: 'challenges', label: 'Challenges', count: summary.challenges || 0 },
  ]

  return (
    <AdminLayout title="Pending Actions" subtitle="Review and approve pending requests">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <div className="bg-dark-800 rounded-xl p-4 border border-gray-800">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={18} className="text-yellow-500" />
            <span className="text-gray-400 text-sm">Total Pending</span>
          </div>
          <p className="text-2xl font-bold text-white">{summary.total || 0}</p>
        </div>
        <div className="bg-dark-800 rounded-xl p-4 border border-gray-800">
          <div className="flex items-center gap-2 mb-2">
            <FileCheck size={18} className="text-blue-500" />
            <span className="text-gray-400 text-sm">KYC</span>
          </div>
          <p className="text-2xl font-bold text-white">{summary.kyc || 0}</p>
        </div>
        <div className="bg-dark-800 rounded-xl p-4 border border-gray-800">
          <div className="flex items-center gap-2 mb-2">
            <ArrowUpCircle size={18} className="text-red-500" />
            <span className="text-gray-400 text-sm">Withdrawals</span>
          </div>
          <p className="text-2xl font-bold text-white">{summary.withdrawals || 0}</p>
        </div>
        <div className="bg-dark-800 rounded-xl p-4 border border-gray-800">
          <div className="flex items-center gap-2 mb-2">
            <ArrowDownCircle size={18} className="text-green-500" />
            <span className="text-gray-400 text-sm">Deposits</span>
          </div>
          <p className="text-2xl font-bold text-white">{summary.deposits || 0}</p>
        </div>
        <div className="bg-dark-800 rounded-xl p-4 border border-gray-800">
          <div className="flex items-center gap-2 mb-2">
            <Users size={18} className="text-purple-500" />
            <span className="text-gray-400 text-sm">Master Traders</span>
          </div>
          <p className="text-2xl font-bold text-white">{summary.masterTraders || 0}</p>
        </div>
        <div className="bg-dark-800 rounded-xl p-4 border border-gray-800">
          <div className="flex items-center gap-2 mb-2">
            <Trophy size={18} className="text-yellow-500" />
            <span className="text-gray-400 text-sm">Challenges</span>
          </div>
          <p className="text-2xl font-bold text-white">{summary.challenges || 0}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-dark-800 rounded-xl border border-gray-800 overflow-hidden">
        {/* Tabs */}
        <div className="flex items-center gap-2 p-4 border-b border-gray-800 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.key 
                  ? 'bg-primary-500 text-white' 
                  : 'bg-dark-700 text-gray-400 hover:text-white'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                  activeTab === tab.key ? 'bg-white/20' : 'bg-gray-700'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
          <button
            onClick={fetchPendingActions}
            className="ml-auto p-2 hover:bg-dark-700 rounded-lg transition-colors text-gray-400 hover:text-white"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw size={24} className="animate-spin text-gray-500" />
          </div>
        ) : getFilteredItems().length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <CheckCircle size={48} className="mb-4 text-green-500" />
            <p className="text-lg font-medium">All caught up!</p>
            <p className="text-sm">No pending actions in this category</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {getFilteredItems().map((item) => (
              <div key={item._id} className="p-4 hover:bg-dark-700/50 transition-colors">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={`p-2 rounded-lg ${getTypeColor(item.type)}`}>
                      {getTypeIcon(item.type)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getTypeColor(item.type)}`}>
                          {item.type}
                        </span>
                        <span className="text-white font-medium truncate">
                          {item.user?.firstName} {item.user?.lastName || item.user?.email}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                        {item.amount && <span className="font-medium">${item.amount.toFixed(2)}</span>}
                        {item.method && <span>{item.method}</span>}
                        {item.documentType && <span>{item.documentType}</span>}
                        {item.displayName && <span>{item.displayName}</span>}
                        {item.challengeName && <span>{item.challengeName}</span>}
                        <span>{formatDate(item.createdAt)}</span>
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
        )}
      </div>
    </AdminLayout>
  )
}

export default AdminPendingActions
