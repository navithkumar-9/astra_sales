# Performance Debug Report

Date: 2026-07-20

Scope: backend endpoints, SQL query behavior, serializer time, external/background work, caching, browser/server-log evidence, and benchmark-after verification.

## 1. Measure Endpoint Latency

Browser measurement:

| Browser route | Result | DOMContentLoaded wall time |
|---|---|---:|
| `/login` | loaded login page | 373 ms |
| `/dashboard` | redirected to `/login` when unauthenticated | 269 ms |
| `/enquiries` | redirected to `/login` when unauthenticated | 217 ms |

Server logs showed the frontend was trying `POST /api/token/refresh/`, but the backend returned `404`. That made expired-token flows slower and caused failed session refreshes.

Authenticated endpoint latency measured through the Django request path, 7 samples per endpoint:

| Endpoint | Avg ms | P95/P99 ms | Cold SQL | Warm SQL | Payload |
|---|---:|---:|---:|---:|---:|
| `/api/profile/` | 76.62 | 462.92 | 1 | 0 | 219 B |
| `/api/dashboard/stats/` | 19.65 | 102.70 | 10 | 0 | 2739 B |
| `/api/enquiries/?page=1&page_size=10` | 22.46 | 99.96 | 3 | 0 | 18162 B |
| `/api/enquiries/?page=1&page_size=100&status=Pending with Engg` | 10.32 | 25.96 | 3 | 0 | 10843 B |
| `/api/activities/?page=1&page_size=10` | 17.57 | 21.01 | 2 | 2 | 3217 B |
| `/api/users/?page=1&page_size=10` | 12.35 | 14.76 | 2 | 2 | 937 B |
| `/api/sbus/?page=1&page_size=10` | 14.50 | 16.51 | 2 | 2 | 710 B |
| `/api/divisions/?page=1&page_size=10` | 18.23 | 27.55 | 2 | 2 | 720 B |
| `/api/fgs/?page=1&page_size=10` | 13.41 | 19.01 | 2 | 2 | 978 B |
| `/api/rfqs/?page=1&page_size=10` | 15.12 | 17.38 | 2 | 2 | 586 B |
| `/api/customers/?page=1&page_size=10` | 13.58 | 16.26 | 2 | 2 | 716 B |
| `/api/mails/?page=1&page_size=10` | 14.27 | 16.57 | 2 | 2 | 271 B |
| `/api/enquiries/{id}/` | 46.15 | 61.18 | 5 | 5 | 2117 B |
| `/api/activities/{id}/` | 11.69 | 14.26 | 1 | 1 | 301 B |

Slow areas:

- `/api/enquiries/{id}/` is the slowest normal authenticated endpoint because it intentionally loads full detail, audit logs, activity feed, and FG details.
- `/api/dashboard/stats/` has the highest cold SQL count, but caching reduces warm calls to 0 SQL.
- Frontend expired-token flow was slow/broken because `/api/token/refresh/` was missing.
- Frontend bundle still has a large `charts` chunk: `407.47 kB` raw, `116.41 kB` gzip.
- Current worktree has Grafana SMTP credentials directly in `docker-compose.yml`; move them to environment variables or secrets before production.

## 2. Count SQL Queries

Observed query counts:

- Enquiry list: 3 cold queries, 0 warm queries from cache.
- Dashboard stats: 10 cold queries, 0 warm queries from cache.
- Enquiry detail: 5 queries.
- Master-data lists: 2 queries each.
- Activity detail: 1 query.

No duplicate SQL queries were found in the current profiled endpoint set.

## 3. Identify N+1 Queries and Add Related Loading

Current state:

- Enquiry list uses `select_related()` for FK fields and `prefetch_related('fg_details')`.
- Enquiry detail uses `select_related()` plus `prefetch_related()` for `fg_details`, `audit_logs`, `audit_logs__user`, `activities`, and `activities__user`.
- Activity queryset uses `select_related('user', 'enquiry')`.

Fix already applied:

- Added separate `EnquiryListSerializer`.
- Removed audit/activity nested payload from list responses.
- Kept full `EnquiryReadSerializer` for detail responses.
- Updated the frontend detail modal to fetch full detail only when the modal opens.

Result:

- Enquiry list cold query count reduced from 7-8 queries to 3.
- No N+1 query pattern remains in the measured list/detail endpoints.

## 4. Run EXPLAIN and Verify Indexes

EXPLAIN findings:

