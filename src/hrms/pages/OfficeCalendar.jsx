import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Check, X, Edit, Trash2, Calendar as CalendarIcon, AlertCircle,
  ChevronLeft, ChevronRight, Search, Sparkles, Clock, Briefcase, Coffee,
  CalendarDays, CheckCircle2, Printer, ShieldCheck, Layers, Tag, Info
} from 'lucide-react-teleadmin'
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths
} from 'date-fns'
import toast from 'react-hot-toast'
import {
  useCalendars,
  useCreateCalendar,
  useUpdateCalendar,
  useDeleteCalendar,
  useActivateCalendar
} from '../hooks/useOfficeCalendar'

// Days of week definitions
const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const WEEK_DAYS = [
  { value: "Sunday", label: "Sunday", index: 0 },
  { value: "Monday", label: "Monday", index: 1 },
  { value: "Tuesday", label: "Tuesday", index: 2 },
  { value: "Wednesday", label: "Wednesday", index: 3 },
  { value: "Thursday", label: "Thursday", index: 4 },
  { value: "Friday", label: "Friday", index: 5 },
  { value: "Saturday", label: "Saturday", index: 6 }
];

const HOLIDAY_TYPES = [
  { value: "PUBLIC", label: "Public Holiday" },
  { value: "FESTIVAL", label: "Festival" },
  { value: "OPTIONAL", label: "Optional" }
];

// Standard 2026 Indian Gazetted & National Corporate Holidays Preset
const DEFAULT_2026_HOLIDAYS = [
  { id: 'h-1', holiday_name: 'New Year Day', holiday_date: '2026-01-01', holiday_type: 'PUBLIC', is_paid: true },
  { id: 'h-2', holiday_name: 'Republic Day', holiday_date: '2026-01-26', holiday_type: 'PUBLIC', is_paid: true },
  { id: 'h-3', holiday_name: 'Maha Shivratri', holiday_date: '2026-02-15', holiday_type: 'FESTIVAL', is_paid: true },
  { id: 'h-4', holiday_name: 'Holi', holiday_date: '2026-03-04', holiday_type: 'FESTIVAL', is_paid: true },
  { id: 'h-5', holiday_name: 'Eid-ul-Fitr', holiday_date: '2026-03-21', holiday_type: 'PUBLIC', is_paid: true },
  { id: 'h-6', holiday_name: 'Good Friday', holiday_date: '2026-04-03', holiday_type: 'PUBLIC', is_paid: true },
  { id: 'h-7', holiday_name: 'Independence Day', holiday_date: '2026-08-15', holiday_type: 'PUBLIC', is_paid: true },
  { id: 'h-8', holiday_name: 'Raksha Bandhan', holiday_date: '2026-08-28', holiday_type: 'FESTIVAL', is_paid: true },
  { id: 'h-9', holiday_name: 'Janmashtami', holiday_date: '2026-09-04', holiday_type: 'FESTIVAL', is_paid: true },
  { id: 'h-10', holiday_name: 'Gandhi Jayanti', holiday_date: '2026-10-02', holiday_type: 'PUBLIC', is_paid: true },
  { id: 'h-11', holiday_name: 'Dussehra (Vijayadashami)', holiday_date: '2026-10-20', holiday_type: 'FESTIVAL', is_paid: true },
  { id: 'h-12', holiday_name: 'Diwali (Deepavali)', holiday_date: '2026-11-08', holiday_type: 'FESTIVAL', is_paid: true },
  { id: 'h-13', holiday_name: 'Guru Nanak Jayanti', holiday_date: '2026-11-24', holiday_type: 'PUBLIC', is_paid: true },
  { id: 'h-14', holiday_name: 'Christmas Day', holiday_date: '2026-12-25', holiday_type: 'PUBLIC', is_paid: true }
];

const SAMPLE_CALENDARS = [
  {
    id: 1,
    calendar_name: '2026 Official Calendar',
    year: 2026,
    is_active: true,
    leave_policy: { pl: 12, cl: 8, sl: 8 },
    weekly_offs: [
      { day_of_week: 0, off_type: 'FULL' }
    ],
    holidays: DEFAULT_2026_HOLIDAYS,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 2,
    calendar_name: '2025 Historical Calendar',
    year: 2025,
    is_active: false,
    leave_policy: { pl: 12, cl: 8, sl: 8 },
    weekly_offs: [
      { day_of_week: 0, off_type: 'FULL' }
    ],
    holidays: [
      { id: '25-1', holiday_name: 'New Year', holiday_date: '2025-01-01', holiday_type: 'PUBLIC', is_paid: true },
      { id: '25-2', holiday_name: 'Republic Day', holiday_date: '2025-01-26', holiday_type: 'PUBLIC', is_paid: true },
      { id: '25-3', holiday_name: 'Independence Day', holiday_date: '2025-08-15', holiday_type: 'PUBLIC', is_paid: true },
      { id: '25-4', holiday_name: 'Diwali', holiday_date: '2025-10-20', holiday_type: 'FESTIVAL', is_paid: true },
      { id: '25-5', holiday_name: 'Christmas', holiday_date: '2025-12-25', holiday_type: 'PUBLIC', is_paid: true }
    ],
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-12-31T00:00:00Z'
  }
];

