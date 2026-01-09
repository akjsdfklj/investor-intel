import { TermSheetTemplate } from '@/types';

export interface TermSheetVariables {
  companyName: string;
  investorName?: string;
  investmentAmount: number;
  valuationCap: number;
  discountRate?: number;
  proRataRights: boolean;
  founderName?: string;
  founderEmail?: string;
  date: string;
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: 'USD', 
    maximumFractionDigits: 0 
  }).format(amount);
};

export const SAFE_TEMPLATE = (vars: TermSheetVariables): string => `
SIMPLE AGREEMENT FOR FUTURE EQUITY (SAFE)
═══════════════════════════════════════════════════════════════════

Company:           ${vars.companyName}
Investor:          ${vars.investorName || '[INVESTOR NAME]'}
Investment Amount: ${formatCurrency(vars.investmentAmount)}
Valuation Cap:     ${formatCurrency(vars.valuationCap)}
Discount Rate:     ${vars.discountRate || 20}%
Date:              ${vars.date}

═══════════════════════════════════════════════════════════════════

1. EVENTS

   (a) Equity Financing. If there is an Equity Financing before the 
       termination of this Safe, on the initial closing of such Equity 
       Financing, this Safe will automatically convert into the number 
       of shares of Safe Preferred Stock equal to the Purchase Amount 
       divided by the Conversion Price.

   (b) Liquidity Event. If there is a Liquidity Event before the 
       termination of this Safe, this Safe will automatically be 
       entitled to receive a portion of Proceeds, due and payable to 
       the Investor immediately prior to, or concurrent with, the 
       consummation of such Liquidity Event.

   (c) Dissolution Event. If there is a Dissolution Event before the 
       termination of this Safe, the Investor will automatically be 
       entitled to receive a portion of Proceeds equal to the Purchase 
       Amount.

2. DEFINITIONS

   "Conversion Price" means the either: (1) the Safe Price or (2) the 
   Discount Price, whichever calculation results in a greater number 
   of shares of Safe Preferred Stock.

   "Discount Price" means the price per share of the Standard Preferred 
   Stock sold in the Equity Financing multiplied by the Discount Rate.

   "Safe Price" means the price per share equal to the Valuation Cap 
   divided by the Company Capitalization.

   "Valuation Cap" means ${formatCurrency(vars.valuationCap)}.

   "Discount Rate" means ${100 - (vars.discountRate || 20)}%.

3. COMPANY REPRESENTATIONS

   (a) The Company is a corporation duly organized, validly existing and 
       in good standing under the laws of its state of incorporation.

   (b) The execution, delivery and performance by the Company of this 
       Safe is within the power of the Company and has been duly 
       authorized by all necessary actions.

4. INVESTOR REPRESENTATIONS

   (a) The Investor has full legal capacity, power and authority to 
       execute and deliver this Safe and to perform its obligations 
       hereunder.

   (b) The Investor is an accredited investor as such term is defined 
       in Rule 501 of Regulation D under the Securities Act.

5. ${vars.proRataRights ? 'PRO-RATA RIGHTS' : 'NO PRO-RATA RIGHTS'}

   ${vars.proRataRights 
     ? `The Investor shall have the right to participate pro-rata in any 
       subsequent equity financing rounds to maintain their ownership 
       percentage in the Company.`
     : `This Safe does not grant the Investor any pro-rata or participation 
       rights in future financing rounds.`
   }

6. MISCELLANEOUS

   (a) This Safe expires and is no longer valid after 24 months from 
       the date of issuance if no triggering event has occurred.

   (b) Any provision of this Safe may be amended, waived or modified 
       only upon the written consent of the Company and the Investor.

   (c) This Safe constitutes the full and entire understanding between 
       the parties with respect to the subject matter hereof.

═══════════════════════════════════════════════════════════════════

SIGNATURE BLOCK

COMPANY:

_________________________________
${vars.companyName}
By: ${vars.founderName || '[Founder Name]'}
Title: CEO
Date: _______________


INVESTOR:

_________________________________
${vars.investorName || '[Investor Name]'}
Date: _______________

═══════════════════════════════════════════════════════════════════
`;

