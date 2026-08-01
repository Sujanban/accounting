import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon, Cross2Icon } from "@radix-ui/react-icons";
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  adToBsDate,
  BS_MONTHS,
  BS_WEEKDAYS,
  bsToAdDate,
  daysInBsMonth,
  firstWeekdayOfBsMonth,
  formatAdDate,
  formatBsDate,
  isBsDateInRange,
  MAX_BS_YEAR,
  MIN_BS_YEAR,
  parseBsDate,
  type BsDate,
} from "../../lib/nepali-date";

type NepaliDatePickerProps = {
  value: string;
  onChange: (value: string) => void;
  name?: string;
  id?: string;
  min?: string;
  max?: string;
  required?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
  placeholder?: string;
};

const years = Array.from({ length: MAX_BS_YEAR - MIN_BS_YEAR + 1 }, (_, index) => MIN_BS_YEAR + index);

function fallbackView(): BsDate {
  return adToBsDate(formatAdDate(new Date())) ?? { year: MAX_BS_YEAR, month: 0, day: 1 };
}

export function NepaliDatePicker({
  value,
  onChange,
  name,
  id,
  min,
  max,
  required = false,
  disabled = false,
  ariaLabel = "Choose Nepali date",
  placeholder = "Select BS date",
}: NepaliDatePickerProps) {
  const generatedId = useId();
  const controlId = id ?? generatedId;
  const rootRef = useRef<HTMLDivElement>(null);
  const controlRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const selected = useMemo(() => parseBsDate(value), [value]);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<BsDate>(() => selected ?? fallbackView());
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0, width: 336 });

  useEffect(() => {
    if (selected) setView(selected);
  }, [selected]);

  useEffect(() => {
    if (!open) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!rootRef.current?.contains(target) && !popoverRef.current?.contains(target)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  useLayoutEffect(() => {
    if (!open) return;

    const updatePosition = () => {
      const control = controlRef.current;
      if (!control) return;
      const rect = control.getBoundingClientRect();
      const viewportPadding = 16;
      const gap = 8;
      const width = Math.min(336, window.innerWidth - viewportPadding * 2);
      const height = popoverRef.current?.offsetHeight ?? 390;
      const left = Math.min(Math.max(rect.left, viewportPadding), window.innerWidth - width - viewportPadding);
      const fitsBelow = window.innerHeight - rect.bottom >= height + gap + viewportPadding;
      const preferredTop = fitsBelow || rect.top < height + gap + viewportPadding
        ? rect.bottom + gap
        : rect.top - height - gap;
      const top = Math.min(Math.max(preferredTop, viewportPadding), window.innerHeight - height - viewportPadding);
      setPopoverPosition({ top, left, width });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, view.month, view.year]);

  const moveMonth = (offset: number) => {
    const monthIndex = view.year * 12 + view.month + offset;
    const nextYear = Math.floor(monthIndex / 12);
    const nextMonth = monthIndex % 12;
    if (nextYear < MIN_BS_YEAR || nextYear > MAX_BS_YEAR) return;
    setView({ year: nextYear, month: nextMonth, day: 1 });
  };

  const selectDay = (day: number) => {
    const bsDate = formatBsDate({ year: view.year, month: view.month, day });
    if (!bsToAdDate({ year: view.year, month: view.month, day }) || !isBsDateInRange(bsDate, min, max)) return;
    onChange(bsDate);
    setOpen(false);
  };

  const todayAd = formatAdDate(new Date());
  const todayBs = adToBsDate(todayAd);
  const todayBsValue = todayBs ? formatBsDate(todayBs) : "";
  const monthLength = daysInBsMonth(view.year, view.month);
  const leadingDays = firstWeekdayOfBsMonth(view.year, view.month);

  return (
    <div className={`nepali-date-picker${open ? " is-open" : ""}`} ref={rootRef}>
      {name ? <input type="hidden" name={name} value={value} /> : null}
      <button
        ref={controlRef}
        id={controlId}
        className="nepali-date-picker__control"
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-required={required}
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
      >
        <span className={selected ? undefined : "nepali-date-picker__placeholder"}>
          {selected ? `${formatBsDate(selected)} BS` : placeholder}
        </span>
        <CalendarIcon aria-hidden="true" />
      </button>

      {open ? createPortal(
        <div
          className="nepali-date-picker__popover"
          ref={popoverRef}
          role="dialog"
          aria-label="Bikram Sambat calendar"
          style={popoverPosition}
        >
          <div className="nepali-date-picker__header">
            <button type="button" onClick={() => moveMonth(-1)} disabled={view.year === MIN_BS_YEAR && view.month === 0} aria-label="Previous month">
              <ChevronLeftIcon aria-hidden="true" />
            </button>
            <div className="nepali-date-picker__selectors">
              <select aria-label="BS month" value={view.month} onChange={(event) => setView({ ...view, month: Number(event.target.value), day: 1 })}>
                {BS_MONTHS.map((month, index) => <option value={index} key={month}>{month}</option>)}
              </select>
              <select aria-label="BS year" value={view.year} onChange={(event) => setView({ ...view, year: Number(event.target.value), day: 1 })}>
                {years.map((year) => <option value={year} key={year}>{year}</option>)}
              </select>
            </div>
            <button type="button" onClick={() => moveMonth(1)} disabled={view.year === MAX_BS_YEAR && view.month === 11} aria-label="Next month">
              <ChevronRightIcon aria-hidden="true" />
            </button>
          </div>

          <div className="nepali-date-picker__weekdays" aria-hidden="true">
            {BS_WEEKDAYS.map((weekday) => <span key={weekday}>{weekday}</span>)}
          </div>
          <div className="nepali-date-picker__days" role="grid" aria-label={`${BS_MONTHS[view.month]} ${view.year}`}>
            {Array.from({ length: leadingDays }, (_, index) => <span key={`empty-${index}`} />)}
            {Array.from({ length: monthLength }, (_, index) => {
              const day = index + 1;
              const date = { year: view.year, month: view.month, day };
              const adDate = bsToAdDate(date);
              const isSelected = selected?.year === view.year && selected.month === view.month && selected.day === day;
              const isToday = todayBs?.year === view.year && todayBs.month === view.month && todayBs.day === day;
              const bsDate = formatBsDate(date);
              const unavailable = !adDate || !isBsDateInRange(bsDate, min, max);
              return (
                <button
                  type="button"
                  role="gridcell"
                  key={day}
                  className={[isSelected ? "is-selected" : "", isToday ? "is-today" : ""].filter(Boolean).join(" ")}
                  disabled={unavailable}
                  aria-label={`${BS_MONTHS[view.month]} ${day}, ${view.year} BS${adDate ? `, ${adDate} AD` : ""}`}
                  aria-selected={isSelected}
                  onClick={() => selectDay(day)}
                >
                  {day}
                </button>
              );
            })}
          </div>

          <div className="nepali-date-picker__footer">
            {!required && value ? (
              <button type="button" onClick={() => { onChange(""); setOpen(false); }}>
                <Cross2Icon aria-hidden="true" /> Clear
              </button>
            ) : <span />}
            <button type="button" disabled={!todayBs || !isBsDateInRange(todayBsValue, min, max)} onClick={() => { onChange(todayBsValue); setOpen(false); }}>
              Today
            </button>
          </div>
        </div>,
        document.body,
      ) : null}
    </div>
  );
}
