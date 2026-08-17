import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { deletePost, fetchAdminDashboard, fetchAdminReports, reviewAdminReport, setUserSuspension } from "../api";
import "./Admin.css";

const STAT_LABELS = { totalUsers: "Total users", totalPosts: "Total posts", totalReports: "Open reports", activeUsers: "Active users (30 days)", suspendedUsers: "Suspended users" };

export default function Admin() {
  const [user] = useState(() => JSON.parse(localStorage.getItem("user") || "null"));
  const [stats, setStats] = useState(null);
  const [reports, setReports] = useState([]);
  const [notice, setNotice] = useState("");
  const [busyId, setBusyId] = useState("");

  const load = async () => {
    try {
      const [statsResponse, reportsResponse] = await Promise.all([fetchAdminDashboard(user._id), fetchAdminReports(user._id)]);
      setStats(statsResponse.data); setReports(reportsResponse.data);
    } catch (error) { setNotice(error.response?.data?.message || "Could not load the moderation dashboard."); }
  };
  useEffect(() => { if (user?.role === "admin") load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  if (!user || user.role !== "admin") return <Navigate to="/" replace />;

  const act = async (report, action, duration) => {
    setBusyId(report.reportId);
    try {
      if (action === "approve" || action === "dismiss") await reviewAdminReport(report.postId, user._id, report.reportId, action);
      if (action === "delete") await deletePost(report.postId, user._id, true);
      if (action === "suspend") {
        const reason = window.prompt("Suspension reason", `Reports against this account: ${report.reason}`) || "Community guideline violation";
        await setUserSuspension(report.author?._id, user._id, duration, reason);
      }
      setNotice("Moderation action completed.");
      await load();
    } catch (error) { setNotice(error.response?.data?.message || "Moderation action failed."); }
    finally { setBusyId(""); }
  };

  return <div className="admin-page"><div className="admin-heading"><div><h1>Admin Dashboard</h1><p>Monitor community health and review reported content.</p></div><button onClick={load}>Refresh</button></div>{notice && <div className="admin-notice">{notice}</div>}<section className="admin-stats">{stats ? Object.entries(STAT_LABELS).map(([key, label]) => <div className="stat-card" key={key}><span>{label}</span><strong>{stats[key] ?? 0}</strong></div>) : <p>Loading dashboard…</p>}</section><section className="report-management"><h2>Report Management</h2>{reports.length === 0 ? <p className="empty-reports">No open reports.</p> : reports.map((report) => <article key={report.reportId} className="report-card"><div className="report-content"><p className="reported-post">{report.content}</p><dl><div><dt>Author</dt><dd>{report.author?.name || "Unknown"}</dd></div><div><dt>Reporter</dt><dd>{report.reporter?.name || "Unknown"}</dd></div><div><dt>Reason</dt><dd>{report.reason}</dd></div><div><dt>Reports</dt><dd>{report.reportCount}</dd></div><div><dt>Created</dt><dd>{new Date(report.createdAt).toLocaleString()}</dd></div></dl></div><div className="report-actions"><button disabled={busyId === report.reportId} onClick={() => act(report, "approve")}>Approve report</button><button disabled={busyId === report.reportId} onClick={() => act(report, "dismiss")}>Dismiss report</button><button className="danger" disabled={busyId === report.reportId} onClick={() => act(report, "delete")}>Delete post</button><select defaultValue="7d" aria-label="Suspension duration" onChange={(event) => act(report, "suspend", event.target.value)} disabled={busyId === report.reportId}><option value="">Suspend user…</option><option value="1d">Suspend 1 day</option><option value="7d">Suspend 7 days</option><option value="30d">Suspend 30 days</option><option value="permanent">Suspend permanently</option></select></div></article>)}</section></div>;
}
