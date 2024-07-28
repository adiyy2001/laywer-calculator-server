import { WiborData } from "../store/reducers/wiborReducer";
import { BaseCalculationParams, Installment } from "../types";

class SecondClaimCalculator {
  constructor(private wiborData: WiborData[]) {}

  private static calculatePMT(rate: number, nper: number, pv: number): number {
    return rate === 0
      ? pv / nper
      : (pv * rate) / (1 - Math.pow(1 + rate, -nper));
  }

  private getWiborRate(date: Date, type: "wibor3m" | "wibor6m"): number {
    if (!this.wiborData.length) return 0;

    const sortedWiborData = [...this.wiborData].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const lastDateEntry = new Date(
      sortedWiborData[sortedWiborData.length - 1].date
    );

    if (date > lastDateEntry) {
      return sortedWiborData[sortedWiborData.length - 1][type] || 0;
    }

    const closestDateEntry = sortedWiborData.reduce((prev, curr) =>
      Math.abs(new Date(curr.date).getTime() - date.getTime()) <
      Math.abs(new Date(prev.date).getTime() - date.getTime())
        ? curr
        : prev
    );

    return closestDateEntry[type] || 0;
  }

  private static formatDateOnly(date: Date): string {
    return date.toISOString().split("T")[0];
  }

  public calculateInstallments(
    type: "wibor3m" | "wibor6m",
    params: BaseCalculationParams
  ): Installment[] {
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
        SecondClaimCalculator.formatDateOnly(new Date(p.date)),
        p.amount,
      ])
    );
    const disbursementMap = new Map(
      disbursements.map((d) => [
        SecondClaimCalculator.formatDateOnly(new Date(d.date)),
        d.amount,
      ])
    );
    const holidayMonthsSet = new Set(
      holidayMonths.map((h) =>
        SecondClaimCalculator.formatDateOnly(new Date(h.date))
      )
    );

    const initialWiborRate = this.getWiborRate(
      new Date(firstInstallmentDate),
      type
    ); // WIBOR na dzień podpisania umowy
    const currentRate = margin + initialWiborRate;
    const monthlyRate = currentRate / 12 / 100; // marża + WIBOR podzielone przez 12

    for (let i = 0; i < loanTerms; i++) {
      const currentDate = new Date(firstInstallmentDate);
      currentDate.setMonth(currentDate.getMonth() + i);
      const formattedDate = SecondClaimCalculator.formatDateOnly(currentDate);

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
      const interestPayment = remainingAmount * monthlyRate;

      if (i >= gracePeriodMonths) {
        if (installmentType === "malejące") {
          principalPayment =
            SecondClaimCalculator.calculatePMT(
              monthlyRate,
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
        wiborWithoutMargin: initialWiborRate,
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

export default SecondClaimCalculator;
