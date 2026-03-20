import { useState, useEffect } from 'react'
import AdminLayout from '../components/AdminLayout'
import { Plus, Edit2, Trash2, Gift, DollarSign, Percent, Calendar, Users, TrendingUp, FileText, Eye, EyeOff, Search, PlusCircle, MinusCircle } from 'lucide-react'
import { API_URL } from '../config/api'

const AdminBonusManagement = () => {
  const [bonuses, setBonuses] = useState([])
  const [userBonuses, setUserBonuses] = useState([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingBonus, setEditingBonus] = useState(null)
  const [activeTab, setActiveTab] = useState('bonuses')
  
  // Manual bonus states
  const [userSearch, setUserSearch] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [userAccounts, setUserAccounts] = useState([])
  const [selectedAccount, setSelectedAccount] = useState(null)
  const [bonusAction, setBonusAction] = useState('add') // 'add' or 'deduct'
  const [bonusAmount, setBonusAmount] = useState('')
  const [bonusReason, setBonusReason] = useState('')
  const [manualBonusLoading, setManualBonusLoading] = useState(false)
  const [manualBonusMessage, setManualBonusMessage] = useState({ type: '', text: '' })
  const [bonusHistory, setBonusHistory] = useState([])
  
  const [formData, setFormData] = useState({
    name: '',
    type: 'FIRST_DEPOSIT',
    bonusType: 'PERCENTAGE',
    bonusValue: '',
    minDeposit: '',
    maxBonus: '',
    wagerRequirement: '30',
    maxWithdrawal: '',
    duration: '30',
    status: 'ACTIVE',
    description: '',
    terms: '',
    usageLimit: '',
    endDate: ''
  })

  useEffect(() => {
    fetchBonuses()
    fetchUserBonuses()
    fetchBonusHistory()
  }, [])

  // Search users for manual bonus
  const searchUsers = async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([])
      return
    }
    try {
      const res = await fetch(`${API_URL}/admin/users?search=${encodeURIComponent(query)}`)
      const data = await res.json()
      if (data.success) {
        setSearchResults(data.users?.slice(0, 10) || [])
      }
    } catch (error) {
      console.error('Error searching users:', error)
    }
  }

  // Fetch user's trading accounts
  const fetchUserAccounts = async (userId) => {
    try {
      const res = await fetch(`${API_URL}/trading-accounts/user/${userId}`)
      const data = await res.json()
      if (data.success) {
        setUserAccounts(data.accounts || [])
      }
    } catch (error) {
      console.error('Error fetching user accounts:', error)
    }
  }

  // Fetch bonus history (admin logs for credit actions)
  const fetchBonusHistory = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/logs?actions=ADD_CREDIT,REMOVE_CREDIT,ADD_WALLET_BONUS,DEDUCT_WALLET_BONUS&limit=50`)
      const data = await res.json()
      if (data.success) {
        setBonusHistory(data.logs || [])
      }
    } catch (error) {
      console.error('Error fetching bonus history:', error)
    }
  }

  // Fetch user's wallet info
  const [userWallet, setUserWallet] = useState(null)
  
  const fetchUserWallet = async (userId) => {
    try {
      const res = await fetch(`${API_URL}/wallet/${userId}`)
      const data = await res.json()
      if (data.success || data.wallet) {
        setUserWallet(data.wallet || data)
      }
    } catch (error) {
      console.error('Error fetching user wallet:', error)
      setUserWallet(null)
    }
  }

  // Handle user selection
  const handleSelectUser = (user) => {
    setSelectedUser(user)
    setSearchResults([])
    setUserSearch('')
    setSelectedAccount(null)
    setUserWallet(null)
    fetchUserAccounts(user._id)
    fetchUserWallet(user._id)
  }

  // Submit manual bonus
  const handleManualBonus = async () => {
    if (!selectedAccount || !bonusAmount || parseFloat(bonusAmount) <= 0) {
      setManualBonusMessage({ type: 'error', text: 'Please select an account and enter a valid amount' })
      return
    }

    setManualBonusLoading(true)
    setManualBonusMessage({ type: '', text: '' })

    try {
      const adminData = JSON.parse(localStorage.getItem('adminUser') || '{}')
      let res, data
      
      // Check if adding to wallet or trading account
      if (selectedAccount.type === 'wallet') {
        // Add/Deduct from user's wallet
        res = await fetch(`${API_URL}/admin/user/${selectedUser._id}/wallet-bonus`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: parseFloat(bonusAmount),
            action: bonusAction,
            reason: bonusReason || `Manual ${bonusAction === 'add' ? 'bonus added' : 'bonus deducted'} by admin`,
            adminId: adminData._id
          })
        })
        data = await res.json()
        
        if (data.success) {
          setManualBonusMessage({ 
            type: 'success', 
            text: `Successfully ${bonusAction === 'add' ? 'added' : 'deducted'} $${bonusAmount} ${bonusAction === 'add' ? 'to' : 'from'} wallet bonus (non-withdrawable)` 
          })
          setBonusAmount('')
          setBonusReason('')
          // Refresh wallet data to show updated bonus balance
          fetchUserWallet(selectedUser._id)
          fetchBonusHistory()
        } else {
          setManualBonusMessage({ type: 'error', text: data.message || 'Operation failed' })
        }
      } else {
        // Add/Deduct from trading account credit
        const endpoint = bonusAction === 'add' ? 'add-credit' : 'remove-credit'
        res = await fetch(`${API_URL}/admin/trading-account/${selectedAccount._id}/${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: parseFloat(bonusAmount),
            reason: bonusReason || `Manual ${bonusAction === 'add' ? 'bonus added' : 'bonus deducted'} by admin`,
            adminId: adminData._id
          })
        })
        data = await res.json()
        
        if (data.success || data.message?.includes('successfully')) {
          setManualBonusMessage({ 
            type: 'success', 
            text: `Successfully ${bonusAction === 'add' ? 'added' : 'deducted'} $${bonusAmount} ${bonusAction === 'add' ? 'to' : 'from'} account ${selectedAccount.accountId}` 
          })
          setBonusAmount('')
          setBonusReason('')
          fetchUserAccounts(selectedUser._id)
          fetchBonusHistory()
        } else {
          setManualBonusMessage({ type: 'error', text: data.message || 'Operation failed' })
        }
      }
    } catch (error) {
      console.error('Error processing manual bonus:', error)
      setManualBonusMessage({ type: 'error', text: 'Error processing request' })
    } finally {
      setManualBonusLoading(false)
    }
  }

  const fetchBonuses = async () => {
    try {
      const res = await fetch(`${API_URL}/bonus`)
      const data = await res.json()
      if (data.success) {
        setBonuses(data.data)
      }
    } catch (error) {
      console.error('Error fetching bonuses:', error)
    }
  }

  const fetchUserBonuses = async () => {
    try {
      const res = await fetch(`${API_URL}/bonus/user-bonuses`)
      const data = await res.json()
      if (data.success) {
        setUserBonuses(data.data)
      }
    } catch (error) {
      console.error('Error fetching user bonuses:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = editingBonus ? `${API_URL}/bonus/${editingBonus._id}` : `${API_URL}/bonus`
      const method = editingBonus ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const data = await res.json()
      if (data.success) {
        fetchBonuses()
        setShowModal(false)
        resetForm()
      }
    } catch (error) {
      console.error('Error saving bonus:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (bonus) => {
    setEditingBonus(bonus)
    setFormData({
      name: bonus.name,
      type: bonus.type,
      bonusType: bonus.bonusType,
      bonusValue: bonus.bonusValue,
      minDeposit: bonus.minDeposit,
      maxBonus: bonus.maxBonus || '',
      wagerRequirement: bonus.wagerRequirement,
      maxWithdrawal: bonus.maxWithdrawal || '',
      duration: bonus.duration,
      status: bonus.status,
      description: bonus.description,
      terms: bonus.terms,
      usageLimit: bonus.usageLimit || '',
      endDate: bonus.endDate ? new Date(bonus.endDate).toISOString().split('T')[0] : ''
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this bonus?')) return

    try {
      const res = await fetch(`${API_URL}/bonus/${id}`, {
        method: 'DELETE'
      })

      const data = await res.json()
      if (data.success) {
        fetchBonuses()
      }
    } catch (error) {
      console.error('Error deleting bonus:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'FIRST_DEPOSIT',
      bonusType: 'PERCENTAGE',
      bonusValue: '',
      minDeposit: '',
      maxBonus: '',
      wagerRequirement: '30',
      maxWithdrawal: '',
      duration: '30',
      status: 'ACTIVE',
      description: '',
      terms: '',
      usageLimit: '',
      endDate: ''
    })
    setEditingBonus(null)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE': return 'text-green-500 bg-green-500/20'
      case 'INACTIVE': return 'text-yellow-500 bg-yellow-500/20'
      case 'EXPIRED': return 'text-red-500 bg-red-500/20'
      default: return 'text-gray-500 bg-gray-500/20'
    }
  }

  const getTypeColor = (type) => {
    switch (type) {
      case 'FIRST_DEPOSIT': return 'text-purple-500 bg-purple-500/20'
      case 'DEPOSIT': return 'text-blue-500 bg-blue-500/20'
      case 'RELOAD': return 'text-orange-500 bg-orange-500/20'
      case 'SPECIAL': return 'text-pink-500 bg-pink-500/20'
      default: return 'text-gray-500 bg-gray-500/20'
    }
  }

  return (
    <AdminLayout className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Gift className="text-accent-green" />
          Bonus Management
        </h1>
        <button
          onClick={() => { setShowModal(true); resetForm() }}
          className="bg-accent-green text-black px-4 py-2 rounded-lg font-medium hover:bg-accent-green/90 flex items-center gap-2"
        >
          <Plus size={16} />
          Create Bonus
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-gray-700">
        <button
          onClick={() => setActiveTab('bonuses')}
          className={`pb-2 px-1 ${activeTab === 'bonuses' ? 'text-accent-green border-b-2 border-accent-green' : 'text-gray-400'}`}
        >
          Bonus Templates
        </button>
        <button
          onClick={() => setActiveTab('user-bonuses')}
          className={`pb-2 px-1 ${activeTab === 'user-bonuses' ? 'text-accent-green border-b-2 border-accent-green' : 'text-gray-400'}`}
        >
          User Bonuses
        </button>
        <button
          onClick={() => setActiveTab('manual-bonus')}
          className={`pb-2 px-1 ${activeTab === 'manual-bonus' ? 'text-accent-green border-b-2 border-accent-green' : 'text-gray-400'}`}
        >
          Add/Deduct Bonus
        </button>
      </div>

      {/* Bonus Templates Tab */}
      {activeTab === 'bonuses' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bonuses.map((bonus) => (
            <div key={bonus._id} className="bg-dark-800 rounded-xl p-6 border border-gray-700">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-white font-semibold">{bonus.name}</h3>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-2 ${getTypeColor(bonus.type)}`}>
                    {bonus.type.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(bonus)}
                    className="text-blue-500 hover:text-blue-400"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(bonus._id)}
                    className="text-red-500 hover:text-red-400"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Bonus:</span>
                  <span className="text-white font-medium">
                    {bonus.bonusType === 'PERCENTAGE' ? (
                      <span className="flex items-center gap-1">
                        <Percent size={14} />
                        {bonus.bonusValue}%
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <DollarSign size={14} />
                        ${bonus.bonusValue}
                      </span>
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Min Deposit:</span>
                  <span className="text-white">${bonus.minDeposit}</span>
                </div>

                {bonus.maxBonus && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Max Bonus:</span>
                    <span className="text-white">${bonus.maxBonus}</span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Wager:</span>
                  <span className="text-white">{bonus.wagerRequirement}x</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Duration:</span>
                  <span className="text-white">{bonus.duration} days</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Used:</span>
                  <span className="text-white">
                    {bonus.usedCount}{bonus.usageLimit && `/${bonus.usageLimit}`}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Status:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(bonus.status)}`}>
                    {bonus.status}
                  </span>
                </div>
              </div>

              {bonus.description && (
                <p className="text-gray-400 text-sm mt-3 line-clamp-2">{bonus.description}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* User Bonuses Tab */}
      {activeTab === 'user-bonuses' && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-4 text-gray-400">User</th>
                <th className="text-left py-3 px-4 text-gray-400">Bonus</th>
                <th className="text-left py-3 px-4 text-gray-400">Amount</th>
                <th className="text-left py-3 px-4 text-gray-400">Wager Req</th>
                <th className="text-left py-3 px-4 text-gray-400">Remaining</th>
                <th className="text-left py-3 px-4 text-gray-400">Status</th>
                <th className="text-left py-3 px-4 text-gray-400">Expires</th>
              </tr>
            </thead>
            <tbody>
              {userBonuses.map((userBonus) => (
                <tr key={userBonus._id} className="border-b border-gray-700">
                  <td className="py-3 px-4">
                    <div>
                      <p className="text-white">{userBonus.userId?.firstName} {userBonus.userId?.lastName}</p>
                      <p className="text-gray-400 text-sm">{userBonus.userId?.email}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-white">{userBonus.bonusId?.name}</td>
                  <td className="py-3 px-4 text-green-500">${userBonus.bonusAmount}</td>
                  <td className="py-3 px-4 text-gray-400">${userBonus.wagerRequirement}</td>
                  <td className="py-3 px-4 text-yellow-500">${userBonus.remainingWager}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(userBonus.status)}`}>
                      {userBonus.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-400">
                    {userBonus.expiresAt ? new Date(userBonus.expiresAt).toLocaleDateString() : 'Never'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Manual Bonus Tab */}
      {activeTab === 'manual-bonus' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Add/Deduct Bonus Form */}
          <div className="bg-dark-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Gift size={20} className="text-accent-green" />
              Add / Deduct Bonus
            </h3>

            {/* User Search */}
            <div className="mb-4 relative">
              <label className="block text-gray-400 text-sm mb-2">Search User</label>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => {
                    setUserSearch(e.target.value)
                    searchUsers(e.target.value)
                  }}
                  placeholder="Search by name, email, or phone..."
                  className="w-full bg-dark-700 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-white"
                />
              </div>
              {/* Search Results Dropdown */}
              {searchResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-dark-700 border border-gray-600 rounded-lg max-h-48 overflow-y-auto">
                  {searchResults.map((user) => (
                    <button
                      key={user._id}
                      onClick={() => handleSelectUser(user)}
                      className="w-full px-4 py-2 text-left hover:bg-dark-600 text-white"
                    >
                      <p className="font-medium">{user.firstName} {user.lastName}</p>
                      <p className="text-gray-400 text-sm">{user.email}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Selected User */}
            {selectedUser && (
              <div className="mb-4 p-3 bg-dark-700 rounded-lg border border-gray-600">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">{selectedUser.firstName} {selectedUser.lastName}</p>
                    <p className="text-gray-400 text-sm">{selectedUser.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedUser(null)
                      setUserAccounts([])
                      setSelectedAccount(null)
                    }}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}

            {/* No Trading Accounts - Add to Wallet */}
            {selectedUser && userAccounts.filter(acc => acc.status === 'Active').length === 0 && (
              <div className="mb-4">
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg mb-4">
                  <p className="text-yellow-400 text-sm">
                    This user has no active trading accounts. Bonus will be added to their <strong>Wallet Bonus Balance</strong> (non-withdrawable).
                  </p>
                </div>
                <button
                  onClick={() => setSelectedAccount({ _id: 'wallet', type: 'wallet' })}
                  className={`w-full p-3 rounded-lg border text-left transition-colors ${
                    selectedAccount?.type === 'wallet'
                      ? 'border-accent-green bg-accent-green/10'
                      : 'border-gray-600 bg-dark-700 hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">💰 User Wallet</p>
                      <p className="text-gray-400 text-sm">Add bonus (non-withdrawable)</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white">Balance: ${userWallet?.balance?.toFixed(2) || '0.00'}</p>
                      <p className="text-yellow-500 text-sm">Bonus: ${userWallet?.bonusBalance?.toFixed(2) || '0.00'}</p>
                    </div>
                  </div>
                </button>
              </div>
            )}

            {/* Trading Accounts */}
            {selectedUser && userAccounts.filter(acc => acc.status === 'Active').length > 0 && (
              <div className="mb-4">
                <label className="block text-gray-400 text-sm mb-2">Select Trading Account (or Wallet)</label>
                <div className="space-y-2">
                  {/* Wallet Option */}
                  <button
                    onClick={() => setSelectedAccount({ _id: 'wallet', type: 'wallet' })}
                    className={`w-full p-3 rounded-lg border text-left transition-colors ${
                      selectedAccount?.type === 'wallet'
                        ? 'border-accent-green bg-accent-green/10'
                        : 'border-gray-600 bg-dark-700 hover:border-gray-500'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">💰 User Wallet</p>
                        <p className="text-gray-400 text-sm">Add bonus (non-withdrawable)</p>
                      </div>
                      <div className="text-right">
                        <p className="text-white">Balance: ${userWallet?.balance?.toFixed(2) || '0.00'}</p>
                        <p className="text-yellow-500 text-sm">Bonus: ${userWallet?.bonusBalance?.toFixed(2) || '0.00'}</p>
                      </div>
                    </div>
                  </button>
                  
                  {/* Trading Accounts */}
                  {userAccounts.filter(acc => acc.status === 'Active').map((account) => (
                    <button
                      key={account._id}
                      onClick={() => setSelectedAccount(account)}
                      className={`w-full p-3 rounded-lg border text-left transition-colors ${
                        selectedAccount?._id === account._id && selectedAccount?.type !== 'wallet'
                          ? 'border-accent-green bg-accent-green/10'
                          : 'border-gray-600 bg-dark-700 hover:border-gray-500'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white font-medium">{account.accountId}</p>
                          <p className="text-gray-400 text-sm">{account.accountTypeId?.name || 'Standard'} (Credit - non-withdrawable)</p>
                        </div>
                        <div className="text-right">
                          <p className="text-white">Balance: ${account.balance?.toFixed(2)}</p>
                          <p className="text-yellow-500 text-sm">Credit: ${account.credit?.toFixed(2) || '0.00'}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Action Type */}
            {selectedAccount && (
              <>
                <div className="mb-4">
                  <label className="block text-gray-400 text-sm mb-2">Action</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setBonusAction('add')}
                      className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 ${
                        bonusAction === 'add'
                          ? 'bg-green-500 text-white'
                          : 'bg-dark-700 text-gray-400 border border-gray-600'
                      }`}
                    >
                      <PlusCircle size={16} />
                      Add Bonus
                    </button>
                    <button
                      onClick={() => setBonusAction('deduct')}
                      className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 ${
                        bonusAction === 'deduct'
                          ? 'bg-red-500 text-white'
                          : 'bg-dark-700 text-gray-400 border border-gray-600'
                      }`}
                    >
                      <MinusCircle size={16} />
                      Deduct Bonus
                    </button>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-gray-400 text-sm mb-2">Amount ($)</label>
                  <input
                    type="number"
                    value={bonusAmount}
                    onChange={(e) => setBonusAmount(e.target.value)}
                    placeholder="Enter amount"
                    min="0"
                    step="0.01"
                    className="w-full bg-dark-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-gray-400 text-sm mb-2">Reason (Optional)</label>
                  <input
                    type="text"
                    value={bonusReason}
                    onChange={(e) => setBonusReason(e.target.value)}
                    placeholder="e.g., Welcome bonus, Promotional credit..."
                    className="w-full bg-dark-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                  />
                </div>

                {manualBonusMessage.text && (
                  <div className={`mb-4 p-3 rounded-lg ${
                    manualBonusMessage.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {manualBonusMessage.text}
                  </div>
                )}

                <button
                  onClick={handleManualBonus}
                  disabled={manualBonusLoading || !bonusAmount}
                  className={`w-full py-3 rounded-lg font-medium disabled:opacity-50 ${
                    bonusAction === 'add'
                      ? 'bg-green-500 text-white hover:bg-green-600'
                      : 'bg-red-500 text-white hover:bg-red-600'
                  }`}
                >
                  {manualBonusLoading ? 'Processing...' : (bonusAction === 'add' ? 'Add Bonus' : 'Deduct Bonus')}
                </button>
              </>
            )}
          </div>

          {/* Bonus History */}
          <div className="bg-dark-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <FileText size={20} className="text-accent-green" />
              Recent Bonus Actions
            </h3>
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {bonusHistory.length === 0 ? (
                <p className="text-gray-400 text-center py-4">No bonus history found</p>
              ) : (
                bonusHistory.map((log) => {
                  const isAdd = log.action === 'ADD_CREDIT' || log.action === 'ADD_WALLET_BONUS'
                  const isWallet = log.action === 'ADD_WALLET_BONUS' || log.action === 'DEDUCT_WALLET_BONUS'
                  const amount = isWallet 
                    ? Math.abs((log.newValue?.bonusBalance || log.newValue?.walletBalance || 0) - (log.previousValue?.bonusBalance || log.previousValue?.walletBalance || 0))
                    : Math.abs((log.newValue?.credit || 0) - (log.previousValue?.credit || 0))
                  
                  return (
                    <div key={log._id} className="p-3 bg-dark-700 rounded-lg border border-gray-600">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            isAdd ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                          }`}>
                            {isAdd ? '+ Added' : '- Deducted'}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            isWallet ? 'bg-blue-500/20 text-blue-400' : 'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {isWallet ? 'Wallet' : 'Credit'}
                          </span>
                        </div>
                        <span className="text-gray-400 text-xs">
                          {new Date(log.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-white text-sm">${amount.toFixed(2)}</p>
                      {log.reason && (
                        <p className="text-gray-400 text-xs mt-1">{log.reason}</p>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-800 rounded-xl w-full max-w-2xl border border-gray-700 max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-white font-semibold">
                {editingBonus ? 'Edit Bonus' : 'Create Bonus'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white">
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Bonus Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-dark-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-2">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    className="w-full bg-dark-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                  >
                    <option value="FIRST_DEPOSIT">First Deposit</option>
                    <option value="DEPOSIT">Regular Deposit</option>
                    <option value="RELOAD">Reload Bonus</option>
                    <option value="SPECIAL">Special Bonus</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-2">Bonus Type</label>
                  <select
                    value={formData.bonusType}
                    onChange={(e) => setFormData({...formData, bonusType: e.target.value})}
                    className="w-full bg-dark-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                  >
                    <option value="PERCENTAGE">Percentage</option>
                    <option value="FIXED">Fixed Amount</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-2">Bonus Value</label>
                  <input
                    type="number"
                    value={formData.bonusValue}
                    onChange={(e) => setFormData({...formData, bonusValue: e.target.value})}
                    className="w-full bg-dark-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-2">Min Deposit</label>
                  <input
                    type="number"
                    value={formData.minDeposit}
                    onChange={(e) => setFormData({...formData, minDeposit: e.target.value})}
                    className="w-full bg-dark-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-2">Max Bonus (Optional)</label>
                  <input
                    type="number"
                    value={formData.maxBonus}
                    onChange={(e) => setFormData({...formData, maxBonus: e.target.value})}
                    className="w-full bg-dark-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-2">Wager Requirement (x)</label>
                  <input
                    type="number"
                    value={formData.wagerRequirement}
                    onChange={(e) => setFormData({...formData, wagerRequirement: e.target.value})}
                    className="w-full bg-dark-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-2">Max Withdrawal (Optional)</label>
                  <input
                    type="number"
                    value={formData.maxWithdrawal}
                    onChange={(e) => setFormData({...formData, maxWithdrawal: e.target.value})}
                    className="w-full bg-dark-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-2">Duration (Days)</label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({...formData, duration: e.target.value})}
                    className="w-full bg-dark-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-2">Usage Limit (Optional)</label>
                  <input
                    type="number"
                    value={formData.usageLimit}
                    onChange={(e) => setFormData({...formData, usageLimit: e.target.value})}
                    className="w-full bg-dark-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                    placeholder="Leave empty for unlimited"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-2">End Date (Optional)</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                    className="w-full bg-dark-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full bg-dark-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-dark-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                  rows="3"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-2">Terms & Conditions</label>
                <textarea
                  value={formData.terms}
                  onChange={(e) => setFormData({...formData, terms: e.target.value})}
                  className="w-full bg-dark-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                  rows="4"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 bg-dark-700 text-white rounded-lg hover:bg-dark-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 bg-accent-green text-black font-medium rounded-lg hover:bg-accent-green/90 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : (editingBonus ? 'Update Bonus' : 'Create Bonus')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

export default AdminBonusManagement
