const sqlite3 = require('sqlite3')
const {open} = require('sqlite')
const express = require('express')
const path = require('path')
const bcrypt = require('bcrypt')

const dbPath = path.join(__dirname, 'userData.db')
const app = express()
app.use(express.json())

let db = null

const initDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('The Server is running at http://localhost:3000/')
    })
  } catch (err) {
    console.log(`DB error ${err.message}`)
    process.exit(1)
  }
}
initDbAndServer()

const validatePassword = password => {
  return password.length > 4
}

app.post('/register', async (request, response) => {
  const {username, name, password, gender, location} = request.body
  const hashPassword = await bcrypt.hash(password, 10)
  const selectedUser = `SELECT * FROM user WHERE username='${username}'`
  const dbUser = await db.get(selectedUser)

  if (dbUser === undefined) {
    const createUser = `INSERT INTO user (username, name, password, gender, location) 
        VALUES ( '${username}','${name}', '${hashPassword}', '${gender}', '${location}')`

    if (validatePassword(password)) {
      await db.run(createUser)
      response.send('User created successfully')
    } else {
      response.status(400)
      response.send('Password is too short')
    }
  } else {
    response.status(400)
    response.send('User already exists')
  }
})

app.post('/login', async (request, response) => {
  const {username, password} = request.body
  const selectedUser = `SELECT * FROM user WHERE username='${username}'`
  const dbUser = await db.get(selectedUser)

  if (dbUser === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const isMatching = await bcrypt.compare(password, dbUser.password)
    if (isMatching === true) {
      response.status(200)
      response.send('Login success!')
    } else {
      response.status(400)
      response.send('Invalid password')
    }
  }
})

app.put('/change-password', async (request, response) => {
  const {username, oldPassword, newPassword} = request.body
  const selectedUser = `SELECT * FROM user WHERE username='${username}'`
  const dbUser = await db.get(selectedUser)

  if (dbUser === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const isMatching = await bcrypt.compare(oldPassword, dbUser.password)
    if (isMatching === true) {
      if (validatePassword(newPassword)) {
        const hashPassword = await bcrypt.hash(newPassword, 10)
        const updatePassQuery = `UPDATE user SET passsword='${hashPassword}' 
                WHERE username='${username}'`
        await db.run(updatePassQuery)
        response.status(200)
        response.send('Password updated')
      } else {
        response.status(400)
        response.send('Password is too short')
      }
    } else {
      response.status(400)
      response.send('Invalid current password')
    }
  }
})

module.exports = app
