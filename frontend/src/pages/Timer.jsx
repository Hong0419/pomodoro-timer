import { useState } from "react";
import "./Timer.css";

const pad = (n) => String(Math.max(0, n)).padStart(2, "0");
const fmtTime = (sec) => `${pad(Math.floor(sec / 60))}:${pad(sec % 60)}`;

const R = 110;
const CIRC = 2 * Math.PI * R;

function CircleTimer({ timeLeft, total, isBreak, isRunning }) {
  const ratio = total > 0 ? timeLeft / total : 1;
  const offset = CIRC * (1 - ratio);
  return (
    <div className={`circle-timer ${isBreak ? "break-mode" : "work-mode"}`}>
      <svg viewBox="0 0 260 260" className="circle-svg">
        <circle cx="130" cy="130" r={R} className="track" />
        <circle
          cx="130"
          cy="130"
          r={R}
          className="progress"
          strokeDasharray={CIRC}
          strokeDashoffset={offset}
          style={{
            transition: isRunning ? "stroke-dashoffset 1s linear" : "none",
          }}
        />
      </svg>
      <div className="circle-inner">
        <span className="phase-label">{isBreak ? "휴식" : "작업"}</span>
        <span className="time-display">{fmtTime(timeLeft)}</span>
        {isRunning && <span className="pulse-dot" />}
      </div>
    </div>
  );
}

