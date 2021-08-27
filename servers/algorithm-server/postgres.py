import psycopg2

def connectDatabase():
  try:
    conn = psycopg2.connect(database="indoor-localisation-2.0", user = "macpro", password = "postgres", host = "indoor-localisation.c4hb7kkxkku2.ap-southeast-1.rds.amazonaws.com", port = "5432")
    print ("Opened database successfully")
    return conn
  except psycopg2.DatabaseError as error:
    print (error)

def fetchAnchorData(conn, id):
  try:
    cur = conn.cursor()
    cur.execute("SELECT *  from anchor WHERE id='%s'" % (id))
    rows = cur.fetchall()
    for row in rows:
      print ("ID: ", row[0])
      print ("Sensitivity: ", row[1])
      print ("deviceId: ", row[2])
      print ("Measured Power: ", row[3])
      print ("offset: ", row[4])
      print ("\n")
    print ("Operation done successfully")
  except psycopg2.DatabaseError as error:
    print (error)

def inputAnchorData(conn, id, measuredpower):
  try:
    cur = conn.cursor()
    cur.execute("UPDATE anchor set measuredpower = %f where id = '%s'" % (measuredpower, id))
    conn.commit()
    if cur.rowcount>0:
      print ("Successfully Updated Measured Power of Anchor %s" % (id))
    else:
      print ("Nothing has been updated! Check your parameters again.")
  except psycopg2.DatabaseError as error:
    print (error)

def fetchMapData (conn, id):
  try:
    cur = conn.cursor()
    cur.execute("SELECT * from Map WHERE id='%s'" % (id))
    rows = cur.fetchall()
    for row in rows:
      print ("ID: ", row[0])
      print ("Scale: ", row[1])
      print ("Image: ", row[2])
      print ("Image URL: ", row[3])
      print ("Coordinates: ", row[4])
      print ("Navmesh: ", row[5])
      print ("POIS: ", row[6])
      print ("NavPath: ", row[7])
      print ("\n")
    print ("Operation done successfully")
  except psycopg2.DatabaseError as error:
    print (error)

def inputMapData(conn, id, url):
  try:
    cur = conn.cursor()
    cur.execute("UPDATE map set imageurl = '%s' where id = '%s'" % (url, id))
    conn.commit()
    if cur.rowcount>0:
      print ("Successfully Updated Image URL of Map %s" % (id))
    else:
      print ("Nothing has been updated! Check your parameters again.")
  except psycopg2.DatabaseError as error:
    print (error)

# conn = connectDatabase()
# fetchMapData(conn, 'actlab')
# fetchAnchorData(conn, 'rpi10')
# inputAnchorData()
# inputMapData(conn, 'simulation_ward', 'http://52.77.184.100:3000/api/Maps/simulation_ward/image')
# fetchMapData(conn, 'simulation_ward')
# fetchAnchorData(conn, 'A1')
# conn.close()
