{
    "uniqueId": "phish-blocker-LZ3oI0bA",
    "category": "Phish Blocker",
    "description": "The amount of scanned email over time.",
    "displayOrder": 102,
    "enabled": true,
    "javaClass": "com.untangle.node.reports.ReportEntry",
    "orderDesc": false,
    "units": "msgs",
    "readOnly": true,
    "table": "mail_addrs",
    "timeDataColumns": [
        "sum(case when phish_blocker_is_spam is not null then 1 else null end::int) as scanned"
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
        "#b2b2b2"
    ],
    "timeDataInterval": "AUTO",
    "timeStyle": "BAR_3D_OVERLAPPED",
    "title": "Email Usage (scanned)",
    "type": "TIME_GRAPH"
}
