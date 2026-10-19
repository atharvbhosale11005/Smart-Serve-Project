import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import AdminNavbar from "../components/AdminNavbar";
import {
  getAdminAnalytics,
  getAdminRequests,
  getAdminWorkers,
  assignWorkerToRequest,
  cancelAdminRequest
} from "../Services/adminService";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area,
  ComposedChart, Line, Legend
} from "recharts";
import "./AdminAnalytics.css";

/* ------------------------------------------------------------------ */
/* Constants & helpers                                                 */
/* ------------------------------------------------------------------ */
const STATUS_COLORS = {
  PENDING: "#f59e0b",
  ASSIGNED: "#3b82f6",
  ACCEPTED: "#06b6d4",
  IN_PROGRESS: "#6366f1",
  ARRIVED: "#8b5cf6",
  COMPLETED: "#10b981",
  CANCELLED: "#ef4444",
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const RANGE_OPTIONS = [
  { label: "7D", days: 7 },
  { label: "30D", days: 30 },
  { label: "90D", days: 90 },
];

const compactFmt = new Intl.NumberFormat("en-IN", {
  notation: "compact",
  maximumFractionDigits: 1,
});
const compact = (v) => compactFmt.format(Number(v) || 0);

const dayKey = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const requestValue = (r) => Number(r.final_price || r.estimated_price || 0) || 0;

/* Shared tooltip used by every chart */
function ChartTooltip({ active, payload, label, currencyKeys = [] }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      {label !== undefined && <div className="chart-tooltip-label">{label}</div>}
      {payload.map((p, i) => (
        <div className="chart-tooltip-row" key={i}>
          <span className="chart-tooltip-dot" style={{ background: p.color || p.fill }} />
          <span className="chart-tooltip-name">{p.name}</span>
          <strong>
            {currencyKeys.includes(p.dataKey) ? `₹${Number(p.value).toLocaleString()}` : p.value}
          </strong>
        </div>
      ))}
    </div>
  );
}

function ChartCard({ title, icon, subtitle, action, children, minHeight = 300 }) {
  return (
    <div className="card chart-card shadow-sm border-0 h-100">
      <div className="card-header bg-white py-3 d-flex justify-content-between align-items-start gap-2">
        <div>
          <h6 className="mb-0 fw-bold d-flex align-items-center gap-2">
            <i className={`bi ${icon} text-danger`}></i>
            {title}
          </h6>
          {subtitle && <small className="text-muted">{subtitle}</small>}
        </div>
        {action}
      </div>
      <div className="card-body chart-card-body" style={{ minHeight }}>
        {children}
      </div>
    </div>
  );
}

