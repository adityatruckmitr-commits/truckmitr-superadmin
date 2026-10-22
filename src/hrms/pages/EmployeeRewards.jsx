import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  Trophy,
  Gift,
  Award,
  ThumbsUp,
  ChevronRight,
  X,
  Heart,
  ShoppingBag,
} from 'lucide-react-teleadmin'
import { useAuth } from '../context/AuthContext'
import { useEmployees } from '../hooks/useEmployees'
import { Avatar, cx } from '../components/ui'
import {
  useRecognitions,
  useCreateRecognition,
  useToggleRecognitionLike,
  useGiftCatalog,
  usePointsBalance,
  useRedeemGift,
  useRewardsTopPerformers,
} from '../hooks/useRewards'

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—')
const fmtMoney = (n) => `₹${Math.round(Number(n) || 0).toLocaleString('en-IN')}`

export default function EmployeeRewards() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('My Recognitions')
  const [isKudosModalOpen, setIsKudosModalOpen] = useState(false)
  const [selectedRec, setSelectedRec] = useState(null)

  const { data: rawMyRecognitions } = useRecognitions({ employee_id: user?.emp_id })
  const { data: rawWallRecognitions } = useRecognitions({ viewer_id: user?.emp_id })
  const { data: rawCatalog } = useGiftCatalog()
  const { data: pointsData } = usePointsBalance(user?.emp_id)
  const { data: topPerformers } = useRewardsTopPerformers()
  const { data: rawEmployees } = useEmployees()

  const createRecognition = useCreateRecognition()
  const toggleLike = useToggleRecognitionLike()
  const redeemGift = useRedeemGift()

  const myRecognitions = Array.isArray(rawMyRecognitions) ? rawMyRecognitions : []
  const wallRecognitions = (Array.isArray(rawWallRecognitions) ? rawWallRecognitions : []).slice(0, 6)
  const giftCatalog = Array.isArray(rawCatalog) ? rawCatalog : []
  const pointsBalance = pointsData?.balance ?? 0
  const topPerformer = topPerformers?.[0]
  const currentMonthLabel = new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
  const colleagues = (Array.isArray(rawEmployees) ? rawEmployees : [])
    .filter(e => e.emp_id !== user?.emp_id && (e.status === 'Verified' || !e.status) && (e.is_active === true || e.is_active === 1))

  const totalRewardValue = myRecognitions.reduce((s, r) => s + Number(r.reward_value || 0), 0)

  const handleRedeem = (item) => {
    if (pointsBalance < item.points_cost) { toast.error('Insufficient points balance!'); return }
    redeemGift.mutate({ employee_id: user?.emp_id, gift_id: item.id }, {
      onSuccess: () => toast.success(`Redeemed ${item.name}! Voucher process will be handled by HR.`),
      onError: (err) => toast.error(err.response?.data?.message || 'Failed to redeem'),
    })
  }

  const handleLike = (rec) => {
    toggleLike.mutate({ id: rec.id, employee_id: user?.emp_id }, {
      onError: () => toast.error('Failed to update applause'),
    })
  }

  const handleSendKudos = (e) => {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const colleagueId = data.get('colleague')
    if (!colleagueId) { toast.error('Please select a colleague'); return }
    createRecognition.mutate({
      employee_id: colleagueId,
      achievement: data.get('badge') || 'Peer Kudos',
      category: 'Teamwork',
      reward_type: 'Peer Kudos',
      reward_value: 0,
      comment: (data.get('message') || '').trim() || 'Great work — keep it up!',
      recognized_by: user?.emp_id,
    }, {
      onSuccess: () => { toast.success('Peer Kudos sent successfully!'); setIsKudosModalOpen(false) },
      onError: (err) => toast.error(err.response?.data?.message || 'Failed to send kudos'),
    })
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="font-sans text-xl sm:text-2xl font-semibold tracking-tight text-slate-900">My Rewards & Recognition</h1>
          <p className="mt-1 text-sm text-gray-500">Track your recognitions, redeem points for vouchers, and appreciate your peers.</p>
        </div>
        <button onClick={() => setIsKudosModalOpen(true)} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-blue-700 active:scale-[0.98] transition-all">
          <Heart className="h-4.5 w-4.5 text-rose-300" /> Send Peer Kudos
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { label: 'Reward Points Balance', value: `${pointsBalance.toLocaleString('en-IN')} Pts`, sub: 'Earned minus redeemed', icon: <Gift className="h-4.5 w-4.5 text-amber-600" />, iconBg: 'bg-amber-50 border-amber-100' },
          { label: 'Recognitions Received', value: `${myRecognitions.length}`, sub: 'Lifetime Awards', icon: <Trophy className="h-4.5 w-4.5 text-blue-600" />, iconBg: 'bg-blue-50 border-blue-100' },
          { label: 'Total Reward Value', value: fmtMoney(totalRewardValue), sub: 'Vouchers & Cash Received', icon: <Award className="h-4.5 w-4.5 text-emerald-600" />, iconBg: 'bg-emerald-50 border-emerald-100' },
        ].map((card) => (
          <div key={card.label} className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-2xs hover:shadow-2xs hover:border-gray-300 transition-all group">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">{card.label}</p>
              <h2 className="text-xl font-extrabold text-gray-950 mt-1 tracking-tight">{card.value}</h2>
              <p className="text-[11px] font-medium text-gray-400 mt-0.5">{card.sub}</p>
            </div>
            <span className={cx('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-transform group-hover:scale-105', card.iconBg)}>{card.icon}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex gap-2 overflow-x-auto">
              {['My Recognitions', 'Redeem Points Catalog', 'Company Wall'].map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={cx('whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold transition-colors', activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300')}>{tab}</button>
              ))}
            </nav>
          </div>

          {activeTab === 'My Recognitions' && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-gray-900">Recognitions Received ({myRecognitions.length})</h2>
              <div className="space-y-3.5">
                {myRecognitions.length === 0 && (
                  <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
                    <Trophy className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                    <p className="text-sm font-semibold text-gray-500">No recognitions received yet</p>
                  </div>
                )}
                {myRecognitions.map((rec) => (
                  <div key={rec.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-2xs space-y-3 hover:border-gray-300 transition-all">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-200 shrink-0"><Trophy className="h-5 w-5" /></span>
                        <div><h3 className="text-sm font-bold text-gray-950">{rec.achievement}</h3><p className="text-xs text-gray-500">{rec.achievement_desc}</p></div>
                      </div>
                      {rec.reward_value > 0 && <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-extrabold border border-emerald-200">{fmtMoney(rec.reward_value)}</span>}
                    </div>
                    <p className="text-xs text-gray-700 leading-relaxed font-medium bg-gray-50 p-3 rounded-lg border border-gray-100">"{rec.comment}"</p>
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs text-gray-500">
                      <div className="flex items-center gap-2"><Avatar name={rec.recognized_by} size="xs" /><span>Awarded by <strong>{rec.recognized_by}</strong></span></div>
                      <span className="font-semibold text-gray-400">{fmtDate(rec.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'Redeem Points Catalog' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div><h2 className="text-base font-bold text-gray-900">Gift Vouchers & Rewards Store</h2><p className="text-xs text-gray-500">Use your reward points to redeem vouchers.</p></div>
                <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200">Balance: {pointsBalance} Pts</span>
              </div>
              {giftCatalog.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
                  <ShoppingBag className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                  <p className="text-sm font-semibold text-gray-500">No gift catalog items available yet</p>
                  <p className="text-xs text-gray-400 mt-1">Ask HR to add redeemable rewards to the catalog.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {giftCatalog.map((item) => (
                    <div key={item.id} className="rounded-xl border border-gray-200 p-5 bg-gray-50/60 shadow-2xs space-y-3 flex flex-col justify-between hover:border-gray-300 transition-all">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white border border-gray-200 text-amber-600"><Gift className="h-4 w-4" /></span>
                          {item.value != null && <span className="text-xs font-extrabold px-2.5 py-1 rounded-sm bg-white text-gray-900 shadow-2xs">{fmtMoney(item.value)}</span>}
                        </div>
                        <h3 className="text-sm font-bold text-gray-950">{item.name}</h3>
                        <p className="text-xs text-gray-600 font-medium mt-0.5">{item.points_cost} Points required</p>
                      </div>
                      <button onClick={() => handleRedeem(item)} disabled={pointsBalance < item.points_cost || redeemGift.isPending} className={cx('w-full py-2 px-4 rounded-lg text-xs font-bold shadow-2xs transition-all', pointsBalance >= item.points_cost ? 'bg-gray-950 text-white hover:bg-gray-800 active:scale-95' : 'bg-gray-200 text-gray-400 cursor-not-allowed')}>
                        {pointsBalance >= item.points_cost ? 'Redeem Voucher' : 'Insufficient Points'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'Company Wall' && (
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-2xs space-y-4">
              <h2 className="text-base font-bold text-gray-900">Company Recognition Feed</h2>
              <p className="text-xs text-gray-500">Cheer and celebrate accomplishments across all teams.</p>
              <div className="space-y-4 pt-2">
                {wallRecognitions.length === 0 && <p className="text-xs text-gray-400 text-center py-8">No recognitions yet.</p>}
                {wallRecognitions.map((feed) => (
                  <div key={feed.id} className="rounded-xl border border-gray-100 bg-gray-50/60 p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-gray-900">{feed.recognized_by} → {feed.employee_name}</span>
                      <span className="text-gray-400">{fmtDate(feed.created_at)}</span>
                    </div>
                    <p className="text-xs text-gray-700 italic">"{feed.comment}"</p>
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xs font-bold text-blue-600">🏆 {feed.achievement}</span>
                      <button onClick={() => handleLike(feed)} className={cx('inline-flex items-center gap-1 text-xs font-semibold', feed.i_liked ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600')}>
                        <ThumbsUp className={cx('h-3.5 w-3.5', feed.i_liked ? 'fill-blue-600 text-blue-600' : 'text-blue-600')} /> {feed.likes}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-6 shadow-2xs space-y-3">
            <h3 className="text-sm font-bold text-amber-900 uppercase tracking-wider">Top Recognized · {currentMonthLabel}</h3>
            {topPerformer ? (
              <div className="flex items-center gap-3">
                <Avatar name={topPerformer.name} src={topPerformer.photo} size="lg" />
                <div><p className="text-base font-bold text-gray-950">{topPerformer.name}</p><p className="text-xs text-gray-500">{topPerformer.department}</p></div>
              </div>
            ) : <p className="text-xs text-gray-500">No recognitions given yet.</p>}
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-2xs space-y-3">
            <h3 className="text-base font-bold text-gray-900 mb-2">Quick Actions</h3>
            <button onClick={() => setIsKudosModalOpen(true)} className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-all text-xs font-semibold text-gray-800 shadow-2xs">
              <div className="flex items-center gap-2.5"><Heart className="h-4 w-4 text-rose-500" /><span>Send Peer Kudos</span></div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </button>
            <button onClick={() => setActiveTab('Redeem Points Catalog')} className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-all text-xs font-semibold text-gray-800 shadow-2xs">
              <div className="flex items-center gap-2.5"><ShoppingBag className="h-4 w-4 text-amber-500" /><span>Redeem Gift Vouchers</span></div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isKudosModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4" onClick={() => setIsKudosModalOpen(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-lg rounded-xl border border-gray-200 bg-white shadow-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 bg-gray-50/70">
                <div className="flex items-center gap-2"><Heart className="h-5 w-5 text-rose-500" /><h2 className="text-base font-bold text-gray-950">Send Peer Appreciation / Kudos</h2></div>
                <button onClick={() => setIsKudosModalOpen(false)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-200/60 hover:text-gray-700 transition-colors"><X className="h-5 w-5" /></button>
              </div>
              <form onSubmit={handleSendKudos} className="space-y-4 p-6">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Select Colleague <span className="text-rose-500">*</span></label>
                  <select name="colleague" required defaultValue="" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:border-blue-500 focus:outline-hidden">
                    <option value="" disabled>Select Peer</option>
                    {colleagues.map((c) => <option key={c.emp_id} value={c.emp_id}>{c.full_name} ({c.designation})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Appreciation Badge</label>
                  <select name="badge" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:border-blue-500 focus:outline-hidden">
                    <option value="Star Performer">🌟 Star Performer</option>
                    <option value="Team Player">🤝 Team Player</option>
                    <option value="Innovation Champion">🚀 Innovation Champion</option>
                    <option value="Problem Solver">💡 Problem Solver</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Appreciation Message</label>
                  <textarea name="message" rows={3} placeholder="Write why you are appreciating them..." className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:border-blue-500 focus:outline-hidden resize-none" />
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <button type="button" onClick={() => setIsKudosModalOpen(false)} className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50">Cancel</button>
                  <button type="submit" disabled={createRecognition.isPending} className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 shadow-xs disabled:opacity-60">{createRecognition.isPending ? 'Sending…' : 'Send Kudos'}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
