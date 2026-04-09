import { describe, expect, it } from 'vitest';
import { computeTaxSnapshot, type TaxCalculationInputs } from '../taxSnapshot';

function emptyHomeOffice() {
  return {
    officeLength: '',
    officeWidth: '',
    homeSquareFeet: '',
    mortgagePayment: '',
    propertyTaxes: '',
    homeInsurance: '',
    utilities: '',
    internet: '',
  };
}

function baseInput(overrides: Partial<TaxCalculationInputs> = {}): TaxCalculationInputs {
  return {
    income: '',
    expenses: [{ id: 1, description: '', amount: '' }],
    filingStatus: 'single',
    dependents: '0',
    retirementContribution: '',
    useHomeOffice: false,
    homeOffice: emptyHomeOffice(),
    ...overrides,
  };
}

describe('computeTaxSnapshot', () => {
  it('returns the same snapshot for identical inputs (deterministic)', () => {
    const fixtures: TaxCalculationInputs[] = [
      baseInput(),
      baseInput({ income: '75000', filingStatus: 'married' }),
      baseInput({
        income: '92000',
        expenses: [
          { id: 1, description: 'Software', amount: '2400' },
          { id: 2, description: 'Travel', amount: '1800' },
        ],
        retirementContribution: '6500',
        dependents: '1',
      }),
      baseInput({
        income: '110000',
        filingStatus: 'married',
        useHomeOffice: true,
        homeOffice: {
          officeLength: '12',
          officeWidth: '14',
          homeSquareFeet: '2200',
          mortgagePayment: '2100',
          propertyTaxes: '9000',
          homeInsurance: '1400',
          utilities: '3000',
          internet: '720',
        },
      }),
    ];

    for (const input of fixtures) {
      const a = computeTaxSnapshot(input);
      const b = computeTaxSnapshot(input);
      expect(a).toEqual(b);
    }
  });

  it('zero income and expenses yields zero tax and zero effective rate', () => {
    const s = computeTaxSnapshot(baseInput());
    expect(s.grossIncome).toBe(0);
    expect(s.scheduleCNetProfit).toBe(0);
    expect(s.totalTax).toBe(0);
    expect(s.effectiveRate).toBe(0);
    expect(s.quarterlyPayment).toBe(0);
  });

  it('matches expected figures for a simple single filer with wage-like profit', () => {
    const s = computeTaxSnapshot(baseInput({ income: '50000' }));
    expect(s.grossIncome).toBe(50000);
    expect(s.scheduleCNetProfit).toBe(50000);
    expect(s.seTax).toBeCloseTo(7064.775, 3);
    expect(s.federalTaxBeforeChildCredit).toBeCloseTo(2422.3908, 3);
    expect(s.federalTax).toBeCloseTo(2422.3908, 3);
    expect(s.njTax).toBeCloseTo(1074.835590625, 3);
    expect(s.totalTax).toBeCloseTo(10562.001390625, 3);
    expect(s.effectiveRate).toBeCloseTo(21.12400278125, 5);
    expect(s.netAfterTax).toBeCloseTo(39437.998609375, 3);
    expect(s.quarterlyPayment).toBeCloseTo(2640.50034765625, 3);
  });

  it('matches expected figures for married filing jointly', () => {
    const s = computeTaxSnapshot(baseInput({ income: '80000', filingStatus: 'married' }));
    expect(s.standardDeduction).toBe(30000);
    expect(s.seTax).toBeCloseTo(11303.64, 2);
    expect(s.federalTax).toBeCloseTo(3060.42528, 2);
    expect(s.njTax).toBeCloseTo(2615.236945, 2);
  });

  it('applies expenses and child tax credit', () => {
    const s = computeTaxSnapshot(
      baseInput({
        income: '80000',
        dependents: '2',
      }),
    );
    expect(s.scheduleCNetProfit).toBe(80000);
    expect(s.childTaxCredit).toBeGreaterThan(0);
    expect(s.federalTax).toBeLessThan(s.federalTaxBeforeChildCredit);
  });

  it('includes home office allocation when enabled and dimensions are valid', () => {
    const s = computeTaxSnapshot(
      baseInput({
        income: '90000',
        useHomeOffice: true,
        homeOffice: {
          officeLength: '10',
          officeWidth: '10',
          homeSquareFeet: '2000',
          mortgagePayment: '2000',
          propertyTaxes: '8000',
          homeInsurance: '1200',
          utilities: '2400',
          internet: '600',
        },
      }),
    );
    expect(s.businessUsePercent).toBeCloseTo(5, 5);
    expect(s.homeOfficeDeduction).toBeGreaterThan(0);
    expect(s.scheduleCNetProfit).toBeLessThan(90000);
  });
});
