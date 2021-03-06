{
    "uniqueId": "spam-blocker-lite-5iEy71XA",
    "category": "Spam Blocker Lite",
    "description": "The amount of spam email over time.",
    "displayOrder": 104,
    "enabled": true,
    "javaClass": "com.untangle.node.reports.ReportEntry",
    "orderDesc": false,
    "units": "msgs",
    "readOnly": true,
    "table": "mail_addrs",
    "timeDataColumns": [
        "sum(case when spam_blocker_lite_is_spam is true then 1 else null end::int) as spam"
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
        "#8c0000"
    ],
    "timeDataInterval": "AUTO",
    "timeStyle": "BAR_3D_OVERLAPPED",
    "title": "Email Usage (spam)",
    "type": "TIME_GRAPH"
}
