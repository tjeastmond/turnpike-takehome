export type FilingStatus = 'single' | 'married';

export type Expense = {
  id: number;
  description: string;
  amount: string;
};

export type HomeOfficeInputs = {
  officeLength: string;
  officeWidth: string;
  homeSquareFeet: string;
  mortgagePayment: string;
  propertyTaxes: string;
  homeInsurance: string;
  utilities: string;
  internet: string;
};

export type TaxCalculationInputs = {
  income: string;
  expenses: Expense[];
  filingStatus: FilingStatus;
  dependents: string;
  retirementContribution: string;
  useHomeOffice: boolean;
  homeOffice: HomeOfficeInputs;
};

export type TaxCalculationSnapshot = {
  grossIncome: number;
  totalExpenses: number;
  homeOfficeDeduction: number;
  businessUsePercent: number;
  scheduleCNetProfit: number;
  retirementAmount: number;
  seTax: number;
  seDeduction: number;
  qbiDeduction: number;
  childTaxCredit: number;
  federalTax: number;
  federalTaxBeforeChildCredit: number;
  njTax: number;
  totalTax: number;
  effectiveRate: number;
  netAfterTax: number;
  quarterlyPayment: number;
  standardDeduction: number;
  adjustedGrossIncome: number;
  taxableIncome: number;
};

export function computeTaxSnapshot(p: TaxCalculationInputs): TaxCalculationSnapshot {
  const { income, expenses, filingStatus, dependents, retirementContribution, useHomeOffice, homeOffice } = p;

  const grossIncome = parseFloat(income) || 0;
  const totalExpenses = expenses.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0);
  const retirementAmount = parseFloat(retirementContribution) || 0;

  let homeOfficeDeduction = 0;
  let businessUsePercent = 0;

  if (useHomeOffice) {
    const officeLength = parseFloat(homeOffice.officeLength) || 0;
    const officeWidth = parseFloat(homeOffice.officeWidth) || 0;
    const homeSize = parseFloat(homeOffice.homeSquareFeet) || 0;
    const officeSqFt = officeLength * officeWidth;

    if (homeSize > 0 && officeSqFt > 0) {
      businessUsePercent = (officeSqFt / homeSize) * 100;
      const ratio = officeSqFt / homeSize;
      const mortgage = ((parseFloat(homeOffice.mortgagePayment) || 0) * 12 * 0.70) * ratio;
      const propTax = (parseFloat(homeOffice.propertyTaxes) || 0) * ratio;
      const insurance = (parseFloat(homeOffice.homeInsurance) || 0) * ratio;
      const utilities = (parseFloat(homeOffice.utilities) || 0) * ratio;
      const internet = (parseFloat(homeOffice.internet) || 0) * ratio;
      homeOfficeDeduction = mortgage + propTax + insurance + utilities + internet;
    }
  }

  const scheduleCNetProfit = Math.max(0, grossIncome - totalExpenses - homeOfficeDeduction);
  const seTaxBase = scheduleCNetProfit * 0.9235;
  const ssTax = Math.min(seTaxBase, 168600) * 0.124;
  const medicareTax = seTaxBase * 0.029;
  const additionalMedicareThreshold = filingStatus === 'single' ? 200000 : 250000;
  const additionalMedicareTax = Math.max(0, seTaxBase - additionalMedicareThreshold) * 0.009;
  const seTax = ssTax + medicareTax + additionalMedicareTax;
  const seDeduction = (ssTax + medicareTax) * 0.5;
  const adjustedGrossIncome = scheduleCNetProfit - seDeduction - retirementAmount;
  const qbiBase = Math.max(0, scheduleCNetProfit - seDeduction - retirementAmount);
  const qbiDeduction = qbiBase * 0.20;
  const standardDeduction = filingStatus === 'single' ? 15000 : 30000;
  const taxableIncomeBeforeQBI = Math.max(0, adjustedGrossIncome - standardDeduction);
  const taxableIncome = Math.max(0, taxableIncomeBeforeQBI - qbiDeduction);

  let federalTax = 0;
  if (filingStatus === 'single') {
    if (taxableIncome > 609350) federalTax = 183647.50 + (taxableIncome - 609350) * 0.37;
    else if (taxableIncome > 243725) federalTax = 52832.75 + (taxableIncome - 243725) * 0.35;
    else if (taxableIncome > 191950) federalTax = 42323 + (taxableIncome - 191950) * 0.32;
    else if (taxableIncome > 100525) federalTax = 20247 + (taxableIncome - 100525) * 0.24;
    else if (taxableIncome > 47150) federalTax = 5426 + (taxableIncome - 47150) * 0.22;
    else if (taxableIncome > 11925) federalTax = 1192.50 + (taxableIncome - 11925) * 0.12;
    else federalTax = taxableIncome * 0.10;
  } else {
    if (taxableIncome > 731200) federalTax = 220525.50 + (taxableIncome - 731200) * 0.37;
    else if (taxableIncome > 487450) federalTax = 135210.50 + (taxableIncome - 487450) * 0.35;
    else if (taxableIncome > 383900) federalTax = 101978 + (taxableIncome - 383900) * 0.32;
    else if (taxableIncome > 201050) federalTax = 40494 + (taxableIncome - 201050) * 0.24;
    else if (taxableIncome > 94300) federalTax = 10852 + (taxableIncome - 94300) * 0.22;
    else if (taxableIncome > 23850) federalTax = 2385 + (taxableIncome - 23850) * 0.12;
    else federalTax = taxableIncome * 0.10;
  }

  const federalTaxBeforeChildCredit = federalTax;
  const numDependents = parseInt(dependents) || 0;
  const childTaxCredit = Math.min(numDependents * 2000, federalTax);
  federalTax = Math.max(0, federalTax - childTaxCredit);

  const njAGI = scheduleCNetProfit - seDeduction - retirementAmount;
  let njTax = 0;
  if (njAGI > 1000000) njTax = 58472.50 + (njAGI - 1000000) * 0.1075;
  else if (njAGI > 500000) njTax = 27597.50 + (njAGI - 500000) * 0.0897;
  else if (njAGI > 75000) njTax = 2651.25 + (njAGI - 75000) * 0.0637;
  else if (njAGI > 40000) njTax = 717.50 + (njAGI - 40000) * 0.05525;
  else if (njAGI > 35000) njTax = 542.50 + (njAGI - 35000) * 0.035;
  else if (njAGI > 20000) njTax = 280.00 + (njAGI - 20000) * 0.0175;
  else njTax = Math.max(0, njAGI) * 0.014;

  const totalTax = seTax + federalTax + njTax;
  const effectiveRate = scheduleCNetProfit > 0 ? (totalTax / scheduleCNetProfit) * 100 : 0;
  const netAfterTax = scheduleCNetProfit - totalTax;

  return {
    grossIncome,
    totalExpenses,
    homeOfficeDeduction,
    businessUsePercent,
    scheduleCNetProfit,
    retirementAmount,
    seTax,
    seDeduction,
    qbiDeduction,
    childTaxCredit,
    federalTax,
    federalTaxBeforeChildCredit,
    njTax,
    totalTax,
    effectiveRate,
    netAfterTax,
    quarterlyPayment: totalTax / 4,
    standardDeduction,
    adjustedGrossIncome,
    taxableIncome,
  };
}
