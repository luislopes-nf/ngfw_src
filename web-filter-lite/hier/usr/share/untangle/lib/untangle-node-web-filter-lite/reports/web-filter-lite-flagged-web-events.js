{
    "category": "Web Filter Lite",
    "readOnly": true,
    "type": "EVENT_LIST",
    "conditions": [
        {
            "column": "web_filter_lite_flagged",
            "javaClass": "com.untangle.node.reports.SqlCondition",
            "operator": "is",
            "value": "TRUE"
        }
    ],
    "defaultColumns": ["time_stamp","hostname","username","host","uri","web_filter_lite_blocked","web_filter_lite_flagged","web_filter_lite_reason","web_filter_lite_category","s_server_addr","s_server_port"],
    "description": "Shows all flagged web requests.",
    "displayOrder": 1020,
    "javaClass": "com.untangle.node.reports.ReportEntry",
    "table": "http_events",
    "title": "Flagged Web Events",
    "uniqueId": "web-filter-lite-5KX7K1R864"
}
