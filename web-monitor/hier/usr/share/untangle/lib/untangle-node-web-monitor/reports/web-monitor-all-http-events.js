{
    "uniqueId": "web-monitor-V5DNHWEKT7",
    "category": "Web Monitor",
    "readOnly": true,
    "type": "EVENT_LIST",
    "conditions": [
        {
            "column": "web_filter_blocked",
            "javaClass": "com.untangle.node.reports.SqlCondition",
            "operator": "is not",
            "value": "NULL"
        },
        {
            "column": "s_server_port",
            "javaClass": "com.untangle.node.reports.SqlCondition",
            "operator": "=",
            "value": "80"
        }
    ],
    "defaultColumns": ["time_stamp","hostname","username","host","uri","web_filter_blocked","web_filter_flagged","web_filter_reason","web_filter_category","s_server_addr","s_server_port"],
    "description": "Shows all scanned unencrypted HTTP requests.",
    "displayOrder": 1013,
    "javaClass": "com.untangle.node.reports.ReportEntry",
    "table": "http_events",
    "title": "All HTTP Events"
}
