# 🎯 Mission Exploit 2.0 — Participant Portal  
### CSBC Cybersecurity Club  
### Physical Mission-Based CTF Platform

The **Participant Portal** is the only interface used by teams during the competition.  
It is designed **specifically for a physical, location-based CTF**, where teams move between real-world locations using QR codes.

---

## 🧠 Core Design Philosophy

- The portal is **mission-driven**, not challenge-driven
- Participants **cannot choose levels freely**
- Only the **current level** is visible
- Progression is **sequential and enforced by backend**
- Physical presence is verified via QR scan
- Flags unlock the **next physical location**, not new questions directly

---

## 👥 Team Structure

- Each team has **2 participants**
- Both participants can:
  - View challenges
  - Submit flags
- Teams are **pre-created by Admin**
- No team creation or invites during the event

---

## 🖥️ Participant Portal Pages

### **1. Team Dashboard (Home)**
Displays:
- Team Name
- Group Number
- Current Level
- Current Mission Status
- Timer since last level start
- Quick Status Badge:
  - `Waiting`
  - `At Location`
  - `Solving`
  - `Moving`

No leaderboard distractions here.

---

### **2. Mission Check-In Page (QR Entry)**
Triggered only via QR scan.

Flow:
- Participant scans QR
- Platform verifies:
  - Team is allowed at this level
- Shows confirmation:
✔ You have reached Level 3 location

kotlin
Copy code
- Only after this:
- Challenge content becomes accessible

If scanned out of order:
❌ This location is not unlocked for your team

yaml
Copy code

---

### **3. Active Mission Page**
Shows:
- Level Title
- Mission Description
- Files / links (if any)
- Flag format
- Hint availability (read-only)
- Time elapsed

Restrictions:
- No next-level info
- No future challenges
- No other levels visible

---

### **4. Flag Submission Panel**
Participants enter flag.

Submission:
POST /api/submit-flag

graphql
Copy code

On success:
✅ Correct Flag!
📍 Next Location Unlocked:
"Where silence speaks louder than lectures"

graphql
Copy code

On failure:
❌ Incorrect flag
Attempts remaining: X

yaml
Copy code

---

### **5. Movement / Navigation Page**
After successful submission:
- Shows next location clue
- Shows countdown / timer
- Flag submission disabled
- Displays:
Mission Objective:
Reach the next checkpoint

yaml
Copy code

Participants must physically move.

---

### **6. Leaderboard (Read-Only)**
Accessible anytime.
Shows:
- Rank
- Team Name
- Score
- Levels Completed

No solve details.

---

## 🔐 Security & Fairness Rules (Participant Side)

- Cannot access future levels
- Cannot submit flags without QR check-in
- Cannot submit multiple levels at once
- Cannot see exact location until unlocked
- Flag attempts are rate-limited
- All validation happens on backend

---

## 🏁 Summary

The Participant Portal is:
- Minimal
- Focused
- Mission-oriented
- Designed to keep teams moving physically
- Resistant to cheating and flag sharing

Participants only ever see:
Where am I now?
What do I solve?
Where do I go next?