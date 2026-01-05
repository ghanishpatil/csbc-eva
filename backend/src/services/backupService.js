import { getFirestore } from '../utils/firebase.js';

/**
 * Export a Firestore collection to JSON
 * @param {string} collectionName - Name of the collection
 * @returns {Promise<Array>} - Array of documents
 */
const exportCollection = async (collectionName) => {
  try {
    const db = getFirestore();
    const snapshot = await db.collection(collectionName).get();
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error(`[BackupService] Error exporting collection ${collectionName}:`, error);
    return [];
  }
};

/**
 * Create a complete backup of competition data
 * @returns {Promise<Object>} - Backup data object
 */
export const createBackup = async () => {
  try {
    const timestamp = new Date().toISOString();
    const backupId = `backup_${Date.now()}`;

    console.log(`[BackupService] Creating backup: ${backupId}`);

    // Export all collections in parallel for better performance
    const [teams, levels, submissions, leaderboard, users, groups, config, flagHashes] = await Promise.all([
      exportCollection('teams'),
      exportCollection('levels'),
      exportCollection('submissions'),
      exportCollection('leaderboard'),
      exportCollection('users'),
      exportCollection('groups'),
      exportCollection('config'),
      exportCollection('flag_hashes'),
    ]);

    const backup = {
      backupId,
      timestamp,
      version: '2.0.0',
      metadata: {
        totalTeams: teams.length,
        totalLevels: levels.length,
        totalSubmissions: submissions.length,
        totalUsers: users.length,
        totalGroups: groups.length,
      },
      data: {
        teams,
        levels,
        submissions,
        leaderboard,
        users,
        groups,
        config,
        flagHashes,
      },
    };

    console.log(`[BackupService] Backup created successfully: ${backupId}`);
    return backup;
  } catch (error) {
    console.error('[BackupService] Backup creation failed:', error);
    throw new Error('Failed to create backup');
  }
};

/**
 * Save backup to Firestore (optional - for backup storage)
 * @param {Object} backup - Backup data object
 * @returns {Promise<string>} - Backup document ID
 */
export const saveBackupToFirestore = async (backup) => {
  try {
    const db = getFirestore();
    const backupRef = db.collection('backups').doc(backup.backupId);
    
    await backupRef.set({
      ...backup,
      createdAt: Date.now(),
    });

    console.log(`[BackupService] Backup saved to Firestore: ${backup.backupId}`);
    return backup.backupId;
  } catch (error) {
    console.error('[BackupService] Failed to save backup to Firestore:', error);
    // Don't throw - backup creation succeeded, storage is optional
    return null;
  }
};

/**
 * Get backup statistics
 * @returns {Promise<Object>} - Backup statistics
 */
export const getBackupStats = async () => {
  try {
    const db = getFirestore();
    const backupsSnapshot = await db.collection('backups')
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();

    const backups = backupsSnapshot.docs.map(doc => ({
      id: doc.id,
      timestamp: doc.data().timestamp,
      createdAt: doc.data().createdAt,
      metadata: doc.data().metadata,
    }));

    return {
      totalBackups: backups.length,
      recentBackups: backups,
      lastBackup: backups[0] || null,
    };
  } catch (error) {
    console.error('[BackupService] Failed to get backup stats:', error);
    return {
      totalBackups: 0,
      recentBackups: [],
      lastBackup: null,
    };
  }
};

