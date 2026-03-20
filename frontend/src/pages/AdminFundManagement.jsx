import { useState, useEffect } from 'react'
import AdminLayout from '../components/AdminLayout'
import { 
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Check,
  X,
  Clock,
  Building2,
  Smartphone,
  Trash2
} from 'lucide-react'
import { API_URL, API_BASE_URL } from '../config/api'

const AdminFundManagement = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [transactions, setTransactions] = useState([])
  const [stats, setStats] = useState({ deposits: 0, withdrawals: 0, pending: 0, net: 0 })
  const [loading, setLoading] = useState(true)
  const [selectedTxn, setSelectedTxn] = useState(null)
  const [userDetails, setUserDetails] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [editingDate, setEditingDate] = useState(false)
  const [editDate, setEditDate] = useState('')
  const [savingDate, setSavingDate] = useState(false)

  useEffect(() => {
    fetchTransactions()
  }, [filterType])

  const fetchTransactions = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/wallet/admin/transactions?t=${Date.now()}`)
      const data = await res.json()
      if (data.transactions) {
        let filtered = data.transactions
        if (filterType !== 'all') {
          filtered = data.transactions.filter(t => t.type?.toLowerCase() === filterType)
        }
        setTransactions(filtered)
        
        // Calculate stats - include both user deposits and admin fund additions
        const deposits = data.transactions.filter(t => {
          const type = t.type?.toLowerCase()
          const isDeposit = type === 'deposit' || type === 'admin_fund_add'
          const isApproved = t.status?.toUpperCase() === 'APPROVED' || type === 'admin_fund_add' // Admin deposits don't need approval
          return isDeposit && isApproved
        }).reduce((sum, t) => sum + (t.amount || 0), 0)
        const withdrawals = data.transactions.filter(t => t.type?.toUpperCase() === 'WITHDRAWAL' && t.status?.toUpperCase() === 'APPROVED')
          .reduce((sum, t) => sum + (t.amount || 0), 0)
        const pending = data.transactions.filter(t => t.status?.toUpperCase() === 'PENDING').length
        
        setStats({
          deposits,
          withdrawals,
          pending,
          net: deposits - withdrawals
        })
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
    }
    setLoading(false)
  }

  const handleApprove = async (txnId) => {
    try {
      const res = await fetch(`${API_URL}/wallet/transaction/${txnId}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminRemarks: '' })
      })
      const data = await res.json()
      if (res.ok) {
        alert('Transaction approved successfully!')
        fetchTransactions()
      } else {
        alert(data.message || 'Error approving transaction')
      }
    } catch (error) {
      console.error('Error approving transaction:', error)
      alert('Error approving transaction')
    }
  }

  const handleReject = async (txnId) => {
    const remarks = prompt('Enter rejection reason (optional):')
    try {
      const res = await fetch(`${API_URL}/wallet/transaction/${txnId}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminRemarks: remarks || '' })
      })
      const data = await res.json()
      if (res.ok) {
        alert('Transaction rejected!')
        fetchTransactions()
      } else {
        alert(data.message || 'Error rejecting transaction')
      }
    } catch (error) {
      console.error('Error rejecting transaction:', error)
      alert('Error rejecting transaction')
    }
  }

  const handleDelete = async (txnId) => {
    if (!confirm('Are you sure you want to delete this transaction? This action cannot be undone.')) {
      return
    }
    try {
      console.log('Deleting transaction:', txnId)
      const res = await fetch(`${API_URL}/wallet/transaction/${txnId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      })
      console.log('Delete response status:', res.status)
      const data = await res.json()
      console.log('Delete response data:', data)
      if (res.ok) {
        alert('Transaction deleted successfully!')
        fetchTransactions()
      } else {
        alert(data.message || 'Error deleting transaction')
      }
    } catch (error) {
      console.error('Error deleting transaction:', error)
      alert('Error deleting transaction: ' + error.message)
    }
  }

  const filteredTransactions = transactions.filter(txn => {
    const matchesSearch = (txn.transactionRef || txn._id)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      txn.userId?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      txn.userId?.email?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const getStatusColor = (status) => {
    const s = status?.toLowerCase()
    if (s === 'approved') return 'bg-green-500/20 text-green-500'
    if (s === 'pending') return 'bg-yellow-500/20 text-yellow-500'
    if (s === 'rejected') return 'bg-red-500/20 text-red-500'
    return 'bg-gray-500/20 text-gray-400'
  }

  const isPending = (status) => status?.toLowerCase() === 'pending'

  const viewTransactionDetails = async (txn) => {
    setSelectedTxn(txn)
    setShowDetailsModal(true)
    
    // Fetch user details including bank info
    try {
      const res = await fetch(`${API_URL}/auth/user/${txn.userId?._id || txn.userId}`)
      const data = await res.json()
      if (data.user) {
        setUserDetails(data.user)
      }
    } catch (error) {
      console.error('Error fetching user details:', error)
    }
  }

  const closeDetailsModal = () => {
    setShowDetailsModal(false)
    setSelectedTxn(null)
    setUserDetails(null)
    setEditingDate(false)
    setEditDate('')
  }

  const handleSaveDate = async () => {
    if (!editDate || !selectedTxn) return
    setSavingDate(true)
    try {
      const res = await fetch(`${API_URL}/wallet/transaction/${selectedTxn._id}/update-date`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ createdAt: editDate })
      })
      const data = await res.json()
      if (data.success) {
        // Update local state immediately
        const updatedTxn = { ...selectedTxn, createdAt: new Date(editDate).toISOString() }
        setSelectedTxn(updatedTxn)
        setEditingDate(false)
        
        // Update transactions list directly
        setTransactions(prev => prev.map(t => 
          t._id === selectedTxn._id ? { ...t, createdAt: new Date(editDate).toISOString() } : t
        ))
      } else {
        alert(data.message || 'Failed to update date')
      }
    } catch (error) {
      console.error('Error updating date:', error)
      alert('Error updating date')
    }
    setSavingDate(false)
  }

  return (
    <AdminLayout title="Fund Management" subtitle="Manage deposits and withdrawals">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-dark-800 rounded-xl p-5 border border-gray-800">
          <div className="flex items-center gap-2 mb-2">
            <ArrowDownRight size={18} className="text-green-500" />
            <p className="text-gray-500 text-sm">Total Deposits</p>
          </div>
          <p className="text-white text-2xl font-bold">${stats.deposits.toLocaleString()}</p>
        </div>
        <div className="bg-dark-800 rounded-xl p-5 border border-gray-800">
          <div className="flex items-center gap-2 mb-2">
            <ArrowUpRight size={18} className="text-red-500" />
            <p className="text-gray-500 text-sm">Total Withdrawals</p>
          </div>
          <p className="text-white text-2xl font-bold">${stats.withdrawals.toLocaleString()}</p>
        </div>
        <div className="bg-dark-800 rounded-xl p-5 border border-gray-800">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={18} className="text-yellow-500" />
            <p className="text-gray-500 text-sm">Pending Requests</p>
          </div>
          <p className="text-white text-2xl font-bold">{stats.pending}</p>
        </div>
        </div>

      {/* Transactions Table */}
      <div className="bg-dark-800 rounded-xl border border-gray-800 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 border-b border-gray-800">
          <h2 className="text-white font-semibold text-lg">All Transactions</h2>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64 bg-dark-700 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-gray-600"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-dark-700 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-gray-600"
            >
              <option value="all">All Types</option>
              <option value="deposit">Deposits</option>
              <option value="withdrawal">Withdrawals</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading transactions...</div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No transactions found</div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="block lg:hidden p-4 space-y-3">
              {filteredTransactions.map((txn) => (
                <div key={txn._id} className="bg-dark-700 rounded-xl p-4 border border-gray-700">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        txn.type?.toUpperCase() === 'DEPOSIT' ? 'bg-green-500/20' : 'bg-red-500/20'
                      }`}>
                        {txn.type?.toUpperCase() === 'DEPOSIT' ? (
                          <ArrowDownRight size={16} className="text-green-500" />
                        ) : (
                          <ArrowUpRight size={16} className="text-red-500" />
                        )}
                      </div>
                      <div>
                        <p className="text-white font-medium">{txn.userId?.firstName || txn.userId?.email}</p>
                        <p className="text-gray-500 text-xs">{txn.transactionRef || txn._id?.slice(-8)}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(txn.status)}`}>
                      {txn.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-gray-500">Amount</p>
                      <p className={txn.type?.toUpperCase() === 'DEPOSIT' ? 'text-green-500 font-medium' : 'text-red-500 font-medium'}>
                        {txn.type?.toUpperCase() === 'DEPOSIT' ? '+' : '-'}${(txn.amount || 0).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Bonus</p>
                      <p className="text-green-500 font-medium">
                        {txn.type?.toUpperCase() === 'DEPOSIT' ? (
                          txn.bonusAmount && txn.bonusAmount > 0 ? `+$${txn.bonusAmount.toLocaleString()}` : '$0'
                        ) : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Total</p>
                      <p className="text-white font-medium">
                        {txn.type?.toUpperCase() === 'DEPOSIT' ? `$${(txn.totalAmount || (txn.amount + (txn.bonusAmount || 0))).toLocaleString()}` : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Method</p>
                      <p className="text-white">{txn.paymentMethod || '-'}</p>
                    </div>
                  </div>
                  {isPending(txn.status) && (
                    <div className="flex gap-2 mt-3 pt-3 border-t border-gray-600">
                      <button onClick={() => handleApprove(txn._id)} className="flex-1 flex items-center justify-center gap-1 py-2 bg-green-500/20 text-green-500 rounded-lg text-sm">
                        <Check size={14} /> Approve
                      </button>
                      <button onClick={() => handleReject(txn._id)} className="flex-1 flex items-center justify-center gap-1 py-2 bg-red-500/20 text-red-500 rounded-lg text-sm">
                        <X size={14} /> Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left text-gray-500 text-sm font-medium py-3 px-4">Transaction ID</th>
                    <th className="text-left text-gray-500 text-sm font-medium py-3 px-4">User</th>
                    <th className="text-left text-gray-500 text-sm font-medium py-3 px-4">Type</th>
                    <th className="text-left text-gray-500 text-sm font-medium py-3 px-4">Amount</th>
                    <th className="text-left text-gray-500 text-sm font-medium py-3 px-4">Bonus</th>
                    <th className="text-left text-gray-500 text-sm font-medium py-3 px-4">Total</th>
                    <th className="text-left text-gray-500 text-sm font-medium py-3 px-4">Method</th>
                    <th className="text-left text-gray-500 text-sm font-medium py-3 px-4">Status</th>
                    <th className="text-left text-gray-500 text-sm font-medium py-3 px-4">Date</th>
                    <th className="text-left text-gray-500 text-sm font-medium py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((txn) => {
                    // Check if transaction is a credit (positive) type
                    const isCredit = ['DEPOSIT', 'ADMIN_FUND_ADD', 'DEMO_CREDIT'].includes(txn.type?.toUpperCase())
                    return (
                    <tr key={txn._id} className="border-b border-gray-800 hover:bg-dark-700/50">
                      <td className="py-4 px-4 text-white font-mono text-sm">{txn.transactionRef || txn._id?.slice(-8)}</td>
                      <td className="py-4 px-4 text-white">{txn.userId?.firstName || txn.userId?.email}</td>
                      <td className="py-4 px-4">
                        <span className={`flex items-center gap-1 ${isCredit ? 'text-green-500' : 'text-red-500'}`}>
                          {isCredit ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}
                          {txn.type}
                        </span>
                      </td>
                      <td className={`py-4 px-4 font-medium ${isCredit ? 'text-green-500' : 'text-red-500'}`}>
                        {isCredit ? '+' : '-'}${(txn.amount || 0).toLocaleString()}
                      </td>
                      <td className="py-4 px-4">
                        {txn.type?.toUpperCase() === 'DEPOSIT' ? (
                          txn.bonusAmount && txn.bonusAmount > 0 ? (
                            <span className="text-green-500 font-medium">+${txn.bonusAmount.toLocaleString()}</span>
                          ) : (
                            <span className="text-gray-500">$0</span>
                          )
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        {txn.type?.toUpperCase() === 'DEPOSIT' ? (
                          <span className="text-white font-medium">
                            ${(txn.totalAmount || (txn.amount + (txn.bonusAmount || 0))).toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-gray-400">{txn.paymentMethod || '-'}</td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(txn.status)}`}>
                          {txn.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-gray-400">{new Date(txn.createdAt).toLocaleString()}</td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => viewTransactionDetails(txn)}
                            className="p-2 hover:bg-dark-600 rounded-lg transition-colors text-gray-400 hover:text-white"
                            title="View Details"
                          >
                            <Eye size={16} />
                          </button>
                          {isPending(txn.status) && (
                            <>
                              <button onClick={() => handleApprove(txn._id)} className="p-2 hover:bg-dark-600 rounded-lg transition-colors text-gray-400 hover:text-green-500" title="Approve">
                                <Check size={16} />
                              </button>
                              <button onClick={() => handleReject(txn._id)} className="p-2 hover:bg-dark-600 rounded-lg transition-colors text-gray-400 hover:text-red-500" title="Reject">
                                <X size={16} />
                              </button>
                            </>
                          )}
                          <button 
                            onClick={() => handleDelete(txn._id)} 
                            className="p-2 hover:bg-dark-600 rounded-lg transition-colors text-gray-400 hover:text-red-500"
                            title="Delete Transaction"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )})}

                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Transaction Details Modal */}
      {showDetailsModal && selectedTxn && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-800 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Transaction Details</h2>
              <button onClick={closeDetailsModal} className="text-gray-400 hover:text-white">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Transaction Info */}
              <div className="space-y-3">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  {selectedTxn.type?.toLowerCase() === 'withdrawal' ? (
                    <ArrowUpRight size={18} className="text-red-500" />
                  ) : (
                    <ArrowDownRight size={18} className="text-green-500" />
                  )}
                  {selectedTxn.type} Request
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="col-span-2">
                    <p className="text-gray-500">Transaction ID</p>
                    <p className="text-white font-mono text-xs break-all">{selectedTxn.transactionRef || selectedTxn._id}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Amount</p>
                    <p className={`text-lg font-bold ${selectedTxn.type?.toLowerCase() === 'deposit' ? 'text-green-500' : 'text-red-500'}`}>
                      ${selectedTxn.amount?.toLocaleString()}
                    </p>
                  </div>
                  {selectedTxn.type?.toLowerCase() === 'deposit' && (
                    <div>
                      <p className="text-gray-500">Bonus</p>
                      <p className="text-green-500 font-bold">
                        {selectedTxn.bonusAmount && selectedTxn.bonusAmount > 0 
                          ? `+$${selectedTxn.bonusAmount.toLocaleString()}` 
                          : '$0'}
                      </p>
                    </div>
                  )}
                  {selectedTxn.type?.toLowerCase() === 'deposit' && (
                    <div>
                      <p className="text-gray-500">Total</p>
                      <p className="text-white font-bold">
                        ${(selectedTxn.totalAmount || (selectedTxn.amount + (selectedTxn.bonusAmount || 0))).toLocaleString()}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-gray-500">Status</p>
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(selectedTxn.status)}`}>
                      {selectedTxn.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-gray-500">Payment Method</p>
                    <p className="text-white">{selectedTxn.paymentMethod || '-'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Date</p>
                    {editingDate ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="datetime-local"
                          value={editDate}
                          onChange={(e) => setEditDate(e.target.value)}
                          className="bg-dark-700 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                        />
                        <button
                          onClick={handleSaveDate}
                          disabled={savingDate}
                          className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 disabled:opacity-50"
                        >
                          {savingDate ? '...' : 'Save'}
                        </button>
                        <button
                          onClick={() => setEditingDate(false)}
                          className="px-2 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-500"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <p className="text-white">{new Date(selectedTxn.createdAt).toLocaleString()}</p>
                        <button
                          onClick={() => {
                            const date = new Date(selectedTxn.createdAt)
                            const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
                            setEditDate(localDate)
                            setEditingDate(true)
                          }}
                          className="text-blue-400 hover:text-blue-300 text-xs underline"
                        >
                          Edit
                        </button>
                      </div>
                    )}
                  </div>
                  {selectedTxn.transactionRef && (
                    <div className="col-span-2">
                      <p className="text-gray-500">Transaction Reference</p>
                      <p className="text-white font-mono">{selectedTxn.transactionRef}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* OxaPay / Crypto Payment Proof */}
              {selectedTxn.paymentMethod === 'Crypto' && (
                <div className="border-t border-gray-700 pt-4">
                  <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                    💰 Crypto Payment Details
                  </h3>
                  <div className="bg-dark-700 rounded-lg p-4 space-y-2 text-sm">
                    {selectedTxn.transactionRef && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">OxaPay Track ID</span>
                        <span className="text-cyan-400 font-mono">{selectedTxn.transactionRef.replace('OXA-', '').replace('OXA-PAYOUT-', '')}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-500">Gateway</span>
                      <span className="text-white">OxaPay</span>
                    </div>
                    {selectedTxn.status === 'Approved' && selectedTxn.adminRemarks?.includes('Auto-approved') && (
                      <div className="mt-2 bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                        <p className="text-green-400 text-xs">✅ Payment verified & auto-approved by OxaPay gateway</p>
                        <p className="text-gray-500 text-xs mt-1">{selectedTxn.adminRemarks}</p>
                      </div>
                    )}
                    {selectedTxn.status === 'Pending' && (
                      <div className="mt-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                        <p className="text-yellow-400 text-xs">⏳ Awaiting payment confirmation from OxaPay</p>
                      </div>
                    )}
                    {selectedTxn.status === 'Rejected' && selectedTxn.adminRemarks?.includes('expired') && (
                      <div className="mt-2 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                        <p className="text-red-400 text-xs">❌ Payment expired — user did not complete payment</p>
                        <p className="text-gray-500 text-xs mt-1">{selectedTxn.adminRemarks}</p>
                      </div>
                    )}
                    {selectedTxn.cryptoAddress && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Wallet Address</span>
                        <span className="text-white font-mono text-xs break-all max-w-[200px] text-right">{selectedTxn.cryptoAddress}</span>
                      </div>
                    )}
                    {selectedTxn.cryptoCurrency && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Currency</span>
                        <span className="text-white">{selectedTxn.cryptoCurrency}</span>
                      </div>
                    )}
                    {selectedTxn.cryptoNetwork && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Network</span>
                        <span className="text-white">{selectedTxn.cryptoNetwork}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Admin Remarks */}
              {selectedTxn.adminRemarks && selectedTxn.paymentMethod !== 'Crypto' && (
                <div className="border-t border-gray-700 pt-4">
                  <h3 className="text-white font-semibold mb-3">Admin Remarks</h3>
                  <div className="bg-dark-700 rounded-lg p-4">
                    <p className="text-gray-300 text-sm">{selectedTxn.adminRemarks}</p>
                  </div>
                </div>
              )}

              {/* Payment Screenshot */}
              {selectedTxn.screenshot && (
                <div className="border-t border-gray-700 pt-4">
                  <h3 className="text-white font-semibold mb-3">Payment Screenshot</h3>
                  <div className="bg-dark-700 rounded-lg p-2">
                    <img 
                      src={selectedTxn.screenshot.startsWith('http') ? selectedTxn.screenshot : `${API_BASE_URL}${selectedTxn.screenshot}`} 
                      alt="Payment proof" 
                      className="w-full rounded-lg max-h-64 object-contain cursor-pointer"
                      onClick={() => window.open(selectedTxn.screenshot.startsWith('http') ? selectedTxn.screenshot : `${API_BASE_URL}${selectedTxn.screenshot}`, '_blank')}
                    />
                    <p className="text-gray-500 text-xs text-center mt-2">Click to view full image</p>
                  </div>
                </div>
              )}

              {/* User Info */}
              <div className="border-t border-gray-700 pt-4">
                <h3 className="text-white font-semibold mb-3">User Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Name</p>
                    <p className="text-white">{userDetails?.firstName || selectedTxn.userId?.firstName || '-'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Email</p>
                    <p className="text-white">{userDetails?.email || selectedTxn.userId?.email || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Bank/UPI Details (for withdrawals) */}
              {selectedTxn.type?.toLowerCase() === 'withdrawal' && (
                <div className="border-t border-gray-700 pt-4">
                  <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                    {selectedTxn.bankAccountDetails?.type === 'UPI' ? (
                      <><Smartphone size={16} /> UPI Details</>
                    ) : (
                      <><Building2 size={16} /> Bank Details</>
                    )}
                  </h3>
                  
                  {/* Show bank details from transaction if available */}
                  {selectedTxn.bankAccountDetails?.type === 'Bank' ? (
                    <div className="bg-dark-700 rounded-lg p-4 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Bank Name</span>
                        <span className="text-white">{selectedTxn.bankAccountDetails.bankName || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Account Number</span>
                        <span className="text-white font-mono">{selectedTxn.bankAccountDetails.accountNumber || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">IFSC Code</span>
                        <span className="text-white font-mono">{selectedTxn.bankAccountDetails.ifscCode || '-'}</span>
                      </div>
                    </div>
                  ) : selectedTxn.bankAccountDetails?.type === 'UPI' ? (
                    <div className="bg-dark-700 rounded-lg p-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">UPI ID</span>
                        <span className="text-purple-400 font-mono">{selectedTxn.bankAccountDetails.upiId}</span>
                      </div>
                    </div>
                  ) : userDetails?.bankDetails?.accountNumber ? (
                    <div className="bg-dark-700 rounded-lg p-4 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Bank Name</span>
                        <span className="text-white">{userDetails.bankDetails.bankName || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Account Number</span>
                        <span className="text-white font-mono">{userDetails.bankDetails.accountNumber || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">IFSC Code</span>
                        <span className="text-white font-mono">{userDetails.bankDetails.ifscCode || '-'}</span>
                      </div>
                    </div>
                  ) : userDetails?.upiId ? (
                    <div className="bg-dark-700 rounded-lg p-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">UPI ID</span>
                        <span className="text-purple-400 font-mono">{userDetails.upiId}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                      <p className="text-yellow-400 text-sm">⚠️ No payment details available for this withdrawal</p>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              {isPending(selectedTxn.status) && (
                <div className="flex gap-3 pt-4 border-t border-gray-700">
                  <button
                    onClick={() => { handleReject(selectedTxn._id); closeDetailsModal(); }}
                    className="flex-1 py-2 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500/30 flex items-center justify-center gap-2"
                  >
                    <X size={16} /> Reject
                  </button>
                  <button
                    onClick={() => { handleApprove(selectedTxn._id); closeDetailsModal(); }}
                    className="flex-1 py-2 bg-green-500/20 text-green-500 rounded-lg hover:bg-green-500/30 flex items-center justify-center gap-2"
                  >
                    <Check size={16} /> Approve
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

export default AdminFundManagement
