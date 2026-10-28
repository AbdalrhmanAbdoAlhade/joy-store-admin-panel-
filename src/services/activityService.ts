import { ApiResponse } from '@/src/lib/axios';
import { ActivityLog } from '@/src/types/activity';
import { TableQueryParams } from '@/src/types/api';

// Activity log backend endpoint is not implemented yet (returns 404).
// The UI is a skeleton only, so this returns an empty result instead of throwing.
export const activityService = {
  async getActivityLogs(params?: TableQueryParams): Promise<ApiResponse<ActivityLog[]>> {
    void params;
    return {
      success: true,
      data: [],
      message: 'سجل النشاط غير متاح حالياً',
      meta: { current_page: 1, last_page: 1, per_page: 20, total: 0 },
    };
  },
};

export default activityService;
