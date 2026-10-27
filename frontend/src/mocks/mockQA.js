/**
 * Realistic Mock Repository Q&A datasets with code-grounded citations.
 */

export const mockQADatasets = {
  repo_101: {
    repositoryId: 'repo_101',
    repositoryName: 'student-management-system',
    suggestedQuestions: [
      'Where is user authentication and JWT verification handled?',
      'How is student GPA and final grade calculated?',
      'What happens when bulk attendance CSV export is triggered?',
      'Where are the Mongoose database schemas defined?',
      'Which test suites cover the grading algorithm?',
    ],
    items: [
      {
        id: 'qa_101_1',
        repositoryId: 'repo_101',
        question: 'Where is user authentication and JWT verification handled?',
        answer:
          'User authentication is primarily handled in `src/middleware/authMiddleware.js` and `src/controllers/authController.js`. The `verifyFacultyRole` and `verifyAuthToken` middlewares extract bearer tokens from the incoming `Authorization` header, verify them against `process.env.JWT_SECRET`, and attach the decoded faculty/student payload to `req.user`.',
        confidenceScore: 0.98,
        category: 'Authentication & Security',
        createdAt: '2026-10-24T12:00:00.000Z',
        sourceCitations: [
          {
            filePath: 'src/middleware/authMiddleware.js',
            symbolName: 'verifyAuthToken',
            lineRange: 'Lines 14-38',
            codeSnippet: `export const verifyAuthToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization token' });
  }
  const token = authHeader.split(' ')[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  req.user = await StudentUser.findById(decoded.id).select('-password');
  next();
};`,
          },
          {
            filePath: 'src/routes/studentRoutes.js',
            symbolName: 'router.use(verifyAuthToken)',
            lineRange: 'Line 8',
            codeSnippet: `import { verifyAuthToken, verifyFacultyRole } from '../middleware/authMiddleware.js';
router.use(verifyAuthToken);`,
          },
        ],
        relatedNodes: [
          'src/middleware/authMiddleware.js',
          'src/routes/studentRoutes.js',
          'src/controllers/studentController.js',
        ],
      },
      {
        id: 'qa_101_2',
        question: 'How is student GPA and final grade calculated?',
        answer:
          'Grade calculation logic resides in `src/utils/gradeCalculator.js` via the `calculateFinalGrade()` function. It takes coursework scores, weight percentages, and honors coefficients, normalizes them against grade boundaries, and returns both letter grades and weighted numeric GPA. Controller delegation happens in `src/controllers/studentController.js` inside `computeStudentGpa()`.',
        confidenceScore: 0.95,
        category: 'Grading Engine & Algorithms',
        createdAt: '2026-10-24T13:30:00.000Z',
        sourceCitations: [
          {
            filePath: 'src/utils/gradeCalculator.js',
            symbolName: 'calculateFinalGrade',
            lineRange: 'Lines 22-55',
            codeSnippet: `export function calculateFinalGrade({ scores = [], weights = {}, semesterProfile = 'standard' }) {
  const weightedSum = scores.reduce((acc, curr) => acc + (curr.score * (weights[curr.category] || 1)), 0);
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0) || 1;
  const rawPercentage = (weightedSum / totalWeight);
  return {
    rawPercentage: Math.round(rawPercentage * 100) / 100,
    gpa: normalizeHonorScores(rawPercentage, semesterProfile),
  };
}`,
          },
          {
            filePath: 'src/controllers/studentController.js',
            symbolName: 'computeStudentGpa',
            lineRange: 'Lines 48-70',
            codeSnippet: `export const computeStudentGpa = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const history = await getAcademicHistory(studentId);
  const result = calculateFinalGrade({
    scores: history.scores,
    weights: history.weights,
    semesterProfile: req.query.semester || 'standard'
  });
  res.json(new ApiResponse(200, result, 'GPA computed successfully'));
});`,
          },
        ],
        relatedNodes: [
          'src/utils/gradeCalculator.js',
          'src/controllers/studentController.js',
          'src/routes/graduationRoutes.js',
        ],
      },
      {
        id: 'qa_101_3',
        question: 'What happens when bulk attendance CSV export is triggered?',
        answer:
          'When `GET /api/v1/attendance/export/csv` is requested, `src/controllers/attendanceController.js` creates a Mongoose cursor stream from the `AttendanceRecord` collection, pipes it through `fast-csv.format()`, and streams the data chunk-by-chunk to the HTTP response with `Content-Type: text/csv`. This prevents holding the entire export in memory.',
        confidenceScore: 0.92,
        category: 'Data Streaming & Export',
        createdAt: '2026-10-23T11:00:00.000Z',
        sourceCitations: [
          {
            filePath: 'src/controllers/attendanceController.js',
            symbolName: 'exportAttendanceCsv',
            lineRange: 'Lines 82-105',
            codeSnippet: `export const exportAttendanceCsv = asyncHandler(async (req, res) => {
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="attendance.csv"');
  const cursor = AttendanceRecord.find({ semester: req.query.semester }).cursor();
  const csvStream = csv.format({ headers: true });
  cursor.pipe(csvStream).pipe(res);
});`,
          },
        ],
        relatedNodes: ['src/controllers/attendanceController.js', 'src/models/Student.js'],
      },
    ],
  },
  repo_102: {
    repositoryId: 'repo_102',
    repositoryName: 'commerce-api-gateway',
    suggestedQuestions: [
      'Where is the Stripe webhook handler implemented?',
      'How are inventory lock reservations held during checkout?',
      'Where is idempotency enforced on incoming payment requests?',
    ],
    items: [
      {
        id: 'qa_102_1',
        repositoryId: 'repo_102',
        question: 'Where is the Stripe webhook handler implemented?',
        answer:
          'Stripe webhooks are received in `src/routes/webhookRoutes.ts` and processed by `src/controllers/paymentWebhookController.ts`. Raw request buffers are verified using `stripe.webhooks.constructEvent()` against `process.env.STRIPE_WEBHOOK_SECRET`. Idempotency keys are checked in Redis before processing `payment_intent.succeeded` events.',
        confidenceScore: 0.97,
        category: 'Payments & Webhooks',
        createdAt: '2026-10-24T14:00:00.000Z',
        sourceCitations: [
          {
            filePath: 'src/controllers/paymentWebhookController.ts',
            symbolName: 'handleStripeWebhook',
            lineRange: 'Lines 30-58',
            codeSnippet: `export async function handleStripeWebhook(req: Request, res: Response) {
  const sig = req.headers['stripe-signature'] as string;
  const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  await idempotencyService.ensureUnique(event.id);
  await orderReconciliationService.processEvent(event);
  return res.status(200).json({ received: true });
}`,
          },
        ],
        relatedNodes: ['src/controllers/paymentWebhookController.ts', 'src/services/orderService.ts'],
      },
    ],
  },
  repo_103: {
    repositoryId: 'repo_103',
    repositoryName: 'analytics-event-pipeline',
    suggestedQuestions: [
      'Where are event schemas validated before Kafka publishing?',
      'What happens when an event schema validation fails?',
    ],
    items: [
      {
        id: 'qa_103_1',
        repositoryId: 'repo_103',
        question: 'Where are event schemas validated before Kafka publishing?',
        answer:
          'Telemetry payloads are intercepted in `src/middleware/schemaValidator.js` using Zod schemas located in `src/schemas/telemetrySchemas.js`. Invalid payloads are rejected with HTTP 422 and logged to the dead-letter queue.',
        confidenceScore: 0.94,
        category: 'Pipeline Validation',
        createdAt: '2026-10-23T19:00:00.000Z',
        sourceCitations: [
          {
            filePath: 'src/middleware/schemaValidator.js',
            symbolName: 'validateTelemetryPayload',
            lineRange: 'Lines 12-28',
            codeSnippet: `export const validateTelemetryPayload = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(422).json({ error: 'Validation failed', issues: result.error.issues });
  }
  req.validatedPayload = result.data;
  next();
};`,
          },
        ],
        relatedNodes: ['src/middleware/schemaValidator.js'],
      },
    ],
  },
};
