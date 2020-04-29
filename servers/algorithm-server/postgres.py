import psycopg2

def connectDatabase():
  conn = psycopg2.connect(database="indoor-localization-2.0", user = "macpro", password = "", host = "127.0.0.1", port = "5432")
  print ("Opened database successfully")
  return conn

def fetchAnchorData(conn, id):
  try:
    cur = conn.cursor()
    cur.execute("SELECT *  from anchor WHERE deviceid='%s'" % (id))
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
    cur.execute("UPDATE anchor set measuredpower = %f where deviceid = '%s'" % (measuredpower, id))
    conn.commit()
    if cur.rowcount>0:
      print ("Successfully Updated Measured Power of Anchor %s" % (id))
    else:
      print ("Nothing has been updated! Check your parameters again.")
  except psycopg2.DatabaseError as error:
    print (error)

# conn = connectDatabase()
# fetchAnchorData(conn, 'A1')
# inputAnchorData(conn, 'A1', -50.02)
# fetchAnchorData(conn, 'A1')
# conn.close()
