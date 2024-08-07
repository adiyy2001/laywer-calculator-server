import ExcelJS, { FillPattern, Borders, Fill } from "exceljs";
import { Request, Response } from "express";

export interface Installment {
  date: Date;
  principal: number;
  interest: number;
  installment: number;
  wiborRate: number;
  remainingAmount: number;
  wiborWithoutMargin: number;
}

const addStyledRow = (
  sheet: ExcelJS.Worksheet,
  values: (string | number)[],
  cellStyle: Partial<ExcelJS.Style>
) => {
  const row = sheet.addRow(values);
  row.eachCell((cell) => (cell.style = cellStyle));
};

export const generateExcel = async (req: Request, res: Response) => {
  const {
    params,
    mainClaimResults,
    firstClaimResults,
    secondClaimResults,
    basicCalculations,
    wiborData,
    calculationsSummary,
    signDateWibor,
  } = req.body;
  console.log(signDateWibor);
  if (
    !params ||
    !mainClaimResults ||
    !firstClaimResults ||
    !secondClaimResults ||
    !basicCalculations ||
    !wiborData ||
    !calculationsSummary
  ) {
    return res.status(401).json({ error: "Brakuje wymaganych parametrów" });
  }

  const requiredParams = [
    "borrower",
    "loanAmount",
    "loanTerms",
    "startDate",
    "firstInstallmentDate",
    "margin",
    "currentRate",
  ];
  for (const param of requiredParams) {
    if (!params[param]) {
      return res
        .status(401)
        .json({ error: `Brakuje wymaganego parametru: ${param}` });
    }
  }

  const startDate = new Date(params.startDate);
  const firstInstallmentDate = new Date(params.firstInstallmentDate);

  const workbook = new ExcelJS.Workbook();
  const sheet1 = workbook.addWorksheet("PARAMETRY");
  const cellBorderStyle: Partial<Borders> = {
    top: { style: "thin" },
    left: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" },
  };
  const cellStyle: Partial<ExcelJS.Style> = { border: cellBorderStyle };
  const headerStyle: Partial<ExcelJS.Font> = {
    bold: true,
    size: 12,
    color: { argb: "FFFFFF" },
  };
  const headerFill: Fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "4F81BD" },
  };
  const sectionStyle: Partial<ExcelJS.Font> = {
    bold: true,
    size: 14,
    color: { argb: "FFFFFF" },
  };
  const sectionFill: Fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "8FAADC" },
  };

  sheet1.addRow(["PARAMETRY:"]).font = {
    bold: true,
    size: 16,
    color: { argb: "FFFFFF" },
  };
  addStyledRow(sheet1, ["Kredytobiorca", params.borrower], cellStyle);
  addStyledRow(
    sheet1,
    [
      "Kwota kredytu",
      params.loanAmount.toLocaleString("pl-PL", {
        style: "currency",
        currency: "PLN",
      }),
      "Data podpisania",
      startDate.toLocaleDateString("pl-PL"),
    ],
    cellStyle
  );
  addStyledRow(
    sheet1,
    [
      "Ilość rat",
      params.loanTerms,
      "Data pierwszej raty",
      firstInstallmentDate.toLocaleDateString("pl-PL"),
    ],
    cellStyle
  );
  addStyledRow(
    sheet1,
    ["", "", "Karencja", params.gracePeriodMonths > 0 ? "TAK" : "NIE"],
    cellStyle
  );
  addStyledRow(
    sheet1,
    [
      "Marża",
      `${params.margin}%`,
      "Wakacje kredytowe",
      params.holidayMonths.length > 0 ? "TAK" : "NIE",
    ],
    cellStyle
  );
  const targetDateFormatted = new Date(startDate).toISOString().split("T")[0];

  // Sprawdź czy wiborRates zawiera element z daną datą i pobierz wibor3m
  const wibor3mValue = wiborData.find((entry: any) => {
    console.log(
      entry.date === targetDateFormatted,
      targetDateFormatted,
      entry.date
    );
    return entry.date === targetDateFormatted;
  })?.wibor3m;
  console.log(wibor3mValue);
  // console.log(new Date(startDate).toISOString().split("T")[0]);
  addStyledRow(
    sheet1,
    ["WIBOR 3M w dniu sporządzenia umowy", `${wibor3mValue}%`],
    cellStyle
  );

  // Dodawanie sekcji roszczeń z formatowaniem
  sheet1.addRow([]); // Pusta linia dla odstępu
  const mainClaimTitleRow = sheet1.addRow(["ROSZCZENIE GŁÓWNE:"]);
  mainClaimTitleRow.font = sectionStyle;
  mainClaimTitleRow.fill = sectionFill;

  const addClaimRow = (values: (string | number)[]) => {
    const row = sheet1.addRow(values);
    row.eachCell((cell) => {
      cell.style = cellStyle;
    });
  };
  const lastWiborData = wiborData?.reduce((latest: any, entry: any) => {
    const entryDate = new Date(entry.date);
    return entryDate > new Date(latest.date) ? entry : latest;
  }, wiborData[0]);

  const futureInterestBasicCalc = basicCalculations.reduce(
    (acc: number, installment: Installment) => {
      if (lastWiborData && new Date(installment.date) >= lastWiborData) {
        return acc + installment.interest;
      }
      return acc;
    },
    0
  );
  const wibor3m = basicCalculations.reduce(
    (acc: number, installment: Installment) => acc + installment.interest,
    0
  );

  addClaimRow([
    "Wibor 3M",
    wibor3m.toLocaleString("pl-PL", {
      style: "currency",
      currency: "PLN",
    }),
  ]);
  const totalInterestMainClaimCalc = mainClaimResults.reduce(
    (acc: number, installment: Installment) => {
      if (
        new Date(lastWiborData.date) &&
        new Date(installment.date) <= new Date(lastWiborData.date)
      ) {
        return acc + installment.interest;
      }
      return acc;
    },
    0
  );

  addClaimRow([
    "Zwrot do Klienta zapłaconych odsetek (Main Claim)",
    totalInterestMainClaimCalc.toLocaleString("pl-PL", {
      style: "currency",
      currency: "PLN",
    }),
  ]);

  const futureReturn = basicCalculations.reduce(
    (acc: number, installment: Installment) => {
      if (
        new Date(lastWiborData.date) &&
        new Date(installment.date) >= new Date(lastWiborData.date)
      ) {
        return acc + installment.interest;
      }
      return acc;
    },
    0
  );

  addClaimRow([
    "Wartość anulowanych odsetek na przyszłość",
    futureReturn.toLocaleString("pl-PL", {
      style: "currency",
      currency: "PLN",
    }),
  ]);
  addClaimRow([
    "Korzyść Kredytobiorcy",
    wibor3m.toLocaleString("pl-PL", {
      style: "currency",
      currency: "PLN",
    }),
  ]);

  // Pusta linia dla odstępu
  sheet1.addRow([]);
  const firstClaimTitleRow = sheet1.addRow(["I ROSZCZENIE EWENTUALNE:"]);
  firstClaimTitleRow.font = sectionStyle;
  firstClaimTitleRow.fill = sectionFill;

  addClaimRow([
    "Wibor 3M",
    calculationsSummary.totalInterestBasicCalc.toLocaleString("pl-PL", {
      style: "currency",
      currency: "PLN",
    }),
  ]);
  addClaimRow([
    "Bez WIBORU",
    calculationsSummary.totalInterestFirstClaimCalc.toLocaleString("pl-PL", {
      style: "currency",
      currency: "PLN",
    }),
  ]);
  const refundInterestFirst =
    basicCalculations.reduce((acc: number, installment: Installment) => {
      if (new Date(installment.date) <= new Date(lastWiborData.date)) {
        return acc + installment.interest;
      }
      return acc;
    }, 0) -
    firstClaimResults.reduce((acc: number, installment: Installment) => {
      if (new Date(installment.date) <= new Date(lastWiborData.date)) {
        return acc + installment.interest;
      }
      return acc;
    }, 0);
  addClaimRow([
    "Zwrot do Klienta nadpłaconych odsetek",
    refundInterestFirst.toLocaleString("pl-PL", {
      style: "currency",
      currency: "PLN",
    }),
  ]);
  addClaimRow([
    "Wartość anulowanych odsetek na przyszłość",
    calculationsSummary.futureInterestDifferenceCalcFirstClaim.toLocaleString(
      "pl-PL",
      {
        style: "currency",
        currency: "PLN",
      }
    ),
  ]);
  addClaimRow([
    "Korzyść Kredytobiorcy",
    calculationsSummary.borrowerBenefitFirstClaimCalc.toLocaleString("pl-PL", {
      style: "currency",
      currency: "PLN",
    }),
  ]);

  // Pusta linia dla odstępu
  sheet1.addRow([]);
  const secondClaimTitleRow = sheet1.addRow(["II ROSZCZENIE EWENTUALNE:"]);
  secondClaimTitleRow.font = sectionStyle;
  secondClaimTitleRow.fill = sectionFill;

  addClaimRow([
    "Wibor 3M",
    calculationsSummary.totalInterestBasicCalc.toLocaleString("pl-PL", {
      style: "currency",
      currency: "PLN",
    }),
  ]);
  addClaimRow([
    "Stały WIBOR",
    calculationsSummary.totalInterestSecondClaimCalc.toLocaleString("pl-PL", {
      style: "currency",
      currency: "PLN",
    }),
  ]);

  const interestUpToUnknownWiborDate = basicCalculations.reduce(
    (acc: number, installment: Installment) => {
      if (new Date(installment.date) < new Date(lastWiborData.date)) {
        return acc + installment.interest;
      }
      return acc;
    },
    0
  );

  const interestSecondClaimUpToUnknownWiborDate = secondClaimResults.reduce(
    (acc: number, installment: Installment) => {
      if (new Date(installment.date) < new Date(lastWiborData.date)) {
        return acc + installment.interest;
      }
      return acc;
    },
    0
  );

  addClaimRow([
    "Zwrot do Klienta nadpłaconych odsetek",
    (
      interestUpToUnknownWiborDate - interestSecondClaimUpToUnknownWiborDate
    ).toLocaleString("pl-PL", {
      style: "currency",
      currency: "PLN",
    }),
  ]);

  const futureInterestBasic = basicCalculations.reduce(
    (acc: number, installment: Installment) => {
      if (new Date(installment.date) >= new Date(lastWiborData.date)) {
        return acc + installment.interest;
      }
      return acc;
    },
    0
  );

  const endDate = basicCalculations[basicCalculations.length - 1]?.date;

  const futureInterestSecondClaim = secondClaimResults.reduce(
    (acc: number, installment: Installment) => {
      if (new Date(installment.date) >= endDate) {
        return acc + installment.interest;
      }
      return acc;
    },
    0
  );

  const futureInterestDifferenceCalc =
    futureInterestBasic - futureInterestSecondClaim;

  addClaimRow([
    "Wartość anulowanych odsetek na przyszłość",
    futureInterestDifferenceCalc.toLocaleString("pl-PL", {
      style: "currency",
      currency: "PLN",
    }),
  ]);
  const refundInterestCalc =
    interestUpToUnknownWiborDate - interestSecondClaimUpToUnknownWiborDate;

  addClaimRow([
    "Korzyść Kredytobiorcy",
    refundInterestCalc.toLocaleString("pl-PL", {
      style: "currency",
      currency: "PLN",
    }),
  ]);

  // Druga zakładka: Szczegóły roszczeń
  const sheet2 = workbook.addWorksheet("Szczegóły");

  const headerRow = sheet2.addRow([
    "PARAMETRY:",
    "",
    "",
    "ROSZCZENIE GŁÓWNE:",
    "",
    "",
    "I ROSZCZENIE EWENTUALNE:",
    "",
    "",
    "II ROSZCZENIE EWENTUALNE:",
  ]);
  headerRow.font = headerStyle;
  headerRow.fill = headerFill;

  const addStyledDetailRow = (values: (string | number)[]) => {
    const row = sheet2.addRow(values);
    row.eachCell((cell) => {
      cell.style = cellStyle;
    });
  };

  addStyledDetailRow([
    "Kwota kredytu",
    `${params.loanAmount.toLocaleString("pl-PL", {
      style: "currency",
      currency: "PLN",
    })}`,
    "",
    "Suma odsetek:",
    "",
    "",
    "Suma odsetek:",
    "",
    "",
    "Suma odsetek:",
  ]);
  addStyledDetailRow([
    "Ilość rat",
    params.loanTerms,
    "",
    "WIBOR 3M",
    calculationsSummary.totalInterestBasicCalc.toLocaleString("pl-PL", {
      style: "currency",
      currency: "PLN",
    }),
    "",
    "WIBOR 3M",
    firstClaimResults
      .reduce((sum: number, item: any) => sum + item.interest, 0)
      .toLocaleString("pl-PL", { style: "currency", currency: "PLN" }),
  ]);
  addStyledDetailRow([
    "Marża",
    `${params.margin}%`,
    "",
    "Zwrot do Klienta zapłaconych odsetek",
    (
      mainClaimResults.reduce(
        (sum: number, item: any) => sum + item.interest,
        0
      ) / params.loanTerms
    ).toLocaleString("pl-PL", { style: "currency", currency: "PLN" }),
    "",
    "Zwrot do Klienta nadpłaconych odsetek",
    (
      (mainClaimResults.reduce(
        (sum: number, item: any) => sum + item.interest,
        0
      ) -
        firstClaimResults.reduce(
          (sum: number, item: any) => sum + item.interest,
          0
        )) /
      params.loanTerms
    ).toLocaleString("pl-PL", { style: "currency", currency: "PLN" }),
  ]);
  addStyledDetailRow([
    "WIBOR 3M w dniu sporządzenia umowy",
    `${params.currentRate}%`,
    "",
    "Wartość anulowanych odsetek na przyszłość",
    (
      mainClaimResults.reduce(
        (sum: number, item: any) => sum + item.interest,
        0
      ) -
      firstClaimResults.reduce(
        (sum: number, item: any) => sum + item.interest,
        0
      )
    ).toLocaleString("pl-PL", { style: "currency", currency: "PLN" }),
    "",
    "Wartość anulowanych odsetek na przyszłość",
    (
      firstClaimResults.reduce(
        (sum: number, item: any) => sum + item.interest,
        0
      ) -
      secondClaimResults.reduce(
        (sum: number, item: any) => sum + item.interest,
        0
      )
    ).toLocaleString("pl-PL", { style: "currency", currency: "PLN" }),
  ]);
  addStyledDetailRow([
    "Data podpisania",
    startDate.toLocaleDateString("pl-PL"),
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
  ]);
  addStyledDetailRow([
    "Data pierwszej raty",
    firstInstallmentDate.toLocaleDateString("pl-PL"),
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
  ]);

  const addDetailedData = (
    sheet: ExcelJS.Worksheet,
    data: any[],
    title: string
  ) => {
    const titleRow = sheet.addRow([title]);
    titleRow.font = sectionStyle;
    titleRow.fill = sectionFill;
    const headerRow = sheet.addRow([
      "Data",
      "Odsetki",
      "Kapitał",
      "Rata",
      "Pozostało",
      "MARŻA+WIBOR 3M",
      "WIBOR 3M",
    ]);
    headerRow.font = headerStyle;
    headerRow.fill = headerFill;

    data.forEach((row: Installment) => {
      const dataRow = sheet.addRow([
        new Date(row.date).toLocaleDateString(),
        row.interest.toString(), // Zmiana na tekst
        row.principal.toFixed(2),
        row.installment.toFixed(2),
        row.remainingAmount.toFixed(2),
        row.wiborRate,
        row.wiborWithoutMargin,
      ]);
      dataRow.eachCell((cell) => {
        cell.style = cellStyle;
      });
    });
  };
  // Dodawanie danych do szczegółowej zakładki
  addDetailedData(sheet2, mainClaimResults, "ROSZCZENIE GŁÓWNE");
  addDetailedData(sheet2, firstClaimResults, "I ROSZCZENIE EWENTUALNE");
  addDetailedData(sheet2, secondClaimResults, "II ROSZCZENIE EWENTUALNE");

  // Formatowanie kolumn dla lepszej czytelności
  sheet1.columns = [
    { header: "PARAMETRY:", key: "parametry", width: 30 },
    { header: "", key: "value", width: 30 },
    { header: "", key: "parametry2", width: 30 },
    { header: "", key: "value2", width: 30 },
  ];

  sheet2.columns = [
    { header: "Data", key: "date", width: 12 },
    { header: "Odsetki", key: "interest", width: 20 },
    { header: "Kapitał", key: "principal", width: 20 },
    { header: "Rata", key: "installment", width: 20 },
    { header: "Pozostało", key: "remaining", width: 20 },
  ];

  const buffer = await workbook.xlsx.writeBuffer();

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader(
    "Content-Disposition",
    "attachment; filename=loan_calculations.xlsx"
  );
  res.send(buffer);
};
