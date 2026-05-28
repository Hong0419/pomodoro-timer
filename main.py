from flask import Flask,jsonify, request
from flask_cors import CORS
from datetime import datetime
import sqlite3

app=Flask(__name__)
CORS(app)

def get_db():
    conn = sqlite3.connect("pomodoro.db")
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn=get_db()
    conn.execute("""
                 CREATE TABLE IF NOT EXISTS subjects(
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL
                 )
    """)
    conn.execute("""
                 CREATE TABLE IF NOT EXISTS sessions(
                 id INTEGER PRIMARY KEY AUTOINCREMENT,
                 subject_id INTEGER,
                 duration INTEGER,
                 created_at TEXT,
                 FOREIGN KEY(subject_id) REFERENCES subjects(id)
                 )
                 """)
    conn.commit()
    conn.close()

init_db()

# 과목 목록
@app.route("/subjects", methods=["GET"])
def get_subject():
    conn = get_db()
    subjects =conn.execute("SELECT * FROM subjects").fetchall()
    conn.close()
    return jsonify([dict(s) for s in subjects])

# 과목 추가
@app.route("/subjects", methods=["POST"])
def create_subject():
    data = request.get_json()
    conn = get_db()
    cursor = conn.execute("INSERT INTO subjects (name) VALUES (?)", (data["name"],))
    conn.commit()
    new_id = cursor.lastrowid
    conn.close()
    return jsonify({"id": new_id, "name": data["name"]})

# 과목 삭제
@app.route("/subjects/<int:id>", methods=["DELETE"])
def delete_subject(id):
    conn = get_db()
    conn.execute("DELETE FROM subjects WHERE id = ?",(id,))
    conn.commit()
    conn.close()
    return jsonify({"success": True})

# 세션 목록
@app.route("/sessions", methods=["GET"])
def get_sessions():
    subject_id = request.args.get("subject_id")
    range_filter = request.args.get("range", "all")

    conn = get_db()

    query = """
            SELECT sessions.*, subjects.name as subject_name
            FROM sessions 
            LEFT JOIN subjects ON sessions.subject_id = subjects.id
            WHERE 1=1
            """
    params = []

    if subject_id:
        query += " AND sessions.subject_id = ?"
        params.append(subject_id)

    if range_filter == "week":
        query += " AND created_at >= date('now', '-7 days')"
    elif range_filter == "month":
        query += " AND created_at >= date('now', '-30 days')"
    
    query += " ORDER BY created_at DESC"

    sessions = conn.execute(query, params).fetchall()
    conn.close()
    return jsonify([dict(s) for s in sessions])

# 세션 추가
@app.route("/sessions", methods=["POST"])
def create_session():
    data = request.get_json()
    conn = get_db()
    now = datetime.now().isoformat()
    cursor = conn.execute(
        "INSERT INTO sessions (subject_id, duration, created_at) VALUES (?, ?, ?)",
        (data["subject_id"], data["duration"], now)
    )
    conn.commit()
    new_id = cursor.lastrowid
    conn.close()
    return jsonify(
        {
            "id": new_id,
            "subject_id": data["subject_id"],
            "duration": data["duration"],
            "created_at": now
        }
    )

# 세션 삭제
@app.route("/sessions/<int:id>", methods=["DELETE"])
def delete_session(id):
    conn = get_db()
    conn.execute("DELETE FROM sessions WHERE id = ?", (id,))
    conn.commit()
    conn.close()
    return jsonify({"success": True})

# 연속 기록 계산 (streak)
@app.route("/stats", methods=["GET"])
def get_stats():
    conn = get_db()

    # 전체 집중 시간
    total = conn.execute("SELECT SUM(duration) as total FROM sessions").fetchone()
    total_minutes = total["total"] or 0

    # 이번 주 세션 수
    week_count = conn.execute("""
                            SELECT COUNT(*) as count FROM sessions
                            WHERE created_at >= date('now', '-7 days')
                            """).fetchone()
    
    # 과목별 집중 시간
    by_subject = conn.execute("""
                            SELECT subjects.name, SUM(sessions.duration) as minutes
                            FROM sessions
                            LEFT JOIN subjects ON sessions.subject_id = subjects.id
                            GROUP BY subjects.id
                            """).fetchall()
    
    # 요일별 집중 시간
    by_weekday = conn.execute("""
                            SELECT strftime('%w', created_at) as day, SUM(duration) as minutes
                            FROM sessions
                            GROUP BY day
                            """).fetchall()
    
    # 연속 기록 계산
    dates = conn.execute("""
                         SELECT DISTINCT date(created_at) as day
                         FROM sessions
                         ORDER BY day DESC
                         """).fetchall()


    streak = 0
    today = datetime.now().date()
    for i, row in enumerate(dates):
        from datetime import date, timedelta
        d = date.fromisoformat(row["day"])
        if d == today - timedelta(days=i):
            streak +=1
        else:
            break
    
    conn.close()

    # 요일 변환
    day_map = {"0":"Sun","1":"Mon","2":"Tue","3":"Wed","4":"Thu","5":"Fri","6":"Sat"}
    weekday_result = {day_map[r["day"]]: r["minutes"] for r in by_weekday}

    return jsonify({
        "streak": streak,
        "total_hours": round(total_minutes / 60, 1),
        "sessions_this_week": week_count["count"],
        "by_subject": [dict(r) for r in by_subject],
        "by_weekday": weekday_result
    })



if __name__=="__main__":
    app.run(debug=True)