export default function Timer({
  workMin,
  setWorkMin,
  workSec,
  setWorkSec,
  breakMin,
  setBreakMin,
  breakSec,
  setBreakSec,
  autoBreak,
  setAutoBreak,
  subjects,
  setSubjects,
  selectedSubject,
  setSelectedSubject,
  isRunning,
  setIsRunning,
  isBreak,
  timeLeft,
  sessions,
  favorites,
  setFavorites,
  notifSettings,
  setNotifSettings,
  isDark,
  setIsDark,
  playSound,
  workTotal,
  breakTotal,
  handleReset,
  handleSkip,
}) {
  const currentTotal = isBreak ? breakTotal : workTotal;
  const progress =
    currentTotal > 0 ? (currentTotal - timeLeft) / currentTotal : 0;

  const [newSubject, setNewSubject] = useState("");
  const [showSubjectInput, setShowSubjectInput] = useState(false);
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [selectedFavorite, setSelectedFavorite] = useState("");

  const addSubject = () => {
    const trimmed = newSubject.trim();
    if (trimmed && !subjects.includes(trimmed)) {
      setSubjects((p) => [...p, trimmed]);
      setSelectedSubject(trimmed);
    }
    setNewSubject("");
    setShowSubjectInput(false);
  };

  const removeSubject = (s) => {
    if (subjects.length <= 1) return;
    const next = subjects.filter((x) => x !== s);
    setSubjects(next);
    if (selectedSubject === s) setSelectedSubject(next[0]);
  };

  const saveFavorite = () => {
    const name = prompt("즐겨찾기 이름을 입력하세요:");
    if (!name) return;
    const newFav = {
      name,
      subject: selectedSubject,
      workMin,
      workSec,
      breakMin,
      breakSec,
      autoBreak,
    };
    const updated = [...favorites, newFav];
    setFavorites(updated);
    localStorage.setItem("favorites", JSON.stringify(updated));
  };

  const deleteFavorite = (index) => {
    const updated = favorites.filter((_, i) => i !== Number(index));
    setFavorites(updated);
    localStorage.setItem("favorites", JSON.stringify(updated));
    setSelectedFavorite("");
  };

  const loadFavorite = (index) => {
    if (index === "") return;
    const f = favorites[Number(index)];
    setSelectedSubject(f.subject);
    setWorkMin(f.workMin);
    setWorkSec(f.workSec);
    setBreakMin(f.breakMin);
    setBreakSec(f.breakSec);
    setAutoBreak(f.autoBreak);
    setSelectedFavorite(index);
  };

  return (
    <div className="timer-page">
      {/* 상단 바 */}
      <div className="top-bar">
        <select
          className="favorite-select"
          value={selectedFavorite}
          onChange={(e) => loadFavorite(e.target.value)}
        >
          <option value="">즐겨찾기 선택</option>
          {favorites.map((f, i) => (
            <option key={i} value={i}>
              {f.name}
            </option>
          ))}
        </select>
        <button
          className="icon-btn"
          onClick={saveFavorite}
          title="즐겨찾기 저장"
        >
          ★
        </button>
        <button
          className="icon-btn danger"
          title="즐겨찾기 삭제"
          onClick={() =>
            selectedFavorite !== "" && deleteFavorite(selectedFavorite)
          }
          disabled={selectedFavorite === ""}
        >
          ×
        </button>
        <div className="top-bar-right">
          <button className="icon-btn" onClick={() => setShowNotifModal(true)}>
            🔔
          </button>
          <button className="icon-btn" onClick={() => setShowManualModal(true)}>
            ?
          </button>
          <button className="icon-btn" onClick={() => setIsDark((p) => !p)}>
            {isDark ? "🌙" : "☀️"}
          </button>
        </div>
      </div>

      {/* 설정 카드 */}
      <div className="settings-card">
        <div className="setting-row">
          <label className="setting-label">과목</label>
          <div className="subject-controls">
            <select
              className="timer-select"
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              disabled={isRunning}
            >
              {subjects.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            {!isRunning && (
              <>
                <button
                  className="icon-btn"
                  onClick={() => setShowSubjectInput((p) => !p)}
                >
                  +
                </button>
                <button
                  className="icon-btn danger"
                  onClick={() => removeSubject(selectedSubject)}
                  disabled={subjects.length <= 1}
                >
                  ×
                </button>
              </>
            )}
          </div>
          {showSubjectInput && (
            <div className="subject-input-row">
              <input
                className="subject-input"
                placeholder="새 과목 이름"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addSubject()}
                autoFocus
              />
              <button className="btn-confirm" onClick={addSubject}>
                확인
              </button>
            </div>
          )}
        </div>

        <div className="setting-row">
          <label className="setting-label">작업</label>
          <div className="time-inputs">
            <input
              type="number"
              className="time-input"
              value={workMin}
              onChange={(e) => setWorkMin(e.target.value)}
              min="0"
              max="99"
              disabled={isRunning && !isBreak}
            />
            <span className="time-sep">분</span>
            <input
              type="number"
              className="time-input"
              value={workSec}
              onChange={(e) => setWorkSec(e.target.value)}
              min="0"
              max="59"
              disabled={isRunning && !isBreak}
            />
            <span className="time-sep">초</span>
          </div>
        </div>

        <div className="setting-row">
          <label className="setting-label">휴식</label>
          <div className="time-inputs">
            <input
              type="number"
              className="time-input"
              value={breakMin}
              onChange={(e) => setBreakMin(e.target.value)}
              min="0"
              max="99"
              disabled={isRunning && isBreak}
            />
            <span className="time-sep">분</span>
            <input
              type="number"
              className="time-input"
              value={breakSec}
              onChange={(e) => setBreakSec(e.target.value)}
              min="0"
              max="59"
              disabled={isRunning && isBreak}
            />
            <span className="time-sep">초</span>
          </div>
        </div>

        <div className="setting-row">
          <label className="setting-label">자동휴식</label>
          <button
            className={`toggle-btn ${autoBreak ? "on" : ""}`}
            onClick={() => setAutoBreak((p) => !p)}
          >
            <span className="toggle-thumb" />
          </button>
        </div>
      </div>

      {/* 원형 타이머 */}
      <CircleTimer
        timeLeft={timeLeft}
        total={currentTotal}
        isBreak={isBreak}
        isRunning={isRunning}
      />

      {/* 뽀모도로 카운트 */}
      <div className="session-count">
        {Array.from({ length: sessions }).map((_, i) => (
          <span key={i} className="tomato">
            🍅
          </span>
        ))}
        {sessions > 0 && (
          <span className="session-text">{sessions}회 완료</span>
        )}
      </div>

      {/* 버튼 */}
      <div className="timer-buttons">
        <button className="btn-primary" onClick={() => setIsRunning((p) => !p)}>
          {isRunning ? "일시정지" : timeLeft === currentTotal ? "시작" : "재개"}
        </button>
        <button className="btn-secondary" onClick={handleSkip}>
          건너뛰기
        </button>
        <button className="btn-ghost" onClick={handleReset}>
          초기화
        </button>
      </div>

      {/* 진행 바 */}
      <div className="progress-bar-wrap">
        <div
          className={`progress-bar-fill ${isBreak ? "break" : "work"}`}
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {/* 알림 설정 팝업 */}
      {showNotifModal && (
        <div className="modal-overlay" onClick={() => setShowNotifModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>알림 설정</h3>
            <div className="modal-row">
              <label>전체 알림</label>
              <button
                className={`toggle-btn ${notifSettings.allEnabled ? "on" : ""}`}
                onClick={() =>
                  setNotifSettings((p) => ({ ...p, allEnabled: !p.allEnabled }))
                }
              >
                <span className="toggle-thumb" />
              </button>
            </div>
            <div className="modal-row">
              <label>작업 알림</label>
              <button
                className={`toggle-btn ${notifSettings.workAlertEnabled ? "on" : ""}`}
                onClick={() =>
                  setNotifSettings((p) => ({
                    ...p,
                    workAlertEnabled: !p.workAlertEnabled,
                  }))
                }
              >
                <span className="toggle-thumb" />
              </button>
            </div>
            {notifSettings.workAlertEnabled && (
              <div className="modal-row indent">
                <label>종료</label>
                <input
                  type="number"
                  className="time-input"
                  value={notifSettings.workAlertMin}
                  onChange={(e) =>
                    setNotifSettings((p) => ({
                      ...p,
                      workAlertMin: e.target.value,
                    }))
                  }
                  min="0"
                  max="99"
                />
                <span className="time-sep">분</span>
                <input
                  type="number"
                  className="time-input"
                  value={notifSettings.workAlertSec}
                  onChange={(e) =>
                    setNotifSettings((p) => ({
                      ...p,
                      workAlertSec: e.target.value,
                    }))
                  }
                  min="0"
                  max="59"
                />
                <span className="time-sep">초 전</span>
              </div>
            )}
            <div className="modal-row">
              <label>휴식 알림</label>
              <button
                className={`toggle-btn ${notifSettings.breakAlertEnabled ? "on" : ""}`}
                onClick={() =>
                  setNotifSettings((p) => ({
                    ...p,
                    breakAlertEnabled: !p.breakAlertEnabled,
                  }))
                }
              >
                <span className="toggle-thumb" />
              </button>
            </div>
            {notifSettings.breakAlertEnabled && (
              <div className="modal-row indent">
                <label>종료</label>
                <input
                  type="number"
                  className="time-input"
                  value={notifSettings.breakAlertMin}
                  onChange={(e) =>
                    setNotifSettings((p) => ({
                      ...p,
                      breakAlertMin: e.target.value,
                    }))
                  }
                  min="0"
                  max="99"
                />
                <span className="time-sep">분</span>
                <input
                  type="number"
                  className="time-input"
                  value={notifSettings.breakAlertSec}
                  onChange={(e) =>
                    setNotifSettings((p) => ({
                      ...p,
                      breakAlertSec: e.target.value,
                    }))
                  }
                  min="0"
                  max="59"
                />
                <span className="time-sep">초 전</span>
              </div>
            )}
            <div className="modal-row">
              <label>알림음</label>
              <select
                className="timer-select"
                value={notifSettings.soundType}
                onChange={(e) =>
                  setNotifSettings((p) => ({ ...p, soundType: e.target.value }))
                }
              >
                <option value="beep">비프</option>
                <option value="bell">벨</option>
                <option value="chime">차임</option>
                <option value="file">파일 업로드</option>
              </select>
            </div>
            {notifSettings.soundType === "file" && (
              <div className="modal-row">
                <input
                  type="file"
                  accept=".mp3,.wav"
                  onChange={(e) =>
                    setNotifSettings((p) => ({
                      ...p,
                      soundFile: e.target.files[0],
                    }))
                  }
                />
              </div>
            )}
            <div className="modal-row">
              <button
                className="btn-secondary"
                onClick={() => playSound(notifSettings.soundType)}
              >
                🔊 테스트
              </button>
            </div>
            <button
              className="btn-confirm"
              onClick={() => setShowNotifModal(false)}
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {/* 매뉴얼 팝업 */}
      {showManualModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowManualModal(false)}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>사용법</h3>
            <ol className="manual-list">
              <li>
                <strong>과목 설정</strong> — 드롭다운에서 과목 선택, + 추가, ×
                삭제
              </li>
              <li>
                <strong>시간 설정</strong> — 작업/휴식 시간을 분·초 단위로 입력
              </li>
              <li>
                <strong>자동휴식</strong> — 켜면 작업 종료 후 자동으로 휴식 시작
              </li>
              <li>
                <strong>시작/일시정지</strong> — 버튼으로 타이머 제어
              </li>
              <li>
                <strong>건너뛰기</strong> — 현재 단계 건너뛰기
              </li>
              <li>
                <strong>즐겨찾기</strong> — ★ 저장, 드롭다운 불러오기, × 삭제
              </li>
              <li>
                <strong>알림 설정</strong> — 🔔 알림음·시간 설정
              </li>
              <li>
                <strong>다크/라이트 모드</strong> — 🌙/☀️ 전환
              </li>
            </ol>
            <button
              className="btn-confirm"
              onClick={() => setShowManualModal(false)}
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
