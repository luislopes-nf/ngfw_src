{
    "category": "Ad Blocker",
    "readOnly": true,
    "type": "EVENT_LIST",
    "conditions": [
        {
            "column": "ad_blocker_action",
            "javaClass": "com.untangle.node.reports.SqlCondition",
            "operator": "=",
            "value": "B"
        }
    ],
    "defaultColumns": ["time_stamp","username","hostname","host","uri","ad_blocker_action","s_server_addr"],
    "description": "HTTP requests blocked by Ad Blocker.",
    "displayOrder": 1011,
    "javaClass": "com.untangle.node.reports.ReportEntry",
    "table": "http_events",
    "title": "Blocked Ad Events",
    "uniqueId": "ad-blocker-ECY88KD9AT"
}
