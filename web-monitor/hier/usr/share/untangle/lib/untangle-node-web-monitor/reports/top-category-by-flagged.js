{
    "uniqueId": "web-monitor-Yzg3NWI4YT",
    "category": "Web Monitor",
    "description": "The number of flagged web requests grouped by category.",
    "displayOrder": 202,
    "enabled": true,
    "javaClass": "com.untangle.node.reports.ReportEntry",
    "orderByColumn": "value",
    "orderDesc": true,
    "units": "hits",
    "pieGroupColumn": "web_filter_category",
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
    "title": "Top Flagged Categories",
    "pieStyle": "PIE",
    "type": "PIE_GRAPH"
}
