/**
 * Realistic Mock Architectural Decisions and Project Knowledge Records (ADRs)
 */

export const mockProjectMemories = [
  {
    id: 'mem_101',
    repositoryId: 'repo_101',
    title: 'ADR 001: Options-Object Parameter Pattern for Grade Calculation',
    category: 'Architecture',
    status: 'Accepted',
    author: 'Sarah Chen (Lead Architect)',
    createdAt: '2026-10-24T10:15:00.000Z',
    updatedAt: '2026-10-24T18:30:00.000Z',
    summary:
      'Transitioned calculateFinalGrade() from legacy positional arguments (scores, weights) to an extensible options object to support semester profiling and honors weight variations.',
    context:
      'The legacy calculateFinalGrade(scores, weights) signature was fragile. As different university departments required semester-specific curves, honors weighting, and pass/fail thresholds, engineers were forced to add trailing positional parameters, leading to subtle NaN calculation bugs across graduation and transcript services.',
    decision:
      'Standardized calculateFinalGrade({ scores, weights, semesterProfile, enableHonorsCurve }) using a single structured options object. Provided default fallback values for optional flags and added runtime input validation.',
    consequences:
      'High downstream impact on graduation check routes and legacy unit test suites. All consumers must be refactored to pass an options object. Reduces future breaking changes as new curve algorithms are introduced.',
    affectedSymbols: [
      { path: 'src/utils/gradeCalculator.js', type: 'module', symbol: 'calculateFinalGrade' },
      { path: 'src/controllers/studentController.js', type: 'controller', symbol: 'computeStudentGpa' },
      { path: 'src/routes/graduationRoutes.js', type: 'route', symbol: 'GET /graduation/eligible' },
      { path: 'tests/unit/gradeCalculator.test.js', type: 'test', symbol: 'describe("calculateFinalGrade")' },
    ],
  },
  {
    id: 'mem_102',
    repositoryId: 'repo_101',
    title: 'ADR 002: Streaming HTTP Responses for Bulk Attendance CSV Export',
    category: 'Performance',
    status: 'Accepted',
    author: 'Elena Rostova (Senior Backend Engineer)',
    createdAt: '2026-10-23T09:00:00.000Z',
    updatedAt: '2026-10-23T11:45:00.000Z',
    summary:
      'Adopted Mongoose cursor streaming with fast-csv directly to Express response stream to prevent Out-Of-Memory (OOM) node crashes during multi-thousand student exports.',
    context:
      'Previous exports used `AttendanceRecord.find().lean()`, buffering 45,000+ attendance records in memory before serializing to a string. Node memory spiked past 1.2 GB, causing Kubernetes pod restarts under concurrent administrative downloads.',
    decision:
      'Replaced batch in-memory array accumulation with Mongoose `.cursor()` piping directly to `fast-csv.format({ headers: true })` and into `res`.',
    consequences:
      'Memory consumption remains constant at ~18 MB regardless of attendance dataset size. Express connection pool holds open database cursors longer; client timeout must be tuned to 60 seconds.',
    affectedSymbols: [
      { path: 'src/controllers/attendanceController.js', type: 'controller', symbol: 'exportAttendanceCsv' },
      { path: 'src/models/Student.js', type: 'model', symbol: 'AttendanceRecord' },
    ],
  },
  {
    id: 'mem_103',
    repositoryId: 'repo_101',
    title: 'ADR 003: JWT Scoping & Dual Bearer/Cookie Authentication',
    category: 'Security',
    status: 'Accepted',
    author: 'Marcus Vance (Security Lead)',
    createdAt: '2026-09-15T14:20:00.000Z',
    updatedAt: '2026-10-10T16:00:00.000Z',
    summary:
      'Implemented short-lived Access Tokens (15m) paired with HTTP-only Refresh Tokens (7d) and department-level claim authorization in verifyFacultyRole.',
    context:
      'Audit revealed that faculty credentials had broad administrative power across unrelated faculties. Tokens were also vulnerable to XSS extraction when held in single localStorage storage.',
    decision:
      'Access tokens now embed faculty department ID and role claims (`faculty`, `student`, `dean`). Tokens are verified in `src/middleware/authMiddleware.js`. Refresh tokens are stored in HTTP-only, SameSite=Strict cookies.',
    consequences:
      'Mitigates token theft impact to a 15-minute window. Requires frontend auth interceptor to handle silent token rotation on 401 responses.',
    affectedSymbols: [
      { path: 'src/middleware/authMiddleware.js', type: 'middleware', symbol: 'verifyFacultyRole' },
      { path: 'src/controllers/authController.js', type: 'controller', symbol: 'refreshAccessToken' },
      { path: 'src/models/user.model.js', type: 'model', symbol: 'generateAccessToken' },
    ],
  },
  {
    id: 'mem_104',
    repositoryId: 'repo_102',
    title: 'ADR 004: Redis Idempotency Key Validation on Stripe Webhooks',
    category: 'Integration',
    status: 'Accepted',
    author: 'Alexandre Dubois (Fintech Core)',
    createdAt: '2026-10-20T11:00:00.000Z',
    updatedAt: '2026-10-24T14:30:00.000Z',
    summary:
      'Enforced Redis atomic SETNX keys with 24h TTL on Stripe event IDs to eliminate duplicate order settlement on webhook retries.',
    context:
      'Network timeouts between Stripe and the API gateway caused Stripe to retry webhook delivery up to 3 times, causing rare duplicate fulfillment entries in the ledger.',
    decision:
      'Before processing `payment_intent.succeeded`, handler checks Redis key `webhook:stripe:${eventId}`. If already set, returns 200 OK immediately without re-triggering order fulfillment.',
    consequences:
      'Zero duplicate order fulfillment occurrences. Adds Redis dependency to webhook handling path with fail-closed behavior on Redis cluster outages.',
    affectedSymbols: [
      { path: 'src/controllers/paymentWebhookController.ts', type: 'controller', symbol: 'handleStripeWebhook' },
      { path: 'src/services/idempotencyService.ts', type: 'service', symbol: 'ensureUnique' },
    ],
  },
];
