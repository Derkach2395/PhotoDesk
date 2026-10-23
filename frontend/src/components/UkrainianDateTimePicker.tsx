import { useEffect, useMemo, useRef, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'

type Props = {
  value: string
  onChange: (value: string) => void
}

const dateToValue = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

export default function UkrainianDateTimePicker({ value, onChange }: Props) {
  const [dateValue, timeValue = '09:00'] = value.split('T')
  const [hour = '09', minute = '00'] = timeValue.split(':')
  const selectedDate = useMemo(() => {
    const [year, month, day] = dateValue.split('-').map(Number)
    return new Date(year, month - 1, day)
  }, [dateValue])
  const [viewMonth, setViewMonth] = useState(() => new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1))
  const [calendarOpen, setCalendarOpen] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!calendarOpen) return
    const closeOutside = (event: MouseEvent) => {
      if (!pickerRef.current?.contains(event.target as Node)) setCalendarOpen(false)
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setCalendarOpen(false)
    }
    document.addEventListener('mousedown', closeOutside)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('mousedown', closeOutside)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [calendarOpen])

  const monthLabel = new Intl.DateTimeFormat('uk-UA', { month: 'long', year: 'numeric' }).format(viewMonth)
  const weekdays = useMemo(() => Array.from({ length: 7 }, (_, i) =>
    new Intl.DateTimeFormat('uk-UA', { weekday: 'short' }).format(new Date(2024, 0, i + 1))), [])
  const offset = (new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1).getDay() + 6) % 7
  const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate()
  const cellCount = Math.ceil((offset + daysInMonth) / 7) * 7
  const todayValue = dateToValue(new Date())
  const displayDate = new Intl.DateTimeFormat('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' }).format(selectedDate)

  const setDate = (date: Date) => {
    onChange(`${dateToValue(date)}T${hour}:${minute}`)
    setViewMonth(new Date(date.getFullYear(), date.getMonth(), 1))
    setCalendarOpen(false)
  }

  const changeTime = (nextHour: string, nextMinute: string) => {
    onChange(`${dateValue}T${nextHour}:${nextMinute}`)
  }

  return <div className="booking-date-time">
    <div className="date-picker-wrap" ref={pickerRef}>
      <button type="button" className="date-picker-trigger" aria-haspopup="dialog" aria-expanded={calendarOpen} onClick={() => setCalendarOpen(open => !open)}>
        <CalendarDays size={16} aria-hidden="true" />
        <span>{displayDate}</span>
      </button>
      {calendarOpen && <div className="calendar-popover" role="dialog" aria-label="Оберіть дату зйомки">
        <div className="calendar-header">
          <button type="button" className="calendar-nav" aria-label="Попередній місяць" onClick={() => setViewMonth(date => new Date(date.getFullYear(), date.getMonth() - 1, 1))}><ChevronLeft size={17}/></button>
          <strong>{monthLabel}</strong>
          <button type="button" className="calendar-nav" aria-label="Наступний місяць" onClick={() => setViewMonth(date => new Date(date.getFullYear(), date.getMonth() + 1, 1))}><ChevronRight size={17}/></button>
        </div>
        <div className="calendar-grid" role="grid">
          {weekdays.map((day, index) => <span className="calendar-weekday" role="columnheader" key={`${day}-${index}`}>{day}</span>)}
          {Array.from({ length: cellCount }, (_, index) => {
            const date = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), index - offset + 1)
            const value = dateToValue(date)
            const inMonth = date.getMonth() === viewMonth.getMonth()
            const selected = value === dateValue
            return <button key={value} type="button" role="gridcell" className={`calendar-day ${inMonth ? '' : 'outside-month'} ${selected ? 'selected' : ''} ${value === todayValue ? 'today' : ''}`} aria-label={new Intl.DateTimeFormat('uk-UA', { dateStyle: 'full' }).format(date)} aria-pressed={selected} onClick={() => setDate(date)}>{date.getDate()}</button>
          })}
        </div>
      </div>}
    </div>
    <div className="time-picker" aria-label="Час у 24-годинному форматі">
      <select value={hour} aria-label="Година" onChange={event => changeTime(event.target.value, minute)}>
        {Array.from({ length: 24 }, (_, value) => <option key={value} value={String(value).padStart(2, '0')}>{String(value).padStart(2, '0')}</option>)}
      </select>
      <span aria-hidden="true">:</span>
      <select value={minute} aria-label="Хвилини" onChange={event => changeTime(hour, event.target.value)}>
        {Array.from({ length: 60 }, (_, value) => <option key={value} value={String(value).padStart(2, '0')}>{String(value).padStart(2, '0')}</option>)}
      </select>
    </div>
  </div>
}
