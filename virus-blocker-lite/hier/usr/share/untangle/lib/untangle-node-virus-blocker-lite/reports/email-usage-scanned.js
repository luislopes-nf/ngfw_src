{
    "uniqueId": "virus-blocker-lite-UXqcN61F",
    "category": "Virus Blocker Lite",
    "description": "The amount of scanned email over time.",
    "displayOrder": 302,
    "enabled": true,
    "javaClass": "com.untangle.node.reports.ReportEntry",
    "orderDesc": false,
    "units": "hits",
    "readOnly": true,
    "table": "mail_addrs",
    "timeDataColumns": [
        "sum(case when virus_blocker_lite_clean is not null then 1 else null end::int) as scanned"
    ],
    "conditions": [
        {
            "column": "addr_kind",
            "javaClass": "com.untangle.node.reports.SqlCondition",
            "operator": "=",
            "value": "B"
        }
    ],
    "colors": [
        "#396c2b"
    ],
    "timeDataInterval": "AUTO",
    "timeStyle": "BAR_3D_OVERLAPPED",
    "title": "Email Usage (scanned)",
    "type": "TIME_GRAPH"
}
