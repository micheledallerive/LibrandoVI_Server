const Datastore = require('nedb')
const fs = require('fs')

const addQuantities = (books, magazzino) => {
  return new Promise((resolve, reject) => {
    magazzino.find({}, { _id: 0 }, (err, mgs) => {
      if (err) console.error(err)
      for (let bookIndex = 0, n = books.length; bookIndex < n; bookIndex++) {
        let quantity = 0
        for (let magIndex = 0, m = mgs.length; magIndex < m; magIndex++) {
          if (mgs[magIndex].ISBN === books[bookIndex].ISBN) quantity = mgs[magIndex].quantity
        }
        books[bookIndex].quantity = quantity
      }
      resolve(books)
    })
  })
} 

const getQuantities = (magazzino) => {
  return new Promise((resolve, reject) => {
    magazzino.find({}, { _id: 0 }, (err, mgs) => {
      if (err) console.error(err)
      resolve(mgs)
    })
  })
}

const loadDbs = () => {
  const dbs = {}
  fs.readdirSync('./dbs/').forEach(file => {
    if (!file.includes('~')) {
      const filename = file.split('.')[0]
      dbs[filename] = new Datastore({ filename: './dbs/' + file, autoload: true })
    }
  })
  return dbs
}

module.exports = { addQuantities, getQuantities, loadDbs }
