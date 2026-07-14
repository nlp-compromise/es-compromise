### 0.3.0 [July 2026]

- **[new]** - imperfect tense (pretérito imperfecto) - conjugation, tagging + toRoot ('trabajaba', 'vivíamos')
- **[new]** - imperfect subjunctive, -ra and -se series ('si pudiera', 'si pudiese')
- **[new]** - enclitic pronoun recognition - 'dámelo', 'vistiéndose', 'quemarme', 'vámonos'
- **[fix]** - core function-words - 'que' is a Conjunction, 'se' a Pronoun, 'hay' a Verb; accented 'qué/cómo/dónde/cuándo' are the QuestionWords
- **[fix]** - 'mi/tu/su' are Possessive Determiners; missing demonstratives added ('esa', 'aquel'..)
- **[fix]** - lexicon build is first-wins - corpus-learned lists no longer clobber function words ('aquí', 'más', 'una')
- **[fix]** - suffix false-positives - 'librería' is not a Conditional, 'fotos' not an Adjective, 'examen' not a Verb
- **[fix]** - common-gender adjectives ('grande', 'feliz') no longer default to MaleAdjective
- **[fix]** - singular -s words ('país', 'inglés', 'crisis') no longer tagged Plural
- **[fix]** - haber conjugations are the Auxiliary list; tener is no longer a Modal
- **[fix]** - imperative verb-model column misalignment + data cleanup ('vomit', 'mudar(se)', secarse row)
- **[new]** - mood-in-context rules - subjunctive after 'que/ojalá' ('espero que tengas'), negative commands ('no hables tan alto'), exclamation commands ('¡corre más rápido!')
- **[fix]** - nouns().toPlural() was a no-op; toPlural/toSingular now also flip articles and possessives ('el gato' → 'los gatos', 'nuestros amigos' → 'nuestro amigo')
- **[fix]** - noun-gender guessing - exception words ('el día', 'la mano', 'la foto'), single-letter suffix rules now consulted ('el libro'), gender re-guessed after verb→noun homograph rules
- **[fix]** - plural determiner + verb-form is a Plural noun ('las casas' is not the verb casar)
- **[fix]** - corrupt learned pair pluralized 'gato' to 'gatitos'
- **[change]** - Infinitive and Gerund no longer imply PresentTense; Negative is a feature-tag, not a Verb
- **[change]** - homograph rules - 'él vino' is a verb, 'el vino' a noun; copulas root to ser/estar
- **[change]** - 45 previously-commented tests re-enabled (1141 → 1185 passing)
- **[change]** - new test coverage for number methods, conjugation tables, contractions, tokenization and moods (1185 → 1334 passing)

### 0.2.11 [Jan 2024]

- **[fix]** - tagging+conjugation fixes

### 0.2.10 [Aug 2023]

- **[fix]** - conjugation fixes

### 0.2.9 [Feb 2023]

- **[fix]** - numbers().toText()
- **[fix]** - tagger improvements
- **[new]** - contractions

### 0.2.7 [Dec 2022]

- **[fix]** - check root text for root-matches
- **[new]** - Subjunctive and Imperative verb forms
- **[change]** - tagger improvements

### 0.1.3 [Oct 2022]

- **[fix]** - fixes for inflections in toRoot
- **[new]** - verbs() nouns() and adjectives() methods

### 0.1.2 [August 2022]

- **[fix]** - fixes for inflections in toRoot

### 0.1.1 [July 2022]

- **[change]** - add 'browser' field in package.json

### 0.1.0 [June 2022]

- **[new]** - `.compute('root')`
- **[new]** - number-parsing

### 0.0.2 [June 2022]

- **[new]** - support root matches
- **[new]** - `.compute('root')`
- **[new]** - FirstPerson, SecondPerson tags etc.
