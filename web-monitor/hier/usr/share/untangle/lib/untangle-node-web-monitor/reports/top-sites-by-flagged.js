{
    "uniqueId": "web-monitor-DAzMWYzOGY1",
    "category": "Web Monitor",
    "description": "The number of flagged web requests grouped by website.",
    "displayOrder": 302,
    "enabled": true,
    "javaClass": "com.untangle.node.reports.ReportEntry",
    "orderByColumn": "value",
    "orderDesc": true,
    "units": "hits",
    "pieGroupColumn": "host",
    "pieSumColumn": "count(*)",
     "conditions": [
        {
            "column": "web_filter_flagged",
            "javaClass": "com.untangle.node.reports.SqlCondition",
            "operator": "=",
            "value": "true"
        }
    ],
   "readOnly": true,
   "table": "http_events",
   "title": "Top Flagged Sites",
    "pieStyle": "PIE",
   "type": "PIE_GRAPH"
}
