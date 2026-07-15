export const STAGES = {
  PENDING_ENGG: 'Pending with Engg',
  PENDING_COSTING: 'Pending with Costing',
  SALES_TO_QUOTE: 'Sales to Quote',
  PENDING_SALES: 'Pending with Sales',
  QUOTE_SUBMITTED: 'Quote Submitted',
  ON_HOLD: 'On Hold',
  OPEN_L1: 'Open - L1',
  WON: 'Won',
  LOST: 'Lost',
  REGRETTED: 'Regretted',
  QUOTE_REGRETTED: 'Quote Regretted',
};

export const PIPELINE_ORDER = [
  STAGES.PENDING_ENGG,
  STAGES.PENDING_COSTING,
  STAGES.SALES_TO_QUOTE,
  STAGES.PENDING_SALES,
  STAGES.QUOTE_SUBMITTED,
];
