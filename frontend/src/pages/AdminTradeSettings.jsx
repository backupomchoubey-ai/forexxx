import { useState, useEffect } from 'react'
import AdminLayout from '../components/AdminLayout'
import { 
  Settings,
  Save,
  RefreshCw,
  AlertTriangle,
  TrendingUp,
  Clock,
  Percent,
  ToggleLeft,
  ToggleRight,
  Layers,
  Target,
  ArrowDownUp,
  Calendar
} from 'lucide-react'
import { API_URL } from '../config/api'

const AdminTradeSettings = () => {
  const [settings, setSettings] = useState({
    // Risk Management
    stopOutLevel: 100,
    marginCallLevel: 80,
    maxLeverageGlobal: 500,
    maxOpenTradesPerUser: 100,
    maxOpenLotsPerUser: 100,
    // Swap Settings
    swapTime: '17:00',
    swapTimezone: 'America/New_York',
    tripleSwapDay: 'Wednesday',
    // Trading Control
    tradingEnabled: true,
    // MT5 Features
    enablePartialClose: true,
    enableTrailingStop: true,
    stopOutOrder: 'largest_margin',
    includeFloatingPnlInMargin: true
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/admin/trade/settings`)
      const data = await res.json()
      if (data.success && data.settings) {
        setSettings(prev => ({ ...prev, ...data.settings }))
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
      setMessage({ type: 'error', text: 'Failed to load settings' })
    }
    setLoading(false)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}')
      const res = await fetch(`${API_URL}/admin/trade/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...settings,
          adminId: adminUser._id
        })
      })
      const data = await res.json()
      if (data.success) {
        setMessage({ type: 'success', text: 'Settings saved successfully' })
        setSettings(prev => ({ ...prev, ...data.settings }))
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to save settings' })
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      setMessage({ type: 'error', text: 'Failed to save settings' })
    }
    setSaving(false)
    setTimeout(() => setMessage({ type: '', text: '' }), 3000)
  }

  const handleChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }))
  }

  const toggleField = (field) => {
    setSettings(prev => ({ ...prev, [field]: !prev[field] }))
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Settings className="w-8 h-8 text-blue-500" />
            <div>
              <h1 className="text-2xl font-bold text-white">Trade Settings</h1>
              <p className="text-gray-400 text-sm">Configure MT5-style trading parameters</p>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {/* Message */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-500/20 border border-green-500 text-green-400' : 'bg-red-500/20 border border-red-500 text-red-400'}`}>
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* MT5 Features Section */}
          <div className="bg-[#1a1a1a] rounded-xl p-6 border border-gray-800">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Layers className="w-5 h-5 text-purple-500" />
              MT5 Features
            </h2>
            <div className="space-y-4">
              {/* Partial Close */}
              <div className="flex items-center justify-between p-3 bg-[#0d0d0d] rounded-lg">
                <div>
                  <p className="text-white font-medium">Partial Close</p>
                  <p className="text-gray-400 text-sm">Allow users to partially close positions</p>
                </div>
                <button
                  onClick={() => toggleField('enablePartialClose')}
                  className={`p-1 rounded-lg transition-colors ${settings.enablePartialClose ? 'text-green-500' : 'text-gray-500'}`}
                >
                  {settings.enablePartialClose ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                </button>
              </div>

              {/* Trailing Stop */}
              <div className="flex items-center justify-between p-3 bg-[#0d0d0d] rounded-lg">
                <div>
                  <p className="text-white font-medium">Trailing Stop</p>
                  <p className="text-gray-400 text-sm">Allow users to set trailing stop loss</p>
                </div>
                <button
                  onClick={() => toggleField('enableTrailingStop')}
                  className={`p-1 rounded-lg transition-colors ${settings.enableTrailingStop ? 'text-green-500' : 'text-gray-500'}`}
                >
                  {settings.enableTrailingStop ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                </button>
              </div>

              {/* Floating PnL in Margin */}
              <div className="flex items-center justify-between p-3 bg-[#0d0d0d] rounded-lg">
                <div>
                  <p className="text-white font-medium">Include Floating PnL in Margin</p>
                  <p className="text-gray-400 text-sm">MT5-style equity calculation</p>
                </div>
                <button
                  onClick={() => toggleField('includeFloatingPnlInMargin')}
                  className={`p-1 rounded-lg transition-colors ${settings.includeFloatingPnlInMargin ? 'text-green-500' : 'text-gray-500'}`}
                >
                  {settings.includeFloatingPnlInMargin ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                </button>
              </div>

              {/* Stop-Out Order */}
              <div className="p-3 bg-[#0d0d0d] rounded-lg">
                <p className="text-white font-medium mb-2">Stop-Out Order</p>
                <p className="text-gray-400 text-sm mb-3">Which trade to close first during stop-out</p>
                <select
                  value={settings.stopOutOrder}
                  onChange={(e) => handleChange('stopOutOrder', e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="largest_margin">Largest Margin First (MT5)</option>
                  <option value="largest_loss">Largest Loss First (MT4)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Risk Management Section */}
          <div className="bg-[#1a1a1a] rounded-xl p-6 border border-gray-800">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Risk Management
            </h2>
            <div className="space-y-4">
              {/* Stop-Out Level */}
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Stop-Out Level (%)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={settings.stopOutLevel}
                    onChange={(e) => handleChange('stopOutLevel', parseInt(e.target.value) || 0)}
                    className="flex-1 bg-[#0d0d0d] border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                  <Percent className="w-5 h-5 text-gray-500" />
                </div>
                <p className="text-gray-500 text-xs mt-1">Trades closed when margin level drops below this</p>
              </div>

              {/* Margin Call Level */}
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Margin Call Level (%)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={settings.marginCallLevel}
                    onChange={(e) => handleChange('marginCallLevel', parseInt(e.target.value) || 0)}
                    className="flex-1 bg-[#0d0d0d] border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                  <Percent className="w-5 h-5 text-gray-500" />
                </div>
                <p className="text-gray-500 text-xs mt-1">Warning level before stop-out</p>
              </div>

              {/* Max Leverage */}
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Max Leverage</label>
                <select
                  value={settings.maxLeverageGlobal}
                  onChange={(e) => handleChange('maxLeverageGlobal', parseInt(e.target.value))}
                  className="w-full bg-[#0d0d0d] border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value={50}>1:50</option>
                  <option value={100}>1:100</option>
                  <option value={200}>1:200</option>
                  <option value={300}>1:300</option>
                  <option value={400}>1:400</option>
                  <option value={500}>1:500</option>
                  <option value={1000}>1:1000</option>
                </select>
              </div>

              {/* Max Open Trades */}
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Max Open Trades Per User</label>
                <input
                  type="number"
                  min="1"
                  value={settings.maxOpenTradesPerUser}
                  onChange={(e) => handleChange('maxOpenTradesPerUser', parseInt(e.target.value) || 1)}
                  className="w-full bg-[#0d0d0d] border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Max Open Lots */}
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Max Open Lots Per User</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={settings.maxOpenLotsPerUser}
                  onChange={(e) => handleChange('maxOpenLotsPerUser', parseFloat(e.target.value) || 0.01)}
                  className="w-full bg-[#0d0d0d] border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Swap Settings Section */}
          <div className="bg-[#1a1a1a] rounded-xl p-6 border border-gray-800">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-500" />
              Swap / Rollover Settings
            </h2>
            <div className="space-y-4">
              {/* Swap Time */}
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Swap Time</label>
                <input
                  type="time"
                  value={settings.swapTime}
                  onChange={(e) => handleChange('swapTime', e.target.value)}
                  className="w-full bg-[#0d0d0d] border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Swap Timezone */}
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Swap Timezone</label>
                <select
                  value={settings.swapTimezone}
                  onChange={(e) => handleChange('swapTimezone', e.target.value)}
                  className="w-full bg-[#0d0d0d] border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="America/New_York">New York (EST/EDT)</option>
                  <option value="Europe/London">London (GMT/BST)</option>
                  <option value="Asia/Tokyo">Tokyo (JST)</option>
                  <option value="Asia/Kolkata">India (IST)</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>

              {/* Triple Swap Day */}
              <div>
                <label className="text-gray-400 text-sm mb-1 block flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Triple Swap Day
                </label>
                <select
                  value={settings.tripleSwapDay}
                  onChange={(e) => handleChange('tripleSwapDay', e.target.value)}
                  className="w-full bg-[#0d0d0d] border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="Monday">Monday</option>
                  <option value="Tuesday">Tuesday</option>
                  <option value="Wednesday">Wednesday (Default)</option>
                  <option value="Thursday">Thursday</option>
                  <option value="Friday">Friday</option>
                </select>
                <p className="text-gray-500 text-xs mt-1">3x swap charged to cover weekend</p>
              </div>
            </div>
          </div>

          {/* Trading Control Section */}
          <div className="bg-[#1a1a1a] rounded-xl p-6 border border-gray-800">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              Trading Control
            </h2>
            <div className="space-y-4">
              {/* Trading Enabled */}
              <div className="flex items-center justify-between p-3 bg-[#0d0d0d] rounded-lg">
                <div>
                  <p className="text-white font-medium">Trading Enabled</p>
                  <p className="text-gray-400 text-sm">Master switch to enable/disable all trading</p>
                </div>
                <button
                  onClick={() => toggleField('tradingEnabled')}
                  className={`p-1 rounded-lg transition-colors ${settings.tradingEnabled ? 'text-green-500' : 'text-red-500'}`}
                >
                  {settings.tradingEnabled ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                </button>
              </div>

              {/* Info Box */}
              <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <h3 className="text-blue-400 font-medium mb-2">MT5 Trade Logic Summary</h3>
                <ul className="text-gray-400 text-sm space-y-1">
                  <li>• <span className="text-green-400">Floating PnL</span> included in equity calculation</li>
                  <li>• <span className="text-green-400">Triple swap</span> on {settings.tripleSwapDay}</li>
                  <li>• Stop-out closes <span className="text-green-400">{settings.stopOutOrder === 'largest_margin' ? 'largest margin' : 'largest loss'}</span> first</li>
                  <li>• Partial close: <span className={settings.enablePartialClose ? 'text-green-400' : 'text-red-400'}>{settings.enablePartialClose ? 'Enabled' : 'Disabled'}</span></li>
                  <li>• Trailing stop: <span className={settings.enableTrailingStop ? 'text-green-400' : 'text-red-400'}>{settings.enableTrailingStop ? 'Enabled' : 'Disabled'}</span></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

export default AdminTradeSettings
