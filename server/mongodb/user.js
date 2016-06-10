db.createRole({
    "role": "socex",
    "privileges": [
        {
            "resource": {
                "db": "socex",
                "collection": ""
            },
            "actions": [
                "find",
                "insert",
                "remove",
                "update",
                "bypassDocumentValidation",
                "changeCustomData",
                "changeOwnCustomData",
                "changeOwnPassword",
                "changePassword",
                "createCollection",
                "createIndex",
                "dropCollection",
                "emptycapped",
                "enableProfiler",
                "grantRole",
                "killCursors",
                "revokeRole",
                "unlock",
                "viewRole",
                "viewUser",
                "authSchemaUpgrade",
                "cleanupOrphaned",
                "cpuProfiler",
                "inprog",
                "invalidateUserCache",
                "killop",
                "planCacheRead",
                "planCacheWrite",
                "storageDetails",
                "appendOplogNote",
                "replSetConfigure",
                "replSetGetStatus",
                "replSetHeartbeat",
                "replSetStateChange",
                "resync",
                "addShard",
                "enableSharding",
                "flushRouterConfig",
                "getShardMap",
                "getShardVersion",
                "listShards",
                "moveChunk",
                "removeShard",
                "shardingState",
                "splitChunk",
                "splitVector",
                "applicationMessage",
                "closeAllDatabases",
                "collMod",
                "compact",
                "connPoolSync",
                "convertToCapped",
                "dropDatabase",
                "dropIndex",
                "fsync",
                "getParameter",
                "hostInfo",
                "logRotate",
                "reIndex",
                "renameCollectionSameDB",
                "repairDatabase",
                "setParameter",
                "shutdown",
                "touch",
                "collStats",
                "connPoolStats",
                "dbHash",
                "dbStats",
                "diagLogging",
                "getCmdLineOpts",
                "getLog",
                "indexStats",
                "listDatabases",
                "listCollections",
                "listIndexes",
                "netstat",
                "serverStatus",
                "validate",
                "top"
            ]
        }
    ],
    "roles": []
});

db.createUser({
    "user": "socex",
    "pwd": "eequ2eizain8Etohxei0yoGaixeeviey3rei",
    "roles": ["socex"]
});

db.createUser({
    "user": "root",
    "pwd": "eNahToophah1ahgi9jiyooboiG8faiK3phohchoh9tahchoh",
    "roles": [
        "root"
    ]
});
