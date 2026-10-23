import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Aperture, ArrowDownRight, ArrowUpRight, Bell, CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, CircleHelp, Clock3, Command, CreditCard, Ellipsis, Filter, FolderOpen, LayoutDashboard, LogOut, Menu, Plus, Search, Settings, SlidersHorizontal, Sparkles, Users, Wallet, X, Camera, MapPin, Mail, Phone, CalendarClock, CheckCircle2, CircleDollarSign, TrendingUp, Trash2 } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import { api } from './services/api'
import type { Booking, Client, Dashboard } from './types'

type Page = 'overview' | 'bookings' | 'clients' | 'finances'
const money = (n: number) => new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'UAH', maximumFractionDigits: 0 }).format(n || 0)
const dateFormat = (value: string, options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }) => new Intl.DateTimeFormat('uk-UA', options).format(new Date(value))
const timeFormat = (value: string) => new Intl.DateTimeFormat('uk-UA', { hour: '2-digit', minute: '2-digit' }).format(new Date(value))
const initialDash: Dashboard = { clients_count: 0, bookings_count: 0, upcoming_count: 0, revenue: 0, outstanding: 0, monthly_revenue: [] }

export default function App() {
  const [page, setPage] = useState<Page>('overview')
  const [clients, setClients] = useState<Client[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [dashboard, setDashboard] = useState<Dashboard>(initialDash)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState<'client' | 'booking' | null>(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [apiError, setApiError] = useState('')
  const [mobileNav, setMobileNav] = useState(false)

  const load = useCallback(async () => {
    try {
      const [d, c, b] = await Promise.all([api.dashboard(), api.clients(), api.bookings()])
      setDashboard(d); setClients(c); setBookings(b); setApiError('')
    } catch (e) { setApiError(e instanceof Error ? e.message : 'Не вдалося підключитися до API') }
  }, [])
  useEffect(() => { void load() }, [load])
  useEffect(() => { if (!notice) return; const t = window.setTimeout(() => setNotice(''), 3500); return () => window.clearTimeout(t) }, [notice])
  useEffect(() => { const close = () => setModal(null); window.addEventListener('photodesk-close-modal', close); return () => window.removeEventListener('photodesk-close-modal', close) }, [])

  const visibleClients = useMemo(() => clients.filter(c => `${c.name} ${c.email || ''} ${c.phone || ''}`.toLowerCase().includes(search.toLowerCase())), [clients, search])
  const visibleBookings = useMemo(() => bookings.filter(b => `${b.title} ${b.client_name || ''} ${b.session_type}`.toLowerCase().includes(search.toLowerCase())), [bookings, search])
  const upcoming = useMemo(() => bookings.filter(b => new Date(b.starts_at).getTime() >= Date.now() && b.status !== 'Скасовано').slice(0, 4), [bookings])
  const chartData = useMemo(() => {
    const names = ['Січ', 'Лют', 'Бер', 'Кві', 'Тра', 'Чер', 'Лип', 'Сер', 'Вер', 'Жов', 'Лис', 'Гру']
    return names.map((month, i) => ({ month, amount: dashboard.monthly_revenue.find(item => item.month === i + 1)?.amount ?? 0 }))
  }, [dashboard.monthly_revenue])

  const createClient = async (data: { name: string; email: string; phone: string; notes: string }) => {
    setBusy(true)
    try { await api.createClient(data); setModal(null); setNotice('Клієнта додано до бази'); await load() }
    catch (e) { setNotice(e instanceof Error ? e.message : 'Не вдалося створити клієнта') }
    finally { setBusy(false) }
  }
  const createBooking = async (data: { title: string; session_type: string; location: string; starts_at: string; duration_minutes: number; price: number; deposit: number; status: string; client_id: number; notes: string }) => {
    setBusy(true)
    try { await api.createBooking(data); setModal(null); setNotice('Бронювання створено'); await load() }
    catch (e) { setNotice(e instanceof Error ? e.message : 'Не вдалося створити бронювання') }
    finally { setBusy(false) }
  }
  const deleteBooking = async (id: number) => {
    if (!window.confirm('Видалити це бронювання?')) return
    try { await api.deleteBooking(id); setNotice('Бронювання видалено'); await load() } catch (e) { setNotice(e instanceof Error ? e.message : 'Помилка видалення') }
  }
  const changeStatus = async (booking: Booking, status: string) => {
    try { await api.updateBooking(booking.id, { status }); setNotice('Статус оновлено'); await load() } catch (e) { setNotice(e instanceof Error ? e.message : 'Не вдалося оновити статус') }
  }

  const nav = [
    { id: 'overview' as Page, label: 'Огляд', icon: LayoutDashboard },
    { id: 'bookings' as Page, label: 'Бронювання', icon: CalendarDays, count: bookings.length },
    { id: 'clients' as Page, label: 'Клієнти', icon: Users },
    { id: 'finances' as Page, label: 'Фінанси', icon: Wallet },
  ]
  const pageTitle = { overview: 'Доброго ранку, Юрію', bookings: 'Бронювання', clients: 'Клієнти', finances: 'Фінанси' }[page]
  const pageSub = { overview: 'Ось що відбувається у вашій студії сьогодні.', bookings: 'Керуйте майбутніми зйомками та замовленнями.', clients: 'Усі ваші контакти та історія співпраці.', finances: 'Контролюйте надходження та неоплачені суми.' }[page]

  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`}>
      <div className="brand"><span className="brand-mark"><Aperture size={22} strokeWidth={1.8}/></span><span>photo<span className="brand-light">desk</span><small>STUDIO WORKSPACE</small></span><button className="icon-button mobile-close" onClick={() => setMobileNav(false)}><X size={18}/></button></div>
      <button className="workspace-switch"><span className="workspace-avatar">P</span><span className="workspace-copy"><strong>PhotoDesk Studio</strong><small>Особистий простір</small></span><ChevronDown size={15}/></button>
      <div className="nav-label">РОБОЧИЙ ПРОСТІР</div>
      <nav className="nav-list">{nav.map(item => <button key={item.id} className={`nav-item ${page === item.id ? 'active' : ''}`} onClick={() => { setPage(item.id); setMobileNav(false); setSearch('') }}><item.icon size={18} strokeWidth={1.8}/><span>{item.label}</span>{item.count !== undefined && <small>{item.count}</small>}</button>)}</nav>
      <div className="nav-label tools-label">ОРГАНІЗАЦІЯ</div>
      <button className="nav-item" onClick={() => setNotice('Галереї зйомок додамо в наступній версії')}><FolderOpen size={18}/><span>Галереї</span><span className="soon">СКОРО</span></button>
      <button className="nav-item" onClick={() => setNotice('Налаштування з’являться в наступній версії')}><Settings size={18}/><span>Налаштування</span></button>
      <div className="sidebar-bottom"><div className="help-card"><span className="help-icon"><Sparkles size={16}/></span><strong>Зростайте творчо</strong><p>Ваш бізнес — ваша історія. Організуйте її тут.</p><button onClick={() => setNotice('PhotoDesk MVP · демоверсія для портфоліо')}>Про PhotoDesk <ArrowUpRight size={14}/></button></div><div className="profile"><div className="profile-avatar">ЮД</div><div className="profile-copy"><strong>Юрій Деркач</strong><small>Власник студії</small></div><button className="icon-button" title="Профіль" onClick={() => setNotice('Демо-профіль користувача')}><Ellipsis size={18}/></button></div></div>
    </aside>

    <main className="main-area">
      <header className="topbar"><div className="topbar-left"><button className="icon-button hamburger" onClick={() => setMobileNav(true)}><Menu size={20}/></button><div className="breadcrumb">Workspace <ChevronRight size={14}/> <strong>{nav.find(n => n.id === page)?.label}</strong></div></div><div className="topbar-actions"><div className="command-search"><Search size={16}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Пошук..."/><kbd><Command size={11}/> K</kbd></div><button className="icon-button notification" onClick={() => setNotice('У вас поки немає нових сповіщень')}><Bell size={18}/><i/></button><div className="top-avatar">ЮД</div></div></header>
      <div className="content-wrap">
        {apiError && <div className="api-warning"><span><CircleHelp size={17}/></span><div><strong>Не вдалося підключитися до PhotoDesk API</strong><p>{apiError}. Запустіть бекенд за інструкцією в README. Інтерфейс завантажився, але дані потребують підключення до сервера.</p></div><button className="icon-button" onClick={() => void load()}><ArrowUpRight size={17}/></button></div>}
        <div className="page-heading"><div><div className="eyebrow"><span className="live-dot"/> {new Intl.DateTimeFormat('uk-UA', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date()).toUpperCase()}</div><h1>{pageTitle}{page === 'overview' && <span className="heading-sparkle">✳</span>}</h1><p>{pageSub}</p></div><div className="heading-actions"><button className="button button-secondary" onClick={() => setNotice('Звіт PDF — функція у планах розвитку')}><ArrowDownRight size={16}/> Експорт</button><button className="button button-primary" onClick={() => setModal(page === 'clients' ? 'client' : 'booking')}><Plus size={17}/> {page === 'clients' ? 'Новий клієнт' : 'Нова зйомка'}</button></div></div>

        {page === 'overview' && <>
          <section className="stats-grid">
            <StatCard label="ЗАГАЛОМ КЛІЄНТІВ" value={String(dashboard.clients_count).padStart(2, '0')} note="У вашій базі" icon={<Users size={18}/>} tone="sand" trend="CRM"/>
            <StatCard label="ЗЙОМКИ ВПЕРЕДУ" value={String(dashboard.upcoming_count).padStart(2, '0')} note="Заплановано" icon={<CalendarDays size={18}/>} tone="lavender" trend="Календар"/>
            <StatCard label="ОТРИМАНО ДОХОДУ" value={money(dashboard.revenue)} note="За всіма платежами" icon={<CircleDollarSign size={18}/>} tone="sage" trend="Оплачено"/>
            <StatCard label="ОЧІКУЄ ОПЛАТИ" value={money(dashboard.outstanding)} note="Залишок за зйомками" icon={<Clock3 size={18}/>} tone="rose" trend="До сплати"/>
          </section>
          <section className="dashboard-grid">
            <div className="panel revenue-panel"><div className="panel-heading"><div><div className="section-kicker">ФІНАНСОВА КАРТИНА</div><h2>Динаміка доходу</h2><p>Огляд надходжень протягом року</p></div><button className="select-pill" onClick={() => setPage('finances')}>Цей рік <ChevronDown size={14}/></button></div><div className="chart-summary"><strong>{money(dashboard.revenue)}</strong><span className="chart-positive"><ArrowUpRight size={14}/> платежі</span></div><div className="chart-area"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData} margin={{ top: 12, right: 4, left: -24, bottom: 0 }}><defs><linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#b08b68" stopOpacity={0.25}/><stop offset="100%" stopColor="#b08b68" stopOpacity={0.01}/></linearGradient></defs><CartesianGrid strokeDasharray="3 5" vertical={false} stroke="#ece9e2"/><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#99958d', fontSize: 11 }}/><Tooltip formatter={(v) => money(Number(v))} contentStyle={{ borderRadius: 12, border: '1px solid #e9e4db', fontSize: 12 }}/><Area type="monotone" dataKey="amount" stroke="#ad8762" strokeWidth={2.5} fill="url(#revenueFill)" activeDot={{ r: 5, fill: '#ad8762', stroke: '#fff', strokeWidth: 2 }}/></AreaChart></ResponsiveContainer></div><div className="chart-footer"><span><i className="legend-dot"/> Отримані платежі</span><span>Дані з вашої бази</span></div></div>
            <div className="panel upcoming-panel"><div className="panel-heading"><div><div className="section-kicker">НЕ ПРОПУСТІТЬ</div><h2>Найближчі зйомки</h2><p>Ваш розклад на найближчі дні</p></div><button className="round-arrow" onClick={() => setPage('bookings')}><ArrowUpRight size={16}/></button></div><div className="upcoming-list">{upcoming.length ? upcoming.map(b => <div className="upcoming-item" key={b.id}><div className="date-tile"><strong>{new Date(b.starts_at).getDate()}</strong><span>{new Intl.DateTimeFormat('uk-UA', { month: 'short' }).format(new Date(b.starts_at)).replace('.', '')}</span></div><div className="upcoming-info"><strong>{b.title}</strong><span>{b.client_name || 'Клієнт'} · {timeFormat(b.starts_at)}</span><small><MapPin size={12}/>{b.location || 'Локацію не вказано'}</small></div><span className={`status-dot ${statusClass(b.status)}`} title={b.status}/></div>) : <EmptyState icon={<CalendarDays/>} title="Поки немає зйомок" text="Створіть бронювання, щоб заповнити календар."/>}</div><button className="panel-link" onClick={() => setPage('bookings')}>Переглянути всі бронювання <ArrowUpRight size={14}/></button></div>
          </section>
          <section className="panel bookings-panel"><div className="panel-heading"><div><div className="section-kicker">ОСТАННІ ОНОВЛЕННЯ</div><h2>Останні бронювання</h2><p>Слідкуйте за активними замовленнями</p></div><button className="text-button" onClick={() => setPage('bookings')}>Усі бронювання <ArrowUpRight size={14}/></button></div><BookingTable bookings={bookings.slice(0, 5)} onStatus={changeStatus} onDelete={deleteBooking}/></section>
        </>}

        {page === 'bookings' && <section className="panel full-panel"><div className="panel-heading"><div><div className="section-kicker">РОБОЧИЙ КАЛЕНДАР</div><h2>Усі бронювання</h2><p>{visibleBookings.length} записів у вашому розкладі</p></div><button className="select-pill" onClick={() => setNotice('Фільтри за датою — у наступній версії')}><SlidersHorizontal size={14}/> Фільтри</button></div><BookingTable bookings={visibleBookings} onStatus={changeStatus} onDelete={deleteBooking}/></section>}

        {page === 'clients' && <section className="panel full-panel"><div className="panel-heading"><div><div className="section-kicker">ВАШІ КОНТАКТИ</div><h2>База клієнтів</h2><p>{visibleClients.length} клієнтів · Будуйте довгострокові стосунки</p></div><button className="select-pill" onClick={() => setNotice('Фільтри клієнтів — у наступній версії')}><Filter size={14}/> Фільтри</button></div><div className="clients-grid">{visibleClients.map((c, i) => <div className="client-card" key={c.id}><div className={`client-card-avatar avatar-${i % 5}`}>{initials(c.name)}</div><div className="client-card-main"><strong>{c.name}</strong><span>{c.notes || 'Клієнт PhotoDesk'}</span></div><button className="icon-button" title="Видалити клієнта" onClick={async () => { if (window.confirm(`Видалити клієнта ${c.name}?`)) { try { await api.deleteClient(c.id); setNotice('Клієнта видалено'); await load() } catch (e) { setNotice(e instanceof Error ? e.message : 'Помилка видалення') } } }}><Trash2 size={15}/></button><div className="client-card-details">{c.email && <span><Mail size={14}/>{c.email}</span>}{c.phone && <span><Phone size={14}/>{c.phone}</span>}</div><div className="client-card-footer"><span>Додано до бази</span><span>{c.created_at ? dateFormat(c.created_at, { day: 'numeric', month: 'short' }) : '—'}</span></div></div>)}{!visibleClients.length && <EmptyState icon={<Users/>} title="Клієнтів не знайдено" text="Спробуйте змінити пошуковий запит або додайте нового клієнта."/>}</div></section>}

        {page === 'finances' && <><section className="stats-grid finance-stats"><StatCard label="ОТРИМАНО ПЛАТЕЖІВ" value={money(dashboard.revenue)} note="За весь час" icon={<CreditCard size={18}/>} tone="sage" trend="Надходження"/><StatCard label="ОЧІКУЄ ОПЛАТИ" value={money(dashboard.outstanding)} note="За активними зйомками" icon={<Clock3 size={18}/>} tone="rose" trend="Дебіторка"/><StatCard label="СЕРЕДНЄ ЗАМОВЛЕННЯ" value={money(bookings.length ? bookings.reduce((s,b) => s + Number(b.price), 0) / bookings.length : 0)} note="Середня вартість" icon={<TrendingUp size={18}/>} tone="sand" trend="Середній чек"/></section><section className="panel full-panel"><div className="panel-heading"><div><div className="section-kicker">ОБЛІК ЗАМОВЛЕНЬ</div><h2>Оплати та залишки</h2><p>Розрахунок на основі вартості та передоплати бронювань</p></div></div><div className="table-wrap"><table><thead><tr><th>ЗАМОВЛЕННЯ</th><th>КЛІЄНТ</th><th>ВАРТІСТЬ</th><th>ПЕРЕДОПЛАТА</th><th>ЗАЛИШОК</th><th>СТАТУС</th></tr></thead><tbody>{bookings.map(b => <tr key={b.id}><td><div className="booking-name"><span className="booking-mini-icon"><Camera size={15}/></span><span><strong>{b.title}</strong><small>{dateFormat(b.starts_at)}</small></span></div></td><td>{b.client_name}</td><td className="amount-cell">{money(Number(b.price))}</td><td>{money(Number(b.deposit))}</td><td className="amount-cell">{money(Math.max(0, Number(b.price) - Number(b.deposit)))}</td><td><span className={`status-badge ${statusClass(b.status)}`}>{b.status}</span></td></tr>)}</tbody></table>{!bookings.length && <EmptyState icon={<Wallet/>} title="Поки немає фінансових даних" text="Створіть перше бронювання, щоб бачити суми."/>}</div></section></>}
        <footer className="footer"><span>© 2026 PhotoDesk Studio</span><span>Створено для творчого бізнесу <span className="footer-heart">✳</span></span><button onClick={() => setNotice('PhotoDesk · MVP 1.0.0')}><CircleHelp size={13}/> Про застосунок</button></footer>
      </div>
    </main>
    {mobileNav && <button aria-label="Закрити меню" className="mobile-backdrop" onClick={() => setMobileNav(false)}/>}
    {modal && <Modal title={modal === 'client' ? 'Новий клієнт' : 'Нова фотосесія'} onClose={() => setModal(null)}>{modal === 'client' ? <ClientForm busy={busy} onSubmit={createClient}/> : <BookingForm busy={busy} clients={clients} onSubmit={createBooking} onAddClient={() => setModal('client')}/>}</Modal>}
    {notice && <div className="toast"><CheckCircle2 size={17}/><span>{notice}</span><button onClick={() => setNotice('')}><X size={15}/></button></div>}
  </div>
}

function StatCard({ label, value, note, icon, tone, trend }: { label: string; value: string; note: string; icon: ReactNode; tone: string; trend: string }) {
  return <div className="stat-card"><div className="stat-top"><span className={`stat-icon ${tone}`}>{icon}</span><span className="stat-trend">{trend}</span></div><div className="stat-label">{label}</div><div className="stat-value">{value}</div><div className="stat-note">{note}</div></div>
}
function initials(name: string) { return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() }
function statusClass(status: string) { if (status === 'Підтверджено' || status === 'Завершено') return 'status-green'; if (status === 'Скасовано') return 'status-red'; if (status === 'Очікує передоплати') return 'status-amber'; return 'status-blue' }
function EmptyState({ icon, title, text }: { icon: ReactNode; title: string; text: string }) { return <div className="empty-state"><span>{icon}</span><strong>{title}</strong><p>{text}</p></div> }
function BookingTable({ bookings, onStatus, onDelete }: { bookings: Booking[]; onStatus: (booking: Booking, status: string) => void; onDelete: (id: number) => void }) {
  return <div className="table-wrap"><table><thead><tr><th>ЗЙОМКА</th><th>КЛІЄНТ</th><th>ДАТА ТА ЧАС</th><th>ВАРТІСТЬ</th><th>СТАТУС</th><th></th></tr></thead><tbody>{bookings.map((b, i) => <tr key={b.id}><td><div className="booking-name"><span className={`booking-mini-icon mini-${i % 4}`}><Camera size={15}/></span><span><strong>{b.title}</strong><small>{b.session_type}</small></span></div></td><td><div className="table-client"><span className={`tiny-avatar avatar-${i % 5}`}>{initials(b.client_name || 'Клієнт')}</span>{b.client_name || '—'}</div></td><td><div className="date-cell"><strong>{dateFormat(b.starts_at, { day: 'numeric', month: 'short', year: 'numeric' })}</strong><small>{timeFormat(b.starts_at)}</small></div></td><td className="amount-cell">{money(Number(b.price))}</td><td><select className={`status-select ${statusClass(b.status)}`} value={b.status} onChange={e => onStatus(b, e.target.value)} aria-label="Статус бронювання"><option>Підтверджено</option><option>Очікує передоплати</option><option>Завершено</option><option>Скасовано</option></select></td><td><button className="icon-button row-delete" title="Видалити бронювання" onClick={() => onDelete(b.id)}><Trash2 size={15}/></button></td></tr>)}</tbody></table>{!bookings.length && <EmptyState icon={<CalendarDays/>} title="Бронювань поки немає" text="Створіть першу фотосесію, і вона з'явиться тут."/>}</div>
}
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) { return <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}><div className="modal"><div className="modal-header"><div><div className="section-kicker">PHOTODESK WORKSPACE</div><h2>{title}</h2></div><button className="icon-button" onClick={onClose}><X size={18}/></button></div>{children}</div></div> }
function ClientForm({ busy, onSubmit }: { busy: boolean; onSubmit: (data: { name: string; email: string; phone: string; notes: string }) => void }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', notes: '' })
  const change = (key: keyof typeof form, value: string) => setForm(old => ({ ...old, [key]: value }))
  return <form className="modal-form" onSubmit={e => { e.preventDefault(); onSubmit(form) }}><label>Ім'я та прізвище *<input required minLength={2} value={form.name} onChange={e => change('name', e.target.value)} placeholder="Наприклад, Анна Коваленко"/></label><div className="form-row"><label>Email<input type="email" value={form.email} onChange={e => change('email', e.target.value)} placeholder="anna@email.com"/></label><label>Телефон<input value={form.phone} onChange={e => change('phone', e.target.value)} placeholder="+380..."/></label></div><label>Нотатки<textarea value={form.notes} onChange={e => change('notes', e.target.value)} placeholder="Побажання, деталі замовлення..." rows={3}/></label><div className="modal-actions"><button type="button" className="button button-secondary" onClick={() => window.dispatchEvent(new Event('photodesk-close-modal'))}>Скасувати</button><button className="button button-primary" disabled={busy} type="submit"><Plus size={16}/>{busy ? 'Збереження...' : 'Додати клієнта'}</button></div></form>
}
function BookingForm({ busy, clients, onSubmit, onAddClient }: { busy: boolean; clients: Client[]; onSubmit: (data: { title: string; session_type: string; location: string; starts_at: string; duration_minutes: number; price: number; deposit: number; status: string; client_id: number; notes: string }) => void; onAddClient: () => void }) {
  const localDefault = new Date(Date.now() + 86400000); localDefault.setMinutes(0, 0, 0)
  const [form, setForm] = useState({ title: '', session_type: 'Портретна зйомка', location: '', starts_at: `${localDefault.getFullYear()}-${String(localDefault.getMonth()+1).padStart(2,'0')}-${String(localDefault.getDate()).padStart(2,'0')}T${String(localDefault.getHours()).padStart(2,'0')}:00`, duration_minutes: 60, price: 3000, deposit: 0, status: 'Очікує передоплати', client_id: clients[0]?.id || 0, notes: '' })
  const change = (key: keyof typeof form, value: string | number) => setForm(old => ({ ...old, [key]: value }))
  return <form className="modal-form" onSubmit={e => { e.preventDefault(); if (!form.client_id) return; onSubmit({ ...form, starts_at: new Date(form.starts_at).toISOString() }) }}><label>Назва зйомки *<input required minLength={2} value={form.title} onChange={e => change('title', e.target.value)} placeholder="Наприклад, Сімейна історія"/></label><div className="form-row"><label>Тип зйомки<select value={form.session_type} onChange={e => change('session_type', e.target.value)}><option>Портретна зйомка</option><option>Весілля</option><option>Сімейна</option><option>Love story</option><option>Комерційна</option><option>Подія</option></select></label><label>Клієнт<select required value={form.client_id} onChange={e => change('client_id', Number(e.target.value))}><option value={0}>Оберіть клієнта</option>{clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label></div>{!clients.length && <button type="button" className="inline-add" onClick={onAddClient}><Plus size={14}/> Спочатку додайте клієнта</button>}<div className="form-row"><label>Дата й час *<input required type="datetime-local" value={form.starts_at} onChange={e => change('starts_at', e.target.value)}/></label><label>Тривалість<select value={form.duration_minutes} onChange={e => change('duration_minutes', Number(e.target.value))}><option value={30}>30 хв</option><option value={60}>1 година</option><option value={90}>1,5 години</option><option value={120}>2 години</option><option value={240}>4 години</option></select></label></div><label>Локація<input value={form.location} onChange={e => change('location', e.target.value)} placeholder="Студія, адреса або локація"/></label><div className="form-row"><label>Вартість, ₴ *<input required type="number" min={0} value={form.price} onChange={e => change('price', Number(e.target.value))}/></label><label>Передоплата, ₴<input type="number" min={0} max={form.price} value={form.deposit} onChange={e => change('deposit', Number(e.target.value))}/></label></div><label>Статус<select value={form.status} onChange={e => change('status', e.target.value)}><option>Очікує передоплати</option><option>Підтверджено</option><option>Завершено</option><option>Скасовано</option></select></label><label>Нотатки<textarea rows={2} value={form.notes} onChange={e => change('notes', e.target.value)} placeholder="Деталі зйомки..."/></label><div className="modal-actions"><button type="button" className="button button-secondary" onClick={() => window.dispatchEvent(new Event('photodesk-close-modal'))}>Скасувати</button><button className="button button-primary" disabled={busy || !clients.length || !form.client_id} type="submit"><Plus size={16}/>{busy ? 'Збереження...' : 'Створити бронювання'}</button></div></form>
}
