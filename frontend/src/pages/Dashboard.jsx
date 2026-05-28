import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import "./Dashboard.css";

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch("http://127.0.0.1:5000/stats");
      const data = await res.json();
      setStats(data);
    } catch (e) {
      console.log("통계 불러오기 실패", e);
    }
    setLoading(false);
  };

  if (loading) return <p className="loading-text">불러오는 중...</p>;
  if (!stats) return <p className="empty-text">데이터가 없어요</p>;

  // 요일 데이터 변환
  const weekdayData = Object.entries(stats.by_weekday).map(
    ([day, minutes]) => ({
      day,
      minutes,
    }),
  );

  return (
    <div className="dashboard-page">
      <h2>대시보드</h2>

      {/* 요약 카드 */}
      <div className="stat-cards">
        <div className="stat-card">
          <span className="stat-label">연속 기록</span>
          <span className="stat-value accent">{stats.streak}일</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">총 집중 시간</span>
          <span className="stat-value">{stats.total_hours}h</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">이번 주 세션</span>
          <span className="stat-value">{stats.sessions_this_week}회</span>
        </div>
      </div>

      {/* 과목별 차트 */}
      <div className="chart-section">
        <h3>과목별 집중 시간</h3>
        {stats.by_subject.length === 0 ? (
          <p className="empty-text">데이터 없음</p>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={stats.by_subject}>
              <XAxis dataKey="name" stroke="#a0a0b8" />
              <YAxis stroke="#a0a0b8" />
              <Tooltip
                contentStyle={{
                  background: "#2a2a3e",
                  border: "1px solid #404058",
                  borderRadius: "8px",
                  color: "#fff",
                }}
              />
              <Bar dataKey="minutes" fill="#e24b4a" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* 요일별 차트 */}
      <div className="chart-section">
        <h3>주간 패턴</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={weekdayData}>
            <XAxis dataKey="day" stroke="#a0a0b8" />
            <YAxis stroke="#a0a0b8" />
            <Tooltip
              contentStyle={{
                background: "#2a2a3e",
                border: "1px solid #404058",
                borderRadius: "8px",
                color: "#fff",
              }}
            />
            <Bar dataKey="minutes" radius={[6, 6, 0, 0]}>
              {weekdayData.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.minutes > 0 ? "#4aaee8" : "#404058"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default Dashboard;
