import React, { useState, useMemo, useEffect, useRef } from 'react';
import { DollarSign, Plus, X, Save, RefreshCw, Download, Upload } from 'lucide-react';

type FilingStatus = 'single' | 'married';

type ExpenseField = 'description' | 'amount';

type Expense = {
  id: number;
  description: string;
  amount: string;
};

type HomeOfficeInputs = {
  officeLength: string;
  officeWidth: string;
  homeSquareFeet: string;
  mortgagePayment: string;
  propertyTaxes: string;
  homeInsurance: string;
  utilities: string;
  internet: string;
};

export default function TaxCalculator() {
  const [income, setIncome] = useState('');
  const [expenses, setExpenses] = useState<Expense[]>([{ id: 1, description: '', amount: '' }]);
  const [filingStatus, setFilingStatus] = useState<FilingStatus>('single');
  const [dependents, setDependents] = useState('0');
  const [retirementContribution, setRetirementContribution] = useState('');
  const [useHomeOffice, setUseHomeOffice] = useState(false);
  const [homeOffice, setHomeOffice] = useState<HomeOfficeInputs>({
    officeLength: '', officeWidth: '', homeSquareFeet: '',
    mortgagePayment: '', propertyTaxes: '', homeInsurance: '',
    utilities: '', internet: ''
  });
  const [saveMessage, setSaveMessage] = useState('');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  useEffect(() => {
    const savedData = localStorage.getItem('taxCalculatorData');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setIncome(parsed.income || '');
        setExpenses(parsed.expenses || [{ id: 1, description: '', amount: '' }]);
        setFilingStatus(parsed.filingStatus || 'single');
        setDependents(parsed.dependents || '0');
        setRetirementContribution(parsed.retirementContribution || '');
        setUseHomeOffice(parsed.useHomeOffice || false);
        setHomeOffice(parsed.homeOffice || homeOffice);
      } catch (e) {
        console.error('Error loading saved data:', e);
      }
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (showExportMenu && (!target || !target.closest('.export-dropdown'))) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showExportMenu]);

  useEffect(() => {
    const dataToSave = { income, expenses, filingStatus, dependents, retirementContribution, useHomeOffice, homeOffice };
    localStorage.setItem('taxCalculatorData', JSON.stringify(dataToSave));
  }, [income, expenses, filingStatus, dependents, retirementContribution, useHomeOffice, homeOffice]);

  const saveProgress = () => {
    setSaveMessage('Progress saved!');
    setTimeout(() => setSaveMessage(''), 2000);
  };

  const clearAndReset = () => {
    if (window.confirm('Are you sure you want to clear all data and start a new session?')) {
      setIncome(''); setExpenses([{ id: 1, description: '', amount: '' }]);
      setFilingStatus('single'); setDependents('0'); setRetirementContribution('');
      setUseHomeOffice(false);
      setHomeOffice({ officeLength: '', officeWidth: '', homeSquareFeet: '', mortgagePayment: '', propertyTaxes: '', homeInsurance: '', utilities: '', internet: '' });
      localStorage.removeItem('taxCalculatorData');
      setSaveMessage('New session started!');
      setTimeout(() => setSaveMessage(''), 2000);
    }
  };

  const addExpense = () => setExpenses([...expenses, { id: Date.now(), description: '', amount: '' }]);
  const removeExpense = (id: number) => { if (expenses.length > 1) setExpenses(expenses.filter(exp => exp.id !== id)); };
  const updateExpense = (id: number, field: ExpenseField, value: string) => setExpenses(expenses.map(exp => exp.id === id ? { ...exp, [field]: value } : exp));

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent<HTMLElement>, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newExpenses = [...expenses];
    const draggedItem = newExpenses[draggedIndex];
    newExpenses.splice(draggedIndex, 1);
    newExpenses.splice(index, 0, draggedItem);

    setExpenses(newExpenses);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const importFromJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') throw new Error('Invalid file contents');
        const jsonData: any = JSON.parse(text);

        if (!jsonData.inputs || !jsonData.calculations) {
          alert('Invalid file format. Please select a JSON file exported from this calculator.');
          return;
        }

        if (jsonData.inputs.filingStatus) {
          setFilingStatus(jsonData.inputs.filingStatus === 'Single' ? 'single' : 'married');
        }

        if (jsonData.inputs.qualifyingChildren !== undefined) {
          setDependents(jsonData.inputs.qualifyingChildren.toString());
        }

        if (jsonData.inputs.income !== undefined) {
          setIncome(jsonData.inputs.income.toString());
        }

        if (jsonData.inputs.expenses && Array.isArray(jsonData.inputs.expenses)) {
          const importedExpenses: Expense[] = jsonData.inputs.expenses.map((exp: any, idx: number) => ({
            id: Date.now() + idx,
            description: exp.description || '',
            amount: exp.amount ? exp.amount.toString() : ''
          }));
          setExpenses(importedExpenses.length > 0 ? importedExpenses : [{ id: Date.now(), description: '', amount: '' }]);
        }

        if (jsonData.inputs.retirementContributions !== undefined) {
          setRetirementContribution(jsonData.inputs.retirementContributions.toString());
        }

        if (jsonData.inputs.homeOffice) {
          if (jsonData.inputs.homeOffice.enabled) {
            setUseHomeOffice(true);
            setHomeOffice({
              officeLength: jsonData.inputs.homeOffice.officeLength?.toString() || '',
              officeWidth: jsonData.inputs.homeOffice.officeWidth?.toString() || '',
              homeSquareFeet: jsonData.inputs.homeOffice.homeSquareFeet?.toString() || '',
              mortgagePayment: homeOffice.mortgagePayment || '',
              propertyTaxes: homeOffice.propertyTaxes || '',
              homeInsurance: homeOffice.homeInsurance || '',
              utilities: homeOffice.utilities || '',
              internet: homeOffice.internet || ''
            });
          } else {
            setUseHomeOffice(false);
          }
        }

        setSaveMessage('File imported successfully!');
        setTimeout(() => setSaveMessage(''), 3000);

        event.target.value = '';
      } catch (error) {
        console.error('Import error:', error);
        alert('Error importing file. Please make sure it is a valid JSON file exported from this calculator.');
      }
    };

    reader.readAsText(file);
  };

  const exportToCSV = () => {
    const csvData = [
      ['Field', 'Value'],
      ['Filing Status', filingStatus === 'single' ? 'Single' : 'Married Filing Jointly'],
      ['Qualifying Children', dependents],
      ['Total 1099 Income', calculations.grossIncome],
      ['Business Expenses', calculations.totalExpenses],
      ['Home Office Deduction', calculations.homeOfficeDeduction],
      ['Retirement Contributions', calculations.retirementAmount],
      ['Schedule C Net Profit', calculations.scheduleCNetProfit],
      ['Self-Employment Tax', calculations.seTax],
      ['SE Tax Deduction (50%)', calculations.seDeduction],
      ['QBI Deduction (20%)', calculations.qbiDeduction],
      ['Child Tax Credit', calculations.childTaxCredit],
      ['Federal Income Tax', calculations.federalTax],
      ['NJ State Tax', calculations.njTax],
      ['Total Tax Liability', calculations.totalTax],
      ['Effective Tax Rate (%)', calculations.effectiveRate.toFixed(2)],
      ['Net After Tax', calculations.netAfterTax],
      ['Quarterly Payment (Est.)', calculations.quarterlyPayment]
    ];

    const csv = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tax-calculation-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportToJSON = () => {
    const jsonData = {
      metadata: {
        exportDate: new Date().toISOString(),
        taxYear: 2025
      },
      inputs: {
        filingStatus: filingStatus === 'single' ? 'Single' : 'Married Filing Jointly',
        qualifyingChildren: parseInt(dependents) || 0,
        income: calculations.grossIncome,
        expenses: expenses.map(e => ({ description: e.description, amount: parseFloat(e.amount) || 0 })),
        retirementContributions: calculations.retirementAmount,
        homeOffice: useHomeOffice ? {
          enabled: true,
          officeLength: parseFloat(homeOffice.officeLength) || 0,
          officeWidth: parseFloat(homeOffice.officeWidth) || 0,
          homeSquareFeet: parseFloat(homeOffice.homeSquareFeet) || 0,
          businessUsePercent: calculations.businessUsePercent,
          deduction: calculations.homeOfficeDeduction
        } : { enabled: false }
      },
      calculations: {
        scheduleCNetProfit: calculations.scheduleCNetProfit,
        selfEmploymentTax: calculations.seTax,
        seDeduction: calculations.seDeduction,
        qbiDeduction: calculations.qbiDeduction,
        childTaxCredit: calculations.childTaxCredit,
        federalIncomeTax: calculations.federalTax,
        njStateTax: calculations.njTax,
        totalTax: calculations.totalTax,
        effectiveRate: parseFloat(calculations.effectiveRate.toFixed(2)),
        netAfterTax: calculations.netAfterTax,
        quarterlyPayment: calculations.quarterlyPayment
      }
    };

    const json = JSON.stringify(jsonData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tax-calculation-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportToTXT = () => {
    const expenseList = expenses.map((e, i) => `   ${i + 1}. ${e.description || 'Unnamed'}: ${parseFloat(e.amount) || 0}`).join('\n');

    const txt = `
═══════════════════════════════════════════════════════════════
           NJ 1099 TAX CALCULATOR - 2025 TAX SUMMARY
═══════════════════════════════════════════════════════════════
Generated: ${new Date().toLocaleString()}

FILING INFORMATION
──────────────────────────────────────────────────────────────
Filing Status:           ${filingStatus === 'single' ? 'Single' : 'Married Filing Jointly'}
Qualifying Children:     ${dependents}

INCOME & EXPENSES
──────────────────────────────────────────────────────────────
Total 1099 Income:       ${formatCurrency(calculations.grossIncome)}

Business Expenses:       ${formatCurrency(calculations.totalExpenses)}
${expenseList}

${calculations.homeOfficeDeduction > 0 ? `Home Office Deduction:   ${formatCurrency(calculations.homeOfficeDeduction)}
   Business Use:         ${calculations.businessUsePercent.toFixed(2)}%
   Office Space:         ${parseFloat(homeOffice.officeLength) || 0} ft × ${parseFloat(homeOffice.officeWidth) || 0} ft
   Total Home:           ${parseFloat(homeOffice.homeSquareFeet) || 0} sq ft

` : ''}Schedule C Net Profit:   ${formatCurrency(calculations.scheduleCNetProfit)}

TAX CALCULATIONS EXPLAINED
──────────────────────────────────────────────────────────────

1. SELF-EMPLOYMENT TAX
   The self-employment tax covers Social Security and Medicare.
   As a 1099 contractor, you pay both the employer and employee
   portions (15.3% total).

   Calculation:
   • SE Tax Base = Net Profit × 92.35% = ${formatCurrency(calculations.scheduleCNetProfit * 0.9235)}
   • Social Security (12.4%) + Medicare (2.9%) = 15.3%
   • Self-Employment Tax = ${formatCurrency(calculations.seTax)}

   Deduction:
   • You can deduct 50% of SE tax from income
   • SE Tax Deduction (50%) = ${formatCurrency(calculations.seDeduction)}

2. QUALIFIED BUSINESS INCOME (QBI) DEDUCTION
   Section 199A allows you to deduct 20% of your qualified
   business income, reducing your taxable income.

   Calculation:
   • QBI Base = Net Profit - SE Deduction - Retirement
   • QBI Base = ${formatCurrency(calculations.scheduleCNetProfit - calculations.seDeduction - calculations.retirementAmount)}
   • QBI Deduction (20%) = ${formatCurrency(calculations.qbiDeduction)}

3. FEDERAL INCOME TAX
   Your federal tax is calculated using 2025 tax brackets after
   applying the standard deduction and QBI deduction.

   • Adjusted Gross Income = ${formatCurrency(calculations.scheduleCNetProfit - calculations.seDeduction - calculations.retirementAmount)}
   • Standard Deduction (${filingStatus === 'single' ? 'Single' : 'MFJ'}) = ${formatCurrency(calculations.standardDeduction)}
   • QBI Deduction = ${formatCurrency(calculations.qbiDeduction)}
   • Taxable Income = ${formatCurrency(Math.max(0, calculations.scheduleCNetProfit - calculations.seDeduction - calculations.retirementAmount - calculations.standardDeduction - calculations.qbiDeduction))}

   Federal Income Tax = ${formatCurrency(calculations.federalTax + calculations.childTaxCredit)}
   ${calculations.childTaxCredit > 0 ? `   Less: Child Tax Credit = -${formatCurrency(calculations.childTaxCredit)}` : ''}
   Final Federal Tax = ${formatCurrency(calculations.federalTax)}

4. NEW JERSEY STATE TAX
   NJ has progressive tax brackets from 1.4% to 10.75%.
   NJ allows the 50% SE tax deduction, matching federal treatment.

   • NJ Adjusted Gross Income = ${formatCurrency(calculations.scheduleCNetProfit - calculations.seDeduction - calculations.retirementAmount)}
   • NJ State Tax = ${formatCurrency(calculations.njTax)}

KEY DEDUCTIONS & CREDITS SUMMARY
──────────────────────────────────────────────────────────────
SE Tax Deduction (50%):      ${formatCurrency(calculations.seDeduction)}
${calculations.retirementAmount > 0 ? `Retirement Contributions:    ${formatCurrency(calculations.retirementAmount)}\n` : ''}Standard Deduction:          ${formatCurrency(calculations.standardDeduction)}
QBI Deduction (20%):         ${formatCurrency(calculations.qbiDeduction)}
${calculations.childTaxCredit > 0 ? `Child Tax Credit:            ${formatCurrency(calculations.childTaxCredit)}\n` : ''}
FINAL TAX SUMMARY
──────────────────────────────────────────────────────────────
Self-Employment Tax:         ${formatCurrency(calculations.seTax)}
Federal Income Tax:          ${formatCurrency(calculations.federalTax)}
NJ State Tax:                ${formatCurrency(calculations.njTax)}
                            ─────────────────────
TOTAL TAX LIABILITY:         ${formatCurrency(calculations.totalTax)}

Effective Tax Rate:          ${calculations.effectiveRate.toFixed(1)}% (of Schedule C Net Profit)
Net After Tax:               ${formatCurrency(calculations.netAfterTax)}

QUARTERLY ESTIMATED PAYMENTS
──────────────────────────────────────────────────────────────
Estimated Quarterly Payment: ${formatCurrency(calculations.quarterlyPayment)}

Payment Schedule:
• Q1 (Jan-Mar): Due April 15
• Q2 (Apr-May): Due June 15
• Q3 (Jun-Aug): Due September 15
• Q4 (Sep-Dec): Due January 15 (following year)

Note: This is a naive quarterly estimate (Total Tax ÷ 4).
Consider safe harbor rules (100% or 110% of prior year tax).

IMPORTANT NOTES
──────────────────────────────────────────────────────────────
• This calculator provides 2025 estimates with corrected
  calculations for Additional Medicare Tax (based on SE tax
  base), QBI deduction (20% of adjusted income), and accurate
  NJ tax brackets.

• Child Tax Credit shown is non-refundable portion only.
  Refundable portion and phaseouts not modeled.

• Social Security wage base limit: $168,600 (2025)

• Additional Medicare Tax (0.9%) applies above $200,000
  (single) or $250,000 (married).

• Home office deduction uses actual method (no depreciation).
  Mortgage interest estimated at 70% of payment.

DISCLAIMER
──────────────────────────────────────────────────────────────
This calculator is for estimation purposes only. Actual tax
liability may vary based on additional factors, credits, and
specific circumstances. Consult a qualified tax professional
for personalized advice.

═══════════════════════════════════════════════════════════════
`;

    const blob = new Blob([txt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tax-calculation-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const calculations = useMemo(() => {
    const grossIncome = parseFloat(income) || 0;
    const totalExpenses = expenses.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0);
    const retirementAmount = parseFloat(retirementContribution) || 0;

    let homeOfficeDeduction = 0, businessUsePercent = 0;

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
      grossIncome, totalExpenses, homeOfficeDeduction, businessUsePercent,
      scheduleCNetProfit, retirementAmount, seTax, seDeduction,
      qbiDeduction, childTaxCredit, federalTax, njTax, totalTax,
      effectiveRate, netAfterTax, quarterlyPayment: totalTax / 4, standardDeduction
    };
  }, [income, expenses, filingStatus, dependents, retirementContribution, useHomeOffice, homeOffice]);

  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-6 md:p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <DollarSign className="w-8 h-8 text-indigo-600" />
              <h1 className="text-3xl font-bold text-gray-800">NJ 1099 Tax Calculator</h1>
            </div>
            <div className="flex items-center gap-2">
              {saveMessage && <span className="text-sm text-green-600 font-medium mr-2">{saveMessage}</span>}
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={importFromJSON}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
              >
                <Upload className="w-4 h-4" />Import
              </button>
              <div className="relative export-dropdown">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm"
                >
                  <Download className="w-4 h-4" />Export
                </button>
                {showExportMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-10">
                    <button
                      onClick={(e) => { e.preventDefault(); exportToCSV(); setShowExportMenu(false); }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded-t-lg text-sm text-gray-700"
                    >
                      Export as CSV
                    </button>
                    <button
                      onClick={(e) => { e.preventDefault(); exportToJSON(); setShowExportMenu(false); }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-gray-700"
                    >
                      Export as JSON
                    </button>
                    <button
                      onClick={(e) => { e.preventDefault(); exportToTXT(); setShowExportMenu(false); }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded-b-lg text-sm text-gray-700"
                    >
                      Export as TXT
                    </button>
                  </div>
                )}
              </div>
              <button onClick={saveProgress} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm">
                <Save className="w-4 h-4" />Save
              </button>
              <button onClick={clearAndReset} className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition text-sm">
                <RefreshCw className="w-4 h-4" />New
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filing Status</label>
              <select value={filingStatus} onChange={(e) => setFilingStatus(e.target.value as FilingStatus)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                <option value="single">Single</option>
                <option value="married">Married Filing Jointly</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Qualifying Children</label>
              <input type="number" value={dependents} onChange={(e) => setDependents(e.target.value)} min="0" placeholder="0" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Total 1099 Income</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                <input type="number" value={income} onChange={(e) => setIncome(e.target.value)} placeholder="0" className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-medium text-gray-700">Business Expenses</label>
              <button onClick={addExpense} className="flex items-center gap-1 px-3 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm">
                <Plus className="w-4 h-4" />Add
              </button>
            </div>
            <div className="space-y-3">
              {expenses.map((expense) => (
                <div key={expense.id} className="flex gap-2">
                  <input type="text" value={expense.description} onChange={(e) => updateExpense(expense.id, 'description', e.target.value)} placeholder="Description" className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                  <div className="relative w-40">
                    <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                    <input type="number" value={expense.amount} onChange={(e) => updateExpense(expense.id, 'amount', e.target.value)} placeholder="0" className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <button onClick={() => removeExpense(expense.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" disabled={expenses.length === 1}>
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Retirement Contributions</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-500">$</span>
              <input type="number" value={retirementContribution} onChange={(e) => setRetirementContribution(e.target.value)} placeholder="0" className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>

          <div className="mt-6 border-t pt-6">
            <div className="flex items-center gap-2 mb-4">
              <input type="checkbox" id="useHomeOffice" checked={useHomeOffice} onChange={(e) => setUseHomeOffice(e.target.checked)} className="w-4 h-4 text-indigo-600 rounded" />
              <label htmlFor="useHomeOffice" className="text-sm font-medium text-gray-700">Home Office Deduction</label>
            </div>
            {useHomeOffice && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Office Length (ft)</label>
                      <input type="number" value={homeOffice.officeLength} onChange={(e) => setHomeOffice({...homeOffice, officeLength: e.target.value})} placeholder="18" className="w-full px-3 py-2 border rounded-lg text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Office Width (ft)</label>
                      <input type="number" value={homeOffice.officeWidth} onChange={(e) => setHomeOffice({...homeOffice, officeWidth: e.target.value})} placeholder="20" className="w-full px-3 py-2 border rounded-lg text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Total Home (sq ft)</label>
                    <input type="number" value={homeOffice.homeSquareFeet} onChange={(e) => setHomeOffice({...homeOffice, homeSquareFeet: e.target.value})} placeholder="1700" className="w-full px-3 py-2 border rounded-lg text-sm" />
                  </div>
                </div>
                {calculations.businessUsePercent > 0 && (
                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                    <p className="text-sm font-medium text-indigo-900">Business Use: {calculations.businessUsePercent.toFixed(2)}%</p>
                  </div>
                )}
                <div className="grid md:grid-cols-2 gap-4">
                  <div><label className="block text-xs font-medium text-gray-700 mb-1">Monthly Mortgage</label>
                    <div className="relative"><span className="absolute left-3 top-2 text-gray-500 text-sm">$</span>
                      <input type="number" value={homeOffice.mortgagePayment} onChange={(e) => setHomeOffice({...homeOffice, mortgagePayment: e.target.value})} placeholder="2600" className="w-full pl-8 pr-3 py-2 border rounded-lg text-sm" /></div></div>
                  <div><label className="block text-xs font-medium text-gray-700 mb-1">Annual Property Tax</label>
                    <div className="relative"><span className="absolute left-3 top-2 text-gray-500 text-sm">$</span>
                      <input type="number" value={homeOffice.propertyTaxes} onChange={(e) => setHomeOffice({...homeOffice, propertyTaxes: e.target.value})} placeholder="9000" className="w-full pl-8 pr-3 py-2 border rounded-lg text-sm" /></div></div>
                  <div><label className="block text-xs font-medium text-gray-700 mb-1">Annual Insurance</label>
                    <div className="relative"><span className="absolute left-3 top-2 text-gray-500 text-sm">$</span>
                      <input type="number" value={homeOffice.homeInsurance} onChange={(e) => setHomeOffice({...homeOffice, homeInsurance: e.target.value})} placeholder="1500" className="w-full pl-8 pr-3 py-2 border rounded-lg text-sm" /></div></div>
                  <div><label className="block text-xs font-medium text-gray-700 mb-1">Annual Utilities</label>
                    <div className="relative"><span className="absolute left-3 top-2 text-gray-500 text-sm">$</span>
                      <input type="number" value={homeOffice.utilities} onChange={(e) => setHomeOffice({...homeOffice, utilities: e.target.value})} placeholder="4200" className="w-full pl-8 pr-3 py-2 border rounded-lg text-sm" /></div></div>
                  <div><label className="block text-xs font-medium text-gray-700 mb-1">Annual Internet</label>
                    <div className="relative"><span className="absolute left-3 top-2 text-gray-500 text-sm">$</span>
                      <input type="number" value={homeOffice.internet} onChange={(e) => setHomeOffice({...homeOffice, internet: e.target.value})} placeholder="1200" className="w-full pl-8 pr-3 py-2 border rounded-lg text-sm" /></div></div>
                </div>
                {calculations.homeOfficeDeduction > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm font-semibold text-green-900">Deduction: {formatCurrency(calculations.homeOfficeDeduction)}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-xl p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Income</h2>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Gross</span>
                <span className="font-semibold">{formatCurrency(calculations.grossIncome)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Expenses</span>
                <span className="font-semibold text-red-600">-{formatCurrency(calculations.totalExpenses)}</span>
              </div>
              {calculations.homeOfficeDeduction > 0 && (
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Home Office</span>
                  <span className="font-semibold text-red-600">-{formatCurrency(calculations.homeOfficeDeduction)}</span>
                </div>
              )}
              <div className="flex justify-between py-2 border-t-2">
                <span className="font-medium">Net Profit</span>
                <span className="font-bold">{formatCurrency(calculations.scheduleCNetProfit)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-xl p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Deductions</h2>
            <div className="space-y-2">
              <div className="flex justify-between text-sm py-2 border-b">
                <span className="text-gray-600">SE Tax (50%)</span>
                <span className="font-medium text-green-600">-{formatCurrency(calculations.seDeduction)}</span>
              </div>
              <div className="flex justify-between text-sm py-2 border-b">
                <span className="text-gray-600">Retirement</span>
                <span className="font-medium text-green-600">-{formatCurrency(calculations.retirementAmount)}</span>
              </div>
              <div className="flex justify-between text-sm py-2 border-b">
                <span className="text-gray-600">Standard</span>
                <span className="font-medium text-green-600">-{formatCurrency(calculations.standardDeduction)}</span>
              </div>
              <div className="flex justify-between text-sm py-2 border-b">
                <span className="text-gray-600">QBI (20%)</span>
                <span className="font-medium text-green-600">-{formatCurrency(calculations.qbiDeduction)}</span>
              </div>
              {calculations.childTaxCredit > 0 && (
                <div className="flex justify-between text-sm py-2 border-b">
                  <span className="text-gray-600">Child Credit</span>
                  <span className="font-medium text-green-600">-{formatCurrency(calculations.childTaxCredit)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-xl p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Taxes</h2>
            <div className="space-y-2">
              <div className="flex justify-between text-sm py-2 border-b">
                <span className="text-gray-600">Self-Employment</span>
                <span className="font-medium">{formatCurrency(calculations.seTax)}</span>
              </div>
              <div className="flex justify-between text-sm py-2 border-b">
                <span className="text-gray-600">Federal Income</span>
                <span className="font-medium">{formatCurrency(calculations.federalTax)}</span>
              </div>
              <div className="flex justify-between text-sm py-2 border-b">
                <span className="text-gray-600">NJ State</span>
                <span className="font-medium">{formatCurrency(calculations.njTax)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-lg shadow-xl p-8 text-white mb-6">
          <h2 className="text-2xl font-bold mb-6">2025 Tax Summary</h2>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="bg-white/10 rounded-lg p-4">
              <h3 className="text-sm font-semibold mb-3 opacity-90">Income & Expenses</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="opacity-80">Total Income</span>
                  <span className="font-semibold">{formatCurrency(calculations.grossIncome)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="opacity-80">Business Expenses</span>
                  <span className="font-semibold">-{formatCurrency(calculations.totalExpenses)}</span>
                </div>
                {calculations.homeOfficeDeduction > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="opacity-80">Home Office Deduction</span>
                    <span className="font-semibold">-{formatCurrency(calculations.homeOfficeDeduction)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm pt-2 border-t border-white/20">
                  <span className="opacity-80">Net Profit</span>
                  <span className="font-bold">{formatCurrency(calculations.scheduleCNetProfit)}</span>
                </div>
              </div>
            </div>

            <div className="bg-white/10 rounded-lg p-4">
              <h3 className="text-sm font-semibold mb-3 opacity-90">Key Benefits</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="opacity-80">SE Tax Deduction (50%)</span>
                  <span className="font-semibold">-{formatCurrency(calculations.seDeduction)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="opacity-80">QBI Deduction (20%)</span>
                  <span className="font-semibold">-{formatCurrency(calculations.qbiDeduction)}</span>
                </div>
                {calculations.retirementAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="opacity-80">Retirement Contributions</span>
                    <span className="font-semibold">-{formatCurrency(calculations.retirementAmount)}</span>
                  </div>
                )}
                {calculations.childTaxCredit > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="opacity-80">Child Tax Credit</span>
                    <span className="font-semibold">-{formatCurrency(calculations.childTaxCredit)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-4">
            <div className="bg-white/10 rounded-lg p-4">
              <div className="text-sm opacity-90 mb-1">Total Tax</div>
              <div className="text-2xl font-bold">{formatCurrency(calculations.totalTax)}</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <div className="text-sm opacity-90 mb-1">Effective Rate</div>
              <div className="text-xs opacity-75 mb-1">(of Schedule C Net)</div>
              <div className="text-2xl font-bold">{calculations.effectiveRate.toFixed(1)}%</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <div className="text-sm opacity-90 mb-1">Net After Tax</div>
              <div className="text-2xl font-bold">{formatCurrency(calculations.netAfterTax)}</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <div className="text-sm opacity-90 mb-1">Quarterly (Est.)</div>
              <div className="text-2xl font-bold">{formatCurrency(calculations.quarterlyPayment)}</div>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> 2025 estimates with corrected Additional Medicare Tax, QBI deduction, and NJ brackets. Child Tax Credit is non-refundable only. Consult a tax professional.
          </p>
        </div>
      </div>
    </div>
  );
}
