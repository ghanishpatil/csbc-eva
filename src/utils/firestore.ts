import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Unsubscribe,
  addDoc,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import type {
  User,
  Team,
  Group,
  Level,
  Submission,
  LeaderboardEntry,
  EventConfig,
  HintUsage,
} from '@/types';

// Collection Names
export const COLLECTIONS = {
  USERS: 'users',
  TEAMS: 'teams',
  GROUPS: 'groups',
  LEVELS: 'levels',
  SUBMISSIONS: 'submissions',
  LEADERBOARD: 'leaderboard',
  CONFIG: 'config',
  HINTS: 'hints',
} as const;

// Generic CRUD Operations
export const firestoreAPI = {
  // Users
  async getUser(userId: string): Promise<User | null> {
    try {
      const docRef = doc(db, COLLECTIONS.USERS, userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const userData = docSnap.data() as User;
        console.log('Firestore getUser - Found user:', userData);
        return userData;
      } else {
        console.error('Firestore getUser - User document does not exist:', userId);
        return null;
      }
    } catch (error) {
      console.error('Firestore getUser - Error:', error);
      return null;
    }
  },

  async createUser(userId: string, userData: Omit<User, 'id'>): Promise<void> {
    const docRef = doc(db, COLLECTIONS.USERS, userId);
    await setDoc(docRef, { ...userData, id: userId });
  },

  async updateUser(userId: string, updates: Partial<User>): Promise<void> {
    const docRef = doc(db, COLLECTIONS.USERS, userId);
    await updateDoc(docRef, updates);
  },

  // Teams
  async getTeam(teamId: string): Promise<Team | null> {
    const docRef = doc(db, COLLECTIONS.TEAMS, teamId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? (docSnap.data() as Team) : null;
  },

  async getAllTeams(): Promise<Team[]> {
    const querySnapshot = await getDocs(collection(db, COLLECTIONS.TEAMS));
    return querySnapshot.docs.map((doc) => doc.data() as Team);
  },

  async createTeam(team: Omit<Team, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, COLLECTIONS.TEAMS), team);
    await updateDoc(docRef, { id: docRef.id });
    return docRef.id;
  },

  async updateTeam(teamId: string, updates: Partial<Team>): Promise<void> {
    const docRef = doc(db, COLLECTIONS.TEAMS, teamId);
    await updateDoc(docRef, { ...updates, updatedAt: Date.now() });
  },

  async deleteTeam(teamId: string): Promise<void> {
    const docRef = doc(db, COLLECTIONS.TEAMS, teamId);
    await deleteDoc(docRef);
  },

  // Groups
  async getAllGroups(): Promise<Group[]> {
    const querySnapshot = await getDocs(collection(db, COLLECTIONS.GROUPS));
    return querySnapshot.docs.map((doc) => doc.data() as Group);
  },

  async createGroup(group: Omit<Group, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, COLLECTIONS.GROUPS), group);
    await updateDoc(docRef, { id: docRef.id });
    return docRef.id;
  },

  // Levels
  async getAllLevels(): Promise<Level[]> {
    const querySnapshot = await getDocs(
      query(collection(db, COLLECTIONS.LEVELS), orderBy('number', 'asc'))
    );
    return querySnapshot.docs.map((doc) => doc.data() as Level);
  },

  async getLevel(levelId: string): Promise<Level | null> {
    const docRef = doc(db, COLLECTIONS.LEVELS, levelId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? (docSnap.data() as Level) : null;
  },

  async createLevel(level: Omit<Level, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, COLLECTIONS.LEVELS), level);
    await updateDoc(docRef, { id: docRef.id });
    return docRef.id;
  },

  async updateLevel(levelId: string, updates: Partial<Level>): Promise<void> {
    const docRef = doc(db, COLLECTIONS.LEVELS, levelId);
    await updateDoc(docRef, { ...updates, updatedAt: Date.now() });
  },

  async deleteLevel(levelId: string): Promise<void> {
    const docRef = doc(db, COLLECTIONS.LEVELS, levelId);
    await deleteDoc(docRef);
  },

  // Submissions
  async createSubmission(submission: Omit<Submission, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, COLLECTIONS.SUBMISSIONS), submission);
    await updateDoc(docRef, { id: docRef.id });
    return docRef.id;
  },

  async getTeamSubmissions(teamId: string): Promise<Submission[]> {
    const q = query(
      collection(db, COLLECTIONS.SUBMISSIONS),
      where('teamId', '==', teamId),
      orderBy('submittedAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => doc.data() as Submission);
  },

  // Leaderboard
  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    const q = query(
      collection(db, COLLECTIONS.LEADERBOARD),
      orderBy('score', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => doc.data() as LeaderboardEntry);
  },

  async updateLeaderboard(
    teamId: string,
    entry: Omit<LeaderboardEntry, 'id'>
  ): Promise<void> {
    const docRef = doc(db, COLLECTIONS.LEADERBOARD, teamId);
    await setDoc(docRef, { ...entry, id: teamId }, { merge: true });
  },

  // Event Config
  async getEventConfig(): Promise<EventConfig | null> {
    const docRef = doc(db, COLLECTIONS.CONFIG, 'event');
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? (docSnap.data() as EventConfig) : null;
  },

  async updateEventConfig(config: EventConfig): Promise<void> {
    const docRef = doc(db, COLLECTIONS.CONFIG, 'event');
    await setDoc(docRef, { ...config, updatedAt: Date.now() }, { merge: true });
  },

  // Hints
  async createHintUsage(hint: Omit<HintUsage, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, COLLECTIONS.HINTS), hint);
    await updateDoc(docRef, { id: docRef.id });
    return docRef.id;
  },

  async getTeamHints(teamId: string, levelId: string): Promise<HintUsage[]> {
    const q = query(
      collection(db, COLLECTIONS.HINTS),
      where('teamId', '==', teamId),
      where('levelId', '==', levelId),
      orderBy('usedAt', 'asc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => doc.data() as HintUsage);
  },
};

// Real-time Listeners
export const firestoreListeners = {
  subscribeToLeaderboard(
    callback: (leaderboard: LeaderboardEntry[]) => void
  ): Unsubscribe {
    const q = query(
      collection(db, COLLECTIONS.LEADERBOARD),
      orderBy('score', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
      const leaderboard = snapshot.docs.map((doc) => doc.data() as LeaderboardEntry);
      callback(leaderboard);
    });
  },

  subscribeToTeams(callback: (teams: Team[]) => void): Unsubscribe {
    return onSnapshot(collection(db, COLLECTIONS.TEAMS), (snapshot) => {
      const teams = snapshot.docs.map((doc) => doc.data() as Team);
      callback(teams);
    });
  },

  subscribeToLevels(callback: (levels: Level[]) => void): Unsubscribe {
    const q = query(collection(db, COLLECTIONS.LEVELS), orderBy('number', 'asc'));
    return onSnapshot(q, (snapshot) => {
      const levels = snapshot.docs.map((doc) => doc.data() as Level);
      callback(levels);
    });
  },

  subscribeToEventConfig(callback: (config: EventConfig | null) => void): Unsubscribe {
    const docRef = doc(db, COLLECTIONS.CONFIG, 'event');
    return onSnapshot(docRef, (snapshot) => {
      const config = snapshot.exists() ? (snapshot.data() as EventConfig) : null;
      callback(config);
    });
  },

  subscribeToGroups(callback: (groups: Group[]) => void): Unsubscribe {
    return onSnapshot(collection(db, COLLECTIONS.GROUPS), (snapshot) => {
      const groups = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Group[];
      callback(groups);
    });
  },

  subscribeToSubmissions(callback: (submissions: Submission[]) => void): Unsubscribe {
    const q = query(
      collection(db, COLLECTIONS.SUBMISSIONS),
      orderBy('submittedAt', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
      const submissions = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Submission[];
      callback(submissions.slice(0, 100)); // Limit to recent 100
    });
  },

  subscribeToAnnouncements(callback: (announcements: any[]) => void): Unsubscribe {
    const q = query(
      collection(db, 'announcements'),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
      const announcements = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      callback(announcements);
    });
  },
};

