import { createBackup, saveBackupToFirestore, getBackupStats } from '../services/backupService.js';

/**
 * Create a backup of all competition data
 * @route POST /api/admin/backup
 * SECURITY: Admin only
 */
export const createBackupController = async (req, res) => {
  try {
    const { saveToFirestore = false } = req.body;

    // Create backup
    const backup = await createBackup();

    // Optionally save to Firestore
    let savedId = null;
    if (saveToFirestore) {
      savedId = await saveBackupToFirestore(backup);
    }

    // Log admin action
    const adminId = req.admin?.userId || 'unknown';
    console.log(`[BackupController] Backup created by admin ${adminId}: ${backup.backupId}`);

    return res.status(200).json({
      success: true,
      message: 'Backup created successfully',
      backup: {
        id: backup.backupId,
        timestamp: backup.timestamp,
        metadata: backup.metadata,
        savedToFirestore: savedId !== null,
        savedId,
      },
      // Return full backup data for download
      data: backup.data,
    });
  } catch (error) {
    console.error('[BackupController] Backup creation error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create backup',
    });
  }
};

/**
 * Get backup statistics
 * @route GET /api/admin/backup/stats
 * SECURITY: Admin only
 */
export const getBackupStatsController = async (req, res) => {
  try {
    const stats = await getBackupStats();

    return res.status(200).json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('[BackupController] Failed to get backup stats:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get backup statistics',
    });
  }
};

