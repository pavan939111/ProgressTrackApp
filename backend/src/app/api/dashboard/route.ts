import { apiSuccess } from '../../../../shared/errors/apiResponse';
import { dashboardService } from '../../../../dashboard/dashboardService';

export const dynamic = 'force-dynamic';

export async function GET() {
  const summary = dashboardService.getSummary();
  return apiSuccess(summary, 'Dashboard summary aggregated successfully');
}
