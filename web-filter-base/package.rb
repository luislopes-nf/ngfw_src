# -*-ruby-*-

http = BuildEnv::SRC['untangle-casing-http']
web_filter = BuildEnv::SRC['untangle-base-web-filter']

NodeBuilder.makeBase(BuildEnv::SRC, 'untangle-base-web-filter', 'web-filter-base', [http['src']])

deps = [web_filter['src'], http['src']]

ServletBuilder.new(web_filter, 'com.untangle.node.web_filter.jsp', "./web-filter-base/servlets/web-filter", [], deps, [], [BuildEnv::SERVLET_COMMON])