export const CONVERTIBLE_NOTE_TEMPLATE = (vars: TermSheetVariables): string => `
CONVERTIBLE PROMISSORY NOTE
═══════════════════════════════════════════════════════════════════

Principal Amount:  ${formatCurrency(vars.investmentAmount)}
Issue Date:        ${vars.date}
Company:           ${vars.companyName}
Investor:          ${vars.investorName || '[INVESTOR NAME]'}
Valuation Cap:     ${formatCurrency(vars.valuationCap)}
Discount Rate:     ${vars.discountRate || 20}%
Interest Rate:     8% per annum (simple interest)
Maturity Date:     24 months from Issue Date

═══════════════════════════════════════════════════════════════════

1. PRINCIPAL AND INTEREST

   FOR VALUE RECEIVED, ${vars.companyName} (the "Company") hereby 
   promises to pay to the order of ${vars.investorName || '[Investor Name]'} 
   (the "Holder") the principal sum of ${formatCurrency(vars.investmentAmount)}, 
   together with simple interest on the outstanding principal balance 
   at the rate of 8% per annum.

   Interest shall accrue from the Issue Date and shall be calculated on 
   the basis of a 365-day year for the actual number of days elapsed.

2. CONVERSION UPON QUALIFIED FINANCING

   (a) Automatic Conversion. Upon the closing of a Qualified Financing, 
       the outstanding principal balance of this Note, together with all 
       accrued and unpaid interest, shall automatically convert into 
       shares of the same class and series of stock issued in the 
       Qualified Financing.

   (b) Conversion Price. The conversion price shall be equal to the 
       lesser of:
       (i)  The Valuation Cap Price: ${formatCurrency(vars.valuationCap)} 
            divided by the fully-diluted capitalization; or
       (ii) The Discount Price: ${100 - (vars.discountRate || 20)}% of the 
            per share price paid by investors in the Qualified Financing.

   (c) "Qualified Financing" means an equity financing in which the 
       Company raises gross proceeds of at least $1,000,000.

3. CONVERSION UPON CHANGE OF CONTROL

   Upon a Change of Control prior to the Maturity Date, the Holder may 
   elect to either:
   (a) Receive payment equal to 2x the outstanding principal; or
   (b) Convert this Note at the Valuation Cap Price.

4. MATURITY

   If this Note has not been converted prior to the Maturity Date, the 
   outstanding principal balance together with all accrued and unpaid 
   interest shall become due and payable in full on the Maturity Date.

   Alternatively, the Holder may elect to convert this Note at the 
   Valuation Cap Price on the Maturity Date.

5. ${vars.proRataRights ? 'PRO-RATA RIGHTS' : 'NO PRO-RATA RIGHTS'}

   ${vars.proRataRights 
     ? `Upon conversion, the Holder shall have the right to participate 
       pro-rata in subsequent financing rounds to maintain their 
       percentage ownership in the Company.`
     : `This Note does not grant the Holder any pro-rata or participation 
       rights in future financing rounds.`
   }

6. REPRESENTATIONS AND WARRANTIES

   (a) The Company represents that it has full power and authority to 
       issue this Note and to perform its obligations hereunder.

   (b) The Holder represents that it is an accredited investor as 
       defined in Rule 501 of Regulation D.

7. GENERAL PROVISIONS

   (a) This Note may not be prepaid without the prior written consent 
       of the Holder.

   (b) This Note shall be governed by and construed in accordance with 
       the laws of the State of Delaware.

   (c) Any notices shall be delivered to the addresses set forth in 
       the signature block below.

═══════════════════════════════════════════════════════════════════

SIGNATURE BLOCK

COMPANY:

_________________________________
${vars.companyName}
By: ${vars.founderName || '[Founder Name]'}
Title: CEO
Email: ${vars.founderEmail || '[Email]'}
Date: _______________


HOLDER/INVESTOR:

_________________________________
${vars.investorName || '[Investor Name]'}
Date: _______________

═══════════════════════════════════════════════════════════════════
`;

