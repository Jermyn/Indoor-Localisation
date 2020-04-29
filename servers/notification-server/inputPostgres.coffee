pg  = require('pg');
pool = new pg.Pool({
user: 'macpro',
host: '127.0.0.1',
database: 'indoor-localization-2.0',
# password: 123,
port: 5432});

pool.query("INSERT INTO beacon(id, measuredpower, deviceid) VALUES('3:18', -60, 'b18')", (err, res) => console.log res)
# pool.end()
pool.query("INSERT INTO device(id, type, location) VALUES('b18', 'mobile', '[]')", (err, res) => console.log res)
pool.end()



 # "CREATE TABLE users(id SERIAL PRIMARY KEY, firstname VARCHAR(40) NOT NULL, lastName VARCHAR(40) NOT NULL)"
 # "INSERT INTO users(id, firstname, lastName) VALUES(1, 'Jermyn', 'Lai')"
 # "UPDATE users SET firstName='Jermz', lastName='Lai' WHERE id=1"
 # "DELETE FROM users WHERE id=1"