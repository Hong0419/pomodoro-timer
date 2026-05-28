import { useState, useEffect, useRef, useCallback } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Timer from "./pages/Timer";
import History from "./pages/History";
import Dashboard from "./pages/Dashboard";
import Nav from "./Nav";
import "./App.css";
import { API_URL } from "./config";

const toSec = (m, s) => Number(m) * 60 + Number(s);

export default function App() {
  const [workMin, setWorkMin] = useState(() => {
    const saved = localStorage.getItem("workMin");
    return saved !== null ? Number(saved) : 50;
  });
  const [workSec, setWorkSec] = useState(
    () => Number(localStorage.getItem("workSec")) || 0,
  );
  const [breakMin, setBreakMin] = useState(() => {
    const saved = localStorage.getItem("breakMin");
    return saved !== null ? Number(saved) : 10;
  });
  const [breakSec, setBreakSec] = useState(
    () => Number(localStorage.getItem("breakSec")) || 0,
  );
  const [autoBreak, setAutoBreak] = useState(
    () => localStorage.getItem("autoBreak") === "true",
  );
  const [subjects, setSubjects] = useState(() => {
    const s = localStorage.getItem("subjects");
    return s ? JSON.parse(s) : ["업무", "독서", "공부", "운동"];
  });
  const [selectedSubject, setSelectedSubject] = useState(
    () => localStorage.getItem("selectedSubject") || "업무",
  );
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [timeLeft, setTimeLeft] = useState(() =>
    toSec(
      Number(localStorage.getItem("workMin")) || 50,
      Number(localStorage.getItem("workSec")) || 0,
    ),
  );
  const [sessions, setSessions] = useState(0);
  const [favorites, setFavorites] = useState(() => {
    const s = localStorage.getItem("favorites");
    return s ? JSON.parse(s) : [];
  });
  const [notifSettings, setNotifSettings] = useState(() => {
    const s = localStorage.getItem("notifSettings");
    return s
      ? JSON.parse(s)
      : {
          workAlertMin: 0,
          workAlertSec: 0,
          workAlertEnabled: false,
          breakAlertMin: 0,
          breakAlertSec: 0,
          breakAlertEnabled: false,
          allEnabled: true,
          soundType: "beep",
        };
  });
  const [isDark, setIsDark] = useState(
    () => localStorage.getItem("isDark") !== "false",
  );

  useEffect(() => {
    localStorage.setItem("workMin", workMin);
  }, [workMin]);
  useEffect(() => {
    localStorage.setItem("workSec", workSec);
  }, [workSec]);
  useEffect(() => {
    localStorage.setItem("breakMin", breakMin);
  }, [breakMin]);
  useEffect(() => {
    localStorage.setItem("breakSec", breakSec);
  }, [breakSec]);
  useEffect(() => {
    localStorage.setItem("autoBreak", autoBreak);
  }, [autoBreak]);
  useEffect(() => {
    localStorage.setItem("subjects", JSON.stringify(subjects));
  }, [subjects]);
  useEffect(() => {
    localStorage.setItem("selectedSubject", selectedSubject);
  }, [selectedSubject]);
  useEffect(() => {
    localStorage.setItem("notifSettings", JSON.stringify(notifSettings));
  }, [notifSettings]);
  useEffect(() => {
    localStorage.setItem("isDark", isDark);
  }, [isDark]);
  useEffect(() => {
    document.body.classList.toggle("light-mode", !isDark);
  }, [isDark]);

  const workTotal = toSec(workMin, workSec);
  const breakTotal = toSec(breakMin, breakSec);

  const intervalRef = useRef(null);
  const isBreakRef = useRef(isBreak);
  const autoBreakRef = useRef(autoBreak);
  const breakTotalRef = useRef(breakTotal);
  const workTotalRef = useRef(workTotal);
  const notifRef = useRef(notifSettings);

  useEffect(() => {
    isBreakRef.current = isBreak;
  }, [isBreak]);
  useEffect(() => {
    autoBreakRef.current = autoBreak;
  }, [autoBreak]);
  useEffect(() => {
    breakTotalRef.current = breakTotal;
  }, [breakTotal]);
  useEffect(() => {
    workTotalRef.current = workTotal;
  }, [workTotal]);
  useEffect(() => {
    notifRef.current = notifSettings;
  }, [notifSettings]);

  const playSound = useCallback((type) => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      if (type === "bell") {
        osc.type = "sine";
        osc.frequency.value = 660;
      } else if (type === "chime") {
        osc.type = "triangle";
        osc.frequency.value = 523;
      } else {
        osc.type = "square";
        osc.frequency.value = 880;
      }
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 1.5);
    } catch (e) {
      console.log("소리 오류", e);
    }
  }, []);
  const selectedSubjectRef = useRef(selectedSubject);
  useEffect(() => {
    selectedSubjectRef.current = selectedSubject;
  }, [selectedSubject]);

  const saveSessionToDB = async (subjectName, duration) => {
    try {
      // 과목 목록 가져오기
      const res = await fetch(`${API_URL}/subjects`);
      let subjectList = await res.json();

      // 과목이 DB에 없으면 새로 생성
      let subject = subjectList.find((s) => s.name === subjectName);
      if (!subject) {
        const createRes = await fetch(`${API_URL}/subjects`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: subjectName }),
        });
        subject = await createRes.json();
      }

      // 세션 저장
      await fetch(`${API_URL}/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject_id: subject.id, duration }),
      });
    } catch (e) {
      console.log("세션 저장 실패", e);
    }
  };
  const handleEnd = useCallback(() => {
    clearInterval(intervalRef.current);

    if (notifRef.current.allEnabled) playSound(notifRef.current.soundType);
    if (!isBreakRef.current) {
      setSessions((p) => p + 1);
      const durationMin = Math.round(workTotalRef.current / 60);
      saveSessionToDB(selectedSubjectRef.current, durationMin);
      setIsBreak(true);
      setTimeLeft(breakTotalRef.current);
      setIsRunning(autoBreakRef.current);
    } else {
      setIsBreak(false);
      setTimeLeft(workTotalRef.current);
      setIsRunning(false);
    }
  }, [playSound]);

  useEffect(() => {
    if (!isRunning) {
      clearInterval(intervalRef.current);
      return;
    }
    clearInterval(intervalRef.current); // 👈 추가: 기존 거 정리 후 새로 시작
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        const next = prev <= 1 ? 0 : prev - 1;
        if (notifRef.current.allEnabled) {
          const alertSec = isBreakRef.current
            ? toSec(
                notifRef.current.breakAlertMin,
                notifRef.current.breakAlertSec,
              )
            : toSec(
                notifRef.current.workAlertMin,
                notifRef.current.workAlertSec,
              );
          const alertEnabled = isBreakRef.current
            ? notifRef.current.breakAlertEnabled
            : notifRef.current.workAlertEnabled;
          if (alertEnabled && alertSec > 0 && next === alertSec)
            playSound(notifRef.current.soundType);
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [isRunning, isBreak]);

  useEffect(() => {
    if (timeLeft === 0 && isRunning) handleEnd();
  }, [timeLeft, isRunning, handleEnd]);

  useEffect(() => {
    if (!isRunning && !isBreak) setTimeLeft(toSec(workMin, workSec));
  }, [workMin, workSec]);

  useEffect(() => {
    if (!isRunning && isBreak) setTimeLeft(toSec(breakMin, breakSec));
  }, [breakMin, breakSec]);

  const handleReset = () => {
    clearInterval(intervalRef.current);
    setIsRunning(false);
    setIsBreak(false);
    setTimeLeft(workTotal);
    setSessions(0);
  };

  const handleSkip = () => {
    clearInterval(intervalRef.current);
    if (!isBreak) {
      setSessions((p) => p + 1);
      setIsBreak(true);
      setTimeLeft(breakTotal);
    } else {
      setIsBreak(false);
      setTimeLeft(workTotal);
    }
    setIsRunning(false);
  };

  const timerProps = {
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
    handleEnd,
    handleReset,
    handleSkip,
  };

  return (
    <BrowserRouter basename="/pomodoro-timer">
      <Nav />
      <Routes>
        <Route path="/" element={<Timer {...timerProps} />} />
        <Route path="/history" element={<History />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}
