import React, { useEffect, useMemo, useState } from "react";
import { getReportsDashboard } from "../services/reportsApi";
import { formatINR } from "../utils/currency";

const TIMEFRAMES = ["DAILY", "WEEKLY", "MONTHLY"];

function formatCurrency(value) {
  return formatINR(value);
}

function SummaryCard({ title, value, icon, subtitle, tone = "gold" }) {
  const toneClasses =
    tone === "danger"
      ? "border-error/25 bg-error/10 text-error"
      : tone === "muted"
      ? "border-white/10 bg-white/5 text-secondary"
      : "border-primary/25 bg-primary/10 text-primary";

  return (
    <div className="relative overflow-hidden rounded-[26px] border border-[#4d4635]/20 bg-[#111111] p-5 shadow-[0_16px_40px_rgba(0,0,0,0.35)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(242,202,80,0.08),transparent_45%)]" />
      <div className="relative z-10 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.28em] text-secondary">{title}</p>
          <h3 className="font-headline text-2xl sm:text-[30px] text-white mt-3 break-words">{value}</h3>
          {subtitle ? <p className="text-xs text-outline mt-2">{subtitle}</p> : null}
        </div>
        <div className={`w-12 h-12 rounded-full flex items-center justify-center border ${toneClasses}`}>
          <span className="material-symbols-outlined text-[22px]">{icon}</span>
        </div>
      </div>
    </div>
  );
}

