# Backend — Lambda LAP API

## Stack

- **Runtime**: Node.js with TypeScript (strict mode)
- **Framework**: Express v5.2.1
- **Database**: MongoDB with Mongoose v8.8.4
- **Auth**: JWT (jsonwebtoken) + bcryptjs for password hashing
- **Testing**: Jest + Supertest
- **Containerization**: Docker + docker-compose (MongoDB included)

## Entry Points

- `src/server.ts` — Server startup (connects to MongoDB, starts Express)
- `src/app.ts` — Express app configuration (middleware, routes, error handlers)

## Project Structure

```
src/
├── config/index.ts          # Environment config (port, db, jwt)
├── constants/               # Shared constants
│   ├── index.ts             # Barrel export
│   ├── errorCodes.ts        # Standardized error codes (UNAUTHORIZED, NOT_FOUND, etc.)
│   ├── languages.ts         # Supported languages + display names + file extensions
│   └── roles.ts             # User roles (STUDENT, INSTRUCTOR, ADMIN) + helpers
├── types/                   # Shared TypeScript types
│   ├── index.ts             # All entity interfaces (IUser, ICourse, ILesson, etc.)
│   └── express.d.ts         # Express Request augmentation (user, requestId)
├── controllers/             # Request handlers (business logic)
│   ├── auth.controller.ts
│   ├── challenge.controller.ts
│   ├── course.controller.ts
│   ├── execution.controller.ts
│   ├── health.controller.ts
│   ├── lesson.controller.ts
│   └── user.controller.ts
├── middlewares/
│   ├── auth.middleware.ts    # authenticate() + authorize(...roles)
│   └── rateLimit.middleware.ts  # Rate limiters (currently disabled)
├── models/                  # Mongoose schemas
│   ├── User.ts, Course.ts, Lesson.ts, Challenge.ts
│   ├── Enrollment.ts, LessonProgress.ts, Submission.ts
│   ├── ChatThread.ts, ChatMessage.ts
│   └── index.ts             # Barrel export
├── routes/
│   ├── index.ts             # Route aggregator (mounts all v1 routes)
│   ├── auth.routes.ts, user.routes.ts, course.routes.ts
│   ├── lesson.routes.ts, challenge.routes.ts
│   ├── execution.routes.ts, health.routes.ts
├── scripts/seed.ts          # Database seeding
├── utils/
│   ├── jsend.ts             # JSend response helpers: success(data), error(msg, code?, details?)
│   ├── db.ts                # MongoDB connection manager
│   └── queryBuilder.ts      # Pagination, sorting, filtering utilities
└── __tests__/               # Jest test files
```

## Patterns & Conventions

### Adding a New Endpoint
1. Define types in `src/types/index.ts` if needed
2. Create/update model in `src/models/`
3. Create controller function in `src/controllers/`
4. Create/update route file in `src/routes/`
5. Register route in `src/routes/index.ts`
6. Add tests in `src/__tests__/`

### Response Format
Always use the JSend helpers from `src/utils/jsend.ts`:
```typescript
import { success, error } from '../utils/jsend';
res.status(200).json(success(data));
res.status(400).json(error('Bad request', 'VALIDATION_ERROR'));
```

### Error Codes
Use standardized codes from `src/constants/errorCodes.ts`:
```typescript
import { NOT_FOUND, VALIDATION_ERROR } from '../constants';
res.status(404).json(error('Course not found', NOT_FOUND));
```

### Authentication Pattern
```typescript
import { authenticate, authorize } from '../middlewares/auth.middleware';
// Public route
router.get('/courses', controller.list);
// Authenticated route
router.get('/dashboard', authenticate, controller.dashboard);
// Role-restricted route
router.post('/courses', authenticate, authorize('ADMIN', 'INSTRUCTOR'), controller.create);
```

### Roles & Languages
Use constants instead of raw strings:
```typescript
import { ROLES, CONTENT_MANAGERS } from '../constants';
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '../constants';
```

### Model Pattern
Mongoose schemas with TypeScript interfaces from `src/types/index.ts`:
```typescript
import type { IUser } from '../types';
const userSchema = new Schema<IUser>({ ... }, { timestamps: true });
```

### Query Builder
Use `src/utils/queryBuilder.ts` for list endpoints:
- `getPagination(req)` — extract page/limit from query params
- `getSort(req)` — extract sort field/order
- `getFilters(req, allowedFields)` — extract allowed filter fields
- `buildQuery(req, allowedFilters)` — comprehensive query builder

## Environment Variables

See `.env.example` for full documentation. Key variables:

| Variable | Default | Required in Prod |
|----------|---------|-----------------|
| `PORT` | `4000` | No |
| `NODE_ENV` | `development` | Yes |
| `DATABASE_URL` | `mongodb://localhost:27017/lambda_lap` | Yes |
| `JWT_SECRET` | dev fallback | **Yes** (crashes without) |
| `JWT_EXPIRES_IN` | `7d` | No |

## Docker

```bash
docker-compose up        # Start API + MongoDB
docker-compose up -d     # Detached mode
docker-compose down      # Stop all
docker build -t lambda-lap-api .  # Build image only
```

## Testing

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # With coverage report
```

Tests use mocking for database models. Test files mirror the controller structure.

## Known Gaps

- Code execution (`execution.controller.ts`) returns dummy results — needs real sandbox integration
- Rate limiting middleware exists but all limiters pass through (disabled)
- No input validation middleware (e.g., Joi/Zod) — controllers validate manually
- No file upload support yet
- Chat/mentorship models exist but no AI integration controller
- No graceful shutdown signal handlers in `server.ts`
- `queryBuilder.ts` utilities exist but are not yet used by controllers
