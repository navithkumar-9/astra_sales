"""Benchmark API endpoints: latency, SQL query count, serializer time."""
import json
import time
import cProfile
import pstats
import io
from contextlib import contextmanager

from django.core.management.base import BaseCommand
from django.db import connection, reset_queries
from django.test import RequestFactory
from django.contrib.auth import get_user_model
from rest_framework.test import force_authenticate

from core.views.enquiry_views import EnquiryViewSet
from core.views.master_data_views import (
    CustomerViewSet, SBUViewSet, DivisionViewSet, FGViewSet, RFQViewSet,
)
from core.views.user_views import UserListView, ProfileView
from core.views.auth_views import LoginView
from core.models.enquiry import Enquiry, EnquiryFGDetail
from core.models.customer import Customer
from core.models.sbu import SBU
from core.models.division import Division
from core.models.fg import FG
from core.models.rfq import RFQ
from core.serializers.enquiry import EnquiryReadSerializer

User = get_user_model()


@contextmanager
def query_counter():
    reset_queries()
    start = time.perf_counter()
    yield
    elapsed_ms = (time.perf_counter() - start) * 1000
    return elapsed_ms


class Command(BaseCommand):
    help = "Benchmark endpoints for latency and SQL query counts"

    def add_arguments(self, parser):
        parser.add_argument("--seed", type=int, default=50, help="Seed N enquiries for realistic test")
        parser.add_argument("--explain", action="store_true", help="Run EXPLAIN on slow queries")
        parser.add_argument("--profile-serializer", action="store_true", help="Profile serializer time")

    def handle(self, *args, **options):
        seed = options["seed"]
        self.stdout.write(self.style.MIGRATE_HEADING(f"\n=== PERF BENCHMARK (seed={seed}) ===\n"))

        user = User.objects.filter(role="SUPERADMIN").first()
        if not user:
            self.stdout.write(self.style.ERROR("No superadmin user found"))
            return

        self._seed_data(user, seed)
        factory = RequestFactory()

        endpoints = [
            ("GET /api/enquiries/?page_size=10", self._bench_enquiries_list, factory, user, {"page_size": "10"}),
            ("GET /api/enquiries/?page_size=200", self._bench_enquiries_list, factory, user, {"page_size": "200"}),
            ("GET /api/customers/?page_size=100", self._bench_viewset, CustomerViewSet, factory, user, {"page_size": "100"}),
            ("GET /api/sbus/?page_size=100", self._bench_viewset, SBUViewSet, factory, user, {"page_size": "100"}),
            ("GET /api/users/?role=SALES_REP", self._bench_users, factory, user),
            ("GET /api/profile/", self._bench_profile, factory, user),
        ]

        results = []
        for label, fn, *args in endpoints:
            reset_queries()
            t0 = time.perf_counter()
            response = fn(*args)
            elapsed_ms = (time.perf_counter() - t0) * 1000
            qcount = len(connection.queries)
            status = getattr(response, "status_code", "?")
            results.append({"endpoint": label, "ms": round(elapsed_ms, 2), "queries": qcount, "status": status})
            self.stdout.write(f"  {label}: {elapsed_ms:.2f}ms | {qcount} SQL queries | HTTP {status}")

        self.stdout.write(self.style.MIGRATE_HEADING("\n=== SUMMARY TABLE ==="))
        self.stdout.write(f"{'Endpoint':<45} {'Latency':>10} {'Queries':>8}")
        self.stdout.write("-" * 65)
        for r in results:
            self.stdout.write(f"{r['endpoint']:<45} {r['ms']:>8.2f}ms {r['queries']:>8}")

        if options["explain"]:
            self._run_explain()

        if options["profile_serializer"]:
            self._profile_serializer()

        # Simulate Enquiries page load (7 parallel requests)
        self.stdout.write(self.style.MIGRATE_HEADING("\n=== ENQUIRIES PAGE LOAD (7 requests) ==="))
        page_endpoints = [
            ("enquiries list", lambda: self._bench_enquiries_list(factory, user, {"page_size": "10"})),
            ("customers", lambda: self._bench_viewset(CustomerViewSet, factory, user, {"page_size": "100"})),
            ("sbus", lambda: self._bench_viewset(SBUViewSet, factory, user, {"page_size": "100"})),
            ("divisions", lambda: self._bench_viewset(DivisionViewSet, factory, user, {"page_size": "100"})),
            ("rfqs", lambda: self._bench_viewset(RFQViewSet, factory, user, {"page_size": "100"})),
            ("fgs", lambda: self._bench_viewset(FGViewSet, factory, user, {"page_size": "100"})),
            ("users", lambda: self._bench_users(factory, user)),
        ]
        total_ms = 0
        total_queries = 0
        for name, fn in page_endpoints:
            reset_queries()
            t0 = time.perf_counter()
            fn()
            ms = (time.perf_counter() - t0) * 1000
            qc = len(connection.queries)
            total_ms += ms
            total_queries += qc
            self.stdout.write(f"  {name}: {ms:.2f}ms, {qc} queries")
        self.stdout.write(f"  TOTAL (sequential): {total_ms:.2f}ms, {total_queries} queries")
        self.stdout.write(f"  Slowest single (parallel bound): ~{max(r['ms'] for r in results[:1] + [{'ms': total_ms/7}]):.2f}ms estimated")

    def _seed_data(self, user, n):
        existing = Enquiry.objects.count()
        if existing >= n:
            self.stdout.write(f"  Data already seeded ({existing} enquiries)")
            return

        customers = list(Customer.objects.all()[:1]) or [Customer.objects.create(name="Seed Customer")]
        sbus = list(SBU.objects.all()[:1]) or [SBU.objects.create(name="Seed SBU")]
        divisions = list(Division.objects.all()[:1]) or [Division.objects.create(name="Seed Division")]
        fgs = list(FG.objects.all()[:1]) or [FG.objects.create(fg_type="Seed FG")]
        rfqs = list(RFQ.objects.all()[:1]) or [RFQ.objects.create(name="Seed RFQ")]
        sales_rep = User.objects.filter(role="SALES_REP").first() or user

        to_create = n - existing
        self.stdout.write(f"  Seeding {to_create} enquiries...")
        for i in range(to_create):
            idx = existing + i + 1
            e = Enquiry.objects.create(
                project_number=f"TISPL-{4000 + idx}",
                rfq_date="2026-01-01",
                rfq_no=f"RFQ-{idx}",
                customer=customers[0],
                sbu=sbus[0],
                project_name=f"Project {idx}",
                division=divisions[0],
                rfq_due_date="2026-02-01",
                rfq_due_time="17:00:00",
                rfq_assign_date="2026-01-02",
                rfq_type=rfqs[0],
                fg_type=fgs[0],
                sales_rep=sales_rep,
            )
            EnquiryFGDetail.objects.create(enquiry=e, fg_part_no=f"FG-{idx}", description="Test", qty=1)

    def _bench_enquiries_list(self, factory, user, params):
        request = factory.get("/api/enquiries/", params)
        force_authenticate(request, user=user)
        view = EnquiryViewSet.as_view({"get": "list"})
        return view(request)

    def _bench_viewset(self, viewset_cls, factory, user, params):
        request = factory.get(f"/api/{viewset_cls.queryset.model.__name__.lower()}/", params)
        force_authenticate(request, user=user)
        view = viewset_cls.as_view({"get": "list"})
        return view(request)

    def _bench_users(self, factory, user):
        request = factory.get("/api/users/", {"role": "SALES_REP", "page_size": "100"})
        force_authenticate(request, user=user)
        return UserListView.as_view()(request)

    def _bench_profile(self, factory, user):
        request = factory.get("/api/profile/")
        force_authenticate(request, user=user)
        return ProfileView.as_view()(request)

    def _run_explain(self):
        self.stdout.write(self.style.MIGRATE_HEADING("\n=== EXPLAIN ANALYSIS ==="))
        from django.db import connection as conn
        queries = [
            ("enquiries list ORDER BY created_at", "SELECT * FROM enquiries ORDER BY created_at DESC LIMIT 10"),
            ("enquiries search icontains", "SELECT * FROM enquiries WHERE project_number LIKE '%TISPL%' OR project_name LIKE '%TISPL%' LIMIT 10"),
            ("enquiry_fg_details by enquiry", "SELECT * FROM enquiry_fg_details WHERE enquiry_id = 1"),
            ("users filter role", "SELECT * FROM core_user WHERE role = 'SALES_REP' ORDER BY date_joined DESC LIMIT 100"),
        ]
        with conn.cursor() as cursor:
            for label, sql in queries:
                cursor.execute(f"EXPLAIN {sql}")
                rows = cursor.fetchall()
                self.stdout.write(f"\n  {label}:")
                for row in rows:
                    self.stdout.write(f"    {row}")

    def _profile_serializer(self):
        self.stdout.write(self.style.MIGRATE_HEADING("\n=== SERIALIZER PROFILING (10 enquiries) ==="))
        qs = Enquiry.objects.all().order_by("-created_at")[:10]
        enquiries = list(qs)

        # Time without optimization (raw queryset, no prefetch)
        raw_qs = list(Enquiry.objects.all().order_by("-created_at")[:10])
        reset_queries()
        t0 = time.perf_counter()
        data = EnquiryReadSerializer(raw_qs, many=True).data
        unopt_ms = (time.perf_counter() - t0) * 1000
        unopt_q = len(connection.queries)

        self.stdout.write(f"  EnquiryReadSerializer (10 rows, NO prefetch): {unopt_ms:.2f}ms, {unopt_q} queries, {len(data)} results")

        # Time WITH optimization
        opt_qs = list(
            Enquiry.objects
            .select_related('customer', 'sbu', 'division', 'rfq_type', 'fg_type', 'sales_rep')
            .prefetch_related('fg_details')
            .order_by("-created_at")[:10]
        )
        reset_queries()
        t0 = time.perf_counter()
        opt_data = EnquiryReadSerializer(opt_qs, many=True).data
        opt_ms = (time.perf_counter() - t0) * 1000
        opt_q = len(connection.queries)

        self.stdout.write(f"  EnquiryReadSerializer (10 rows, WITH prefetch): {opt_ms:.2f}ms, {opt_q} queries, {len(opt_data)} results")

        # Profile with cProfile
        pr = cProfile.Profile()
        pr.enable()
        EnquiryReadSerializer(enquiries, many=True).data
        pr.disable()
        s = io.StringIO()
        ps = pstats.Stats(pr, stream=s).sort_stats("cumulative")
        ps.print_stats(15)
        self.stdout.write("\n  Top 15 cumulative (serializer):")
        for line in s.getvalue().split("\n")[:20]:
            if line.strip():
                self.stdout.write(f"    {line}")
