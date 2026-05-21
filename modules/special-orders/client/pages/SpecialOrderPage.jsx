import { useState, useEffect } from 'react';
import StepFulfillment, { getNextBusinessDate } from '../components/StepFulfillment.jsx';
import StepQuantity from '../components/StepQuantity.jsx';
import VariationBuilder from '../components/VariationBuilder.jsx';
import StepCustomerInfo from '../components/StepCustomerInfo.jsx';
import OrderReview from '../components/OrderReview.jsx';
import { api } from '../utils.js';

const TOTAL_STEPS = 5;

function newVariation() {
  return { baseRecipeOptionId: '', frostingOptionId: '', fillingOptionId: '', toppingOptionIds: [], quantity: 1, isAssorted: false };
}

export default function SpecialOrderPage({ cancelled }) {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [configError, setConfigError] = useState(null);

  // Step state
  const [step, setStep] = useState(1);

  // Step 1: Fulfillment
  const [fulfillmentType, setFulfillmentType] = useState('store-early');
  const [scheduledDate, setScheduledDate] = useState('');

  // Step 2: Quantity
  const [totalQuantity, setTotalQuantity] = useState(1);

  // Step 3: Variations
  const [variations, setVariations] = useState([newVariation()]);

  // Step 4: Customer info
  const [customerForm, setCustomerForm] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    deliveryAddress: { street: '', city: '', state: 'TN', zip: '' },
  });

  // Step 5: Checkout
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Address verification
  const [addrVerifying, setAddrVerifying] = useState(false);
  const [addrWarning, setAddrWarning] = useState(null); // { message, suggestedTier }

  useEffect(() => {
    api('/special-orders/api/config')
      .then((data) => {
        setConfig(data.config);
        // Default to next available date based on store hours + cutoff
        setScheduledDate(getNextBusinessDate(data.config?.orderCutoffHour ?? 17, data.config?.storeHours ?? []));
      })
      .catch((err) => setConfigError(err.message))
      .finally(() => setLoading(false));
  }, []);

  function handleFulfillmentChange(field, value) {
    if (field === 'fulfillmentType') setFulfillmentType(value);
    if (field === 'scheduledDate') setScheduledDate(value);
  }

  function canAdvance() {
    if (step === 1) {
      if (!fulfillmentType || !scheduledDate) return false;
      // Block if selected date is a closed day
      const storeHours = config?.storeHours ?? [];
      if (storeHours.length > 0) {
        const d = new Date(scheduledDate + 'T12:00:00');
        const entry = storeHours.find((h) => h.day === d.getDay());
        if (entry && !entry.isOpen) return false;
      }
      return true;
    }
    if (step === 2) return totalQuantity >= 1;
    if (step === 3) {
      const assignedQty = variations.reduce((s, v) => s + (Number(v.quantity) || 1), 0);
      const allFilled = variations.every((v) => {
        if (v.isAssorted) return true;
        if (!v.baseRecipeOptionId || !v.frostingOptionId) return false;
        // If selected base requires a filling, fillingOptionId must be set
        const baseOption = config?.availableBaseRecipes?.find((o) => o._id === v.baseRecipeOptionId);
        if (baseOption?.isFilled && !v.fillingOptionId) return false;
        return true;
      });
      return assignedQty === totalQuantity && allFilled;
    }
    if (step === 4) {
      if (!customerForm.customerName) return false;
      const isDelivery = ['in-city', 'outside-city', 'outside-county'].includes(fulfillmentType);
      if (isDelivery && (!customerForm.deliveryAddress?.street || !customerForm.deliveryAddress?.city)) return false;
      return true;
    }
    return true;
  }

  async function nextStep() {
    if (!canAdvance()) return;

    // Step 4 → 5: verify delivery address tier before proceeding
    const isDelivery = ['in-city', 'outside-city', 'outside-county'].includes(fulfillmentType);
    if (step === 4 && isDelivery) {
      setAddrVerifying(true);
      setAddrWarning(null);
      try {
        const result = await api('/special-orders/api/verify-address', {
          address: customerForm.deliveryAddress,
          fulfillmentType,
        });
        if (result.verified && result.mismatch) {
          setAddrWarning({ message: result.message, suggestedTier: result.suggestedTier });
          setAddrVerifying(false);
          return; // Stay on step 4, show warning
        }
      } catch {
        // Verification failed (network, unconfigured store address, etc.) — allow through
      }
      setAddrVerifying(false);
    }

    setAddrWarning(null);
    setStep((s) => Math.min(TOTAL_STEPS, s + 1));
  }

  function proceedDespiteWarning() {
    setAddrWarning(null);
    setStep((s) => Math.min(TOTAL_STEPS, s + 1));
  }

  function prevStep() {
    setAddrWarning(null);
    setStep((s) => Math.max(1, s - 1));
  }

  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const payload = {
        customerName: customerForm.customerName,
        customerEmail: customerForm.customerEmail || undefined,
        customerPhone: customerForm.customerPhone || undefined,
        fulfillmentType,
        scheduledDate,
        deliveryAddress: customerForm.deliveryAddress,
        totalQuantity,
        variations,
      };
      const result = await api('/special-orders/api/order', payload);
      window.location.href = result.checkoutUrl;
    } catch (err) {
      setSubmitError(err.message);
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="so-loading">
        <div className="spinner-border" role="status" />
        <span>Loading…</span>
      </div>
    );
  }

  if (configError) {
    return (
      <div className="so-error">
        <p>Unable to load order options. Please try again later.</p>
        <p className="text-muted">{configError}</p>
      </div>
    );
  }

  const stepLabels = ['Fulfillment', 'Quantity', 'Build Order', 'Your Info', 'Review'];

  return (
    <div className="so-page">
      {cancelled && <div className="alert alert-warning">Your checkout was cancelled. You can review your order and try again.</div>}

      {/* Progress stepper */}
      <div className="so-stepper">
        {stepLabels.map((label, i) => (
          <div key={i} className={`so-stepper-step${step === i + 1 ? ' active' : step > i + 1 ? ' done' : ''}`}>
            <div className="so-stepper-dot">{step > i + 1 ? '✓' : i + 1}</div>
            <div className="so-stepper-label">{label}</div>
          </div>
        ))}
      </div>

      {/* Step content */}
      {step === 1 && <StepFulfillment fulfillmentType={fulfillmentType} scheduledDate={scheduledDate} onChange={handleFulfillmentChange} cutoffHour={config?.orderCutoffHour ?? 17} storeHours={config?.storeHours ?? []} />}
      {step === 2 && <StepQuantity totalQuantity={totalQuantity} onChange={(_, val) => setTotalQuantity(val)} />}
      {step === 3 && <VariationBuilder variations={variations} totalQuantity={totalQuantity} config={config} onChange={setVariations} />}
      {step === 4 && <StepCustomerInfo form={customerForm} onChange={setCustomerForm} fulfillmentType={fulfillmentType} />}
      {step === 5 && <OrderReview form={{ ...customerForm, fulfillmentType, scheduledDate }} variations={variations} config={config} onSubmit={handleSubmit} submitting={submitting} error={submitError} />}

      {/* Address tier mismatch warning */}
      {addrWarning && (
        <div className="alert alert-warning mt-3" role="alert">
          <strong>Delivery Zone Mismatch</strong>
          <p className="mb-2 mt-1">{addrWarning.message}</p>
          <div className="d-flex gap-2">
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={() => {
                setAddrWarning(null);
                setStep(1);
              }}
            >
              ← Change Fulfillment Type
            </button>
            <button type="button" className="btn btn-sm btn-warning" onClick={proceedDespiteWarning}>
              Proceed Anyway
            </button>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="so-nav-btns">
        {step > 1 && (
          <button type="button" className="btn btn-outline-secondary" onClick={prevStep} disabled={submitting || addrVerifying}>
            ← Back
          </button>
        )}
        {step < TOTAL_STEPS && !addrWarning && (
          <button type="button" className="btn btn-primary ms-auto" onClick={nextStep} disabled={!canAdvance() || addrVerifying}>
            {addrVerifying ? 'Verifying address…' : 'Continue →'}
          </button>
        )}
      </div>
    </div>
  );
}