function SectionShell({ title, subtitle, action, children }) {
  return (
    <section className="rounded-[28px] border border-[#4d4635]/20 bg-[#111111] p-5 sm:p-6 shadow-[0_16px_40px_rgba(0,0,0,0.35)]">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-secondary">{title}</p>
          {subtitle ? <p className="text-sm text-outline mt-2">{subtitle}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function BarChart({ data, axisLabel }) {
  const maxValue = Math.max(...data.map((item) => Number(item.total || 0)), 1);

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-2 h-64 sm:h-72 pt-2 pb-1 border-b border-white/10">
        {data.map((point) => {
          const heightPercent = Math.max((Number(point.total || 0) / maxValue) * 100, point.total > 0 ? 6 : 0);

          return (
            <div key={point.key} className="flex-1 flex flex-col items-center justify-end gap-2 h-full group">
              <div className="relative flex items-end h-full w-full justify-center">
                <div
                  className="w-full max-w-[44px] rounded-t-[14px] bg-primary shadow-[0_0_20px_rgba(242,202,80,0.18)] transition-all duration-300 group-hover:opacity-90"
                  style={{ height: `${heightPercent}%` }}
                />
                <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 rounded-md border border-primary/30 bg-black text-[10px] text-primary whitespace-nowrap">
                  {formatCurrency(point.total)}
                </div>
              </div>
              <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-secondary text-center">{point.label}</span>
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.24em] text-outline">
        <span>{axisLabel || "Sales"}</span>
        <span>Live aggregation from MongoDB</span>
      </div>
    </div>
  );
}

function PaymentBreakdown({ items }) {
  const total = items.reduce((sum, item) => sum + Number(item.totalAmount || 0), 0) || 1;

  return (
    <div className="space-y-4">
      {items.map((item) => {
        const percent = Math.round((Number(item.totalAmount || 0) / total) * 100);

        return (
          <div key={item.method} className="space-y-2">
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="text-on-surface font-medium uppercase tracking-wider text-xs">{item.method}</span>
              <span className="text-primary font-semibold">{formatCurrency(item.totalAmount)}</span>
            </div>
            <div className="h-3 rounded-full bg-white/5 overflow-hidden">
              <div className="h-full rounded-full bg-[linear-gradient(90deg,#f2ca50,#ffe88a)] transition-all duration-500" style={{ width: `${percent}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ListRow({ title, subtitle, amount, badge, danger = false }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-white/8 last:border-b-0">
      <div className="min-w-0">
        <p className="text-sm font-medium text-white truncate">{title}</p>
        <p className="text-[10px] uppercase tracking-wider text-outline mt-1 truncate">{subtitle}</p>
      </div>
      <div className="text-right shrink-0">
        <p className={`text-sm font-semibold ${danger ? "text-error" : "text-primary"}`}>{amount}</p>
        {badge ? <p className="text-[10px] uppercase tracking-wider text-secondary mt-1">{badge}</p> : null}
      </div>
    </div>
  );
}

export default function Reports({ onRefresh }) {
  const [timeframe, setTimeframe] = useState("WEEKLY");
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboard = async (selectedTimeframe = timeframe, isAutoRefresh = false) => {
    if (isAutoRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const data = await getReportsDashboard(selectedTimeframe);
      setDashboard(data);
      await onRefresh?.();
    } catch (requestError) {
      setError(requestError.message || "Unable to load analytics.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboard(timeframe);
    const intervalId = window.setInterval(() => loadDashboard(timeframe, true), 45000);
    return () => window.clearInterval(intervalId);
  }, [timeframe]);

  const summary = dashboard?.summary || {};
  const salesChart = dashboard?.charts?.sales || [];
  const topSelling = dashboard?.products?.topSelling || [];
  const lowStock = dashboard?.products?.lowStock || [];
  const paymentMethods = dashboard?.billing?.paymentMethods || [];

  const highestSelling = useMemo(() => topSelling[0], [topSelling]);

  return (
    <div className="space-y-6 pb-24 md:pb-8 animate-fade-in-up">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-secondary">Reports & analytics</p>
          <h1 className="font-headline text-[34px] sm:text-[44px] text-primary mt-2">Malaabis Studio Dashboard</h1>
          <p className="text-sm text-outline mt-2 max-w-2xl">Live performance metrics, top sellers, inventory health, and payment mix calculated directly from MongoDB.</p>
        </div>

        <div className="flex items-center gap-3 self-start">
          <div className="flex bg-white/5 rounded-full p-1 border border-white/10">
            {TIMEFRAMES.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setTimeframe(item)}
                className={`px-4 py-2 rounded-full text-[10px] sm:text-xs font-semibold uppercase tracking-wider transition-all ${
                  timeframe === item ? "bg-primary text-black" : "text-secondary hover:text-primary"
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => loadDashboard(timeframe)}
            className="h-11 px-4 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider hover:bg-primary/15 transition-colors"
          >
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-40 rounded-[26px] border border-white/10 bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-[26px] border border-error/20 bg-error/10 p-5 text-error">
          <p className="font-semibold">Unable to load analytics</p>
          <p className="text-sm mt-2">{error}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <SummaryCard title="Today sales" value={formatCurrency(summary.todaySales)} icon="payments" subtitle={`${summary.todayOrders || 0} orders today`} />
            <SummaryCard title="Monthly revenue" value={formatCurrency(summary.monthlyRevenue)} icon="trending_up" subtitle="Current month revenue" />
            <SummaryCard title="Total orders" value={Number(summary.totalOrders || 0).toLocaleString()} icon="shopping_bag" subtitle="All completed bills" tone="muted" />
            <SummaryCard title="Low stock products" value={Number(summary.lowStockProducts || 0).toLocaleString()} icon="warning" subtitle="Needs replenishment" tone="danger" />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_0.9fr] gap-6">
            <SectionShell
              title={`${timeframe.toLowerCase()} sales graph`}
              subtitle="Revenue trend powered by a live MongoDB aggregation query."
              action={<span className="material-symbols-outlined text-primary">analytics</span>}
            >
              <BarChart data={salesChart} axisLabel={timeframe === "DAILY" ? "Hourly sales" : timeframe === "WEEKLY" ? "Daily sales" : "Monthly sales"} />
            </SectionShell>

            <SectionShell
              title="Payment breakdown"
              subtitle="Revenue share by payment method."
              action={<span className="material-symbols-outlined text-primary">account_balance_wallet</span>}
            >
              <PaymentBreakdown items={paymentMethods} />
            </SectionShell>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-6">
            <SectionShell
              title="Top selling products"
              subtitle={highestSelling ? `Best seller: ${highestSelling.name}` : "Most sold items from the current month."}
              action={<span className="material-symbols-outlined text-primary">workspace_premium</span>}
            >
              <div className="space-y-2">
                {topSelling.length === 0 ? (
                  <p className="text-sm text-secondary py-6">No sales yet.</p>
                ) : (
                  topSelling.map((item, index) => (
                    <ListRow
                      key={item.id}
                      title={`${index + 1}. ${item.name}`}
                      subtitle={`SKU: ${item.sku || "ML-N/A"}`}
                      amount={`${item.quantitySold} sold`}
                      badge={formatCurrency(item.revenue)}
                    />
                  ))
                )}
              </div>
            </SectionShell>

            <SectionShell
              title="Inventory summary"
              subtitle={`Inventory value ${formatCurrency(summary.inventoryValue)} • ${summary.totalProducts || 0} products`}
              action={<span className="material-symbols-outlined text-primary">inventory_2</span>}
            >
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-secondary">Inventory value</p>
                  <p className="text-lg sm:text-xl font-semibold text-primary mt-2">{formatCurrency(summary.inventoryValue)}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-secondary">Stock units</p>
                  <p className="text-lg sm:text-xl font-semibold text-white mt-2">{Number(summary.totalStockUnits || 0).toLocaleString()}</p>
                </div>
              </div>

              <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                {lowStock.length === 0 ? (
                  <p className="text-sm text-secondary py-6">No low stock items right now.</p>
                ) : (
                  lowStock.map((item) => (
                    <ListRow
                      key={item.id}
                      title={item.name}
                      subtitle={`SKU: ${item.sku || "ML-N/A"} • ${item.category || "UNSTITCHED"}`}
                      amount={`${item.stock} left`}
                      badge={formatCurrency(item.price)}
                      danger
                    />
                  ))
                )}
              </div>
            </SectionShell>
          </div>
        </>
      )}
    </div>
  );
}