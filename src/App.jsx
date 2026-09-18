import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { supabase } from "./supabase";
import { Search, Plus, Bell, MapPin, Clock } from "lucide-react";

const sampleReports = [
  {
    id: 1,
    title: "Wi-Fi not working in library",
    category: "Internet",
    location: "Central Library",
    status: "Reported",
    priority: "High",
    time: "10 min ago",
  },
  {
    id: 2,
    title: "Broken chair in classroom",
    category: "Furniture",
    location: "Block A - Room 204",
    status: "In Progress",
    priority: "Medium",
    time: "1 hour ago",
  },
  {
    id: 3,
    title: "Water cooler needs cleaning",
    category: "Cleanliness",
    location: "Block B",
    status: "Resolved",
    priority: "Low",
    time: "Yesterday",
  },
];

function App() {
  const [search, setSearch] = useState("");
  const [reports, setReports] = useState([]);
  const [showAll, setShowAll] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showForm, setShowForm] = useState(false);
  useEffect(() => {
    const fetchReports = async () => {
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
        return;
      }

      setReports(data);
    };

    fetchReports();

    const channel = supabase
      .channel("reports-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "reports",
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setReports((currentReports) => [payload.new, ...currentReports]);
          }

          if (payload.eventType === "UPDATE") {
            setReports((currentReports) =>
              currentReports.map((report) =>
                report.id === payload.new.id ? payload.new : report,
              ),
            );
          }

          if (payload.eventType === "DELETE") {
            setReports((currentReports) =>
              currentReports.filter((report) => report.id !== payload.old.id),
            );
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  const [form, setForm] = useState({
    title: "",
    category: "",
    location: "",
    priority: "medium",
    status: "reported",
    description: "",
    reporter_name: "",
    reporter_email: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { error } = await supabase.from("reports").insert([form]);

    if (error) {
      console.error(error);
      alert("Failed to submit report.");
      return;
    }

    alert("Report submitted successfully!");

    setForm({
      title: "",
      category: "",
      location: "",
      priority: "medium",
      status: "reported",
      description: "",
      reporter_name: "",
      reporter_email: "",
    });

    setShowForm(false);
  };
  const updateStatus = async (id, newStatus) => {
    const { error } = await supabase
      .from("reports")
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      console.error(error);
      alert("Failed to update status.");
      return;
    }

    setReports((currentReports) =>
      currentReports.map((report) =>
        report.id === id ? { ...report, status: newStatus } : report,
      ),
    );
  };

  const formatTime = (date) => {
    const diff = Date.now() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes} min ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;

    const days = Math.floor(hours / 24);
    if (days === 1) return "Yesterday";

    return `${days} days ago`;
  };
  const filteredReports = reports.filter((report) =>
    report.title.toLowerCase().includes(search.toLowerCase()),
  );
  const displayedReports = showAll
    ? filteredReports
    : filteredReports.slice(0, 3);
  const totalReports = reports.length;

  const reportedCount = reports.filter(
    (report) => report.status === "reported",
  ).length;

  const inProgressCount = reports.filter(
    (report) => report.status === "in_progress",
  ).length;

  const resolvedCount = reports.filter(
    (report) => report.status === "resolved",
  ).length;
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-blue-600">
              CampusConnect
            </h1>
            <p className="text-sm text-slate-500">
              Make your campus better, together.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button className="rounded-full p-2 text-slate-500 hover:bg-slate-100">
              <Bell size={20} />
            </button>

            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <Plus size={18} />
              Report Problem
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Welcome */}
        <section className="mb-8">
          <h2 className="text-3xl font-bold">Campus Dashboard</h2>
          <p className="mt-1 text-slate-500">
            Track problems and see what's happening around campus.
          </p>
        </section>

        {/* Stats */}
        <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Total Reports</p>
            <p className="mt-2 text-3xl font-bold">{totalReports}</p>
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Reported</p>
            <p className="mt-2 text-3xl font-bold text-orange-500">
              {reportedCount}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">In Progress</p>
            <p className="mt-2 text-3xl font-bold text-blue-600">
              {inProgressCount}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Resolved</p>
            <p className="mt-2 text-3xl font-bold text-green-600">
              {resolvedCount}
            </p>
          </div>
        </section>

        {/* Search */}
        <section className="mb-6">
          <div className="relative max-w-xl">
            <Search
              size={20}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              placeholder="Search campus problems..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border bg-white py-3 pl-10 pr-4 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </section>

        {/* Reports */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-bold">Recent Reports</h3>

            <button
              onClick={() => setShowAll(!showAll)}
              className="text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              {showAll ? "Show less" : "View all"}
            </button>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {displayedReports.map((report) => (
              <article
                key={report.id}
                onClick={() => setSelectedReport(report)}
                className="cursor-pointer rounded-xl border bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="mb-4 flex items-center justify-between">
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
                    {report.category}
                  </span>

                  <span className="text-xs font-medium text-slate-400">
                    {report.priority} priority
                  </span>
                </div>

                <h4 className="text-lg font-bold">{report.title}</h4>

                <div className="mt-4 space-y-2 text-sm text-slate-500">
                  <div className="flex items-center gap-2">
                    <MapPin size={16} />
                    {report.location}
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock size={16} />
                    {formatTime(report.created_at)}{" "}
                  </div>
                </div>

                <div className="mt-5 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-700">
                      Status
                    </span>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        report.status === "resolved"
                          ? "bg-green-100 text-green-700"
                          : report.status === "in_progress"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-orange-100 text-orange-700"
                      }`}
                    >
                      {report.status === "in_progress"
                        ? "In Progress"
                        : report.status.charAt(0).toUpperCase() +
                          report.status.slice(1)}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {filteredReports.length === 0 && (
            <div className="rounded-xl border bg-white p-10 text-center text-slate-500">
              No reports found.
            </div>
          )}
        </section>
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold">Report a Problem</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Help us improve your campus.
                  </p>
                </div>

                <button
                  onClick={() => setShowForm(false)}
                  className="rounded-lg px-3 py-2 text-slate-500 hover:bg-slate-100"
                >
                  ✕
                </button>
              </div>

              <div className="grid gap-4">
                <input
                  type="text"
                  placeholder="Problem title"
                  className="rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />

                <select
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                  className="rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
                >
                  <option value="">Select category</option>
                  <option>Internet</option>
                  <option>Furniture</option>
                  <option>Cleanliness</option>
                  <option>Electrical</option>
                  <option>Water</option>
                  <option>Other</option>
                </select>

                <input
                  type="text"
                  placeholder="Location"
                  value={form.location}
                  onChange={(e) =>
                    setForm({ ...form, location: e.target.value })
                  }
                  className="rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
                />

                <select
                  value={form.priority}
                  onChange={(e) =>
                    setForm({ ...form, priority: e.target.value })
                  }
                  className="rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
                >
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                  <option value="high">High</option>
                </select>

                <textarea
                  rows="4"
                  placeholder="Describe the problem..."
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  className="rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <input
                    type="text"
                    placeholder="Your name"
                    value={form.reporter_name}
                    onChange={(e) =>
                      setForm({ ...form, reporter_name: e.target.value })
                    }
                    className="rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
                  />
                  <input
                    type="email"
                    placeholder="Your email"
                    value={form.reporter_email}
                    onChange={(e) =>
                      setForm({ ...form, reporter_email: e.target.value })
                    }
                    className="rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSubmit}
                  className="mt-2 rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
                >
                  Submit Report
                </button>
              </div>
            </div>
          </div>
        )}

        {selectedReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
              <div className="mb-6 flex items-start justify-between">
                <div>
                  <h3 className="text-2xl font-bold">{selectedReport.title}</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {selectedReport.category}
                  </p>
                </div>

                <button
                  onClick={() => setSelectedReport(null)}
                  className="rounded-lg px-3 py-2 text-slate-500 hover:bg-slate-100"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-slate-500">
                    Description
                  </p>
                  <p className="mt-1 text-slate-700">
                    {selectedReport.description}
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-500">
                      Location
                    </p>
                    <p className="mt-1 text-slate-700">
                      {selectedReport.location || "Not provided"}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-500">
                      Priority
                    </p>
                    <p className="mt-1 capitalize text-slate-700">
                      {selectedReport.priority}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-500">
                      Status
                    </p>
                    <p className="mt-1 capitalize text-slate-700">
                      {selectedReport.status.replace("_", " ")}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-500">
                      Submitted
                    </p>
                    <p className="mt-1 text-slate-700">
                      {formatTime(selectedReport.created_at)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-500">
                      Reporter
                    </p>
                    <p className="mt-1 text-slate-700">
                      {selectedReport.reporter_name}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-500">
                      Email
                    </p>
                    <p className="mt-1 text-slate-700">
                      {selectedReport.reporter_email}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
function Admin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [search, setSearch] = useState("");
  const [newReportCount, setNewReportCount] = useState(0);
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      setLoggedIn(!!data.session);
    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);
  const filteredReports = reports.filter((report) => {
    const query = search.toLowerCase();

    return (
      report.title?.toLowerCase().includes(query) ||
      report.category?.toLowerCase().includes(query) ||
      report.reporter_name?.toLowerCase().includes(query) ||
      report.reporter_email?.toLowerCase().includes(query) ||
      report.location?.toLowerCase().includes(query)
    );
  });
  console.log("SEARCH:", search, "RESULTS:", filteredReports.length);
  const reportedReports = reports.filter(
    (report) => report.status === "reported",
  );
  const updateReportStatus = async (id, newStatus) => {
    const { error } = await supabase
      .from("reports")
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      console.error(error);
      alert("Failed to update report status.");
      return;
    }

    setReports((currentReports) =>
      currentReports.map((report) =>
        report.id === id ? { ...report, status: newStatus } : report,
      ),
    );

    setSelectedReport((current) =>
      current ? { ...current, status: newStatus } : current,
    );
  };
  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      return;
    }

    setLoggedIn(true);
  };
  useEffect(() => {
    if (!loggedIn) return;

    const fetchReports = async () => {
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
        setLoading(false);
        return;
      }

      setReports(data);
      setLoading(false);
    };

    fetchReports();

    const channel = supabase
      .channel("admin-reports-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "reports",
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setReports((currentReports) => [payload.new, ...currentReports]);
            setNewReportCount((count) => count + 1);
          }

          if (payload.eventType === "UPDATE") {
            setReports((currentReports) =>
              currentReports.map((report) =>
                report.id === payload.new.id ? payload.new : report,
              ),
            );
          }

          if (payload.eventType === "DELETE") {
            setReports((currentReports) =>
              currentReports.filter((report) => report.id !== payload.old.id),
            );
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loggedIn]);
  if (loggedIn) {
    return (
      <div className="min-h-screen bg-slate-50">
        {/* Top Navigation */}
        <header className="border-b bg-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <div>
              <h1 className="text-2xl font-bold text-blue-600">
                CampusConnect
              </h1>
              <p className="text-sm text-slate-500">Admin Portal</p>
            </div>

            <button
              onClick={() => setLoggedIn(false)}
              className="rounded-lg border px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="mx-auto max-w-7xl px-6 py-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-900">Dashboard</h2>

            <p className="mt-1 text-slate-500">
              Manage and track campus reports.
            </p>
            {newReportCount > 0 && (
              <div className="mb-6 flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-blue-700">
                <span>
                  🔔 {newReportCount} new report{newReportCount > 1 ? "s" : ""}{" "}
                  received
                </span>

                <button
                  onClick={() => setNewReportCount(0)}
                  className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Mark as read
                </button>
              </div>
            )}
          </div>
          <div className="mb-8">
            <div className="relative">
              <Search
                size={20}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title, category, name, email or location..."
                className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>
          {loading && (
            <div className="mb-6 rounded-xl border border-slate-200 bg-white px-4 py-4 text-center text-slate-500">
              Loading reports...
            </div>
          )}
          {/* Statistics */}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-500">
                Total Reports
              </p>

              <p className="mt-2 text-3xl font-bold text-slate-900">
                {reports.length}
              </p>
            </div>

            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-500">Reported</p>

              <p className="mt-2 text-3xl font-bold text-orange-600">
                {
                  reports.filter((report) => report.status === "reported")
                    .length
                }
              </p>
            </div>

            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-500">In Progress</p>

              <p className="mt-2 text-3xl font-bold text-blue-600">
                {
                  reports.filter((report) => report.status === "in_progress")
                    .length
                }
              </p>
            </div>

            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-500">Resolved</p>

              <p className="mt-2 text-3xl font-bold text-green-600">
                {
                  reports.filter((report) => report.status === "resolved")
                    .length
                }
              </p>
            </div>
          </div>
          {/* Reported Reports */}
          <div className="mt-8">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Reported</h3>
                <p className="mt-1 text-sm text-slate-500">
                  New campus reports waiting for action.
                </p>
              </div>

              <span className="rounded-full bg-orange-50 px-3 py-1 text-sm font-semibold text-orange-600">
                {
                  reports.filter((report) => report.status === "reported")
                    .length
                }
              </span>
            </div>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {filteredReports
                .filter((report) => report.status === "reported")
                .map((report) => (
                  <article
                    key={report.id}
                    onClick={() => setSelectedReport(report)}
                    className="cursor-pointer rounded-2xl border bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="font-bold text-slate-900">
                          {report.title}
                        </h4>

                        <p className="mt-1 text-sm text-slate-500">
                          {report.category}
                        </p>
                      </div>

                      <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
                        {report.priority}
                      </span>
                    </div>

                    <p className="mt-4 text-slate-700">{report.description}</p>

                    <div className="mt-4 space-y-2 border-t pt-4 text-sm text-slate-600">
                      <p>📍 {report.location || "Location not provided"}</p>
                      <p>👤 {report.reporter_name}</p>
                      <p>✉️ {report.reporter_email}</p>
                      <p>{new Date(report.created_at).toLocaleString()}</p>
                    </div>

                    <div className="mt-4">
                      <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">
                        Reported
                      </span>
                    </div>
                  </article>
                ))}
            </div>
            {/* In Progress Reports */}
            <div className="mt-10">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    In Progress
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Reports currently being worked on.
                  </p>
                </div>

                <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-600">
                  {
                    reports.filter((report) => report.status === "in_progress")
                      .length
                  }
                </span>
              </div>

              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {filteredReports
                  .filter((report) => report.status === "in_progress")
                  .map((report) => (
                    <article
                      key={report.id}
                      onClick={() => setSelectedReport(report)}
                      className="cursor-pointer rounded-2xl border bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="font-bold text-slate-900">
                            {report.title}
                          </h4>

                          <p className="mt-1 text-sm text-slate-500">
                            {report.category}
                          </p>
                        </div>

                        <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold capitalize text-blue-700">
                          {report.priority}
                        </span>
                      </div>

                      <p className="mt-4 line-clamp-2 text-sm text-slate-600">
                        {report.description}
                      </p>

                      <div className="mt-5 border-t pt-4">
                        <p className="text-sm text-slate-500">
                          📍 {report.location || "Location not provided"}
                        </p>

                        <p className="mt-2 text-sm text-slate-500">
                          👤 {report.reporter_name}
                        </p>

                        <div className="mt-4 flex items-center justify-between">
                          <span className="text-xs text-slate-400">
                            {new Date(report.created_at).toLocaleString()}
                          </span>

                          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                            In Progress
                          </span>
                        </div>
                      </div>
                    </article>
                  ))}
              </div>
            </div>
            {/* Resolved Reports */}
            <div className="mt-10">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Resolved</h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Campus reports that have been resolved.
                  </p>
                </div>

                <span className="rounded-full bg-green-50 px-3 py-1 text-sm font-semibold text-green-600">
                  {
                    reports.filter((report) => report.status === "resolved")
                      .length
                  }
                </span>
              </div>

              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {filteredReports
                  .filter((report) => report.status === "resolved")
                  .map((report) => (
                    <article
                      key={report.id}
                      onClick={() => setSelectedReport(report)}
                      className="cursor-pointer rounded-2xl border bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="font-bold text-slate-900">
                            {report.title}
                          </h4>

                          <p className="mt-1 text-sm text-slate-500">
                            {report.category}
                          </p>
                        </div>

                        <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold capitalize text-green-700">
                          {report.priority}
                        </span>
                      </div>

                      <p className="mt-4 line-clamp-2 text-sm text-slate-600">
                        {report.description}
                      </p>

                      <div className="mt-5 border-t pt-4">
                        <p className="text-sm text-slate-500">
                          📍 {report.location || "Location not provided"}
                        </p>

                        <p className="mt-2 text-sm text-slate-500">
                          👤 {report.reporter_name}
                        </p>

                        <div className="mt-4 flex items-center justify-between">
                          <span className="text-xs text-slate-400">
                            {new Date(report.created_at).toLocaleString()}
                          </span>

                          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                            Resolved
                          </span>
                        </div>
                      </div>
                    </article>
                  ))}
              </div>
            </div>
          </div>
        </main>
        {selectedReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
              <div className="mb-6 flex items-start justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">
                    {selectedReport.title}
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    {selectedReport.category}
                  </p>
                </div>

                <button
                  onClick={() => setSelectedReport(null)}
                  className="rounded-lg px-3 py-2 text-slate-500 hover:bg-slate-100"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-5">
                <div>
                  <p className="text-sm font-semibold text-slate-500">
                    Description
                  </p>

                  <p className="mt-1 text-slate-700">
                    {selectedReport.description}
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-500">
                      Location
                    </p>
                    <p className="mt-1 text-slate-700">
                      {selectedReport.location || "Not provided"}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-500">
                      Priority
                    </p>
                    <p className="mt-1 capitalize text-slate-700">
                      {selectedReport.priority}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-500">
                      Reporter
                    </p>
                    <p className="mt-1 text-slate-700">
                      {selectedReport.reporter_name}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-500">
                      Email
                    </p>
                    <p className="mt-1 text-slate-700">
                      {selectedReport.reporter_email}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-500">
                      Status
                    </p>
                    <p className="mt-1 capitalize text-slate-700">
                      {selectedReport.status.replace("_", " ")}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-500">
                      Submitted
                    </p>
                    <p className="mt-1 text-slate-700">
                      {new Date(selectedReport.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="mt-6 flex flex-wrap gap-3 border-t pt-5">
                    <button
                      onClick={() =>
                        updateReportStatus(selectedReport.id, "in_progress")
                      }
                      className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-700"
                    >
                      Mark In Progress
                    </button>

                    <button
                      onClick={() =>
                        updateReportStatus(selectedReport.id, "resolved")
                      }
                      className="rounded-lg bg-green-600 px-4 py-2 font-semibold text-white transition hover:bg-green-700"
                    >
                      Mark Resolved
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md rounded-2xl border bg-white p-8 shadow-xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-blue-600">CampusConnect</h1>

          <h2 className="mt-2 text-xl font-bold text-slate-900">
            Admin Portal
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Sign in to manage campus reports.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">
              Email
            </label>
            <input
              type="text"
              placeholder="Enter admin email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">
              Password
            </label>

            <input
              type="password"
              placeholder="Enter admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>

          <button
            type="button"
            onClick={handleLogin}
            className="w-full rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
          >
            Login
          </button>
        </div>
      </div>
    </div>
  );
}
function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;
