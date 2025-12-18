# 🧑‍✈️ Mission Exploit 2.0 — Group Captain Portal  
### CSBC Cybersecurity Club  
### Cyber-Neon Observability Dashboard  
### (Frontend + Backend Specification Included)

The **Group Captain Portal** is a restricted-access, read-only analytics dashboard for a Group Captain.  
A Group Captain manages **only one assigned group**, assigned by the Admin.

A Group consists of:
- **10 teams**
- **Each team has 2 players**

The Captain Portal does **not** allow:
- Flag submissions  
- Score changes  
- Level changes  
- Cross-group access  

The purpose is to **monitor, supervise, and ensure fairness** within their group.

---

# 🧭 1. Role Clarification — Final (Correct)

## Group Captain:
- Supervises **only the group that the Admin assigns**
- Can **view data for only that group**
- Cannot see other groups
- Observes team progress
- Detects abnormalities
- Sends optional announcements to group participants
- Can report suspicious activities to Admin

### ❌ Cannot:
- Submit flags  
- Solve levels  
- Unlock levels  
- Adjust scores  
- Change team data  
- Access admin settings  
- See data outside their group  

---

# 🧩 2. Backend Model for Group Captains

## 2.1 Captain Assignment
Admin assigns a captain to a group:

groups/{groupId}
{
groupId: "G3",
captainId: "UID_CPT_32",
teamIds: ["T01","T02",...,"T10"]
}

kotlin
Copy code

Captain Portal only loads data where:

captainId == currentUser.uid

yaml
Copy code

Backend enforces this with route middleware.

---

# 🔐 2.2 Backend Access Control (Very Important)

All captain routes must enforce:

If request.user.role != 'captain': reject
If groupId != captainAssignedGroup: reject
Return data ONLY for captain's assigned group.

yaml
Copy code

Middleware example:

requireGroupCaptain:
- authenticate firebase token
- verify user.role == 'captain'
- fetch user's assigned groupId
- restrict all DB queries to that group

yaml
Copy code

---

# 🛠 3. Backend API Endpoints for Captain Portal

## ✔ 3.1 Get Assigned Group Overview
GET /api/captain/group
Auth: Firebase ID token
Returns: groupId, 10 teams, progress summary

css
Copy code

Response:
```json
{
  "groupId": "G4",
  "teams": [...],
  "levels": [...],
  "stats": {
    "totalScore": 3090,
    "solves": 18,
    "hintsUsed": 5
  }
}
✔ 3.2 Get Team Progress (Team Detail)
swift
Copy code
GET /api/captain/team/:teamId
Response:

json
Copy code
{
  "teamId": "T08",
  "score": 760,
  "solvedLevels": [...],
  "timeTaken": {...},
  "hintUsage": {...},
  "attempts": [...]
}
✔ 3.3 View Submission Logs (Group Only)
bash
Copy code
GET /api/captain/logs
Backend must filter:

powershell
Copy code
WHERE groupId == captain.groupId
✔ 3.4 Optional: Captain Sends Local Announcement
bash
Copy code
POST /api/captain/announce
{
  "message": "Stay focused. Verify flags carefully."
}
This sends a message to only:

css
Copy code
teams belonging to captain.groupId
🎨 4. Frontend Specification (React + Vite + Tailwind)
The Captain Portal uses the Cyber Neon Mission Exploit Theme:

Theme Requirements:
Background Gradient: #0A0F14 → #0E1621

Card BG: #131B26

Border: #1E2A3A

Neon Accents:

Blue (#4C9CFF) for info

Yellow (#FFCC4D) for scores

Red (#FF3B3B) for alerts

Green (#3CCF91) for successes

Common Components:
<CaptainNavbar />

<GroupOverviewCard />

<TeamPerformanceCard />

<SubmissionLogTable />

<LeaderboardTable />

<AnnouncementPanel />

<TeamDetailPanel />

🖥 5. Captain Portal Frontend Pages
5.1 Group Overview Dashboard
Displays:

Group Name (e.g., Group 4 — Supervisor Panel)

Total teams: 10

Total score cumulative

Heatmap of difficulty vs solves

Levels attempt distribution

Neon stat cards:

Avg solve time

Most active team

Most difficult level

Solve rate

5.2 Teams Performance Page
A table showing:

Team	Score	Levels Solved	Hint Usage	Status	Efficiency

Team cards include:

Neon progress bars

Status badges (Active, Behind, Leading)

Captain cannot click to modify anything.

5.3 Team Detail Page
Shows:

Team name

Score history graph

Level-by-level timeline

Hint usage visual

Wrong attempts (hash prefix only)

Level solve durations

Suspicious activity markers

5.4 Group Leaderboard
Sorted by:

Score

Time performance

Solve accuracy

Top 3 get neon highlight glows.

5.5 Submission Logs
A scrollable table:

Time	Team	Level	Status	Points	IP	Type

Backend filters only group logs.

5.6 Group Announcement Panel (Optional)
Captain can send message to group:

arduino
Copy code
"Remember: No discussing flags publicly."
Display on participant dashboard.

Backend ensures this message does not interact with gameplay.

👮 6. Security Model (Strict)
Captain must NOT see any other group

Captain must NOT see exact flags

Backend filters all queries by:

captainId

groupId

Admin can override submissions, not Captain

Captain cannot spoof teamId to view other groups

🧠 7. Advanced Features for Captains (Optional Enhancements)
⭐ 1. Solve Heatmap
Matrix of teams vs levels showing difficulty at-a-glance.

⭐ 2. Suspicious Activity Detector
Detects:

Too fast solves

Multiple wrong attempts

Multiple teams with same timing

⭐ 3. Captain–Admin Communication Panel
⭐ 4. Efficiency Score for Teams
Based on:

Hint usage

Time

Attempts

🏁 8. Summary
pgsql
Copy code
Participants → Solve + Submit flags
Captains → Monitor only their assigned group
Admin → Full control of entire event
The Group Captain Portal is a read-only cyber-neon dashboard for supervisors responsible for ensuring fairness and transparency.

Admins assign captains to groups, and backend enforces strict group boundaries.