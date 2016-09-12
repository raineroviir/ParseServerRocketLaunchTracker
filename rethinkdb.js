var r = require('rethinkdb');

var dbConfig = {
  host: process.env.RDB_HOST || 'localhost',
  port: parseInt(process.env.RDB_PORT) || 28015,
  db: process.env.RDB_DB || 'chat',
  initTables: {
    'users': 'id'
  }
};

function setup() {
  r.connect({ host: dbConfig.host, port: dbConfig.port }), function(err, connection) {
    if (err) throw err;
    r.dbCreate(dbConfig.db).run(connection, function(err, result) {
      if (err) {
        console.log(err);
      } else {
        console.log('RethinkDB Database "%s" created', dbConfig.db);
      }

      for (var tbl in dbConfig.tables) {
        (function (tableName) {
          r.db(dbConfig.db).tableCreate(tableName, {primaryKey: dbConfig.initTables[tbl]}).run(connection, function(err, result) {
            if (err) {
              console.log(err);
            } else {
              console.log('RethinkDB table "%s" created', tableName);
            }
          });
        })(tbl);
      }
    })
  }
}

function onConnect(callback) {
  r.connect({
    host: dbConfig.host,
    port: dbConfig.port
  }, function(err, connection) {
    if (err) throw err;
    connection['_id'] = Math.floor(Math.random()*10001);
    callback(err, connection);
  });
}
