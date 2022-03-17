const { findBook, formatBook } = require('../searchBook')
const { getQuantities } = require('../utils')
const moment = require('moment')
module.exports = (app, dbs) => {
  app.get('/book/:isbn', (req, res) => {
    const isbn = req.params.isbn
    findBook(isbn, dbs, data => {
      res.send(data)
    })
  })

  function countUniqueISBNs (arr) {
    const found = []
    arr.forEach(item => {
      const isbn = item.CODICEISBN
      if (!found.includes(isbn)) found.push(isbn)
    })
    return found.length
  }

  app.get('/books', (req, res) => {
    // restituisce in JSON la lista di libri per l'anno scolastico 2021/2022
    // TODO DA COMPLETARE IL 01/07 (in teoria)

    // FILTER
    let queryFilter = {}
    if (req.query.filter) {
      const filter = req.query.filter.toLowerCase()
      queryFilter = {
        $where: function () {
          if (this.CODICEISBN.toLowerCase().includes(filter)) return true
          if (
            (
              this.TITOLO.toLowerCase() + this.SOTTOTITOLO.toLowerCase()
            ).includes(filter)
          ) {
            return true
          }
          if (this.AUTORI.toLowerCase().includes(filter)) return true
          return false
        }
      }
    } else {
      queryFilter = {}
    }

    Promise.all([
      new Promise((resolve, reject) =>
        dbs.adozioni.find(queryFilter, { CODICEISBN: 1 }, (err, countDocs) => {
          if (err) console.error(err)
          resolve(countDocs)
        })
      ),
      new Promise((resolve, reject) => {
        const query = dbs.adozioni.find(queryFilter)
        if (req.query.limit) {
          const limit = req.query.limit
          query.limit(limit)
        }
        query.exec((err, docs) => {
          if (err) console.error(err)
          resolve(docs)
        })
      }),
      getQuantities(dbs.magazzino)
    ]).then(([countDocs, docs, mgs]) => {
      const count = countUniqueISBNs(countDocs)
      const books = []
      docs = docs || []
      docs.forEach(doc => {
        if (!books.some(b => b.ISBN === doc.CODICEISBN)) {
          const book = formatBook(doc)
          books.push(book)
        }
      })
      for (let bookIndex = 0, n = books.length; bookIndex < n; bookIndex++) {
        let quantity = 0
        for (let magIndex = 0, m = mgs.length; magIndex < m; magIndex++) {
          if (mgs[magIndex].ISBN === books[bookIndex].ISBN) {
            quantity = mgs[magIndex].quantity
          }
        }
        books[bookIndex].quantity = quantity
      }
      res.send({ count, books })
    })
  })

  app.get('/magazzino/quantity/:isbn', (req, res) => {
    const isbn = req.params.isbn
    let buying = true
    if (isbn.substring(0, 1) === '-') buying = false
    dbs.magazzino.findOne({ ISBN: isbn }, (err, doc) => {
      if (err) console.error(err)
      if (doc) res.send({ max: doc.quantity })
      else res.send({ max: buying ? 0 : 10 })
    })
  })

  app.get('/magazzino', (req, res) => {
    dbs.magazzino.find({}, (err, docs) => {
      if (err) console.error(err)
      res.send(docs)
    })
  })

  function checkOrderQuery (body) {
    if (
      body.nome === '' ||
      body.cognome === '' ||
      body.email === '' ||
      body.tassa === '' ||
      body.prezzoLibri === '' ||
      body.prezzoTotale === '' ||
      Object.keys(body.libri).length === 0
    ) {
      return false
    }
    if (Object.values(body).some(v => v === null || v === undefined)) {
      return false
    }
    return true
  }

  app.post('/order', (req, res) => {
    const response = {
      success: true,
      error: null,
      id: null
    }
    req.body.data = moment().format('DD/MM/YYYY, kk:mm:ss')
    if (checkOrderQuery(req.body)) {
      dbs.ordini.insert(req.body, (err, newDoc) => {
        if (err) {
          response.success = false
          response.error = err
        } else {
          response.success = true
          response.id = newDoc._id
        }
        res.send(response)
      })
    } else {
      response.success = false
      response.error = 'form_data'
      res.send(response)
    }
  })

  app.get('/ordini', (req, res) => {
    dbs.ordini.find({}, (err, docs) => {
      if (err) console.error(err)
      res.send(docs)
    })
  })
}
