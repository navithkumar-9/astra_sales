from django.utils import timezone
from django.db.models import Count, Sum, F, Q
from django.db.models.functions import TruncMonth
from datetime import timedelta
from core.models.enquiry import Enquiry

class DashboardService:
    @staticmethod
    def calculate_stats():
        """Calculate all dashboard KPIs and chart data from the database."""
        now_date = timezone.now().date()
        tomorrow_date = now_date + timedelta(days=1)

        qs = Enquiry.objects.all()
        terminal_statuses = ['Won', 'Lost', 'Regretted', 'Quote Regretted']
        pipeline_stages = [
            'Pending with Engg',
            'Pending with Costing',
            'Sales to Quote',
            'Pending with Sales',
            'Quote Submitted',
            'Open - L1',
            'Won',
        ]

        date_90_days_ago = now_date - timedelta(days=90)
        date_60_days_ago = now_date - timedelta(days=60)
        date_30_days_ago = now_date - timedelta(days=30)

        aggregates = qs.aggregate(
            total_enquiry_count=Count('id'),
            overall_pending_count=Count('id', filter=~Q(status__in=terminal_statuses)),
            quoted_90_days=Count('id', filter=~Q(status__in=terminal_statuses) & Q(rfq_date__lte=date_90_days_ago)),
            budgetary_count=Count('id', filter=Q(rfq_type__name__icontains='Budgetary')),
            open_l1_count=Count('id', filter=Q(status='Open - L1')),
            won_count=Count('id', filter=Q(status='Won')),
            regretted_count=Count('id', filter=Q(status='Regretted')),
            lost_count=Count('id', filter=Q(status='Lost')),
            hold_count=Count('id', filter=Q(status='On Hold')),
            quoted_value=Sum('quote_value'),
            budgetary_value=Sum('quote_value', filter=Q(rfq_type__name__icontains='Budgetary')),
            po_value=Sum('po_value'),
            open_l1_value=Sum('open_l1_value'),
            lost_value=Sum('lost_value'),
            hold_value=Sum('quote_value', filter=Q(status='On Hold')),
            todays_due=Count('id', filter=Q(rfq_due_date=now_date)),
            tomorrow_due=Count('id', filter=Q(rfq_due_date=tomorrow_date)),
            recent_created_count=Count('id', filter=Q(created_at__gte=timezone.now() - timedelta(days=30))),
            overdue_count=Count('id', filter=~Q(status__in=terminal_statuses) & Q(rfq_due_date__lt=now_date)),
            ageing_0_30=Count('id', filter=Q(rfq_date__gte=date_30_days_ago) & ~Q(status__in=terminal_statuses)),
            ageing_31_60=Count('id', filter=Q(rfq_date__lt=date_30_days_ago, rfq_date__gte=date_60_days_ago) & ~Q(status__in=terminal_statuses)),
            ageing_61_90=Count('id', filter=Q(rfq_date__lt=date_60_days_ago, rfq_date__gte=date_90_days_ago) & ~Q(status__in=terminal_statuses)),
            ageing_over_90=Count('id', filter=Q(rfq_date__lt=date_90_days_ago) & ~Q(status__in=terminal_statuses)),
            total_quoted_records=Count('id', filter=Q(status='Quote Submitted')),
            quoted_over_90=Count('id', filter=Q(status='Quote Submitted', quote_date__lt=date_90_days_ago)),
            quoted_awaiting_reply=Count('id', filter=Q(status='Quote Submitted')),
            quoted_client_response=Count('id', filter=Q(quote_date__isnull=False, status__in=['Open - L1', 'Won', 'Lost', 'Regretted', 'Quote Regretted'])),
        )
        status_counts = {
            item['status']: item['value']
            for item in qs.values('status').annotate(value=Count('id'))
        }

        won_cnt = aggregates['won_count'] or 0
        lost_cnt = aggregates['lost_count'] or 0
        win_rate = round((won_cnt / (won_cnt + lost_cnt)) * 100, 1) if (won_cnt + lost_cnt) > 0 else 0.0

        kpis = {
            "totalEnquiryCount": aggregates['total_enquiry_count'],
            "overallPendingCount": aggregates['overall_pending_count'],
            "quoted90Days": aggregates['quoted_90_days'],
            "budgetaryCount": aggregates['budgetary_count'],
            "openL1Count": aggregates['open_l1_count'],
            "wonCount": aggregates['won_count'],
            "regrettedCount": aggregates['regretted_count'],
            "lostCount": aggregates['lost_count'],
            "holdCount": aggregates['hold_count'],
            "quotedValue": aggregates['quoted_value'] or 0,
            "budgetaryValue": aggregates['budgetary_value'] or 0,
            "poValue": aggregates['po_value'] or 0,
            "openL1Value": aggregates['open_l1_value'] or 0,
            "lostValue": aggregates['lost_value'] or 0,
            "holdValue": aggregates['hold_value'] or 0,
            "todaysDue": aggregates['todays_due'],
            "tomorrowDue": aggregates['tomorrow_due'],
            "recentCreatedCount": aggregates['recent_created_count'],
            "overdueCount": aggregates['overdue_count'],
            "winRate": win_rate,
            "totalQuotedRecords": aggregates['total_quoted_records'],
            "quotedOver90": aggregates['quoted_over_90'],
            "quotedAwaitingReply": aggregates['quoted_awaiting_reply'],
            "quotedClientResponse": aggregates['quoted_client_response'],
        }

        status_distribution = [
            {"status": status, "value": value}
            for status, value in status_counts.items()
        ]

        monthly_trend_qs = qs.annotate(month=TruncMonth('rfq_date')).values('month').annotate(count=Count('id')).order_by('month')
        monthly_trend = [{"name": item['month'].strftime('%b %Y') if item['month'] else 'Unknown', "value": item['count']} for item in monthly_trend_qs]

        pipeline_data = [
            {"name": stage, "value": status_counts.get(stage, 0)}
            for stage in pipeline_stages
        ]

        win_loss_trend_qs = qs.filter(status__in=['Won', 'Lost']).annotate(month=TruncMonth('rfq_date')).values('month', 'status').annotate(count=Count('id'))
        win_loss_trend_dict = {}
        for item in win_loss_trend_qs:
            month_str = item['month'].strftime('%b %Y') if item['month'] else 'Unknown'
            if month_str not in win_loss_trend_dict:
                win_loss_trend_dict[month_str] = {"month": month_str, "Won": 0, "Lost": 0}
            win_loss_trend_dict[month_str][item['status']] = item['count']
        win_loss_trend = list(win_loss_trend_dict.values())

        sales_performance = list(qs.exclude(sales_rep__isnull=True).values(name=F('sales_rep__username')).annotate(count=Count('id')).order_by('-count'))

        ageing_data = [
            {"name": "0-30 Days", "value": aggregates['ageing_0_30']},
            {"name": "31-60 Days", "value": aggregates['ageing_31_60']},
            {"name": "61-90 Days", "value": aggregates['ageing_61_90']},
            {"name": ">90 Days", "value": aggregates['ageing_over_90']},
        ]

        open_opps = [
            {"status": status, "value": value}
            for status, value in status_counts.items()
            if status not in terminal_statuses
        ]

        monthly_quote_qs = qs.annotate(month=TruncMonth('quote_date')).values('month').annotate(total=Sum('quote_value')).order_by('month')
        monthly_quote_value = [{"name": item['month'].strftime('%b %Y') if item['month'] else 'Unknown', "value": item['total'] or 0} for item in monthly_quote_qs if item['month']]

        revenue_forecast = [{"name": "Open-L1 Forecast", "value": aggregates['open_l1_value'] or 0}]

        top_customers = list(qs.exclude(customer__isnull=True).values(name=F('customer__name')).annotate(value=Sum('quote_value')).order_by('-value')[:10])
        for tc in top_customers:
            tc['value'] = tc['value'] or 0

        next_7_days = [now_date + timedelta(days=i) for i in range(7)]
        due_counts = {
            item['rfq_due_date']: item['value']
            for item in qs.filter(
                rfq_due_date__gte=now_date,
                rfq_due_date__lte=next_7_days[-1],
            ).values('rfq_due_date').annotate(value=Count('id'))
        }
        followup_timeline = [
            {"name": d.strftime('%a %d'), "value": due_counts.get(d, 0)}
            for d in next_7_days
        ]

        quote_enqs = qs.filter(quote_date__isnull=False, rfq_date__isnull=False).values('quote_date', 'rfq_date')
        total_days = 0
        valid_count = 0
        for enq in quote_enqs:
            delta = enq['quote_date'] - enq['rfq_date']
            total_days += max(delta.days, 0)
            valid_count += 1
            
        avg_tat = (total_days / valid_count) if valid_count > 0 else 0
        tat_data = [{"name": "Avg Turnaround (Days)", "value": round(avg_tat, 1)}]

        pending_dept = [
            {"name": "Engineering", "value": status_counts.get('Pending with Engg', 0)},
            {"name": "Costing", "value": status_counts.get('Pending with Costing', 0)},
            {
                "name": "Sales",
                "value": status_counts.get('Pending with Sales', 0) + status_counts.get('Sales to Quote', 0),
            },
        ]

        # Get the 10 newest Quote Submitted enquiries
        quote_submitted_qs = qs.filter(status='Quote Submitted').order_by('-created_at')[:10]
        recent_quotes = []
        for enq in quote_submitted_qs.select_related('customer', 'sbu', 'division', 'sales_rep'):
            recent_quotes.append({
                "id": enq.id,
                "project_number": enq.project_number,
                "project_name": enq.project_name,
                "customer": enq.customer.name if enq.customer else "",
                "sbu": enq.sbu.name if enq.sbu else "",
                "quote_value": float(enq.quote_value) if enq.quote_value is not None else 0.0,
                "created_at": enq.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                "sales_rep": enq.sales_rep.username if enq.sales_rep else ""
            })

        charts = {
            "statusDistribution": status_distribution,
            "monthlyTrend": monthly_trend,
            "pipeline": pipeline_data,
            "winLossTrend": win_loss_trend,
            "salesPerformance": sales_performance,
            "ageing": ageing_data,
            "openOpportunities": open_opps,
            "monthlyQuoteValue": monthly_quote_value,
            "revenueForecast": revenue_forecast,
            "topCustomers": top_customers,
            "followupTimeline": followup_timeline,
            "tatData": tat_data,
            "pendingByDept": pending_dept
        }

        return {
            "kpis": kpis,
            "charts": charts,
            "recentQuotes": recent_quotes
        }
