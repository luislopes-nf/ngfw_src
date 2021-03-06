{
    "uniqueId": "web-filter-lite-orfwZ0svEv",
    "category": "Web Filter Lite",
    "conditions": [
        {
            "column": "web_filter_lite_blocked",
            "javaClass": "com.untangle.node.reports.SqlCondition",
            "operator": "=",
            "value": "true"
        }
    ],
    "description": "The number of blocked web request grouped by client.",
    "displayOrder": 503,
    "enabled": true,
    "javaClass": "com.untangle.node.reports.ReportEntry",
    "orderByColumn": "value",
    "orderDesc": true,
    "units": "hits",
    "pieGroupColumn": "c_client_addr",
    "pieSumColumn": "count(*)",
    "readOnly": true,
    "table": "http_events",
    "title": "Top Blocked Clients",
    "pieStyle": "PIE",
    "type": "PIE_GRAPH"
}
