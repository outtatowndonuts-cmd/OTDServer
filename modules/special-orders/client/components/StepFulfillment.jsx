import { useState, useMemo } from 'react';
import { FULFILLMENT_LABELS } from '../utils.js';

const FULFILLMENT_OPTIONS = [
  {
    value: 'store-early',
    label: 'Store Pickup — 5:30 to 7:30 AM',
    description: 'Pick up your order at the store during the early morning window.',
    isDelivery: false,
  },
  {
    value: 'store-mid',
    label: 'Store Pickup — 9:00 to 10:00 AM',
    description: 'Pick up your order at the store during the mid-morning window.',
    isDelivery: false,
  },
  {
    value: 'in-city',
    label: 'Home Delivery — Inside City Limits',
    description: 'Delivery within city limits. Deliveries begin at 8:00 AM.',
    isDelivery: true,
  },
  {
    value: 'outside-city',
    label: 'Home Delivery — Outside City / Inside County',
    description: 'Delivery outside city limits but within Cannon County. Flat delivery fee applies.',
    isDelivery: true,
  },
  {
    value: 'outside-county',
    label: 'Home Delivery — Outside Cannon County',
    description: 'Delivery outside Cannon County. Fee calculated per mile from the store.',
    isDelivery: true,
  },
];

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Returns true if the given day number (0=Sun) is open per storeHours config.
 * Falls back to Mon-Fri if storeHours is empty.
 */
function isDayOpen(dayNum, storeHours) {
  if (!storeHours || storeHours.length === 0) {
    return dayNum >= 1 && dayNum <= 5; // Mon-Fri fallback
  }
  const entry = storeHours.find((h) => h.day === dayNum);
  return entry ? entry.isOpen : false;
}

/**
 * Returns the next available date string (YYYY-MM-DD) that is:
 * - At least tomorrow
 * - If past today's cutoff hour, at least the day after tomorrow
 * - On an open day per storeHours
 */
export function getNextBusinessDate(cutoffHour = 17, storeHours = []) {
  const now = new Date();
  const candidate = new Date(now);
  // Always start at tomorrow minimum
  candidate.setDate(candidate.getDate() + 1);
  // If past today's cutoff, the day after tomorrow is the earliest
  if (now.getHours() >= cutoffHour) {
    candidate.setDate(candidate.getDate() + 1);
  }
  // Advance until we land on an open day (max 14 day search to avoid infinite loop)
  for (let i = 0; i < 14; i++) {
    if (isDayOpen(candidate.getDay(), storeHours)) break;
    candidate.setDate(candidate.getDate() + 1);
  }
  return candidate.toISOString().slice(0, 10);
}

export default function StepFulfillment({ fulfillmentType, scheduledDate, onChange, cutoffHour, storeHours }) {
  const minDate = getNextBusinessDate(cutoffHour, storeHours);

  const selectedDayOpen = useMemo(() => {
    if (!scheduledDate) return true;
    const d = new Date(scheduledDate + 'T12:00:00');
    return isDayOpen(d.getDay(), storeHours);
  }, [scheduledDate, storeHours]);

  const selectedDayName = useMemo(() => {
    if (!scheduledDate) return '';
    const d = new Date(scheduledDate + 'T12:00:00');
    return DAY_NAMES[d.getDay()];
  }, [scheduledDate]);

  return (
    <div className="so-step">
      <h2 className="so-step-title">Step 1: Choose Fulfillment</h2>
      <p className="so-step-hint">
        Orders must be placed by{' '}
        <strong>
          {cutoffHour % 12 || 12}:00 {cutoffHour < 12 ? 'AM' : 'PM'}
        </strong>{' '}
        the day before your scheduled date. All orders are filled fresh the next morning.
      </p>

      <div className="so-fulfillment-options">
        {FULFILLMENT_OPTIONS.map((opt) => (
          <label key={opt.value} className={`so-fulfillment-card${fulfillmentType === opt.value ? ' selected' : ''}`}>
            <input type="radio" name="fulfillmentType" value={opt.value} checked={fulfillmentType === opt.value} onChange={() => onChange('fulfillmentType', opt.value)} />
            <div className="so-fulfillment-card-body">
              <div className="so-fulfillment-card-label">{opt.label}</div>
              <div className="so-fulfillment-card-desc">{opt.description}</div>
            </div>
          </label>
        ))}
      </div>

      <div className="so-field mt-4">
        <label className="so-label" htmlFor="scheduledDate">
          Scheduled Date <span className="text-danger">*</span>
        </label>
        <input id="scheduledDate" type="date" className="form-control so-date-input" min={minDate} value={scheduledDate} onChange={(e) => onChange('scheduledDate', e.target.value)} />
        <div className="so-field-hint">Select the date you want to pick up or receive your order.</div>
        {scheduledDate && !selectedDayOpen && (
          <div className="alert alert-warning mt-2" role="alert">
            <strong>{selectedDayName}</strong> is not a regular operating day. Please choose a different date.
          </div>
        )}
      </div>
    </div>
  );
}