- Enquiry status filter uses an index on `status`.
- Model declares `enq_status_created_idx` for `(status, -created_at)` and `enq_created_at_desc_idx` for `-created_at`.
- At current small row count, MySQL sometimes chooses the simpler status index or table scan plus sort. That is acceptable at 25 rows, but should be watched when data grows.
- Search with `icontains` uses `LIKE '%term%'`, which causes a table scan. Normal B-tree indexes cannot help leading-wildcard search.

Index recommendation:

- Keep existing status/date indexes.
- For large search volume, add MySQL full-text indexes on `project_number`, `project_name`, and `rfq_no`, then change search to full-text matching.

## 5. Profile Serializer Time

| Serializer | Rows | Time | Size |
|---|---:|---:|---:|
| Enquiry list serializer | 1 | 6.18 ms | 1890 B |
| Enquiry list serializer | 10 | 8.33 ms | 19335 B |
| Enquiry list serializer | 25 | 13.28 ms | 48538 B |
| Enquiry detail serializer | 1 | 11.18 ms | 2257 B |
| Enquiry detail serializer | 10 | 12.80 ms | 28895 B |
| Enquiry detail serializer | 25 | 25.92 ms | 58924 B |

Serializer bottleneck:

- Detail serialization is naturally heavier because it includes audit/activity data.
- List serialization is now lighter and appropriate for tables.

## 6. Check External API Calls and Background Tasks

External calls found:

- No HTTP client calls like `requests` or `httpx` were found in backend business code.
- Email work uses Django email backend and is already moved into Celery via `send_mail_all_task`.
- Export jobs have an async service path using Celery, though the active frontend export button still uses synchronous blob download.
- Cache refresh is moved to Celery with `refresh_all_caches`.
- SLA checks run in Celery.

Fix applied:

- Added missing `TokenRefreshView` route at `/api/token/refresh/`.
- Verified refresh endpoint now returns `200` and an `access` token.

Remaining recommendation:

- Align export UI with the async export service for large exports, so users do not wait for large CSV generation.

## 7. Add Caching Where Appropriate

Current caching:

- Dashboard stats are cached.
- Enquiry list responses are cached by query params.
- Cache invalidates after enquiry, activity, master-data, and SLA-warning mutations.
- Frontend master-data cache now includes query params, so filtered requests do not reuse stale unfiltered data.

Fixes already applied:

- Query-param-aware frontend master-data cache key.
- Prefix invalidation for all cached variants of a lookup resource.
- Enquiry list/detail split to avoid caching and shipping heavy detail data in list responses.
- SLA cache invalidation after background activity creation.
- Duplicate enquiry cache refresh removed from viewset create/update.

## 8. Benchmark Again

Before vs after key result:

| Metric | Before | After |
|---|---:|---:|
| Enquiry list cold SQL | 7-8 | 3 |
| Enquiry list warm SQL | 0 | 0 |
| Enquiry list avg latency | 9.24 ms in earlier 5-sample run | 5.31 ms after split in comparable run |
| Current 7-sample enquiry list avg | N/A | 22.46 ms with 99.96 ms cold outlier |
| Enquiry list payload | 20902 B | 18162 B current |
| Token refresh endpoint | 404 | 200 |
| Frontend build | passed | passed |
| Django system check | passed | passed |
| Backend tests | passed | passed |

## Files Changed

- `Backend/astra_sales/core/urls.py`: added `/api/token/refresh/`.
- `Backend/astra_sales/core/serializers/enquiry.py`: added list serializer.
- `Backend/astra_sales/core/views/enquiry_views.py`: split list/detail querysets and serializers.
- `Backend/astra_sales/core/tasks/cache_tasks.py`: logging and lighter cache warm-up serializer.
- `Backend/astra_sales/core/tasks/sla_tasks.py`: cache invalidation after SLA activity creation.
- `Frontend/frontend_admin/src/pages/Enquiries.jsx`: fetch full detail only when opening detail modal.
- `Frontend/frontend_admin/src/services/masterDataService.js`: query-param-aware cache keys.

## Validation

- `docker exec astra_backend python manage.py check`: passed.
- `docker exec astra_backend python manage.py test core --settings=astra_sales.test_settings`: passed.
- `npm run build`: passed.
- `/api/token/refresh/`: verified `200`.

## Final Diagnosis

The web app was slow mainly because enquiry list screens carried detail-only nested audit/activity data, and because expired-token refresh attempts hit a missing backend route. The list endpoint has been reduced to table-appropriate data, related loading is in place, caches are correctly invalidated, and token refresh now works.

Production blocker: remove hardcoded SMTP credentials from `docker-compose.yml`.
