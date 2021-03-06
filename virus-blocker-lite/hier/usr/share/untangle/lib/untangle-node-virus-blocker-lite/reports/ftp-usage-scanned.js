{
    "uniqueId": "virus-blocker-lite-1yPzD7n2",
    "category": "Virus Blocker Lite",
    "description": "The amount of scanned FTP requests over time.",
    "displayOrder": 202,
    "enabled": true,
    "javaClass": "com.untangle.node.reports.ReportEntry",
    "orderDesc": false,
    "units": "hits",
    "readOnly": true,
    "table": "ftp_events",
    "timeDataColumns": [
        "sum(case when virus_blocker_lite_clean is not null then 1 else null end::int) as scanned"
    ],
    "colors": [
        "#396c2b"
    ],
    "timeDataInterval": "AUTO",
    "timeStyle": "BAR_3D_OVERLAPPED",
    "title": "FTP Usage (scanned)",
    "type": "TIME_GRAPH"
}
