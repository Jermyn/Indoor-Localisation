pg  = require('pg');
pool = new pg.Pool({
user: 'macpro',
host: 'indoor-localisation.c4hb7kkxkku2.ap-southeast-1.rds.amazonaws.com',
database: 'indoor-localisation-2.0',
password: 'postgres',
port: 5432});

# pool.query("INSERT INTO beacon(id, measuredpower, deviceid) VALUES('3:18', -60, 'b18')", (err, res) => console.log res)
# pool.end()
# pool.query("INSERT INTO device(id, type, location) VALUES('b18', 'mobile', '[]')", (err, res) => console.log res)
# pool.end()
pool.query("UPDATE map set imageURL = 'http://52.77.184.100:3000/api/Maps/Ward52/image' where id = 'Ward52'", (err, result) => 
	if err 
		console.error 'Error executing query', err.stack
	console.log result)


 # "CREATE TABLE users(id SERIAL PRIMARY KEY, firstname VARCHAR(40) NOT NULL, lastName VARCHAR(40) NOT NULL)"
 # "INSERT INTO users(id, firstname, lastName) VALUES(1, 'Jermyn', 'Lai')"
 # "UPDATE users SET firstName='Jermz', lastName='Lai' WHERE id=1"
 # "DELETE FROM users WHERE id=1"

