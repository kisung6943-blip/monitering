import fs from 'fs';

const targetPath = 'd:/projects/naver-coupang monitering/src/components/dailyCalculator/DashboardView.tsx';

if (!fs.existsSync(targetPath)) {
  console.error(`Target file not found at: ${targetPath}`);
  process.exit(1);
}

let content = fs.readFileSync(targetPath, 'utf8').replace(/\r\n/g, '\n');

// Replacement 1: Calculations
const calcTarget = `  const totalNetProfit = filteredOrders.reduce((sum, o) => sum + o.netProfit, 0);
  const avgMargin = totalSales > 0 ? Math.round((totalNetProfit / totalSales) * 100) : 0;`;

const calcReplacement = `  const totalNetProfit = filteredOrders.reduce((sum, o) => sum + o.netProfit, 0);
  const avgMargin = totalSales > 0 ? Math.round((totalNetProfit / totalSales) * 100) : 0;

  // Compute Total Metrics for Entire Period (for the table footer)
  const totalSalesAll = orders.reduce((sum, o) => sum + (o.totalPrice + (o.platform === 'elevenst' ? 0 : o.buyerShippingFee)), 0);
  const totalSettlementAll = orders.reduce((sum, o) => sum + o.settlementAmount, 0);
  const totalCostAll = orders.reduce((sum, o) => sum + o.totalCost, 0);
  const totalPackagingAll = orders.reduce((sum, o) => sum + o.packagingCost, 0);
  const totalActualShippingAll = orders.reduce((sum, o) => sum + o.actualShippingCost, 0);
  const totalGrossProfitAll = orders.reduce((sum, o) => sum + o.grossProfit, 0);
  const totalIncomeTaxAll = orders.reduce((sum, o) => sum + o.incomeTax, 0);
  const totalNetProfitAll = orders.reduce((sum, o) => sum + o.netProfit, 0);
  const avgMarginAll = totalSalesAll > 0 ? Math.round((totalNetProfitAll / totalSalesAll) * 100) : 0;`;

// Replacement 2: Table Footer
const footerTarget = `            {/* Total Row */}
            <tfoot className="bg-slate-100/80 font-bold border-t-2 border-slate-300 text-slate-900">
              <tr>
                <td className="py-3 px-4">전체 기간 합계</td>
                <td className="py-3 px-3 text-center">{filteredOrders.length}건</td>
                <td className="py-3 px-3 text-right text-slate-900">{formatKRW(totalSales, true)}</td>
                <td className="py-3 px-3 text-right text-emerald-800">{formatKRW(totalSettlement, true)}</td>
                <td className="py-3 px-3 text-right text-slate-700">{formatKRW(totalCost, true)}</td>
                <td className="py-3 px-3 text-right text-slate-700">{formatKRW(totalPackaging + totalActualShipping, true)}</td>
                <td className="py-3 px-3 text-right text-slate-900">{formatKRW(totalGrossProfit, true)}</td>
                <td className="py-3 px-3 text-right text-rose-700">-{formatKRW(totalIncomeTax, true)}</td>
                <td className="py-3 px-4 text-right text-indigo-900 text-sm bg-indigo-100/50">
                  {formatKRW(totalNetProfit, true)}
                </td>
                <td className="py-3 px-3 text-center text-indigo-900">
                  {avgMargin}%
                </td>
              </tr>
            </tfoot>`;

const footerReplacement = `            {/* Total Row */}
            <tfoot className="bg-slate-100/80 font-bold border-t-2 border-slate-300 text-slate-900">
              <tr>
                <td className="py-3 px-4">전체 기간 합계</td>
                <td className="py-3 px-3 text-center">{orders.length}건</td>
                <td className="py-3 px-3 text-right text-slate-900">{formatKRW(totalSalesAll, true)}</td>
                <td className="py-3 px-3 text-right text-emerald-800">{formatKRW(totalSettlementAll, true)}</td>
                <td className="py-3 px-3 text-right text-slate-700">{formatKRW(totalCostAll, true)}</td>
                <td className="py-3 px-3 text-right text-slate-700">{formatKRW(totalPackagingAll + totalActualShippingAll, true)}</td>
                <td className="py-3 px-3 text-right text-slate-900">{formatKRW(totalGrossProfitAll, true)}</td>
                <td className="py-3 px-3 text-right text-rose-700">-{formatKRW(totalIncomeTaxAll, true)}</td>
                <td className="py-3 px-4 text-right text-indigo-900 text-sm bg-indigo-100/50">
                  {formatKRW(totalNetProfitAll, true)}
                </td>
                <td className="py-3 px-3 text-center text-indigo-900">
                  {avgMarginAll}%
                </td>
              </tr>
            </tfoot>`;

if (!content.includes(calcTarget)) {
  console.error("Could not find calculation target in DashboardView.tsx");
  process.exit(1);
}

if (!content.includes(footerTarget)) {
  console.error("Could not find footer target in DashboardView.tsx");
  process.exit(1);
}

content = content.replace(calcTarget, calcReplacement);
content = content.replace(footerTarget, footerReplacement);

fs.writeFileSync(targetPath, content, 'utf8');
console.log("Successfully patched DashboardView.tsx in naver-coupang monitering repository!");
