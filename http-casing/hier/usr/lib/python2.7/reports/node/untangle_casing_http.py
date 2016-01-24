import reports.engine
import reports.sql_helper as sql_helper
import mx
import sys

from reports.engine import Node

class HttpCasing(Node):
    def __init__(self):
        Node.__init__(self, 'untangle-casing-http', 'HTTP')

    def parents(self):
        return ['untangle-vm']

    def create_tables(self):
        self.__create_http_events()

    @sql_helper.print_timing
    def __create_http_events(self):
        sql_helper.create_table("""\
CREATE TABLE reports.http_events (
    request_id bigint NOT NULL,
    time_stamp timestamp NOT NULL,
    session_id bigint,
    client_intf int2,
    server_intf int2,
    c_client_addr inet,
    s_client_addr inet,
    c_server_addr inet,
    s_server_addr inet,
    c_client_port integer,
    s_client_port integer,
    c_server_port integer,
    s_server_port integer,
    policy_id int2,
    username text,
    hostname text,
    method character(1),
    uri text,
    host text,
    domain text,
    referer text,
    c2s_content_length bigint,
    s2c_content_length bigint,
    s2c_content_type text,
    ad_blocker_cookie_ident text,
    ad_blocker_action character,
    web_filter_lite_reason character(1),
    web_filter_lite_category text,
    web_filter_lite_blocked boolean,
    web_filter_lite_flagged boolean,
    web_filter_reason character(1),
    web_filter_category text,
    web_filter_blocked boolean,
    web_filter_flagged boolean,
    virus_blocker_lite_clean boolean,
    virus_blocker_lite_name text,
    virus_blocker_clean boolean,
    virus_blocker_name text)""",
                                ["request_id"],
                                ["session_id",
                                 "policy_id",
                                 "time_stamp",
                                 "host",
                                 "domain",
                                 "username",
                                 "hostname",
                                 "c_client_addr",
                                 "client_intf",
                                 "server_intf",
                                 "web_filter_blocked",
                                 "web_filter_flagged",
                                 "web_filter_category",
                                 "web_filter_lite_blocked",
                                 "web_filter_lite_flagged",
                                 "web_filter_lite_category",
                                 "virus_blocker_clean",
                                 "virus_blocker_lite_clean",
                                 "ad_blocker_action"])

        sql_helper.add_column('http_events','referer','text') # 12.0

    def reports_cleanup(self, cutoff):
        sql_helper.clean_table("http_events", cutoff)

reports.engine.register_node(HttpCasing())