export const EQUITY_TEMPLATE = (vars: TermSheetVariables): string => `
SERIES SEED PREFERRED STOCK TERM SHEET
═══════════════════════════════════════════════════════════════════

Company:           ${vars.companyName}
Investment Amount: ${formatCurrency(vars.investmentAmount)}
Pre-Money Valuation: ${formatCurrency(vars.valuationCap)}
Date:              ${vars.date}

═══════════════════════════════════════════════════════════════════

OFFERING TERMS
═══════════════════════════════════════════════════════════════════

Securities:        Series Seed Preferred Stock

Investment Amount: ${formatCurrency(vars.investmentAmount)}

Pre-Money Valuation: ${formatCurrency(vars.valuationCap)}

Post-Money Valuation: ${formatCurrency(vars.valuationCap + vars.investmentAmount)}

Ownership Percentage: ${((vars.investmentAmount / (vars.valuationCap + vars.investmentAmount)) * 100).toFixed(2)}%

Price Per Share:   To be determined based on fully-diluted 
                   capitalization at closing

TERMS OF SERIES SEED PREFERRED STOCK
═══════════════════════════════════════════════════════════════════

1. DIVIDENDS

   The Series Seed Preferred Stock shall carry an annual dividend 
   right of 8% of the Original Issue Price, non-cumulative, when, 
   as, and if declared by the Board of Directors.

   Dividends shall be paid in preference to any dividends on 
   Common Stock.

2. LIQUIDATION PREFERENCE

   In the event of any liquidation, dissolution or winding up of 
   the Company, the holders of Series Seed Preferred Stock shall 
   be entitled to receive, prior and in preference to any 
   distribution to Common Stock holders:

   (a) 1x non-participating liquidation preference equal to the 
       Original Issue Price plus any declared but unpaid dividends; OR

   (b) The amount such holder would have received if the Series 
       Seed Preferred Stock had been converted to Common Stock 
       immediately prior to the liquidation event.

3. CONVERSION

   (a) Optional Conversion: Each share of Series Seed Preferred 
       Stock is convertible at any time, at the holder's option, 
       into Common Stock at a 1:1 ratio (subject to adjustment).

   (b) Automatic Conversion: All Series Seed Preferred Stock shall 
       automatically convert to Common Stock upon:
       (i)  A Qualified IPO with gross proceeds of at least $50M; or
       (ii) Written consent of holders of a majority of the Series 
            Seed Preferred Stock.

4. VOTING RIGHTS

   Holders of Series Seed Preferred Stock shall vote together with 
   Common Stock on an as-converted basis.

5. ANTI-DILUTION PROTECTION

   Broad-based weighted average anti-dilution protection in the 
   event of a down round financing.

6. ${vars.proRataRights ? 'PRO-RATA RIGHTS' : 'NO PRO-RATA RIGHTS'}

   ${vars.proRataRights 
     ? `Investors shall have the right to participate in subsequent 
       financing rounds on a pro-rata basis to maintain their 
       percentage ownership.`
     : `This term sheet does not include pro-rata rights for 
       subsequent financing rounds.`
   }

7. INFORMATION RIGHTS

   Investors shall receive:
   - Annual audited financial statements
   - Quarterly unaudited financial statements
   - Annual budget and business plan
   - Prompt notice of material events

8. BOARD COMPOSITION

   The Board shall initially consist of:
   - 2 seats elected by Common Stock holders
   - 1 seat elected by Series Seed Preferred holders

9. PROTECTIVE PROVISIONS

   Consent of holders of a majority of Series Seed Preferred Stock 
   shall be required for:
   - Any amendment to the Certificate of Incorporation
   - Issuance of senior or pari-passu securities
   - Sale of all or substantially all assets
   - Any merger, reorganization, or similar transaction
   - Declaration of dividends on Common Stock

10. DRAG-ALONG RIGHTS

    If holders of a majority of Common Stock and Series Seed 
    Preferred Stock approve a sale of the Company, all stockholders 
    shall be required to participate in such transaction.

11. CLOSING CONDITIONS

    - Satisfactory completion of due diligence
    - Negotiation and execution of definitive agreements
    - Standard legal opinions and closing deliverables

═══════════════════════════════════════════════════════════════════

This term sheet is for discussion purposes only and does not 
constitute a binding obligation except for the confidentiality 
provisions below.

CONFIDENTIALITY: The parties agree to keep the terms of this 
term sheet confidential and not to disclose its contents to 
third parties without prior written consent.

═══════════════════════════════════════════════════════════════════

SIGNATURE BLOCK

COMPANY:

_________________________________
${vars.companyName}
By: ${vars.founderName || '[Founder Name]'}
Title: CEO
Date: _______________


INVESTOR:

_________________________________
${vars.investorName || '[Investor Name]'}
Date: _______________

═══════════════════════════════════════════════════════════════════
`;

export function generateTermSheetContent(
  template: TermSheetTemplate,
  vars: TermSheetVariables
): string {
  switch (template) {
    case 'safe':
      return SAFE_TEMPLATE(vars);
    case 'convertible_note':
      return CONVERTIBLE_NOTE_TEMPLATE(vars);
    case 'equity':
      return EQUITY_TEMPLATE(vars);
    default:
      return SAFE_TEMPLATE(vars);
  }
}

export function getTemplateDescription(template: TermSheetTemplate): string {
  switch (template) {
    case 'safe':
      return 'Simple Agreement for Future Equity - Y Combinator standard for early-stage investments';
    case 'convertible_note':
      return 'Convertible Promissory Note - Debt instrument that converts to equity';
    case 'equity':
      return 'Series Seed Preferred Stock - Priced equity round with standard terms';
    default:
      return '';
  }
}
