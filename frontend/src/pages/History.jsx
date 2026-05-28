import { useState, useEffect } from "react";
import "./History.css";
import { API_URL } from "../config";

function History() {
  const [sessions, setSessions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [filterSubject, setFilterSubject] = useState("");
  const [filterRange, setFilterRange] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSessions();
    fetchSubjects();
  }, [filterSubject, filterRange]);

  const fetchSessions = async () => {
    let url = `${API_URL}/sessions?`;
    if (filterSubject) url += `subject_id=${filterSubject}&`;
    if (filterRange) url += `range=${filterRange}`;
    const res = await fetch(url);
    const data = await res.json();
    setSessions(data);
    setLoading(false);
  };

  const fetchSubjects = async () => {
    const res = await fetch(`${API_URL}/subjects`);
    const data = await res.json();
    setSubjects(data);
  };

  const deleteSession = async (id) => {
    await fetch(`${API_URL}/sessions/${id}`, { method: "DELETE" });
    fetchSessions();
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("ko-KR", {
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="history-page">
      <h2>히스토리</h2>

      {/* 필터 */}
      <div className="history-filters">
        <div className="filter-group">
          <span
            className={
              filterRange === "all" ? "filter-chip active" : "filter-chip"
            }
            onClick={() => setFilterRange("all")}
          >
            전체
          </span>
          <span
            className={
              filterRange === "week" ? "filter-chip active" : "filter-chip"
            }
            onClick={() => setFilterRange("week")}
          >
            이번 주
          </span>
          <span
            className={
              filterRange === "month" ? "filter-chip active" : "filter-chip"
            }
            onClick={() => setFilterRange("month")}
          >
            이번 달
          </span>
        </div>

        <select
          className="timer-select"
          value={filterSubject}
          onChange={(e) => setFilterSubject(e.target.value)}
        >
          <option value="">전체 과목</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {/* 세션 목록 */}
      {loading ? (
        <p className="loading-text">불러오는 중...</p>
      ) : sessions.length === 0 ? (
        <p className="empty-text">기록이 없어요 😴</p>
      ) : (
        <ul className="session-list">
          {sessions.map((s) => (
            <li key={s.id} className="session-item">
              <div className="session-info">
                <span className="session-subject">{s.subject_name}</span>
                <span className="session-date">{formatDate(s.created_at)}</span>
              </div>
              <div className="session-right">
                <span className="session-duration">{s.duration}분</span>
                <button
                  className="icon-btn danger"
                  onClick={() => deleteSession(s.id)}
                >
                  ×
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default History;
