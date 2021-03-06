{
    "uniqueId": "intrusion-prevention-lyLTZYOp",
    "category": "Intrusion Prevention",
    "description": "The amount of detected pintrusions over time.",
    "displayOrder": 101,
    "enabled": true,
    "javaClass": "com.untangle.node.reports.ReportEntry",
    "orderDesc": false,
    "units": "hits",
    "readOnly": true,
    "table": "intrusion_prevention_events",
    "timeDataColumns": [
        "count(*) as detected"
    ],
    "colors": [
        "#e5e500"
    ],
    "timeDataInterval": "AUTO",
    "timeStyle": "BAR_3D_OVERLAPPED",
    "title": "Intrusion Detection (logged)",
    "type": "TIME_GRAPH"
}
