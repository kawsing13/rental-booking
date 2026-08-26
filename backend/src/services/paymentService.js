const env = require('../config/env');
const logger = require('../utils/logger');

// Every payment method implements the same tiny interface: charge(amount, meta)
// -> { status, referenceNo }. Controllers/other services never branch on
// `method` themselves - they just call paymentService.charge(method, ...).
// That makes adding a 6th payment method a one-line registration below,
// and swapping a mock adapter for a real one a one-file change.

// Cash handled at delivery/pickup time by staff - nothing to charge online,
// the booking is simply marked payment-pending until staff collects it.
function cashAdapter() {
  return async () => ({ status: 'pending', referenceNo: null });
}

// Bank transfer: customer sends money manually and later provides a
// reference number that an admin verifies. Starts pending; an admin marks
// it paid via PUT /payments/:id/confirm.
function bankTransferAdapter() {
  return async ({ referenceNo }) => ({ status: 'pending', referenceNo: referenceNo || null });
}

// GCash / Maya: in a real deployment this would call the provider's REST
// API (e.g. PayMongo, Xendit, or the wallet's direct merchant API) using
// GCASH_API_KEY / MAYA_API_KEY from env, then return their charge id.
// No credentials were provided for this build, so PAYMENTS_MOCK_MODE=true
// simulates an immediate successful charge - this keeps the rest of the
// booking/payment flow (receipts, balance tracking) fully testable.
// TODO(production): replace the mock branch with a real HTTP call once API
// keys are available, keeping the same return shape.
function walletAdapter(providerName, apiKey) {
  return async ({ amount, bookingReference }) => {
    if (env.payments.mockMode || !apiKey) {
      logger.info(`[${providerName} MOCK] charging PHP ${amount} for ${bookingReference}`);
      return {
        status: 'paid',
        referenceNo: `MOCK-${providerName.toUpperCase()}-${Date.now()}`,
      };
    }

    // TODO(production): real API call using `apiKey` goes here.
    throw new Error(`${providerName} live integration is not configured yet`);
  };
}

const adapters = {
  cod: cashAdapter(),
  pickup_cash: cashAdapter(),
  bank_transfer: bankTransferAdapter(),
  gcash: walletAdapter('gcash', env.payments.gcashApiKey),
  maya: walletAdapter('maya', env.payments.mayaApiKey),
};

async function charge(method, meta) {
  const adapter = adapters[method];
  if (!adapter) {
    throw new Error(`Unsupported payment method: ${method}`);
  }
  return adapter(meta);
}

module.exports = { charge };