const EmptyChart = ({ text = "No data available" }) => (
  <div className="chart-empty">
    <i className="bi bi-bar-chart-line"></i>
    <p>{text}</p>
  </div>
);

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */
function AdminAnalytics() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("ANALYTICS");
  const [analytics, setAnalytics] = useState(null);
  const [requests, setRequests] = useState([]);
  const [allRequests, setAllRequests] = useState([]); // unfiltered, used for trend charts
  const [workers, setWorkers] = useState([]);

  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [requestsLoading, setRequestsLoading] = useState(true);

  const [requestFilter, setRequestFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [trendRange, setTrendRange] = useState(30);
  const [trendMetric, setTrendMetric] = useState("bookings"); // bookings | revenue

  const [reassignModalOpen, setReassignModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedWorkerId, setSelectedWorkerId] = useState("");
  const [reassigning, setReassigning] = useState(false);

  useEffect(() => {
    loadAnalyticsAndWorkers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadRequests(requestFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestFilter]);

  const loadAnalyticsAndWorkers = async () => {
    try {
      setAnalyticsLoading(true);
      const token = sessionStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }
      const [analyticsRes, workersRes, allRes] = await Promise.all([
        getAdminAnalytics(token),
        getAdminWorkers(token),
        getAdminRequests("ALL", token),
      ]);

      if (analyticsRes.status === "success") setAnalytics(analyticsRes.data);
      if (workersRes.status === "success") {
        setWorkers(
          (workersRes.data || []).filter(
            (w) => w.approval_status === "APPROVED" && w.is_active && !w.is_blocked
          )
        );
      }
      if (allRes.status === "success") setAllRequests(allRes.data || []);
    } catch (error) {
      console.error("ADMIN ANALYTICS ERROR:", error);
      toast.error("Failed to load analytics data");
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const loadRequests = async (filter) => {
    try {
      setRequestsLoading(true);
      const token = sessionStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }
      const requestsRes = await getAdminRequests(filter, token);
      if (requestsRes.status === "success") setRequests(requestsRes.data || []);
    } catch (error) {
      console.error("ADMIN REQUESTS ERROR:", error);
      toast.error("Failed to load requests");
    } finally {
      setRequestsLoading(false);
    }
  };

  const refreshAll = () => {
    loadAnalyticsAndWorkers();
    loadRequests(requestFilter);
  };

  const handleOpenReassign = (req) => {
    setSelectedRequest(req);
    setSelectedWorkerId(req.assigned_worker_id || "");
    setReassignModalOpen(true);
  };

  const handleSaveReassign = async () => {
    if (!selectedWorkerId) {
      toast.warning("Please select a worker to assign");
      return;
    }
    try {
      setReassigning(true);
      const token = sessionStorage.getItem("token");
      const res = await assignWorkerToRequest(selectedRequest.request_id, selectedWorkerId, token);
      if (res.status === "success") {
        toast.success(res.data?.message || "Worker assigned successfully");
        setReassignModalOpen(false);
        refreshAll();
      } else {
        toast.error(typeof res.data === "string" ? res.data : "Assignment failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to assign worker");
    } finally {
      setReassigning(false);
    }
  };

  const handleCancelRequest = async (reqId) => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) return;
    try {
      const token = sessionStorage.getItem("token");
      const res = await cancelAdminRequest(reqId, token);
      if (res.status === "success") {
        toast.success("Request cancelled successfully");
        refreshAll();
      } else {
        toast.error(typeof res.data === "string" ? res.data : "Failed to cancel request");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to cancel request");
    }
  };

  const getStatusBadge = (status) => {
    const s = (status || "").toUpperCase();
    if (s === "COMPLETED") return <span className="badge bg-success">Completed</span>;
    if (s === "PENDING") return <span className="badge bg-warning text-dark">Pending</span>;
    if (s === "CANCELLED") return <span className="badge bg-danger">Cancelled</span>;
    if (s === "IN_PROGRESS") return <span className="badge bg-primary">In Progress</span>;
    if (s === "ASSIGNED") return <span className="badge bg-info text-dark">Assigned</span>;
    if (s === "ACCEPTED") return <span className="badge bg-info text-dark">Accepted</span>;
    if (s === "ARRIVED") return <span className="badge bg-primary">Arrived</span>;
    return <span className="badge bg-secondary">{status}</span>;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    return isNaN(d.getTime())
      ? dateStr
      : d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const formatRating = (val) => {
    const n = Number(val);
    return Number.isFinite(n) ? n.toFixed(1) : "0.0";
  };
  const formatCurrency = (val) => {
    const n = Number(val);
    return Number.isFinite(n) ? n.toLocaleString() : "0";
  };

  const filteredRequests = requests.filter(
    (r) =>
      (r.request_code || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.service_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.customer_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.worker_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.address_city || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const availableWorkersForAssignment = workers.filter(
    (w) => w.is_available === true || (selectedRequest && w.user_id === selectedRequest.assigned_worker_id)
  );

  /* ---------------------------- Chart data ---------------------------- */
  const pieData = useMemo(
    () =>
      analytics?.statusDistribution?.map((st) => ({
        name: st.status,
        value: Number(st.count) || 0,
        color: STATUS_COLORS[st.status] || "#94a3b8",
      })) || [],
    [analytics]
  );
  const totalStatusCount = pieData.reduce((sum, p) => sum + p.value, 0);

  const categoryData = useMemo(
    () =>
      analytics?.categoryPerformance?.map((cat) => ({
        name: cat.category_name,
        revenue: Number(cat.category_revenue) || 0,
        bookings: Number(cat.total_requests) || 0,
      })) || [],
    [analytics]
  );

  const ratingData = useMemo(() => {
    const map = {};
    (analytics?.ratingDistribution || []).forEach((r) => {
      map[Number(r.rating)] = Number(r.count) || 0;
    });
    return [5, 4, 3, 2, 1].map((star) => ({ name: `${star} ★`, count: map[star] || 0, star }));
  }, [analytics]);
  const totalReviews = ratingData.reduce((s, r) => s + r.count, 0);

  const topWorkerData = useMemo(
    () =>
      (analytics?.topWorkers || []).slice(0, 6).map((w) => ({
        name: (w.full_name || "Unknown").split(" ")[0],
        fullName: w.full_name,
        jobs: Number(w.total_jobs_completed) || 0,
        rating: Number(w.avg_rating) || 0,
      })),
    [analytics]
  );

  // Daily trend (bookings + completed revenue), derived from the unfiltered request list
  const trendData = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const buckets = {};
    const list = [];
    for (let i = trendRange - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = dayKey(d);
      buckets[key] = {
        key,
        label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        bookings: 0,
        completed: 0,
        revenue: 0,
      };
      list.push(buckets[key]);
    }
    allRequests.forEach((r) => {
      const d = new Date(r.created_at);
      if (isNaN(d.getTime())) return;
      const b = buckets[dayKey(d)];
      if (!b) return;
      b.bookings += 1;
      if ((r.status || "").toUpperCase() === "COMPLETED") {
        b.completed += 1;
        b.revenue += requestValue(r);
      }
    });
    return list;
  }, [allRequests, trendRange]);

  const trendTotals = useMemo(
    () => ({
      bookings: trendData.reduce((s, d) => s + d.bookings, 0),
      revenue: trendData.reduce((s, d) => s + d.revenue, 0),
    }),
    [trendData]
  );

  // Busiest weekdays
  const weekdayData = useMemo(() => {
    const counts = Array(7).fill(0);
    allRequests.forEach((r) => {
      const d = new Date(r.created_at);
      if (!isNaN(d.getTime())) counts[d.getDay()] += 1;
    });
    const max = Math.max(...counts, 0);
    return WEEKDAYS.map((name, i) => ({ name, bookings: counts[i], isPeak: max > 0 && counts[i] === max }));
  }, [allRequests]);

  // Top cities
  const cityData = useMemo(() => {
    const map = {};
    allRequests.forEach((r) => {
      const c = (r.address_city || "").trim();
      if (c) map[c] = (map[c] || 0) + 1;
    });
    return Object.entries(map)
      .map(([name, bookings]) => ({ name, bookings }))
      .sort((a, b) => b.bookings - a.bookings)
      .slice(0, 6);
  }, [allRequests]);

  // KPI summary
  const kpis = useMemo(() => {
    const countOf = (s) => pieData.find((p) => p.name === s)?.value || 0;
    const total = totalStatusCount;
    const completed = countOf("COMPLETED");
    const cancelled = countOf("CANCELLED");
    const revenue = (analytics?.statusDistribution || [])
      .filter((s) => s.status === "COMPLETED")
      .reduce((sum, s) => sum + (Number(s.value) || 0), 0);
    const avgRating = totalReviews
      ? ratingData.reduce((s, r) => s + r.star * r.count, 0) / totalReviews
      : 0;
    return [
      { label: "Total bookings", value: formatCurrency(total), icon: "bi-receipt", tone: "slate" },
      { label: "Completed revenue", value: `₹${compact(revenue)}`, icon: "bi-currency-rupee", tone: "green" },
      {
        label: "Completion rate",
        value: total ? `${Math.round((completed / total) * 100)}%` : "0%",
        icon: "bi-check2-circle",
        tone: "blue",
      },
      {
        label: "Cancellation rate",
        value: total ? `${Math.round((cancelled / total) * 100)}%` : "0%",
        icon: "bi-x-octagon",
        tone: "red",
      },
      {
        label: "Average rating",
        value: totalReviews ? `${avgRating.toFixed(1)} ★` : "—",
        icon: "bi-star-fill",
        tone: "amber",
        hint: `${totalReviews} review${totalReviews === 1 ? "" : "s"}`,
      },
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analytics, pieData, ratingData, totalReviews, totalStatusCount]);

  const axisTick = { fontSize: 12, fill: "#64748b" };

  /* ------------------------------ Render ------------------------------ */
  return (
    <div className="dashboard-shell">
      <AdminNavbar />

      <main className="dashboard-main">
        <div className="dashboard-content">
          {/* Header */}
          <div className="page-header d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2 className="fw-bold mb-1">
                <i className="bi bi-graph-up text-danger me-2"></i>
                Analytics & Global Requests Tracker
              </h2>
              <p className="text-muted mb-0">
                Track revenue, service distribution, ratings, and all service booking requests
              </p>
            </div>
            <div className="d-flex gap-2">
              <button className="btn btn-outline-danger btn-sm" onClick={refreshAll}>
                <i className="bi bi-arrow-clockwise me-1"></i> Refresh
              </button>
            </div>
          </div>

          {/* Section switcher */}
          <div className="d-flex gap-2 mb-4 flex-wrap">
            <button
              className={`btn ${activeSection === "ANALYTICS" ? "btn-danger fw-bold" : "btn-outline-secondary"}`}
              onClick={() => setActiveSection("ANALYTICS")}
            >
              <i className="bi bi-pie-chart-fill me-1"></i> Insights & Performance
            </button>
            <button
              className={`btn ${activeSection === "REQUESTS" ? "btn-danger fw-bold" : "btn-outline-secondary"}`}
              onClick={() => setActiveSection("REQUESTS")}
            >
              <i className="bi bi-receipt me-1"></i> Global Bookings Log ({requests.length})
            </button>
          </div>

          {/* ===================== SECTION 1: ANALYTICS ===================== */}
          {activeSection === "ANALYTICS" && (
            <div>
              {analyticsLoading || !analytics ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-danger" role="status"></div>
                  <p className="mt-2 text-muted">Calculating platform metrics...</p>
                </div>
              ) : (
                <div className="row g-4">
                  {/* KPI strip */}
                  <div className="col-12">
                    <div className="kpi-grid">
                      {kpis.map((k) => (
                        <div className={`kpi-tile kpi-${k.tone}`} key={k.label}>
                          <div className="kpi-icon">
                            <i className={`bi ${k.icon}`}></i>
                          </div>
                          <div className="kpi-body">
                            <span className="kpi-label">{k.label}</span>
                            <span className="kpi-value">{k.value}</span>
                            {k.hint && <small className="kpi-hint">{k.hint}</small>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Trend over time (full width) */}
                  <div className="col-12">
                    <ChartCard
                      title="Bookings & Revenue Trend"
                      icon="bi-activity"
                      subtitle={`Last ${trendRange} days · ${trendTotals.bookings} bookings · ₹${formatCurrency(trendTotals.revenue)} completed revenue`}
                      minHeight={320}
                      action={
                        <div className="d-flex gap-2 flex-wrap justify-content-end">
                          <div className="segmented" role="group" aria-label="Trend metric">
                            <button
                              className={trendMetric === "bookings" ? "active" : ""}
                              onClick={() => setTrendMetric("bookings")}
                            >
                              Bookings
                            </button>
                            <button
                              className={trendMetric === "revenue" ? "active" : ""}
                              onClick={() => setTrendMetric("revenue")}
                            >
                              Revenue
                            </button>
                          </div>
                          <div className="segmented" role="group" aria-label="Date range">
                            {RANGE_OPTIONS.map((o) => (
                              <button
                                key={o.days}
                                className={trendRange === o.days ? "active" : ""}
                                onClick={() => setTrendRange(o.days)}
                              >
                                {o.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      }
                    >
                      {allRequests.length === 0 ? (
                        <EmptyChart text="No bookings yet to chart" />
                      ) : (
                        <ResponsiveContainer width="100%" height={300}>
                          <AreaChart data={trendData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                            <defs>
                              <linearGradient id="gradTrend" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={trendMetric === "revenue" ? "#10b981" : "#dc2626"} stopOpacity={0.35} />
                                <stop offset="100%" stopColor={trendMetric === "revenue" ? "#10b981" : "#dc2626"} stopOpacity={0.02} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis
                              dataKey="label"
                              tick={axisTick}
                              axisLine={false}
                              tickLine={false}
                              interval={trendRange === 7 ? 0 : "preserveStartEnd"}
                              minTickGap={24}
                            />
                            <YAxis
                              tick={axisTick}
                              axisLine={false}
                              tickLine={false}
                              allowDecimals={false}
                              tickFormatter={(v) => (trendMetric === "revenue" ? `₹${compact(v)}` : v)}
                              width={52}
                            />
                            <RechartsTooltip
                              content={<ChartTooltip currencyKeys={["revenue"]} />}
                              cursor={{ stroke: "#cbd5e1", strokeDasharray: "4 4" }}
                            />
                            <Area
                              type="monotone"
                              dataKey={trendMetric}
                              name={trendMetric === "revenue" ? "Revenue" : "Bookings"}
                              stroke={trendMetric === "revenue" ? "#10b981" : "#dc2626"}
                              strokeWidth={2.5}
                              fill="url(#gradTrend)"
                              activeDot={{ r: 5 }}
                            />
                            {trendMetric === "bookings" && (
                              <Area
                                type="monotone"
                                dataKey="completed"
                                name="Completed"
                                stroke="#10b981"
                                strokeWidth={2}
                                strokeDasharray="5 4"
                                fill="none"
                                dot={false}
                              />
                            )}
                          </AreaChart>
                        </ResponsiveContainer>
                      )}
                    </ChartCard>
                  </div>

                  {/* Status donut */}
                  <div className="col-lg-5">
                    <ChartCard title="Request Status Overview" icon="bi-pie-chart" subtitle="Share of all bookings by status">
                      {pieData.length > 0 && totalStatusCount > 0 ? (
                        <div className="donut-layout">
                          <div className="donut-wrap">
                            <ResponsiveContainer width="100%" height={230}>
                              <PieChart>
                                <Pie
                                  data={pieData}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={68}
                                  outerRadius={98}
                                  paddingAngle={3}
                                  dataKey="value"
                                  stroke="none"
                                >
                                  {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                  ))}
                                </Pie>
                                <RechartsTooltip content={<ChartTooltip />} />
                              </PieChart>
                            </ResponsiveContainer>
                            <div className="donut-center">
                              <strong>{totalStatusCount}</strong>
                              <span>bookings</span>
                            </div>
                          </div>
                          <ul className="legend-list">
                            {pieData.map((p) => (
                              <li key={p.name}>
                                <span className="legend-dot" style={{ background: p.color }} />
                                <span className="legend-name">{p.name.replace("_", " ")}</span>
                                <span className="legend-val">{p.value}</span>
                                <span className="legend-pct">{Math.round((p.value / totalStatusCount) * 100)}%</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <EmptyChart />
                      )}
                    </ChartCard>
                  </div>

                  {/* Category revenue + bookings */}
                  <div className="col-lg-7">
                    <ChartCard
                      title="Category Revenue & Volume"
                      icon="bi-bar-chart-fill"
                      subtitle="Bars show revenue, line shows number of bookings"
                    >
                      {categoryData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={280}>
                          <ComposedChart data={categoryData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="name" tick={axisTick} axisLine={false} tickLine={false} interval={0} />
                            <YAxis
                              yAxisId="rev"
                              tick={axisTick}
                              axisLine={false}
                              tickLine={false}
                              tickFormatter={(v) => `₹${compact(v)}`}
                              width={56}
                            />
                            <YAxis
                              yAxisId="cnt"
                              orientation="right"
                              tick={axisTick}
                              axisLine={false}
                              tickLine={false}
                              allowDecimals={false}
                              width={32}
                            />
                            <RechartsTooltip
                              content={<ChartTooltip currencyKeys={["revenue"]} />}
                              cursor={{ fill: "#f8fafc" }}
                            />
                            <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 6 }} />
                            <Bar yAxisId="rev" dataKey="revenue" name="Revenue" fill="#dc2626" radius={[6, 6, 0, 0]} barSize={36} />
                            <Line
                              yAxisId="cnt"
                              type="monotone"
                              dataKey="bookings"
                              name="Bookings"
                              stroke="#0f172a"
                              strokeWidth={2}
                              dot={{ r: 3, fill: "#0f172a" }}
                            />
                          </ComposedChart>
                        </ResponsiveContainer>
                      ) : (
                        <EmptyChart />
                      )}
                    </ChartCard>
                  </div>

                  {/* Busiest weekdays */}
                  <div className="col-lg-4">
                    <ChartCard title="Busiest Days of the Week" icon="bi-calendar-week" subtitle="When customers book the most">
                      {allRequests.length ? (
                        <ResponsiveContainer width="100%" height={240}>
                          <BarChart data={weekdayData} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="name" tick={axisTick} axisLine={false} tickLine={false} />
                            <YAxis tick={axisTick} axisLine={false} tickLine={false} allowDecimals={false} />
                            <RechartsTooltip content={<ChartTooltip />} cursor={{ fill: "#f8fafc" }} />
                            <Bar dataKey="bookings" name="Bookings" radius={[6, 6, 0, 0]}>
                              {weekdayData.map((d, i) => (
                                <Cell key={i} fill={d.isPeak ? "#dc2626" : "#fecaca"} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <EmptyChart />
                      )}
                    </ChartCard>
                  </div>

                  {/* Top cities */}
                  <div className="col-lg-4">
                    <ChartCard title="Top Cities by Bookings" icon="bi-geo-alt-fill" subtitle="Where demand is concentrated">
                      {cityData.length ? (
                        <ResponsiveContainer width="100%" height={240}>
                          <BarChart data={cityData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                            <XAxis type="number" tick={axisTick} axisLine={false} tickLine={false} allowDecimals={false} />
                            <YAxis type="category" dataKey="name" tick={axisTick} axisLine={false} tickLine={false} width={80} />
                            <RechartsTooltip content={<ChartTooltip />} cursor={{ fill: "#f8fafc" }} />
                            <Bar dataKey="bookings" name="Bookings" fill="#6366f1" radius={[0, 6, 6, 0]} barSize={16} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <EmptyChart text="No city data available" />
                      )}
                    </ChartCard>
                  </div>

                  {/* Rating distribution */}
                  <div className="col-lg-4">
                    <ChartCard
                      title="Customer Rating Breakdown"
                      icon="bi-chat-heart-fill"
                      subtitle={`${totalReviews} total review${totalReviews === 1 ? "" : "s"}`}
                    >
                      {totalReviews > 0 ? (
                        <ResponsiveContainer width="100%" height={240}>
                          <BarChart data={ratingData} layout="vertical" margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                            <XAxis type="number" tick={axisTick} axisLine={false} tickLine={false} allowDecimals={false} />
                            <YAxis type="category" dataKey="name" tick={axisTick} axisLine={false} tickLine={false} width={44} />
                            <RechartsTooltip content={<ChartTooltip />} cursor={{ fill: "#f8fafc" }} />
                            <Bar dataKey="count" name="Reviews" radius={[0, 6, 6, 0]} barSize={16}>
                              {ratingData.map((r) => (
                                <Cell
                                  key={r.star}
                                  fill={r.star >= 4 ? "#10b981" : r.star === 3 ? "#f59e0b" : "#ef4444"}
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <EmptyChart text="No reviews submitted yet" />
                      )}
                    </ChartCard>
                  </div>

                  {/* Top workers chart */}
                  <div className="col-lg-5">
                    <ChartCard title="Top Professionals by Jobs" icon="bi-trophy-fill" subtitle="Completed jobs, with average rating on hover">
                      {topWorkerData.length ? (
                        <ResponsiveContainer width="100%" height={280}>
                          <BarChart data={topWorkerData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="name" tick={axisTick} axisLine={false} tickLine={false} />
                            <YAxis tick={axisTick} axisLine={false} tickLine={false} allowDecimals={false} />
                            <RechartsTooltip
                              cursor={{ fill: "#f8fafc" }}
                              content={({ active, payload }) => {
                                if (!active || !payload?.length) return null;
                                const d = payload[0].payload;
                                return (
                                  <div className="chart-tooltip">
                                    <div className="chart-tooltip-label">{d.fullName}</div>
                                    <div className="chart-tooltip-row">
                                      <span className="chart-tooltip-name">Jobs completed</span>
                                      <strong>{d.jobs}</strong>
                                    </div>
                                    <div className="chart-tooltip-row">
                                      <span className="chart-tooltip-name">Avg rating</span>
                                      <strong>★ {formatRating(d.rating)}</strong>
                                    </div>
                                  </div>
                                );
                              }}
                            />
                            <Bar dataKey="jobs" name="Jobs" fill="#0f172a" radius={[6, 6, 0, 0]} barSize={30} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <EmptyChart />
                      )}
                    </ChartCard>
                  </div>

                  {/* Top rated table */}
                  <div className="col-lg-7">
                    <div className="card chart-card shadow-sm border-0 h-100">
                      <div className="card-header bg-white py-3">
                        <h6 className="mb-0 fw-bold d-flex align-items-center gap-2">
                          <i className="bi bi-award-fill text-danger"></i>
                          Top Rated Service Professionals
                        </h6>
                      </div>
                      <div className="card-body p-0">
                        <div className="table-responsive">
                          <table className="table table-hover align-middle mb-0">
                            <thead className="table-light">
                              <tr>
                                <th>Professional</th>
                                <th>Trade</th>
                                <th>City</th>
                                <th>Rating</th>
                                <th className="text-end">Completed</th>
                              </tr>
                            </thead>
                            <tbody>
                              {analytics.topWorkers?.map((w, idx) => (
                                <tr key={idx}>
                                  <td className="fw-semibold">{w.full_name}</td>
                                  <td><small className="text-muted">{w.categories || "All"}</small></td>
                                  <td><small>{w.primary_city || "N/A"}</small></td>
                                  <td>
                                    <span className="badge bg-warning text-dark">★ {formatRating(w.avg_rating)}</span>
                                  </td>
                                  <td className="text-end fw-bold">{w.total_jobs_completed ?? 0} jobs</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Status tiles */}
                  <div className="col-12">
                    <h5 className="fw-bold mb-3">Detailed Status Distribution</h5>
                    <div className="row g-3">
                      {analytics.statusDistribution?.map((st, i) => (
                        <div className="col-lg-2 col-md-4 col-6" key={i}>
                          <div
                            className="status-metric-tile"
                            style={{ "--tile-accent": STATUS_COLORS[st.status] || "#94a3b8" }}
                          >
                            <span className="status-name">{(st.status || "").replace("_", " ")}</span>
                            <h3 className="mb-0 fw-bold">{st.count ?? 0}</h3>
                            <small className="text-muted">₹{formatCurrency(st.value)}</small>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= SECTION 2: GLOBAL BOOKINGS LOG ================= */}
          {activeSection === "REQUESTS" && (
            <div>
              <div className="card shadow-sm border-0 mb-4">
                <div className="card-body p-3">
                  <div className="row g-2 align-items-center justify-content-between">
                    <div className="col-md-6">
                      <div className="input-group">
                        <span className="input-group-text">
                          <i className="bi bi-search text-muted"></i>
                        </span>
                        <input
                          type="text"
                          className="form-control ps-0"
                          placeholder="Search by code, service, customer or worker..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                          <button className="btn btn-link text-muted text-decoration-none" onClick={() => setSearchTerm("")}>
                            <i className="bi bi-x-circle-fill"></i>
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="col-md-6 d-flex justify-content-md-end gap-2">
                      <select className="form-select w-auto" value={requestFilter} onChange={(e) => setRequestFilter(e.target.value)}>
                        <option value="ALL">All Statuses</option>
                        <option value="PENDING">Pending</option>
                        <option value="ASSIGNED">Assigned</option>
                        <option value="ACCEPTED">Accepted</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="ARRIVED">Arrived</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="CANCELLED">Cancelled</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card shadow-sm border-0">
                <div className="card-body p-0">
                  {requestsLoading ? (
                    <div className="text-center py-5">
                      <div className="spinner-border text-danger" role="status"></div>
                      <p className="mt-2 text-muted">Loading bookings log...</p>
                    </div>
                  ) : filteredRequests.length === 0 ? (
                    <div className="text-center py-5">
                      <i className="bi bi-inbox fs-1 text-muted d-block mb-2"></i>
                      <h5>No Service Requests Found</h5>
                      <p className="text-muted small">No bookings match the selected status filter.</p>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover align-middle mb-0 bookings-table">
                        <thead className="table-light">
                          <tr>
                            <th>Request Code</th>
                            <th>Service & Category</th>
                            <th>Customer</th>
                            <th>Assigned Worker</th>
                            <th>Price</th>
                            <th>Requested At</th>
                            <th>Status</th>
                            <th className="text-end">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredRequests.map((req) => (
                            <tr key={req.request_id}>
                              <td>
                                <span className="fw-mono fw-bold text-dark small">
                                  {req.request_code || `#${req.request_id}`}
                                </span>
                              </td>
                              <td>
                                <strong className="d-block text-dark">{req.service_name}</strong>
                                <small className="text-muted">{req.category_name}</small>
                              </td>
                              <td>
                                <div className="small">
                                  <strong className="d-block">{req.customer_name}</strong>
                                  <span className="text-muted">{req.customer_phone || req.customer_email}</span>
                                </div>
                              </td>
                              <td>
                                {req.worker_name ? (
                                  <div className="small">
                                    <strong className="d-block text-dark">{req.worker_name}</strong>
                                    <span className="text-muted">{req.worker_phone}</span>
                                  </div>
                                ) : (
                                  <span className="badge bg-light text-muted border">Unassigned</span>
                                )}
                              </td>
                              <td>
                                <span className="fw-bold">₹{formatCurrency(req.final_price || req.estimated_price || 0)}</span>
                              </td>
                              <td>
                                <small className="text-muted">{formatDate(req.created_at)}</small>
                              </td>
                              <td>{getStatusBadge(req.status)}</td>
                              <td className="text-end">
                                <div className="btn-group btn-group-sm">
                                  {req.status !== "COMPLETED" && req.status !== "CANCELLED" && (
                                    <>
                                      <button
                                        className="btn btn-outline-primary btn-with-text"
                                        onClick={() => handleOpenReassign(req)}
                                        title="Assign / Reassign Worker"
                                      >
                                        <i className="bi bi-person-plus"></i> Assign
                                      </button>
                                      <button
                                        className="btn btn-outline-danger"
                                        onClick={() => handleCancelRequest(req.request_id)}
                                        title="Cancel Request"
                                      >
                                        <i className="bi bi-x-circle"></i>
                                      </button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Reassign Worker Modal */}
          {reassignModalOpen && selectedRequest && (
            <div className="modal-backdrop-custom">
              <div className="modal-card-custom shadow-lg">
                <div className="modal-header-custom border-bottom p-3 d-flex justify-content-between align-items-center">
                  <h5 className="mb-0 fw-bold">Assign Worker to Request</h5>
                  <button className="btn-close" onClick={() => setReassignModalOpen(false)}></button>
                </div>
                <div className="modal-body-custom p-4">
                  <div className="mb-3 p-3 bg-light rounded">
                    <div className="small text-muted mb-1">Service Request</div>
                    <h6 className="fw-bold mb-1">{selectedRequest.service_name} ({selectedRequest.request_code})</h6>
                    <p className="small text-muted mb-0">Customer: {selectedRequest.customer_name} &middot; {selectedRequest.address_city}</p>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold">Select Approved Worker</label>
                    <select className="form-select" value={selectedWorkerId} onChange={(e) => setSelectedWorkerId(e.target.value)}>
                      <option value="">-- Choose an Available Worker --</option>
                      {availableWorkersForAssignment.map((w) => (
                        <option key={w.user_id} value={w.user_id}>
                          {w.full_name} ({w.primary_city || "City N/A"}) - Rating: {formatRating(w.avg_rating)} ★ ({w.total_jobs_completed ?? 0} jobs)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="modal-footer-custom mt-4 pt-3 border-top d-flex justify-content-end gap-2">
                    <button className="btn btn-secondary" onClick={() => setReassignModalOpen(false)}>Cancel</button>
                    <button className="btn btn-danger px-4" onClick={handleSaveReassign} disabled={reassigning || !selectedWorkerId}>
                      {reassigning ? "Assigning..." : "Confirm Assignment"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default AdminAnalytics;