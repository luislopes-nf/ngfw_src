{
    "uniqueId": "virus-blocker-lite-CRxmUhVM",
    "category": "Virus Blocker Lite",
    "description": "A summary of virus blocking actions for Email activity.",
    "displayOrder": 4,
    "enabled": true,
    "javaClass": "com.untangle.node.reports.ReportEntry",
    "textColumns": [
        "sum(case when virus_blocker_lite_clean is not null then 1 else null end::int) as scanned",
        "sum(case when virus_blocker_lite_clean is false then 1 else null end::int) as blocked"
    ],
    "conditions": [
        {
            "column": "addr_kind",
            "javaClass": "com.untangle.node.reports.SqlCondition",
            "operator": "=",
            "value": "B"
        }
    ],
    "textString": "Virus Blocker Lite scanned {0} email messages of which {1} were blocked.", 
    "readOnly": true,
    "table": "mail_addrs",
    "title": "Virus Blocker Lite Email Summary",
    "type": "TEXT"
}
