import { getFirestore } from '../utils/firebase.js';

/**
 * Get current event status
 * @returns {Promise<{isActive: boolean, startTime?: number, endTime?: number, currentPhase?: string}>}
 */
export const getEventStatus = async () => {
  try {
    const db = getFirestore();
    const eventDoc = await db.collection('event_config').doc('main').get();
    
    if (!eventDoc.exists) {
      // Default: event is inactive
      return {
        isActive: false,
        currentPhase: 'preparation',
      };
    }
    
    return eventDoc.data();
  } catch (error) {
    console.error('[EventService] Error getting event status:', error);
    // Fail-safe: assume event is inactive
    return {
      isActive: false,
      currentPhase: 'preparation',
    };
  }
};

/**
 * Start the event (admin only)
 * @returns {Promise<void>}
 */
export const startEvent = async () => {
  try {
    const db = getFirestore();
    await db.collection('event_config').doc('main').set({
      isActive: true,
      startTime: Date.now(),
      currentPhase: 'active',
      updatedAt: Date.now(),
    }, { merge: true });
    
    console.log('[EventService] Event started');
  } catch (error) {
    console.error('[EventService] Error starting event:', error);
    throw error;
  }
};

/**
 * Stop the event (admin only)
 * @returns {Promise<void>}
 */
export const stopEvent = async () => {
  try {
    const db = getFirestore();
    await db.collection('event_config').doc('main').update({
      isActive: false,
      endTime: Date.now(),
      currentPhase: 'completed',
      updatedAt: Date.now(),
    });
    
    console.log('[EventService] Event stopped');
  } catch (error) {
    console.error('[EventService] Error stopping event:', error);
    throw error;
  }
};

/**
 * Pause the event (admin only)
 * @returns {Promise<void>}
 */
export const pauseEvent = async () => {
  try {
    const db = getFirestore();
    await db.collection('event_config').doc('main').update({
      isActive: false,
      currentPhase: 'paused',
      pausedAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    console.log('[EventService] Event paused');
  } catch (error) {
    console.error('[EventService] Error pausing event:', error);
    throw error;
  }
};

