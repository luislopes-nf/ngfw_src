{
    "uniqueId": "web-filter-lite-tZ6ULGGwUy",
    "category": "Web Filter Lite",
    "conditions": [
        {
            "column": "web_filter_lite_flagged",
            "javaClass": "com.untangle.node.reports.SqlCondition",
            "operator": "=",
            "value": "true"
        }
    ],
    "description": "The number of flagged web request grouped by username.",
    "displayOrder": 602,
    "enabled": true,
    "javaClass": "com.untangle.node.reports.ReportEntry",
    "orderByColumn": "value",
    "orderDesc": true,
    "units": "hits",
    "pieGroupColumn": "username",
    "pieSumColumn": "count(*)",
    "readOnly": true,
    "table": "http_events",
    "title": "Top Flagged Usernames",
    "pieStyle": "PIE",
    "type": "PIE_GRAPH"
}
