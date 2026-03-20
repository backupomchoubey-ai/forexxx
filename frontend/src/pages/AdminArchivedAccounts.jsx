import { useState, useEffect } from 'react'
import AdminLayout from '../components/AdminLayout'
import { API_URL } from '../config/api'
import { 
  Search,
  RefreshCw,
  CreditCard,
  User,
  Calendar,
  DollarSign,
  Archive,
  Check,
  AlertTriangle
} from 'lucide-react'

const AdminArchivedAccounts = () => {
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  
  const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}')

  useEffect(() => {
    fetchArchivedAccounts()
  }, [])

  const fetchArchivedAccounts = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${API_URL}/admin/archived-trading-accounts`)
      if (response.ok) {
        const data = await response.json()
        setAccounts(data.accounts || [])
      }
    } catch (error) {
      console.error('Error fetching archived accounts:', error)
    }
    setLoading(false)
  }

  const handleRestoreAccount = async (accountId) => {
    setActionLoading(true)
    setMessage({ type: '', text: '' })
    try {
      const response = await fetch(`${API_URL}/admin/trading-account/${accountId}/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId: adminUser._id })
      })
      
      if (response.ok) {
        setMessage({ type: 'success', text: 'Account restored successfully' })
        fetchArchivedAccounts()
      } else {
        const data = await response.json()
        setMessage({ type: 'error', text: data.message || 'Failed to restore account' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error restoring account' })
    }
    setActionLoading(false)
  }

  const filteredAccounts = accounts.filter(acc => 
    acc.accountId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    acc.userId?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    acc.userId?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    acc.userId?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <AdminLayout title="Archived Trading Accounts" subtitle="Manage archived trading accounts">
      <div className="space-y-6">
        {/* Message */}
        {message.text && (
          <div className={`p-4 rounded-lg flex items-center gap-2 ${
            message.type === 'success' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
          }`}>
            {message.type === 'success' ? <Check size={18} /> : <AlertTriangle size={18} />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-500/20 rounded-xl flex items-center justify-center">
              <Archive size={24} className="text-gray-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Archived Accounts</h2>
              <p className="text-gray-500 text-sm">{accounts.length} archived accounts</p>
            </div>
          </div>
          
          <div className="flex gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search accounts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64 bg-dark-700 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>
            <button 
              onClick={fetchArchivedAccounts}
              className="p-2 bg-dark-700 border border-gray-700 rounded-lg text-gray-400 hover:text-white hover:border-gray-600 transition-colors"
            >
              <RefreshCw size={18} />
            </button>
          </div>
        </div>

        {/* Accounts List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw size={24} className="text-blue-500 animate-spin" />
          </div>
        ) : filteredAccounts.length === 0 ? (
          <div className="bg-dark-800 rounded-xl p-8 text-center border border-gray-700">
            <Archive size={48} className="mx-auto text-gray-600 mb-4" />
            <h3 className="text-white font-medium mb-2">No Archived Accounts</h3>
            <p className="text-gray-500 text-sm">There are no archived trading accounts at the moment.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredAccounts.map(acc => (
              <div key={acc._id} className="bg-dark-800 rounded-xl p-5 border border-gray-700 hover:border-gray-600 transition-colors">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Account Info */}
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gray-600/20 rounded-xl flex items-center justify-center shrink-0">
                      <CreditCard size={20} className="text-gray-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-white font-semibold">{acc.accountId}</h3>
                        <span className="text-xs px-2 py-0.5 rounded bg-gray-600/20 text-gray-400">Archived</span>
                        {acc.isDemo && <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-400">Demo</span>}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <User size={14} />
                          {acc.userId?.firstName} {acc.userId?.lastName}
                        </span>
                        <span>{acc.userId?.email}</span>
                      </div>
                    </div>
                  </div>

                  {/* Account Details */}
                  <div className="flex flex-wrap items-center gap-6">
                    <div className="text-center">
                      <p className="text-gray-500 text-xs">Balance</p>
                      <p className="text-white font-medium">${acc.balance?.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) || '0.00'}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-500 text-xs">Credit</p>
                      <p className="text-purple-400 font-medium">${acc.credit?.toFixed(2) || '0.00'}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-500 text-xs">Type</p>
                      <p className="text-gray-300 font-medium">{acc.accountTypeId?.name || 'Standard'}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-500 text-xs">Leverage</p>
                      <p className="text-gray-300 font-medium">{acc.leverage || '1:100'}</p>
                    </div>
                  </div>

                  {/* Restore Button */}
                  <button 
                    onClick={() => handleRestoreAccount(acc._id)}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    <RefreshCw size={16} />
                    Restore Account
                  </button>
                </div>

                {/* Footer Info */}
                <div className="mt-4 pt-4 border-t border-gray-700 flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    Created: {new Date(acc.createdAt).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    Archived: {new Date(acc.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

export default AdminArchivedAccounts
