import { BaseCalculationParams, Installment } from "../types";

class FirstClaimCalculator {
  private static calculatePMT(rate: number, nper: number, pv: number): number {
    return rate === 0
      ? pv / nper
      : (rate * pv) / (1 - Math.pow(1 + rate, -nper));
  }

  private static formatDateOnly(date: Date): string {
    return date.toISOString().split("T")[0];
  }

  public calculateInstallments(params: BaseCalculationParams): Installment[] {
    const {
      loanAmount,
      loanTerms,
      margin,
      firstInstallmentDate,
      gracePeriodMonths,
      holidayMonths,
      prepayments,
      disbursements,
      installmentType,
    } = params;

    let remainingAmount = loanAmount;
    const installments: Installment[] = [];
    const prepaymentMap = new Map(
      prepayments.map((p) => [
        FirstClaimCalculator.formatDateOnly(new Date(p.date)),
        p.amount,
      ])
    );
    const disbursementMap = new Map(
      disbursements.map((d) => [
        FirstClaimCalculator.formatDateOnly(new Date(d.date)),
        d.amount,
      ])
    );
    const holidayMonthsSet = new Set(
      holidayMonths.map((h) =>
        FirstClaimCalculator.formatDateOnly(new Date(h.date))
      )
    );

    for (let i = 0; i < loanTerms; i++) {
      const currentDate = new Date(firstInstallmentDate);
      currentDate.setMonth(currentDate.getMonth() + i);
      const formattedDate = FirstClaimCalculator.formatDateOnly(currentDate);

      if (holidayMonthsSet.has(formattedDate)) {
        installments.push({
          date: currentDate,
          principal: 0,
          interest: 0,
          installment: 0,
          wiborRate: 0,
          remainingAmount,
          wiborWithoutMargin: 0,
        });
        continue;
      }

      remainingAmount += disbursementMap.get(formattedDate) || 0;

      let principalPayment = 0;
      const currentRate = margin;
      const interestPayment = (remainingAmount * currentRate) / 12 / 100;

      if (i >= gracePeriodMonths) {
        if (installmentType === "malejące") {
          principalPayment =
            FirstClaimCalculator.calculatePMT(
              currentRate / 100 / 12,
              loanTerms - i,
              remainingAmount
            ) - interestPayment;
        } else {
          principalPayment = remainingAmount / (loanTerms - i);
        }
        remainingAmount -= principalPayment;
      }

      installments.push({
        date: currentDate,
        principal: principalPayment,
        interest: interestPayment,
        installment: principalPayment + interestPayment,
        wiborRate: currentRate,
        remainingAmount,
        wiborWithoutMargin: 0,
      });

      const prepaymentAmount = prepaymentMap.get(formattedDate) ?? 0;
      if (prepaymentAmount > 0) {
        remainingAmount -= prepaymentAmount;
        installments.push({
          date: currentDate,
          principal: prepaymentAmount,
          interest: 0,
          installment: prepaymentAmount,
          wiborRate: 0,
          remainingAmount,
          wiborWithoutMargin: 0,
        });
      }
    }

    return installments;
  }
}

export default FirstClaimCalculator;
