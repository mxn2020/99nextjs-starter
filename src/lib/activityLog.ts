
"use server";
import { createSupabaseAdminClient } from '@/lib/supabase/admin'; // Use admin client to bypass RLS for logging
import type { UserActivityLogInsert, ActivityLogType } from '@/lib/types';
import { headers } from 'next/headers';

interface ActivityDetails {
  user_id?: string | null; // User primarily affected or associated with the activity
  actor_id: string; // User who performed the action
  activity_type: ActivityLogType;
  description?: string | null;
  details?: Record<string, any> | null;
  target_resource_id?: string | null;
  target_resource_type?: string | null;
}

export async function logUserActivity(
  activityData: ActivityDetails
): Promise<{ success: boolean; error?: any }> {
  try {
    const supabaseAdmin = createSupabaseAdminClient();

    const headerStore = await headers();
    const ipAddress = (headerStore.get('x-forwarded-for') ?? headerStore.get('x-real-ip') ?? 'unknown').split(',')[0].trim();
    const userAgent = headerStore.get('user-agent') ?? 'unknown';

    const logEntry: UserActivityLogInsert = {
      user_id: activityData.user_id, // User affected
      actor_id: activityData.actor_id, // User performing the action
      activity_type: activityData.activity_type,
      description: activityData.description,
      details: activityData.details,
      ip_address: ipAddress,
      user_agent: userAgent,
      target_resource_id: activityData.target_resource_id,
      target_resource_type: activityData.target_resource_type,
    };

    const { error } = await supabaseAdmin.from('user_activity_logs').insert(logEntry);

    if (error) {
      console.error('Error logging user activity:', error);
      // Optionally, send to an external logging service if DB write fails
      return { success: false, error };
    }
    return { success: true };
  } catch (e) {
    console.error('Exception in logUserActivity:', e);
    return { success: false, error: e };
  }
}
    