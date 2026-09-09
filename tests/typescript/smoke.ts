// Compile-time consumer test. This file is never executed.
import nlp from 'es-compromise'

const doc = nlp('veinticinco libros')
const text: string = doc.text()
const value: number | number[] = doc.numbers().get()
doc.numbers().add(1).toText()
doc.contractions().expand()

const tokens = nlp.tokenize('un texto corto')
const version: string = nlp.version

// @ts-expect-error input text must be a string
nlp(25)

export { text, tokens, value, version }
