<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into the Training Library Next.js app. PostHog is now initialized via `instrumentation-client.ts` (the recommended approach for Next.js 15.3+), with a reverse proxy configured in `next.config.ts` for reliable ingestion. Five new client-side events are tracked, users are identified on login and signup (both client- and server-side), and `posthog.reset()` is called on logout. Server-side events are captured in the auth API routes using `posthog-node` via a shared `posthog-server.ts` client, ensuring cross-domain event correlation.

| Event | Description | File(s) |
|---|---|---|
| `user_signed_in` | User successfully signs in | `src/components/LoginForm.tsx`, `app/api/auth/login/route.ts` |
| `user_signed_up` | User successfully registers | `src/components/RegisterForm.tsx`, `app/api/auth/register/route.ts` |
| `user_signed_out` | User clicks the log out button | `src/components/LogoutButton.tsx` |
| `lesson_completed` | User marks a lesson as complete | `src/components/LessonContent.tsx` |
| `lesson_uncompleted` | User unmarks a lesson as complete | `src/components/LessonContent.tsx` |

Previously instrumented events (unchanged): `course_clicked`, `lesson_clicked`, `lesson_viewed` (in `src/lib/analytics.ts`).

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- **Dashboard — Analytics basics**: https://us.posthog.com/project/341786/dashboard/1362558
- **Sign ins & Sign ups (daily)**: https://us.posthog.com/project/341786/insights/w8T71tbw
- **User acquisition funnel** (sign up → course click → lesson click → lesson completed): https://us.posthog.com/project/341786/insights/KausoTSo
- **Lesson completions vs uncomletions**: https://us.posthog.com/project/341786/insights/YkUGbGSm
- **Course & lesson engagement**: https://us.posthog.com/project/341786/insights/2wEqEMSB
- **Daily active users who signed out** (churn signal): https://us.posthog.com/project/341786/insights/7I8o2Wqj

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
