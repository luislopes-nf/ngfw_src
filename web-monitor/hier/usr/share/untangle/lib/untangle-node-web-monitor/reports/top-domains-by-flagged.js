{
    "uniqueId": "web-monitor-KWuAYyvfpH",
    "category": "Web Monitor",
    "description": "The number of flagged web requests grouped by domain.",
    "displayOrder": 313,
    "enabled": true,
    "javaClass": "com.untangle.node.reports.ReportEntry",
    "orderByColumn": "value",
    "orderDesc": true,
    "units": "hits",
    "pieGroupColumn": "domain",
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
   "title": "Top Flagged Domains",
    "pieStyle": "PIE",
   "type": "PIE_GRAPH"
}
