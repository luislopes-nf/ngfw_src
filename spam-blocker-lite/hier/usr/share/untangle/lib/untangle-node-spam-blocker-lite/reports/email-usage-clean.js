{
    "uniqueId": "spam-blocker-lite-JU5tVL8Y",
    "category": "Spam Blocker Lite",
    "description": "The amount of clean email over time.",
    "displayOrder": 103,
    "enabled": true,
    "javaClass": "com.untangle.node.reports.ReportEntry",
    "orderDesc": false,
    "units": "msgs",
    "readOnly": true,
    "table": "mail_addrs",
    "timeDataColumns": [
        "sum(case when spam_blocker_lite_is_spam is false then 1 else null end::int) as clean"
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
    "title": "Email Usage (clean)",
    "type": "TIME_GRAPH"
}
