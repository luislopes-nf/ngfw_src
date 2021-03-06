{
    "category": "Virus Blocker Lite",
    "readOnly": true,
    "type": "EVENT_LIST",
    "conditions": [
        {
            "column": "addr_kind",
            "javaClass": "com.untangle.node.reports.SqlCondition",
            "operator": "=",
            "value": "B"
        },
        {
            "column": "virus_blocker_lite_clean",
            "javaClass": "com.untangle.node.reports.SqlCondition",
            "operator": "is",
            "value": "TRUE"
        }
    ],
    "defaultColumns": ["time_stamp","hostname","username","addr","sender","s_server_addr","s_server_port"],
    "description": "Scanned email sessions marked clean.",
    "displayOrder": 1022,
    "javaClass": "com.untangle.node.reports.ReportEntry",
    "table": "mail_addrs",
    "title": "Clean Email Events",
    "uniqueId": "virus-blocker-lite-F89NAEM9MF"
}
