function firstLetterUppercase (str) {
  return str.toLowerCase().replace(/\b[a-z]/g, (letter) => letter.toUpperCase())
}

function editAuthors (authorsStr) {
  authorsStr = authorsStr.trim()
  if (authorsStr.replace(' ', '') === 'AAVV') return ['Sconosciuto']
  let authors = []
  if (authorsStr.includes('-')) {
    const parts = authorsStr.replace(/ -/g, '').split(' ')
    for (let i = 0, n = parts.length - 1; i < n; i += 2) {
      authors.push(firstLetterUppercase(parts[i]) + ' ' + firstLetterUppercase(parts[i + 1]))
    }
  } else {
    authors = [firstLetterUppercase(authorsStr)]
  }
  return authors
}

const formatBook = function (doc) {
  const ISBN = doc.CODICEISBN

  let titolo = doc.TITOLO
  titolo = firstLetterUppercase(titolo)

  let sottotitolo = doc.SOTTOTITOLO
  sottotitolo = firstLetterUppercase(sottotitolo)

  const prezzo = doc.PREZZO

  let autori = doc.AUTORI
  autori = editAuthors(autori)

  const volume = doc.VOLUME
  const editore = doc.EDITORE
  const materia = firstLetterUppercase(doc.DISCIPLINA)
  const URL = 'https://img.libraccio.it/images/' + ISBN + '_0_500_0_75.jpg'

  const data = {
    URL: URL,
    ISBN: ISBN,
    nome: titolo,
    sottotitolo: sottotitolo,
    autori: autori,
    volume: volume,
    editore: editore,
    materia: materia,
    prezzo: prezzo
  }
  return data
}

const findBook = function (ISBN, dbs, callback) {
  dbs.adozioni.findOne({ CODICEISBN: ISBN }, (err, doc) => {
    if (err) console.error(err)
    dbs.magazzino.findOne({ ISBN: ISBN }, { quantity: 1, _id: 0 }, (err, mag) => {
      if (err) console.error(err)
      let cb = {}
      if (doc) {
        doc = formatBook(doc)
        const quantity = (mag) ? mag.quantity : 0
        doc.quantity = quantity
        cb = doc
      }
      callback(cb)
    })
  })
}

module.exports = { findBook, formatBook }
