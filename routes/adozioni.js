const { formatBook } = require('../searchBook')
const { addQuantities } = require('../utils')
module.exports = (app, dbs) => {
  app.get('/school', (req, res) => {
    const codice = req.query.codice
    dbs.schools.findOne({ CODICESCUOLA: codice }, (err, doc) => {
      if (err) console.error(err)
      res.send(doc)
    })
  })
  function schoolsLazyLoad (req, callback) {
    let queryFilter = {}
    if (req.query.filter) {
      const filter = req.query.filter.toLowerCase()
      queryFilter = {
        $where: function () {
          // TODO COMPLETA FILTER
          if (this.DENOMINAZIONESCUOLA.toLowerCase().includes(filter)) {
            return true
          }
          if (this.CODICESCUOLA.toLowerCase().includes(filter)) return true
          return false
        }
      }
    } else queryFilter = {}

    dbs.schools.count(queryFilter, (err, count) => {
      if (err) console.error(err)
      const query = dbs.schools.find(queryFilter)
      if (req.query.limit) {
        const limit = req.query.limit
        query.limit(limit)
      }
      if (req.query.sort) {
        query.sort({ DESCRIZIONETIPOLOGIAGRADOISTRUZIONESCUOLA: 1 })
      }
      query.exec((err, docs) => {
        if (err) console.error(err)
        const schools = []
        docs = docs || []
        docs.forEach(doc => {
          if (
            doc.CODICESCUOLA.substring(0, 4) !== 'VIIS' &&
            doc.DENOMINAZIONESCUOLA.substring(0, 2) !== 'IC' &&
            doc.DESCRIZIONETIPOLOGIAGRADOISTRUZIONESCUOLA !==
              'ISTITUTO COMPRENSIVO'
          ) {
            schools.push(doc)
          }
        })
        callback({ count, schools })
      })
    })
  }

  app.get('/schools', (req, res) => {
    // FILTER
    console.log('Schools')
    schoolsLazyLoad(req, data => res.send(data))
  })

  app.get('/schools/sorted', (req, res) => {
    schoolsLazyLoad(req, data => {
      const sorted = {
        INFANZIA: {
          label: "Scuola d'infanzia",
          schools: []
        },
        PRIMARIA: {
          label: 'Scuola primaria',
          schools: []
        },
        PRIMO_GRADO: {
          label: 'Scuola secondaria di I° grado',
          schools: []
        },
        SECONDO_GRADO: {
          label: 'Scuola secondaria di II° grado',
          schools: []
        }
      }
      data.schools.forEach(doc => {
        switch (doc.DESCRIZIONETIPOLOGIAGRADOISTRUZIONESCUOLA) {
          case 'SCUOLA INFANZIA':
            sorted.INFANZIA.schools.push(doc)
            break
          case 'SCUOLA PRIMARIA':
            sorted.PRIMARIA.schools.push(doc)
            break
          case 'SCUOLA PRIMO GRADO':
            sorted.PRIMO_GRADO.schools.push(doc)
            break
          default:
            sorted.SECONDO_GRADO.schools.push(doc)
            break
        }
      })
      res.send({ count: data.count, schools: sorted })
    })
  })

  app.get('/adozioni/classi', (req, res) => {
    const codice = req.query.scuola
    dbs.adozioni.find({ CODICESCUOLA: codice }, (err, docs) => {
      if (err) console.error(err)
      const classi = {} // struttura: {indirizzo: [classi], indirizzo: [classi], ...}
      docs.forEach(doc => {
        const classe = doc.ANNOCORSO + doc.SEZIONEANNO
        if (!Object.keys(classi).includes(doc.COMBINAZIONE)) {
          classi[doc.COMBINAZIONE] = []
        }
        if (!classi[doc.COMBINAZIONE].includes(classe)) {
          classi[doc.COMBINAZIONE].push(classe)
        }
      })
      Object.keys(classi).forEach(key => classi[key].sort())
      res.send(classi)
    })
  })

  app.get('/adozioni/libri', (req, res) => {
    const codice = req.query.codice
    const classe = req.query.classe
    const anno = classe.substring(0, 1)
    const sezione = classe.substring(1, classe.length)
    dbs.adozioni.find(
      { CODICESCUOLA: codice, ANNOCORSO: anno, SEZIONEANNO: sezione },
      (err, docs) => {
        if (err) console.error(err)
        const books = []
        docs.forEach(doc => {
          books.push(formatBook(doc))
        })
        addQuantities(books, dbs.magazzino).then(b => res.send(b))
      }
    )
  })
}
