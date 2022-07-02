<div align="center">
  <img height="15px" src="https://user-images.githubusercontent.com/399657/68221862-17ceb980-ffb8-11e9-87d4-7b30b6488f16.png"/>
  <div><b>es-compromise</b></div>
  <img src="https://user-images.githubusercontent.com/399657/68222691-6597f180-ffb9-11e9-8a32-a7f38aa8bded.png"/>
  <div>modesto procesamiento del lenguaje natural</div>
  <div><code>npm install es-compromise</code></div>
  <div align="center">
    <sub>
      work-in-progress! •  trabajo en progreso!
    </sub>
  </div>
  <img height="25px" src="https://user-images.githubusercontent.com/399657/68221862-17ceb980-ffb8-11e9-87d4-7b30b6488f16.png"/>
</div>

<div align="center">
  <div>
    <a href="https://npmjs.org/package/es-compromise">
    <img src="https://img.shields.io/npm/v/es-compromise.svg?style=flat-square" />
  </a>
  <!-- <a href="https://codecov.io/gh/spencermountain/es-compromise">
    <img src="https://codecov.io/gh/spencermountain/es-compromise/branch/master/graph/badge.svg" />
  </a> -->
  <a href="https://bundlephobia.com/result?p=es-compromise">
    <img src="https://badge-size.herokuapp.com/spencermountain/es-compromise/master/builds/es-compromise.min.js" />
  </a>
  </div>
  <div align="center">
    <sub>
     see: <a href="https://github.com/nlp-compromise/fr-compromise">french</a> • <a href="https://github.com/nlp-compromise/de-compromise">german</a>  • <a href="https://github.com/spencermountain/compromise">english</a>
    </sub>
  </div>
</div>

<!-- spacer -->
<img height="85px" src="https://user-images.githubusercontent.com/399657/68221862-17ceb980-ffb8-11e9-87d4-7b30b6488f16.png"/>


`es-compromise` is a port of [compromise](https://github.com/nlp-compromise/compromise) in spanish.

The goal of this project is to provide a small, basic, rule-based POS-tagger.

El objetivo de este proyecto es proporcionar un etiquetador de POS pequeño, básico y basado en reglas. 

<!-- spacer -->
<img height="15px" src="https://user-images.githubusercontent.com/399657/68221862-17ceb980-ffb8-11e9-87d4-7b30b6488f16.png"/>

```js
import pln from 'es-compromise'

let doc = nlp('Tengo que bailar contigo hoy')
doc.match('#Verb').out('array')
// [ 'Tengo', 'bailar' ]
```

<!-- spacer -->
<img height="15px" src="https://user-images.githubusercontent.com/399657/68221862-17ceb980-ffb8-11e9-87d4-7b30b6488f16.png"/>

o en el navegador:
```html
<script src="https://unpkg.com/es-compromise"></script>
<script>
  let txt = 'Oh, tú, tú eres el imán y yo soy el metal'
  let doc = esCompromise(txt) // window.esCompromise
  console.log(doc.json())
  // { text:'Oh, tú...', terms:[ ... ] }
</script>
```

### Los Números
puede analizar números escritos o numéricos
```js
let doc = nlp('tengo cuarenta dolares')
doc.numbers().minus(50)
doc.text()
// tengo moins diez dolares
```

### Lematización
puede conjugar la raíz de las palabras
```js
let doc = nlp('tiramos nuestros zapatos')
doc.compute('root')
doc.has('{tirar} nuestros {zapato}')
//true
```

see [en-compromise/api](https://github.com/spencermountain/compromise#api) for full API documentation.

únete para ayudar! - please join to help!

<!-- spacer -->
<img height="85px" src="https://user-images.githubusercontent.com/399657/68221862-17ceb980-ffb8-11e9-87d4-7b30b6488f16.png"/>

<!-- <h2 align="center">
  <a href="https://rawgit.com/nlp-compromise/es-compromise/master/demo/index.html">Demo</a>
</h2> -->


###  Contributing
```
git clone https://github.com/nlp-compromise/es-compromise.git
cd es-compromise
npm install
npm test
npm watch
```


<!-- spacer -->
<img height="15px" src="https://user-images.githubusercontent.com/399657/68221862-17ceb980-ffb8-11e9-87d4-7b30b6488f16.png"/>

<table>
  <tr align="center">
    <td>
      <a href="https://www.twitter.com/compromisejs">
        <img src="https://cloud.githubusercontent.com/assets/399657/21956672/a30cf206-da53-11e6-8c6c-0995cf2aef62.jpg"/>
        <div>&nbsp; &nbsp; &nbsp; Twitter &nbsp; &nbsp; &nbsp; </div>
      </a>
    </td>
    <td>
      <a href="https://github.com/nlp-compromise/compromise/wiki/Contributing">
        <img src="https://cloud.githubusercontent.com/assets/399657/21956742/5985a89c-da55-11e6-87bc-4f0f1549d202.jpg"/>
        <div>&nbsp; &nbsp; &nbsp; Pull-requests &nbsp; &nbsp; &nbsp; </div>
      </a>
    </td>
  </tr>
</table>

MIT