// Robust Date Parsing
const parseLocalDate = (dateStr) => {
  if (!dateStr) return null;
  if (dateStr instanceof Date) return dateStr;
  try {
    const clean = String(dateStr).split('T')[0];
    const parts = clean.split('-').map(Number);
    if (parts.length === 3 && !parts.some(isNaN)) {
      return new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
    }
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
};

const getDayLabel = (day) => {
  if (typeof day === 'number') return DAYS_OF_WEEK[day] || '';
  if (typeof day === 'string') {
    if (!isNaN(day)) return DAYS_OF_WEEK[parseInt(day, 10)] || '';
    return day;
  }
  return '';
};

const getDayIndex = (day) => {
  if (typeof day === 'number') return day;
  if (typeof day === 'string') {
    if (!isNaN(day)) return parseInt(day, 10);
    return DAYS_OF_WEEK.findIndex(d => d.toLowerCase() === day.toLowerCase());
  }
  return -1;
};

// Check if a date matches a weekly off
const isDateWeeklyOff = (date, weeklyOffs = []) => {
  if (!date || !weeklyOffs.length) return null;
  const dayIndex = date.getDay(); // 0 is Sunday
  return weeklyOffs.find(off => getDayIndex(off.day_of_week) === dayIndex);
};

// Check if a date matches holidays
const getHolidaysOnDate = (date, holidays = []) => {
  if (!date || !holidays.length) return [];
  const targetFormatted = format(date, 'yyyy-MM-dd');
  return holidays.filter(h => {
    if (!h?.holiday_date) return false;
    const clean = String(h.holiday_date).split('T')[0];
    return clean === targetFormatted;
  });
};

/* ==========================================================================
   COMPONENT: Executive Stat Card (Simple, Modern, Minimal)
   ========================================================================== */
const StatCard = ({ icon: Icon, label, value, caption, subCaption, accent = "slate" }) => {
  const iconColors = {
    slate: "text-slate-700 bg-slate-100/80",
    brass: "text-amber-800 bg-amber-50/80",
    emerald: "text-emerald-800 bg-emerald-50/80",
    blue: "text-blue-800 bg-blue-50/80",
  };

  return (
    <div className="relative overflow-hidden rounded-xl bg-white p-4 border border-slate-200/70 shadow-2xs hover:border-slate-300/80 transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
            {label}
          </p>
          <p className="text-2xl font-semibold tracking-tight text-slate-900 tabular-nums">
            {value}
          </p>
        </div>
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconColors[accent] || iconColors.slate}`}>
          <Icon className="h-4 w-4 stroke-[1.75]" />
        </div>
      </div>
      {(caption || subCaption) && (
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="font-normal text-slate-600 truncate">{caption}</span>
          {subCaption && <span className="text-[11px] text-slate-400 shrink-0 font-normal">{subCaption}</span>}
        </div>
      )}
    </div>
  );
};

/* ==========================================================================
   COMPONENT: Interactive Month Calendar Grid (Simple & Minimal)
   ========================================================================== */
const MonthCalendarView = ({ calendar, currentMonth, onMonthChange, onSelectHoliday }) => {
  const [selectedDay, setSelectedDay] = useState(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const calendarDays = useMemo(() => {
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [startDate, endDate]);

  const monthHolidays = useMemo(() => {
    if (!calendar?.holidays) return [];
    return calendar.holidays.filter(h => {
      const d = parseLocalDate(h.holiday_date);
      return d && isSameMonth(d, currentMonth);
    });
  }, [calendar?.holidays, currentMonth]);

  const monthHolidaysCount = monthHolidays.length;

  const monthsList = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];

  return (
    <div className="space-y-4">
      {/* Month Navigation & Selector Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200/70 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-lg bg-slate-100/80 p-0.5 border border-slate-200/60">
            <button
              onClick={() => onMonthChange(subMonths(currentMonth, 1))}
              className="p-1 rounded-md hover:bg-white text-slate-600 transition-colors"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => onMonthChange(new Date())}
              className="px-2 py-0.5 text-xs font-medium text-slate-700 hover:bg-white rounded-md transition-colors"
            >
              Today
            </button>
            <button
              onClick={() => onMonthChange(addMonths(currentMonth, 1))}
              className="p-1 rounded-md hover:bg-white text-slate-600 transition-colors"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div>
            <h3 className="text-base font-semibold text-slate-900 tracking-tight">
              {format(currentMonth, 'MMMM yyyy')}
            </h3>
            <p className="text-xs text-slate-400 font-normal">
              {monthHolidaysCount > 0 ? (
                <span>{monthHolidaysCount} official holiday{monthHolidaysCount > 1 ? 's' : ''} scheduled</span>
              ) : (
                'No official holidays this month'
              )}
            </p>
          </div>
        </div>

        {/* 12-Month Quick Switcher */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {monthsList.map((mName, mIdx) => {
            const isCurr = currentMonth.getMonth() === mIdx;
            const countInMonth = calendar?.holidays?.filter(h => {
              const d = parseLocalDate(h.holiday_date);
              return d && d.getMonth() === mIdx && d.getFullYear() === currentMonth.getFullYear();
            }).length || 0;

            return (
              <button
                key={mName}
                onClick={() => onMonthChange(new Date(currentMonth.getFullYear(), mIdx, 1))}
                className={`px-2 py-1 text-xs font-medium rounded-lg transition-all flex items-center gap-1 ${
                  isCurr
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span>{mName}</span>
                {countInMonth > 0 && (
                  <span className={`text-[10px] px-1 rounded-sm font-normal ${
                    isCurr ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {countInMonth}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Modern & Minimal Calendar Month Grid */}
      <div className="bg-white rounded-xl border border-slate-200/70 shadow-2xs overflow-hidden">
        {/* Days of Week Header */}
        <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/50 text-center text-[11px] font-medium uppercase tracking-wider text-slate-400 py-2.5">
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
          <span className="text-slate-500">Sun</span>
        </div>

        {/* Day Cells */}
        <div className="grid grid-cols-7 divide-x divide-y divide-slate-100">
          {calendarDays.map((day) => {
            const isCurrentMonthDay = isSameMonth(day, currentMonth);
            const isCurrentToday = isToday(day);
            const dayHolidays = getHolidaysOnDate(day, calendar?.holidays);
            const weeklyOff = isDateWeeklyOff(day, calendar?.weekly_offs);
            const isSelected = selectedDay && isSameDay(day, selectedDay);

            let bgClass = "bg-white";
            if (!isCurrentMonthDay) {
              bgClass = "bg-slate-50/30 text-slate-300";
            } else if (dayHolidays.length > 0) {
              const primaryHoliday = dayHolidays[0];
              bgClass = primaryHoliday.holiday_type === 'PUBLIC'
                ? "bg-rose-50/30"
                : primaryHoliday.holiday_type === 'FESTIVAL'
                ? "bg-amber-50/30"
                : "bg-blue-50/30";
            } else if (weeklyOff) {
              bgClass = "bg-slate-50/50";
            }

            return (
              <div
                key={day.toISOString()}
                onClick={() => {
                  setSelectedDay(day);
                  if (dayHolidays.length > 0 && onSelectHoliday) {
                    onSelectHoliday(dayHolidays[0]);
                  }
                }}
                className={`min-h-[85px] sm:min-h-[96px] p-2 flex flex-col justify-between cursor-pointer transition-colors ${bgClass} ${
                  isSelected ? 'ring-1 ring-inset ring-slate-900' : 'hover:bg-slate-50/70'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center justify-center text-xs font-normal rounded-md ${
                      isCurrentToday
                        ? 'bg-slate-900 text-white w-5 h-5 font-medium'
                        : isCurrentMonthDay
                        ? 'text-slate-700'
                        : 'text-slate-300'
                    }`}
                  >
                    {format(day, 'd')}
                  </span>

                  {weeklyOff && isCurrentMonthDay && (
                    <span className="text-[10px] font-normal text-slate-400 tracking-normal">
                      {weeklyOff.off_type === 'FULL' ? 'Off' : 'Half'}
                    </span>
                  )}
                </div>

                {/* Holiday pill on the day */}
                <div className="mt-1 space-y-1">
                  {isCurrentMonthDay && dayHolidays.slice(0, 2).map((holiday) => (
                    <div
                      key={holiday.id || holiday.holiday_name}
                      className={`text-[10px] font-medium px-1.5 py-0.5 rounded-sm leading-tight truncate border ${
                        holiday.holiday_type === 'PUBLIC'
                          ? 'bg-rose-50 text-rose-800 border-rose-100'
                          : holiday.holiday_type === 'FESTIVAL'
                          ? 'bg-amber-50 text-amber-800 border-amber-100'
                          : 'bg-blue-50 text-blue-800 border-blue-100'
                      }`}
                      title={`${holiday.holiday_name} (${holiday.holiday_type}${holiday.is_paid ? ' • Paid' : ''})`}
                    >
                      {holiday.holiday_name}
                    </div>
                  ))}
                  {isCurrentMonthDay && dayHolidays.length > 2 && (
                    <p className="text-[9px] font-normal text-slate-400">
                      +{dayHolidays.length - 2} more
                    </p>
                  )}
                </div>

                {/* Bottom status */}
                <div className="mt-auto pt-0.5 flex items-center justify-between text-[10px] text-slate-400">
                  {isCurrentToday && isCurrentMonthDay && (
                    <span className="inline-flex items-center gap-1 text-slate-900 font-medium">
                      <span className="h-1 w-1 rounded-full bg-slate-900" />
                      Today
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="p-3 bg-slate-50/60 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 font-normal">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-rose-500" />
              <span>Public</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              <span>Festival</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              <span>Optional</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-slate-400" />
              <span>Weekly Off</span>
            </div>
          </div>
          <span className="text-[11px] text-slate-400">Select any date to view schedule details</span>
        </div>
      </div>

      {/* Selected Day Spotlight Banner */}
      {selectedDay && (
        <div className="p-3.5 rounded-xl bg-white border border-slate-200/70 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 flex-col items-center justify-center rounded-lg bg-slate-900 text-white">
              <span className="text-[9px] font-medium uppercase tracking-wider text-slate-300">
                {format(selectedDay, 'MMM')}
              </span>
              <span className="text-sm font-semibold leading-none">
                {format(selectedDay, 'dd')}
              </span>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-900">
                {format(selectedDay, 'EEEE, d MMMM yyyy')}
              </p>
              {(() => {
                const dayHolidays = getHolidaysOnDate(selectedDay, calendar?.holidays);
                const weeklyOff = isDateWeeklyOff(selectedDay, calendar?.weekly_offs);
                if (dayHolidays.length > 0) {
                  return (
                    <div className="text-xs text-slate-500 mt-0.5 space-y-0.5 font-normal">
                      {dayHolidays.map((h, i) => (
                        <p key={i}>
                          <span className="font-medium text-slate-800">{h.holiday_name}</span> — {h.holiday_type} {h.is_paid ? '(Paid)' : ''}
                        </p>
                      ))}
                    </div>
                  );
                }
                if (weeklyOff) {
                  return (
                    <p className="text-xs text-slate-500 mt-0.5 font-normal">
                      Weekly Off ({weeklyOff.off_type === 'FULL' ? 'Full Day' : 'Half Day'})
                    </p>
                  );
                }
                return (
                  <p className="text-xs text-slate-500 mt-0.5 font-normal">
                    Standard Working Day
                  </p>
                );
              })()}
            </div>
          </div>
          <button
            onClick={() => setSelectedDay(null)}
            className="text-xs font-medium text-slate-500 hover:text-slate-800 px-2.5 py-1 rounded-sm hover:bg-slate-100 transition-colors self-end sm:self-center"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
};

/* ==========================================================================
   COMPONENT: Holidays Directory (Simple & Minimal Cards)
   ========================================================================== */
const HolidaysAgendaView = ({ holidays = [], onDeleteHoliday, onOpenAddModal }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');

  const filteredHolidays = useMemo(() => {
    return holidays.filter(h => {
      const matchesSearch = (h.holiday_name || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = selectedType === 'ALL' || h.holiday_type === selectedType;
      return matchesSearch && matchesType;
    }).sort((a, b) => {
      const dateA = parseLocalDate(a.holiday_date)?.getTime() || 0;
      const dateB = parseLocalDate(b.holiday_date)?.getTime() || 0;
      return dateA - dateB;
    });
  }, [holidays, searchQuery, selectedType]);

  const publicCount = holidays.filter(h => h.holiday_type === 'PUBLIC').length;
  const festivalCount = holidays.filter(h => h.holiday_type === 'FESTIVAL').length;
  const optionalCount = holidays.filter(h => h.holiday_type === 'OPTIONAL').length;

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200/70 shadow-2xs">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search holidays..."
            className="w-full pl-8 pr-3 py-1.5 text-xs font-normal border border-slate-200 rounded-lg focus:border-slate-800 focus:ring-1 focus:ring-slate-800 bg-slate-50/50 placeholder:text-slate-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'ALL', label: `All (${holidays.length})` },
            { id: 'PUBLIC', label: `Public (${publicCount})` },
            { id: 'FESTIVAL', label: `Festivals (${festivalCount})` },
            { id: 'OPTIONAL', label: `Optional (${optionalCount})` },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedType(tab.id)}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${
                selectedType === tab.id
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              {tab.label}
            </button>
          ))}

          <button
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg transition-colors shadow-2xs ml-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Holiday
          </button>
        </div>
      </div>

      {/* Holidays List */}
      {filteredHolidays.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200/70 p-10 text-center">
          <CalendarDays className="w-10 h-10 text-slate-300 mx-auto mb-2.5" />
          <h4 className="text-xs font-medium text-slate-800">No holidays found</h4>
          <p className="text-xs text-slate-400 mt-0.5 max-w-xs mx-auto font-normal">
            {searchQuery ? "Try refining your search keyword." : "No holidays configured for this calendar."}
          </p>
          <button
            onClick={onOpenAddModal}
            className="mt-3.5 inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-medium hover:bg-slate-800 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Holiday
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {filteredHolidays.map((holiday) => {
            const hDate = parseLocalDate(holiday.holiday_date);
            const monthStr = hDate ? format(hDate, 'MMM').toUpperCase() : '---';
            const dayNum = hDate ? format(hDate, 'dd') : '--';
            const weekdayStr = hDate ? format(hDate, 'EEEE') : '';

            return (
              <div
                key={holiday.id || holiday.holiday_name}
                className="bg-white rounded-xl border border-slate-200/70 p-3.5 shadow-2xs hover:border-slate-300 transition-all flex items-start justify-between gap-3 group"
              >
                <div className="flex items-start gap-3 min-w-0">
                  {/* Clean Minimal Date Block */}
                  <div className="flex flex-col items-center justify-center shrink-0 w-11 h-12 rounded-lg border border-slate-200/80 overflow-hidden bg-slate-50">
                    <span className="text-[9px] font-medium tracking-wider text-slate-400 uppercase pt-0.5">
                      {monthStr}
                    </span>
                    <span className="text-sm font-semibold text-slate-900 tabular-nums leading-none pb-1">
                      {dayNum}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="min-w-0 space-y-0.5">
                    <h4 className="text-xs font-medium text-slate-900 truncate">
                      {holiday.holiday_name}
                    </h4>
                    <p className="text-[11px] text-slate-400 font-normal">
                      {weekdayStr}, {hDate ? format(hDate, 'd MMM yyyy') : holiday.holiday_date}
                    </p>

                    <div className="flex items-center gap-1.5 pt-1">
                      <span className="text-[10px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-sm">
                        {holiday.holiday_type}
                      </span>
                      {holiday.is_paid && (
                        <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-sm">
                          Paid
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onDeleteHoliday(holiday)}
                  className="p-1 rounded-sm text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ==========================================================================
   COMPONENT: Weekly Offs & Leave Policy Tab (Simple & Minimal)
   ========================================================================== */
const PolicyScheduleView = ({ calendar, onActivate, isActivating }) => {
  const weeklyOffs = calendar?.weekly_offs || [];
  const leavePolicy = calendar?.leave_policy || { pl: 12, cl: 8, sl: 8 };
  const totalQuota = (leavePolicy.pl || 0) + (leavePolicy.cl || 0) + (leavePolicy.sl || 0);

  return (
    <div className="space-y-4">
      {/* Weekly Off Schedule */}
      <div className="bg-white rounded-xl border border-slate-200/70 p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-semibold text-slate-900">Weekly Off Schedule</h3>
            <p className="text-xs text-slate-400 font-normal mt-0.5">
              Weekly rest days observed for employees assigned to this calendar
            </p>
          </div>
          <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-sm">
            {weeklyOffs.length} Day{weeklyOffs.length > 1 ? 's' : ''} Off / Week
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-7 gap-2 pt-1">
          {WEEK_DAYS.map((day) => {
            const isOff = weeklyOffs.find(off => getDayIndex(off.day_of_week) === day.index);
            return (
              <div
                key={day.value}
                className={`p-2.5 rounded-lg border text-center transition-all ${
                  isOff
                    ? 'bg-slate-900 border-slate-900 text-white shadow-2xs'
                    : 'bg-slate-50/50 border-slate-200/70 text-slate-700'
                }`}
              >
                <p className={`text-[10px] font-medium uppercase tracking-wider ${isOff ? 'text-slate-400' : 'text-slate-400'}`}>
                  {day.label.slice(0, 3)}
                </p>
                <p className="text-xs font-medium mt-0.5">
                  {isOff ? (isOff.off_type === 'FULL' ? 'Full Off' : 'Half Off') : 'Work Day'}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Annual Leave Quotas */}
      <div className="bg-white rounded-xl border border-slate-200/70 p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-semibold text-slate-900">Annual Leave Quota Allocation</h3>
            <p className="text-xs text-slate-400 font-normal mt-0.5">
              Annual paid leave allowances under this calendar
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded-sm">
            Total {totalQuota} Days
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-3 rounded-lg border border-slate-200/70 bg-slate-50/50 space-y-0.5">
            <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
              Paid Leave (PL)
            </span>
            <p className="text-xl font-semibold text-slate-900 tabular-nums">
              {leavePolicy.pl || 12} <span className="text-xs font-normal text-slate-400">Days</span>
            </p>
            <p className="text-[11px] text-slate-500 font-normal">Privilege leave per annum</p>
          </div>

          <div className="p-3 rounded-lg border border-slate-200/70 bg-slate-50/50 space-y-0.5">
            <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
              Casual Leave (CL)
            </span>
            <p className="text-xl font-semibold text-slate-900 tabular-nums">
              {leavePolicy.cl || 8} <span className="text-xs font-normal text-slate-400">Days</span>
            </p>
            <p className="text-[11px] text-slate-500 font-normal">Unplanned personal allowance</p>
          </div>

          <div className="p-3 rounded-lg border border-slate-200/70 bg-slate-50/50 space-y-0.5">
            <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
              Sick Leave (SL)
            </span>
            <p className="text-xl font-semibold text-slate-900 tabular-nums">
              {leavePolicy.sl || 8} <span className="text-xs font-normal text-slate-400">Days</span>
            </p>
            <p className="text-[11px] text-slate-500 font-normal">Medical recuperation allowance</p>
          </div>
        </div>
      </div>

      {/* Calendar Governance */}
      <div className="bg-white rounded-xl border border-slate-200/70 p-4 shadow-2xs space-y-3">
        <h3 className="text-xs font-semibold text-slate-900">Calendar Governance</h3>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg bg-slate-50/60 border border-slate-200/60">
          <div className="flex items-start gap-2.5">
            {calendar.is_active ? (
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="text-xs font-medium text-slate-900">
                {calendar.is_active ? "Active Company-Wide Calendar" : "Inactive Calendar"}
              </p>
              <p className="text-xs text-slate-400 font-normal mt-0.5">
                {calendar.is_active
                  ? "All company leave balances and attendance policies are synchronized with this calendar."
                  : "Saved as draft or archive. Activate to enforce company-wide."}
              </p>
            </div>
          </div>

          {!calendar.is_active && (
            <button
              onClick={onActivate}
              disabled={isActivating}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50 shrink-0 shadow-2xs"
            >
              <Check className="w-3.5 h-3.5" />
              Activate Now
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/* ==========================================================================
   MODAL: Quick Add Holiday (Minimal Dialog)
   ========================================================================== */
const QuickAddHolidayModal = ({ isOpen, onClose, onAddHoliday }) => {
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [type, setType] = useState('PUBLIC');
  const [isPaid, setIsPaid] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter a holiday title');
      return;
    }
    if (!date) {
      toast.error('Please select a valid date');
      return;
    }
    onAddHoliday({
      id: `h-custom-${Date.now()}`,
      holiday_name: name.trim(),
      holiday_date: date,
      holiday_type: type,
      is_paid: isPaid
    });
    setName('');
    setDate('');
    setType('PUBLIC');
    setIsPaid(true);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-3.5 h-3.5 text-slate-700" />
            <h3 className="text-xs font-semibold text-slate-900">Add Company Holiday</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3.5">
          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">Holiday Title *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Foundation Day"
              className="w-full px-2.5 py-1.5 text-xs font-normal border border-slate-200 rounded-lg focus:ring-1 focus:ring-slate-800"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">Holiday Date *</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs font-normal border border-slate-200 rounded-lg focus:ring-1 focus:ring-slate-800"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">Category</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs font-normal border border-slate-200 rounded-lg focus:ring-1 focus:ring-slate-800"
              >
                {HOLIDAY_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">Compensation</label>
              <label className="flex items-center gap-2 h-[34px] px-2.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 cursor-pointer bg-slate-50/50 hover:bg-slate-100 transition-colors">
                <input
                  type="checkbox"
                  checked={isPaid}
                  onChange={(e) => setIsPaid(e.target.checked)}
                  className="rounded-sm border-slate-300 text-slate-900 focus:ring-slate-800"
                />
                Paid Leave
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3.5 py-1.5 text-xs font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors shadow-2xs"
            >
              Add Holiday
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ==========================================================================
   MODAL: Full Calendar Form (Create & Edit)
   ========================================================================== */
const CalendarFormModal = ({ isOpen, calendar, onClose, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    calendar_name: "",
    year: 2026,
    is_active: false,
    pl: 12,
    cl: 8,
    sl: 8,
    weekly_offs: [{ day_of_week: 0, off_type: "FULL" }],
    holidays: DEFAULT_2026_HOLIDAYS
  });

  const [activeFormTab, setActiveFormTab] = useState('basic');
  const [newHoliday, setNewHoliday] = useState({
    holiday_name: '',
    holiday_date: '',
    holiday_type: 'PUBLIC',
    is_paid: true
  });

  useEffect(() => {
    if (calendar) {
      setFormData({
        calendar_name: calendar.calendar_name || "",
        year: calendar.year || 2026,
        is_active: calendar.is_active || false,
        pl: calendar.leave_policy?.pl ?? 12,
        cl: calendar.leave_policy?.cl ?? 8,
        sl: calendar.leave_policy?.sl ?? 8,
        weekly_offs: calendar.weekly_offs || [{ day_of_week: 0, off_type: "FULL" }],
        holidays: calendar.holidays || []
      });
    } else {
      setFormData({
        calendar_name: "2026 Official Calendar",
        year: 2026,
        is_active: true,
        pl: 12,
        cl: 8,
        sl: 8,
        weekly_offs: [{ day_of_week: 0, off_type: "FULL" }],
        holidays: DEFAULT_2026_HOLIDAYS
      });
    }
  }, [calendar, isOpen]);

  if (!isOpen) return null;

  const handleToggleWeeklyOff = (dayIndex) => {
    const exists = formData.weekly_offs.find(off => getDayIndex(off.day_of_week) === dayIndex);
    if (exists) {
      setFormData(prev => ({
        ...prev,
        weekly_offs: prev.weekly_offs.filter(off => getDayIndex(off.day_of_week) !== dayIndex)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        weekly_offs: [...prev.weekly_offs, { day_of_week: dayIndex, off_type: "FULL" }]
      }));
    }
  };

  const handleApplySchedulePreset = (type) => {
    if (type === '6day') {
      setFormData(prev => ({
        ...prev,
        weekly_offs: [{ day_of_week: 0, off_type: "FULL" }]
      }));
      toast.success("Applied 6-Day Work Week (Sunday Off)");
    } else if (type === '5day') {
      setFormData(prev => ({
        ...prev,
        weekly_offs: [
          { day_of_week: 0, off_type: "FULL" },
          { day_of_week: 6, off_type: "FULL" }
        ]
      }));
      toast.success("Applied 5-Day Work Week (Saturday & Sunday Off)");
    }
  };

  const handleAddHolidayInline = () => {
    if (!newHoliday.holiday_name.trim() || !newHoliday.holiday_date) {
      toast.error("Please fill in holiday title and date");
      return;
    }
    setFormData(prev => ({
      ...prev,
      holidays: [
        ...prev.holidays,
        {
          id: `h-${Date.now()}`,
          ...newHoliday,
          holiday_name: newHoliday.holiday_name.trim()
        }
      ]
    }));
    setNewHoliday({
      holiday_name: '',
      holiday_date: '',
      holiday_type: 'PUBLIC',
      is_paid: true
    });
  };

  const handleRemoveHoliday = (idx) => {
    setFormData(prev => ({
      ...prev,
      holidays: prev.holidays.filter((_, i) => i !== idx)
    }));
  };

  const handleLoadDefaults = () => {
    setFormData(prev => ({
      ...prev,
      holidays: DEFAULT_2026_HOLIDAYS
    }));
    toast.success("Loaded standard 2026 official holidays");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.calendar_name.trim()) {
      toast.error("Please specify calendar name");
      return;
    }
    if (!formData.year) {
      toast.error("Please specify calendar year");
      return;
    }

    const cleanedWeeklyOffs = formData.weekly_offs.map(off => ({
      ...off,
      day_of_week: getDayIndex(off.day_of_week)
    }));

    onSubmit({
      calendar_name: formData.calendar_name.trim(),
      year: parseInt(formData.year, 10),
      is_active: formData.is_active,
      pl: parseInt(formData.pl, 10),
      cl: parseInt(formData.cl, 10),
      sl: parseInt(formData.sl, 10),
      leave_policy: {
        pl: parseInt(formData.pl, 10),
        cl: parseInt(formData.cl, 10),
        sl: parseInt(formData.sl, 10)
      },
      weekly_offs: cleanedWeeklyOffs,
      holidays: formData.holidays
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="w-full max-w-xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/70 shrink-0">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              {calendar ? "Edit Office Calendar" : "Create New Office Calendar"}
            </h3>
            <p className="text-xs text-slate-400 font-normal">
              Working schedule, leave policy, and holiday calendar
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-sm text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Sub-tabs */}
        <div className="flex items-center gap-1.5 px-5 py-2 border-b border-slate-100 bg-slate-50/30 shrink-0 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveFormTab('basic')}
            className={`px-2.5 py-1 rounded-md transition-all ${
              activeFormTab === 'basic' ? 'bg-slate-900 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Basic & Policy
          </button>
          <button
            type="button"
            onClick={() => setActiveFormTab('weekly_offs')}
            className={`px-2.5 py-1 rounded-md transition-all ${
              activeFormTab === 'weekly_offs' ? 'bg-slate-900 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Weekly Offs ({formData.weekly_offs.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFormTab('holidays')}
            className={`px-2.5 py-1 rounded-md transition-all ${
              activeFormTab === 'holidays' ? 'bg-slate-900 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Holidays ({formData.holidays.length})
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto flex-1 space-y-4">
          {activeFormTab === 'basic' && (
            <div className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Calendar Title *</label>
                  <input
                    type="text"
                    value={formData.calendar_name}
                    onChange={(e) => setFormData(p => ({ ...p, calendar_name: e.target.value }))}
                    placeholder="e.g. 2026 Official Calendar"
                    className="w-full px-2.5 py-1.5 text-xs font-normal border border-slate-200 rounded-lg focus:ring-1 focus:ring-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Year *</label>
                  <input
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData(p => ({ ...p, year: parseInt(e.target.value, 10) }))}
                    className="w-full px-2.5 py-1.5 text-xs font-normal border border-slate-200 rounded-lg focus:ring-1 focus:ring-slate-800"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200/70">
                <div>
                  <p className="text-xs font-medium text-slate-900">Set as Company-Wide Active</p>
                  <p className="text-[11px] text-slate-400 font-normal">Attendance and leave policies sync to this calendar.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData(p => ({ ...p, is_active: !p.is_active }))}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    formData.is_active ? 'bg-slate-900' : 'bg-slate-300'
                  }`}
                >
                  <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                    formData.is_active ? 'translate-x-4' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>

              <div className="pt-1">
                <h4 className="text-[11px] font-medium uppercase tracking-wider text-slate-400 mb-2">Annual Leave Entitlement (Days)</h4>
                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-medium text-slate-500 mb-1">Paid Leave (PL)</label>
                    <input
                      type="number"
                      value={formData.pl}
                      onChange={(e) => setFormData(p => ({ ...p, pl: e.target.value }))}
                      min="0"
                      className="w-full px-2 py-1.5 text-xs font-normal border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-slate-500 mb-1">Casual Leave (CL)</label>
                    <input
                      type="number"
                      value={formData.cl}
                      onChange={(e) => setFormData(p => ({ ...p, cl: e.target.value }))}
                      min="0"
                      className="w-full px-2 py-1.5 text-xs font-normal border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-slate-500 mb-1">Sick Leave (SL)</label>
                    <input
                      type="number"
                      value={formData.sl}
                      onChange={(e) => setFormData(p => ({ ...p, sl: e.target.value }))}
                      min="0"
                      className="w-full px-2 py-1.5 text-xs font-normal border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeFormTab === 'weekly_offs' && (
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500 font-normal">
                  Select off days or apply a standard template:
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleApplySchedulePreset('6day')}
                    className="text-[11px] font-medium text-slate-700 hover:underline"
                  >
                    6-Day (Sun Off)
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={() => handleApplySchedulePreset('5day')}
                    className="text-[11px] font-medium text-slate-700 hover:underline"
                  >
                    5-Day (Sat & Sun Off)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {WEEK_DAYS.map((day) => {
                  const isOff = formData.weekly_offs.some(off => getDayIndex(off.day_of_week) === day.index);
                  return (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => handleToggleWeeklyOff(day.index)}
                      className={`p-2.5 rounded-lg border text-center transition-all ${
                        isOff
                          ? 'bg-slate-900 border-slate-900 text-white shadow-2xs'
                          : 'bg-slate-50/70 border-slate-200/70 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <p className="text-xs font-medium">{day.label}</p>
                      <p className={`text-[10px] mt-0.5 font-normal ${isOff ? 'text-slate-300' : 'text-slate-400'}`}>
                        {isOff ? 'Full Off' : 'Work Day'}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {activeFormTab === 'holidays' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-slate-700">
                  Holidays ({formData.holidays.length})
                </p>
                <button
                  type="button"
                  onClick={handleLoadDefaults}
                  className="text-[11px] font-medium text-slate-600 hover:underline"
                >
                  Load 2026 Presets
                </button>
              </div>

              {/* Add holiday mini bar */}
              <div className="p-3 bg-slate-50/70 rounded-lg border border-slate-200/70 space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Holiday name"
                    value={newHoliday.holiday_name}
                    onChange={(e) => setNewHoliday(p => ({ ...p, holiday_name: e.target.value }))}
                    className="px-2 py-1.5 text-xs font-normal border border-slate-200 rounded-md"
                  />
                  <input
                    type="date"
                    value={newHoliday.holiday_date}
                    onChange={(e) => setNewHoliday(p => ({ ...p, holiday_date: e.target.value }))}
                    className="px-2 py-1.5 text-xs font-normal border border-slate-200 rounded-md"
                  />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <select
                    value={newHoliday.holiday_type}
                    onChange={(e) => setNewHoliday(p => ({ ...p, holiday_type: e.target.value }))}
                    className="px-2 py-1 text-xs font-normal border border-slate-200 rounded-md flex-1"
                  >
                    {HOLIDAY_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                  <label className="flex items-center gap-1.5 text-xs font-normal text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newHoliday.is_paid}
                      onChange={(e) => setNewHoliday(p => ({ ...p, is_paid: e.target.checked }))}
                    />
                    Paid
                  </label>
                  <button
                    type="button"
                    onClick={handleAddHolidayInline}
                    className="px-2.5 py-1 bg-slate-900 text-white rounded-md text-xs font-medium hover:bg-slate-800 transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Existing holidays list */}
              <div className="max-h-44 overflow-y-auto space-y-1 divide-y divide-slate-100">
                {formData.holidays.map((h, i) => (
                  <div key={i} className="flex items-center justify-between pt-1 text-xs">
                    <div>
                      <span className="font-medium text-slate-800">{h.holiday_name}</span>
                      <span className="text-slate-400 ml-1.5 font-normal">({h.holiday_date} • {h.holiday_type})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveHoliday(i)}
                      className="text-rose-500 hover:text-rose-700 p-0.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-1.5 text-xs font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 shadow-2xs"
            >
              {isLoading ? "Saving..." : calendar ? "Update Calendar" : "Save Calendar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ==========================================================================
   MAIN PAGE COMPONENT: OfficeCalendar (Simple, Modern, Minimal)
   ========================================================================== */
const OfficeCalendar = () => {
  const [selectedCalendar, setSelectedCalendar] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 0, 1));
  const [activeTab, setActiveTab] = useState('month_grid');
  const [calendarSearch, setCalendarSearch] = useState('');

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingCalendar, setEditingCalendar] = useState(null);
  const [isQuickAddModalOpen, setIsQuickAddModalOpen] = useState(false);

  // Queries & Mutations
  const { data: rawCalendars, isLoading } = useCalendars();
  const createMutation = useCreateCalendar();
  const updateMutation = useUpdateCalendar();
  const deleteMutation = useDeleteCalendar();
  const activateMutation = useActivateCalendar();

  const calendars = (Array.isArray(rawCalendars) && rawCalendars.length > 0)
    ? rawCalendars
    : SAMPLE_CALENDARS;

  // Initialize selected calendar
  useEffect(() => {
    if (calendars.length > 0) {
      if (!selectedCalendar || !calendars.some(c => c.id === selectedCalendar.id)) {
        const active = calendars.find(c => c.is_active) || calendars[0];
        setSelectedCalendar(active);
        if (active?.year) {
          const now = new Date();
          const targetYear = active.year;
          if (now.getFullYear() === targetYear) {
            setCurrentMonth(now);
          } else {
            setCurrentMonth(new Date(targetYear, 0, 1));
          }
        }
      }
    }
  }, [calendars, selectedCalendar]);

  // Filtered calendars in sidebar
  const filteredCalendars = useMemo(() => {
    return calendars.filter(c =>
      (c.calendar_name || '').toLowerCase().includes(calendarSearch.toLowerCase()) ||
      String(c.year || '').includes(calendarSearch)
    );
  }, [calendars, calendarSearch]);

  const activeCalendar = calendars.find(c => c.is_active) || selectedCalendar || calendars[0];
  const holidays = selectedCalendar?.holidays || [];
  const weeklyOffs = selectedCalendar?.weekly_offs || [];
  const leavePolicy = selectedCalendar?.leave_policy || { pl: 12, cl: 8, sl: 8 };

  const paidHolidaysCount = holidays.filter(h => h.is_paid).length;
  const nextHoliday = useMemo(() => {
    const today = new Date();
    return holidays
      .filter(h => {
        const d = parseLocalDate(h.holiday_date);
        return d && d >= today;
      })
      .sort((a, b) => (parseLocalDate(a.holiday_date)?.getTime() || 0) - (parseLocalDate(b.holiday_date)?.getTime() || 0))[0] || holidays[0];
  }, [holidays]);

  const weeklyOffsSummary = useMemo(() => {
    if (!weeklyOffs.length) return "No weekly offs";
    return weeklyOffs.map(off => `${getDayLabel(off.day_of_week)} (${off.off_type === 'FULL' ? 'Full' : 'Half'})`).join(', ');
  }, [weeklyOffs]);

  // Calendar CRUD Handlers
  const handleCreate = async (data) => {
    try {
      await createMutation.mutateAsync(data);
      toast.success("Calendar created");
      setIsFormModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create calendar");
    }
  };

  const handleUpdate = async (data) => {
    try {
      await updateMutation.mutateAsync({
        id: editingCalendar.id,
        data: data
      });
      toast.success("Calendar updated");
      setIsFormModalOpen(false);
      setEditingCalendar(null);
      setSelectedCalendar(prev => ({ ...prev, ...data }));
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update calendar");
    }
  };

  const handleDeleteCalendar = async (id) => {
    if (window.confirm("Delete this calendar?")) {
      try {
        await deleteMutation.mutateAsync(id);
        toast.success("Calendar deleted");
        if (selectedCalendar?.id === id) {
          setSelectedCalendar(null);
        }
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to delete calendar");
      }
    }
  };

  const handleActivateCalendar = async (id) => {
    try {
      await activateMutation.mutateAsync(id);
      toast.success("Calendar activated");
      setSelectedCalendar(prev => ({ ...prev, is_active: true }));
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to activate calendar");
    }
  };

  // Quick holiday actions
  const handleQuickAddHoliday = async (newHol) => {
    if (!selectedCalendar) return;
    const updatedHolidays = [...(selectedCalendar.holidays || []), newHol];
    const updated = {
      ...selectedCalendar,
      holidays: updatedHolidays
    };
    try {
      await updateMutation.mutateAsync({
        id: selectedCalendar.id,
        data: updated
      });
      setSelectedCalendar(updated);
      toast.success(`Added ${newHol.holiday_name}`);
    } catch (err) {
      setSelectedCalendar(updated);
      toast.success(`Added ${newHol.holiday_name}`);
    }
  };

  const handleDeleteHoliday = async (hol) => {
    if (!window.confirm(`Delete holiday "${hol.holiday_name}"?`)) return;
    if (!selectedCalendar) return;
    const updatedHolidays = (selectedCalendar.holidays || []).filter(h =>
      (h.id && hol.id) ? h.id !== hol.id : h.holiday_name !== hol.holiday_name
    );
    const updated = {
      ...selectedCalendar,
      holidays: updatedHolidays
    };
    try {
      await updateMutation.mutateAsync({
        id: selectedCalendar.id,
        data: updated
      });
      setSelectedCalendar(updated);
      toast.success(`Deleted ${hol.holiday_name}`);
    } catch (err) {
      setSelectedCalendar(updated);
      toast.success(`Deleted ${hol.holiday_name}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-80 space-y-2.5">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-slate-800" />
        <p className="text-xs font-normal text-slate-400">Loading Office Calendar...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-10 print:p-0 print:space-y-2">
      {/* ── Top Header & Actions ── */}
      <div className="border-b border-slate-200/70 pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400 mb-0.5">
            Workplace
          </p>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">
            Office Calendar
          </h1>
          <p className="text-xs font-normal text-slate-500 mt-0.5">
            Configure yearly calendars, company holidays, and weekly off policies
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
            title="Print Calendar"
          >
            <Printer className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Print</span>
          </button>

          <button
            onClick={() => setIsQuickAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200/80 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-800 hover:bg-emerald-100/80 transition-colors shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-700" />
            <span>Add Holiday</span>
          </button>

          <button
            onClick={() => {
              setEditingCalendar(null);
              setIsFormModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-slate-800 shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2]" />
            New Calendar
          </button>
        </div>
      </div>

      {/* ── Top Executive Summary Metric Tiles ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 print:hidden">
        <StatCard
          icon={CalendarIcon}
          label="Active Calendar"
          value={activeCalendar?.year || 2026}
          caption={activeCalendar?.calendar_name || "Official Calendar"}
          subCaption="Active"
          accent="slate"
        />
        <StatCard
          icon={Sparkles}
          label="Official Holidays"
          value={holidays.length}
          caption={`${paidHolidaysCount} Paid Holidays`}
          subCaption={nextHoliday ? `Next: ${nextHoliday.holiday_name}` : 'None'}
          accent="brass"
        />
        <StatCard
          icon={Coffee}
          label="Weekly Off Schedule"
          value={`${weeklyOffs.length} Day/Wk`}
          caption={weeklyOffsSummary}
          subCaption="Regular Off"
          accent="emerald"
        />
        <StatCard
          icon={Briefcase}
          label="Annual Leave Quota"
          value={`${(leavePolicy.pl || 12) + (leavePolicy.cl || 8) + (leavePolicy.sl || 8)} Days`}
          caption={`PL: ${leavePolicy.pl || 12}d • CL: ${leavePolicy.cl || 8}d • SL: ${leavePolicy.sl || 8}d`}
          subCaption="Annual Quota"
          accent="blue"
        />
      </div>

      {/* ── Master-Detail Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Calendar List */}
        <div className="lg:col-span-4 space-y-3 print:hidden">
          <div className="bg-white rounded-xl border border-slate-200/70 shadow-2xs overflow-hidden">
            <div className="p-3.5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-semibold text-slate-900">
                  Calendars ({calendars.length})
                </h3>
                <p className="text-[11px] text-slate-400 font-normal">
                  Select a calendar to inspect details
                </p>
              </div>
            </div>

            {/* Quick Search */}
            {calendars.length > 2 && (
              <div className="p-2.5 border-b border-slate-100 bg-slate-50/40">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={calendarSearch}
                    onChange={(e) => setCalendarSearch(e.target.value)}
                    placeholder="Search calendar..."
                    className="w-full pl-8 pr-2.5 py-1 text-xs font-normal bg-white border border-slate-200 rounded-md focus:ring-1 focus:ring-slate-800 placeholder:text-slate-400"
                  />
                </div>
              </div>
            )}

            {/* Calendar cards */}
            <div className="divide-y divide-slate-100 max-h-[480px] overflow-y-auto">
              {filteredCalendars.map((cal) => {
                const isSelected = selectedCalendar?.id === cal.id;
                return (
                  <div
                    key={cal.id}
                    onClick={() => {
                      setSelectedCalendar(cal);
                      if (cal.year) {
                        setCurrentMonth(new Date(cal.year, 0, 1));
                      }
                    }}
                    className={`p-3.5 cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-slate-50/80 border-l-2 border-slate-900"
                        : "hover:bg-slate-50/50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-900 tabular-nums">
                            {cal.year}
                          </span>
                          {cal.is_active ? (
                            <span className="inline-flex items-center px-1.5 py-0.2 rounded-sm text-[10px] font-medium bg-emerald-50 text-emerald-700">
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-1.5 py-0.2 rounded-sm text-[10px] font-medium bg-slate-100 text-slate-500">
                              Archive
                            </span>
                          )}
                        </div>
                        <h4 className="text-xs font-medium text-slate-700 truncate">
                          {cal.calendar_name}
                        </h4>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingCalendar(cal);
                            setIsFormModalOpen(true);
                          }}
                          className="p-1 rounded-sm text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCalendar(cal.id);
                          }}
                          className="p-1 rounded-sm text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-2.5 pt-2 border-t border-slate-100 text-center">
                      <div className="bg-slate-50 rounded-sm p-1">
                        <p className="text-xs font-medium text-slate-800 tabular-nums">
                          {cal.weekly_offs?.length || 0}
                        </p>
                        <p className="text-[10px] font-normal text-slate-400">Weekly Offs</p>
                      </div>
                      <div className="bg-slate-50 rounded-sm p-1">
                        <p className="text-xs font-medium text-slate-800 tabular-nums">
                          {cal.holidays?.length || 0}
                        </p>
                        <p className="text-[10px] font-normal text-slate-400">Holidays</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-2.5 border-t border-slate-100 bg-slate-50/30">
              <button
                onClick={() => {
                  setEditingCalendar(null);
                  setIsFormModalOpen(true);
                }}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 border border-dashed border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:border-slate-400 hover:text-slate-800 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Calendar
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Main Calendar Workspace */}
        <div className="lg:col-span-8 space-y-4">
          {selectedCalendar ? (
            <div className="space-y-4">
              {/* Header Bar */}
              <div className="bg-white rounded-xl border border-slate-200/70 p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-semibold text-slate-900 tracking-tight">
                      {selectedCalendar.calendar_name}
                    </h2>
                    <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-sm ${
                      selectedCalendar.is_active
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-500"
                    }`}>
                      {selectedCalendar.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-normal mt-0.5">
                    Year: {selectedCalendar.year} • {holidays.length} Holidays • {weeklyOffs.length} Weekly Offs
                  </p>
                </div>

                {/* Tab Switcher */}
                <div className="flex items-center rounded-lg bg-slate-100 p-0.5 border border-slate-200/60">
                  <button
                    onClick={() => setActiveTab('month_grid')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                      activeTab === 'month_grid'
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <CalendarDays className="w-3.5 h-3.5" />
                    Month Grid
                  </button>
                  <button
                    onClick={() => setActiveTab('agenda')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                      activeTab === 'agenda'
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Tag className="w-3.5 h-3.5" />
                    Holidays ({holidays.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('policies')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                      activeTab === 'policies'
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    Policies
                  </button>
                </div>
              </div>

              {/* Tab Contents */}
              {activeTab === 'month_grid' && (
                <MonthCalendarView
                  calendar={selectedCalendar}
                  currentMonth={currentMonth}
                  onMonthChange={setCurrentMonth}
                />
              )}

              {activeTab === 'agenda' && (
                <HolidaysAgendaView
                  holidays={holidays}
                  onDeleteHoliday={handleDeleteHoliday}
                  onOpenAddModal={() => setIsQuickAddModalOpen(true)}
                />
              )}

              {activeTab === 'policies' && (
                <PolicyScheduleView
                  calendar={selectedCalendar}
                  onActivate={() => handleActivateCalendar(selectedCalendar.id)}
                  isActivating={activateMutation.isPending}
                />
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200/70 p-10 text-center shadow-2xs">
              <CalendarIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-slate-800">No Calendar Selected</h3>
              <p className="text-xs text-slate-400 mt-0.5 max-w-sm mx-auto font-normal">
                Choose a calendar from the left or create a new one.
              </p>
              <button
                onClick={() => {
                  setEditingCalendar(null);
                  setIsFormModalOpen(true);
                }}
                className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-medium hover:bg-slate-800 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                New Calendar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Modals ── */}
      <CalendarFormModal
        isOpen={isFormModalOpen}
        calendar={editingCalendar}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingCalendar(null);
        }}
        onSubmit={editingCalendar ? handleUpdate : handleCreate}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <QuickAddHolidayModal
        isOpen={isQuickAddModalOpen}
        onClose={() => setIsQuickAddModalOpen(false)}
        onAddHoliday={handleQuickAddHoliday}
      />
    </div>
  );
};

export default OfficeCalendar;
