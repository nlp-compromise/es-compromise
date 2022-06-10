(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.esCompromise = factory());
})(this, (function () { 'use strict';

  let methods$o = {
    one: {},
    two: {},
    three: {},
    four: {},
  };

  let model$6 = {
    one: {},
    two: {},
    three: {},
  };
  let compute$9 = {};
  let hooks = [];

  var tmpWrld = { methods: methods$o, model: model$6, compute: compute$9, hooks };

  const isArray$a = input => Object.prototype.toString.call(input) === '[object Array]';

  const fns$4 = {
    /** add metadata to term objects */
    compute: function (input) {
      const { world } = this;
      const compute = world.compute;
      // do one method
      if (typeof input === 'string' && compute.hasOwnProperty(input)) {
        compute[input](this);
      }
      // allow a list of methods
      else if (isArray$a(input)) {
        input.forEach(name => {
          if (world.compute.hasOwnProperty(name)) {
            compute[name](this);
          } else {
            console.warn('no compute:', input); // eslint-disable-line
          }
        });
      }
      // allow a custom compute function
      else if (typeof input === 'function') {
        input(this);
      } else {
        console.warn('no compute:', input); // eslint-disable-line
      }
      return this
    },
  };
  var compute$8 = fns$4;

  const forEach = function (cb) {
    let ptrs = this.fullPointer;
    ptrs.forEach((ptr, i) => {
      let view = this.update([ptr]);
      cb(view, i);
    });
    return this
  };

  const map = function (cb, empty) {
    let ptrs = this.fullPointer;
    // let cache = this._cache || []
    let res = ptrs.map((ptr, i) => {
      let view = this.update([ptr]);
      // view._cache = cache[i]
      return cb(view, i)
    });
    if (res.length === 0) {
      return empty || this.update([])
    }
    // return an array of values, or View objects?
    // user can return either from their callback
    if (res[0] !== undefined) {
      // array of strings
      if (typeof res[0] === 'string') {
        return res
      }
      // array of objects
      if (typeof res[0] === 'object' && (res[0] === null || !res[0].isView)) {
        return res
      }
    }
    // return a View object
    let all = [];
    res.forEach(ptr => {
      all = all.concat(ptr.fullPointer);
    });
    return this.toView(all)
  };

  const filter = function (cb) {
    let ptrs = this.fullPointer;
    // let cache = this._cache || []
    ptrs = ptrs.filter((ptr, i) => {
      let view = this.update([ptr]);
      // view._cache = cache[i]
      return cb(view, i)
    });
    let res = this.update(ptrs); //TODO: keep caches automatically
    // res._cache = ptrs.map(ptr => cache[ptr[0]])
    return res
  };

  const find$1 = function (cb) {
    let ptrs = this.fullPointer;
    // let cache = this._cache || []
    let found = ptrs.find((ptr, i) => {
      let view = this.update([ptr]);
      // view._cache = cache[i]
      return cb(view, i)
    });
    return this.update([found])
  };

  const some = function (cb) {
    let ptrs = this.fullPointer;
    // let cache = this._cache || []
    return ptrs.some((ptr, i) => {
      let view = this.update([ptr]);
      // view._cache = cache[i]
      return cb(view, i)
    })
  };

  const random = function (n = 1) {
    let ptrs = this.fullPointer;
    let r = Math.floor(Math.random() * ptrs.length);
    //prevent it from going over the end
    if (r + n > this.length) {
      r = this.length - n;
      r = r < 0 ? 0 : r;
    }
    ptrs = ptrs.slice(r, r + n);
    return this.update(ptrs)
  };
  var loops = { forEach, map, filter, find: find$1, some, random };

  const utils = {
    /** */
    termList: function () {
      return this.methods.one.termList(this.docs)
    },
    /** return individual terms*/
    terms: function (n) {
      let m = this.match('.');
      // this is a bit faster than .match('.') 
      // let ptrs = []
      // this.docs.forEach((terms) => {
      //   terms.forEach((term) => {
      //     let [y, x] = term.index || []
      //     ptrs.push([y, x, x + 1])
      //   })
      // })
      // let m = this.update(ptrs)
      return typeof n === 'number' ? m.eq(n) : m
    },

    /** */
    groups: function (group) {
      if (group || group === 0) {
        return this.update(this._groups[group] || [])
      }
      // return an object of Views
      let res = {};
      Object.keys(this._groups).forEach(k => {
        res[k] = this.update(this._groups[k]);
      });
      // this._groups = null
      return res
    },
    /** */
    eq: function (n) {
      let ptr = this.pointer;
      let cache = this._cache || [];
      if (!ptr) {
        ptr = this.docs.map((_doc, i) => [i]);
      }
      if (ptr[n]) {
        let view = this.update([ptr[n]]);
        view._cache = cache[n];
        return view
      }
      return this.none()
    },
    /** */
    first: function () {
      return this.eq(0)
    },
    /** */
    last: function () {
      let n = this.fullPointer.length - 1;
      return this.eq(n)
    },

    /** grab term[0] for every match */
    firstTerms: function () {
      return this.match('^.')
    },

    /** grab the last term for every match  */
    lastTerms: function () {
      return this.match('.$')
    },

    /** */
    slice: function (min, max) {
      let pntrs = this.pointer || this.docs.map((_o, n) => [n]);
      pntrs = pntrs.slice(min, max);
      return this.update(pntrs)
    },

    /** return a view of the entire document */
    all: function () {
      return this.update().toView()
    },
    /**  */
    fullSentences: function () {
      let ptrs = this.fullPointer.map(a => [a[0]]); //lazy!
      return this.update(ptrs).toView()
    },
    /** return a view of no parts of the document */
    none: function () {
      return this.update([])
    },

    /** are these two views looking at the same words? */
    isDoc: function (b) {
      if (!b || !b.isView) {
        return false
      }
      let aPtr = this.fullPointer;
      let bPtr = b.fullPointer;
      if (!aPtr.length === bPtr.length) {
        return false
      }
      // ensure pointers are the same
      return aPtr.every((ptr, i) => {
        if (!bPtr[i]) {
          return false
        }
        // ensure [n, start, end] are all the same
        return ptr[0] === bPtr[i][0] && ptr[1] === bPtr[i][1] && ptr[2] === bPtr[i][2]
      })
    },

    /** how many seperate terms does the document have? */
    wordCount: function () {
      return this.docs.reduce((count, terms) => {
        count += terms.filter(t => t.text !== '').length;
        return count
      }, 0)
    },

  };
  utils.group = utils.groups;
  utils.fullSentence = utils.fullSentences;
  utils.sentence = utils.fullSentences;
  utils.lastTerm = utils.lastTerms;
  utils.firstTerm = utils.firstTerms;
  var util = utils;

  const methods$n = Object.assign({}, util, compute$8, loops);

  // aliases
  methods$n.get = methods$n.eq;
  var api$d = methods$n;

  class View {
    constructor(document, pointer, groups = {}) {
      // invisible props
      [
        ['document', document],
        ['world', tmpWrld],
        ['_groups', groups],
        ['_cache', null],
        ['viewType', 'View']
      ].forEach(a => {
        Object.defineProperty(this, a[0], {
          value: a[1],
          writable: true,
        });
      });
      this.ptrs = pointer;
    }
    /* getters:  */
    get docs() {
      let docs = this.document;
      if (this.ptrs) {
        docs = tmpWrld.methods.one.getDoc(this.ptrs, this.document);
      }
      return docs
    }
    get pointer() {
      return this.ptrs
    }
    get methods() {
      return this.world.methods
    }
    get model() {
      return this.world.model
    }
    get hooks() {
      return this.world.hooks
    }
    get isView() {
      return true //this comes in handy sometimes
    }
    // is the view not-empty?
    get found() {
      return this.docs.length > 0
    }
    // how many matches we have
    get length() {
      return this.docs.length
    }
    // return a more-hackable pointer
    get fullPointer() {
      let { docs, ptrs, document } = this;
      // compute a proper pointer, from docs
      let pointers = ptrs || docs.map((_d, n) => [n]);
      // do we need to repair it, first?
      return pointers.map(a => {
        let [n, start, end, id, endId] = a;
        start = start || 0;
        end = end || (document[n] || []).length;
        //add frozen id, for good-measure
        if (document[n] && document[n][start]) {
          id = id || document[n][start].id;
          if (document[n][end - 1]) {
            endId = endId || document[n][end - 1].id;
          }
        }
        return [n, start, end, id, endId]
      })
    }
    // create a new View, from this one
    update(pointer) {
      let m = new View(this.document, pointer);
      // send the cache down, too?
      if (m._cache && pointer && pointer.length > 1) {
        // only if it's full
        let cache = [];
        pointer.forEach(ptr => {
          if (ptr.length === 1) {
            cache.push(m._cache[ptr[0]]);
          }
          // let [n, start, end] = ptr
          // if (start === 0 && this.document[n][end - 1] && !this.document[n][end]) {
          //   console.log('=-=-=-= here -=-=-=-')
          // }
        });
        m._cache = cache;
      }
      m.world = this.world;
      return m
    }
    // create a new View, from this one
    toView(pointer) {
      if (pointer === undefined) {
        pointer = this.pointer;
      }
      let m = new View(this.document, pointer);
      // m._cache = this._cache // share this full thing
      return m
    }
    fromText(input) {
      const { methods } = this;
      //assume ./01-tokenize is installed
      let document = methods.one.tokenize.fromString(input, this.world);
      let doc = new View(document);
      doc.world = this.world;
      doc.compute(['normal', 'lexicon']);
      if (this.world.compute.preTagger) {
        doc.compute('preTagger');
      }
      return doc
    }
    clone() {
      // clone the whole document
      let document = this.document.slice(0);
      document = document.map(terms => {
        return terms.map(term => {
          term = Object.assign({}, term);
          term.tags = new Set(term.tags);
          return term
        })
      });
      // clone only sub-document ?
      let m = this.update(this.pointer);
      m.document = document;
      m._cache = this._cache; //clone this too?
      return m
    }
  }
  Object.assign(View.prototype, api$d);
  var View$1 = View;

  var version = '14.3.0';

  const isObject$6 = function (item) {
    return item && typeof item === 'object' && !Array.isArray(item)
  };

  // recursive merge of objects
  function mergeDeep(model, plugin) {
    if (isObject$6(plugin)) {
      for (const key in plugin) {
        if (isObject$6(plugin[key])) {
          if (!model[key]) Object.assign(model, { [key]: {} });
          mergeDeep(model[key], plugin[key]); //recursion
          // } else if (isArray(plugin[key])) {
          // console.log(key)
          // console.log(model)
        } else {
          Object.assign(model, { [key]: plugin[key] });
        }
      }
    }
    return model
  }
  // const merged = mergeDeep({ a: 1 }, { b: { c: { d: { e: 12345 } } } })
  // console.dir(merged, { depth: 5 })

  // vroom
  function mergeQuick(model, plugin) {
    for (const key in plugin) {
      model[key] = model[key] || {};
      Object.assign(model[key], plugin[key]);
    }
    return model
  }

  const extend = function (plugin, world, View, nlp) {
    const { methods, model, compute, hooks } = world;
    if (plugin.methods) {
      mergeQuick(methods, plugin.methods);
    }
    if (plugin.model) {
      mergeDeep(model, plugin.model);
    }
    // shallow-merge compute
    if (plugin.compute) {
      Object.assign(compute, plugin.compute);
    }
    // append new hooks
    if (hooks) {
      world.hooks = hooks.concat(plugin.hooks || []);
    }
    // assign new class methods
    if (plugin.api) {
      plugin.api(View);
    }
    if (plugin.lib) {
      Object.keys(plugin.lib).forEach(k => nlp[k] = plugin.lib[k]);
    }
    if (plugin.tags) {
      nlp.addTags(plugin.tags);
    }
    if (plugin.words) {
      nlp.addWords(plugin.words);
    }
    if (plugin.mutate) {
      plugin.mutate(world);
    }
  };
  var extend$1 = extend;

  /** log the decision-making to console */
  const verbose = function (set) {
    const env = typeof process === 'undefined' || !process.env ? self.env || {} : process.env; //use window, in browser
    env.DEBUG_TAGS = set === 'tagger' || set === true ? true : '';
    env.DEBUG_MATCH = set === 'match' || set === true ? true : '';
    env.DEBUG_CHUNKS = set === 'chunker' || set === true ? true : '';
    return this
  };

  const isObject$5 = val => {
    return Object.prototype.toString.call(val) === '[object Object]'
  };

  const isArray$9 = function (arr) {
    return Object.prototype.toString.call(arr) === '[object Array]'
  };

  // internal Term objects are slightly different
  const fromJson = function (json) {
    return json.map(o => {
      return o.terms.map(term => {
        if (isArray$9(term.tags)) {
          term.tags = new Set(term.tags);
        }
        return term
      })
    })
  };

  // interpret an array-of-arrays
  const preTokenized = function (arr) {
    return arr.map((a) => {
      return a.map(str => {
        return {
          text: str,
          normal: str,//cleanup
          pre: '',
          post: ' ',
          tags: new Set()
        }
      })
    })
  };

  const inputs = function (input, View, world) {
    const { methods } = world;
    let doc = new View([]);
    doc.world = world;
    // support a number
    if (typeof input === 'number') {
      input = String(input);
    }
    // return empty doc
    if (!input) {
      return doc
    }
    // parse a string
    if (typeof input === 'string') {
      let document = methods.one.tokenize.fromString(input, world);
      return new View(document)
    }
    // handle compromise View
    if (isObject$5(input) && input.isView) {
      return new View(input.document, input.ptrs)
    }
    // handle json input
    if (isArray$9(input)) {
      // pre-tokenized array-of-arrays 
      if (isArray$9(input[0])) {
        let document = preTokenized(input);
        return new View(document)
      }
      // handle json output
      let document = fromJson(input);
      return new View(document)
    }
    return doc
  };
  var handleInputs = inputs;

  let world = Object.assign({}, tmpWrld);

  const nlp = function (input, lex) {
    if (lex) {
      nlp.addWords(lex);
    }
    let doc = handleInputs(input, View$1, world);
    if (input) {
      doc.compute(world.hooks);
    }
    return doc
  };
  Object.defineProperty(nlp, '_world', {
    value: world,
    writable: true,
  });

  /** don't run the POS-tagger */
  nlp.tokenize = function (input, lex) {
    const { compute } = this._world;
    // add user-given words to lexicon
    if (lex) {
      nlp.addWords(lex);
    }
    // run the tokenizer
    let doc = handleInputs(input, View$1, world);
    // give contractions a shot, at least
    if (compute.contractions) {
      doc.compute(['alias', 'normal', 'machine', 'contractions']); //run it if we've got it
    }
    return doc
  };


  /** extend compromise functionality */
  nlp.plugin = function (plugin) {
    extend$1(plugin, this._world, View$1, this);
    return this
  };
  nlp.extend = nlp.plugin;


  /** reach-into compromise internals */
  nlp.world = function () {
    return this._world
  };
  nlp.model = function () {
    return this._world.model
  };
  nlp.methods = function () {
    return this._world.methods
  };
  nlp.hooks = function () {
    return this._world.hooks
  };

  /** log the decision-making to console */
  nlp.verbose = verbose;
  /** current library release version */
  nlp.version = version;

  var nlp$1 = nlp;

  const createCache = function (document) {
    let cache = document.map(terms => {
      let stuff = new Set();
      terms.forEach(term => {
        // add words
        if (term.normal !== '') {
          stuff.add(term.normal);
        }
        // cache switch-status - '%Noun|Verb%'
        if (term.switch) {
          stuff.add(`%${term.switch}%`);
        }
        // cache implicit words, too
        if (term.implicit) {
          stuff.add(term.implicit);
        }
        if (term.machine) {
          stuff.add(term.machine);
        }
        // cache slashes words, etc
        if (term.alias) {
          term.alias.forEach(str => stuff.add(str));
        }
        let tags = Array.from(term.tags);
        for (let t = 0; t < tags.length; t += 1) {
          stuff.add('#' + tags[t]);
        }
      });
      return stuff
    });
    return cache
  };
  var cacheDoc = createCache;

  var methods$m = {
    one: {
      cacheDoc,
    },
  };

  const methods$l = {
    /** */
    cache: function () {
      this._cache = this.methods.one.cacheDoc(this.document);
      return this
    },
    /** */
    uncache: function () {
      this._cache = null;
      return this
    },
  };
  const addAPI$3 = function (View) {
    Object.assign(View.prototype, methods$l);
  };
  var api$c = addAPI$3;

  var compute$7 = {
    cache: function (view) {
      view._cache = view.methods.one.cacheDoc(view.document);
    }
  };

  var cache$3 = {
    api: api$c,
    compute: compute$7,
    methods: methods$m,
  };

  var caseFns = {
    /** */
    toLowerCase: function () {
      this.termList().forEach(t => {
        t.text = t.text.toLowerCase();
      });
      return this
    },
    /** */
    toUpperCase: function () {
      this.termList().forEach(t => {
        t.text = t.text.toUpperCase();
      });
      return this
    },
    /** */
    toTitleCase: function () {
      this.termList().forEach(t => {
        t.text = t.text.replace(/^ *[a-z\u00C0-\u00FF]/, x => x.toUpperCase()); //support unicode?
      });
      return this
    },
    /** */
    toCamelCase: function () {
      this.docs.forEach(terms => {
        terms.forEach((t, i) => {
          if (i !== 0) {
            t.text = t.text.replace(/^ *[a-z\u00C0-\u00FF]/, x => x.toUpperCase()); //support unicode?
          }
          if (i !== terms.length - 1) {
            t.post = '';
          }
        });
      });
      return this
    },
  };

  // case logic
  const isTitleCase$1 = (str) => /^\p{Lu}[\p{Ll}'’]/u.test(str) || /^\p{Lu}$/u.test(str);
  const toTitleCase = (str) => str.replace(/^\p{Ll}/u, x => x.toUpperCase());
  const toLowerCase = (str) => str.replace(/^\p{Lu}/u, x => x.toLowerCase());

  // splice an array into an array
  const spliceArr = (parent, index, child) => {
    // tag them as dirty
    child.forEach(term => term.dirty = true);
    if (parent) {
      let args = [index, 0].concat(child);
      Array.prototype.splice.apply(parent, args);
    }
    return parent
  };

  // add a space at end, if required
  const endSpace = function (terms) {
    const hasSpace = / $/;
    const hasDash = /[-–—]/;
    let lastTerm = terms[terms.length - 1];
    if (lastTerm && !hasSpace.test(lastTerm.post) && !hasDash.test(lastTerm.post)) {
      lastTerm.post += ' ';
    }
  };

  // sentence-ending punctuation should move in append
  const movePunct = (source, end, needle) => {
    const juicy = /[-.?!,;:)–—'"]/g;
    let wasLast = source[end - 1];
    if (!wasLast) {
      return
    }
    let post = wasLast.post;
    if (juicy.test(post)) {
      let punct = post.match(juicy).join(''); //not perfect
      let last = needle[needle.length - 1];
      last.post = punct + last.post;
      // remove it, from source
      wasLast.post = wasLast.post.replace(juicy, '');
    }
  };


  const moveTitleCase = function (home, start, needle) {
    let from = home[start];
    // should we bother?
    if (start !== 0 || !isTitleCase$1(from.text)) {
      return
    }
    // titlecase new first term
    needle[0].text = toTitleCase(needle[0].text);
    // should we un-titlecase the old word?
    let old = home[start];
    if (old.tags.has('ProperNoun') || old.tags.has('Acronym')) {
      return
    }
    if (isTitleCase$1(old.text) && old.text.length > 1) {
      old.text = toLowerCase(old.text);
    }
  };

  // put these words before the others
  const cleanPrepend = function (home, ptr, needle, document) {
    let [n, start, end] = ptr;
    // introduce spaces appropriately
    if (start === 0) {
      // at start - need space in insert
      endSpace(needle);
    } else if (end === document[n].length) {
      // at end - need space in home
      endSpace(needle);
    } else {
      // in middle - need space in home and insert
      endSpace(needle);
      endSpace([home[ptr[1]]]);
    }
    moveTitleCase(home, start, needle);
    // movePunct(home, end, needle)
    spliceArr(home, start, needle);
  };

  const cleanAppend = function (home, ptr, needle, document) {
    let [n, , end] = ptr;
    let total = (document[n] || []).length;
    if (end < total) {
      // are we in the middle?
      // add trailing space on self
      movePunct(home, end, needle);
      endSpace(needle);
    } else if (total === end) {
      // are we at the end?
      // add a space to predecessor
      endSpace(home);
      // very end, move period
      movePunct(home, end, needle);
      // is there another sentence after?
      if (document[n + 1]) {
        needle[needle.length - 1].post += ' ';
      }
    }
    spliceArr(home, ptr[2], needle);
    // set new endId
    ptr[4] = needle[needle.length - 1].id;
  };

  /*
  unique & ordered term ids, based on time & term index

  Base 36 (numbers+ascii)
    3 digit 4,600
    2 digit 1,200
    1 digit 36

    TTT|NNN|II|R

  TTT -> 46 terms since load
  NNN -> 46 thousand sentences (>1 inf-jest)
  II  -> 1,200 words in a sentence (nuts)
  R   -> 1-36 random number 

  novels: 
    avg 80,000 words
      15 words per sentence
    5,000 sentences

  Infinite Jest:
    36,247 sentences
    https://en.wikipedia.org/wiki/List_of_longest_novels

  collisions are more-likely after
      46 seconds have passed,
    and 
      after 46-thousand sentences

  */
  let start$1 = 0;

  const pad3 = (str) => {
    str = str.length < 3 ? '0' + str : str;
    return str.length < 3 ? '0' + str : str
  };

  const toId = function (term) {
    let [n, i] = term.index || [0, 0];
    start$1 += 1;
    var now = start$1;
    now = parseInt(now, 10);

    //don't overflow time
    now = now > 46655 ? 46655 : now;
    //don't overflow sentences
    n = n > 46655 ? 46655 : n;
    // //don't overflow terms
    i = i > 1294 ? 1294 : i;

    // 3 digits for time
    let id = pad3(now.toString(36));
    // 3 digit  for sentence index (46k)
    id += pad3(n.toString(36));

    // 1 digit for term index (36)
    let tx = i.toString(36);
    tx = tx.length < 2 ? '0' + tx : tx; //pad2
    id += tx;

    // 1 digit random number
    let r = parseInt(Math.random() * 36, 10);
    id += (r).toString(36);

    return term.normal + '|' + id.toUpperCase()
  };

  var uuid = toId;

  // setInterval(() => console.log(toId(4, 12)), 100)

  // are we inserting inside a contraction?
  // expand it first
  const expand$2 = function (m) {
    if (m.has('@hasContraction')) {//&& m.after('^.').has('@hasContraction')
      let more = m.grow('@hasContraction');
      more.contractions().expand();
    }
  };

  const isArray$8 = (arr) => Object.prototype.toString.call(arr) === '[object Array]';

  // set new ids for each terms
  const addIds$2 = function (terms) {
    terms = terms.map((term) => {
      term.id = uuid(term);
      return term
    });
    return terms
  };

  const getTerms = function (input, world) {
    const { methods } = world;
    // create our terms from a string
    if (typeof input === 'string') {
      return methods.one.tokenize.fromString(input, world)[0] //assume one sentence
    }
    //allow a view object
    if (typeof input === 'object' && input.isView) {
      return input.clone().docs[0] //assume one sentence
    }
    //allow an array of terms, too
    if (isArray$8(input)) {
      return isArray$8(input[0]) ? input[0] : input
    }
    return []
  };

  const insert = function (input, view, prepend) {
    const { document, world } = view;
    // insert words at end of each doc
    let ptrs = view.fullPointer;
    let selfPtrs = view.fullPointer;
    view.forEach((m, i) => {
      let ptr = m.fullPointer[0];
      let [n] = ptr;
      // add-in the words
      let home = document[n];
      let terms = getTerms(input, world);
      terms = addIds$2(terms);
      if (prepend) {
        expand$2(view.update([ptr]).firstTerm());
        cleanPrepend(home, ptr, terms, document);
      } else {
        expand$2(view.update([ptr]).lastTerm());
        cleanAppend(home, ptr, terms, document);
      }
      // harden the pointer
      if (document[n] && document[n][ptr[1]]) {
        ptr[3] = document[n][ptr[1]].id;
      }
      // change self backwards by len
      selfPtrs[i] = ptr;
      // extend the pointer
      ptr[2] += terms.length;
      ptrs[i] = ptr;
    });
    let doc = view.toView(ptrs);
    // shift our self pointer, if necessary
    view.ptrs = selfPtrs;
    // try to tag them, too
    doc.compute(['id', 'index', 'lexicon']);
    if (doc.world.compute.preTagger) {
      doc.compute('preTagger');
    }
    return doc
  };

  const fns$3 = {
    insertAfter: function (input) {
      return insert(input, this, false)
    },
    insertBefore: function (input) {
      return insert(input, this, true)
    },

  };
  fns$3.append = fns$3.insertAfter;
  fns$3.prepend = fns$3.insertBefore;
  fns$3.insert = fns$3.insertAfter;

  var insert$1 = fns$3;

  const dollarStub = /\$[0-9a-z]+/g;
  const fns$2 = {};

  const titleCase$2 = function (str) {
    return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase())
  };

  // doc.replace('foo', (m)=>{})
  const replaceByFn = function (main, fn) {
    main.forEach(m => {
      let out = fn(m);
      m.replaceWith(out);
    });
    return main
  };

  // support 'foo $0' replacements
  const subDollarSign = function (input, main) {
    if (typeof input !== 'string') {
      return input
    }
    let groups = main.groups();
    input = input.replace(dollarStub, (a) => {
      let num = a.replace(/\$/, '');
      if (groups.hasOwnProperty(num)) {
        return groups[num].text()
      }
      return a
    });
    return input
  };

  fns$2.replaceWith = function (input, keep = {}) {
    let ptrs = this.fullPointer;
    let main = this;
    if (typeof input === 'function') {
      return replaceByFn(main, input)
    }
    // support 'foo $0' replacements
    input = subDollarSign(input, main);

    let original = this.update(ptrs);
    // soften-up pointer
    ptrs = ptrs.map(ptr => ptr.slice(0, 3));
    // original.freeze()
    let oldTags = (original.docs[0] || []).map(term => Array.from(term.tags));
    // slide this in
    main.insertAfter(input);
    // are we replacing part of a contraction?
    if (original.has('@hasContraction') && main.contractions) {
      let more = main.grow('@hasContraction+');
      more.contractions().expand();
    }
    // delete the original terms
    main.delete(original); //science.
    // what should we return?
    let m = main.toView(ptrs).compute(['index', 'lexicon']);
    if (m.world.compute.preTagger) {
      m.compute('preTagger');
    }
    // replace any old tags
    if (keep.tags) {
      m.terms().forEach((term, i) => {
        term.tagSafe(oldTags[i]);
      });
    }
    // try to co-erce case, too
    if (keep.case && m.docs[0] && m.docs[0][0] && m.docs[0][0].index[1] === 0) {
      m.docs[0][0].text = titleCase$2(m.docs[0][0].text);
    }
    return m
  };

  fns$2.replace = function (match, input, keep) {
    if (match && !input) {
      return this.replaceWith(match, keep)
    }
    let m = this.match(match);
    if (!m.found) {
      return this
    }
    return m.replaceWith(input, keep)
  };
  var replace = fns$2;

  // transfer sentence-ending punctuation
  const repairPunct = function (terms, len) {
    let last = terms.length - 1;
    let from = terms[last];
    let to = terms[last - len];
    if (to && from) {
      to.post += from.post; //this isn't perfect.
      to.post = to.post.replace(/ +([.?!,;:])/, '$1');
      // don't allow any silly punctuation outcomes like ',!'
      to.post = to.post.replace(/[,;:]+([.?!])/, '$1');
    }
  };

  // remove terms from document json
  const pluckOut = function (document, nots) {
    nots.forEach(ptr => {
      let [n, start, end] = ptr;
      let len = end - start;
      if (!document[n]) {
        return // weird!
      }
      if (end === document[n].length && end > 1) {
        repairPunct(document[n], len);
      }
      document[n].splice(start, len); // replaces len terms at index start
    });
    // remove any now-empty sentences
    // (foreach + splice = 'mutable filter')
    for (let i = document.length - 1; i >= 0; i -= 1) {
      if (document[i].length === 0) {
        document.splice(i, 1);
        // remove any trailing whitespace before our removed sentence
        if (i === document.length && document[i - 1]) {
          let terms = document[i - 1];
          let lastTerm = terms[terms.length - 1];
          if (lastTerm) {
            lastTerm.post = lastTerm.post.trimEnd();
          }
        }
        // repair any downstream indexes
        // for (let k = i; k < document.length; k += 1) {
        //   document[k].forEach(term => term.index[0] -= 1)
        // }
      }
    }
    return document
  };

  var pluckOutTerm = pluckOut;

  const fixPointers$1 = function (ptrs, gonePtrs) {
    ptrs = ptrs.map(ptr => {
      let [n] = ptr;
      if (!gonePtrs[n]) {
        return ptr
      }
      gonePtrs[n].forEach(no => {
        let len = no[2] - no[1];
        // does it effect our pointer?
        if (ptr[1] <= no[1] && ptr[2] >= no[2]) {
          ptr[2] -= len;
        }
      });
      return ptr
    });

    // decrement any pointers after a now-empty pointer
    ptrs.forEach((ptr, i) => {
      // is the pointer now empty?
      if (ptr[1] === 0 && ptr[2] == 0) {
        // go down subsequent pointers
        for (let n = i + 1; n < ptrs.length; n += 1) {
          ptrs[n][0] -= 1;
          if (ptrs[n][0] < 0) {
            ptrs[n][0] = 0;
          }
        }
      }
    });
    // remove any now-empty pointers
    ptrs = ptrs.filter(ptr => ptr[2] - ptr[1] > 0);

    // remove old hard-pointers
    ptrs = ptrs.map((ptr) => {
      ptr[3] = null;
      ptr[4] = null;
      return ptr
    });
    return ptrs
  };

  const methods$k = {
    /** */
    remove: function (reg) {
      const { indexN } = this.methods.one.pointer;
      // two modes:
      //  - a. remove self, from full parent
      let self = this.all();
      let not = this;
      //  - b. remove a match, from self
      if (reg) {
        self = this;
        not = this.match(reg);
      }
      // is it part of a contraction?
      if (self.has('@hasContraction') && self.contractions) {
        let more = self.grow('@hasContraction');
        more.contractions().expand();
      }

      let ptrs = self.fullPointer;
      let nots = not.fullPointer.reverse();
      // remove them from the actual document)
      let document = pluckOutTerm(this.document, nots);
      // repair our pointers
      let gonePtrs = indexN(nots);
      ptrs = fixPointers$1(ptrs, gonePtrs);

      // clean up our original inputs
      self.ptrs = ptrs;
      self.document = document;
      self.compute('index');
      if (!reg) {
        this.ptrs = [];
        return self.none()
      }
      // self._cache = null
      let res = self.toView(ptrs); //return new document
      return res
    },
  };

  // aliases
  methods$k.delete = methods$k.remove;
  var remove = methods$k;

  const methods$j = {
    /** add this punctuation or whitespace before each match: */
    pre: function (str, concat) {
      if (str === undefined && this.found) {
        return this.docs[0][0].pre
      }
      this.docs.forEach(terms => {
        let term = terms[0];
        if (concat === true) {
          term.pre += str;
        } else {
          term.pre = str;
        }
      });
      return this
    },

    /** add this punctuation or whitespace after each match: */
    post: function (str, concat) {
      if (str === undefined) {
        let last = this.docs[this.docs.length - 1];
        return last[last.length - 1].post
      }
      this.docs.forEach(terms => {
        let term = terms[terms.length - 1];
        if (concat === true) {
          term.post += str;
        } else {
          term.post = str;
        }
      });
      return this
    },

    /** remove whitespace from start/end */
    trim: function () {
      if (!this.found) {
        return this
      }
      let docs = this.docs;
      let start = docs[0][0];
      start.pre = start.pre.trimStart();
      let last = docs[docs.length - 1];
      let end = last[last.length - 1];
      end.post = end.post.trimEnd();
      return this
    },

    /** connect words with hyphen, and remove whitespace */
    hyphenate: function () {
      this.docs.forEach(terms => {
        //remove whitespace
        terms.forEach((t, i) => {
          if (i !== 0) {
            t.pre = '';
          }
          if (terms[i + 1]) {
            t.post = '-';
          }
        });
      });
      return this
    },

    /** remove hyphens between words, and set whitespace */
    dehyphenate: function () {
      const hasHyphen = /[-–—]/;
      this.docs.forEach(terms => {
        //remove whitespace
        terms.forEach(t => {
          if (hasHyphen.test(t.post)) {
            t.post = ' ';
          }
        });
      });
      return this
    },

    /** add quotations around these matches */
    toQuotations: function (start, end) {
      start = start || `"`;
      end = end || `"`;
      this.docs.forEach(terms => {
        terms[0].pre = start + terms[0].pre;
        let last = terms[terms.length - 1];
        last.post = end + last.post;
      });
      return this
    },

    /** add brackets around these matches */
    toParentheses: function (start, end) {
      start = start || `(`;
      end = end || `)`;
      this.docs.forEach(terms => {
        terms[0].pre = start + terms[0].pre;
        let last = terms[terms.length - 1];
        last.post = end + last.post;
      });
      return this
    },
  };
  methods$j.deHyphenate = methods$j.dehyphenate;
  methods$j.toQuotation = methods$j.toQuotations;

  var whitespace$1 = methods$j;

  /** alphabetical order */
  const alpha = (a, b) => {
    if (a.normal < b.normal) {
      return -1
    }
    if (a.normal > b.normal) {
      return 1
    }
    return 0
  };

  /** count the # of characters of each match */
  const length = (a, b) => {
    let left = a.normal.trim().length;
    let right = b.normal.trim().length;
    if (left < right) {
      return 1
    }
    if (left > right) {
      return -1
    }
    return 0
  };

  /** count the # of terms in each match */
  const wordCount$2 = (a, b) => {
    if (a.words < b.words) {
      return 1
    }
    if (a.words > b.words) {
      return -1
    }
    return 0
  };

  /** count the # of terms in each match */
  const sequential = (a, b) => {
    if (a[0] < b[0]) {
      return 1
    }
    if (a[0] > b[0]) {
      return -1
    }
    return a[1] > b[1] ? 1 : -1
  };

  /** sort by # of duplicates in the document*/
  const byFreq = function (arr) {
    let counts = {};
    arr.forEach(o => {
      counts[o.normal] = counts[o.normal] || 0;
      counts[o.normal] += 1;
    });
    // sort by freq
    arr.sort((a, b) => {
      let left = counts[a.normal];
      let right = counts[b.normal];
      if (left < right) {
        return 1
      }
      if (left > right) {
        return -1
      }
      return 0
    });
    return arr
  };

  var methods$i = { alpha, length, wordCount: wordCount$2, sequential, byFreq };

  // aliases
  const seqNames = new Set(['index', 'sequence', 'seq', 'sequential', 'chron', 'chronological']);
  const freqNames = new Set(['freq', 'frequency', 'topk', 'repeats']);
  const alphaNames = new Set(['alpha', 'alphabetical']);

  // support function as parameter
  const customSort = function (view, fn) {
    let ptrs = view.fullPointer;
    ptrs = ptrs.sort((a, b) => {
      a = view.update([a]);
      b = view.update([b]);
      return fn(a, b)
    });
    view.ptrs = ptrs; //mutate original
    return view
  };

  /** re-arrange the order of the matches (in place) */
  const sort = function (input) {
    let { docs, pointer } = this;
    if (typeof input === 'function') {
      return customSort(this, input)
    }
    input = input || 'alpha';
    let ptrs = pointer || docs.map((_d, n) => [n]);
    let arr = docs.map((terms, n) => {
      return {
        index: n,
        words: terms.length,
        normal: terms.map(t => t.machine || t.normal || '').join(' '),
        pointer: ptrs[n],
      }
    });
    // 'chronological' sorting
    if (seqNames.has(input)) {
      input = 'sequential';
    }
    // alphabetical sorting
    if (alphaNames.has(input)) {
      input = 'alpha';
    }
    // sort by frequency
    if (freqNames.has(input)) {
      arr = methods$i.byFreq(arr);
      return this.update(arr.map(o => o.pointer))
    }
    // apply sort method on each phrase
    if (typeof methods$i[input] === 'function') {
      arr = arr.sort(methods$i[input]);
      return this.update(arr.map(o => o.pointer))
    }
    return this
  };

  /** reverse the order of the matches, but not the words or index */
  const reverse$2 = function () {
    let ptrs = this.pointer || this.docs.map((_d, n) => [n]);
    ptrs = [].concat(ptrs);
    ptrs = ptrs.reverse();
    return this.update(ptrs)
  };

  /** remove any duplicate matches */
  const unique = function () {
    let already = new Set();
    let res = this.filter(m => {
      let txt = m.text('machine');
      if (already.has(txt)) {
        return false
      }
      already.add(txt);
      return true
    });
    // this.ptrs = res.ptrs //mutate original?
    return res//.compute('index')
  };

  var sort$1 = { unique, reverse: reverse$2, sort };

  const isArray$7 = (arr) => Object.prototype.toString.call(arr) === '[object Array]';

  // append a new document, somehow
  const combineDocs = function (homeDocs, inputDocs) {
    // add a space
    let end = homeDocs[homeDocs.length - 1];
    let last = end[end.length - 1];
    if (/ /.test(last.post) === false) {
      last.post += ' ';
    }
    homeDocs = homeDocs.concat(inputDocs);
    return homeDocs
  };

  const combineViews = function (home, input) {
    // is it a view from the same document?
    if (home.document === input.document) {
      let ptrs = home.fullPointer.concat(input.fullPointer);
      return home.toView(ptrs).compute('index')
    }
    // update n of new pointer, to end of our pointer
    let ptrs = input.fullPointer;
    ptrs.forEach(a => {
      a[0] += home.document.length;
    });
    home.document = combineDocs(home.document, input.document);
    return home.all()
  };

  var concat = {
    // add string as new match/sentence
    concat: function (input) {
      const { methods, document, world } = this;
      // parse and splice-in new terms
      if (typeof input === 'string') {
        let json = methods.one.tokenize.fromString(input, world);
        let ptrs = this.fullPointer;
        let lastN = ptrs[ptrs.length - 1][0];
        spliceArr(document, lastN + 1, json);
        return this.compute('index')
      }
      // plop some view objects together
      if (typeof input === 'object' && input.isView) {
        return combineViews(this, input)
      }
      // assume it's an array of terms
      if (isArray$7(input)) {
        let docs = combineDocs(this.document, input);
        this.document = docs;
        return this.all()
      }
      return this
    },
  };

  // add indexes to pointers
  const harden = function () {
    this.ptrs = this.fullPointer;
    return this
  };
  // remove indexes from pointers
  const soften = function () {
    let ptr = this.ptrs;
    if (!ptr || ptr.length < 1) {
      return this
    }
    ptr = ptr.map(a => a.slice(0, 3));
    this.ptrs = ptr;
    return this
  };
  var harden$1 = { harden, soften };

  const methods$h = Object.assign({}, caseFns, insert$1, replace, remove, whitespace$1, sort$1, concat, harden$1);

  const addAPI$2 = function (View) {
    Object.assign(View.prototype, methods$h);
  };
  var api$b = addAPI$2;

  const compute$5 = {
    id: function (view) {
      let docs = view.docs;
      for (let n = 0; n < docs.length; n += 1) {
        for (let i = 0; i < docs[n].length; i += 1) {
          let term = docs[n][i];
          term.id = term.id || uuid(term);
        }
      }
    }
  };

  var compute$6 = compute$5;

  var change = {
    api: api$b,
    compute: compute$6,
  };

  var contractions$4 = [
    // simple mappings
    { word: '@', out: ['at'] },
    { word: 'alot', out: ['a', 'lot'] },
    { word: 'brb', out: ['be', 'right', 'back'] },
    { word: 'cannot', out: ['can', 'not'] },
    { word: 'cant', out: ['can', 'not'] },
    { word: 'dont', out: ['do', 'not'] },
    { word: 'dun', out: ['do', 'not'] },
    { word: 'wont', out: ['will', 'not'] },
    { word: "can't", out: ['can', 'not'] },
    { word: "shan't", out: ['should', 'not'] },
    { word: "won't", out: ['will', 'not'] },
    { word: "that's", out: ['that', 'is'] },
    { word: "what's", out: ['what', 'is'] },
    { word: "let's", out: ['let', 'us'] },
    { word: "there's", out: ['there', 'is'] },
    { word: 'dunno', out: ['do', 'not', 'know'] },
    { word: 'gonna', out: ['going', 'to'] },
    { word: 'gotta', out: ['have', 'got', 'to'] }, //hmm
    { word: 'gimme', out: ['give', 'me'] },
    { word: 'tryna', out: ['trying', 'to'] },
    { word: 'gtg', out: ['got', 'to', 'go'] },
    { word: 'im', out: ['i', 'am'] },
    { word: 'imma', out: ['I', 'will'] },
    { word: 'imo', out: ['in', 'my', 'opinion'] },
    { word: 'irl', out: ['in', 'real', 'life'] },
    { word: 'ive', out: ['i', 'have'] },
    { word: 'rn', out: ['right', 'now'] },
    { word: 'tbh', out: ['to', 'be', 'honest'] },
    { word: 'wanna', out: ['want', 'to'] },
    { word: `c'mere`, out: ['come', 'here'] },
    { word: `c'mon`, out: ['come', 'on'] },
    // apostrophe d
    { word: 'howd', out: ['how', 'did'] },
    { word: 'whatd', out: ['what', 'did'] },
    { word: 'whend', out: ['when', 'did'] },
    { word: 'whered', out: ['where', 'did'] },

    // { after: `cause`, out: ['because'] },
    { word: "tis", out: ['it', 'is'] },
    { word: "twas", out: ['it', 'was'] },
    { word: `y'know`, out: ['you', 'know'] },
    { word: "ne'er", out: ['never'] },
    { word: "o'er", out: ['over'] },
    // contraction-part mappings
    { after: 'll', out: ['will'] },
    { after: 've', out: ['have'] },
    { after: 're', out: ['are'] },
    { after: 'm', out: ['am'] },
    // french contractions
    { before: 'c', out: ['ce'] },
    { before: 'm', out: ['me'] },
    { before: 'n', out: ['ne'] },
    { before: 'qu', out: ['que'] },
    { before: 's', out: ['se'] },
    { before: 't', out: ['tu'] }, // t'aime
  ];

  var model$5 = { one: { contractions: contractions$4 } };

  // put n new words where 1 word was
  const insertContraction = function (document, point, words) {
    let [n, w] = point;
    if (!words || words.length === 0) {
      return
    }
    words = words.map((word, i) => {
      word.implicit = word.text;
      word.machine = word.text;
      word.pre = '';
      word.post = '';
      word.text = '';
      word.normal = '';
      word.index = [n, w + i];
      return word
    });
    if (words[0]) {
      // move whitespace over
      words[0].pre = document[n][w].pre;
      words[words.length - 1].post = document[n][w].post;
      // add the text/normal to the first term
      words[0].text = document[n][w].text;
      words[0].normal = document[n][w].normal; // move tags too?
    }
    // do the splice
    document[n].splice(w, 1, ...words);
  };
  var splice = insertContraction;

  const hasContraction$1 = /'/;
  //look for a past-tense verb
  // const hasPastTense = (terms, i) => {
  //   let after = terms.slice(i + 1, i + 3)
  //   return after.some(t => t.tags.has('PastTense'))
  // }
  // he'd walked -> had
  // how'd -> did
  // he'd go -> would

  const alwaysDid = new Set([
    'what',
    'how',
    'when',
    'where',
    'why',
  ]);

  // after-words
  const useWould = new Set([
    'be',
    'go',
    'start',
    'think',
    'need',
  ]);

  const useHad = new Set([
    'been',
    'gone'
  ]);
  // they'd gone
  // they'd go


  // he'd been
  //    he had been
  //    he would been

  const _apostropheD = function (terms, i) {
    let before = terms[i].normal.split(hasContraction$1)[0];

    // what'd, how'd
    if (alwaysDid.has(before)) {
      return [before, 'did']
    }
    if (terms[i + 1]) {
      // they'd gone
      if (useHad.has(terms[i + 1].normal)) {
        return [before, 'had']
      }
      // they'd go
      if (useWould.has(terms[i + 1].normal)) {
        return [before, 'would']
      }
    }
    return null
    //   if (hasPastTense(terms, i) === true) {
    //     return [before, 'had']
    //   }
    //   // had/would/did
    //   return [before, 'would']
  };
  var apostropheD = _apostropheD;

  //ain't -> are/is not
  const apostropheT = function (terms, i) {
    if (terms[i].normal === "ain't" || terms[i].normal === 'aint') {
      return null //do this in ./two/
    }
    let before = terms[i].normal.replace(/n't/, '');
    return [before, 'not']
  };

  var apostropheT$1 = apostropheT;

  const hasContraction = /'/;

  // l'amour
  const preL = (terms, i) => {
    // le/la
    let after = terms[i].normal.split(hasContraction)[1];
    // quick french gender disambig (rough)
    if (after && after.endsWith('e')) {
      return ['la', after]
    }
    return ['le', after]
  };

  // d'amerique
  const preD = (terms, i) => {
    let after = terms[i].normal.split(hasContraction)[1];
    // quick guess for noun-agreement (rough)
    if (after && after.endsWith('e')) {
      return ['du', after]
    } else if (after && after.endsWith('s')) {
      return ['des', after]
    }
    return ['de', after]
  };

  // j'aime
  const preJ = (terms, i) => {
    let after = terms[i].normal.split(hasContraction)[1];
    return ['je', after]
  };

  var french = {
    preJ,
    preL,
    preD,
  };

  const isRange = /^([0-9.]{1,4}[a-z]{0,2}) ?[-–—] ?([0-9]{1,4}[a-z]{0,2})$/i;
  const timeRange = /^([0-9]{1,2}(:[0-9][0-9])?(am|pm)?) ?[-–—] ?([0-9]{1,2}(:[0-9][0-9])?(am|pm)?)$/i;
  const phoneNum = /^[0-9]{3}-[0-9]{4}$/;

  const numberRange = function (terms, i) {
    let term = terms[i];
    let parts = term.text.match(isRange);
    if (parts !== null) {
      // 123-1234 is a phone number, not a number-range
      if (term.tags.has('PhoneNumber') === true || phoneNum.test(term.text)) {
        return null
      }
      return [parts[1], 'to', parts[2]]
    } else {
      parts = term.text.match(timeRange);
      if (parts !== null) {
        return [parts[1], 'to', parts[4]]
      }
    }
    return null
  };
  var numberRange$1 = numberRange;

  const byApostrophe = /'/;
  const numDash = /^[0-9][^-–—]*[-–—].*?[0-9]/;

  // run tagger on our new implicit terms
  const reTag = function (terms, view, start, len) {
    let tmp = view.update();
    tmp.document = [terms];
    // offer to re-tag neighbours, too
    let end = start + len;
    if (start > 0) {
      start -= 1;
    }
    if (terms[end]) {
      end += 1;
    }
    tmp.ptrs = [[0, start, end]];
    tmp.compute('lexicon');
    if (tmp.world.compute.preTagger) {
      tmp.compute('preTagger');
    }
  };

  const byEnd = {
    // ain't
    t: (terms, i) => apostropheT$1(terms, i),
    // how'd
    d: (terms, i) => apostropheD(terms, i),
  };

  const byStart = {
    // j'aime
    j: (terms, i) => french.preJ(terms, i),
    // l'amour
    l: (terms, i) => french.preL(terms, i),
    // d'amerique
    d: (terms, i) => french.preD(terms, i),
  };

  // pull-apart known contractions from model
  const knownOnes = function (list, term, before, after) {
    for (let i = 0; i < list.length; i += 1) {
      let o = list[i];
      // look for word-word match (cannot-> [can, not])
      if (o.word === term.normal) {
        return o.out
      }
      // look for after-match ('re -> [_, are])
      else if (after !== null && after === o.after) {
        return [before].concat(o.out)
      }
      // look for before-match (l' -> [le, _])
      else if (before !== null && before === o.before) {
        return o.out.concat(after)
        // return [o.out, after] //typeof o.out === 'string' ? [o.out, after] : o.out(terms, i)
      }
    }
    return null
  };

  const toDocs = function (words, view) {
    let doc = view.fromText(words.join(' '));
    doc.compute('id');
    return doc.docs[0]
  };

  //really easy ones
  const contractions$2 = (view) => {
    let { world, document } = view;
    const { model, methods } = world;
    let list = model.one.contractions || [];
    // each sentence
    document.forEach((terms, n) => {
      // loop through terms backwards
      for (let i = terms.length - 1; i >= 0; i -= 1) {
        let before = null;
        let after = null;
        if (byApostrophe.test(terms[i].normal) === true) {
          [before, after] = terms[i].normal.split(byApostrophe);
        }
        // any known-ones, like 'dunno'?
        let words = knownOnes(list, terms[i], before, after);
        // ['foo', 's']
        if (!words && byEnd.hasOwnProperty(after)) {
          words = byEnd[after](terms, i, world);
        }
        // ['j', 'aime']
        if (!words && byStart.hasOwnProperty(before)) {
          words = byStart[before](terms, i);
        }
        // actually insert the new terms
        if (words) {
          words = toDocs(words, view);
          splice(document, [n, i], words);
          reTag(document[n], view, i, words.length);
          continue
        }
        // '44-2' has special care
        if (numDash.test(terms[i].normal)) {
          words = numberRange$1(terms, i);
          if (words) {
            words = toDocs(words, view);
            splice(document, [n, i], words);
            methods.one.setTag(words, 'NumberRange', world);//add custom tag
            // is it a time-range, like '5-9pm'
            if (words[2] && words[2].tags.has('Time')) {
              methods.one.setTag([words[0]], 'Time', world);
            }
            reTag(document[n], view, i, words.length);
          }
        }
      }
    });
  };
  var contractions$3 = contractions$2;

  var compute$4 = { contractions: contractions$3 };

  const plugin = {
    model: model$5,
    compute: compute$4,
    hooks: ['contractions'],
  };
  var contractions$1 = plugin;

  // scan-ahead to match multiple-word terms - 'jack rabbit'
  const checkMulti = function (terms, i, lexicon, setTag, world) {
    let max = i + 4 > terms.length ? terms.length - i : 4;
    let str = terms[i].machine || terms[i].normal;
    for (let skip = 1; skip < max; skip += 1) {
      let t = terms[i + skip];
      let word = t.machine || t.normal;
      str += ' ' + word;
      if (lexicon.hasOwnProperty(str) === true) {
        let tag = lexicon[str];
        let ts = terms.slice(i, i + skip + 1);
        setTag(ts, tag, world, false, '1-multi-lexicon');
        return true
      }
    }
    return false
  };

  const multiWord = function (terms, i, world) {
    const { model, methods } = world;
    // const { fastTag } = methods.one
    const setTag = methods.one.setTag;
    const multi = model.one._multiCache || {};
    const lexicon = model.one.lexicon || {};
    // basic lexicon lookup
    let t = terms[i];
    let word = t.machine || t.normal;
    // multi-word lookup
    if (terms[i + 1] !== undefined && multi[word] === true) {
      return checkMulti(terms, i, lexicon, setTag, world)
    }
    return null
  };
  var multiWord$1 = multiWord;

  const prefix$2 = /^(under|over|mis|re|un|dis|semi|pre|post)-?/;
  // anti|non|extra|inter|intra|over
  const allowPrefix = new Set(['Verb', 'Infinitive', 'PastTense', 'Gerund', 'PresentTense', 'Adjective', 'Participle']);

  // tag any words in our lexicon
  const checkLexicon = function (terms, i, world) {
    const { model, methods } = world;
    // const fastTag = methods.one.fastTag
    const setTag = methods.one.setTag;
    const lexicon = model.one.lexicon;

    // basic lexicon lookup
    let t = terms[i];
    let word = t.machine || t.normal;
    // normal lexicon lookup
    if (lexicon[word] !== undefined && lexicon.hasOwnProperty(word)) {
      let tag = lexicon[word];
      setTag([t], tag, world, false, '1-lexicon');
      // fastTag(t, tag, '1-lexicon')
      return true
    }
    // lookup aliases in the lexicon
    if (t.alias) {
      let found = t.alias.find(str => lexicon.hasOwnProperty(str));
      if (found) {
        let tag = lexicon[found];
        setTag([t], tag, world, false, '1-lexicon-alias');
        // fastTag(t, tag, '1-lexicon-alias')
        return true
      }
    }
    // prefixing for verbs/adjectives
    if (prefix$2.test(word) === true) {
      let stem = word.replace(prefix$2, '');
      if (lexicon.hasOwnProperty(stem) && stem.length > 3) {
        // only allow prefixes for verbs/adjectives
        if (allowPrefix.has(lexicon[stem])) {
          // console.log('->', word, stem, lexicon[stem])
          setTag([t], lexicon[stem], world, false, '1-lexicon-prefix');
          // fastTag(t, lexicon[stem], '1-lexicon-prefix')
          return true
        }
      }
    }
    return null
  };
  var singleWord = checkLexicon;

  // tag any words in our lexicon - even if it hasn't been filled-up yet
  // rest of pre-tagger is in ./two/preTagger
  const firstPass$1 = function (view) {
    const world = view.world;
    view.docs.forEach(terms => {
      for (let i = 0; i < terms.length; i += 1) {
        if (terms[i].tags.size === 0) {
          let found = null;
          found = found || multiWord$1(terms, i, world);
          // lookup known words
          found = found || singleWord(terms, i, world);
        }
      }
    });
  };

  var compute$3 = {
    lexicon: firstPass$1
  };

  // derive clever things from our lexicon key-value pairs
  const expand$1 = function (words) {
    // const { methods, model } = world
    let lex = {};
    // console.log('start:', Object.keys(lex).length)
    let _multi = {};

    // go through each word in this key-value obj:
    Object.keys(words).forEach(word => {
      let tag = words[word];
      // normalize lexicon a little bit
      word = word.toLowerCase().trim();
      // cache multi-word terms
      let split = word.split(/ /);
      if (split.length > 1) {
        _multi[split[0]] = true;
      }
      lex[word] = lex[word] || tag;
    });
    // cleanup
    delete lex[''];
    delete lex[null];
    delete lex[' '];
    return { lex, _multi }
  };
  var expandLexicon = expand$1;

  var methods$g = {
    one: {
      expandLexicon,
    }
  };

  /** insert new words/phrases into the lexicon */
  const addWords$1 = function (words) {
    const world = this.world();
    const { methods, model } = world;
    if (!words) {
      return
    }
    // normalize tag vals
    Object.keys(words).forEach(k => {
      if (typeof words[k] === 'string' && words[k].startsWith('#')) {
        words[k] = words[k].replace(/^#/, '');
      }
    });
    // add some words to our lexicon
    if (methods.two.expandLexicon) {
      // do fancy ./two version
      let { lex, _multi } = methods.two.expandLexicon(words, world);
      Object.assign(model.one.lexicon, lex);
      Object.assign(model.one._multiCache, _multi);
    } else if (methods.one.expandLexicon) {
      // do basic ./one version
      let { lex, _multi } = methods.one.expandLexicon(words, world);
      Object.assign(model.one.lexicon, lex);
      Object.assign(model.one._multiCache, _multi);
    } else {
      //no fancy-business
      Object.assign(model.one.lexicon, words);
    }
  };

  var lib$5 = { addWords: addWords$1 };

  const model$4 = {
    one: {
      lexicon: {}, //setup blank lexicon
      _multiCache: {},
    }
  };

  var lexicon$4 = {
    model: model$4,
    methods: methods$g,
    compute: compute$3,
    lib: lib$5,
    hooks: ['lexicon']
  };

  // edited by Spencer Kelly
  // credit to https://github.com/BrunoRB/ahocorasick by Bruno Roberto Búrigo.

  const tokenize$2 = function (phrase, world) {
    const { methods, model } = world;
    let terms = methods.one.tokenize.splitTerms(phrase, model).map(methods.one.tokenize.splitWhitespace);
    return terms.map(term => term.text.toLowerCase())
  };

  // turn an array or object into a compressed aho-corasick structure
  const buildTrie = function (phrases, world) {

    // const tokenize=methods.one.
    let goNext = [{}];
    let endAs = [null];
    let failTo = [0];

    let xs = [];
    let n = 0;
    phrases.forEach(function (phrase) {
      let curr = 0;
      // let wordsB = phrase.split(/ /g).filter(w => w)
      let words = tokenize$2(phrase, world);
      for (let i = 0; i < words.length; i++) {
        let word = words[i];
        if (goNext[curr] && goNext[curr].hasOwnProperty(word)) {
          curr = goNext[curr][word];
        } else {
          n++;
          goNext[curr][word] = n;
          goNext[n] = {};
          curr = n;
          endAs[n] = null;
        }
      }
      endAs[curr] = [words.length];
    });
    // f(s) = 0 for all states of depth 1 (the ones from which the 0 state can transition to)
    for (let word in goNext[0]) {
      n = goNext[0][word];
      failTo[n] = 0;
      xs.push(n);
    }

    while (xs.length) {
      let r = xs.shift();
      // for each symbol a such that g(r, a) = s
      let keys = Object.keys(goNext[r]);
      for (let i = 0; i < keys.length; i += 1) {
        let word = keys[i];
        let s = goNext[r][word];
        xs.push(s);
        // set state = f(r)
        n = failTo[r];
        while (n > 0 && !goNext[n].hasOwnProperty(word)) {
          n = failTo[n];
        }
        if (goNext.hasOwnProperty(n)) {
          let fs = goNext[n][word];
          failTo[s] = fs;
          if (endAs[fs]) {
            endAs[s] = endAs[s] || [];
            endAs[s] = endAs[s].concat(endAs[fs]);
          }
        } else {
          failTo[s] = 0;
        }
      }
    }
    return { goNext, endAs, failTo }
  };
  var build = buildTrie;

  // console.log(buildTrie(['smart and cool', 'smart and nice']))

  // follow our trie structure
  const scanWords = function (terms, trie, opts) {
    let n = 0;
    let results = [];
    for (let i = 0; i < terms.length; i++) {
      let word = terms[i][opts.form] || terms[i].normal;
      // main match-logic loop:
      while (n > 0 && (trie.goNext[n] === undefined || !trie.goNext[n].hasOwnProperty(word))) {
        n = trie.failTo[n] || 0; // (usually back to 0)
      }
      // did we fail?
      if (!trie.goNext[n].hasOwnProperty(word)) {
        continue
      }
      n = trie.goNext[n][word];
      if (trie.endAs[n]) {
        let arr = trie.endAs[n];
        for (let o = 0; o < arr.length; o++) {
          let len = arr[o];
          let term = terms[i - len + 1];
          let [no, start] = term.index;
          results.push([no, start, start + len, term.id]);
        }
      }
    }
    return results
  };

  const cacheMiss = function (words, cache) {
    for (let i = 0; i < words.length; i += 1) {
      if (cache.has(words[i]) === true) {
        return false
      }
    }
    return true
  };

  const scan = function (view, trie, opts) {
    let results = [];
    opts.form = opts.form || 'normal';
    let docs = view.docs;
    if (!trie.goNext || !trie.goNext[0]) {
      console.error('Compromise invalid lookup trie');//eslint-disable-line
      return view.none()
    }
    let firstWords = Object.keys(trie.goNext[0]);
    // do each phrase
    for (let i = 0; i < docs.length; i++) {
      // can we skip the phrase, all together?
      if (view._cache && view._cache[i] && cacheMiss(firstWords, view._cache[i]) === true) {
        continue
      }
      let terms = docs[i];
      let found = scanWords(terms, trie, opts);
      if (found.length > 0) {
        results = results.concat(found);
      }
    }
    return view.update(results)
  };
  var scan$1 = scan;

  const isObject$4 = val => {
    return Object.prototype.toString.call(val) === '[object Object]'
  };

  function api$a (View) {

    /** find all matches in this document */
    View.prototype.lookup = function (input, opts = {}) {
      if (!input) {
        return this.none()
      }
      if (typeof input === 'string') {
        input = [input];
      }
      let trie = isObject$4(input) ? input : build(input, this.world);
      let res = scan$1(this, trie, opts);
      res = res.settle();
      return res
    };
  }

  // chop-off tail of redundant vals at end of array
  const truncate = (list, val) => {
    for (let i = list.length - 1; i >= 0; i -= 1) {
      if (list[i] !== val) {
        list = list.slice(0, i + 1);
        return list
      }
    }
    return list
  };

  // prune trie a bit
  const compress = function (trie) {
    trie.goNext = trie.goNext.map(o => {
      if (Object.keys(o).length === 0) {
        return undefined
      }
      return o
    });
    // chop-off tail of undefined vals in goNext array
    trie.goNext = truncate(trie.goNext, undefined);
    // chop-off tail of zeros in failTo array
    trie.failTo = truncate(trie.failTo, 0);
    // chop-off tail of nulls in endAs array
    trie.endAs = truncate(trie.endAs, null);
    return trie
  };
  var compress$1 = compress;

  /** pre-compile a list of matches to lookup */
  const lib$4 = {
    /** turn an array or object into a compressed trie*/
    compile: function (input) {
      const trie = build(input, this.world());
      return compress$1(trie)
    }
  };

  var lookup = {
    api: api$a,
    lib: lib$4
  };

  const relPointer = function (ptrs, parent) {
    if (!parent) {
      return ptrs
    }
    ptrs.forEach(ptr => {
      let n = ptr[0];
      if (parent[n]) {
        ptr[0] = parent[n][0]; //n
        ptr[1] += parent[n][1]; //start
        ptr[2] += parent[n][1]; //end
      }
    });
    return ptrs
  };

  // make match-result relative to whole document
  const fixPointers = function (res, parent) {
    let { ptrs, byGroup } = res;
    ptrs = relPointer(ptrs, parent);
    Object.keys(byGroup).forEach(k => {
      byGroup[k] = relPointer(byGroup[k], parent);
    });
    return { ptrs, byGroup }
  };

  const isObject$3 = val => {
    return Object.prototype.toString.call(val) === '[object Object]'
  };

  // did they pass-in a compromise object?
  const isView = val => val && isObject$3(val) && val.isView === true;

  const isNet = val => val && isObject$3(val) && val.isNet === true;


  // is the pointer the full sentence?
  // export const isFull = function (ptr, document) {
  //   let [n, start, end] = ptr
  //   if (start !== 0) {
  //     return false
  //   }
  //   if (document[n] && document[n][end - 1] && !document[n][end]) {
  //     return true
  //   }
  //   return false
  // }

  const match$2 = function (regs, group, opts) {
    const one = this.methods.one;
    // support param as view object
    if (isView(regs)) {
      return this.intersection(regs)
    }
    // support a compiled set of matches
    if (isNet(regs)) {
      return this.sweep(regs, { tagger: false }).view.settle()
    }
    // support param as string
    if (typeof regs === 'string') {
      regs = one.killUnicode(regs, this.world);
      regs = one.parseMatch(regs, opts, this.world);
    }
    let todo = { regs, group };
    let res = one.match(this.docs, todo, this._cache);
    let { ptrs, byGroup } = fixPointers(res, this.fullPointer);
    let view = this.toView(ptrs);
    view._groups = byGroup;
    // try to keep some of the cache
    // if (this._cache) {
    //   view._cache = view.ptrs.map(ptr => {
    //     if (isFull(ptr, this.document)) {
    //       return this._cache[ptr[0]]
    //     }
    //     return null
    //   })
    // }
    return view
  };

  const matchOne = function (regs, group, opts) {
    const one = this.methods.one;
    // support at view as a param
    if (isView(regs)) {
      return this.intersection(regs).eq(0)
    }
    // support a compiled set of matches
    if (isNet(regs)) {
      return this.sweep(regs, { tagger: false, matchOne: true }).view
    }
    if (typeof regs === 'string') {
      regs = one.killUnicode(regs, this.world);
      regs = one.parseMatch(regs, opts, this.world);
    }
    let todo = { regs, group, justOne: true };
    let res = one.match(this.docs, todo, this._cache);
    let { ptrs, byGroup } = fixPointers(res, this.fullPointer);
    let view = this.toView(ptrs);
    view._groups = byGroup;
    return view
  };

  const has = function (regs, group, opts) {
    const one = this.methods.one;
    // support view as input
    if (isView(regs)) {
      let ptrs = regs.fullPointer; // support a view object as input
      return ptrs.length > 0
    }
    // support a compiled set of matches
    if (isNet(regs)) {
      return this.sweep(regs, { tagger: false }).view.found
    }
    if (typeof regs === 'string') {
      regs = one.killUnicode(regs, this.world);
      regs = one.parseMatch(regs, opts, this.world);
    }
    let todo = { regs, group, justOne: true };
    let ptrs = one.match(this.docs, todo, this._cache).ptrs;
    return ptrs.length > 0
  };

  // 'if'
  const ifFn = function (regs, group, opts) {
    const one = this.methods.one;
    // support view as input
    if (isView(regs)) {
      return this.filter(m => m.intersection(regs).found)
    }
    // support a compiled set of matches
    if (isNet(regs)) {
      let m = this.sweep(regs, { tagger: false }).view.settle();
      return this.if(m)//recurse with result
    }
    if (typeof regs === 'string') {
      regs = one.killUnicode(regs, this.world);
      regs = one.parseMatch(regs, opts, this.world);
    }
    let todo = { regs, group, justOne: true };
    let ptrs = this.fullPointer;
    let cache = this._cache || [];
    ptrs = ptrs.filter((ptr, i) => {
      let m = this.update([ptr]);
      let res = one.match(m.docs, todo, cache[i]).ptrs;
      return res.length > 0
    });
    let view = this.update(ptrs);
    // try and reconstruct the cache
    if (this._cache) {
      view._cache = ptrs.map(ptr => cache[ptr[0]]);
    }
    return view
  };

  const ifNo = function (regs, group, opts) {
    const { methods } = this;
    const one = methods.one;
    // support a view object as input
    if (isView(regs)) {
      return this.filter(m => !m.intersection(regs).found)
    }
    // support a compiled set of matches
    if (isNet(regs)) {
      let m = this.sweep(regs, { tagger: false }).view.settle();
      return this.ifNo(m)
    }
    // otherwise parse the match string
    if (typeof regs === 'string') {
      regs = one.killUnicode(regs, this.world);
      regs = one.parseMatch(regs, opts, this.world);
    }
    let cache = this._cache || [];
    let view = this.filter((m, i) => {
      let todo = { regs, group, justOne: true };
      let ptrs = one.match(m.docs, todo, cache[i]).ptrs;
      return ptrs.length === 0
    });
    // try to reconstruct the cache
    if (this._cache) {
      view._cache = view.ptrs.map(ptr => cache[ptr[0]]);
    }
    return view
  };

  var match$3 = { matchOne, match: match$2, has, if: ifFn, ifNo };

  const before = function (regs, group, opts) {
    const { indexN } = this.methods.one.pointer;
    let pre = [];
    let byN = indexN(this.fullPointer);
    Object.keys(byN).forEach(k => {
      // check only the earliest match in the sentence
      let first = byN[k].sort((a, b) => (a[1] > b[1] ? 1 : -1))[0];
      if (first[1] > 0) {
        pre.push([first[0], 0, first[1]]);
      }
    });
    let preWords = this.toView(pre);
    if (!regs) {
      return preWords
    }
    return preWords.match(regs, group, opts)
  };

  const after = function (regs, group, opts) {
    const { indexN } = this.methods.one.pointer;
    let post = [];
    let byN = indexN(this.fullPointer);
    let document = this.document;
    Object.keys(byN).forEach(k => {
      // check only the latest match in the sentence
      let last = byN[k].sort((a, b) => (a[1] > b[1] ? -1 : 1))[0];
      let [n, , end] = last;
      if (end < document[n].length) {
        post.push([n, end, document[n].length]);
      }
    });
    let postWords = this.toView(post);
    if (!regs) {
      return postWords
    }
    return postWords.match(regs, group, opts)
  };

  const growLeft = function (regs, group, opts) {
    if (typeof regs === 'string') {
      regs = this.world.methods.one.parseMatch(regs, opts, this.world);
    }
    regs[regs.length - 1].end = true;// ensure matches are beside us ←
    let ptrs = this.fullPointer;
    this.forEach((m, n) => {
      let more = m.before(regs, group);
      if (more.found) {
        let terms = more.terms();
        ptrs[n][1] -= terms.length;
        ptrs[n][3] = terms.docs[0][0].id;
      }
    });
    return this.update(ptrs)
  };

  const growRight = function (regs, group, opts) {
    if (typeof regs === 'string') {
      regs = this.world.methods.one.parseMatch(regs, opts, this.world);
    }
    regs[0].start = true;// ensure matches are beside us →
    let ptrs = this.fullPointer;
    this.forEach((m, n) => {
      let more = m.after(regs, group);
      if (more.found) {
        let terms = more.terms();
        ptrs[n][2] += terms.length;
        ptrs[n][4] = null; //remove end-id
      }
    });
    return this.update(ptrs)
  };

  const grow = function (regs, group, opts) {
    return this.growRight(regs, group, opts).growLeft(regs, group, opts)
  };

  var lookaround = { before, after, growLeft, growRight, grow };

  const combine$1 = function (left, right) {
    return [left[0], left[1], right[2]]
  };

  const isArray$6 = function (arr) {
    return Object.prototype.toString.call(arr) === '[object Array]'
  };

  const getDoc$3 = (reg, view, group) => {
    if (typeof reg === 'string' || isArray$6(reg)) {
      return view.match(reg, group)
    }
    if (!reg) {
      return view.none()
    }
    return reg
  };

  const addIds$1 = function (ptr, view) {
    let [n, start, end] = ptr;
    if (view.document[n] && view.document[n][start]) {
      ptr[3] = ptr[3] || view.document[n][start].id;
      if (view.document[n][end - 1]) {
        ptr[4] = ptr[4] || view.document[n][end - 1].id;
      }
    }
    return ptr
  };

  const methods$f = {};
  // [before], [match], [after]
  methods$f.splitOn = function (m, group) {
    const { splitAll } = this.methods.one.pointer;
    let splits = getDoc$3(m, this, group).fullPointer;
    let all = splitAll(this.fullPointer, splits);
    let res = [];
    all.forEach(o => {
      res.push(o.passthrough);
      res.push(o.before);
      res.push(o.match);
      res.push(o.after);
    });
    res = res.filter(p => p);
    res = res.map(p => addIds$1(p, this));
    return this.update(res)
  };

  // [before], [match after]
  methods$f.splitBefore = function (m, group) {
    const { splitAll } = this.methods.one.pointer;
    let splits = getDoc$3(m, this, group).fullPointer;
    let all = splitAll(this.fullPointer, splits);
    let res = [];
    all.forEach(o => {
      res.push(o.passthrough);
      res.push(o.before);
      if (o.match && o.after) {
        // console.log(combine(o.match, o.after))
        res.push(combine$1(o.match, o.after));
      } else {
        res.push(o.match);
        res.push(o.after);
      }
    });
    res = res.filter(p => p);
    res = res.map(p => addIds$1(p, this));
    return this.update(res)
  };

  // [before match], [after]
  methods$f.splitAfter = function (m, group) {
    const { splitAll } = this.methods.one.pointer;
    let splits = getDoc$3(m, this, group).fullPointer;
    let all = splitAll(this.fullPointer, splits);
    let res = [];
    all.forEach(o => {
      res.push(o.passthrough);
      if (o.before && o.match) {
        res.push(combine$1(o.before, o.match));
      } else {
        res.push(o.before);
        res.push(o.match);
      }
      res.push(o.after);
    });
    res = res.filter(p => p);
    res = res.map(p => addIds$1(p, this));
    return this.update(res)
  };
  methods$f.split = methods$f.splitAfter;

  var split$1 = methods$f;

  const methods$e = Object.assign({}, match$3, lookaround, split$1);
  // aliases
  methods$e.lookBehind = methods$e.before;
  methods$e.lookBefore = methods$e.before;

  methods$e.lookAhead = methods$e.after;
  methods$e.lookAfter = methods$e.after;

  methods$e.notIf = methods$e.ifNo;
  const matchAPI = function (View) {
    Object.assign(View.prototype, methods$e);
  };
  var api$9 = matchAPI;

  // match  'foo /yes/' and not 'foo/no/bar'
  const bySlashes = /(?:^|\s)([![^]*(?:<[^<]*>)?\/.*?[^\\/]\/[?\]+*$~]*)(?:\s|$)/;
  // match '(yes) but not foo(no)bar'
  const byParentheses = /([!~[^]*(?:<[^<]*>)?\([^)]+[^\\)]\)[?\]+*$~]*)(?:\s|$)/;
  // okay
  const byWord = / /g;

  const isBlock = str => {
    return /^[![^]*(<[^<]*>)?\(/.test(str) && /\)[?\]+*$~]*$/.test(str)
  };
  const isReg = str => {
    return /^[![^]*(<[^<]*>)?\//.test(str) && /\/[?\]+*$~]*$/.test(str)
  };

  const cleanUp = function (arr) {
    arr = arr.map(str => str.trim());
    arr = arr.filter(str => str);
    return arr
  };

  const parseBlocks = function (txt) {
    // parse by /regex/ first
    let arr = txt.split(bySlashes);
    let res = [];
    // parse by (blocks), next
    arr.forEach(str => {
      if (isReg(str)) {
        res.push(str);
        return
      }
      res = res.concat(str.split(byParentheses));
    });
    res = cleanUp(res);
    // split by spaces, now
    let final = [];
    res.forEach(str => {
      if (isBlock(str)) {
        final.push(str);
      } else if (isReg(str)) {
        final.push(str);
      } else {
        final = final.concat(str.split(byWord));
      }
    });
    final = cleanUp(final);
    return final
  };
  var parseBlocks$1 = parseBlocks;

  const hasMinMax = /\{([0-9]+)?(, *[0-9]*)?\}/;
  const andSign = /&&/;
  // const hasDash = /\p{Letter}[-–—]\p{Letter}/u
  const captureName = new RegExp(/^<\s*(\S+)\s*>/);
  /* break-down a match expression into this:
  {
    word:'',
    tag:'',
    regex:'',

    start:false,
    end:false,
    negative:false,
    anything:false,
    greedy:false,
    optional:false,

    named:'',
    choices:[],
  }
  */
  const titleCase$1 = str => str.charAt(0).toUpperCase() + str.substring(1);
  const end = (str) => str.charAt(str.length - 1);
  const start = (str) => str.charAt(0);
  const stripStart = (str) => str.substring(1);
  const stripEnd = (str) => str.substring(0, str.length - 1);

  const stripBoth = function (str) {
    str = stripStart(str);
    str = stripEnd(str);
    return str
  };
  //
  const parseToken = function (w, opts) {
    let obj = {};
    //collect any flags (do it twice)
    for (let i = 0; i < 2; i += 1) {
      //end-flag
      if (end(w) === '$') {
        obj.end = true;
        w = stripEnd(w);
      }
      //front-flag
      if (start(w) === '^') {
        obj.start = true;
        w = stripStart(w);
      }
      //capture group (this one can span multiple-terms)
      if (start(w) === '[' || end(w) === ']') {
        obj.group = null;
        if (start(w) === '[') {
          obj.groupStart = true;
        }
        if (end(w) === ']') {
          obj.groupEnd = true;
        }
        w = w.replace(/^\[/, '');
        w = w.replace(/\]$/, '');
        // Use capture group name
        if (start(w) === '<') {
          const res = captureName.exec(w);
          if (res.length >= 2) {
            obj.group = res[1];
            w = w.replace(res[0], '');
          }
        }
      }
      //back-flags
      if (end(w) === '+') {
        obj.greedy = true;
        w = stripEnd(w);
      }
      if (w !== '*' && end(w) === '*' && w !== '\\*') {
        obj.greedy = true;
        w = stripEnd(w);
      }
      if (end(w) === '?') {
        obj.optional = true;
        w = stripEnd(w);
      }
      if (start(w) === '!') {
        obj.negative = true;
        // obj.optional = true
        w = stripStart(w);
      }
      //soft-match
      if (start(w) === '~' && end(w) === '~' && w.length > 2) {
        w = stripBoth(w);
        obj.fuzzy = true;
        obj.min = opts.fuzzy || 0.85;
        if (/\(/.test(w) === false) {
          obj.word = w;
          return obj
        }
      }

      //wrapped-flags
      if (start(w) === '(' && end(w) === ')') {
        // support (one && two)
        if (andSign.test(w)) {
          obj.choices = w.split(andSign);
          obj.operator = 'and';
        } else {
          obj.choices = w.split('|');
          obj.operator = 'or';
        }
        //remove '(' and ')'
        obj.choices[0] = stripStart(obj.choices[0]);
        let last = obj.choices.length - 1;
        obj.choices[last] = stripEnd(obj.choices[last]);
        // clean up the results
        obj.choices = obj.choices.map(s => s.trim());
        obj.choices = obj.choices.filter(s => s);
        //recursion alert!
        obj.choices = obj.choices.map(str => {
          return str.split(/ /g).map(s => parseToken(s, opts))
        });
        w = '';
      }
      //regex
      if (start(w) === '/' && end(w) === '/') {
        w = stripBoth(w);
        if (opts.caseSensitive) {
          obj.use = 'text';
        }
        obj.regex = new RegExp(w); //potential vuln - security/detect-non-literal-regexp
        return obj
      }

      //machine/sense overloaded
      if (start(w) === '{' && end(w) === '}') {
        w = stripBoth(w);
        if (/\//.test(w)) {
          obj.sense = w;
          obj.greedy = true;
        } else {
          obj.machine = w;
        }
        return obj
      }
      //chunks
      if (start(w) === '<' && end(w) === '>') {
        w = stripBoth(w);
        obj.chunk = titleCase$1(w);
        obj.greedy = true;
        return obj
      }
      if (start(w) === '%' && end(w) === '%') {
        w = stripBoth(w);
        obj.switch = w;
        return obj
      }
    }
    // support foo{1,9}
    if (hasMinMax.test(w) === true) {
      w = w.replace(hasMinMax, (_a, b, c) => {
        if (c === undefined) {
          // '{3}'	Exactly three times
          obj.min = Number(b);
          obj.max = Number(b);
        } else {
          c = c.replace(/, */, '');
          if (b === undefined) {
            // '{,9}' implied zero min
            obj.min = 0;
            obj.max = Number(c);
          } else {
            // '{2,4}' Two to four times
            obj.min = Number(b);
            // '{3,}' Three or more times
            obj.max = Number(c || 999);
          }
        }
        // use same method as '+'
        obj.greedy = true;
        // 0 as min means the same as '?'
        if (!obj.min) {
          obj.optional = true;
        }
        return ''
      });
    }
    //do the actual token content
    if (start(w) === '#') {
      obj.tag = stripStart(w);
      obj.tag = titleCase$1(obj.tag);
      return obj
    }
    //dynamic function on a term object
    if (start(w) === '@') {
      obj.method = stripStart(w);
      return obj
    }
    if (w === '.') {
      obj.anything = true;
      return obj
    }
    //support alone-astrix
    if (w === '*') {
      obj.anything = true;
      obj.greedy = true;
      obj.optional = true;
      return obj
    }
    if (w) {
      //somehow handle encoded-chars?
      w = w.replace('\\*', '*');
      w = w.replace('\\.', '.');
      if (opts.caseSensitive) {
        obj.use = 'text';
      } else {
        w = w.toLowerCase();
      }
      obj.word = w;
    }
    return obj
  };
  var parseToken$1 = parseToken;

  const hasDash$2 = /[a-z0-9][-–—][a-z]/i;

  // match 're-do' -> ['re','do']
  const splitHyphens$1 = function (regs, world) {
    let prefixes = world.model.one.prefixes;
    for (let i = regs.length - 1; i >= 0; i -= 1) {
      let reg = regs[i];
      if (reg.word && hasDash$2.test(reg.word)) {
        let words = reg.word.split(/[-–—]/g);
        // don't split 're-cycle', etc
        if (prefixes.hasOwnProperty(words[0])) {
          continue
        }
        words = words.filter(w => w).reverse();
        regs.splice(i, 1);
        words.forEach(w => {
          let obj = Object.assign({}, reg);
          obj.word = w;
          regs.splice(i, 0, obj);
        });
      }
    }
    return regs
  };
  var splitHyphens$2 = splitHyphens$1;

  // name any [unnamed] capture-groups with a number
  const nameGroups = function (regs) {
    let index = 0;
    let inGroup = null;
    //'fill in' capture groups between start-end
    for (let i = 0; i < regs.length; i++) {
      const token = regs[i];
      if (token.groupStart === true) {
        inGroup = token.group;
        if (inGroup === null) {
          inGroup = String(index);
          index += 1;
        }
      }
      if (inGroup !== null) {
        token.group = inGroup;
      }
      if (token.groupEnd === true) {
        inGroup = null;
      }
    }
    return regs
  };

  // optimize an 'or' lookup, when the (a|b|c) list is simple or multi-word
  const doFastOrMode = function (tokens) {
    return tokens.map(token => {
      if (token.choices !== undefined) {
        // make sure it's an OR
        if (token.operator !== 'or') {
          return token
        }
        if (token.fuzzy === true) {
          return token
        }
        // are they all straight-up words? then optimize them.
        let shouldPack = token.choices.every(block => {
          if (block.length !== 1) {
            return false
          }
          let reg = block[0];
          // ~fuzzy~ words need more care
          if (reg.fuzzy === true) {
            return false
          }
          // ^ and $ get lost in fastOr
          if (reg.start || reg.end) {
            return false
          }
          if (reg.word !== undefined && reg.negative !== true && reg.optional !== true && reg.method !== true) {
            return true //reg is simple-enough
          }
          return false
        });
        if (shouldPack === true) {
          token.fastOr = new Set();
          token.choices.forEach(block => {
            token.fastOr.add(block[0].word);
          });
          delete token.choices;
        }
      }
      return token
    })
  };

  // support ~(a|b|c)~
  const fuzzyOr = function (regs) {
    return regs.map(reg => {
      if (reg.fuzzy && reg.choices) {
        // pass fuzzy-data to each OR choice
        reg.choices.forEach(r => {
          if (r.length === 1 && r[0].word) {
            r[0].fuzzy = true;
            r[0].min = reg.min;
          }
        });
      }
      return reg
    })
  };

  const postProcess = function (regs) {
    // ensure all capture groups names are filled between start and end
    regs = nameGroups(regs);
    // convert 'choices' format to 'fastOr' format
    regs = doFastOrMode(regs);
    // support ~(foo|bar)~
    regs = fuzzyOr(regs);
    return regs
  };
  var postProcess$1 = postProcess;

  /** parse a match-syntax string into json */
  const syntax = function (input, opts, world) {
    // fail-fast
    if (input === null || input === undefined || input === '') {
      return []
    }
    opts = opts || {};
    if (typeof input === 'number') {
      input = String(input); //go for it?
    }
    let tokens = parseBlocks$1(input);
    //turn them into objects
    tokens = tokens.map(str => parseToken$1(str, opts));
    // '~re-do~'
    tokens = splitHyphens$2(tokens, world);
    //clean up anything weird
    tokens = postProcess$1(tokens);
    // console.log(tokens)
    return tokens
  };
  var parseMatch = syntax;

  const anyIntersection = function (setA, setB) {
    for (let elem of setB) {
      if (setA.has(elem)) {
        return true
      }
    }
    return false
  };
  // check words/tags against our cache
  const failFast = function (regs, cache) {
    for (let i = 0; i < regs.length; i += 1) {
      let reg = regs[i];
      if (reg.optional === true || reg.negative === true || reg.fuzzy === true) {
        continue
      }
      // is the word missing from the cache?
      if (reg.word !== undefined && cache.has(reg.word) === false) {
        return true
      }
      // is the tag missing?
      if (reg.tag !== undefined && cache.has('#' + reg.tag) === false) {
        return true
      }
      // perform a speedup for fast-or
      if (reg.fastOr && anyIntersection(reg.fastOr, cache) === false) {
        return false
      }
    }
    return false
  };
  var failFast$1 = failFast;

  // fuzzy-match (damerau-levenshtein)
  // Based on  tad-lispy /node-damerau-levenshtein
  // https://github.com/tad-lispy/node-damerau-levenshtein/blob/master/index.js
  // count steps (insertions, deletions, substitutions, or transpositions)
  const editDistance = function (strA, strB) {
    let aLength = strA.length,
      bLength = strB.length;
    // fail-fast
    if (aLength === 0) {
      return bLength
    }
    if (bLength === 0) {
      return aLength
    }
    // If the limit is not defined it will be calculate from this and that args.
    let limit = (bLength > aLength ? bLength : aLength) + 1;
    if (Math.abs(aLength - bLength) > (limit || 100)) {
      return limit || 100
    }
    // init the array
    let matrix = [];
    for (let i = 0; i < limit; i++) {
      matrix[i] = [i];
      matrix[i].length = limit;
    }
    for (let i = 0; i < limit; i++) {
      matrix[0][i] = i;
    }
    // Calculate matrix.
    let j, a_index, b_index, cost, min, t;
    for (let i = 1; i <= aLength; ++i) {
      a_index = strA[i - 1];
      for (j = 1; j <= bLength; ++j) {
        // Check the jagged distance total so far
        if (i === j && matrix[i][j] > 4) {
          return aLength
        }
        b_index = strB[j - 1];
        cost = a_index === b_index ? 0 : 1; // Step 5
        // Calculate the minimum (much faster than Math.min(...)).
        min = matrix[i - 1][j] + 1; // Deletion.
        if ((t = matrix[i][j - 1] + 1) < min) min = t; // Insertion.
        if ((t = matrix[i - 1][j - 1] + cost) < min) min = t; // Substitution.
        // Update matrix.
        let shouldUpdate =
          i > 1 && j > 1 && a_index === strB[j - 2] && strA[i - 2] === b_index && (t = matrix[i - 2][j - 2] + cost) < min;
        if (shouldUpdate) {
          matrix[i][j] = t;
        } else {
          matrix[i][j] = min;
        }
      }
    }
    // return number of steps
    return matrix[aLength][bLength]
  };
  // score similarity by from 0-1 (steps/length)
  const fuzzyMatch = function (strA, strB, minLength = 3) {
    if (strA === strB) {
      return 1
    }
    //don't even bother on tiny strings
    if (strA.length < minLength || strB.length < minLength) {
      return 0
    }
    const steps = editDistance(strA, strB);
    let length = Math.max(strA.length, strB.length);
    let relative = length === 0 ? 0 : steps / length;
    let similarity = 1 - relative;
    return similarity
  };
  var fuzzy = fuzzyMatch;

  // these methods are called with '@hasComma' in the match syntax
  // various unicode quotation-mark formats
  const startQuote =
    /([\u0022\uFF02\u0027\u201C\u2018\u201F\u201B\u201E\u2E42\u201A\u00AB\u2039\u2035\u2036\u2037\u301D\u0060\u301F])/;

  const endQuote = /([\u0022\uFF02\u0027\u201D\u2019\u00BB\u203A\u2032\u2033\u2034\u301E\u00B4])/;

  const hasHyphen$1 = /^[-–—]$/;
  const hasDash$1 = / [-–—] /;

  /** search the term's 'post' punctuation  */
  const hasPost = (term, punct) => term.post.indexOf(punct) !== -1;
  /** search the term's 'pre' punctuation  */
  const hasPre = (term, punct) => term.pre.indexOf(punct) !== -1;

  const methods$d = {
    /** does it have a quotation symbol?  */
    hasQuote: term => startQuote.test(term.pre) || endQuote.test(term.post),
    /** does it have a comma?  */
    hasComma: term => hasPost(term, ','),
    /** does it end in a period? */
    hasPeriod: term => hasPost(term, '.') === true && hasPost(term, '...') === false,
    /** does it end in an exclamation */
    hasExclamation: term => hasPost(term, '!'),
    /** does it end with a question mark? */
    hasQuestionMark: term => hasPost(term, '?') || hasPost(term, '¿'),
    /** is there a ... at the end? */
    hasEllipses: term => hasPost(term, '..') || hasPost(term, '…') || hasPre(term, '..') || hasPre(term, '…'),
    /** is there a semicolon after term word? */
    hasSemicolon: term => hasPost(term, ';'),
    /** is there a slash '/' in term word? */
    hasSlash: term => /\//.test(term.text),
    /** a hyphen connects two words like-term */
    hasHyphen: term => hasHyphen$1.test(term.post) || hasHyphen$1.test(term.pre),
    /** a dash separates words - like that */
    hasDash: term => hasDash$1.test(term.post) || hasDash$1.test(term.pre),
    /** is it multiple words combinded */
    hasContraction: term => Boolean(term.implicit),
    /** is it an acronym */
    isAcronym: term => term.tags.has('Acronym'),
    /** does it have any tags */
    isKnown: term => term.tags.size > 0,
    /** uppercase first letter, then a lowercase */
    isTitleCase: term => /^\p{Lu}[a-z'\u00C0-\u00FF]/u.test(term.text),
    /** uppercase all letters */
    isUpperCase: term => /^\p{Lu}+$/u.test(term.text),
  };
  // aliases
  methods$d.hasQuotation = methods$d.hasQuote;

  var termMethods = methods$d;

  //declare it up here
  let wrapMatch = function () { };
  /** ignore optional/greedy logic, straight-up term match*/
  const doesMatch$1 = function (term, reg, index, length) {
    // support '.'
    if (reg.anything === true) {
      return true
    }
    // support '^' (in parentheses)
    if (reg.start === true && index !== 0) {
      return false
    }
    // support '$' (in parentheses)
    if (reg.end === true && index !== length - 1) {
      return false
    }
    //support a text match
    if (reg.word !== undefined) {
      // check case-sensitivity, etc
      if (reg.use) {
        return reg.word === term[reg.use]
      }
      //match contractions, machine-form
      if (term.machine !== null && term.machine === reg.word) {
        return true
      }
      // term aliases for slashes and things
      if (term.alias !== undefined && term.alias.hasOwnProperty(reg.word)) {
        return true
      }
      // support ~ fuzzy match
      if (reg.fuzzy === true) {
        if (reg.word === term.root) {
          return true
        }
        let score = fuzzy(reg.word, term.normal);
        if (score >= reg.min) {
          return true
        }
      }
      // match slashes and things
      if (term.alias && term.alias.some(str => str === reg.word)) {
        return true
      }
      //match either .normal or .text
      return reg.word === term.text || reg.word === term.normal
    }
    //support #Tag
    if (reg.tag !== undefined) {
      return term.tags.has(reg.tag) === true
    }
    //support @method
    if (reg.method !== undefined) {
      if (typeof termMethods[reg.method] === 'function' && termMethods[reg.method](term) === true) {
        return true
      }
      return false
    }
    //support whitespace/punctuation
    if (reg.pre !== undefined) {
      return term.pre && term.pre.includes(reg.pre)
    }
    if (reg.post !== undefined) {
      return term.post && term.post.includes(reg.post)
    }
    //support /reg/
    if (reg.regex !== undefined) {
      let str = term.normal;
      if (reg.use) {
        str = term[reg.use];
      }
      return reg.regex.test(str)
    }
    //support <chunk>
    if (reg.chunk !== undefined) {
      return term.chunk === reg.chunk
    }
    //support %Noun|Verb%
    if (reg.switch !== undefined) {
      return term.switch === reg.switch
    }
    //support {machine}
    if (reg.machine !== undefined) {
      return term.normal === reg.machine || term.machine === reg.machine || term.root === reg.machine
    }
    //support {word/sense}
    if (reg.sense !== undefined) {
      return term.sense === reg.sense
    }
    // support optimized (one|two)
    if (reg.fastOr !== undefined) {
      return reg.fastOr.has(term.implicit) || reg.fastOr.has(term.normal) || reg.fastOr.has(term.text) || reg.fastOr.has(term.machine)
    }
    //support slower (one|two)
    if (reg.choices !== undefined) {
      // try to support && operator
      if (reg.operator === 'and') {
        // must match them all
        return reg.choices.every(r => wrapMatch(term, r, index, length))
      }
      // or must match one
      return reg.choices.some(r => wrapMatch(term, r, index, length))
    }
    return false
  };
  // wrap result for !negative match logic
  wrapMatch = function (t, reg, index, length) {
    let result = doesMatch$1(t, reg, index, length);
    if (reg.negative === true) {
      return !result
    }
    return result
  };
  var matchTerm = wrapMatch;

  // for greedy checking, we no longer care about the reg.start
  // value, and leaving it can cause failures for anchored greedy
  // matches.  ditto for end-greedy matches: we need an earlier non-
  // ending match to succceed until we get to the actual end.
  const getGreedy = function (state, endReg) {
    let reg = Object.assign({}, state.regs[state.r], { start: false, end: false });
    let start = state.t;
    for (; state.t < state.terms.length; state.t += 1) {
      //stop for next-reg match
      if (endReg && matchTerm(state.terms[state.t], endReg, state.start_i + state.t, state.phrase_length)) {
        return state.t
      }
      let count = state.t - start + 1;
      // is it max-length now?
      if (reg.max !== undefined && count === reg.max) {
        return state.t
      }
      //stop here
      if (matchTerm(state.terms[state.t], reg, state.start_i + state.t, state.phrase_length) === false) {
        // is it too short?
        if (reg.min !== undefined && count < reg.min) {
          return null
        }
        return state.t
      }
    }
    return state.t
  };

  const greedyTo = function (state, nextReg) {
    let t = state.t;
    //if there's no next one, just go off the end!
    if (!nextReg) {
      return state.terms.length
    }
    //otherwise, we're looking for the next one
    for (; t < state.terms.length; t += 1) {
      if (matchTerm(state.terms[t], nextReg, state.start_i + t, state.phrase_length) === true) {
        // console.log(`greedyTo ${state.terms[t].normal}`)
        return t
      }
    }
    //guess it doesn't exist, then.
    return null
  };

  const isEndGreedy = function (reg, state) {
    if (reg.end === true && reg.greedy === true) {
      if (state.start_i + state.t < state.phrase_length - 1) {
        let tmpReg = Object.assign({}, reg, { end: false });
        if (matchTerm(state.terms[state.t], tmpReg, state.start_i + state.t, state.phrase_length) === true) {
          // console.log(`endGreedy ${state.terms[state.t].normal}`)
          return true
        }
      }
    }
    return false
  };

  const getGroup$2 = function (state, term_index) {
    if (state.groups[state.inGroup]) {
      return state.groups[state.inGroup]
    }
    state.groups[state.inGroup] = {
      start: term_index,
      length: 0,
    };
    return state.groups[state.inGroup]
  };

  //support 'unspecific greedy' .* properly
  // its logic is 'greedy until', where it's looking for the next token
  // '.+ foo' means we check for 'foo', indefinetly
  const doAstrix = function (state) {
    let { regs } = state;
    let reg = regs[state.r];

    let skipto = greedyTo(state, regs[state.r + 1]);
    //maybe we couldn't find it
    if (skipto === null || skipto === 0) {
      return null
    }
    // ensure it's long enough
    if (reg.min !== undefined && skipto - state.t < reg.min) {
      return null
    }
    // reduce it back, if it's too long
    if (reg.max !== undefined && skipto - state.t > reg.max) {
      state.t = state.t + reg.max;
      return true
    }
    // set the group result
    if (state.hasGroup === true) {
      const g = getGroup$2(state, state.t);
      g.length = skipto - state.t;
    }
    state.t = skipto;
    // log(`✓ |greedy|`)
    return true
  };
  var doAstrix$1 = doAstrix;

  const isArray$5 = function (arr) {
    return Object.prototype.toString.call(arr) === '[object Array]'
  };

  const doOrBlock$1 = function (state, skipN = 0) {
    let block = state.regs[state.r];
    let wasFound = false;
    // do each multiword sequence
    for (let c = 0; c < block.choices.length; c += 1) {
      // try to match this list of tokens
      let regs = block.choices[c];
      if (!isArray$5(regs)) {
        return false
      }
      wasFound = regs.every((cr, w_index) => {
        let extra = 0;
        let t = state.t + w_index + skipN + extra;
        if (state.terms[t] === undefined) {
          return false
        }
        let foundBlock = matchTerm(state.terms[t], cr, t + state.start_i, state.phrase_length);
        // this can be greedy - '(foo+ bar)'
        if (foundBlock === true && cr.greedy === true) {
          for (let i = 1; i < state.terms.length; i += 1) {
            let term = state.terms[t + i];
            if (term) {
              let keepGoing = matchTerm(term, cr, state.start_i + i, state.phrase_length);
              if (keepGoing === true) {
                extra += 1;
              } else {
                break
              }
            }
          }
        }
        skipN += extra;
        return foundBlock
      });
      if (wasFound) {
        skipN += regs.length;
        break
      }
    }
    // we found a match -  is it greedy though?
    if (wasFound && block.greedy === true) {
      return doOrBlock$1(state, skipN) // try it again!
    }
    return skipN
  };

  const doAndBlock$1 = function (state) {
    let longest = 0;
    // all blocks must match, and we return the greediest match
    let reg = state.regs[state.r];
    let allDidMatch = reg.choices.every(block => {
      //  for multi-word blocks, all must match
      let allWords = block.every((cr, w_index) => {
        let tryTerm = state.t + w_index;
        if (state.terms[tryTerm] === undefined) {
          return false
        }
        return matchTerm(state.terms[tryTerm], cr, tryTerm, state.phrase_length)
      });
      if (allWords === true && block.length > longest) {
        longest = block.length;
      }
      return allWords
    });
    if (allDidMatch === true) {
      // console.log(`doAndBlock ${state.terms[state.t].normal}`)
      return longest
    }
    return false
  };

  const orBlock = function (state) {
    const { regs } = state;
    let reg = regs[state.r];
    let skipNum = doOrBlock$1(state);
    // did we find a match?
    if (skipNum) {
      // handle 'not' logic
      if (reg.negative === true) {
        return null // die
      }
      // tuck in as named-group
      if (state.hasGroup === true) {
        const g = getGroup$2(state, state.t);
        g.length += skipNum;
      }
      // ensure we're at the end
      if (reg.end === true) {
        let end = state.phrase_length;
        if (state.t + state.start_i + skipNum !== end) {
          return null
        }
      }
      state.t += skipNum;
      // log(`✓ |found-or|`)
      return true
    } else if (!reg.optional) {
      return null //die
    }
    return true
  };
  var doOrBlock = orBlock;

  // '(foo && #Noun)' - require all matches on the term
  const andBlock = function (state) {
    const { regs } = state;
    let reg = regs[state.r];

    let skipNum = doAndBlock$1(state);
    if (skipNum) {
      // handle 'not' logic
      if (reg.negative === true) {
        return null // die
      }
      if (state.hasGroup === true) {
        const g = getGroup$2(state, state.t);
        g.length += skipNum;
      }
      // ensure we're at the end
      if (reg.end === true) {
        let end = state.phrase_length - 1;
        if (state.t + state.start_i !== end) {
          return null
        }
      }
      state.t += skipNum;
      // log(`✓ |found-and|`)
      return true
    } else if (!reg.optional) {
      return null //die
    }
    return true
  };
  var doAndBlock = andBlock;

  // '!foo' should match anything that isn't 'foo'
  // if it matches, return false
  const doNegative = function (state) {
    const { regs } = state;
    let reg = regs[state.r];
    let tmpReg = Object.assign({}, reg);
    tmpReg.negative = false; // try removing it
    let foundNeg = matchTerm(state.terms[state.t], tmpReg, state.start_i + state.t, state.phrase_length);
    if (foundNeg === true) {
      return null //bye!
    }
    return true
  };
  var doNegative$1 = doNegative;

  // 'foo? foo' matches are tricky.
  const foundOptional = function (state) {
    const { regs } = state;
    let reg = regs[state.r];
    let term = state.terms[state.t];
    // does the next reg match it too?
    let nextRegMatched = matchTerm(term, regs[state.r + 1], state.start_i + state.t, state.phrase_length);
    if (reg.negative || nextRegMatched) {
      // but does the next reg match the next term??
      // only skip if it doesn't
      let nextTerm = state.terms[state.t + 1];
      if (!nextTerm || !matchTerm(nextTerm, regs[state.r + 1], state.start_i + state.t, state.phrase_length)) {
        state.r += 1;
      }
    }
  };

  var foundOptional$1 = foundOptional;

  // keep 'foo+' or 'foo*' going..
  const greedyMatch = function (state) {
    const { regs, phrase_length } = state;
    let reg = regs[state.r];
    state.t = getGreedy(state, regs[state.r + 1]);
    if (state.t === null) {
      return null //greedy was too short
    }
    // foo{2,4} - has a greed-minimum
    if (reg.min && reg.min > state.t) {
      return null //greedy was too short
    }
    // 'foo+$' - if also an end-anchor, ensure we really reached the end
    if (reg.end === true && state.start_i + state.t !== phrase_length) {
      return null //greedy didn't reach the end
    }
    return true
  };
  var greedyMatch$1 = greedyMatch;

  // for: ['we', 'have']
  // a match for "we have" should work as normal
  // but matching "we've" should skip over implict terms
  const contractionSkip = function (state) {
    let term = state.terms[state.t];
    let reg = state.regs[state.r];
    // did we match the first part of a contraction?
    if (term.implicit && state.terms[state.t + 1]) {
      let nextTerm = state.terms[state.t + 1];
      // ensure next word is implicit
      if (!nextTerm.implicit) {
        return
      }
      // we matched "we've" - skip-over [we, have]
      if (reg.word === term.normal) {
        state.t += 1;
      }
      // also skip for @hasContraction
      if (reg.method === 'hasContraction') {
        state.t += 1;
      }
    }
  };
  var contractionSkip$1 = contractionSkip;

  // '[foo]' should also be logged as a group
  const setGroup = function (state, startAt) {
    let reg = state.regs[state.r];
    // Get or create capture group
    const g = getGroup$2(state, startAt);
    // Update group - add greedy or increment length
    if (state.t > 1 && reg.greedy) {
      g.length += state.t - startAt;
    } else {
      g.length++;
    }
  };

  // when a reg matches a term
  const simpleMatch = function (state) {
    const { regs } = state;
    let reg = regs[state.r];
    let term = state.terms[state.t];
    let startAt = state.t;
    // if it's a negative optional match... :0
    if (reg.optional && regs[state.r + 1] && reg.negative) {
      return true
    }
    // okay, it was a match, but if it's optional too,
    // we should check the next reg too, to skip it?
    if (reg.optional && regs[state.r + 1]) {
      foundOptional$1(state);
    }
    // Contraction skip:
    // did we match the first part of a contraction?
    if (term.implicit && state.terms[state.t + 1]) {
      contractionSkip$1(state);
    }
    //advance to the next term!
    state.t += 1;
    //check any ending '$' flags
    //if this isn't the last term, refuse the match
    if (reg.end === true && state.t !== state.terms.length && reg.greedy !== true) {
      return null //die
    }
    // keep 'foo+' going...
    if (reg.greedy === true) {
      let alive = greedyMatch$1(state);
      if (!alive) {
        return null
      }
    }
    // log '[foo]' as a group
    if (state.hasGroup === true) {
      setGroup(state, startAt);
    }
    return true
  };
  var simpleMatch$1 = simpleMatch;

  // i formally apologize for how complicated this is.

  /** 
   * try a sequence of match tokens ('regs') 
   * on a sequence of terms, 
   * starting at this certain term.
   */
  const tryHere = function (terms, regs, start_i, phrase_length) {
    if (terms.length === 0 || regs.length === 0) {
      return null
    }
    // all the variables that matter
    let state = {
      t: 0,
      terms: terms,
      r: 0,
      regs: regs,
      groups: {},
      start_i: start_i,
      phrase_length: phrase_length,
      inGroup: null,
    };

    // we must satisfy every token in 'regs'
    // if we get to the end, we have a match.
    for (; state.r < regs.length; state.r += 1) {
      let reg = regs[state.r];
      // Check if this reg has a named capture group
      state.hasGroup = Boolean(reg.group);
      // Reuse previous capture group if same
      if (state.hasGroup === true) {
        state.inGroup = reg.group;
      } else {
        state.inGroup = null;
      }
      //have we run-out of terms?
      if (!state.terms[state.t]) {
        //are all remaining regs optional or negative?
        const alive = regs.slice(state.r).some(remain => !remain.optional);
        if (alive === false) {
          break //done!
        }
        return null // die
      }
      // support 'unspecific greedy' .* properly
      if (reg.anything === true && reg.greedy === true) {
        let alive = doAstrix$1(state);
        if (!alive) {
          return null
        }
        continue
      }
      // slow-OR - multi-word OR (a|b|foo bar)
      if (reg.choices !== undefined && reg.operator === 'or') {
        let alive = doOrBlock(state);
        if (!alive) {
          return null
        }
        continue
      }
      // slow-AND - multi-word AND (#Noun && foo) blocks
      if (reg.choices !== undefined && reg.operator === 'and') {
        let alive = doAndBlock(state);
        if (!alive) {
          return null
        }
        continue
      }
      // support '.' as any-single
      if (reg.anything === true) {
        let alive = simpleMatch$1(state);
        if (!alive) {
          return null
        }
        continue
      }
      // support 'foo*$' until the end
      if (isEndGreedy(reg, state) === true) {
        let alive = simpleMatch$1(state);
        if (!alive) {
          return null
        }
        continue
      }
      // ok, finally test the term-reg
      let hasMatch = matchTerm(state.terms[state.t], reg, state.start_i + state.t, state.phrase_length);
      if (hasMatch === true) {
        let alive = simpleMatch$1(state);
        if (!alive) {
          return null
        }
        continue
      }
      // ok, it doesn't match - but maybe it wasn't *supposed* to?
      if (reg.negative) {
        let alive = doNegative$1(state);
        if (!alive) {
          return null
        }
      }
      //ok who cares, keep going
      if (reg.optional === true) {
        continue
      }

      // finally, we die
      return null
    }
    //return our results, as pointers
    let pntr = [null, start_i, state.t + start_i];
    if (pntr[1] === pntr[2]) {
      return null //found 0 terms
    }
    let groups = {};
    Object.keys(state.groups).forEach(k => {
      let o = state.groups[k];
      let start = start_i + o.start;
      groups[k] = [null, start, start + o.length];
    });
    return { pointer: pntr, groups: groups }
  };
  var fromHere = tryHere;

  // support returning a subset of a match
  // like 'foo [bar] baz' -> bar
  const getGroup = function (res, group) {
    let ptrs = [];
    let byGroup = {};
    if (res.length === 0) {
      return { ptrs, byGroup }
    }
    if (typeof group === 'number') {
      group = String(group);
    }
    if (group) {
      res.forEach(r => {
        if (r.groups[group]) {
          ptrs.push(r.groups[group]);
        }
      });
    } else {
      res.forEach(r => {
        ptrs.push(r.pointer);
        Object.keys(r.groups).forEach(k => {
          byGroup[k] = byGroup[k] || [];
          byGroup[k].push(r.groups[k]);
        });
      });
    }
    return { ptrs, byGroup }
  };
  var getGroup$1 = getGroup;

  // make proper pointers
  const addSentence = function (res, n) {
    res.pointer[0] = n;
    Object.keys(res.groups).forEach(k => {
      res.groups[k][0] = n;
    });
    return res
  };

  const handleStart = function (terms, regs, n) {
    let res = fromHere(terms, regs, 0, terms.length);
    if (res) {
      res = addSentence(res, n);
      return res //getGroup([res], group)
    }
    return null
  };

  // ok, here we go.
  const runMatch$2 = function (docs, todo, cache) {
    cache = cache || [];
    let { regs, group, justOne } = todo;
    let results = [];
    if (!regs || regs.length === 0) {
      return { ptrs: [], byGroup: {} }
    }

    const minLength = regs.filter(r => r.optional !== true && r.negative !== true).length;
    docs: for (let n = 0; n < docs.length; n += 1) {
      let terms = docs[n];
      // let index = terms[0].index || []
      // can we skip this sentence?
      if (cache[n] && failFast$1(regs, cache[n])) {
        continue
      }
      // ^start regs only run once, per phrase
      if (regs[0].start === true) {
        let foundStart = handleStart(terms, regs, n);
        if (foundStart) {
          results.push(foundStart);
        }
        continue
      }
      //ok, try starting the match now from every term
      for (let i = 0; i < terms.length; i += 1) {
        let slice = terms.slice(i);
        // ensure it's long-enough
        if (slice.length < minLength) {
          break
        }
        let res = fromHere(slice, regs, i, terms.length);
        // did we find a result?
        if (res) {
          // res = addSentence(res, index[0])
          res = addSentence(res, n);
          results.push(res);
          // should we stop here?
          if (justOne === true) {
            break docs
          }
          // skip ahead, over these results
          let end = res.pointer[2];
          if (Math.abs(end - 1) > i) {
            i = Math.abs(end - 1);
          }
        }
      }
    }
    // ensure any end-results ($) match until the last term
    if (regs[regs.length - 1].end === true) {
      results = results.filter(res => {
        let n = res.pointer[0];
        return docs[n].length === res.pointer[2]
      });
    }
    // grab the requested group
    results = getGroup$1(results, group);
    // add ids to pointers
    results.ptrs.forEach(ptr => {
      let [n, start, end] = ptr;
      ptr[3] = docs[n][start].id;//start-id
      ptr[4] = docs[n][end - 1].id;//end-id
    });
    return results
  };

  var match$1 = runMatch$2;

  const methods$b = {
    one: {
      termMethods,
      parseMatch,
      match: match$1,
    },
  };

  var methods$c = methods$b;

  var lib$3 = {
    /** pre-parse any match statements */
    parseMatch: function (str, opts) {
      const world = this.world();
      let killUnicode = world.methods.one.killUnicode;
      if (killUnicode) {
        str = killUnicode(str, world);
      }
      return world.methods.one.parseMatch(str, opts, world)
    }
  };

  var match = {
    api: api$9,
    methods: methods$c,
    lib: lib$3,
  };

  const isClass = /^\../;
  const isId = /^#./;

  const escapeXml = (str) => {
    str = str.replace(/&/g, '&amp;');
    str = str.replace(/</g, '&lt;');
    str = str.replace(/>/g, '&gt;');
    str = str.replace(/"/g, '&quot;');
    str = str.replace(/'/g, '&apos;');
    return str
  };

  // interpret .class, #id, tagName
  const toTag = function (k) {
    let start = '';
    let end = '</span>';
    k = escapeXml(k);
    if (isClass.test(k)) {
      start = `<span class="${k.replace(/^\./, '')}"`;
    } else if (isId.test(k)) {
      start = `<span id="${k.replace(/^#/, '')}"`;
    } else {
      start = `<${k}`;
      end = `</${k}>`;
    }
    start += '>';
    return { start, end }
  };

  const getIndex = function (doc, obj) {
    let starts = {};
    let ends = {};
    Object.keys(obj).forEach(k => {
      let res = obj[k];
      let tag = toTag(k);
      if (typeof res === 'string') {
        res = doc.match(res);
      }
      res.docs.forEach(terms => {
        // don't highlight implicit terms
        if (terms.every(t => t.implicit)) {
          return
        }
        let a = terms[0].id;
        starts[a] = starts[a] || [];
        starts[a].push(tag.start);
        let b = terms[terms.length - 1].id;
        ends[b] = ends[b] || [];
        ends[b].push(tag.end);
      });
    });
    return { starts, ends }
  };

  const html = function (obj) {
    // index ids to highlight
    let { starts, ends } = getIndex(this, obj);
    // create the text output
    let out = '';
    this.docs.forEach(terms => {
      for (let i = 0; i < terms.length; i += 1) {
        let t = terms[i];
        // do a span tag
        if (starts.hasOwnProperty(t.id)) {
          out += starts[t.id].join('');
        }
        out += t.pre || '' + t.text || '';
        if (ends.hasOwnProperty(t.id)) {
          out += ends[t.id].join('');
        }
        out += t.post || '';
      }
    });
    return out
  };
  var html$1 = { html };

  const trimEnd = /[,:;)\]*.?~!\u0022\uFF02\u201D\u2019\u00BB\u203A\u2032\u2033\u2034\u301E\u00B4—-]+$/;
  const trimStart =
    /^[(['"*~\uFF02\u201C\u2018\u201F\u201B\u201E\u2E42\u201A\u00AB\u2039\u2035\u2036\u2037\u301D\u0060\u301F]+/;

  const punctToKill = /[,:;)('"\u201D\]]/;
  const isHyphen = /^[-–—]$/;
  const hasSpace = / /;

  const textFromTerms = function (terms, opts, keepSpace = true) {
    let txt = '';
    terms.forEach((t) => {
      let pre = t.pre || '';
      let post = t.post || '';
      if (opts.punctuation === 'some') {
        pre = pre.replace(trimStart, '');
        // replace a hyphen with a space
        if (isHyphen.test(post)) {
          post = ' ';
        }
        post = post.replace(punctToKill, '');
        // cleanup exclamations
        post = post.replace(/\?!+/, '?');
        post = post.replace(/!+/, '!');
        post = post.replace(/\?+/, '?');
        // kill elipses
        post = post.replace(/\.{2,}/, '');
        // kill abbreviation periods
        if (t.tags.has('Abbreviation')) {
          post = post.replace(/\./, '');
        }
      }
      if (opts.whitespace === 'some') {
        pre = pre.replace(/\s/, ''); //remove pre-whitespace
        post = post.replace(/\s+/, ' '); //replace post-whitespace with a space
      }
      if (!opts.keepPunct) {
        pre = pre.replace(trimStart, '');
        if (post === '-') {
          post = ' ';
        } else {
          post = post.replace(trimEnd, '');
        }
      }
      // grab the correct word format
      let word = t[opts.form || 'text'] || t.normal || '';
      if (opts.form === 'implicit') {
        word = t.implicit || t.text;
      }
      if (opts.form === 'root' && t.implicit) {
        word = t.root || t.implicit || t.normal;
      }
      // add an implicit space, for contractions
      if ((opts.form === 'machine' || opts.form === 'implicit' || opts.form === 'root') && t.implicit) {
        if (!post || !hasSpace.test(post)) {
          post += ' ';
        }
      }
      txt += pre + word + post;
    });
    if (keepSpace === false) {
      txt = txt.trim();
    }
    if (opts.lowerCase === true) {
      txt = txt.toLowerCase();
    }
    return txt
  };

  const textFromDoc = function (docs, opts) {
    let text = '';
    if (!docs || !docs[0] || !docs[0][0]) {
      return text
    }
    for (let i = 0; i < docs.length; i += 1) {
      // middle
      text += textFromTerms(docs[i], opts, true);
    }
    if (!opts.keepSpace) {
      text = text.trim();
    }
    if (opts.keepPunct === false) {
      // don't remove ':)' etc
      if (!docs[0][0].tags.has('Emoticon')) {
        text = text.replace(trimStart, '');
      }
      let last = docs[docs.length - 1];
      if (!last[last.length - 1].tags.has('Emoticon')) {
        text = text.replace(trimEnd, '');
      }
    }
    if (opts.cleanWhitespace === true) {
      text = text.trim();
    }
    return text
  };

  const fmts = {
    text: {
      form: 'text',
    },
    normal: {
      whitespace: 'some',
      punctuation: 'some',
      case: 'some',
      unicode: 'some',
      form: 'normal',
    },
    machine: {
      whitespace: 'some',
      punctuation: 'some',
      case: 'none',
      unicode: 'some',
      form: 'machine',
    },
    root: {
      whitespace: 'some',
      punctuation: 'some',
      case: 'some',
      unicode: 'some',
      form: 'root',
    },
    implicit: {
      form: 'implicit',
    }
  };
  fmts.clean = fmts.normal;
  fmts.reduced = fmts.root;
  var fmts$1 = fmts;

  const defaults$1 = {
    text: true,
    terms: true,
  };

  let opts = { case: 'none', unicode: 'some', form: 'machine', punctuation: 'some' };

  const merge = function (a, b) {
    return Object.assign({}, a, b)
  };

  const fns$1 = {
    text: (terms) => {
      return textFromTerms(terms, { keepPunct: true }, false)
    },
    normal: (terms) => textFromTerms(terms, merge(fmts$1.normal, { keepPunct: true }), false),
    implicit: (terms) => textFromTerms(terms, merge(fmts$1.implicit, { keepPunct: true }), false),

    machine: (terms) => textFromTerms(terms, opts, false),
    root: (terms) => textFromTerms(terms, merge(opts, { form: 'root' }), false),

    offset: (terms) => {
      let len = fns$1.text(terms).length;
      return {
        index: terms[0].offset.index,
        start: terms[0].offset.start,
        length: len,
      }
    },
    terms: (terms) => {
      return terms.map(t => {
        let term = Object.assign({}, t);
        term.tags = Array.from(t.tags);
        return term
      })
    },
    confidence: (_terms, view, i) => view.eq(i).confidence(),
    syllables: (_terms, view, i) => view.eq(i).syllables(),
    sentence: (_terms, view, i) => view.eq(i).fullSentence().text(),
    dirty: (terms) => terms.some(t => t.dirty === true)
  };
  fns$1.sentences = fns$1.sentence;
  fns$1.clean = fns$1.normal;
  fns$1.reduced = fns$1.root;

  const toJSON = function (view, option) {
    option = option || {};
    if (typeof option === 'string') {
      option = {};
    }
    option = Object.assign({}, defaults$1, option);
    // run any necessary upfront steps
    if (option.offset) {
      view.compute('offset');
    }
    return view.docs.map((terms, i) => {
      let res = {};
      Object.keys(option).forEach(k => {
        if (option[k] && fns$1[k]) {
          res[k] = fns$1[k](terms, view, i);
        }
      });
      return res
    })
  };


  const methods$a = {
    /** return data */
    json: function (n) {
      let res = toJSON(this, n);
      if (typeof n === 'number') {
        return res[n]
      }
      return res
    },
  };
  methods$a.data = methods$a.json;
  var json = methods$a;

  /* eslint-disable no-console */
  const logClientSide = function (view) {
    console.log('%c -=-=- ', 'background-color:#6699cc;');
    view.forEach(m => {
      console.groupCollapsed(m.text());
      let terms = m.docs[0];
      let out = terms.map(t => {
        let text = t.text || '-';
        if (t.implicit) {
          text = '[' + t.implicit + ']';
        }
        let tags = '[' + Array.from(t.tags).join(', ') + ']';
        return { text, tags }
      });
      console.table(out, ['text', 'tags']);
      console.groupEnd();
    });
  };
  var logClientSide$1 = logClientSide;

  // https://stackoverflow.com/questions/9781218/how-to-change-node-jss-console-font-color
  const reset = '\x1b[0m';

  //cheaper than requiring chalk
  const cli = {
    green: str => '\x1b[32m' + str + reset,
    red: str => '\x1b[31m' + str + reset,
    blue: str => '\x1b[34m' + str + reset,
    magenta: str => '\x1b[35m' + str + reset,
    cyan: str => '\x1b[36m' + str + reset,
    yellow: str => '\x1b[33m' + str + reset,
    black: str => '\x1b[30m' + str + reset,
    dim: str => '\x1b[2m' + str + reset,
    i: str => '\x1b[3m' + str + reset,
  };
  var cli$1 = cli;

  /* eslint-disable no-console */

  const tagString = function (tags, model) {
    if (model.one.tagSet) {
      tags = tags.map(tag => {
        if (!model.one.tagSet.hasOwnProperty(tag)) {
          return tag
        }
        const c = model.one.tagSet[tag].color || 'blue';
        return cli$1[c](tag)
      });
    }
    return tags.join(', ')
  };

  const showTags = function (view) {
    let { docs, model } = view;
    if (docs.length === 0) {
      console.log(cli$1.blue('\n     ──────'));
    }
    docs.forEach(terms => {
      console.log(cli$1.blue('\n  ┌─────────'));
      terms.forEach(t => {
        let tags = [...(t.tags || [])];
        let text = t.text || '-';
        if (t.sense) {
          text = '{' + t.sense + '}';
        }
        if (t.implicit) {
          text = '[' + t.implicit + ']';
        }
        text = cli$1.yellow(text);
        let word = "'" + text + "'";
        word = word.padEnd(18);
        let str = cli$1.blue('  │ ') + cli$1.i(word) + '  - ' + tagString(tags, model);
        console.log(str);
      });
    });
  };
  var showTags$1 = showTags;

  /* eslint-disable no-console */

  const showChunks = function (view) {
    let { docs } = view;
    console.log('');
    docs.forEach(terms => {
      let out = [];
      terms.forEach(term => {
        if (term.chunk === 'Noun') {
          out.push(cli$1.blue(term.implicit || term.normal));
        } else if (term.chunk === 'Verb') {
          out.push(cli$1.green(term.implicit || term.normal));
        } else if (term.chunk === 'Adjective') {
          out.push(cli$1.yellow(term.implicit || term.normal));
        } else if (term.chunk === 'Pivot') {
          out.push(cli$1.red(term.implicit || term.normal));
        } else {
          out.push(term.implicit || term.normal);
        }
      });
      console.log(out.join(' '), '\n');
    });
  };
  var showChunks$1 = showChunks;

  const split = (txt, offset, index) => {
    let buff = index * 9; //there are 9 new chars addded to each highlight
    let start = offset.start + buff;
    let end = start + offset.length;
    let pre = txt.substring(0, start);
    let mid = txt.substring(start, end);
    let post = txt.substring(end, txt.length);
    return [pre, mid, post]
  };

  const spliceIn = function (txt, offset, index) {
    let parts = split(txt, offset, index);
    return `${parts[0]}${cli$1.blue(parts[1])}${parts[2]}`
  };

  const showHighlight = function (doc) {
    if (!doc.found) {
      return
    }
    let bySentence = {};
    doc.fullPointer.forEach(ptr => {
      bySentence[ptr[0]] = bySentence[ptr[0]] || [];
      bySentence[ptr[0]].push(ptr);
    });
    Object.keys(bySentence).forEach(k => {
      let full = doc.update([[Number(k)]]);
      let txt = full.text();
      let matches = doc.update(bySentence[k]);
      let json = matches.json({ offset: true });
      json.forEach((obj, i) => {
        txt = spliceIn(txt, obj.offset, i);
      });
      console.log(txt); // eslint-disable-line
    });
  };
  var showHighlight$1 = showHighlight;

  /* eslint-disable no-console */

  function isClientSide() {
    return typeof window !== 'undefined' && window.document
  }
  //output some helpful stuff to the console
  const debug = function (opts = {}) {
    let view = this;
    if (typeof opts === 'string') {
      let tmp = {};
      tmp[opts] = true; //allow string input
      opts = tmp;
    }
    if (isClientSide()) {
      logClientSide$1(view);
      return view
    }
    if (opts.tags !== false) {
      showTags$1(view);
      console.log('\n');
    }
    // output chunk-view, too
    if (opts.chunks === true) {
      showChunks$1(view);
      console.log('\n');
    }
    // highlight match in sentence
    if (opts.highlight === true) {
      showHighlight$1(view);
      console.log('\n');
    }
    return view
  };
  var debug$1 = debug;

  const toText$2 = function (term) {
    let pre = term.pre || '';
    let post = term.post || '';
    return pre + term.text + post
  };

  const findStarts = function (doc, obj) {
    let starts = {};
    Object.keys(obj).forEach(reg => {
      let m = doc.match(reg);
      m.fullPointer.forEach(a => {
        starts[a[3]] = { fn: obj[reg], end: a[2] };
      });
    });
    return starts
  };

  const wrap = function (doc, obj) {
    // index ids to highlight
    let starts = findStarts(doc, obj);
    let text = '';
    doc.docs.forEach((terms, n) => {
      for (let i = 0; i < terms.length; i += 1) {
        let t = terms[i];
        // do a span tag
        if (starts.hasOwnProperty(t.id)) {
          let { fn, end } = starts[t.id];
          let m = doc.update([[n, i, end]]);
          text += fn(m);
          i = end - 1;
          text += terms[i].post || '';
        } else {
          text += toText$2(t);
        }
      }
    });
    return text
  };
  var wrap$1 = wrap;

  const isObject$2 = val => {
    return Object.prototype.toString.call(val) === '[object Object]'
  };

  // sort by frequency
  const topk = function (arr) {
    let obj = {};
    arr.forEach(a => {
      obj[a] = obj[a] || 0;
      obj[a] += 1;
    });
    let res = Object.keys(obj).map(k => {
      return { normal: k, count: obj[k] }
    });
    return res.sort((a, b) => (a.count > b.count ? -1 : 0))
  };

  /** some named output formats */
  const out = function (method) {
    // support custom outputs
    if (isObject$2(method)) {
      return wrap$1(this, method)
    }
    // text out formats
    if (method === 'text') {
      return this.text()
    }
    if (method === 'normal') {
      return this.text('normal')
    }
    if (method === 'machine' || method === 'reduced') {
      return this.text('machine')
    }

    // json data formats
    if (method === 'json') {
      return this.json()
    }
    if (method === 'offset' || method === 'offsets') {
      this.compute('offset');
      return this.json({ offset: true })
    }
    if (method === 'array') {
      let arr = this.docs.map(terms => {
        return terms
          .reduce((str, t) => {
            return str + t.pre + t.text + t.post
          }, '')
          .trim()
      });
      return arr.filter(str => str)
    }
    // return terms sorted by frequency
    if (method === 'freq' || method === 'frequency' || method === 'topk') {
      return topk(this.json({ normal: true }).map(o => o.normal))
    }

    // some handy ad-hoc outputs
    if (method === 'terms') {
      let list = [];
      this.docs.forEach(s => {
        let terms = s.terms.map(t => t.text);
        terms = terms.filter(t => t);
        list = list.concat(terms);
      });
      return list
    }
    if (method === 'tags') {
      return this.docs.map(terms => {
        return terms.reduce((h, t) => {
          h[t.implicit || t.normal] = Array.from(t.tags);
          return h
        }, {})
      })
    }
    if (method === 'debug') {
      return this.debug() //allow
    }
    return this.text()
  };

  const methods$9 = {
    /** */
    debug: debug$1,
    /** */
    out: out,
  };

  var out$1 = methods$9;

  const isObject$1 = val => {
    return Object.prototype.toString.call(val) === '[object Object]'
  };

  var text = {
    /** */
    text: function (fmt) {
      let opts = {
        keepSpace: true,
        keepPunct: true,
      };
      if (fmt && typeof fmt === 'string' && fmts$1.hasOwnProperty(fmt)) {
        opts = Object.assign({}, fmts$1[fmt]);
      } else if (fmt && isObject$1(fmt)) {
        opts = Object.assign({}, fmt, opts);//todo: fixme
      }
      if (this.pointer) {
        opts.keepSpace = false;
        let ptr = this.pointer[0];
        if (ptr && ptr[1]) {
          opts.keepPunct = false;
        } else {
          opts.keepPunct = true;
        }
      } else {
        opts.keepPunct = true;
      }
      return textFromDoc(this.docs, opts)
    },
  };

  const methods$8 = Object.assign({}, out$1, text, json, html$1);

  const addAPI$1 = function (View) {
    Object.assign(View.prototype, methods$8);
  };
  var api$8 = addAPI$1;

  var output = {
    api: api$8,
  };

  // do the pointers intersect?
  const doesOverlap = function (a, b) {
    if (a[0] !== b[0]) {
      return false
    }
    let [, startA, endA] = a;
    let [, startB, endB] = b;
    // [a,a,a,-,-,-,]
    // [-,-,b,b,b,-,]
    if (startA <= startB && endA > startB) {
      return true
    }
    // [-,-,-,a,a,-,]
    // [-,-,b,b,b,-,]
    if (startB <= startA && endB > startA) {
      return true
    }
    return false
  };

  // get widest min/max
  const getExtent = function (ptrs) {
    let min = ptrs[0][1];
    let max = ptrs[0][2];
    ptrs.forEach(ptr => {
      if (ptr[1] < min) {
        min = ptr[1];
      }
      if (ptr[2] > max) {
        max = ptr[2];
      }
    });
    return [ptrs[0][0], min, max]
  };

  // collect pointers by sentence number
  const indexN = function (ptrs) {
    let byN = {};
    ptrs.forEach(ref => {
      byN[ref[0]] = byN[ref[0]] || [];
      byN[ref[0]].push(ref);
    });
    return byN
  };

  // remove exact duplicates
  const uniquePtrs = function (arr) {
    let obj = {};
    for (let i = 0; i < arr.length; i += 1) {
      obj[arr[i].join(',')] = arr[i];
    }
    return Object.values(obj)
  };

  // a before b
  // console.log(doesOverlap([0, 0, 4], [0, 2, 5]))
  // // b before a
  // console.log(doesOverlap([0, 3, 4], [0, 1, 5]))
  // // disjoint
  // console.log(doesOverlap([0, 0, 3], [0, 4, 5]))
  // neighbours
  // console.log(doesOverlap([0, 1, 3], [0, 3, 5]))
  // console.log(doesOverlap([0, 3, 5], [0, 1, 3]))

  // console.log(
  //   getExtent([
  //     [0, 3, 4],
  //     [0, 4, 5],
  //     [0, 1, 2],
  //   ])
  // )

  // split a pointer, by match pointer
  const pivotBy = function (full, m) {
    let [n, start] = full;
    let mStart = m[1];
    let mEnd = m[2];
    let res = {};
    // is there space before the match?
    if (start < mStart) {
      let end = mStart < full[2] ? mStart : full[2]; // find closest end-point
      res.before = [n, start, end]; //before segment
    }
    res.match = m;
    // is there space after the match?
    if (full[2] > mEnd) {
      res.after = [n, mEnd, full[2]]; //after segment
    }
    return res
  };

  const doesMatch = function (full, m) {
    return full[1] <= m[1] && m[2] <= full[2]
  };

  const splitAll = function (full, m) {
    let byN = indexN(m);
    let res = [];
    full.forEach(ptr => {
      let [n] = ptr;
      let matches = byN[n] || [];
      matches = matches.filter(p => doesMatch(ptr, p));
      if (matches.length === 0) {
        res.push({ passthrough: ptr });
        return
      }
      // ensure matches are in-order
      matches = matches.sort((a, b) => a[1] - b[1]);
      // start splitting our left-to-right
      let carry = ptr;
      matches.forEach((p, i) => {
        let found = pivotBy(carry, p);
        // last one
        if (!matches[i + 1]) {
          res.push(found);
        } else {
          res.push({ before: found.before, match: found.match });
          if (found.after) {
            carry = found.after;
          }
        }
      });
    });
    return res
  };

  var splitAll$1 = splitAll;

  const max$1 = 4;

  // sweep-around looking for our start term uuid
  const blindSweep = function (id, doc, n) {
    for (let i = 0; i < max$1; i += 1) {
      // look up a sentence
      if (doc[n - i]) {
        let index = doc[n - i].findIndex(term => term.id === id);
        if (index !== -1) {
          return [n - i, index]
        }
      }
      // look down a sentence
      if (doc[n + i]) {
        let index = doc[n + i].findIndex(term => term.id === id);
        if (index !== -1) {
          return [n + i, index]
        }
      }
    }
    return null
  };

  const repairEnding = function (ptr, document) {
    let [n, start, , , endId] = ptr;
    let terms = document[n];
    // look for end-id
    let newEnd = terms.findIndex(t => t.id === endId);
    if (newEnd === -1) {
      // if end-term wasn't found, so go all the way to the end
      ptr[2] = document[n].length;
      ptr[4] = terms.length ? terms[terms.length - 1].id : null;
    } else {
      ptr[2] = newEnd; // repair ending pointer
    }
    return document[n].slice(start, ptr[2] + 1)
  };

  /** return a subset of the document, from a pointer */
  const getDoc$1 = function (ptrs, document) {
    let doc = [];
    ptrs.forEach((ptr, i) => {
      if (!ptr) {
        return
      }
      let [n, start, end, id, endId] = ptr; //parsePointer(ptr)
      let terms = document[n] || [];
      if (start === undefined) {
        start = 0;
      }
      if (end === undefined) {
        end = terms.length;
      }
      if (id && (!terms[start] || terms[start].id !== id)) {
        // console.log('  repairing pointer...')
        let wild = blindSweep(id, document, n);
        if (wild !== null) {
          let len = end - start;
          terms = document[wild[0]].slice(wild[1], wild[1] + len);
          // actually change the pointer
          let startId = terms[0] ? terms[0].id : null;
          ptrs[i] = [wild[0], wild[1], wild[1] + len, startId];
        }
      } else {
        terms = terms.slice(start, end);
      }
      if (terms.length === 0) {
        return
      }
      if (start === end) {
        return
      }
      // test end-id, if it exists
      if (endId && terms[terms.length - 1].id !== endId) {
        terms = repairEnding(ptr, document);
      }
      // otherwise, looks good!
      doc.push(terms);
    });
    doc = doc.filter(a => a.length > 0);
    return doc
  };
  var getDoc$2 = getDoc$1;

  // flat list of terms from nested document
  const termList = function (docs) {
    let arr = [];
    for (let i = 0; i < docs.length; i += 1) {
      for (let t = 0; t < docs[i].length; t += 1) {
        arr.push(docs[i][t]);
      }
    }
    return arr
  };

  var methods$7 = {
    one: {
      termList,
      getDoc: getDoc$2,
      pointer: {
        indexN,
        splitAll: splitAll$1,
      }
    },
  };

  // a union is a + b, minus duplicates
  const getUnion = function (a, b) {
    let both = a.concat(b);
    let byN = indexN(both);
    let res = [];
    both.forEach(ptr => {
      let [n] = ptr;
      if (byN[n].length === 1) {
        // we're alone on this sentence, so we're good
        res.push(ptr);
        return
      }
      // there may be overlaps
      let hmm = byN[n].filter(m => doesOverlap(ptr, m));
      hmm.push(ptr);
      let range = getExtent(hmm);
      res.push(range);
    });
    res = uniquePtrs(res);
    return res
  };
  var getUnion$1 = getUnion;

  // two disjoint
  // console.log(getUnion([[1, 3, 4]], [[0, 1, 2]]))
  // two disjoint
  // console.log(getUnion([[0, 3, 4]], [[0, 1, 2]]))
  // overlap-plus
  // console.log(getUnion([[0, 1, 4]], [[0, 2, 6]]))
  // overlap
  // console.log(getUnion([[0, 1, 4]], [[0, 2, 3]]))
  // neighbours
  // console.log(getUnion([[0, 1, 3]], [[0, 3, 5]]))

  const subtract = function (refs, not) {
    let res = [];
    let found = splitAll$1(refs, not);
    found.forEach(o => {
      if (o.passthrough) {
        res.push(o.passthrough);
      }
      if (o.before) {
        res.push(o.before);
      }
      if (o.after) {
        res.push(o.after);
      }
    });
    return res
  };
  var getDifference = subtract;

  // console.log(subtract([[0, 0, 2]], [[0, 0, 1]]))
  // console.log(subtract([[0, 0, 2]], [[0, 1, 2]]))

  // [a,a,a,a,-,-,]
  // [-,-,b,b,b,-,]
  // [-,-,x,x,-,-,]
  const intersection = function (a, b) {
    // find the latest-start
    let start = a[1] < b[1] ? b[1] : a[1];
    // find the earliest-end
    let end = a[2] > b[2] ? b[2] : a[2];
    // does it form a valid pointer?
    if (start < end) {
      return [a[0], start, end]
    }
    return null
  };

  const getIntersection = function (a, b) {
    let byN = indexN(b);
    let res = [];
    a.forEach(ptr => {
      let hmm = byN[ptr[0]] || [];
      hmm = hmm.filter(p => doesOverlap(ptr, p));
      // no sentence-pairs, so no intersection
      if (hmm.length === 0) {
        return
      }
      hmm.forEach(h => {
        let overlap = intersection(ptr, h);
        if (overlap) {
          res.push(overlap);
        }
      });
    });
    return res
  };
  var getIntersection$1 = getIntersection;

  // console.log(getIntersection([[0, 1, 3]], [[0, 2, 4]]))

  const isArray$4 = function (arr) {
    return Object.prototype.toString.call(arr) === '[object Array]'
  };

  const getDoc = (m, view) => {
    if (typeof m === 'string' || isArray$4(m)) {
      return view.match(m)
    }
    if (!m) {
      return view.none()
    }
    // support pre-parsed reg object
    return m
  };

  // 'harden' our json pointers, again
  const addIds = function (ptrs, docs) {
    return ptrs.map(ptr => {
      let [n, start] = ptr;
      if (docs[n] && docs[n][start]) {
        ptr[3] = docs[n][start].id;
      }
      return ptr
    })
  };

  const methods$6 = {};

  // all parts, minus duplicates
  methods$6.union = function (m) {
    m = getDoc(m, this);
    let ptrs = getUnion$1(this.fullPointer, m.fullPointer);
    ptrs = addIds(ptrs, this.document);
    return this.toView(ptrs)
  };
  methods$6.and = methods$6.union;

  // only parts they both have
  methods$6.intersection = function (m) {
    m = getDoc(m, this);
    let ptrs = getIntersection$1(this.fullPointer, m.fullPointer);
    ptrs = addIds(ptrs, this.document);
    return this.toView(ptrs)
  };

  // only parts of a that b does not have
  methods$6.not = function (m) {
    m = getDoc(m, this);
    let ptrs = getDifference(this.fullPointer, m.fullPointer);
    ptrs = addIds(ptrs, this.document);
    return this.toView(ptrs)
  };
  methods$6.difference = methods$6.not;

  // get opposite of a
  methods$6.complement = function () {
    let doc = this.all();
    let ptrs = getDifference(doc.fullPointer, this.fullPointer);
    ptrs = addIds(ptrs, this.document);
    return this.toView(ptrs)
  };

  // remove overlaps
  methods$6.settle = function () {
    let ptrs = this.fullPointer;
    ptrs.forEach(ptr => {
      ptrs = getUnion$1(ptrs, [ptr]);
    });
    ptrs = addIds(ptrs, this.document);
    return this.update(ptrs)
  };


  const addAPI = function (View) {
    // add set/intersection/union
    Object.assign(View.prototype, methods$6);
  };
  var api$7 = addAPI;

  var pointers = {
    methods: methods$7,
    api: api$7,
  };

  var lib$2 = {
    // compile a list of matches into a match-net
    buildNet: function (matches) {
      const methods = this.methods();
      let { index, always } = methods.one.buildNet(matches, this.world());
      return {
        isNet: true,
        index,
        always
      }
    }
  };

  const api$5 = function (View) {

    /** speedy match a sequence of matches */
    View.prototype.sweep = function (net, opts = {}) {
      const { world, docs } = this;
      const { methods } = world;
      let found = methods.one.bulkMatch(docs, net, this.methods, opts);

      // apply any changes
      if (opts.tagger !== false) {
        methods.one.bulkTagger(found, docs, this.world);
      }
      // fix the pointers
      // collect all found results into a View
      found = found.map(o => {
        let ptr = o.pointer;
        let term = docs[ptr[0]][ptr[1]];
        let len = ptr[2] - ptr[1];
        if (term.index) {
          o.pointer = [
            term.index[0],
            term.index[1],
            ptr[1] + len
          ];
        }
        return o
      });
      let ptrs = found.map(o => o.pointer);
      // cleanup results a bit
      found = found.map(obj => {
        obj.view = this.update([obj.pointer]);
        delete obj.regs;
        delete obj.needs;
        delete obj.pointer;
        delete obj._expanded;
        return obj
      });
      return {
        view: this.update(ptrs),
        found
      }
    };

  };
  var api$6 = api$5;

  const parse$1 = function (matches, world) {
    const parseMatch = world.methods.one.parseMatch;
    matches.forEach(obj => {
      obj.regs = parseMatch(obj.match, {}, world);
      // wrap these ifNo properties into an array
      if (typeof obj.ifNo === 'string') {
        obj.ifNo = [obj.ifNo];
      }
    });
    return matches
  };

  var parse$2 = parse$1;

  // stich an array into another, replacing one element
  function spliceArray(main, index, arrayToInsert) {
    main.splice(index, 1, ...arrayToInsert);
    return main
  }

  // enumerate any OR options
  const getORs = function (reg) {
    if (reg.fastOr) {
      return Array.from(reg.fastOr).map(str => {
        return [{ word: str }]
      })
    }
    return reg.choices
  };

  // try keeping all other properties on the old reg
  const combine = function (obj, reg) {
    let both = Object.assign({}, obj, reg);
    delete both.choices;
    delete both.fastOr;
    delete both.operator;
    return both
  };

  const buildUp = function (matches) {
    let all = [];
    matches.forEach(obj => {
      for (let i = 0; i < obj.regs.length; i += 1) {
        let reg = obj.regs[i];
        // (negative or is un-multipliable) - !(a|b|c)  -> "a" matches !b
        if (reg.operator === 'or' && !reg.negative === true) {
          let more = getORs(reg);
          more.forEach(r => {
            let tmp = Object.assign({}, obj);//clone
            tmp.regs = tmp.regs.slice(0);//clone
            r = r.map(main => combine(obj.regs[i], main));
            tmp.regs = spliceArray(tmp.regs, i, r);
            all.push(tmp);
          });
          return
        }
      }
      all.push(obj);
    });
    // console.dir(all, { depth: 5 })
    return all
  };


  var buildUp$1 = buildUp;

  // extract the clear needs for an individual match token
  const getTokenNeeds = function (reg) {
    // negatives can't be cached
    if (reg.optional === true || reg.negative === true) {
      return null
    }
    if (reg.tag) {
      return '#' + reg.tag
    }
    if (reg.word) {
      return reg.word
    }
    if (reg.switch) {
      return `%${reg.switch}%`
    }
    return null
  };

  // extract the clear needs for each match
  const findNeeds = function (regs) {
    // parse match strings
    let need = new Set();
    regs.forEach(reg => {
      let res = getTokenNeeds(reg);
      if (res) {
        need.add(res);
      } else {
        // support AND (foo && tag)
        if (reg.operator === 'and' && reg.choices) {
          reg.choices.forEach(oneSide => {
            oneSide.forEach(r => {
              let n = getTokenNeeds(r);
              if (n) {
                need.add(n);
              }
            });
          });
        }
      }
    });
    return need
  };

  // produce quick lookups for a list of matches
  const cache$1 = function (matches) {
    matches.forEach(obj => {
      obj.needs = Array.from(findNeeds(obj.regs));
      // get rid of tiny sentences
      obj.minWords = obj.regs.filter(o => !o.optional).length;
    });
    return matches
  };

  var cache$2 = cache$1;

  const groupBy = function (matches) {
    let byGroup = {};
    matches.forEach(obj => {
      obj.needs.forEach(need => {
        byGroup[need] = byGroup[need] || [];
        byGroup[need].push(obj);
      });
    });
    return byGroup
  };

  var group = groupBy;

  // do some indexing on the list of matches
  const compile = function (matches, world) {
    // turn match-syntax into json
    matches = parse$2(matches, world);
    // convert (a|b) to ['a', 'b']
    matches = buildUp$1(matches);
    // matches = buildUp(matches) // run this twice
    // retrieve the needs of each match statement
    matches = cache$2(matches);
    // keep all un-cacheable matches (those with no needs) 
    let always = matches.filter(o => o.needs.length === 0);

    // organize them according to need...
    let byGroup = group(matches);

    // Every sentence has a Noun/Verb,
    // assume any match will be found on another need
    // this is true now,
    // but we should stay careful about this.
    delete byGroup['#Noun'];
    delete byGroup['#Verb'];
    // console.log(matches.filter(o => o.needs.length === 1)) //check!

    return {
      index: byGroup,
      always
    }
  };

  var buildNet = compile;

  // for each cached-sentence, find a list of possible matches
  const matchUp = function (docNeeds, matchGroups) {
    return docNeeds.map(needs => {
      let maybes = [];
      needs.forEach(need => {
        if (matchGroups.hasOwnProperty(need)) {
          maybes = maybes.concat(matchGroups[need]);
        }
      });
      return new Set(maybes)
    })
  };

  var getCandidates = matchUp;

  // filter-down list of maybe-matches
  const localTrim = function (maybeList, docCache) {
    // console.log(maybeList)
    for (let n = 0; n < docCache.length; n += 1) {
      let haves = docCache[n];

      // ensure all stated-needs of the match are met
      maybeList[n] = Array.from(maybeList[n]).filter(obj => {
        return obj.needs.every(need => haves.has(need))
      });
      // ensure nothing matches in our 'ifNo' property
      maybeList[n] = maybeList[n].filter(obj => {
        if (obj.ifNo !== undefined && obj.ifNo.some(no => docCache[n].has(no)) === true) {
          return false
        }
        return true
      });
    }
    return maybeList
  };
  var trimDown = localTrim;

  // finally,
  // actually run these match-statements on the terms
  const runMatch = function (maybeList, document, methods, opts) {
    let results = [];
    for (let n = 0; n < maybeList.length; n += 1) {
      for (let i = 0; i < maybeList[n].length; i += 1) {
        let m = maybeList[n][i];
        // ok, actually do the work.
        let res = methods.one.match([document[n]], m);
        // found something.
        if (res.ptrs.length > 0) {
          // let index=document[n][0].index
          res.ptrs.forEach(ptr => {
            ptr[0] = n; // fix the sentence pointer
            let todo = Object.assign({}, m, { pointer: ptr });
            if (m.unTag !== undefined) {
              todo.unTag = m.unTag;
            }
            results.push(todo);
          });
          //ok cool, can we stop early?
          if (opts.matchOne === true) {
            return [results[0]]
          }
        }
      }
    }
    return results
  };
  var runMatch$1 = runMatch;

  // const counts = {}


  // setInterval(() => {
  //   let res = Object.keys(counts).map(k => [k, counts[k]])
  //   res = res.sort((a, b) => (a[1] > b[1] ? -1 : 0))
  //   console.log(res)
  // }, 5000)

  const tooSmall = function (maybeList, document) {
    return maybeList.map((arr, i) => {
      let termCount = document[i].length;
      arr = arr.filter(o => {
        return termCount >= o.minWords
      });
      return arr
    })
  };

  const sweep$1 = function (document, net, methods, opts = {}) {
    // find suitable matches to attempt, on each sentence
    let docCache = methods.one.cacheDoc(document);
    // collect possible matches for this document
    let maybeList = getCandidates(docCache, net.index);
    // ensure all defined needs are met for each match
    maybeList = trimDown(maybeList, docCache);
    // add unchacheable matches to each sentence's todo-list
    if (net.always.length > 0) {
      maybeList = maybeList.map(arr => arr.concat(net.always));
    }
    // if we don't have enough words
    maybeList = tooSmall(maybeList, document);
    // console.log(maybeList)
    // maybeList.forEach(list => {
    //   list.forEach(o => {
    //     counts[o.match] = counts[o.match] || 0
    //     counts[o.match] += 1
    //   })
    // })
    // now actually run the matches
    let results = runMatch$1(maybeList, document, methods, opts);
    // console.dir(results, { depth: 5 })
    return results
  };
  var bulkMatch = sweep$1;

  const isArray$3 = function (arr) {
    return Object.prototype.toString.call(arr) === '[object Array]'
  };

  const logger = function (todo, document) {
    let [n, start, end] = todo.pointer;
    let terms = document[n];
    let i = start > 4 ? start - 2 : 0;
    let tag = todo.tag || '';
    if (isArray$3(todo.tag)) {
      tag = todo.tag.join(' #');
    }
    // don't show if it's already there
    if (!tag || terms.every(t => t.tags.has(tag))) {
      return
    }
    let reason = todo.reason || todo.match;
    reason = reason ? `|${reason}|` : '';
    let msg = `  ${reason}`.padEnd(20) + ' - ';
    const yellow = str => '\x1b[2m' + str + '\x1b[0m';
    for (; i < terms.length; i += 1) {
      if (i > end + 2) {
        break
      }
      let str = terms[i].machine || terms[i].normal;
      msg += i > start && i < end ? `\x1b[32m${str}\x1b[0m ` : `${yellow(str)} `; // matched terms are green
    }
    msg += '  \x1b[32m→\x1b[0m #' + tag.padEnd(12) + '  ';
    console.log(msg); //eslint-disable-line
  };
  var logger$1 = logger;

  // is this tag consistent with the tags they already have?
  const canBe = function (terms, tag, model) {
    let tagSet = model.one.tagSet;
    if (!tagSet.hasOwnProperty(tag)) {
      return true
    }
    let not = tagSet[tag].not || [];
    for (let i = 0; i < terms.length; i += 1) {
      let term = terms[i];
      for (let k = 0; k < not.length; k += 1) {
        if (term.tags.has(not[k]) === true) {
          return false //found a tag conflict - bail!
        }
      }
    }
    return true
  };
  var canBe$1 = canBe;

  const tagger$2 = function (list, document, world) {
    const { model, methods } = world;
    const { getDoc, setTag, unTag } = methods.one;
    if (list.length === 0) {
      return list
    }
    // some logging for debugging
    const env = typeof process === 'undefined' || !process.env ? self.env || {} : process.env;
    if (env.DEBUG_TAGS) {
      console.log(`\n  \x1b[32m→ ${list.length} corrections:\x1b[0m`); //eslint-disable-line
    }
    return list.map(todo => {
      if (!todo.tag && !todo.chunk) {
        return
      }
      let reason = todo.reason || todo.match;
      if (env.DEBUG_TAGS) {
        logger$1(todo, document);
      }
      let terms = getDoc([todo.pointer], document)[0];
      // handle 'safe' tag
      if (todo.safe === true) {
        // check for conflicting tags
        if (canBe$1(terms, todo.tag, model) === false) {
          return
        }
        // dont tag half of a hyphenated word
        if (terms[terms.length - 1].post === '-') {
          return
        }
      }
      if (todo.tag !== undefined) {
        setTag(terms, todo.tag, world, todo.safe, reason);
        // quick and dirty plural tagger
        if (terms.length === 1 && todo.tag === 'Noun') {
          if (terms[0].text && terms[0].text.match(/..s$/) !== null) {
            setTag(terms, 'Plural', world, todo.safe, 'quick-plural');
          }
        }
      }
      if (todo.unTag !== undefined) {
        unTag(terms, todo.unTag, world, todo.safe, reason);
      }
      // allow setting chunks, too
      if (todo.chunk) {
        terms.forEach(t => t.chunk = todo.chunk);
      }
    })
  };
  var bulkTagger = tagger$2;

  var methods$5 = {
    buildNet,
    bulkMatch,
    bulkTagger
  };

  var sweep = {
    lib: lib$2,
    api: api$6,
    methods: {
      one: methods$5,
    }
  };

  const isMulti = / /;

  const addChunk = function (term, tag) {
    if (tag === 'Noun') {
      term.chunk = tag;
    }
    if (tag === 'Verb') {
      term.chunk = tag;
    }
  };

  const tagTerm = function (term, tag, tagSet, isSafe) {
    // does it already have this tag?
    if (term.tags.has(tag) === true) {
      return null
    }
    // allow this shorthand in multiple-tag strings
    if (tag === '.') {
      return null
    }
    // for known tags, do logical dependencies first
    let known = tagSet[tag];
    if (known) {
      // first, we remove any conflicting tags
      if (known.not && known.not.length > 0) {
        for (let o = 0; o < known.not.length; o += 1) {
          // if we're in tagSafe, skip this term.
          if (isSafe === true && term.tags.has(known.not[o])) {
            return null
          }
          term.tags.delete(known.not[o]);
        }
      }
      // add parent tags
      if (known.parents && known.parents.length > 0) {
        for (let o = 0; o < known.parents.length; o += 1) {
          term.tags.add(known.parents[o]);
          addChunk(term, known.parents[o]);
        }
      }
    }
    // finally, add our tag
    term.tags.add(tag);
    // now it's dirty
    term.dirty = true;
    // add a chunk too, if it's easy
    addChunk(term, tag);
    return true
  };

  // support '#Noun . #Adjective' syntax
  const multiTag = function (terms, tagString, tagSet, isSafe) {
    let tags = tagString.split(isMulti);
    terms.forEach((term, i) => {
      let tag = tags[i];
      if (tag) {
        tag = tag.replace(/^#/, '');
        tagTerm(term, tag, tagSet, isSafe);
      }
    });
  };

  const isArray$2 = function (arr) {
    return Object.prototype.toString.call(arr) === '[object Array]'
  };

  // verbose-mode tagger debuging
  const log = (term, tag, reason = '') => {
    const yellow = str => '\x1b[33m\x1b[3m' + str + '\x1b[0m';
    const i = str => '\x1b[3m' + str + '\x1b[0m';
    let word = term.text || '[' + term.implicit + ']';
    if (typeof tag !== 'string' && tag.length > 2) {
      tag = tag.slice(0, 2).join(', #') + ' +'; //truncate the list of tags
    }
    tag = typeof tag !== 'string' ? tag.join(', #') : tag;
    console.log(` ${yellow(word).padEnd(24)} \x1b[32m→\x1b[0m #${tag.padEnd(22)}  ${i(reason)}`); // eslint-disable-line
  };

  // add a tag to all these terms
  const setTag = function (terms, tag, world = {}, isSafe, reason) {
    const tagSet = world.model.one.tagSet || {};
    if (!tag) {
      return
    }
    // some logging for debugging
    const env = typeof process === 'undefined' || !process.env ? self.env || {} : process.env;
    if (env && env.DEBUG_TAGS) {
      log(terms[0], tag, reason);
    }
    if (isArray$2(tag) === true) {
      tag.forEach(tg => setTag(terms, tg, world, isSafe));
      return
    }
    tag = tag.trim();
    // support '#Noun . #Adjective' syntax
    if (isMulti.test(tag)) {
      multiTag(terms, tag, tagSet, isSafe);
      return
    }
    tag = tag.replace(/^#/, '');
    // let set = false
    for (let i = 0; i < terms.length; i += 1) {
      tagTerm(terms[i], tag, tagSet, isSafe);
    }
  };
  var setTag$1 = setTag;

  // remove this tag, and its children, from these terms
  const unTag = function (terms, tag, tagSet) {
    tag = tag.trim().replace(/^#/, '');
    for (let i = 0; i < terms.length; i += 1) {
      let term = terms[i];
      // support clearing all tags, with '*'
      if (tag === '*') {
        term.tags.clear();
        continue
      }
      // for known tags, do logical dependencies first
      let known = tagSet[tag];
      // removing #Verb should also remove #PastTense
      if (known && known.children.length > 0) {
        for (let o = 0; o < known.children.length; o += 1) {
          term.tags.delete(known.children[o]);
        }
      }
      term.tags.delete(tag);
    }
  };
  var unTag$1 = unTag;

  const e=function(e){return e.children=e.children||[],e._cache=e._cache||{},e.props=e.props||{},e._cache.parents=e._cache.parents||[],e._cache.children=e._cache.children||[],e},t=/^ *(#|\/\/)/,n=function(t){let n=t.trim().split(/->/),r=[];n.forEach((t=>{r=r.concat(function(t){if(!(t=t.trim()))return null;if(/^\[/.test(t)&&/\]$/.test(t)){let n=(t=(t=t.replace(/^\[/,"")).replace(/\]$/,"")).split(/,/);return n=n.map((e=>e.trim())).filter((e=>e)),n=n.map((t=>e({id:t}))),n}return [e({id:t})]}(t));})),r=r.filter((e=>e));let i=r[0];for(let e=1;e<r.length;e+=1)i.children.push(r[e]),i=r[e];return r[0]},r=(e,t)=>{let n=[],r=[e];for(;r.length>0;){let e=r.pop();n.push(e),e.children&&e.children.forEach((n=>{t&&t(e,n),r.push(n);}));}return n},i=e=>"[object Array]"===Object.prototype.toString.call(e),c=e=>(e=e||"").trim(),s=function(c=[]){return "string"==typeof c?function(r){let i=r.split(/\r?\n/),c=[];i.forEach((e=>{if(!e.trim()||t.test(e))return;let r=(e=>{const t=/^( {2}|\t)/;let n=0;for(;t.test(e);)e=e.replace(t,""),n+=1;return n})(e);c.push({indent:r,node:n(e)});}));let s=function(e){let t={children:[]};return e.forEach(((n,r)=>{0===n.indent?t.children=t.children.concat(n.node):e[r-1]&&function(e,t){let n=e[t].indent;for(;t>=0;t-=1)if(e[t].indent<n)return e[t];return e[0]}(e,r).node.children.push(n.node);})),t}(c);return s=e(s),s}(c):i(c)?function(t){let n={};t.forEach((e=>{n[e.id]=e;}));let r=e({});return t.forEach((t=>{if((t=e(t)).parent)if(n.hasOwnProperty(t.parent)){let e=n[t.parent];delete t.parent,e.children.push(t);}else console.warn(`[Grad] - missing node '${t.parent}'`);else r.children.push(t);})),r}(c):(r(s=c).forEach(e),s);var s;},h=e=>"[31m"+e+"[0m",o=e=>"[2m"+e+"[0m",l=function(e,t){let n="-> ";t&&(n=o("→ "));let i="";return r(e).forEach(((e,r)=>{let c=e.id||"";if(t&&(c=h(c)),0===r&&!e.id)return;let s=e._cache.parents.length;i+="    ".repeat(s)+n+c+"\n";})),i},a=function(e){let t=r(e);t.forEach((e=>{delete(e=Object.assign({},e)).children;}));let n=t[0];return n&&!n.id&&0===Object.keys(n.props).length&&t.shift(),t},p={text:l,txt:l,array:a,flat:a},d=function(e,t){return "nested"===t||"json"===t?e:"debug"===t?(console.log(l(e,!0)),null):p.hasOwnProperty(t)?p[t](e):e},u=e=>{r(e,((e,t)=>{e.id&&(e._cache.parents=e._cache.parents||[],t._cache.parents=e._cache.parents.concat([e.id]));}));},f$2=(e,t)=>(Object.keys(t).forEach((n=>{if(t[n]instanceof Set){let r=e[n]||new Set;e[n]=new Set([...r,...t[n]]);}else {if((e=>e&&"object"==typeof e&&!Array.isArray(e))(t[n])){let r=e[n]||{};e[n]=Object.assign({},t[n],r);}else i(t[n])?e[n]=t[n].concat(e[n]||[]):void 0===e[n]&&(e[n]=t[n]);}})),e),j=/\//;class g$1{constructor(e={}){Object.defineProperty(this,"json",{enumerable:!1,value:e,writable:!0});}get children(){return this.json.children}get id(){return this.json.id}get found(){return this.json.id||this.json.children.length>0}props(e={}){let t=this.json.props||{};return "string"==typeof e&&(t[e]=!0),this.json.props=Object.assign(t,e),this}get(t){if(t=c(t),!j.test(t)){let e=this.json.children.find((e=>e.id===t));return new g$1(e)}let n=((e,t)=>{let n=(e=>"string"!=typeof e?e:(e=e.replace(/^\//,"")).split(/\//))(t=t||"");for(let t=0;t<n.length;t+=1){let r=e.children.find((e=>e.id===n[t]));if(!r)return null;e=r;}return e})(this.json,t)||e({});return new g$1(n)}add(t,n={}){if(i(t))return t.forEach((e=>this.add(c(e),n))),this;t=c(t);let r=e({id:t,props:n});return this.json.children.push(r),new g$1(r)}remove(e){return e=c(e),this.json.children=this.json.children.filter((t=>t.id!==e)),this}nodes(){return r(this.json).map((e=>(delete(e=Object.assign({},e)).children,e)))}cache(){return (e=>{let t=r(e,((e,t)=>{e.id&&(e._cache.parents=e._cache.parents||[],e._cache.children=e._cache.children||[],t._cache.parents=e._cache.parents.concat([e.id]));})),n={};t.forEach((e=>{e.id&&(n[e.id]=e);})),t.forEach((e=>{e._cache.parents.forEach((t=>{n.hasOwnProperty(t)&&n[t]._cache.children.push(e.id);}));})),e._cache.children=Object.keys(n);})(this.json),this}list(){return r(this.json)}fillDown(){var e;return e=this.json,r(e,((e,t)=>{t.props=f$2(t.props,e.props);})),this}depth(){u(this.json);let e=r(this.json),t=e.length>1?1:0;return e.forEach((e=>{if(0===e._cache.parents.length)return;let n=e._cache.parents.length+1;n>t&&(t=n);})),t}out(e){return u(this.json),d(this.json,e)}debug(){return u(this.json),d(this.json,"debug"),this}}const _=function(e){let t=s(e);return new g$1(t)};_.prototype.plugin=function(e){e(this);};

  // i just made these up
  const colors = {
    Noun: 'blue',
    Verb: 'green',
    Negative: 'green',
    Date: 'red',
    Value: 'red',
    Adjective: 'magenta',
    Preposition: 'cyan',
    Conjunction: 'cyan',
    Determiner: 'cyan',
    Adverb: 'cyan',
  };

  var colors$1 = colors;

  const getColor = function (node) {
    if (colors$1.hasOwnProperty(node.id)) {
      return colors$1[node.id]
    }
    if (colors$1.hasOwnProperty(node.is)) {
      return colors$1[node.is]
    }
    let found = node._cache.parents.find(c => colors$1[c]);
    return colors$1[found]
  };

  // convert tags to our final format
  const fmt = function (nodes) {
    const res = {};
    nodes.forEach(node => {
      let { not, also, is, novel } = node.props;
      let parents = node._cache.parents;
      if (also) {
        parents = parents.concat(also);
      }
      res[node.id] = {
        is,
        not,
        novel,
        also,
        parents,
        children: node._cache.children,
        color: getColor(node)
      };
    });
    // lastly, add all children of all nots
    Object.keys(res).forEach(k => {
      let nots = new Set(res[k].not);
      res[k].not.forEach(not => {
        if (res[not]) {
          res[not].children.forEach(tag => nots.add(tag));
        }
      });
      res[k].not = Array.from(nots);
    });
    return res
  };

  var fmt$1 = fmt;

  const toArr = function (input) {
    if (!input) {
      return []
    }
    if (typeof input === 'string') {
      return [input]
    }
    return input
  };

  const addImplied = function (tags, already) {
    Object.keys(tags).forEach(k => {
      // support deprecated fmts
      if (tags[k].isA) {
        tags[k].is = tags[k].isA;
      }
      if (tags[k].notA) {
        tags[k].not = tags[k].notA;
      }
      // add any implicit 'is' tags
      if (tags[k].is && typeof tags[k].is === 'string') {
        if (!already.hasOwnProperty(tags[k].is) && !tags.hasOwnProperty(tags[k].is)) {
          tags[tags[k].is] = {};
        }
      }
      // add any implicit 'not' tags
      if (tags[k].not && typeof tags[k].not === 'string' && !tags.hasOwnProperty(tags[k].not)) {
        if (!already.hasOwnProperty(tags[k].not) && !tags.hasOwnProperty(tags[k].not)) {
          tags[tags[k].not] = {};
        }
      }
    });
    return tags
  };


  const validate = function (tags, already) {

    tags = addImplied(tags, already);

    // property validation
    Object.keys(tags).forEach(k => {
      tags[k].children = toArr(tags[k].children);
      tags[k].not = toArr(tags[k].not);
    });
    // not links are bi-directional
    // add any incoming not tags
    Object.keys(tags).forEach(k => {
      let nots = tags[k].not || [];
      nots.forEach(no => {
        if (tags[no] && tags[no].not) {
          tags[no].not.push(k);
        }
      });
    });
    return tags
  };
  var validate$1 = validate;

  // 'fill-down' parent logic inference
  const compute$2 = function (allTags) {
    // setup graph-lib format
    const flatList = Object.keys(allTags).map(k => {
      let o = allTags[k];
      const props = { not: new Set(o.not), also: o.also, is: o.is, novel: o.novel };
      return { id: k, parent: o.is, props, children: [] }
    });
    const graph = _(flatList).cache().fillDown();
    return graph.out('array')
  };

  const fromUser = function (tags) {
    Object.keys(tags).forEach(k => {
      tags[k] = Object.assign({}, tags[k]);
      tags[k].novel = true;
    });
    return tags
  };

  const addTags$1 = function (tags, already) {
    // are these tags internal ones, or user-generated?
    if (Object.keys(already).length > 0) {
      tags = fromUser(tags);
    }
    tags = validate$1(tags, already);

    let allTags = Object.assign({}, already, tags);
    // do some basic setting-up
    // 'fill-down' parent logic
    const nodes = compute$2(allTags);
    // convert it to our final format
    const res = fmt$1(nodes);
    return res
  };
  var addTags$2 = addTags$1;

  var methods$4 = {
    one: {
      setTag: setTag$1,
      unTag: unTag$1,
      addTags: addTags$2
    },
  };

  /* eslint no-console: 0 */
  const isArray$1 = function (arr) {
    return Object.prototype.toString.call(arr) === '[object Array]'
  };
  const fns = {
    /** add a given tag, to all these terms */
    tag: function (input, reason = '', isSafe) {
      if (!this.found || !input) {
        return this
      }
      let terms = this.termList();
      if (terms.length === 0) {
        return this
      }
      const { methods, verbose, world } = this;
      // logger
      if (verbose === true) {
        console.log(' +  ', input, reason || '');
      }
      if (isArray$1(input)) {
        input.forEach(tag => methods.one.setTag(terms, tag, world, isSafe, reason));
      } else {
        methods.one.setTag(terms, input, world, isSafe, reason);
      }
      // uncache
      this.uncache();
      return this
    },

    /** add a given tag, only if it is consistent */
    tagSafe: function (input, reason = '') {
      return this.tag(input, reason, true)
    },

    /** remove a given tag from all these terms */
    unTag: function (input, reason) {
      if (!this.found || !input) {
        return this
      }
      let terms = this.termList();
      if (terms.length === 0) {
        return this
      }
      const { methods, verbose, model } = this;
      // logger
      if (verbose === true) {
        console.log(' -  ', input, reason || '');
      }
      let tagSet = model.one.tagSet;
      if (isArray$1(input)) {
        input.forEach(tag => methods.one.unTag(terms, tag, tagSet));
      } else {
        methods.one.unTag(terms, input, tagSet);
      }
      // uncache
      this.uncache();
      return this
    },

    /** return only the terms that can be this tag  */
    canBe: function (tag) {
      let tagSet = this.model.one.tagSet;
      // everything can be an unknown tag
      if (!tagSet.hasOwnProperty(tag)) {
        return this
      }
      let not = tagSet[tag].not || [];
      let nope = [];
      this.document.forEach((terms, n) => {
        terms.forEach((term, i) => {
          let found = not.find(no => term.tags.has(no));
          if (found) {
            nope.push([n, i, i + 1]);
          }
        });
      });
      let noDoc = this.update(nope);
      return this.difference(noDoc)
    },
  };
  var tag$1 = fns;

  const tagAPI = function (View) {
    Object.assign(View.prototype, tag$1);
  };
  var api$4 = tagAPI;

  // wire-up more pos-tags to our model
  const addTags = function (tags) {
    const { model, methods } = this.world();
    const tagSet = model.one.tagSet;
    const fn = methods.one.addTags;
    let res = fn(tags, tagSet);
    model.one.tagSet = res;
    return this
  };

  var lib$1 = { addTags };

  const boringTags = new Set(['Auxiliary', 'Possessive']);

  const sortByKids = function (tags, tagSet) {
    tags = tags.sort((a, b) => {
      // (unknown tags are interesting)
      if (boringTags.has(a) || !tagSet.hasOwnProperty(b)) {
        return 1
      }
      if (boringTags.has(b) || !tagSet.hasOwnProperty(a)) {
        return -1
      }
      let kids = tagSet[a].children || [];
      let aKids = kids.length;
      kids = tagSet[b].children || [];
      let bKids = kids.length;
      return aKids - bKids
    });
    return tags
  };

  const tagRank = function (view) {
    const { document, world } = view;
    const tagSet = world.model.one.tagSet;
    document.forEach(terms => {
      terms.forEach(term => {
        let tags = Array.from(term.tags);
        term.tagRank = sortByKids(tags, tagSet);
      });
    });
  };
  var tagRank$1 = tagRank;

  var tag = {
    model: {
      one: { tagSet: {} }
    },
    compute: {
      tagRank: tagRank$1
    },
    methods: methods$4,
    api: api$4,
    lib: lib$1
  };

  const initSplit = /(\S.+?[.!?\u203D\u2E18\u203C\u2047-\u2049])(?=\s|$)/g; //!TODO: speedup this regex
  const newLine = /((?:\r?\n|\r)+)/; // Match different new-line formats
  // Start with a regex:
  const basicSplit = function (text) {
    let all = [];
    //first, split by newline
    let lines = text.split(newLine);
    for (let i = 0; i < lines.length; i++) {
      //split by period, question-mark, and exclamation-mark
      let arr = lines[i].split(initSplit);
      for (let o = 0; o < arr.length; o++) {
        all.push(arr[o]);
      }
    }
    return all
  };
  var basicSplit$1 = basicSplit;

  const isAcronym$2 = /[ .][A-Z]\.? *$/i;
  const hasEllipse = /(?:\u2026|\.{2,}) *$/;
  const hasLetter$1 = /\p{L}/u;

  /** does this look like a sentence? */
  const isSentence = function (str, abbrevs) {
    // must have a letter
    if (hasLetter$1.test(str) === false) {
      return false
    }
    // check for 'F.B.I.'
    if (isAcronym$2.test(str) === true) {
      return false
    }
    //check for '...'
    if (hasEllipse.test(str) === true) {
      return false
    }
    let txt = str.replace(/[.!?\u203D\u2E18\u203C\u2047-\u2049] *$/, '');
    let words = txt.split(' ');
    let lastWord = words[words.length - 1].toLowerCase();
    // check for 'Mr.'
    if (abbrevs.hasOwnProperty(lastWord) === true) {
      return false
    }
    // //check for jeopardy!
    // if (blacklist.hasOwnProperty(lastWord)) {
    //   return false
    // }
    return true
  };
  var isSentence$1 = isSentence;

  //(Rule-based sentence boundary segmentation) - chop given text into its proper sentences.
  // Ignore periods/questions/exclamations used in acronyms/abbreviations/numbers, etc.
  //regs-
  const hasSomething = /\S/;
  const startWhitespace = /^\s+/;
  const hasLetter = /[a-z0-9\u00C0-\u00FF\u00a9\u00ae\u2000-\u3300\ud000-\udfff]/i;

  const splitSentences = function (text, model) {
    let abbrevs = model.one.abbreviations || new Set();
    text = text || '';
    text = String(text);
    let sentences = [];
    // First do a greedy-split..
    let chunks = [];
    // Ensure it 'smells like' a sentence
    if (!text || typeof text !== 'string' || hasSomething.test(text) === false) {
      return sentences
    }
    // cleanup unicode-spaces
    text = text.replace('\xa0', ' ');
    // Start somewhere:
    let splits = basicSplit$1(text);
    // Filter-out the crap ones
    for (let i = 0; i < splits.length; i++) {
      let s = splits[i];
      if (s === undefined || s === '') {
        continue
      }
      //this is meaningful whitespace
      if (hasSomething.test(s) === false || hasLetter.test(s) === false) {
        //add it to the last one
        if (chunks[chunks.length - 1]) {
          chunks[chunks.length - 1] += s;
          continue
        } else if (splits[i + 1]) {
          //add it to the next one
          splits[i + 1] = s + splits[i + 1];
          continue
        }
      }
      //else, only whitespace, no terms, no sentence
      chunks.push(s);
    }
    //detection of non-sentence chunks:
    //loop through these chunks, and join the non-sentence chunks back together..
    for (let i = 0; i < chunks.length; i++) {
      let c = chunks[i];
      //should this chunk be combined with the next one?
      if (chunks[i + 1] && isSentence$1(c, abbrevs) === false) {
        chunks[i + 1] = c + (chunks[i + 1] || '');
      } else if (c && c.length > 0) {
        //this chunk is a proper sentence..
        sentences.push(c);
        chunks[i] = '';
      }
    }
    //if we never got a sentence, return the given text
    if (sentences.length === 0) {
      return [text]
    }
    //move whitespace to the ends of sentences, when possible
    //['hello',' world'] -> ['hello ','world']
    for (let i = 1; i < sentences.length; i += 1) {
      let ws = sentences[i].match(startWhitespace);
      if (ws !== null) {
        sentences[i - 1] += ws[0];
        sentences[i] = sentences[i].replace(startWhitespace, '');
      }
    }
    return sentences
  };
  var sentence = splitSentences;

  const hasHyphen = function (str, model) {
    let parts = str.split(/[-–—]/);
    if (parts.length <= 1) {
      return false
    }
    const { prefixes, suffixes } = model.one;

    //dont split 're-do'
    if (prefixes.hasOwnProperty(parts[0])) {
      return false
    }
    //dont split 'flower-like'
    parts[1] = parts[1].trim().replace(/[.?!]$/, '');
    if (suffixes.hasOwnProperty(parts[1])) {
      return false
    }
    //letter-number 'aug-20'
    let reg = /^([a-z\u00C0-\u00FF`"'/]+)[-–—]([a-z0-9\u00C0-\u00FF].*)/i;
    if (reg.test(str) === true) {
      return true
    }
    //number-letter '20-aug'
    let reg2 = /^([0-9]{1,4})[-–—]([a-z\u00C0-\u00FF`"'/-]+$)/i;
    if (reg2.test(str) === true) {
      return true
    }
    return false
  };

  const splitHyphens = function (word) {
    let arr = [];
    //support multiple-hyphenated-terms
    const hyphens = word.split(/[-–—]/);
    let whichDash = '-';
    let found = word.match(/[-–—]/);
    if (found && found[0]) {
      whichDash = found;
    }
    for (let o = 0; o < hyphens.length; o++) {
      if (o === hyphens.length - 1) {
        arr.push(hyphens[o]);
      } else {
        arr.push(hyphens[o] + whichDash);
      }
    }
    return arr
  };

  // combine '2 - 5' like '2-5' is
  // 2-4: 2, 4
  const combineRanges = function (arr) {
    const startRange = /^[0-9]{1,4}(:[0-9][0-9])?([a-z]{1,2})? ?[-–—] ?$/;
    const endRange = /^[0-9]{1,4}([a-z]{1,2})? ?$/;
    for (let i = 0; i < arr.length - 1; i += 1) {
      if (arr[i + 1] && startRange.test(arr[i]) && endRange.test(arr[i + 1])) {
        arr[i] = arr[i] + arr[i + 1];
        arr[i + 1] = null;
      }
    }
    return arr
  };
  var combineRanges$1 = combineRanges;

  const isSlash = /\p{L} ?\/ ?\p{L}+$/u;

  // 'he / she' should be one word
  const combineSlashes = function (arr) {
    for (let i = 1; i < arr.length - 1; i++) {
      if (isSlash.test(arr[i])) {
        arr[i - 1] += arr[i] + arr[i + 1];
        arr[i] = null;
        arr[i + 1] = null;
      }
    }
    return arr
  };
  var combineSlashes$1 = combineSlashes;

  const wordlike = /\S/;
  const isBoundary = /^[!?.]+$/;
  const naiiveSplit = /(\S+)/;

  let notWord = ['.', '?', '!', ':', ';', '-', '–', '—', '--', '...', '(', ')', '[', ']', '"', "'", '`'];
  notWord = notWord.reduce((h, c) => {
    h[c] = true;
    return h
  }, {});

  const isArray = function (arr) {
    return Object.prototype.toString.call(arr) === '[object Array]'
  };

  //turn a string into an array of strings (naiive for now, lumped later)
  const splitWords = function (str, model) {
    let result = [];
    let arr = [];
    //start with a naiive split
    str = str || '';
    if (typeof str === 'number') {
      str = String(str);
    }
    if (isArray(str)) {
      return str
    }
    const words = str.split(naiiveSplit);
    for (let i = 0; i < words.length; i++) {
      //split 'one-two'
      if (hasHyphen(words[i], model) === true) {
        arr = arr.concat(splitHyphens(words[i]));
        continue
      }
      arr.push(words[i]);
    }
    //greedy merge whitespace+arr to the right
    let carry = '';
    for (let i = 0; i < arr.length; i++) {
      let word = arr[i];
      //if it's more than a whitespace
      if (wordlike.test(word) === true && notWord.hasOwnProperty(word) === false && isBoundary.test(word) === false) {
        //put whitespace on end of previous term, if possible
        if (result.length > 0) {
          result[result.length - 1] += carry;
          result.push(word);
        } else {
          //otherwise, but whitespace before
          result.push(carry + word);
        }
        carry = '';
      } else {
        carry += word;
      }
    }
    //handle last one
    if (carry) {
      if (result.length === 0) {
        result[0] = '';
      }
      result[result.length - 1] += carry; //put it on the end
    }
    // combine 'one / two'
    result = combineSlashes$1(result);
    result = combineRanges$1(result);
    // remove empty results
    result = result.filter(s => s);
    return result
  };
  var term = splitWords;

  //all punctuation marks, from https://en.wikipedia.org/wiki/Punctuation
  //we have slightly different rules for start/end - like #hashtags.
  const startings =
    /^[ \n\t.[\](){}⟨⟩:,،、‒–—―…!‹›«»‐\-?‘’;/⁄·&*•^†‡°¡¿※№÷×ºª%‰+−=‱¶′″‴§~|‖¦©℗®℠™¤₳฿\u0022\uFF02\u0027\u201C\u201F\u201B\u201E\u2E42\u201A\u2035\u2036\u2037\u301D\u0060\u301F]+/;
  const endings =
    /[ \n\t.'[\](){}⟨⟩:,،、‒–—―…!‹›«»‐\-?‘’;/⁄·&*@•^†‡°¡¿※#№÷×ºª‰+−=‱¶′″‴§~|‖¦©℗®℠™¤₳฿\u0022\uFF02\u201D\u00B4\u301E]+$/;
  const hasApostrophe$1 = /['’]/;
  const hasAcronym = /^[a-z]\.([a-z]\.)+/i;
  const minusNumber = /^[-+.][0-9]/;
  const shortYear = /^'[0-9]{2}/;

  const normalizePunctuation = function (str) {
    let original = str;
    let pre = '';
    let post = '';
    // number cleanups
    str = str.replace(startings, found => {
      pre = found;
      // support '-40'
      if ((pre === '-' || pre === '+' || pre === '.') && minusNumber.test(str)) {
        pre = '';
        return found
      }
      // support years like '97
      if (pre === `'` && shortYear.test(str)) {
        pre = '';
        return found
      }
      return ''
    });
    str = str.replace(endings, found => {
      post = found;
      // keep s-apostrophe - "flanders'" or "chillin'"
      if (hasApostrophe$1.test(found) && /[sn]['’]$/.test(original) && hasApostrophe$1.test(pre) === false) {
        post = post.replace(hasApostrophe$1, '');
        return `'`
      }
      //keep end-period in acronym
      if (hasAcronym.test(str) === true) {
        post = post.replace(/\./, '');
        return '.'
      }
      return ''
    });
    //we went too far..
    if (str === '') {
      // do a very mild parse, and hope for the best.
      original = original.replace(/ *$/, after => {
        post = after || '';
        return ''
      });
      str = original;
      pre = '';
    }
    return { str, pre, post }
  };
  var tokenize$1 = normalizePunctuation;

  const parseTerm = txt => {
    // cleanup any punctuation as whitespace
    let { str, pre, post } = tokenize$1(txt);
    const parsed = {
      text: str,
      pre: pre,
      post: post,
      tags: new Set(),
    };
    return parsed
  };
  var whitespace = parseTerm;

  /** some basic operations on a string to reduce noise */
  const clean = function (str) {
    str = str || '';
    str = str.toLowerCase();
    str = str.trim();
    let original = str;
    //punctuation
    str = str.replace(/[,;.!?]+$/, '');
    //coerce Unicode ellipses
    str = str.replace(/\u2026/g, '...');
    //en-dash
    str = str.replace(/\u2013/g, '-');
    //strip leading & trailing grammatical punctuation
    if (/^[:;]/.test(str) === false) {
      str = str.replace(/\.{3,}$/g, '');
      str = str.replace(/[",.!:;?)]+$/g, '');
      str = str.replace(/^['"(]+/g, '');
    }
    // remove zero-width characters
    str = str.replace(/[\u200B-\u200D\uFEFF]/g, '');
    //do this again..
    str = str.trim();
    //oh shucks,
    if (str === '') {
      str = original;
    }
    //no-commas in numbers
    str = str.replace(/([0-9]),([0-9])/g, '$1$2');
    return str
  };
  var cleanup = clean;

  // do acronyms need to be ASCII?  ... kind of?
  const periodAcronym$1 = /([A-Z]\.)+[A-Z]?,?$/;
  const oneLetterAcronym$1 = /^[A-Z]\.,?$/;
  const noPeriodAcronym$1 = /[A-Z]{2,}('s|,)?$/;
  const lowerCaseAcronym$1 = /([a-z]\.)+[a-z]\.?$/;

  const isAcronym$1 = function (str) {
    //like N.D.A
    if (periodAcronym$1.test(str) === true) {
      return true
    }
    //like c.e.o
    if (lowerCaseAcronym$1.test(str) === true) {
      return true
    }
    //like 'F.'
    if (oneLetterAcronym$1.test(str) === true) {
      return true
    }
    //like NDA
    if (noPeriodAcronym$1.test(str) === true) {
      return true
    }
    return false
  };

  const doAcronym = function (str) {
    if (isAcronym$1(str)) {
      str = str.replace(/\./g, '');
    }
    return str
  };
  var doAcronyms = doAcronym;

  const normalize = function (term, world) {
    const killUnicode = world.methods.one.killUnicode;
    // console.log(world.methods.one)
    let str = term.text || '';
    str = cleanup(str);
    //(very) rough ASCII transliteration -  bjŏrk -> bjork
    str = killUnicode(str, world);
    str = doAcronyms(str);
    term.normal = str;
  };
  var normal = normalize;

  // 'Björk' to 'Bjork'.
  const killUnicode = function (str, world) {
    const unicode = world.model.one.unicode || {};
    str = str || '';
    let chars = str.split('');
    chars.forEach((s, i) => {
      if (unicode[s]) {
        chars[i] = unicode[s];
      }
    });
    return chars.join('')
  };
  var killUnicode$1 = killUnicode;

  // turn a string input into a 'document' json format
  const fromString = function (input, world) {
    const { methods, model } = world;
    const { splitSentences, splitTerms, splitWhitespace } = methods.one.tokenize;
    input = input || '';
    // split into sentences
    let sentences = splitSentences(input, model);
    // split into word objects
    input = sentences.map((txt) => {
      let terms = splitTerms(txt, model);
      // split into [pre-text-post]
      terms = terms.map(splitWhitespace);
      // add normalized term format, always
      terms.forEach((t) => {
        normal(t, world);
      });
      return terms
    });
    return input
  };

  var methods$3 = {
    one: {
      killUnicode: killUnicode$1,
      tokenize: {
        splitSentences: sentence,
        splitTerms: term,
        splitWhitespace: whitespace,
        fromString,
      },
    },
  };

  const aliases = {
    '&': 'and',
    '@': 'at',
    '%': 'percent',
    'plz': 'please',
    'bein': 'being',
  };
  var aliases$1 = aliases;

  var misc$2 = [
    'approx',
    'apt',
    'bc',
    'cyn',
    'eg',
    'esp',
    'est',
    'etc',
    'ex',
    'exp',
    'prob', //probably
    'pron', // Pronunciation
    'gal', //gallon
    'min',
    'pseud',
    'fig', //figure
    'jd',
    'lat', //latitude
    'lng', //longitude
    'vol', //volume
    'fm', //not am
    'def', //definition
    'misc',
    'plz', //please
    'ea', //each
    'ps',
    'sec', //second
    'pt',
    'pref', //preface
    'pl', //plural
    'pp', //pages
    'qt', //quarter
    'fr', //french
    'sq',
    'nee', //given name at birth
    'ss', //ship, or sections
    'tel',
    'temp',
    'vet',
    'ver', //version
    'fem', //feminine
    'masc', //masculine
    'eng', //engineering/english
    'adj', //adjective
    'vb', //verb
    'rb', //adverb
    'inf', //infinitive
    'situ', // in situ
    'vivo',
    'vitro',
    'wr', //world record
  ];

  var honorifics = [
    'adj',
    'adm',
    'adv',
    'asst',
    'atty',
    'bldg',
    'brig',
    'capt',
    'cmdr',
    'comdr',
    'cpl',
    'det',
    'dr',
    'esq',
    'gen',
    'gov',
    'hon',
    'jr',
    'llb',
    'lt',
    'maj',
    'messrs',
    'mister',
    'mlle',
    'mme',
    'mr',
    'mrs',
    'ms',
    'mstr',
    'phd',
    'prof',
    'pvt',
    'rep',
    'reps',
    'res',
    'rev',
    'sen',
    'sens',
    'sfc',
    'sgt',
    'sir',
    'sr',
    'supt',
    'surg',
    //miss
    //misses
  ];

  var months = ['jan', 'feb', 'mar', 'apr', 'jun', 'jul', 'aug', 'sep', 'sept', 'oct', 'nov', 'dec'];

  var nouns$1 = [
    'ad',
    'al',
    'arc',
    'ba',
    'bl',
    'ca',
    'cca',
    'col',
    'corp',
    'ft',
    'fy',
    'ie',
    'lit',
    'ma',
    'md',
    'pd',
    'tce',
  ];

  var organizations = ['dept', 'univ', 'assn', 'bros', 'inc', 'ltd', 'co'];

  var places = [
    'rd',
    'st',
    'dist',
    'mt',
    'ave',
    'blvd',
    'cl',
    // 'ct',
    'cres',
    'hwy',
    //states
    'ariz',
    'cal',
    'calif',
    'colo',
    'conn',
    'fla',
    'fl',
    'ga',
    'ida',
    'ia',
    'kan',
    'kans',

    'minn',
    'neb',
    'nebr',
    'okla',
    'penna',
    'penn',
    'pa',
    'dak',
    'tenn',
    'tex',
    'ut',
    'vt',
    'va',
    'wis',
    'wisc',
    'wy',
    'wyo',
    'usafa',
    'alta',
    'ont',
    'que',
    'sask',
  ];

  // units that are abbreviations too
  var units = [
    'dl',
    'ml',
    'gal',
    'ft', //ambiguous
    'qt',
    'pt',
    'tbl',
    'tsp',
    'tbsp',
    'km',
    'dm', //decimeter
    'cm',
    'mm',
    'mi',
    'td',
    'hr', //hour
    'hrs', //hour
    'kg',
    'hg',
    'dg', //decigram
    'cg', //centigram
    'mg', //milligram
    'µg', //microgram
    'lb', //pound
    'oz', //ounce
    'sq ft',
    'hz', //hertz
    'mps', //meters per second
    'mph',
    'kmph', //kilometers per hour
    'kb', //kilobyte
    'mb', //megabyte
    'gb', //ambig
    'tb', //terabyte
    'lx', //lux
    'lm', //lumen
    'pa', //ambig
    'fl oz', //

    'yb',
  ];

  // add our abbreviation list to our lexicon
  let list = [
    [misc$2],
    [units, 'Unit'],
    [nouns$1, 'Noun'],
    [honorifics, 'Honorific'],
    [months, 'Month'],
    [organizations, 'Organization'],
    [places, 'Place'],
  ];
  // create key-val for sentence-tokenizer
  let abbreviations = {};
  // add them to a future lexicon
  let lexicon$3 = {};

  list.forEach(a => {
    a[0].forEach(w => {
      // sentence abbrevs
      abbreviations[w] = true;
      // future-lexicon
      lexicon$3[w] = 'Abbreviation';
      if (a[1] !== undefined) {
        lexicon$3[w] = [lexicon$3[w], a[1]];
      }
    });
  });

  // dashed prefixes that are not independent words
  //  'mid-century', 'pre-history'
  var prefixes = [
    'anti',
    'bi',
    'co',
    'contra',
    'de',
    'extra',
    'infra',
    'inter',
    'intra',
    'macro',
    'micro',
    'mis',
    'mono',
    'multi',
    'peri',
    'pre',
    'pro',
    'proto',
    'pseudo',
    're',
    'sub',
    'supra',
    'trans',
    'tri',
    'un',
    'out', //out-lived
    // 'counter',
    // 'mid',
    // 'out',
    // 'non',
    // 'over',
    // 'post',
    // 'semi',
    // 'super', //'super-cool'
    // 'ultra', //'ulta-cool'
    // 'under',
    // 'whole',
  ].reduce((h, str) => {
    h[str] = true;
    return h
  }, {});

  // dashed suffixes that are not independent words
  //  'flower-like', 'president-elect'
  var suffixes$1 = {
    'like': true,
    'ish': true,
    'less': true,
    'able': true,
    'elect': true,
    'type': true,
    'designate': true,
    // 'fold':true,
  };

  //a hugely-ignorant, and widely subjective transliteration of latin, cryllic, greek unicode characters to english ascii.
  //approximate visual (not semantic or phonetic) relationship between unicode and ascii characters
  //http://en.wikipedia.org/wiki/List_of_Unicode_characters
  //https://docs.google.com/spreadsheet/ccc?key=0Ah46z755j7cVdFRDM1A2YVpwa1ZYWlpJM2pQZ003M0E
  let compact$1 = {
    '!': '¡',
    '?': '¿Ɂ',
    '"': '“”"❝❞',
    "'": '‘‛❛❜’',
    '-': '—–',
    a: 'ªÀÁÂÃÄÅàáâãäåĀāĂăĄąǍǎǞǟǠǡǺǻȀȁȂȃȦȧȺΆΑΔΛάαλАаѦѧӐӑӒӓƛæ',
    b: 'ßþƀƁƂƃƄƅɃΒβϐϦБВЪЬвъьѢѣҌҍ',
    c: '¢©ÇçĆćĈĉĊċČčƆƇƈȻȼͻͼϲϹϽϾСсєҀҁҪҫ',
    d: 'ÐĎďĐđƉƊȡƋƌ',
    e: 'ÈÉÊËèéêëĒēĔĕĖėĘęĚěƐȄȅȆȇȨȩɆɇΈΕΞΣέεξϵЀЁЕеѐёҼҽҾҿӖӗ',
    f: 'ƑƒϜϝӺӻҒғſ',
    g: 'ĜĝĞğĠġĢģƓǤǥǦǧǴǵ',
    h: 'ĤĥĦħƕǶȞȟΉΗЂЊЋНнђћҢңҤҥҺһӉӊ',
    I: 'ÌÍÎÏ',
    i: 'ìíîïĨĩĪīĬĭĮįİıƖƗȈȉȊȋΊΐΪίιϊІЇії',
    j: 'ĴĵǰȷɈɉϳЈј',
    k: 'ĶķĸƘƙǨǩΚκЌЖКжкќҚқҜҝҞҟҠҡ',
    l: 'ĹĺĻļĽľĿŀŁłƚƪǀǏǐȴȽΙӀӏ',
    m: 'ΜϺϻМмӍӎ',
    n: 'ÑñŃńŅņŇňŉŊŋƝƞǸǹȠȵΝΠήηϞЍИЙЛПийлпѝҊҋӅӆӢӣӤӥπ',
    o: 'ÒÓÔÕÖØðòóôõöøŌōŎŏŐőƟƠơǑǒǪǫǬǭǾǿȌȍȎȏȪȫȬȭȮȯȰȱΌΘΟθοσόϕϘϙϬϴОФоѲѳӦӧӨөӪӫ',
    p: 'ƤΡρϷϸϼРрҎҏÞ',
    q: 'Ɋɋ',
    r: 'ŔŕŖŗŘřƦȐȑȒȓɌɍЃГЯгяѓҐґ',
    s: 'ŚśŜŝŞşŠšƧƨȘșȿЅѕ',
    t: 'ŢţŤťŦŧƫƬƭƮȚțȶȾΓΤτϮТт',
    u: 'µÙÚÛÜùúûüŨũŪūŬŭŮůŰűŲųƯưƱƲǓǔǕǖǗǘǙǚǛǜȔȕȖȗɄΰμυϋύ',
    v: 'νѴѵѶѷ',
    w: 'ŴŵƜωώϖϢϣШЩшщѡѿ',
    x: '×ΧχϗϰХхҲҳӼӽӾӿ',
    y: 'ÝýÿŶŷŸƳƴȲȳɎɏΎΥΫγψϒϓϔЎУучўѰѱҮүҰұӮӯӰӱӲӳ',
    z: 'ŹźŻżŽžƵƶȤȥɀΖ',
  };
  //decompress data into two hashes
  let unicode$2 = {};
  Object.keys(compact$1).forEach(function (k) {
    compact$1[k].split('').forEach(function (s) {
      unicode$2[s] = k;
    });
  });
  var unicode$3 = unicode$2;

  var model$3 = {
    one: {
      aliases: aliases$1,
      abbreviations,
      prefixes,
      suffixes: suffixes$1,
      lexicon: lexicon$3, //give this one forward
      unicode: unicode$3,
    },
  };

  const hasSlash = /\//;
  const hasDomain = /[a-z]\.[a-z]/i;
  const isMath = /[0-9]/;
  // const hasSlash = /[a-z\u00C0-\u00FF] ?\/ ?[a-z\u00C0-\u00FF]/
  // const hasApostrophe = /['’]s$/

  const addAliases = function (term, world) {
    let str = term.normal || term.text;
    const aliases = world.model.one.aliases;
    // lookup known aliases like '&'
    if (aliases.hasOwnProperty(str)) {
      term.alias = term.alias || [];
      term.alias.push(aliases[str]);
    }
    // support slashes as aliases
    if (hasSlash.test(str) && !hasDomain.test(str) && !isMath.test(str)) {
      let arr = str.split(hasSlash);
      // don't split urls and things
      if (arr.length <= 2) {
        arr.forEach(word => {
          word = word.trim();
          if (word !== '') {
            term.alias = term.alias || [];
            term.alias.push(word);
          }
        });
      }
    }
    // aliases for apostrophe-s
    // if (hasApostrophe.test(str)) {
    //   let main = str.replace(hasApostrophe, '').trim()
    //   term.alias = term.alias || []
    //   term.alias.push(main)
    // }
    return term
  };
  var alias = addAliases;

  const hasDash = /^\p{Letter}+-\p{Letter}+$/u;
  // 'machine' is a normalized form that looses human-readability
  const doMachine = function (term) {
    let str = term.implicit || term.normal || term.text;
    // remove apostrophes
    str = str.replace(/['’]s$/, '');
    str = str.replace(/s['’]$/, 's');
    //lookin'->looking (make it easier for conjugation)
    str = str.replace(/([aeiou][ktrp])in'$/, '$1ing');
    //turn re-enactment to reenactment
    if (hasDash.test(str)) {
      str = str.replace(/-/g, '');
    }
    //#tags, @mentions
    str = str.replace(/^[#@]/, '');
    if (str !== term.normal) {
      term.machine = str;
    }
  };
  var machine = doMachine;

  // sort words by frequency
  const freq = function (view) {
    let docs = view.docs;
    let counts = {};
    for (let i = 0; i < docs.length; i += 1) {
      for (let t = 0; t < docs[i].length; t += 1) {
        let term = docs[i][t];
        let word = term.machine || term.normal;
        counts[word] = counts[word] || 0;
        counts[word] += 1;
      }
    }
    // add counts on each term
    for (let i = 0; i < docs.length; i += 1) {
      for (let t = 0; t < docs[i].length; t += 1) {
        let term = docs[i][t];
        let word = term.machine || term.normal;
        term.freq = counts[word];
      }
    }
  };
  var freq$1 = freq;

  // get all character startings in doc
  const offset = function (view) {
    let elapsed = 0;
    let index = 0;
    let docs = view.document; //start from the actual-top
    for (let i = 0; i < docs.length; i += 1) {
      for (let t = 0; t < docs[i].length; t += 1) {
        let term = docs[i][t];
        term.offset = {
          index: index,
          start: elapsed + term.pre.length,
          length: term.text.length,
        };
        elapsed += term.pre.length + term.text.length + term.post.length;
        index += 1;
      }
    }
  };


  var offset$1 = offset;

  // cheat- add the document's pointer to the terms
  const index = function (view) {
    // console.log('reindex')
    let document = view.document;
    for (let n = 0; n < document.length; n += 1) {
      for (let i = 0; i < document[n].length; i += 1) {
        document[n][i].index = [n, i];
      }
    }
    // let ptrs = b.fullPointer
    // console.log(ptrs)
    // for (let i = 0; i < docs.length; i += 1) {
    //   const [n, start] = ptrs[i]
    //   for (let t = 0; t < docs[i].length; t += 1) {
    //     let term = docs[i][t]
    //     term.index = [n, start + t]
    //   }
    // }
  };

  var index$1 = index;

  const wordCount = function (view) {
    let n = 0;
    let docs = view.docs;
    for (let i = 0; i < docs.length; i += 1) {
      for (let t = 0; t < docs[i].length; t += 1) {
        if (docs[i][t].normal === '') {
          continue //skip implicit words
        }
        n += 1;
        docs[i][t].wordCount = n;
      }
    }
  };

  var wordCount$1 = wordCount;

  // cheat-method for a quick loop
  const termLoop = function (view, fn) {
    let docs = view.docs;
    for (let i = 0; i < docs.length; i += 1) {
      for (let t = 0; t < docs[i].length; t += 1) {
        fn(docs[i][t], view.world);
      }
    }
  };

  const methods$2 = {
    alias: (view) => termLoop(view, alias),
    machine: (view) => termLoop(view, machine),
    normal: (view) => termLoop(view, normal),
    freq: freq$1,
    offset: offset$1,
    index: index$1,
    wordCount: wordCount$1,
  };
  var compute$1 = methods$2;

  var tokenize = {
    compute: compute$1,
    methods: methods$3,
    model: model$3,
    hooks: ['alias', 'machine', 'index', 'id'],
  };

  // const plugin = function (world) {
  //   let { methods, model, parsers } = world
  //   Object.assign({}, methods, _methods)
  //   Object.assign(model, _model)
  //   methods.one.tokenize.fromString = tokenize
  //   parsers.push('normal')
  //   parsers.push('alias')
  //   parsers.push('machine')
  //   // extend View class
  //   // addMethods(View)
  // }
  // export default plugin

  // lookup last word in the type-ahead prefixes
  const typeahead$1 = function (view) {
    const prefixes = view.model.one.typeahead;
    const docs = view.docs;
    if (docs.length === 0 || Object.keys(prefixes).length === 0) {
      return
    }
    let lastPhrase = docs[docs.length - 1] || [];
    let lastTerm = lastPhrase[lastPhrase.length - 1];
    // if we've already put whitespace, end.
    if (lastTerm.post) {
      return
    }
    // if we found something
    if (prefixes.hasOwnProperty(lastTerm.normal)) {
      let found = prefixes[lastTerm.normal];
      // add full-word as an implicit result
      lastTerm.implicit = found;
      lastTerm.machine = found;
      lastTerm.typeahead = true;
      // tag it, as our assumed term
      if (view.compute.preTagger) {
        view.last().unTag('*').compute(['lexicon', 'preTagger']);
      }
    }
  };

  var compute = { typeahead: typeahead$1 };

  // assume any discovered prefixes
  const autoFill = function () {
    const docs = this.docs;
    if (docs.length === 0) {
      return this
    }
    let lastPhrase = docs[docs.length - 1] || [];
    let term = lastPhrase[lastPhrase.length - 1];
    if (term.typeahead === true && term.machine) {
      term.text = term.machine;
      term.normal = term.machine;
    }
    return this
  };

  const api$2 = function (View) {
    View.prototype.autoFill = autoFill;
  };
  var api$3 = api$2;

  // generate all the possible prefixes up-front
  const getPrefixes = function (arr, opts, world) {
    let index = {};
    let collisions = [];
    let existing = world.prefixes || {};
    arr.forEach((str) => {
      str = str.toLowerCase().trim();
      let max = str.length;
      if (opts.max && max > opts.max) {
        max = opts.max;
      }
      for (let size = opts.min; size < max; size += 1) {
        let prefix = str.substring(0, size);
        // ensure prefix is not a word
        if (opts.safe && world.model.one.lexicon.hasOwnProperty(prefix)) {
          continue
        }
        // does it already exist?
        if (existing.hasOwnProperty(prefix) === true) {
          collisions.push(prefix);
          continue
        }
        if (index.hasOwnProperty(prefix) === true) {
          collisions.push(prefix);
          continue
        }
        index[prefix] = str;
      }
    });
    // merge with existing prefixes
    index = Object.assign({}, existing, index);
    // remove ambiguous-prefixes
    collisions.forEach((str) => {
      delete index[str];
    });
    return index
  };

  var allPrefixes = getPrefixes;

  const isObject = val => {
    return Object.prototype.toString.call(val) === '[object Object]'
  };

  const defaults = {
    safe: true,
    min: 3,
  };

  const prepare = function (words = [], opts = {}) {
    let model = this.model();
    opts = Object.assign({}, defaults, opts);
    if (isObject(words)) {
      Object.assign(model.one.lexicon, words);
      words = Object.keys(words);
    }
    let prefixes = allPrefixes(words, opts, this.world());
    // manually combine these with any existing prefixes
    Object.keys(prefixes).forEach(str => {
      // explode any overlaps
      if (model.one.typeahead.hasOwnProperty(str)) {
        delete model.one.typeahead[str];
        return
      }
      model.one.typeahead[str] = prefixes[str];
    });
    return this
  };

  var lib = {
    typeahead: prepare
  };

  const model$2 = {
    one: {
      typeahead: {} //set a blank key-val
    }
  };
  var typeahead = {
    model: model$2,
    api: api$3,
    lib,
    compute,
    hooks: ['typeahead']
  };

  // order here matters
  nlp$1.extend(change); //0kb
  nlp$1.extend(output); //0kb
  nlp$1.extend(match); //10kb
  nlp$1.extend(pointers); //2kb
  nlp$1.extend(tag); //2kb
  nlp$1.plugin(contractions$1); //~6kb
  nlp$1.extend(tokenize); //7kb
  nlp$1.plugin(cache$3); //~1kb
  nlp$1.extend(lookup); //7kb
  nlp$1.extend(typeahead); //1kb
  nlp$1.extend(lexicon$4); //1kb
  nlp$1.extend(sweep); //1kb

  // generated in ./lib/lexicon
  var lexData = {
    "Conjunction": "true¦aun2e1mas,ni,o,p0sino,u,y;ero,or1;!ntonces;que",
    "Determiner": "true¦algun8c7e3l2muchos,otr1su6tod2un0vari8;!os;a4o;a3os;l,s0;e,t0;a0e;!s;ada,ualquier;as,os",
    "Cardinal": "true¦cMdEmilCnAo8quin7s5tre4un3veint0;e,i0;c0dós,nuJoIsGtrés,uno;inco,uatro;a,o;ce,inOsJ;e0iD;isHsLte4;ce,iH;ch0nM;enJoE;ove0uA;ciDnH;!l0;ones,ón;ie1o0;ce,s8;ci0z;nu3o2s0;i0éis;ete;cho;eve;ator8i3ua0;r4tro0;!ci0;entos;en3nc0;o,u0;en0;ta;!to;ce",
    "Pronoun": "true¦alguna,cu8donde,e5le7m4n2otros,quien,s1t1vu3é0;l,ste;e,uy4;os,u0;estr2;e,í1;ll0sto;a0o0;!s;al0yo;!es",
    "Preposition": "true¦aGcBd8e5f3ha2junEmedi9p1que,s0tras;egún,in,ob6;aBor;cia,sta;rente 0uerB;a,de;n0xcepto;!cim8t0;re;e1ur0;ante;! acuerdo con,baj8lante Antr8sA;erc3on0;! respec1t0;ra;to a;a 5;! pesa3demás 4l1nte0;!s 3; lad0rededo1;o 1;r 0;de",
    "Adverb": "true¦0:1P;1:1Q;a14b12c0Qd0Ne0Ff0Cg0Ah09i06jam1Okm²,l02mYnVoTpFquizáErBs7t2usu0ya,ún13;a3o2radicTíp12;!davía,t0;m3n2rde;!to;bién,pL;egu0Ui3ola1u2í,óI;ce0Afic01pues0S;empre,gnifica1Dm2quie1B;p0Oultánea1;a0Qe2ápi0Y;al1ci2la1Aspec1A;e0Xén;!s;arDerf0Ao5r2u0Mylori,úbl0P;e3incip0o2áct0O;b0Gfun0Sgre01p0Z;cisa1v0Y;co7pAr 3s2;ib0Eter0V;e3lo 2supues08;menKt06;jemp2l contrario,ntonces;lo;! a p2;oco;ci0tic2;ular1;cas2fiTrigin0;ion0;atur0eces7o3u2;e0Rn06;!rm0t00;a3en8u2ás;cho,y;l,yorit2;ar0F;e3i2oc0uego;geYt9;j2nW;os;gu0n2;!cluso,depend2iFmediaT;ie02;abi0HistórVoy;en2radu0;er0;in0orm0recueYu2ácil1;er2ndament0;a,te1;conómPn 8s4ven0Bx2;acKclu2treS;si06;en4pec3tr2;echa1icH;i0ífK;ci0;consecuencia,gran medida,línea;e3ir2;ecC;finiXla04masia06ntro,spués;asi,erClaBo4u2;an2;to;m6n2;cre6jun6s2tinJ;ider2taF;ab2;le1;ple2ún1;ta1;ra1;ca;astaRien,ás2;ica1; Qbajo,cMdHhFlDmplCn7p3quí,rriba,s2trLun,ún;imismo,í;are4enas,roxi2;ma2;da1;nte1;t2u0;e3ig2;ua1;r2s;ior1;ia1;go,l2ta1;á,í;o2í;ra;e4ministra2;ti2;va1;la6m2;ás;tu0;al1;me2;nte;bor2la vez;do",
    "Adjective": "true¦0:6I;1:60;2:6C;3:6H;4:64;5:4H;6:46;7:5R;a5Qb5Ec40d3Ke2Xf2Mg2Gh2Ei1Yj1Vl1Pm17n0Zo0Wp0Fquím5Ir06sStHuFv9web,árabe3ú8;ltim4n3Ht3K;ari4JeAi8;ej0ol5Or35s8t1vo3;ib4Iu1;cKr8;d8t08;ader0e3;ni8rb3X;for2Kvers1;eChe,ill,oBrAur9é8íp38;cni5Ermi4X;bul5Fco,íst36;adi63emen5;do,t1;atr1mpCr8;cerAr8;estre3i8;to1U;!a;or1r4P;aJeHiEoAu8úp52;a4Yfi3Lper8;!fi2Pi5G;cialAl8vié4M;a8itLo;!r;!es,is40;g9m8;il0Op2Y;nifica0Aui6;c8gun1Encill0ptentr3Oxu2;o,undari3A;gr30n8;!gri4T;adFeAi49o9u8ápid0;r2s0;cocó,j0m43t0E;al5IcBdon5gAl9nomb14spons3Jvolucion8;ario;a2Uigios4;i5Cular48;i6tang3R;ic1;arMeKl3ToHr8u27úbl4A;eEiBo8ác2UóxZ;b3Bced6f9pi4v8;eni6in21;esi55und0;m8nZ;a48er8;!a3os;s8vi0;en56iden4E;b2Jderos0lít40pDs8;i8te4J;b27tiv0;or,queñ4r8;man7s4Vteneci6ua4B;ci1tic8;ulT;ccide10fi46peraFr8scur0;al,i8;e0Ygin2un5;aDeAo9u8óm25;cleOev4meros1W;b1Xmbra5rm2tab1X;cesari4g8rvioso;a8r2A;tivo;ci4Jt8v1zi;al,ur2;aLeIiGoDu9áx8édi3Pín8óv1Lúltipl3D;im0;n9s8;c2Uic2;di1i8;cip2;dern4r8;al,ib8;un5;lit8sm4;ar4A;di9j3Sn8rid28tropolit2Yx3U;or48t1u5;a,ev1o;gné2WlArítimo,s9te8y3P;mática3ri1;culi3Hi1J;a,vaS;aBeAi8oc2;b8ne1terari0;er1re3;g2n3O;nceoladas,rg4t8;er2in0;aponGem2Zov42u8óven2P;d8nt37s3K;i0Mí0;de1gu2lMmpJn8tali1Ezquierd0;aGdFespeEfDglCi0Kmedia3Hte8usitaH;lec0Fns0r8;!es3Si1Tn8;a8o3;!ci3Ls;e0Gés;ant0Ne34;raA;epe1Cividu2ustri2ígena3;caba8decua8;da;e9o8;rt3Isib1I;ri1;imitad0ustr27;abitu2istór2Bo8um1Xúme5;n5rizo2Y;eBig2Alob1r8;a8ieg0;n8ve3;!de3;n8ográfi1V;er2é0P;aGeFiDorm1rBu8ác06ísic30;er37n8tu0T;c12dame8;nt2;anc8ecu6í0;esa3és;el,n1r8;me;der1menin0;lPm8vor0X;ili1Hos4;conóm1SfTlQnOquival7sEurope4vid7x8;!ac10cel7en2Iist6perime2Ft8;eAr8;anjer8em0;a,os;ns0r8;i27n0A;caGenFpAt8;a8rWánd18;b0Ndounidense3t2;aAec9iri8;tu1;i2ífG;ci2ñol8;!a3es;ci1;sa;orme3te8;ro;ect8éctr1L;or1rón8;icV;ecMicaz;eGiBoAu9éb8;il;lce,r0;b06min13;fBgit1rect0s9vers8;as,os;ponib8tint4;le3;er6íc0B;finiClAportiv9r8;echa;as,o;g8ic8;ada3;ti8;va;a0Ee09h06i02l01oFrBu9éleb8;re;arWltur2án8;ti0C;eAisti8;an8;a,o3;ci7;loSmOnDr9ste8;ra;por1re8t4;ct0spo8;ndi6;en1H;oci5sAt8;en11in8;e0Xu0;ervadDiAt8;an1Cituc8;ion1;der8st7;ab8;le;or;do;er0DpleAun8ún;es,is8;ta;j0t0;mbia0Bni1;ar0ás07;eArc9v8;il0V;ulG;ntíf03rt4;artVi8;l8no;en0;lAntr2r8;c8ebr1;an4;es01ul8;ar;li7ntJpBracterísAstell9tóli8;ca;ana;tiM;a8it1;c8z;es;aHerebGinaFlanEr9uen8ásB;!a3o3;eBi8;ll9tán8;ic4;anN;ve;c4do;ria;er;j4rro8;co;b02ctZdVgrícola3lRmLnHpar7r9t8utónoma,zul,ére0;enP;gentiCqueológicBt8;ifi9íst8;ic0;ci2;os;no;en8;te;t8u2;e8igu4;ri8;orO;arillBbie9er8pli0;ican0;nt1;al;a,en8o;to;em9t4;a3o3;an8án;a3es;i9ministrativ8;a3o;ci8;on2;iv0u2;al8;!es;origCsolut0und8;an8;te3;!s;a,o;en",
    "Noun": "true¦0:2I;1:29;2:1V;3:26;4:2G;5:23;6:1T;7:1Q;8:1U;a28b25c1Ad15e0Vf0Qg0Mh0Ki0Fj0Dl0Bm03n01oXpQrKsGtCunión sovié0Yv9web2é0Y;ar1Jenta6iAo9;c1lum0;rg0si0F;a1WeAr9ác0Uécn19;abajo,en,ibun1áf5;m9rmin1ór5;po0Wá0R;aBe9oviét1J;m9ñ1;a6ifina7;b1Tl27ntand2;adica7eCiAo9égim0ío;b1Rn;tu1v9;al23er;p9stau26;o0Kresen01úbl0W;aEerDiMlBo9ráct0Vuerto r5órt5;rta9tenci3;da,l;a9ur3á0N;c2n;iódiHspec1Y;cCn,r8;céano Ar9so,t1I;b17d0ig0;atl1Jpac9;íf5;e9inten1K;ga1Rolít5;aDeCiBo1UuAéd0Wúsi9;co10;eb7j2n1G;ner1r8;mbra6nest2t1;drug8nAquinaria,rg0te9ña6;mát5ria7;u3za6;a6eva4i9leg8ás2íd2;bera7ngüísUtor3;orna01u9úpit2;egos olímp0Lg8;d0Hmag0n9;fBicia1DsAte9;gr3lectua7;ta4;a4orD;a9erma6imml2ospit1;ba6rry pott2;a7en,obBr9;a9áf0C;máI;erna4ierno;aCestiv1iBoAu9ábrVís09;erzas armYner3;n0Trma;li3na7;bri11ch8;ditori3jecu12mHnFs9xam0;pCt9;ad06udiAé9;tica;a4oA;aEo9;so;a6t9;raB;baj8ir;esCiAocument3éca9ía de las amérG;daY;agnó9buja4pu0Dsposi0Q;st5;arrollo,ord0;aNerMhicLientífPlKoErAu9ánc2;an0Al0M;iBát2íticAón9;icD;aQoQ;m0st1;mBnceja7orden9s04;ad9;as;andAbustibTerc9;ia4;a4o;an,ásD;as,oH;ea7;bNdáv2lz8mpa6nIpGrDsCt9ud3;edrAól9;icW;al,át5;a,o;acter9den1m0nav3áct2;ística9;!s;ita7;les;alRci9;ll2;na;ada;er;le;a9ienestar;nFtm9;an;bdom0djePlJma4nGquellFrsen3t9yuda4;enBl9racO;ánt5;ico;ta9;do;al;os;a,im1;al9;!es;iCmiBt9;ar,erna9;tiva;ra4;ca4;nte;tivo;en",
    "Ordinal": "true¦cVdKmilJnoIoctHpGquinEs8t2unMvigésimo0;! 0;cuRpEs5teM;eLr0;esTi0;ceWgésimo0;! 0;p9s0;eg5;e1é0;ptTtT;g2pt1x0;agQcePto;iNu2;undo;cu0geMto;agM;rim8;aCingKogK;nGv8;lonIésJ;ecimo2osCu0écI;ceFo0;décG;c4nov3quinAs2te0;rc0;ero;ex7éptC;eno;ta1u0;ar4;vo;e5ua0;dr2r1tro0;mil4;to;ag2i0;nge0;nt0;és0;imo",
    "Unit": "true¦bHceFeDfahrenheitIgBhertz,jouleIk8liGm6p4terEy2z1°0µs;c,f,n;b,e1;b,o0;ttA;e0ouceD;rcent,t8;eg7il0³,è9;eAlili8;elvin9ilo1m0;!/h,s;!b6gr1mètre,s;ig2r0;amme5;b,x0;ab2;lsius,ntimè0;tre1;yte0;!s",
    "City": "true¦0:3B;a2Zb29c1Zd1Ue1Tf1Rg1Lh1Di1Bjakar2Kk12l0Vm0Hn0Do0Bp00quiZrWsMtDuCv9w4y2z1;agreb,uri22;ang1We1okohama;katerin1Krev0;ars4e3i1rocl4;ckl0Yn1;nipeg,terth0Z;llingt1Rxford;aw;a2i1;en2Klni33;lenc2Yncouv0Ir2J;lan bat0Ftrecht;a7bilisi,e6he5i4o3rondheim,u1;nWr1;in,ku;kyo,ronJulouD;anj26l16miso2Mra2D; haKssaloni10;gucigalpa,hr0l av0O;i1llinn,mpe2Engi09rtu;chu25n0pU;a4e3h2kopje,t1ydney;ockholm,uttga15;angh1Ienzh20;o0Nv01;int peters0Xl4n1ppo1I; 1ti1E;jo1salv3;se;v1z0T;adW;eykjavik,i2o1;me,sario,t28;ga,o de janei1A;to;a9e7h6i5o3r1ueb1Tyongya1Q;a1etor28;gue;rt1zn0; elizabe4o;ls1Jrae28;iladelph23nom pe0Aoenix;r1tah tik1C;th;lerLr1tr13;is;dessa,s1ttawa;a1Klo;a3ew 1is;delWtaip1york ci1U;ei;goya,nt0Xpl0Xv0;a7e6i5o2u1;mb0Oni0L;nt2sco1;u,w;evideo,real;l0n03skolc;dellín,lbour0U;drid,l6n4r1;ib2se1;ille;or;chest1dalYi11;er;mo;a6i3o1vCy03;nd1s angel0H;on,r0G;ege,ma1nz,sb00verpo2;!ss1;ol; pla0Jusan0G;a6hark5i4laipeda,o2rak1uala lump3;ow;be,pavog1sice;ur;ev,ng9;iv;b4mpa0Lndy,ohsiu0Ira1un04;c1j;hi;ncheNstanb1̇zmir;ul;a6e4o1; chi mi2ms,u1;stJ;nh;lsin1rakliH;ki;ifa,m1noi,va0B;bu0UiltE;alw5dan4en3hent,iza,othen2raz,ua1;dalaj0Hngzhou;bu0R;eVoa,ève;sk;ay;es,rankfu1;rt;dmont5indhovV;a2ha02oha,u1;blSrb0shanbe;e1kar,masc0HugavpiK;gu,je1;on;a8ebu,h3o1raioKuriti02;lo1nstanKpenhagOrk;gGmbo;enn4i2ristchur1;ch;ang m2c1ttagoM;ago;ai;i1lgary,pe town,rac5;ro;aIeCirminghXogoBr6u1;char4dap4enos air3r1s0;g1sa;as;es;est;a3isba2usse1;ls;ne;silRtisla1;va;ta;i4lgrade,r1;g2l1n;in;en;ji1rut;ng;ku,n4r1sel;celo2ranquil1;la;na;g2ja lu1;ka;alo1kok;re;aDbBhmedabad,l8m5n3qa2sh1thens,uckland;dod,gabat;ba;k1twerp;ara;m0s1;terd1;am;exandr2ma1;ty;ia;idj0u dhabi;an;lbo2rh1;us;rg",
    "Country": "true¦0:2M;a2Cb1Yc1Nd1Me1Df19g12h11i0Sj0Qk0Nl0Gm08n04om2Op00rRsFtAu6v4wal3y2z1;a1Rimbab0A;emen,ibu0N;es,lis and futu2D;a1enezue2FietD;nuatu,tican city;cr2Fg0Snited 2ruXs1zbek2H;a,sr;arab emiratIkingdom,states1;! of ameB;a4imor orient0Vo3rinidad y toba08u1únez;r1valu;kmen2Bqu12;go,nS;i0Xnz27yik29;a8e7i6om0Eri lanka,u1;azi0Vdá2ec0iza,ri1;nam;f2n1;! del s18;ri1F;erra leo1Vngap16r0;neg0Jrb0ychell4;moa,n1o tomé y príncipe; 1ta luc0Q;cristóbal y niev1mariSvicente y las granad0N;es;e2u1;an1Qm1Ts0;ino unido,pública 1;c4d1;e1omin4; macedQl1mocrática del1; conL;entroafr1he11;ica1H;a2erú,o1;lLrtug04;k1Lla18namá,púa nueva guin0Gra1íses baj18;guay;a3ep01i2orue1ueva zelUíger;ga;caragua,ger0;mib0uru;a5icroSo2éxi1óna1;co;ldav0n2zambiq1;ue;gol0tenegro;dagasc0Jl1rruec0Xurit18;a1div0Xta,í;s0ui;a0Ue5i3uxembur2íba1;no;go;b1echtenste0Qtu12;er0ia;soZt1;on0;azaj10en0ir1uwait;gu0Ziba1;ti;a1ord0V;mai08pH;nd7r5s2t1;al0;la1rael;nd0s 1;marshall,salomC;ak,l1án;an0K;ia,o1;nes0;aití,ondur0AungrD;a5ha0Er4u1;atema0Ginea1ya0D;! ecuatori1-bisáu;al;ana0Cec0;b1mb0;ón;i1ranc0;lip2n1yi;land0;inZ;cu8gip7l salv8miratos árabe6ritr5s2tiop1;ía;lov2paña,t1;ado3on0;aqu0en0;ea;s unidR;to;ador;inamarDominiD;a8hi6o1roac0uba;lo4morNrea del 2sta 1te d'ivoi6;de marfEriA;norte,s1;ur;mb0;le,na,p1;re;bo verde,m2nadá,t1;ar;boya,erún;a9e8i7o6r4u2élgi1;ca;lgar0r1tO;kina faso,undi;as1unéi;il;liv0snia-herzegoviCtsuaC;elorrus0rmG;lice,nín;ham4ngladés,r1;bad2é1;in;os;as;fganBl8n5r2ustr1zerbaiyC;al0ia;abia saudita,ge1men0;l0nti1;na;dorra,go2tigua y barbu1;da;la;b1em1;an0;ia;ist1;án",
    "Place": "true¦aLbJcHdGeEfDgAh9i8jfk,kul,l7m5new eng4ord,p2s1the 0upIyyz;bronx,hamptons;fo,oho,under2yd;acifLek,h0;l,x;land;a0co,idCuc;libu,nhattJ;ax,gw,hr;ax,cn,ndianGst;arlem,kg,nd;ay village,re0;at 0enwich;britain,lak2;co,ra;urope,verglad0;es;en,fw,own1xb;dg,gk,hina0lt;town;cn,e0kk,rooklyn;l air,verly hills;frica,m5ntar1r1sia,tl0;!ant1;ct0;ic0; oce0;an;ericas,s",
    "Region": "true¦0:23;1:1U;a21b1Tc1Jd1Ees1Df1Ag14h11i0Yj0Wk0Ul0Rm0GnZoXpTqQrNsEtButAv7w4y2zacatec23;o05u2;cat19kZ;a2est vi5isconsin,yomi15;rwick1shington2;! dc;er3i2;rgin1T;acruz,mont;ah,tar pradesh;a3e2laxca1EuscaB;nnessee,x1S;bas0Lmaulip1RsmK;a7i5o3taf0Pu2ylh14;ffVrr01s0Z;me11no1Buth 2;cSdR;ber1Jc2naloa;hu0Tily;n3skatchew0Sxo2;ny; luis potosi,ta catari0;a2hode8;j2ngp03;asth0Nshahi;inghai,u2;e2intana roo;bec,ensXreta0F;ara0e3rince edward2; isV;i,nnsylv2rnambu03;an15;axa0Pdisha,h2klaho1Dntar2reg5x06;io;ayarit,eCo4u2;evo le2nav0N;on;r2tt0Tva scot0Z;f7mandy,th2; 2ampton1;c4d3yo2;rk1;ako10;aroli0;olk;bras0Zva03w2; 3foundland2;! and labrador;brunswick,hamp1jers3mexiLyork2;! state;ey;a7i3o2;nta0relos;ch4dlanCn3ss2;issippi,ouri;as geraHneso0N;igRoacR;dhya,harasht05ine,ni4r2ssachusetts;anhao,y2;land;p2toba;ur;anca1e2incoln1ouis9;e2iI;ds;a2entucky,hul0;ns09rnata0Eshmir;alis2iangxi;co;daho,llino3nd2owa;ia0;is;a3ert2idalFunB;ford1;mp1waii;ansu,eorgXlou6u2;an3erre2izhou,jarat;ro;ajuato,gdo2;ng;cester1;lori3uji2;an;da;sex;e5o3uran2;go;rs2;et;lawaFrby1;a9ea8hi7o2umbrI;ahui5l4nnectic3rsi2ventry;ca;ut;iNorado;la;apFhuahua;ra;l9m2;bridge1peche;a6r5uck2;ingham1;shi2;re;emen,itish columb4;h3ja cal2sque,var3;iforn2;ia;guascalientes,l5r2;izo0kans2;as;na;a3ber2;ta;ba3s2;ka;ma",
    "Infinitive": "true¦0:6V;1:6R;2:6L;3:6K;4:5G;5:4P;a5Gb58c3Ud38e2Ff29g24h20i1Lju1Kl1Em17n13o0Yp0Eque0DrZsNtGuEv6y3K;aCe9i8o6;l6mit,t0;ar,v2;aj0ol0s6Av1;n7r6st1;!if5;c2d2ir;ci0l2ri0;b5n6s0t4M;ir,t0;aBeAir0o8r6;a6iunf0opez0;baj0d1Der,g0t0;c0m0r6s2;c2t4L;m2n2rm63ñ1;p0rd0ñ2;aDeBiAo8u6;b1ced2fr1g03p0Grg1s6;p54ti3X;breviv1l2n6po1Erpre4ñ0;ar,r1P;gn46mbol4Stu0;c0gu1ntXr6ñ17;!v1;b2c8l7ti6;r4Osf2T;ir,t0ud0v0;ar,r40ud1;e7o6;b0g0mp2;al4JcEd0UgBhus0in0nAp8quQs6v53z0ír,ñ1;erv0olv2p6u0X;et0ir0o4;a6et1l5o10;r0s0;ac2ov0un4X;a7i6r4Iul0;r,s2N;l0r,te0;h4Wi7o6;g2mend0noc2rd0;b1cl0;br0d0m0r2;aNeIiHlaFoEr7u6;bl5r3J;act5e8o6;b0d0Eh2Amet2pNse23te6v1G;g2st0;d3Zf8gu4Up2Ese6v2;nt6rv0;ar,ir;er1;d2n2;n6t5;ch0t0;c0nt0;d1g0in0le0ns0r7s6;ar,c0;d7m6se1Rten3;an3it1;er,on0;d3g0r6s0t4S;ar,ec2ticip0;b9curr1di0f8l7p6rgan3Mír;on2;er,vid0;e4r3;ed3l36t11;a8e6ot0;ces4Fg6v0;ar,o3Y;c2d0veg0;a9e7ir0o6ud0;d2Qle3Knt0r1s1Nv2;d1nt1re6t2zcl0;c2nd0;d2Un7qui2Src0st5t6;ar,ric30;d0ej0t0Q;aAe9impi0l6o0Wu0X;am0e7o6;r0v2;g0n0v0;er,gUva3V;dr0me3Unz0stim0v0;g0nt0r0;lus1AmpIn6r;clu1dGfFi3Hmi0OsCt8v6;ad1e6it0oc0;nt0rt1st2K;e7rod6;uc1;nt0r6;es0pret0;i31t7u6;lt0;al0;lu1o3M;ic0uc1;o6r0W;rt0;a8e6u1;l0r6;ed0ir,v1;bl0c2ll0;a9ener8lor1Uobern0r7u6;ard0i0st0;adu0it0uñ1;al2D;n0st0;aAelic3Ai9lor3or8r7u6;m0nci3U;eír;m0tal3;j0ng1rm0;br5lt0sc3A;ch0duc0fectu0jerc2lXmTnJquivIrr0sDvCx6;h0Big1p7t6;e4in03;l7o6r27;n2rt0;ic0o6;r0t0;acu0it0;c8per0qui0t6;a6im0udi0;bl3r;o6r01uL;g2nd2;oc0;amor0cEfCg33oj0riDsBt7v6;ej3i0;e4r6usiasm0;ar,e6;g0t6vi1V;en2;eñ0u24;ad0e2Ila6;qu3;a2Be4onT;borra8i7p6;ez0le0;gr0;ch0;eg1im2H;ar,eDi8o7u6;ch0d0r0;bl0l2rm1;buj0r26s7v6;e29or1R;eñ0frut0gu1Fminu1t6;in6ri03;gu1;b2cGd5fe4j0mosFpDrret1s7te02vo6;lv2r0;aAc8e0h7pe6tru1;d1rt0;ac2;ans0e4r6ubr1;ib1;gr1Rpar3rro0Gyun0;e4os1Vr6;im1;tr0;i7l6or0;ar0;d1r;a0Ce08h07iv06la03oCr8u6;br1id0l6mpl1r0;p0tiv0;e8i7u6;c00z0;ar,t5;ar,c2er;br0c1Ng2lUmQn9pi0r7s6;er,t0;re6t0;g1r;dLfJjug0oc2qui0NsFtAv6;e6id0;n7r6;s0t1;c2ir;a9e8inu0r6;i6ol0;bu1;n2st0;m1Ar;e8i0Ft6um1;i6ru1;tu1;gu1nt1rv0;es0i6;ar,rm0sc0;en0uc1;bat1e8p6un5;a0Yet1on2r6;ar,e4;nz0r;g0o6;c0nT;r6s6;if5;ic0;ilP;arl0isme0oc0;le0Vn7pi6rr0s0;ll0;ar,s6;ur0;b2er,lAm0Nn9r8s6us0z0;ar,t6;ig0;acterGg0;cZs0;c6e07l0m0;ul0;aBe9or8ri7u6;ce0rl0sc0;ll0nd0;d0r0;b2nd6s0;ec1;il0j0rr2t1ut6ñ0;iz0;b0Jc09d04f00gWhorVlSmPnMpGrrFsBt7umeXv6yud0ñad1;aTerigu0is0;ac0e4ra6;er,v6;es0;nd2;i8oHp7u6;st0;ir0;st1;egl0oj0;aAl9o8r6;e6ob0;ci0nd2t0;st0y0;aud1ic0;g0r3;d0h7un6;ci0;el0;a7en6;az0;n3r;ca7e6ivi0morz0quil0;gr0nt0;nz0;c0r0;or0r7ua6;nt0;ad6;ar,ec2;e8i7l6;ig1;rm0;it0;iv9mi8or7ve6;rt1;ar,n0;r0t1;in0;aEeDo6tu0;mpBn8rIst6;ar,um6;br0;sej0t3;ec2;er;añ0;pt0rc0;b0mp0;andAor9r8u6;rr1s0;ir;az0ir;d0t0;on0;ar",
    "Modal": "true¦debEhBp7qu5s2t0;en0iene8;emHgo,éDíaG;ab0ol3uel5é;e0éB;!mEn,s;er0ier2;emCé8;od2ued0;e0o;!n,s;em8r6é4;a1e0;!m6;!bé1n,s;e1o,é0;is;!m2n,r0s;ía0;!is,m0n,s;os",
    "Copula": "true¦eGfu8s0é9;e2i1o0;is,mAn,y;do,endo;a3d,r0áis;em7á1é6ía0;!is,m6n,s;!n,s;!m4n,s;e4i1é0;ram2;!m1ste0;!is;os;!r0;a0on;is,n,s;r0s;a0es;!is,n,s",
    "Month": "true¦a6dic4en3febr3ju1ma0nov4octu5sept4;rzo,yo;l0n0;io;ero;iem0;bre;bril,gosto",
    "WeekDay": "true¦domingo,juev1lun1m0sábado,viern1;art0iércol0;es",
    "FemaleName": "true¦0:FV;1:FZ;2:FO;3:FA;4:F9;5:FP;6:EO;7:GC;8:EW;9:EM;A:G8;B:E2;C:G5;D:FL;E:FI;F:ED;aDZbD1cB8dAIe9Gf91g8Hh83i7Sj6Uk60l4Om38n2To2Qp2Fqu2Er1Os0Qt04ursu6vUwOyLzG;aJeHoG;e,la,ra;lGna;da,ma;da,ra;as7EeHol1TvG;et9onB8;le0sen3;an8endBMhiB3iG;lInG;if3AniGo0;e,f39;a,helmi0lGma;a,ow;aMeJiG;cHviG;an9XenFY;kCWtor3;da,l8Vnus,rG;a,nGoniCZ;a,iD9;leGnesE9;nDIrG;i1y;aSePhNiMoJrGu6y4;acG0iGu0E;c3na,sG;h9Mta;nHrG;a,i;i9Jya;a5IffaCDna,s5;al3eGomasi0;a,l8Go6Xres1;g7Uo6WrHssG;!a,ie;eFi,ri7;bNliMmKnIrHs5tGwa0;ia0um;a,yn;iGya;a,ka,s5;a4e4iGmC7ra;!ka;a,t5;at5it5;a05carlet2Ye04hUiSkye,oQtMuHyG;bFGlvi1;e,sHzG;an2Tet9ie,y;anGi7;!a,e,nG;aEe;aIeG;fGl3DphG;an2;cF5r6;f3nGphi1;d4ia,ja,ya;er4lv3mon1nGobh75;dy;aKeGirlBIo0y6;ba,e0i6lIrG;iGrBMyl;!d70;ia,lBS;ki4nIrHu0w0yG;la,na;i,leAon,ron;a,da,ia,nGon;a,on;l5Yre0;bMdLi8lKmIndHrGs5vannaE;aEi0;ra,y;aGi4;nt5ra;lBKome;e,ie;in1ri0;a02eXhViToHuG;by,thBH;bQcPlOnNsHwe0xG;an93ie,y;aHeGie,lC;ann7ll1marBCtB;!lGnn1;iGyn;e,nG;a,d7W;da,i,na;an8;hel53io;bin,erByn;a,cGkki,na,ta;helBWki;ea,iannDUoG;da,n12;an0bIgi0i0nGta,y0;aGee;!e,ta;a,eG;cAOkaE;chGe,i0mo0n5EquCAvDy0;aC9elGi8;!e,le;een2ia0;aMeLhJoIrG;iGudenAT;scil1Uyamva8;lly,rt3;ilome0oebe,ylG;is,lis;arl,ggy,nelope,r6t4;ige,m0Fn4Oo6rvaB8tHulG;a,et9in1;ricGsy,tA5;a,e,ia;ctav3deHfATlGphAT;a,ga,iv3;l3t9;aQePiJoGy6;eHrG;aEeDma;ll1mi;aKcIkGla,na,s5ta;iGki;!ta;hoAZk8AolG;a,eBE;!mh;l7Sna,risF;dIi5PnHo23taG;li1s5;cy,et9;eAiCL;a01ckenz2eViLoIrignayani,uriBDyG;a,rG;a,na,tAP;i4ll9UnG;a,iG;ca,ka,qB1;a,chOkaNlJmi,nIrGtzi;aGiam;!n8;a,dy,erva,h,n2;a,dIi9GlG;iGy;cent,e;red;!e6;ae6el3G;ag4KgKi,lHrG;edi61isFyl;an2iGliF;nGsAJ;a,da;!an,han;b08c9Bd06e,g04i03l01nZrKtJuHv6Sx85yGz2;a,bell,ra;de,rG;a,eD;h74il8t2;a,cSgOiJjor2l6In2s5tIyG;!aGbe5QjaAlou;m,n9P;a,ha,i0;!aIbAIeHja,lCna,sGt53;!a,ol,sa;!l06;!h,m,nG;!a,e,n1;arIeHie,oGr3Kueri9;!t;!ry;et3IiB;elGi61y;a,l1;dGon,ue6;akranBy;iGlo36;a,ka,n8;a,re,s2;daGg2;!l2W;alCd2elGge,isBDon0;eiAin1yn;el,le;a0Ie08iWoQuKyG;d3la,nG;!a,dHe9PnGsAN;!a,e9O;a,sAL;aAYcJelIiFlHna,pGz;e,iB;a,u;a,la;iGy;a2Ae,l25n8;is,l1GrHtt2uG;el6is1;aIeHi7na,rG;a6Xi7;lei,n1tB;!in1;aQbPd3lLnIsHv3zG;!a,be4Ket9z2;a,et9;a,dG;a,sGy;ay,ey,i,y;a,iaIlG;iGy;a8De;!n4F;b7Qerty;!n5Q;aNda,e0iLla,nKoIslAOtGx2;iGt2;c3t3;la,nGra;a,ie,o4;a,or1;a,gh,laG;!ni;!h,nG;a,d4e,n4N;cNdon7Pi6kes5rMtKurIvHxGy6;mi;ern1in3;a,eGie,yn;l,n;as5is5oG;nya,ya;a,isF;ey,ie,y;aZeUhadija,iMoLrIyG;lGra;a,ee,ie;istGy5A;a,en,iGy;!e,n48;ri,urtn97;aMerLl96mIrGzzy;a,stG;en,in;!berlG;eGi,y;e,y;a,stD;!na,ra;el6MiJlInHrG;a,i,ri;d4na;ey,i,l9Ns2y;ra,s5;c8Ti5UlOma6nyakumari,rMss5JtJviByG;!e,lG;a,eG;e,i75;a5CeHhGi3PlCri0y;ar5Aer5Aie,leDr9Cy;!lyn70;a,en,iGl4Tyn;!ma,n31sF;ei6Zi,l2;a04eVilToMuG;anKdJliGst54;aHeGsF;!nAt0W;!n8U;i2Ry;a,iB;!anLcelCd5Sel6Yhan6FlJni,sHva0yG;a,ce;eGie;fi0lCph4V;eGie;en,n1;!a,e,n36;!i10lG;!i0Z;anLle0nIrHsG;i5Nsi5N;i,ri;!a,el6Mif1RnG;a,et9iGy;!e,f1P;a,e6ZiHnG;a,e6YiG;e,n1;cLd1mi,nHqueliAsmin2Uvie4yAzG;min7;a7eHiG;ce,e,n1s;!lGsFt06;e,le;inHk2lCquelG;in1yn;da,ta;da,lPmNnMo0rLsHvaG;!na;aHiGob6R;do4;!belGdo4;!a,e,l2G;en1i0ma;a,di4es,gr5O;el8ogG;en1;a,eAia0o0se;aNeKilHoGyacin1N;ll2rten1H;aHdGlaH;a,egard;ry;ath0WiHlGnrietBrmiAst0W;en24ga;di;il72lKnJrGtt2yl72z6A;iGmo4Cri4D;etG;!te;aEnaE;ey,l2;aYeTiOlMold12rIwG;enGyne18;!dolC;acHetGisel8;a,chD;e,ieG;!la;adys,enGor3yn1Y;a,da,na;aJgi,lHna,ov6YselG;a,e,le;da,liG;an;!n0;mYnIorgHrG;ald33i,m2Rtru70;et9i0;a,eGna;s1Nvieve;briel3Cil,le,rnet,yle;aReOio0loMrG;anHe8iG;da,e8;!cG;esHiGoi0G;n1s3S;!ca;!rG;a,en40;lHrnG;!an8;ec3ic3;rHtiGy7;ma;ah,rah;d0FileDkBl00mUn47rRsMtLuKvG;aIelHiG;e,ta;in0Ayn;!ngel2F;geni1la,ni3O;h4Zta;meral8peranJtG;eHhGrel6;er;l2Mr;za;iGma,nest27yn;cGka,n;a,ka;eJilImG;aGie,y;!liA;ee,i1y;lGrald;da,y;aTeRiMlLma,no4oJsIvG;a,iG;na,ra;a,ie;iGuiG;se;en,ie,y;a0c3da,nJsGzaH;aGe;!beG;th;!a,or;anor,nG;!a;in1na;en,iGna,wi0;e,th;aWeKiJoG;lor4Yminiq3Vn2XrGtt2;a,eDis,la,othGthy;ea,y;an08naEonAx2;anPbOde,eNiLja,lImetr3nGsir4R;a,iG;ce,se;a,iHla,orGphiA;es,is;a,l5G;dGrdG;re;!d4Jna;!b29oraEra;a,d4nG;!a,e;hl3i0mMnKphn1rHvi1TyG;le,na;a,by,cHia,lG;a,en1;ey,ie;a,et9iG;!ca,el17ka;arGia;is;a0Oe0Lh03i01lToIrHynG;di,th3;is2Ay03;lOnLrHurG;tn1B;aId26iGn26riA;!nG;a,e,n1;!l1Q;n2sG;tanGuelo;ce,za;eGleD;en,t9;aIeoHotG;il49;!pat4;ir7rIudG;et9iG;a,ne;e,iG;ce,sX;a4er4ndG;i,y;aPeMloe,rG;isHyG;stal;sy,tG;aHen,iGy;!an1e,n1;!l;lseHrG;!i7yl;a,y;nLrG;isJlHmG;aiA;a,eGot9;n1t9;!sa;d4el1NtG;al,el1M;cGli3E;el3ilG;e,ia,y;iXlWmilVndUrNsLtGy6;aJeIhGri0;erGleDrCy;in1;ri0;li0ri0;a2FsG;a2Eie;a,iLlJmelIolHrG;ie,ol;!e,in1yn;!a,la;a,eGie,y;ne,y;na,sF;a0Di0D;a,e,l1;isBl2;tlG;in,yn;arb0CeYianXlVoTrG;andRePiIoHyG;an0nn;nwCok7;an2NdgKg0ItG;n27tG;!aHnG;ey,i,y;ny;etG;!t7;an0e,nG;da,na;i7y;bbi7nG;iBn2;ancGossom,ytG;he;ca;aRcky,lin8niBrNssMtIulaEvG;!erlG;ey,y;hHsy,tG;e,i0Zy7;!anG;ie,y;!ie;nGt5yl;adHiG;ce;et9iA;!triG;ce,z;a4ie,ra;aliy29b24d1Lg1Hi19l0Sm0Nn01rWsNthe0uJvIyG;anGes5;a,na;a,r25;drIgusHrG;el3;ti0;a,ey,i,y;hHtrG;id;aKlGt1P;eHi7yG;!n;e,iGy;gh;!nG;ti;iIleHpiB;ta;en,n1t9;an19elG;le;aYdWeUgQiOja,nHtoGya;inet9n3;!aJeHiGmI;e,ka;!mGt9;ar2;!belHliFmT;sa;!le;ka,sGta;a,sa;elGie;a,iG;a,ca,n1qG;ue;!t9;te;je6rea;la;bHmGstas3;ar3;el;aIberHel3iGy;e,na;!ly;l3n8;da;aTba,eNiKlIma,yG;a,c3sG;a,on,sa;iGys0J;e,s0I;a,cHna,sGza;a,ha,on,sa;e,ia;c3is5jaIna,ssaIxG;aGia;!nd4;nd4;ra;ia;i0nHyG;ah,na;a,is,naE;c5da,leDmLnslKsG;haElG;inGyW;g,n;!h;ey;ee;en;at5g2nG;es;ie;ha;aVdiSelLrG;eIiG;anLenG;a,e,ne;an0;na;aKeJiHyG;nn;a,n1;a,e;!ne;!iG;de;e,lCsG;on;yn;!lG;iAyn;ne;agaJbHiG;!gaI;ey,i7y;!e;il;ah",
    "MaleName": "true¦0:C9;1:BG;2:BX;3:BO;4:B0;5:BU;6:AO;7:9Q;8:B8;9:AS;A:AJ;B:9D;aB0bA4c93d84e7Ef6Xg6Fh5Vi5Hj4Kk4Al3Rm2Pn2Eo28p22qu20r1As0Rt07u06v01wOxavi3yHzC;aCor0;cCh8Ene;hDkC;!aAX;ar50eAW;ass2i,oDuC;sEu25;nFsEusC;oCsD;uf;ef;at0g;aKeIiDoCyaAL;lfgang,odrow;lCn1O;bEey,frBFlC;aA1iC;am,e,s;e85ur;i,nde7sC;!l6t1;de,lDrr5yC;l1ne;lCt3;aBy;aFern1iC;cDha0nceCrg97va0;!nt;ente,t59;lentin48nBughn;lyss4Lsm0;aUePhLiJoFrDyC;!l3ro8s1;av9MeCist0oy,um0;nt9Ev53y;bEd7TmCny;!as,mCoharu;aAUie,y;i7Zy;mCt9;!my,othy;adEeoDia79omC;!as;!do7I;!de9;dFrC;enBrC;anBeCy;ll,nB;!dy;dgh,ic9Pnn3req,ts44;aRcotPeOhKiIoGpenc3tCur1Oylve8Dzym1;anEeCua77;f0phABvCwa76;e56ie;!islaw,l6;lom1n9ZuC;leyma8ta;dCl7Fm1;!n6;aEeC;lCrm0;d1t1;h6One,qu0Uun,wn,y8;am9basti0k1Xl40rg3Zth,ymo9E;!tC;!ie,y;lDmCnti22q4Iul;!mAu4;ik,vato6S;aXeThe8ZiPoGuDyC;an,ou;b6IdDf9pe6NssC;!elAF;ol2Uy;an,bJcIdHel,geGh0la7EmFnEry,sDyC;!ce;coe,s;a92nA;an,eo;l3Jr;e4Qg3n6olfo,ri65;co,ky;bAe9R;cCl6;ar5Mc5LhDkCo;!ey,ie,y;a82ie;gDid,ub5x,yCza;ansh,nT;g8TiC;na8Ps;ch5Vfa4lEmDndCpha4sh6Rul,ymo6X;al9Vol2By;i9Fon;f,ph;ent2inC;cy,t1;aGeEhilDier5Zol,reC;st1;!ip,lip;d98rcy,tC;ar,e2V;b3Sdra6Ct44ul;ctav2Vliv3m93rGsDtCum8Rw5;is,to;aDc8PvC;al50;ma;i,vK;athKeIiEoC;aCel,l0ma0r2X;h,m;cDg4i3IkC;h6Rola;hol5UkCol5U;!ol5T;al,d,il,ls1vC;il4Y;anCy;!a4i4;aXeUiLoGuDyC;l21r1;hamDr5WstaC;fa,p4E;ed,mG;dibo,e,hamEis1XntDsCussa;es,he;e,y;ad,ed,mC;ad,ed;cHgu4kFlEnDtchC;!e7;a75ik;house,o04t1;e,olC;aj;ah,hCk6;a4eC;al,l;hDlv2rC;le,ri7v2;di,met;ck,hOlMmPnu4rIs1tEuricDxC;!imilian89we7;e,io;eo,hDi4ZtC;!eo,hew,ia;eCis;us,w;cEio,k83lDqu6Dsha7tCv2;i2Hy;in,on;!el,oLus;achCcolm,ik;ai,y;amCdi,moud;adC;ou;aReOiNlo2RoJuDyC;le,nd1;cFiEkCth3;aCe;!s;gi,s;as,iaC;no;g0nn6OrenEuCwe7;!iC;e,s;!zo;am,on4;a78evi,la4PnDonCst3vi;!a5Yel;!ny;mDnCr65ur4Rwr4R;ce,d1;ar,o4L;aJeEhaled,iCrist4Tu46y3A;er0p,rC;by,k,ollos;en0iFnCrmit,v2;!dDnCt5A;e0Zy;a7ri4L;r,th;na66rCthem;im,l;aZeRiPoEuC;an,liCst2;an,us;aqu2eKhnJnHrFsC;eDhCi79ue;!ua;!ph;dCge;an,i,on;!aCny;h,s,th4V;!ath4Uie,nA;!l,sCy;ph;an,e,mC;!mA;d,ffHrEsC;sCus;!e;a5HemDmai8oCry;me,ni0P;i6Sy;!e56rC;ey,y;cId5kHmGrEsDvi3yC;!d5s1;on,p3;ed,od,rCv4K;e4Xod;al,es,is1;e,ob,ub;k,ob,quC;es;aObrahNchika,gLkeKlija,nuJrHsEtCv0;ai,sC;uki;aCha0i6Dma4sac;ac,iaC;h,s;a,vinCw2;!g;k,nngu50;!r;nacCor;io;im;in,n;aKeGina4ToEuCyd54;be23gCmber4AsE;h,o;m3raBsCwa3V;se2;aEctDitDn4CrC;be1Ym0;or;th;bLlKmza,nJo,rEsDyC;a41d5;an,s0;lFo4DrEuCv6;hi3Yki,tC;a,o;is1y;an,ey;k,s;!im;ib;aReNiMlenLoJrFuC;illerDsC;!tavo;mo;aEegCov3;!g,orC;io,y;dy,h55nt;nzaCrd1;lo;!n;lbe4Ono,ovan4P;ne,oErC;aCry;ld,rd4S;ffr6rge;bri4l5rCv2;la1Xr3Cth,y;aReOiMlKorr0HrC;anEedCitz;!dAeCri22;ri21;cEkC;!ie,lC;in,yn;esJisC;!co,zek;etch3oC;yd;d4lConn;ip;deriDliCng,rnan01;pe,x;co;bi0di;arZdUfrTit0lNmHnGo2rDsteb0th0uge8vCym5zra;an,ere2U;gi,iDnCrol,v2w2;est44ie;c06k;och,rique,zo;aGerFiDmC;aFe2O;lCrh0;!io;s1y;nu4;be09d1iFliEmDt1viCwood;n,s;er,o;ot1Ts;!as,j43sC;ha;a2en;!dAg32mFuDwC;a25in;arC;do;o0Su0S;l,nC;est;aYeOiLoFrEuDwCyl0;ay8ight;a8dl6nc0st2;ag0ew;minicGnEri0ugDyC;le;!l03;!a29nCov0;e7ie,y;!k;armuDeCll1on,rk;go;id;anJj0lbeImetri9nGon,rFsEvDwCxt3;ay8ey;en,in;hawn,mo09;ek,ri0G;is,nCv3;is,y;rt;!dC;re;lLmJnIrEvC;e,iC;!d;en,iEne7rCyl;eCin,yl;l2Wn;n,o,us;e,i4ny;iCon;an,en,on;e,lC;as;a07e05hXiar0lMoHrFuDyrC;il,us;rtC;!is;aCistobal;ig;dy,lFnDrC;ey,neli9y;or,rC;ad;by,e,in,l2t1;aHeEiCyJ;fCnt;fo0Dt1;meDt9velaC;nd;nt;rEuDyC;!t1;de;enB;ce;aGeFrisDuC;ck;!tC;i0oph3;st3;d,rlCs;eCie;s,y;cCdric;il;lFmer1rC;ey,lDro7y;ll;!os,t1;eb,v2;ar03eVilUlaToQrDuCyr1;ddy,rtJ;aKeFiEuDyC;an,ce,on;ce,no;an,ce;nDtC;!t;dDtC;!on;an,on;dDndC;en,on;!foCl6y;rd;bDrCyd;is;!by;i8ke;al,lA;nGrCshoi;at,nDtC;!r11;aCie;rd0T;!edict,iDjam2nA;ie,y;to;n6rCt;eCy;tt;ey;ar0Yb0Od0Kgust2hm0Hid5ja0Fl00mYnQputsiPrGsaFuDveCya0ziz;ry;gust9st2;us;hi;aJchIi4jun,maGnEon,tCy0;hCu07;ur;av,oC;ld;an,nd;el;ie;ta;aq;dHgel06tC;hoFoC;i8nC;!i03y;ne;ny;reCy;!as,s,w;ir,mCos;ar;an,bePd5eJfGi,lFonEphonIt1vC;aNin;on;so,zo;an,en;onDrC;edQ;so;c,jaFksandEssaFxC;!and3;er;ar,er;ndC;ro;rtI;ni;en;ad,eC;d,t;in;aDolfCri0vik;!o;mCn;!a;dGeFraDuC;!bakr,lfazl;hCm;am;!l;allFel,oulaye,ulC;!lDrahm0;an;ah,o;ah;av,on",
    "FirstName": "true¦aEblair,cCdevBj8k6lashawn,m3nelly,quinn,re2sh0;ay,e0iloh;a,lby;g1ne;ar1el,org0;an;ion,lo;as8e0r9;ls7nyatta,rry;am0ess1ude;ie,m0;ie;an,on;as0heyenne;ey,sidy;lex1ndra,ubr0;ey;is",
    "LastName": "true¦0:33;1:3A;2:38;3:2X;4:2D;5:2Z;a3Ab30c2Nd2De2Af25g1Zh1Pi1Kj1Ek17l0Zm0Nn0Jo0Gp05rYsMtHvFwCxBy8zh6;a6ou,u;ng,o;a6eun2Toshi1Kun;ma6ng;da,guc1Zmo26sh21zaR;iao,u;a7il6o3right,u;li3As2;gn0lk0ng,tanabe;a6ivaldi;ssilj36zqu1;a9h8i2Fo7r6sui,urn0;an,ynisJ;lst0Prr1Uth;atch0omps2;kah0Vnaka,ylor;aEchDeChimizu,iBmiAo9t7u6zabo;ar1lliv29zuE;a6ein0;l22rm0;sa,u3;rn4th;lva,mmo23ngh;mjon4rrano;midt,neid0ulz;ito,n7sa6to;ki;ch1dLtos,z;amBeag1Yi9o7u6;bio,iz,sD;b6dri1LgIj0Tme23osevelt,ssi,ux;erts,ins2;c6ve0F;ci,hards2;ir1os;aEeAh8ic6ow1Z;as6hl0;so;a6illips;m,n1S;ders5et8r7t6;e0Nr4;ez,ry;ers;h20rk0t6vl4;el,te0J;baBg0Blivei01r6;t6w1N;ega,iz;a6eils2guy5ix2owak,ym1D;gy,ka6var1J;ji6muW;ma;aEeCiBo8u6;ll0n6rr0Bssolini,ñ6;oz;lina,oKr6zart;al0Me6r0T;au,no;hhail4ll0;rci0ssi6y0;!er;eWmmad4r6tsu07;in6tin1;!o;aCe8i6op1uo;!n6u;coln,dholm;fe7n0Pr6w0I;oy;bv6v6;re;mmy,rs5u;aBennedy,imuAle0Ko8u7wo6;k,n;mar,znets4;bay6vacs;asY;ra;hn,rl9to,ur,zl4;aAen9ha3imen1o6u3;h6nYu3;an6ns2;ss2;ki0Ds5;cks2nsse0C;glesi9ke8noue,shik7to,vano6;u,v;awa;da;as;aBe8itchcock,o7u6;!a3b0ghNynh;a3ffmann,rvat;mingw7nde6rM;rs2;ay;ns5rrPs7y6;asDes;an4hi6;moI;a9il,o8r7u6;o,tierr1;ayli3ub0;m1nzal1;nd6o,rcia;hi;er9lor8o7uj6;ita;st0urni0;es;nand1;d7insteHsposi6vaL;to;is2wards;aCeBi9omin8u6;bo6rand;is;gu1;az,mitr4;ov;lgado,vi;nkula,rw7vi6;es,s;in;aFhBlarkAo6;h5l6op0rbyn,x;em7li6;ns;an;!e;an8e7iu,o6ristens5u3we;i,ng,u3w,y;!n,on6u3;!g;mpb7rt0st6;ro;ell;aBe8ha3oyko,r6yrne;ooks,yant;ng;ck7ethov5nnett;en;er,ham;ch,h8iley,rn6;es,i0;er;k,ng;dDl9nd6;ers6rA;en,on,s2;on;eks7iy8var1;ez;ej6;ev;ams",
    "Person": "true¦ashton kutchRbQcLdJeHgastMhFinez,jDkClebron james,mBnettIoAp8r4s3t2v0;a0irgin maF;lentino rossi,n go3;heresa may,iger woods,yra banks;addam hussain,carlett johanssIlobodan milosevic,uA;ay romano,eese witherspoHo1ush limbau0;gh;d stewart,nald0;inho,o;a0ipI;lmHris hiltC;prah winfrEra;essiaen,itt romnDubarek;anye west,iefer sutherland,obe bryant;aime,effers8k rowli0;ng;alle ber0itlBulk hogan;ry;ff0meril lagasse,zekiel;ie;a0enzel washingt2ick wolf;lt1nte;ar1lint0ruz;on;dinal wols1son0;! palm2;ey;arack obama,rock;er"
  };

  const BASE = 36;
  const seq = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  const cache = seq.split('').reduce(function (h, c, i) {
    h[c] = i;
    return h
  }, {});

  // 0, 1, 2, ..., A, B, C, ..., 00, 01, ... AA, AB, AC, ..., AAA, AAB, ...
  const toAlphaCode = function (n) {
    if (seq[n] !== undefined) {
      return seq[n]
    }
    let places = 1;
    let range = BASE;
    let s = '';
    for (; n >= range; n -= range, places++, range *= BASE) {}
    while (places--) {
      const d = n % BASE;
      s = String.fromCharCode((d < 10 ? 48 : 55) + d) + s;
      n = (n - d) / BASE;
    }
    return s
  };

  const fromAlphaCode = function (s) {
    if (cache[s] !== undefined) {
      return cache[s]
    }
    let n = 0;
    let places = 1;
    let range = BASE;
    let pow = 1;
    for (; places < s.length; n += range, places++, range *= BASE) {}
    for (let i = s.length - 1; i >= 0; i--, pow *= BASE) {
      let d = s.charCodeAt(i) - 48;
      if (d > 10) {
        d -= 7;
      }
      n += d * pow;
    }
    return n
  };

  var encoding = {
    toAlphaCode,
    fromAlphaCode
  };

  const symbols = function (t) {
    //... process these lines
    const reSymbol = new RegExp('([0-9A-Z]+):([0-9A-Z]+)');
    for (let i = 0; i < t.nodes.length; i++) {
      const m = reSymbol.exec(t.nodes[i]);
      if (!m) {
        t.symCount = i;
        break
      }
      t.syms[encoding.fromAlphaCode(m[1])] = encoding.fromAlphaCode(m[2]);
    }
    //remove from main node list
    t.nodes = t.nodes.slice(t.symCount, t.nodes.length);
  };
  var parseSymbols = symbols;

  // References are either absolute (symbol) or relative (1 - based)
  const indexFromRef = function (trie, ref, index) {
    const dnode = encoding.fromAlphaCode(ref);
    if (dnode < trie.symCount) {
      return trie.syms[dnode]
    }
    return index + dnode + 1 - trie.symCount
  };

  const toArray$1 = function (trie) {
    const all = [];
    const crawl = (index, pref) => {
      let node = trie.nodes[index];
      if (node[0] === '!') {
        all.push(pref);
        node = node.slice(1); //ok, we tried. remove it.
      }
      const matches = node.split(/([A-Z0-9,]+)/g);
      for (let i = 0; i < matches.length; i += 2) {
        const str = matches[i];
        const ref = matches[i + 1];
        if (!str) {
          continue
        }
        const have = pref + str;
        //branch's end
        if (ref === ',' || ref === undefined) {
          all.push(have);
          continue
        }
        const newIndex = indexFromRef(trie, ref, index);
        crawl(newIndex, have);
      }
    };
    crawl(0, '');
    return all
  };

  //PackedTrie - Trie traversal of the Trie packed-string representation.
  const unpack$2 = function (str) {
    const trie = {
      nodes: str.split(';'),
      syms: [],
      symCount: 0
    };
    //process symbols, if they have them
    if (str.match(':')) {
      parseSymbols(trie);
    }
    return toArray$1(trie)
  };

  var traverse = unpack$2;

  const unpack = function (str) {
    if (!str) {
      return {}
    }
    //turn the weird string into a key-value object again
    const obj = str.split('|').reduce((h, s) => {
      const arr = s.split('¦');
      h[arr[0]] = arr[1];
      return h
    }, {});
    const all = {};
    Object.keys(obj).forEach(function (cat) {
      const arr = traverse(obj[cat]);
      //special case, for botched-boolean
      if (cat === 'true') {
        cat = true;
      }
      for (let i = 0; i < arr.length; i++) {
        const k = arr[i];
        if (all.hasOwnProperty(k) === true) {
          if (Array.isArray(all[k]) === false) {
            all[k] = [all[k], cat];
          } else {
            all[k].push(cat);
          }
        } else {
          all[k] = cat;
        }
      }
    });
    return all
  };

  var unpack$1 = unpack;

  const prefix$1 = /^.([0-9]+)/;

  // handle compressed form of key-value pair
  const getKeyVal = function (word, model) {
    let val = model.exceptions[word];
    let m = val.match(prefix$1);
    if (m === null) {
      // return not compressed form
      return model.exceptions[word]
    }
    // uncompress it
    let num = Number(m[1]) || 0;
    let pre = word.substr(0, num);
    return pre + val.replace(prefix$1, '')
  };

  // get suffix-rules according to last char of word
  const getRules = function (word, rules = {}) {
    let char = word[word.length - 1];
    let list = rules[char] || [];
    // do we have a generic suffix?
    if (rules['']) {
      list = list.concat(rules['']);
    }
    return list
  };

  const convert = function (word, model, debug) {
    // check list of irregulars
    if (model.exceptions.hasOwnProperty(word)) {
      if (debug) {
        console.log("exception, ", word, model.exceptions[word]);
      }
      return getKeyVal(word, model)
    }
    // if model is reversed, try rev rules
    let rules = model.rules;
    if (model.reversed) {
      rules = model.rev;
    }
    // try suffix rules
    rules = getRules(word, rules);
    for (let i = 0; i < rules.length; i += 1) {
      let suffix = rules[i][0];
      if (word.endsWith(suffix)) {
        if (debug) {
          console.log("rule, ", rules[i]);
        }
        let reg = new RegExp(suffix + '$');
        return word.replace(reg, rules[i][1])
      }
    }
    if (debug) {
      console.log(' x - ' + word);
    }
    // return the original word unchanged
    return word
  };
  var convert$1 = convert;

  // index rules by last-char
  const indexRules = function (rules) {
    let byChar = {};
    rules.forEach((a) => {
      let suff = a[0] || '';
      let char = suff[suff.length - 1] || '';
      byChar[char] = byChar[char] || [];
      byChar[char].push(a);
    });
    return byChar
  };

  const prefix = /^([0-9]+)/;

  const expand = function (key = '', val = '') {
    val = String(val);
    let m = val.match(prefix);
    if (m === null) {
      return [key, val]
    }
    let num = Number(m[1]) || 0;
    let pre = key.substring(0, num);
    let full = pre + val.replace(prefix, '');
    return [key, full]
  };

  const toArray = function (txt) {
    const pipe = /\|/;
    return txt.split(/,/).map(str => {
      let a = str.split(pipe);
      return expand(a[0], a[1])
    })
  };

  const uncompress = function (model = {}) {
    model = Object.assign({}, model);

    // compress fwd rules
    model.rules = toArray(model.rules);
    model.rules = indexRules(model.rules);

    // compress reverse rules
    if (model.rev) {
      model.rev = toArray(model.rev);
      model.rev = indexRules(model.rev);
    }

    // compress exceptions
    model.exceptions = toArray(model.exceptions);
    model.exceptions = model.exceptions.reduce((h, a) => {
      h[a[0]] = a[1];
      return h
    }, {});
    return model
  };
  var uncompress$1 = uncompress;

  // console.log(expand('fixture', '6ing'))
  // console.log(toArray('heard|4'))

  const reverseObj = function (obj) {
    return Object.entries(obj).reduce((h, a) => {
      h[a[1]] = a[0];
      return h
    }, {})
  };

  const reverse = function (model) {
    let { rules, exceptions, rev } = model;
    exceptions = reverseObj(exceptions);
    return {
      reversed: !Boolean(model.reversed),//toggle this
      rules,
      exceptions,
      rev
    }
  };
  var reverse$1 = reverse;

  // generated in ./lib/models
  var model$1 = {
    "presentTense": {
      "first": {
        "rules": "omenzar|2ienzo,raduar|3úo,spertar|2ierto,onfiar|3ío,ufrir|3o,ensar|ienso,omper|3o,orcer|uerzo,ormir|uermo,nviar|2ío,obernar|2ierno,uebrar|1iebro,uerer|1iero,gorar|1üero,isfacer|4go,trever|4o,oñar|ueño,contrar|1uentro,olgar|uelgo,jercer|3zo,aciar|2ío,enovar|2uevo,onfesar|3ieso,ruñir|3o,over|uevo,ehusar|2úso,aler|2go,ogar|uego,rohibir|3íbo,alir|2go,burrir|4o,orir|uero,oder|uedo,ntinuar|4úo,lmorzar|2uerzo,mpartir|5o,añer|2o,erder|ierdo,ravesar|3ieso,estir|isto,efender|2iendo,eber|2o,uiar|1ío,rrer|2o,pezar|1iezo,endar|iendo,tinguir|4o,meter|3o,cender|1iendo,hacer|2go,cordar|1uerdo,riar|1ío,eñir|iño,alentar|2iento,probar|2uebo,mitir|3o,eer|1o,mer|1o,vencer|3zo,vivir|3o,venir|3go,batir|3o,mostrar|1uestro,lir|1o,mir|1o,egir|ijo,edir|ido,reír|1ío,ostar|uesto,etir|ito,olver|uelvo,tender|1iendo,aer|1igo,decir|1igo,sistir|4o,tuar|1úo,brir|2o,entir|iento,vertir|1ierto,ger|jo,erir|iero,seguir|1igo,gir|jo,dir|1o,bir|1o,ducir|2zco,der|1o,uir|1yo,ner|1go,cer|zco,ar|o,omit|4o",
        "exceptions": "ir|voy,ser|1oy,negar|1iego,cerrar|1ierro,unir|2o,errar|yerro,servir|1irvo,jugar|2ego,sentar|1iento,oír|1igo,volar|1uelo,prever|5o,oler|huelo,caber|quepo,helar|1ielo,apretar|3ieto,dar|1oy,sonar|1ueno,regar|1iego,saber|1é,contar|1uento,estar|3oy,soler|1uelo,hervir|1iervo,ver|2o,beber|3o,torcer|1uerzo,querer|2iero,correr|4o,medir|1ido,leer|2o,temer|3o,elegir|2ijo,vender|4o,mover|1uevo,valer|3go,rogar|1uego,comer|3o,salir|3go,poder|1uedo,freír|2ío,tañer|3o,reír|1ío,deber|3o,abrir|3o,vestir|1isto",
        "rev": "omienzo|2enzar,rotejo|4ger,spierto|2ertar,ufro|3ir,ienso|ensar,ompo|3er,onrío|3eír,ierro|errar,arro|3er,uermo|ormir,errito|3etir,eriendo|2endar,obierno|2ernar,xijo|2gir,uiebro|1ebrar,güero|1orar,tisfago|5cer,irvo|ervir,ecido|4ir,trevo|4er,ueño|oñar,onsumo|5ir,ucedo|4er,cuentro|1ontrar,uelgo|olgar,acudo|4ir,jerzo|3cer,enuevo|2ovar,reo|2er,urjo|2gir,omito|4,ruño|3ir,ubo|2ir,ehúso|2usar,rohíbo|3ibir,burro|4ir,uero|orir,ambullo|6ir,injo|2gir,ielo|elar,lmuerzo|2orzar,prieto|2etar,omparto|6ir,flijo|3gir,ierdo|erder,ueno|onar,umplo|4ir,ñado|3ir,ependo|5er,irijo|3gir,nvado|4ir,fendo|4er,plaudo|5ir,omiendo|2endar,uento|ontar,iervo|ervir,iego|egar,primo|4ir,pido|1edir,piezo|1ezar,tingo|4uir,meto|3er,hago|2cer,cuerdo|1ordar,iño|eñir,aliento|2entar,ondo|3er,pruebo|2obar,veo|2r,mito|3ir,ieso|esar,venzo|3cer,vivo|3ir,vengo|3ir,bato|3ir,pito|1etir,muestro|1ostrar,rijo|1egir,cubro|4ir,prendo|5er,uesto|ostar,uelvo|olver,aigo|1er,digo|1ecir,sisto|4ir,cojo|2ger,iento|entir,vierto|1ertir,iero|erir,sigo|1eguir,ibo|2ir,úo|uar,duzco|2cir,iendo|ender,ío|iar,uyo|1ir,ngo|1er,zco|cer,o|ar,é|aber,stoy|2ar"
      },
      "second": {
        "rules": "omenzar|2ienzas,raduar|3úas,spertar|2iertas,onfiar|3ías,ufrir|3es,ensar|iensas,orcer|uerces,ormir|uermes,nviar|2ías,obernar|2iernas,uebrar|1iebras,uerer|1ieres,gorar|1üeras,oñar|ueñas,contrar|1uentras,olgar|uelgas,aciar|2ías,enovar|2uevas,onfesar|3iesas,ruñir|3es,over|ueves,ehusar|2úsas,ogar|uegas,rohibir|3íbes,burrir|4es,orir|ueres,oder|uedes,ntinuar|4úas,lmorzar|2uerzas,mpartir|5es,erder|ierdes,ravesar|3iesas,estir|istes,efender|2iendes,uiar|1ías,pezar|1iezas,endar|iendas,tinguir|5es,cender|1iendes,cordar|1uerdas,riar|1ías,eñir|iñes,alentar|2ientas,probar|2uebas,mitir|3es,vivir|3es,venir|1ienes,batir|3es,mostrar|1uestras,mir|1es,egir|iges,edir|ides,reír|1íes,ostar|uestas,etir|ites,olver|uelves,tender|1iendes,decir|1ices,sistir|4es,tuar|1úas,lir|1es,brir|2es,vertir|1iertes,erir|ieres,seguir|1igues,entir|ientes,gir|1es,dir|1es,bir|1es,ducir|3es,tener|1ienes,uir|1yes,r|s,omit|4as",
        "exceptions": "ir|vas,ser|eres,negar|1iegas,cerrar|1ierras,unir|2es,errar|yerras,servir|1irves,jugar|2egas,sentar|1ientas,oír|1yes,volar|1uelas,prever|4és,oler|hueles,helar|1ielas,apretar|3ietas,sonar|1uenas,regar|1iegas,contar|1uentas,estar|3ás,soler|1ueles,hervir|1ierves,querer|2ieres,elegir|2iges,rogar|1uegas,salir|3es,vestir|1istes",
        "rev": "mienzas|1enzar,piertas|1ertar,ufres|3ir,iensas|ensar,uerces|orcer,ierras|errar,uermes|ormir,biernas|1ernar,xiges|3ir,uiebras|1ebrar,güeras|1orar,irves|ervir,ecides|4ir,ueñas|oñar,uelas|olar,onsumes|5ir,uentras|ontrar,uelgas|olgar,revés|3er,enuevas|2ovar,urges|3ir,omitas|4,ruñes|3ir,ubes|2ir,ueves|over,ehúsas|2usar,rohíbes|3ibir,burres|4ir,ueres|orir,uedes|oder,mbulles|5ir,inges|3ir,ielas|elar,muerzas|1orzar,prietas|2etar,mpartes|5ir,fliges|4ir,ierdes|erder,uenas|onar,umples|4ir,iriges|4ir,uentas|ontar,stás|2ar,ierves|ervir,iegas|egar,primes|4ir,piezas|1ezar,iendas|endar,tingues|5ir,cuerdas|1ordar,uestras|ostrar,iñes|eñir,pruebas|2obar,udes|2ir,mites|3ir,iesas|esar,vives|3ir,vienes|1enir,bates|3ir,riges|1egir,ades|2ir,ides|edir,ríes|1eír,uestas|ostar,ites|etir,uelves|olver,ientas|entar,dices|1ecir,sistes|4ir,bres|2ir,viertes|1ertir,ieres|erir,sigues|1eguir,ibes|2ir,ientes|entir,úas|uar,duces|3ir,iendes|ender,tienes|1ener,ías|iar,uyes|1ir,s|r"
      },
      "third": {
        "rules": "omenzar|2ienza,raduar|3úa,spertar|2ierta,onfiar|3ía,ufrir|3e,ensar|iensa,orcer|uerce,ormir|uerme,nviar|2ía,obernar|2ierna,uebrar|1iebra,uerer|1iere,gorar|1üera,oñar|ueña,contrar|1uentra,olgar|uelga,aciar|2ía,enovar|2ueva,onfesar|3iesa,ruñir|3e,over|ueve,ehusar|2úsa,ogar|uega,rohibir|3íbe,burrir|4e,orir|uere,oder|uede,ntinuar|4úa,lmorzar|2uerza,mpartir|5e,erder|ierde,ravesar|3iesa,estir|iste,efender|2iende,uiar|1ía,pezar|1ieza,endar|ienda,tinguir|5e,cender|1iende,cordar|1uerda,riar|1ía,eñir|iñe,alentar|2ienta,probar|2ueba,mitir|3e,vivir|3e,venir|1iene,batir|3e,mostrar|1uestra,mir|1e,egir|ige,edir|ide,reír|1íe,ostar|uesta,etir|ite,olver|uelve,tender|1iende,decir|1ice,sistir|4e,tuar|1úa,lir|1e,brir|2e,vertir|1ierte,erir|iere,seguir|1igue,entir|iente,gir|1e,dir|1e,bir|1e,ducir|3e,tener|1iene,uir|1ye,r|,omit|4a",
        "exceptions": "ir|va,ser|es,negar|1iega,cerrar|1ierra,unir|2e,errar|yerra,servir|1irve,jugar|2ega,sentar|1ienta,oír|1ye,volar|1uela,prever|4é,oler|huele,helar|1iela,apretar|3ieta,sonar|1uena,regar|1iega,contar|1uenta,estar|3á,soler|1uele,hervir|1ierve,querer|2iere,elegir|2ige,valer|4,rogar|1uega,salir|3e,vestir|1iste,ver|2",
        "rev": "omienza|2enzar,spierta|2ertar,iensa|ensar,ierra|errar,obierna|2ernar,uiebra|1ebrar,güera|1orar,ueña|oñar,uela|olar,cuentra|1ontrar,uelga|olgar,enueva|2ovar,omita|4,ehúsa|2usar,iela|elar,lmuerza|2orzar,prieta|2etar,uena|onar,uenta|ontar,iega|egar,pieza|1ezar,ienda|endar,cuerda|1ordar,prueba|2obar,iesa|esar,muestra|1ostrar,uesta|ostar,ienta|entar,úa|uar,ía|iar,a|1r,rotege|6r,ufre|3ir,ompe|4r,uerce|orcer,uerme|ormir,xige|3ir,irve|ervir,ecide|4ir,treve|5r,onsume|5ir,ucede|5r,eme|3r,urge|3ir,ruñe|3ir,ube|2ir,ueve|over,rohíbe|3ibir,ome|3r,burre|4ir,uere|orir,uede|oder,ambulle|6ir,inge|3ir,omparte|6ir,añe|3r,flige|4ir,ierde|erder,umple|4ir,irige|4ir,ierve|ervir,ebe|3r,prime|4ir,rre|3r,tingue|5ir,mete|4r,iñe|eñir,ude|2ir,mite|3ir,ee|2r,vive|3ir,viene|1enir,bate|3ir,rige|1egir,abe|3r,ade|2ir,ide|edir,ríe|1eír,ite|etir,uelve|olver,ae|2r,dice|1ecir,siste|4ir,coge|4r,bre|2ir,vierte|1ertir,iere|erir,sigue|1eguir,ibe|2ir,iente|entir,pone|4r,duce|3ir,iende|ender,tiene|1ener,nde|3r,uye|1ir,ce|2r,revé|3er,stá|2ar"
      },
      "firstPlural": {
        "rules": "omit|4amos,r|mos",
        "exceptions": "ir|vamos,ser|1omos",
        "rev": "omos|er,mitamos|3,mos|r"
      },
      "secondPlural": {
        "rules": "omit|4áis,ír|1s,er|éis,ir|ís,ar|áis",
        "exceptions": "ir|vais,ser|1ois,dar|2is,ver|2is,oír|2s",
        "rev": "ois|er,omitáis|4,eis|1r,reís|3r,éis|er,ís|ir,áis|ar"
      },
      "thirdPlural": {
        "rules": "omenzar|2ienzan,raduar|3úan,spertar|2iertan,onfiar|3ían,ufrir|3en,ensar|iensan,orcer|uercen,ormir|uermen,nviar|2ían,obernar|2iernan,uebrar|1iebran,uerer|1ieren,gorar|1üeran,oñar|ueñan,contrar|1uentran,olgar|uelgan,aciar|2ían,enovar|2uevan,onfesar|3iesan,ruñir|3en,over|ueven,ehusar|2úsan,ogar|uegan,rohibir|3íben,burrir|4en,orir|ueren,oder|ueden,ntinuar|4úan,lmorzar|2uerzan,mpartir|5en,erder|ierden,ravesar|3iesan,estir|isten,efender|2ienden,uiar|1ían,pezar|1iezan,endar|iendan,tinguir|5en,cender|1ienden,cordar|1uerdan,riar|1ían,eñir|iñen,alentar|2ientan,probar|2ueban,mitir|3en,vivir|3en,venir|1ienen,batir|3en,mostrar|1uestran,mir|1en,egir|igen,edir|iden,reír|1íen,ostar|uestan,etir|iten,olver|uelven,tender|1ienden,decir|1icen,sistir|4en,tuar|1úan,lir|1en,brir|2en,vertir|1ierten,erir|ieren,seguir|1iguen,entir|ienten,gir|1en,dir|1en,bir|1en,ducir|3en,tener|1ienen,uir|1yen,r|n,omit|4an",
        "exceptions": "ir|van,ser|1on,negar|1iegan,cerrar|1ierran,unir|2en,errar|yerran,servir|1irven,jugar|2egan,sentar|1ientan,oír|1yen,volar|1uelan,prever|4én,oler|huelen,helar|1ielan,apretar|3ietan,sonar|1uenan,regar|1iegan,contar|1uentan,estar|3án,soler|1uelen,hervir|1ierven,querer|2ieren,elegir|2igen,rogar|1uegan,salir|3en,vestir|1isten",
        "rev": "mienzan|1enzar,on|er,piertan|1ertar,ufren|3ir,iensan|ensar,uercen|orcer,ierran|errar,uermen|ormir,biernan|1ernar,xigen|3ir,uiebran|1ebrar,güeran|1orar,irven|ervir,eciden|4ir,ueñan|oñar,uelan|olar,onsumen|5ir,uentran|ontrar,uelgan|olgar,revén|3er,enuevan|2ovar,urgen|3ir,omitan|4,ruñen|3ir,uben|2ir,ueven|over,ehúsan|2usar,rohíben|3ibir,burren|4ir,ueren|orir,ueden|oder,mbullen|5ir,ingen|3ir,ielan|elar,muerzan|1orzar,prietan|2etar,mparten|5ir,fligen|4ir,ierden|erder,uenan|onar,umplen|4ir,irigen|4ir,uentan|ontar,stán|2ar,ierven|ervir,iegan|egar,primen|4ir,piezan|1ezar,iendan|endar,tinguen|5ir,cuerdan|1ordar,uestran|ostrar,iñen|eñir,prueban|2obar,uden|2ir,miten|3ir,iesan|esar,viven|3ir,vienen|1enir,baten|3ir,rigen|1egir,aden|2ir,iden|edir,ríen|1eír,uestan|ostar,iten|etir,uelven|olver,ientan|entar,dicen|1ecir,sisten|4ir,bren|2ir,vierten|1ertir,ieren|erir,siguen|1eguir,iben|2ir,ienten|entir,úan|uar,ducen|3ir,ienden|ender,tienen|1ener,ían|iar,uyen|1ir,n|r"
      }
    },
    "pastTense": {
      "first": {
        "rules": "uerer|1ise,isfacer|3ice,eriguar|4üé,oder|ude,hacer|1ice,traer|3je,venir|1ine,aber|upe,decir|1ije,ír|1,poner|1use,ducir|2je,tener|1uve,gar|1ué,zar|cé,car|qué,er|í,ir|í,ar|é,ecarse|1qué,verse|1í,irse|í,arse|é,omit|4é",
        "exceptions": "ir|fui,andar|3uve,dar|1i,guiar|3e,estar|3uve,ver|1i,juntarse|4é,oír|2,prepararse|6é,prever|4í,mudarse|3é,leer|2í,creer|3í,hallarse|4é,valer|3í,sentirse|4í",
        "rev": "oví|2erse,rotegí|5er,ompí|3er,arrí|3er,orrí|3er,treví|4erse,ucedí|4er,emí|2er,repentí|6irse,omí|2er,ambullí|6irse,aí|1er,añí|2er,erdí|3er,ebí|2er,metí|3er,osí|2er,olí|2er,reí|3r,olví|3er,cogí|3er,ndí|2er,cí|1er,í|ir,nduve|2ar,uise|1erer,ude|oder,uie|2ar,stuve|2ar,traje|3er,vine|1enir,upe|aber,ice|acer,dije|1ecir,puse|1oner,duje|2cir,tuve|1ener,nteré|4arse,uedé|3arse,ronceé|5arse,equé|1carse,lamé|3arse,acté|3arse,omité|4,feité|4arse,verigüé|5uar,uejé|3arse,gué|1ar,cé|zar,qué|car,é|ar"
      },
      "second": {
        "rules": "uerer|1isiste,isfacer|3iciste,oder|udiste,hacer|1iciste,traer|3jiste,eer|1íste,venir|1iniste,aber|upiste,decir|1ijiste,poner|1usiste,ducir|2jiste,tener|1uviste,er|iste,r|ste,omit|4aste,verse|1iste,rse|ste",
        "exceptions": "ir|fuiste,andar|3uviste,caer|2íste,dar|1iste,estar|3uviste,atreverse|5iste,juntarse|5ste,prepararse|7ste,prever|4iste,mudarse|4ste,leer|2íste,creer|3íste,hallarse|5ste,valer|3iste,arrepentirse|9ste,poder|1udiste,sentirse|5ste,ver|1iste",
        "rev": "oviste|2erse,duviste|1ar,teraste|4rse,tegiste|3er,ompiste|3er,arriste|3er,uedaste|4rse,nceaste|4rse,uisiste|1erer,ecaste|3rse,orriste|3er,lamaste|4rse,cediste|3er,actaste|4rse,emiste|2er,mitaste|3,eitaste|4rse,omiste|2er,ulliste|4rse,uejaste|4rse,aíste|1er,añiste|2er,erdiste|3er,ebiste|2er,metiste|3er,rajiste|2er,osiste|2er,viniste|1enir,upiste|aber,oliste|2er,iciste|acer,olviste|3er,dijiste|1ecir,cogiste|3er,pusiste|1oner,dujiste|2cir,tuviste|1ener,ndiste|2er,ciste|1er,ste|r"
      },
      "third": {
        "rules": "ufrir|4ó,ormir|urmió,uerer|1iso,isfacer|3izo,ruñir|3ó,burrir|5ó,orir|urió,oder|udo,mpartir|6ó,añer|2ó,estir|istió,reír|1ió,tinguir|6ó,hacer|1izo,ervir|irvió,eñir|iñó,traer|3jo,mitir|4ó,eer|1yó,vivir|4ó,venir|1ino,batir|4ó,lir|2ó,aber|upo,entir|intió,mir|2ó,egir|igió,edir|idió,etir|itió,decir|1ijo,sistir|5ó,brir|3ó,vertir|1irtió,erir|irió,seguir|1iguió,gir|2ó,dir|2ó,poner|1uso,ducir|2jo,tener|1uvo,bir|2ó,uir|1yó,er|ió,ar|ó,omit|4ó,ullirse|3ó,verse|1ió,entirse|intió,arse|ó",
        "exceptions": "ir|fue,andar|3uvo,unir|3ó,criar|3o,oír|1yó,caer|2yó,dar|1io,guiar|3o,reír|1io,estar|3uvo,ver|1io,yacer|3ió,crecer|4ió,torcer|4ió,juntarse|4ó,prepararse|6ó,prever|4ió,mudarse|3ó,elegir|2igió,hallarse|4ó,salir|4ó,sentirse|1intió,freír|2ió,tañer|3ó,vestir|1istió",
        "rev": "ovió|2erse,loreció|5er,nteró|4arse,rotegió|5er,onteció|5er,ufrió|4r,ompió|3er,onrió|3eír,uedó|3arse,urmió|ormir,nió|2r,ronceó|5arse,xigió|4r,ecó|2arse,ecidió|5r,trevió|4erse,lamó|3arse,onsumió|6r,ucedió|4er,acudió|5r,jerció|4er,freció|4er,actó|3arse,emió|2er,urgió|4r,omitó|4,ruñó|3ir,feitó|4arse,epintió|2entirse,omió|2er,burrió|5r,urió|orir,vejeció|5er,ambulló|6irse,ingió|4r,uejó|3arse,ayó|1er,mpartió|6r,fligió|5r,erdió|3er,umplió|5r,irigió|5r,plaudió|6r,ereció|4er,ebió|2er,primió|5r,rrió|2er,leció|3er,tinguió|6r,metió|3er,irvió|ervir,iñó|eñir,queció|4er,mitió|4r,eyó|1er,osió|2er,nació|3er,venció|4er,vivió|4r,batió|4r,rigió|1egir,adió|3r,conoció|5er,intió|entir,idió|edir,itió|etir,olvió|3er,neció|3er,pareció|5er,sistió|5r,lió|1er,cogió|3er,brió|3r,virtió|1ertir,deció|3er,irió|erir,siguió|1eguir,bió|2r,uyó|1ir,ndió|2er,ó|ar,nduvo|2ar,uiso|1erer,udo|oder,uio|2ar,stuvo|2ar,trajo|3er,vino|1enir,upo|aber,izo|acer,dijo|1ecir,puso|1oner,dujo|2cir,tuvo|1ener"
      },
      "firstPlural": {
        "rules": "uerer|1isimos,isfacer|3icimos,oder|udimos,hacer|1icimos,traer|3jimos,eer|1ímos,venir|1inimos,aber|upimos,decir|1ijimos,poner|1usimos,ducir|2jimos,tener|1uvimos,er|imos,r|mos,omit|4amos,verse|1imos,rse|mos",
        "exceptions": "ir|fuimos,andar|3uvimos,caer|2ímos,dar|1imos,estar|3uvimos,atreverse|5imos,juntarse|5mos,prepararse|7mos,prever|4imos,mudarse|4mos,leer|2ímos,creer|3ímos,hallarse|5mos,valer|3imos,arrepentirse|9mos,poder|1udimos,sentirse|5mos,ver|1imos",
        "rev": "ovimos|2erse,duvimos|1ar,teramos|4rse,tegimos|3er,ompimos|3er,arrimos|3er,uedamos|4rse,nceamos|4rse,uisimos|1erer,ecamos|3rse,orrimos|3er,lamamos|4rse,cedimos|3er,actamos|4rse,emimos|2er,mitamos|3,eitamos|4rse,omimos|2er,ullimos|4rse,uejamos|4rse,aímos|1er,añimos|2er,erdimos|3er,ebimos|2er,metimos|3er,rajimos|2er,osimos|2er,vinimos|1enir,upimos|aber,olimos|2er,icimos|acer,olvimos|3er,dijimos|1ecir,cogimos|3er,pusimos|1oner,dujimos|2cir,tuvimos|1ener,ndimos|2er,cimos|1er,mos|r"
      },
      "secondPlural": {
        "rules": "uerer|1isisteis,isfacer|3icisteis,oder|udisteis,hacer|1icisteis,traer|3jisteis,eer|1ísteis,venir|1inisteis,aber|upisteis,decir|1ijisteis,poner|1usisteis,ducir|2jisteis,tener|1uvisteis,er|isteis,r|steis,omit|4asteis,verse|1isteis,rse|steis",
        "exceptions": "ir|fuisteis,andar|3uvisteis,caer|2ísteis,dar|1isteis,estar|3uvisteis,beber|3isteis,componer|4usisteis,moverse|3isteis,oponer|2usisteis,enterarse|6steis,proteger|6isteis,aprender|6isteis,romper|4isteis,barrer|4isteis,quedarse|5steis,broncearse|7steis,querer|2isisteis,prometer|6isteis,satisfacer|6icisteis,secarse|4steis,descender|7isteis,meter|3isteis,deshacer|4icisteis,resolver|6isteis,hacer|1icisteis,correr|4isteis,entretener|6uvisteis,atreverse|5isteis,extender|6isteis,juntarse|5steis,prepararse|7steis,llamarse|5steis,atraer|4jisteis,comprender|8isteis,suceder|5isteis,bendecir|4ijisteis,entender|6isteis,responder|7isteis,venir|1inisteis,encender|6isteis,prever|4isteis,oler|2isteis,mudarse|4steis,traer|3jisteis,leer|2ísteis,coser|3isteis,jactarse|5steis,temer|3isteis,creer|3ísteis,tener|1uvisteis,predecir|4ijisteis,vomit|5asteis,escoger|5isteis,coger|3isteis,proponer|4usisteis,vender|4isteis,convenir|4inisteis,hallarse|5steis,devolver|6isteis,valer|3isteis,afeitarse|6steis,suponer|3usisteis,arrepentirse|9steis,comer|3isteis,poner|1usisteis,esconder|6isteis,poder|1udisteis,caber|1upisteis,sorprender|8isteis,contener|4uvisteis,zambullirse|8steis,sentirse|5steis,toser|3isteis,quejarse|5steis,recoger|5isteis,detener|3uvisteis,tañer|3isteis,perder|4isteis,depender|6isteis,volver|4isteis,decir|1ijisteis,atender|5isteis,saber|1upisteis,deber|3isteis,obtener|3uvisteis,ofender|5isteis,soler|3isteis,defender|6isteis,mantener|4uvisteis,ver|1isteis,exponer|3usisteis",
        "rev": "aísteis|1er,jisteis|cir,cisteis|1er,steis|r"
      },
      "thirdPlural": {
        "rules": "ufrir|4eron,omper|3ieron,ormir|urmieron,uerer|1isieron,isfacer|3icieron,ruñir|3eron,burrir|5eron,orir|urieron,oder|udieron,mpartir|6eron,estir|istieron,eber|2ieron,rrer|2ieron,tinguir|6eron,meter|3ieron,hacer|1icieron,ervir|irvieron,eñir|iñeron,traer|3jeron,mitir|4eron,eer|1yeron,oser|2ieron,mer|1ieron,vivir|4eron,venir|1inieron,batir|4eron,lir|2eron,aber|upieron,entir|intieron,mir|2eron,egir|igieron,edir|idieron,reír|1ieron,etir|itieron,decir|1ijeron,sistir|5eron,ler|1ieron,brir|3eron,vertir|1irtieron,ger|1ieron,erir|irieron,seguir|1iguieron,gir|2eron,ver|1ieron,dir|2eron,poner|1usieron,ducir|2jeron,tener|1uvieron,bir|2eron,uir|1yeron,der|1ieron,cer|1ieron,r|1on,omit|4aron,ullirse|3eron,verse|1ieron,entirse|intieron,arse|2on",
        "exceptions": "ir|fueron,andar|3uvieron,unir|3eron,oír|1yeron,caer|2yeron,dar|1ieron,estar|3uvieron,consentir|4intieron,divertir|3irtieron,presentir|4intieron,regir|1igieron,sufrir|5eron,dormir|1urmieron,exigir|5eron,extinguir|8eron,advertir|3irtieron,servir|1irvieron,decidir|6eron,atreverse|5ieron,juntarse|6on,prepararse|8on,conseguir|4iguieron,convertir|4irtieron,prever|4ieron,admitir|6eron,mudarse|5on,elegir|2igieron,perseguir|4iguieron,hallarse|6on,corregir|4igieron,arrepentirse|5intieron,salir|4eron,aburrir|6eron,permitir|7eron,poder|1udieron,distinguir|9eron,sentirse|1intieron,freír|2ieron,compartir|8eron,seguir|1iguieron,afligir|6eron,mentir|1intieron,invertir|3irtieron,dirigir|6eron,reír|1ieron,vestir|1istieron,hervir|1irvieron,ver|1ieron,proseguir|4iguieron",
        "rev": "ovieron|2erse,teraron|5se,egieron|2er,mpieron|2er,nrieron|2eír,uedaron|5se,ncearon|5se,isieron|erer,ecaron|4se,lamaron|5se,umieron|3r,actaron|5se,emieron|2er,rgieron|3r,mitaron|3,ruñeron|3ir,eitaron|5se,omieron|2er,urieron|orir,ulleron|3irse,ngieron|3r,uejaron|5se,ayeron|1er,plieron|3r,ebieron|2er,imieron|3r,rrieron|2er,etieron|2er,ivieron|3r,iñeron|eñir,rajeron|2er,udieron|3r,inieron|enir,eyeron|1er,osieron|2er,atieron|3r,upieron|aber,adieron|3r,idieron|edir,itieron|etir,icieron|acer,lvieron|2er,dijeron|1ecir,stieron|3r,lieron|1er,ogieron|2er,brieron|3r,irieron|erir,usieron|oner,dujeron|2cir,uvieron|ener,bieron|2r,uyeron|1ir,dieron|1er,cieron|1er,ron|1"
      }
    },
    "futureTense": {
      "first": {
        "rules": "uerer|3ré,isfacer|4ré,aler|2dré,alir|2dré,oder|2ré,hacer|2ré,venir|3dré,aber|2ré,ír|iré,ner|1dré,r|1é,omit|4aré,rse|1é",
        "exceptions": "decir|1iré,hacer|2ré,juntarse|6é,oír|1iré,prepararse|8é,mudarse|5é,hallarse|6é,salir|3dré,sentirse|6é",
        "rev": "overé|4se,nteraré|6se,uedaré|5se,oncearé|6se,uerré|3er,tisfaré|5cer,ecaré|4se,esharé|4cer,treveré|6se,lamaré|5se,actaré|5se,omitaré|4,feitaré|6se,pentiré|6se,odré|2er,bulliré|6se,uejaré|5se,vendré|3ir,abré|2er,reiré|2ír,dré|er,ré|1"
      },
      "second": {
        "rules": "uerer|3rás,isfacer|4rás,aler|2drás,alir|2drás,oder|2rás,hacer|2rás,venir|3drás,aber|2rás,ír|irás,ner|1drás,r|1ás,omit|4arás,rse|1ás",
        "exceptions": "decir|1irás,hacer|2rás,atreverse|7ás,juntarse|6ás,oír|1irás,prepararse|8ás,mudarse|5ás,hallarse|6ás,arrepentirse|10ás,salir|3drás,sentirse|6ás",
        "rev": "overás|4se,terarás|5se,uedarás|5se,ncearás|5se,uerrás|3er,isfarás|4cer,ecarás|4se,esharás|4cer,lamarás|5se,actarás|5se,mitarás|3,eitarás|5se,odrás|2er,ullirás|5se,uejarás|5se,vendrás|3ir,abrás|2er,reirás|2ír,drás|er,rás|1"
      },
      "third": {
        "rules": "uerer|3rá,isfacer|4rá,aler|2drá,alir|2drá,oder|2rá,hacer|2rá,venir|3drá,aber|2rá,ír|irá,ner|1drá,r|1á,omit|4ará,rse|1á",
        "exceptions": "decir|1irá,hacer|2rá,juntarse|6á,oír|1irá,prepararse|8á,mudarse|5á,hallarse|6á,salir|3drá,sentirse|6á",
        "rev": "overá|4se,nterará|6se,uedará|5se,onceará|6se,uerrá|3er,tisfará|5cer,ecará|4se,eshará|4cer,treverá|6se,lamará|5se,actará|5se,omitará|4,feitará|6se,pentirá|6se,odrá|2er,bullirá|6se,uejará|5se,vendrá|3ir,abrá|2er,reirá|2ír,drá|er,rá|1"
      },
      "firstPlural": {
        "rules": "uerer|3remos,isfacer|4remos,aler|2dremos,alir|2dremos,oder|2remos,hacer|2remos,venir|3dremos,aber|2remos,ír|iremos,ner|1dremos,r|1emos,omit|4aremos,rse|1emos",
        "exceptions": "decir|1iremos,moverse|5emos,enterarse|7emos,quedarse|6emos,broncearse|8emos,satisfacer|7remos,secarse|5emos,deshacer|5remos,hacer|2remos,atreverse|7emos,juntarse|6emos,oír|1iremos,prepararse|8emos,llamarse|6emos,venir|3dremos,mudarse|5emos,jactarse|6emos,vomit|5aremos,convenir|6dremos,hallarse|6emos,afeitarse|7emos,arrepentirse|10emos,salir|3dremos,zambullirse|9emos,sentirse|6emos,quejarse|6emos",
        "rev": "erremos|2er,odremos|2er,abremos|2er,eiremos|1ír,dremos|er,remos|1"
      },
      "secondPlural": {
        "rules": "uerer|3réis,isfacer|4réis,aler|2dréis,alir|2dréis,oder|2réis,hacer|2réis,venir|3dréis,aber|2réis,ír|iréis,ner|1dréis,r|1éis,omit|4aréis,rse|1éis",
        "exceptions": "decir|1iréis,enterarse|7éis,quedarse|6éis,broncearse|8éis,hacer|2réis,atreverse|7éis,juntarse|6éis,oír|1iréis,prepararse|8éis,llamarse|6éis,venir|3dréis,mudarse|5éis,vomit|5aréis,convenir|6dréis,hallarse|6éis,afeitarse|7éis,arrepentirse|10éis,salir|3dréis,sentirse|6éis,quejarse|6éis",
        "rev": "overéis|4se,uerréis|3er,sfaréis|3cer,ecaréis|4se,sharéis|3cer,ctaréis|4se,odréis|2er,lliréis|4se,abréis|2er,reiréis|2ír,dréis|er,réis|1"
      },
      "thirdPlural": {
        "rules": "uerer|3rán,isfacer|4rán,aler|2drán,alir|2drán,oder|2rán,hacer|2rán,venir|3drán,aber|2rán,ír|irán,ner|1drán,r|1án,omit|4arán,rse|1án",
        "exceptions": "decir|1irán,hacer|2rán,atreverse|7án,juntarse|6án,oír|1irán,prepararse|8án,mudarse|5án,hallarse|6án,arrepentirse|10án,salir|3drán,sentirse|6án",
        "rev": "overán|4se,terarán|5se,uedarán|5se,ncearán|5se,uerrán|3er,isfarán|4cer,ecarán|4se,esharán|4cer,lamarán|5se,actarán|5se,mitarán|3,eitarán|5se,odrán|2er,ullirán|5se,uejarán|5se,vendrán|3ir,abrán|2er,reirán|2ír,drán|er,rán|1"
      }
    },
    "conditional": {
      "first": {
        "rules": "uerer|3ría,isfacer|4ría,aler|2dría,alir|2dría,oder|2ría,hacer|2ría,venir|3dría,aber|2ría,ír|iría,ner|1dría,r|1ía,omit|4aría,rse|1ía",
        "exceptions": "decir|1iría,hacer|2ría,atreverse|7ía,juntarse|6ía,oír|1iría,prepararse|8ía,mudarse|5ía,hallarse|6ía,arrepentirse|10ía,salir|3dría,sentirse|6ía",
        "rev": "overía|4se,teraría|5se,uedaría|5se,ncearía|5se,uerría|3er,isfaría|4cer,ecaría|4se,esharía|4cer,lamaría|5se,actaría|5se,mitaría|3,eitaría|5se,odría|2er,ulliría|5se,uejaría|5se,vendría|3ir,abría|2er,reiría|2ír,dría|er,ría|1"
      },
      "second": {
        "rules": "uerer|3rías,isfacer|4rías,aler|2drías,alir|2drías,oder|2rías,hacer|2rías,venir|3drías,aber|2rías,ír|irías,ner|1drías,r|1ías,omit|4arías,rse|1ías",
        "exceptions": "decir|1irías,enterarse|7ías,quedarse|6ías,broncearse|8ías,hacer|2rías,atreverse|7ías,juntarse|6ías,oír|1irías,prepararse|8ías,llamarse|6ías,venir|3drías,mudarse|5ías,vomit|5arías,convenir|6drías,hallarse|6ías,afeitarse|7ías,arrepentirse|10ías,salir|3drías,sentirse|6ías,quejarse|6ías",
        "rev": "overías|4se,uerrías|3er,sfarías|3cer,ecarías|4se,sharías|3cer,ctarías|4se,odrías|2er,llirías|4se,abrías|2er,reirías|2ír,drías|er,rías|1"
      },
      "third": {
        "rules": "uerer|3ría,isfacer|4ría,aler|2dría,alir|2dría,oder|2ría,hacer|2ría,venir|3dría,aber|2ría,ír|iría,ner|1dría,r|1ía,omit|4aría,rse|1ía",
        "exceptions": "decir|1iría,hacer|2ría,atreverse|7ía,juntarse|6ía,oír|1iría,prepararse|8ía,mudarse|5ía,hallarse|6ía,arrepentirse|10ía,salir|3dría,sentirse|6ía",
        "rev": "overía|4se,teraría|5se,uedaría|5se,ncearía|5se,uerría|3er,isfaría|4cer,ecaría|4se,esharía|4cer,lamaría|5se,actaría|5se,mitaría|3,eitaría|5se,odría|2er,ulliría|5se,uejaría|5se,vendría|3ir,abría|2er,reiría|2ír,dría|er,ría|1"
      },
      "firstPlural": {
        "rules": "uerer|3ríamos,isfacer|4ríamos,aler|2dríamos,alir|2dríamos,oder|2ríamos,hacer|2ríamos,venir|3dríamos,aber|2ríamos,ír|iríamos,ner|1dríamos,r|1íamos,omit|4aríamos,rse|1íamos",
        "exceptions": "decir|1iríamos,moverse|5íamos,enterarse|7íamos,sonreír|5iríamos,quedarse|6íamos,broncearse|8íamos,satisfacer|7ríamos,secarse|5íamos,deshacer|5ríamos,hacer|2ríamos,atreverse|7íamos,juntarse|6íamos,oír|1iríamos,prepararse|8íamos,llamarse|6íamos,venir|3dríamos,mudarse|5íamos,jactarse|6íamos,vomit|5aríamos,convenir|6dríamos,hallarse|6íamos,afeitarse|7íamos,arrepentirse|10íamos,salir|3dríamos,poder|3ríamos,zambullirse|9íamos,sentirse|6íamos,freír|3iríamos,quejarse|6íamos,reír|2iríamos",
        "rev": "rríamos|1er,bríamos|1er,dríamos|er,ríamos|1"
      },
      "secondPlural": {
        "rules": "uerer|3ríais,isfacer|4ríais,aler|2dríais,alir|2dríais,oder|2ríais,hacer|2ríais,venir|3dríais,aber|2ríais,ír|iríais,ner|1dríais,r|1íais,omit|4aríais,rse|1íais",
        "exceptions": "decir|1iríais,moverse|5íais,enterarse|7íais,quedarse|6íais,broncearse|8íais,satisfacer|7ríais,secarse|5íais,deshacer|5ríais,hacer|2ríais,atreverse|7íais,juntarse|6íais,oír|1iríais,prepararse|8íais,llamarse|6íais,venir|3dríais,mudarse|5íais,jactarse|6íais,vomit|5aríais,convenir|6dríais,hallarse|6íais,afeitarse|7íais,arrepentirse|10íais,salir|3dríais,zambullirse|9íais,sentirse|6íais,quejarse|6íais",
        "rev": "erríais|2er,odríais|2er,abríais|2er,eiríais|1ír,dríais|er,ríais|1"
      },
      "thirdPlural": {
        "rules": "uerer|3rían,isfacer|4rían,aler|2drían,alir|2drían,oder|2rían,hacer|2rían,venir|3drían,aber|2rían,ír|irían,ner|1drían,r|1ían,omit|4arían,rse|1ían",
        "exceptions": "decir|1irían,enterarse|7ían,quedarse|6ían,broncearse|8ían,hacer|2rían,atreverse|7ían,juntarse|6ían,oír|1irían,prepararse|8ían,llamarse|6ían,venir|3drían,mudarse|5ían,vomit|5arían,convenir|6drían,hallarse|6ían,afeitarse|7ían,arrepentirse|10ían,salir|3drían,sentirse|6ían,quejarse|6ían",
        "rev": "overían|4se,uerrían|3er,sfarían|3cer,ecarían|4se,sharían|3cer,ctarían|4se,odrían|2er,llirían|4se,abrían|2er,reirían|2ír,drían|er,rían|1"
      }
    },
    "gerunds": {
      "gerunds": {
        "rules": "omper|3iendo,ormir|urmiendo,oncebir|3ibiendo,orir|uriendo,odrir|udriendo,oer|1yendo,ejer|2iendo,endir|indiendo,rgüir|2uyendo,ngullir|5endo,ervir|irviendo,oser|2iendo,minuir|4yendo,huir|2yendo,oír|1yendo,mer|1iendo,egir|igiendo,etir|itiendo,estir|istiendo,eñir|iñendo,reír|1iendo,ler|1iendo,pedir|1idiendo,struir|4yendo,eer|1yendo,seguir|1iguiendo,entir|intiendo,buir|2yendo,rer|1iendo,decir|1iciendo,luir|2yendo,vertir|1irtiendo,ter|1iendo,venir|1iniendo,ber|1iendo,stituir|5yendo,ger|1iendo,aer|1yendo,erir|iriendo,ver|1iendo,ner|1iendo,der|1iendo,cer|1iendo,ir|1endo,r|ndo",
        "exceptions": "ir|yendo,poder|1udiendo,medir|1idiendo,seguir|1iguiendo,servir|1irviendo,convertir|4irtiendo,elegir|2igiendo,conseguir|4iguiendo,romper|4iendo,repetir|3itiendo,adquirir|7endo,sufrir|5endo,correr|4iendo,recorrer|6iendo,reír|1iendo,pedir|1idiendo,valer|3iendo,dormir|1urmiendo,concebir|4ibiendo,impedir|3idiendo,derretir|4itiendo,barrer|4iendo,vestir|1istiendo,sentir|1intiendo,hundir|5endo,mentir|1intiendo,extinguir|8endo,distinguir|9endo,podrir|1udriendo,verter|4iendo,expandir|7endo,invertir|3irtiendo,esparcir|7endo,roer|2yendo,difundir|7endo,perseguir|4iguiendo,definir|6endo,converger|7iendo,emerger|5iendo,revertir|3irtiendo,hervir|1irviendo,despedir|4idiendo,confundir|8endo,moler|3iendo,transgredir|10endo,corregir|4igiendo,proseguir|4iguiendo,demoler|5iendo,regir|1igiendo,fundir|5endo,reseguir|3iguiendo,advertir|3irtiendo,rendir|1indiendo,redefinir|8endo,freír|2iendo,competir|4itiendo,prescindir|9endo,desmentir|4intiendo,consentir|4intiendo,embestir|3istiendo,refundir|7endo,expedir|3idiendo,reconvertir|6irtiendo,revestir|3istiendo,infundir|7endo,blandir|6endo,divertir|3irtiendo,inquirir|7endo,fruncir|6endo,pervertir|4irtiendo,descorrer|7iendo,asir|3endo,presentir|4intiendo,escindir|7endo",
        "rev": "emiendo|2er,omiendo|2er,uriendo|orir,egiendo|2er,rniendo|3r,eliendo|2er,amiendo|2er,ejiendo|2er,triendo|3r,guyendo|1üir,ullendo|3ir,quiendo|3r,nriendo|2eír,eriendo|2er,osiendo|2er,ebiendo|2er,uniendo|3r,oyendo|1ír,abiendo|2er,rbiendo|2er,piendo|2r,iñendo|eñir,adiendo|3r,eyendo|1er,iviendo|3r,udiendo|3r,ogiendo|2er,iciendo|ecir,rriendo|3r,etiendo|2er,liendo|2r,briendo|3r,idiendo|3r,iniendo|enir,ayendo|1er,iriendo|erir,uciendo|3r,giendo|2r,viendo|1er,biendo|2r,miendo|2r,yendo|ir,niendo|1er,tiendo|2r,diendo|1er,ciendo|1er,ndo|r"
      }
    }
  };

  // uncompress them
  Object.keys(model$1).forEach(k => {
    Object.keys(model$1[k]).forEach(form => {
      model$1[k][form] = uncompress$1(model$1[k][form]);
    });
  });

  let { presentTense: presentTense$1, pastTense: pastTense$1, futureTense: futureTense$1, conditional: conditional$1 } = model$1;
  // =-=-

  const doEach = function (str, m) {
    return {
      first: convert$1(str, m.first),
      second: convert$1(str, m.second),
      third: convert$1(str, m.third),
      firstPlural: convert$1(str, m.firstPlural),
      secondPlural: convert$1(str, m.secondPlural),
      thirdPlural: convert$1(str, m.thirdPlural),
    }
  };

  const toPresent = (str) => doEach(str, presentTense$1);
  const toPast = (str) => doEach(str, pastTense$1);
  const toFuture = (str) => doEach(str, futureTense$1);
  const toConditional = (str) => doEach(str, conditional$1);



  var conjugate = {
    toPresent,
    toPast,
    toFuture,
    toConditional,
  };

  let copulas = [
    'está',
    'estaba',
    'estabais',
    'estábamos',
    'estaban',
    'estabas',
    'estado',
    'estáis',
    'estamos',
    'están',
    'estará',
    'estarán',
    'estarás',
    'estaré',
    'estaréis',
    'estaremos',
    'estaría',
    'estaríais',
    'estaríamos',
    'estarían',
    'estarías',
    'estás',
    'esté',
    'estéis',
    'estemos',
    'estén',
    'estés',
    'estoy',
    'estuve',
    'estuviera',
    'estuvierais',
    'estuviéramos',
    'estuvieran',
    'estuvieras',
    'estuviere',
    'estuviereis',
    'estuviéremos',
    'estuvieren',
    'estuvieres',
    'estuvieron',
    'estuviese',
    'estuvieseis',
    'estuviésemos',
    'estuviesen',
    'estuvieses',
    'estuvimos',
    'estuviste',
    'estuvisteis',
    'estuvo',
  ];

  let haves = [
    'estado',
    'estando',
    'estar',
    'ha',
    'habéis',
    'haber',
    'había',
    'habíais',
    'habíamos',
    'habían',
    'habías',
    'habrá',
    'habrán',
    'habrás',
    'habré',
    'habréis',
    'habremos',
    'habría',
    'habríais',
    'habríamos',
    'habrían',
    'habrías',
    'han',
    'has',
    'haya',
    'hayáis',
    'hayan',
    'hayas',
    'he',
    'hemos',
    'hube',
    'hubiera',
    'hubierais',
    'hubiéramos',
    'hubieran',
    'hubieras',
    'hubiere',
    'hubiereis',
    'hubiéremos',
    'hubieren',
    'hubieres',
    'hubieron',
    'hubiese',
    'hubieseis',
    'hubiesen',
    'hubieses',
    'hubimos',
    'hubiste',
    'hubisteis',
    'hubo',
  ];

  let lex = {
    se: 'Verb',
    era: 'PastTense',

    que: 'QuestionWord',
    como: 'QuestionWord',
    donde: 'QuestionWord',
    cuando: 'QuestionWord',

    lo: 'Pronoun',
    uno: 'Determiner',
    si: 'Condition',
    hay: 'Adverb',
    'había': 'Verb',
    'sido': 'Verb',

    irse: ['Reflexive', 'Infinitive']
  };
  copulas.forEach(str => {
    lex[str] = 'Copula';
  });
  haves.forEach(str => {
    lex[str] = 'Auxiliary';
  });

  var misc$1 = lex;

  let lexicon$1 = misc$1;


  const tagMap = {
    first: 'FirstPerson',
    second: 'SecondPerson',
    third: 'ThirdPerson',
    firstPlural: 'FirstPersonPlural',
    secondPlural: 'SecondPersonPlural',
    thirdPlural: 'ThirdPersonPlural',
  };

  const addWords = function (obj, tag, lex) {

    Object.keys(obj).forEach(k => {
      let w = obj[k];
      if (!lex[w]) {
        lex[w] = [tag, tagMap[k]];
      }
    });
  };

  Object.keys(lexData).forEach(tag => {
    let wordsObj = unpack$1(lexData[tag]);
    Object.keys(wordsObj).forEach(w => {
      lexicon$1[w] = tag;

      // add conjugations for our verbs
      if (tag === 'Infinitive') {
        // add present tense
        let obj = conjugate.toPresent(w);
        addWords(obj, 'PresentTense', lexicon$1);
        // add past tense
        obj = conjugate.toPast(w);
        addWords(obj, 'PastTense', lexicon$1);
        // add future tense
        obj = conjugate.toFuture(w);
        addWords(obj, 'FutureTense', lexicon$1);
        // add conditional
        obj = conjugate.toConditional(w);
        addWords(obj, 'Conditional', lexicon$1);
      }
      if (tag === 'Cardinal') {
        lexicon$1[w] = ['Cardinal', 'TextValue'];
      }
      if (tag === 'Ordinal') {
        lexicon$1[w] = ['Ordinal', 'TextValue'];
      }
    });
  });
  // console.log(lexicon['llorar'])

  var lexicon$2 = lexicon$1;

  let { presentTense, pastTense, futureTense, conditional } = model$1;

  // =-=-
  const revAll = function (m) {
    return Object.keys(m).reduce((h, k) => {
      h[k] = reverse$1(m[k]);
      return h
    }, {})
  };

  let presentRev = revAll(presentTense);
  let pastRev = revAll(pastTense);
  let futureRev = revAll(futureTense);
  let conditionalRev = revAll(conditional);

  //relajarse -> relajar
  const stripReflexive$2 = function (str) {
    str = str.replace(/arse$/, 'ar');
    str = str.replace(/arte$/, 'ir');
    str = str.replace(/arme$/, 'ar');

    str = str.replace(/irse$/, 'ir');
    str = str.replace(/irte$/, 'ir');

    str = str.replace(/erse$/, 'er');
    str = str.replace(/ose$/, 'o');
    return str
  };

  const fromPresent = (str, form) => {
    let forms = {
      'FirstPerson': (s) => convert$1(s, presentRev.first),
      'SecondPerson': (s) => convert$1(s, presentRev.second),
      'ThirdPerson': (s) => convert$1(s, presentRev.third),
      'FirstPersonPlural': (s) => convert$1(s, presentRev.firstPlural),
      'SecondPersonPlural': (s) => convert$1(s, presentRev.secondPlural),
      'ThirdPersonPlural': (s) => convert$1(s, presentRev.thirdPlural),
    };
    if (forms.hasOwnProperty(form)) {
      return forms[form](str)
    }
    return stripReflexive$2(str)
  };

  const fromPast = (str, form) => {
    let forms = {
      'FirstPerson': (s) => convert$1(s, pastRev.first),
      'SecondPerson': (s) => convert$1(s, pastRev.second),
      'ThirdPerson': (s) => convert$1(s, pastRev.third),
      'FirstPersonPlural': (s) => convert$1(s, pastRev.firstPlural),
      'SecondPersonPlural': (s) => convert$1(s, pastRev.secondPlural),
      'ThirdPersonPlural': (s) => convert$1(s, pastRev.thirdPlural),
    };
    if (forms.hasOwnProperty(form)) {
      return forms[form](str)
    }
    return stripReflexive$2(str)
  };

  const fromFuture = (str, form) => {
    let forms = {
      'FirstPerson': (s) => convert$1(s, futureRev.first),
      'SecondPerson': (s) => convert$1(s, futureRev.second),
      'ThirdPerson': (s) => convert$1(s, futureRev.third),
      'FirstPersonPlural': (s) => convert$1(s, futureRev.firstPlural),
      'SecondPersonPlural': (s) => convert$1(s, futureRev.secondPlural),
      'ThirdPersonPlural': (s) => convert$1(s, futureRev.thirdPlural),
    };
    if (forms.hasOwnProperty(form)) {
      return forms[form](str)
    }
    return stripReflexive$2(str)
  };

  const fromConditional = (str, form) => {
    let forms = {
      'FirstPerson': (s) => convert$1(s, conditionalRev.first),
      'SecondPerson': (s) => convert$1(s, conditionalRev.second),
      'ThirdPerson': (s) => convert$1(s, conditionalRev.third),
      'FirstPersonPlural': (s) => convert$1(s, conditionalRev.firstPlural),
      'SecondPersonPlural': (s) => convert$1(s, conditionalRev.secondPlural),
      'ThirdPersonPlural': (s) => convert$1(s, conditionalRev.thirdPlural),
    };
    if (forms.hasOwnProperty(form)) {
      return forms[form](str)
    }
    return stripReflexive$2(str)
  };


  var toRoot = {
    fromPresent,
    fromPast,
    fromFuture,
    fromConditional
  };

  var rules$1 = [
    // female nouns
    ['dad', 'dades'],
    ['eche', 'eches'],
    ['az', 'aces'],
    // ['ana', 'anos'],
    // ['stra', 'stros'],
    // ['ora', 'ores'],
    // ['gra', 'gros'],
    // ['oras', 'ores'],
    // ['rona', 'res'],
    // ['umna', 'umnos'],
    // ['ñola', 'ñoles'],
    // ['ñera', 'ñeros'],
    // ['gada', 'gados'],
    // ['aria', 'arios'],
    // ['jera', 'jeros'],
    // ['ueña', 'ueños'],

    // male nouns
    ['jín', 'jines'],
    ['den', 'denes'],
    ['dén', 'denes'],
    ['ués', 'ueses'],
    ['tín', 'tines'],
    ['rín', 'rines'],
    ['lín', 'lines'],
    ['pás', 'pases'],
    ['aís', 'aíses'],
    ['che', 'ches'],
    ['or', 'ores'],
    ['ón', 'ones'],
    ['al', 'ales'],
    ['il', 'iles'],
    ['el', 'eles'],
    ['er', 'eres'],
    ['ar', 'ares'],
    ['um', 'umes'],
    ['us', 'uses'],
    ['en', 'enes'],
    ['és', 'eses'],
    ['án', 'anes'],
    ['ol', 'oles'],
    ['oy', 'oyes'],
    ['ós', 'oses'],
    ['ir', 'ires'],
    ['is', 'ises'],
    ['sh', 'shes'],
    ['ry', 'ries'],
    ['iz', 'ices'],
    ['oj', 'ojes'],
    ['bú', 'búes'],
    ['ch', 'ches'],
    ['lm', 'lmes'],

    // ['erra', 'erros'],
    // ['um', 'as'],
  ];

  const toSingular = function (str) {
    for (let i = 0; i < rules$1.length; i += 1) {
      let a = rules$1[i];
      if (str.endsWith(a[1])) {
        str = str.substr(0, str.length - a[1].length);
        str += a[0];
        return str
      }
    }
    if (str.endsWith('s')) {
      return str = str.substr(0, str.length - 1)
    }
    return str
  };
  var toSingular$1 = toSingular;

  // console.log(toSingular('convoyes'))

  // import list from '/Users/spencer/mountain/es-compromise/nouns.js'
  // let count = 0
  // list.forEach(a => {
  //   let [m, f, mp, fp] = a
  //   if (mp && m && f && fp) {
  //     if (toSingular(mp) !== m) {
  //       count += 1
  //       console.log(mp, m)
  //     }
  //   }
  // })
  // console.log(count)

  const toPlural = function (str) {
    for (let i = 0; i < rules$1.length; i += 1) {
      let a = rules$1[i];
      if (str.endsWith(a[0])) {
        str = str.substr(0, str.length - a[0].length);
        str += a[1];
        return str
      }
    }
    return str + 's'
  };
  var toPlural$1 = toPlural;

  const toMasculine = function (str) {
    let arr = [
      ['ieta', 'ieto'],
      ['erra', 'erro'],
      ['rica', 'rico'],
      ['esta', 'esto'],
      ['ueña', 'ueño'],
      ['lera', 'lero'],
      ['rata', 'rato'],
      ['uida', 'uido'],
      ['anda', 'ando'],
      ['uela', 'uelo'],
      ['desa', 'dés'],
      ['adas', 'ados'],
      ['oras', 'ores'],
      ['chas', 'chones'],
      ['amas', 'amones'],
      ['ica', 'ico'],
      ['iza', 'izo'],
      ['ona', 'ón'],
      ['ada', 'ado'],
      ['ora', 'or'],
      ['oga', 'ogo'],
      ['era', 'ero'],
      ['ana', 'ano'],
      ['iva', 'ivo'],
      ['ica', 'ico'],
      ['ina', 'ino'],
      ['ita', 'ito'],
      ['cia', 'ción'],
      ['ia', 'io'],
      ['ea', 'eo'],
      ['a', 'o'],
      ['as', 'os'],
    ];
    for (let i = 0; i < arr.length; i += 1) {
      let [suff, repl] = arr[i];
      if (str.endsWith(suff)) {
        str = str.substr(0, str.length - suff.length);
        return str += repl
      }
    }
    return str
  };
  var toMasculine$1 = toMasculine;


  // import list from '/Users/spencer/mountain/es-compromise/nouns.js'
  // let count = 0
  // list.forEach(a => {
  //   let [m, f, ms, fs] = a
  //   if (ms && fs) {
  //     if (toMasculine(fs) !== ms) {
  //       count += 1
  //       console.log(fs, ms, '   ', toMasculine(fs))
  //     }
  //   }
  // })
  // console.log(count)

  // adjective to masculine and to singular

  const adjToSingular = function (str) {
    let arr = [
      ['ueses', 'ués'],
      ['eses', 'és'],
      ['ines', 'ín'],
      ['anes', 'án'],
      ['ores', 'or'],
      ['ones', 'ón'],
      ['es', ''],
      ['s', ''],
    ];
    for (let i = 0; i < arr.length; i += 1) {
      let [suff, repl] = arr[i];
      if (str.endsWith(suff)) {
        str = str.substr(0, str.length - suff.length);
        return str += repl
      }
    }
    return str
  };

  const adjToMasculine = function (str) {
    let arr = [
      ['onas', 'ones'],
      ['uesas', 'ueses'],
      ['nota', 'note'],
      ['esa', 'és'],
      ['ona', 'ón'],
      ['oras', 'ores'],
      ['ora', 'or'],
      ['as', 'os'],
      ['a', 'o'],
    ];
    for (let i = 0; i < arr.length; i += 1) {
      let [suff, repl] = arr[i];
      if (str.endsWith(suff)) {
        str = str.substr(0, str.length - suff.length);
        return str += repl
      }
    }
    return str
  };

  // import list from '/Users/spencer/mountain/es-compromise/data/models/adjectives.js'
  // let count = 0
  // list.forEach(a => {
  //   let [m, f, mp, fp] = a
  //   if (toMasculine(f) !== m) {
  //     count += 1
  //     console.log(f, m, '  -  ', toMasculine(f))
  //   }
  // })
  // console.log(count)

  // monteses montés monté
  // console.log(toSingular('monteses'))

  let { gerunds } = model$1;
  // =-=-
  let m$2 = {
    fromGerund: reverse$1(gerunds.gerunds),
    toGerund: gerunds.gerunds,
  };

  const fromGerund = function (str) {
    return convert$1(str, m$2.fromGerund)
  };
  const toGerund = function (str) {
    return convert$1(str, m$2.toGerund)
  };

  // console.log(toGerund('presentir'))

  // import list from '/Users/spencer/mountain/es-compromise/data/models/gerunds.js'
  // let miss = []
  // list.forEach(a => {
  //   let [inf, gerund] = a
  //   if (fromGerund(gerund) !== inf) {
  //     miss.push(a)
  //   }
  //   if (toGerund(inf) !== gerund) {
  //     miss.push(a)
  //   }
  // })
  // console.log(JSON.stringify(miss, null, 2))

  var methods$1 = {
    verb: {
      conjugate,
      toRoot,
      fromGerund,
      toGerund
    },
    noun: {
      toPlural: toPlural$1,
      toSingular: toSingular$1,
      toMasculine: toMasculine$1,
    },
    adjective: {
      adjToMasculine,
      adjToSingular
    }
  };

  const verbForm$1 = function (term) {
    let want = [
      'FirstPerson',
      'SecondPerson',
      'ThirdPerson',
      'FirstPersonPlural',
      'SecondPersonPlural',
      'ThirdPersonPlural',
    ];
    return want.find(tag => term.tags.has(tag))
  };

  //relajarse -> relajar
  const stripReflexive$1 = function (str) {
    str = str.replace(/se$/, '');
    str = str.replace(/te$/, '');
    str = str.replace(/me$/, '');
    return str
  };

  const root = function (view) {
    const { verb, noun, adjective } = view.world.methods.two.transform;
    view.docs.forEach(terms => {
      terms.forEach(term => {
        let str = term.implicit || term.normal || term.text;

        if (term.tags.has('Reflexive')) {
          str = stripReflexive$1(str);
        }
        // get infinitive form of the verb
        if (term.tags.has('Verb')) {
          let form = verbForm$1(term);
          if (term.tags.has('Gerund')) {
            term.root = verb.fromGerund(str, form);
          } else if (term.tags.has('PresentTense')) {
            term.root = verb.toRoot.fromPresent(str, form);
          } else if (term.tags.has('PastTense')) {
            term.root = verb.toRoot.fromPast(str, form);
          } else if (term.tags.has('FutureTense')) {
            term.root = verb.toRoot.fromFuture(str, form);
          } else if (term.tags.has('Conditional')) {
            term.root = verb.toRoot.fromConditional(str, form);
          } else ;
        }

        // nouns -> singular masculine form
        if (term.tags.has('Noun')) {
          if (term.tags.has('Plural')) {
            str = noun.toSingular(str);
          }
          if (term.tags.has('FemaleNoun')) {
            // not sure about this
            str = noun.toMasculine(str);
          }
          term.root = str;
        }

        // nouns -> singular masculine form
        if (term.tags.has('Adjective')) {
          if (term.tags.has('PluralAdjective')) {
            str = adjective.adjToSingular(str);
          }
          if (term.tags.has('FemaleAdjective')) {
            str = adjective.adjToMasculine(str);
          }
          term.root = str;
        }
      });
    });
    return view
  };
  var root$1 = root;

  var lexicon = {
    model: {
      one: {
        lexicon: lexicon$2
      }
    },
    compute: { root: root$1 },
    methods: {
      two: {
        transform: methods$1
      }
    },
  };

  const hasApostrophe = /['‘’‛‵′`´]/;

  // normal regexes
  const doRegs = function (str, regs) {
    for (let i = 0; i < regs.length; i += 1) {
      if (regs[i][0].test(str) === true) {
        return regs[i]
      }
    }
    return null
  };

  const checkRegex = function (terms, i, world) {
    let setTag = world.methods.one.setTag;
    let term = terms[i];
    let { regexText, regexNormal, regexNumbers } = world.model.two;
    let normal = term.machine || term.normal;
    let text = term.text;
    // keep dangling apostrophe?
    if (hasApostrophe.test(term.post) && !hasApostrophe.test(term.pre)) {
      text += term.post.trim();
    }
    let arr = doRegs(text, regexText) || doRegs(normal, regexNormal);
    // hide a bunch of number regexes behind this one
    if (!arr && /[0-9]/.test(normal)) {
      arr = doRegs(normal, regexNumbers);
    }
    if (arr) {
      setTag([term], arr[1], world, false, `1-regex- '${arr[2] || arr[0]}'`);
      term.confidence = 0.6;
      return true
    }
    return null
  };
  var checkRegex$1 = checkRegex;

  const isTitleCase = function (str) {
    return /^[A-ZÄÖÜ][a-zäöü'\u00C0-\u00FF]/.test(str) || /^[A-ZÄÖÜ]$/.test(str)
  };

  // add a noun to any non-0 index titlecased word, with no existing tag
  const titleCaseNoun = function (terms, i, world) {
    let setTag = world.methods.one.setTag;
    let term = terms[i];
    // don't over-write any tags
    if (term.tags.size > 0) {
      return
    }
    // skip first-word, for now
    if (i === 0) {
      return
    }
    if (isTitleCase(term.text)) {
      setTag([term], 'Noun', world, false, `1-titlecase`);
    }
  };
  var titleCase = titleCaseNoun;

  const min = 1400;
  const max = 2100;

  const dateWords = new Set(['pendant', 'dans', 'avant', 'apres', 'pour', 'en']);

  const seemsGood = function (term) {
    if (!term) {
      return false
    }
    if (dateWords.has(term.normal)) {
      return true
    }
    if (term.tags.has('Date') || term.tags.has('Month') || term.tags.has('WeekDay')) {
      return true
    }
    return false
  };

  const seemsOkay = function (term) {
    if (!term) {
      return false
    }
    if (term.tags.has('Ordinal')) {
      return true
    }
    return false
  };

  // recognize '1993' as a year
  const tagYear = function (terms, i, world) {
    let setTag = world.methods.one.setTag;
    const term = terms[i];
    if (term.tags.has('NumericValue') && term.tags.has('Cardinal') && term.normal.length === 4) {
      let num = Number(term.normal);
      // number between 1400 and 2100
      if (num && !isNaN(num)) {
        if (num > min && num < max) {
          if (seemsGood(terms[i - 1]) || seemsGood(terms[i + 1])) {
            setTag([term], 'Year', world, false, '1-tagYear');
            return true
          }
          // or is it really-close to a year?
          if (num > 1950 && num < 2025) {
            if (seemsOkay(terms[i - 1]) || seemsOkay(terms[i + 1])) {
              setTag([term], 'Year', world, false, '1-tagYear-close');
              return true
            }
          }
        }
      }
    }
    return null
  };
  var checkYear = tagYear;

  const oneLetterAcronym = /^[A-ZÄÖÜ]('s|,)?$/;
  const isUpperCase = /^[A-Z-ÄÖÜ]+$/;
  const periodAcronym = /([A-ZÄÖÜ]\.)+[A-ZÄÖÜ]?,?$/;
  const noPeriodAcronym = /[A-ZÄÖÜ]{2,}('s|,)?$/;
  const lowerCaseAcronym = /([a-zäöü]\.)+[a-zäöü]\.?$/;



  const oneLetterWord = {
    I: true,
    A: true,
  };
  // just uppercase acronyms, no periods - 'UNOCHA'
  const isNoPeriodAcronym = function (term, model) {
    let str = term.text;
    // ensure it's all upper-case
    if (isUpperCase.test(str) === false) {
      return false
    }
    // long capitalized words are not usually either
    if (str.length > 5) {
      return false
    }
    // 'I' is not a acronym
    if (oneLetterWord.hasOwnProperty(str)) {
      return false
    }
    // known-words, like 'PIZZA' is not an acronym.
    if (model.one.lexicon.hasOwnProperty(term.normal)) {
      return false
    }
    //like N.D.A
    if (periodAcronym.test(str) === true) {
      return true
    }
    //like c.e.o
    if (lowerCaseAcronym.test(str) === true) {
      return true
    }
    //like 'F.'
    if (oneLetterAcronym.test(str) === true) {
      return true
    }
    //like NDA
    if (noPeriodAcronym.test(str) === true) {
      return true
    }
    return false
  };

  const isAcronym = function (terms, i, world) {
    let setTag = world.methods.one.setTag;
    let term = terms[i];
    //these are not acronyms
    if (term.tags.has('RomanNumeral') || term.tags.has('Acronym')) {
      return null
    }
    //non-period ones are harder
    if (isNoPeriodAcronym(term, world.model)) {
      term.tags.clear();
      setTag([term], ['Acronym', 'Noun'], world, false, '3-no-period-acronym');
      return true
    }
    // one-letter acronyms
    if (!oneLetterWord.hasOwnProperty(term.text) && oneLetterAcronym.test(term.text)) {
      term.tags.clear();
      setTag([term], ['Acronym', 'Noun'], world, false, '3-one-letter-acronym');
      return true
    }
    //if it's a very-short organization?
    if (term.tags.has('Organization') && term.text.length <= 3) {
      setTag([term], 'Acronym', world, false, '3-org-acronym');
      return true
    }
    // upper-case org, like UNESCO
    if (term.tags.has('Organization') && isUpperCase.test(term.text) && term.text.length <= 6) {
      setTag([term], 'Acronym', world, false, '3-titlecase-acronym');
      return true
    }
    return null
  };
  var acronym = isAcronym;

  const fallback = function (terms, i, world) {
    let setTag = world.methods.one.setTag;
    let term = terms[i];
    if (term.tags.size === 0) {
      setTag([term], 'Noun', world, false, '2-fallback');
    }
  };
  var fallback$1 = fallback;

  //sweep-through all suffixes
  const suffixLoop = function (str = '', suffixes = []) {
    const len = str.length;
    let max = 7;
    if (len <= max) {
      max = len - 1;
    }
    for (let i = max; i > 1; i -= 1) {
      let suffix = str.substr(len - i, len);
      if (suffixes[suffix.length].hasOwnProperty(suffix) === true) {
        // console.log(suffix)
        let tag = suffixes[suffix.length][suffix];
        return tag
      }
    }
    return null
  };

  // decide tag from the ending of the word
  const suffixCheck = function (terms, i, world) {
    let setTag = world.methods.one.setTag;
    let suffixes = world.model.two.suffixPatterns;
    let term = terms[i];
    if (term.tags.size === 0) {
      let tag = suffixLoop(term.normal, suffixes);
      if (tag !== null) {
        setTag([term], tag, world, false, '2-suffix');
        term.confidence = 0.7;
        return true
      }
      // try implicit form of word, too
      if (term.implicit) {
        tag = suffixLoop(term.implicit, suffixes);
        if (tag !== null) {
          setTag([term], tag, world, false, '2-implicit-suffix');
          term.confidence = 0.7;
          return true
        }
      }
    }
    return null
  };
  var suffixCheck$1 = suffixCheck;

  // deduce gender of a noun, but it's suffix
  const guessNounGender = function (terms, i, world) {
    const setTag = world.methods.one.setTag;
    const guessGender = world.methods.two.guessGender;
    let term = terms[i];
    if (term.tags.has('Noun') && !term.tags.has('FemaleNoun') && !term.tags.has('MaleNoun') && !term.tags.has('Pronoun')) {
      let str = term.machine || term.normal;
      let found = guessGender(str);
      if (found) {
        let tag = found === 'm' ? 'MaleNoun' : 'FemaleNoun';
        setTag([term], tag, world, false, '3-guessGender');
      }
    }
  };
  var guessNounGender$1 = guessNounGender;

  const isPlural$1 = function (str) {
    if (str.endsWith('s')) {
      return true
    }
    return false
  };

  // deduce gender of a noun, but it's suffix
  const guessPlural = function (terms, i, world) {
    const setTag = world.methods.one.setTag;
    let term = terms[i];
    if (term.tags.has('Noun') && !term.tags.has('Singular') && !term.tags.has('Plural') && !term.tags.has('Pronoun')) {
      let str = term.machine || term.normal;
      let found = isPlural$1(str);
      if (found) {
        setTag([term], 'Plural', world, false, '3-guessPlural');
      }
    }
  };
  var guessPlural$1 = guessPlural;

  const isPlural = function (str) {
    if (str.endsWith('s') && !str.endsWith('és')) {
      return true
    }
    return false
  };

  // deduce gender of an adjective, but it's suffix
  const guessAdjPlural = function (terms, i, world) {
    const setTag = world.methods.one.setTag;
    let term = terms[i];
    if (term.tags.has('Adjective') && !term.tags.has('SingularAdjective') && !term.tags.has('PluralAdjective')) {
      let str = term.machine || term.normal;
      if (isPlural(str) === true) {
        setTag([term], 'PluralAdjective', world, false, '3-guessPlural');
      } else {
        setTag([term], 'SingularAdjective', world, false, '3-guessPlural');
      }
    }
  };
  var adjPlural = guessAdjPlural;

  // these are easy
  const guessGender$1 = function (str) {
    if (str.endsWith('o') || str.endsWith('os')) {
      return 'm'
    }
    if (str.endsWith('a') || str.endsWith('as')) {
      return 'f'
    }
    return 'm'
  };

  // deduce gender of an adjective, but it's suffix
  const guessAdjGender = function (terms, i, world) {
    const setTag = world.methods.one.setTag;
    let term = terms[i];
    if (term.tags.has('Adjective') && !term.tags.has('FemaleAdjective') && !term.tags.has('MaleAdjective')) {
      let str = term.machine || term.normal;
      if (guessGender$1(str) === 'f') {
        setTag([term], 'FemaleAdjective', world, false, '3-guessGender');
      } else {
        setTag([term], 'MaleAdjective', world, false, '3-guessGender');
      }
    }
  };
  var adjGender = guessAdjGender;

  let rules = [
    // present-tense
    ['o', ['FirstPerson', 'PresentTense']],
    ['as', ['SecondPerson', 'PresentTense']],
    ['a', ['ThirdPerson', 'PresentTense']],
    ['mos', ['FirstPersonPlural', 'PresentTense']],
    ['áis', ['SecondPersonPlural', 'PresentTense']],
    ['éis', ['SecondPersonPlural', 'PresentTense']],
    ['an', ['ThirdPersonPlural', 'PresentTense']],
    // past-tense
    ['é', ['FirstPerson', 'PastTense']],
    ['ste', ['SecondPerson', 'PastTense']],
    ['ó', ['ThirdPerson', 'PastTense']],
    ['mos', ['FirstPersonPlural', 'PastTense']],
    ['eis', ['SecondPersonPlural', 'PastTense']],
    ['on', ['ThirdPersonPlural', 'PastTense']],
    // future-tense
    ['ré', ['FirstPerson', 'FutureTense']],
    ['rás', ['SecondPerson', 'FutureTense']],
    ['rá', ['ThirdPerson', 'FutureTense']],
    ['remos",', ['FirstPersonPlural', 'FutureTense']],
    ['réis', ['SecondPersonPlural', 'FutureTense']],
    ['rán', ['ThirdPersonPlural', 'FutureTense']],
    // conditional-tense
    ['ría', ['FirstPerson', 'Conditional']],
    ['rías', ['SecondPerson', 'Conditional']],
    // ['ría', ['ThirdPerson','Conditional']], //(same)
    ['ríamos', ['FirstPersonPlural', 'Conditional']],
    ['ríais', ['SecondPersonPlural', 'Conditional']],
    ['rían', ['ThirdPersonPlural', 'Conditional']],
  ];
  // sort by suffix length
  rules = rules.sort((a, b) => {
    if (a[0].length > b[0].length) {
      return -1
    } else if (a[0].length < b[0].length) {
      return 1
    }
    return 0
  });

  let forms = [
    'FirstPerson',
    'SecondPerson',
    'ThirdPerson',
    'FirstPersonPlural',
    'SecondPersonPlural',
    'ThirdPersonPlural',
    'PresentTense',
    'PastTense',
    'FutureTense',
    'Conditional'
  ];

  //relajarse -> relajar
  const stripReflexive = function (str) {
    str = str.replace(/se$/, '');
    str = str.replace(/te$/, '');
    str = str.replace(/me$/, '');
    return str
  };

  // deduce gender of an adjective, but it's suffix
  const guessVerbForm = function (terms, i, world) {
    const setTag = world.methods.one.setTag;
    let term = terms[i];
    if (term.tags.has('Verb') && !term.tags.has('Infinitive')) {
      // do we already have both?
      if (forms.filter(tag => term.tags.has(tag)).length >= 2) {
        return
      }
      let str = term.machine || term.normal;

      //relajarse -> relajar
      str = stripReflexive(str);
      for (let i = 0; i < rules.length; i += 1) {
        let [suff, tag] = rules[i];
        if (str.endsWith(suff)) {
          setTag([term], tag, world, true, '3-guessForm');
          break
        }
      }
    }
  };
  var verbForm = guessVerbForm;

  // 1st pass


  // these methods don't care about word-neighbours
  const firstPass = function (terms, world) {
    for (let i = 0; i < terms.length; i += 1) {
      //  is it titlecased?
      let found = titleCase(terms, i, world);
      // try look-like rules
      found = found || checkRegex$1(terms, i, world);
      // turn '1993' into a year
      checkYear(terms, i, world);
    }
  };
  const secondPass = function (terms, world) {
    for (let i = 0; i < terms.length; i += 1) {
      let found = acronym(terms, i, world);
      found = found || suffixCheck$1(terms, i, world);
      // found = found || neighbours(terms, i, world)
      found = found || fallback$1(terms, i, world);
    }
  };

  const thirdPass = function (terms, world) {
    for (let i = 0; i < terms.length; i += 1) {
      guessNounGender$1(terms, i, world);
      guessPlural$1(terms, i, world);
      adjPlural(terms, i, world);
      adjGender(terms, i, world);
      verbForm(terms, i, world);
    }
  };


  const tagger = function (view) {
    let world = view.world;
    view.docs.forEach(terms => {
      firstPass(terms, world);
      secondPass(terms, world);
      thirdPass(terms, world);
    });
    return view
  };
  var tagger$1 = tagger;

  var regexNormal = [
    //web tags
    [/^[\w.]+@[\w.]+\.[a-z]{2,3}$/, 'Email'],
    [/^(https?:\/\/|www\.)+\w+\.[a-z]{2,3}/, 'Url', 'http..'],
    [/^[a-z0-9./].+\.(com|net|gov|org|ly|edu|info|biz|dev|ru|jp|de|in|uk|br|io|ai)/, 'Url', '.com'],

    // timezones
    [/^[PMCE]ST$/, 'Timezone', 'EST'],

    //names
    [/^ma?c'.*/, 'LastName', "mc'neil"],
    [/^o'[drlkn].*/, 'LastName', "o'connor"],
    [/^ma?cd[aeiou]/, 'LastName', 'mcdonald'],

    //slang things
    [/^(lol)+[sz]$/, 'Expression', 'lol'],
    [/^wo{2,}a*h?$/, 'Expression', 'wooah'],
    [/^(hee?){2,}h?$/, 'Expression', 'hehe'],
    [/^(un|de|re)\\-[a-z\u00C0-\u00FF]{2}/, 'Verb', 'un-vite'],

    // m/h
    [/^(m|k|cm|km)\/(s|h|hr)$/, 'Unit', '5 k/m'],
    // μg/g
    [/^(ug|ng|mg)\/(l|m3|ft3)$/, 'Unit', 'ug/L'],
  ];

  var regexNumbers = [

    [/^@1?[0-9](am|pm)$/i, 'Time', '3pm'],
    [/^@1?[0-9]:[0-9]{2}(am|pm)?$/i, 'Time', '3:30pm'],
    [/^'[0-9]{2}$/, 'Year'],
    // times
    [/^[012]?[0-9](:[0-5][0-9])(:[0-5][0-9])$/, 'Time', '3:12:31'],
    [/^[012]?[0-9](:[0-5][0-9])?(:[0-5][0-9])? ?(am|pm)$/i, 'Time', '1:12pm'],
    [/^[012]?[0-9](:[0-5][0-9])(:[0-5][0-9])? ?(am|pm)?$/i, 'Time', '1:12:31pm'], //can remove?

    // iso-dates
    [/^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}/i, 'Date', 'iso-date'],
    [/^[0-9]{1,4}-[0-9]{1,2}-[0-9]{1,4}$/, 'Date', 'iso-dash'],
    [/^[0-9]{1,4}\/[0-9]{1,2}\/[0-9]{1,4}$/, 'Date', 'iso-slash'],
    [/^[0-9]{1,4}\.[0-9]{1,2}\.[0-9]{1,4}$/, 'Date', 'iso-dot'],
    [/^[0-9]{1,4}-[a-z]{2,9}-[0-9]{1,4}$/i, 'Date', '12-dec-2019'],

    // timezones
    [/^utc ?[+-]?[0-9]+$/, 'Timezone', 'utc-9'],
    [/^(gmt|utc)[+-][0-9]{1,2}$/i, 'Timezone', 'gmt-3'],

    //phone numbers
    [/^[0-9]{3}-[0-9]{4}$/, 'PhoneNumber', '421-0029'],
    [/^(\+?[0-9][ -])?[0-9]{3}[ -]?[0-9]{3}-[0-9]{4}$/, 'PhoneNumber', '1-800-'],


    //money
    //like $5.30
    [
      /^[-+]?[$\xA2-\xA5\u058F\u060B\u09F2\u09F3\u09FB\u0AF1\u0BF9\u0E3F\u17DB\u20A0-\u20BD\uA838\uFDFC\uFE69\uFF04\uFFE0\uFFE1\uFFE5\uFFE6][-+]?[0-9]+(,[0-9]{3})*(\.[0-9]+)?([kmb]|bn)?\+?$/,
      ['Money', 'Value'],
      '$5.30',
    ],
    //like 5.30$
    [
      /^[-+]?[0-9]+(,[0-9]{3})*(\.[0-9]+)?[$\xA2-\xA5\u058F\u060B\u09F2\u09F3\u09FB\u0AF1\u0BF9\u0E3F\u17DB\u20A0-\u20BD\uA838\uFDFC\uFE69\uFF04\uFFE0\uFFE1\uFFE5\uFFE6]\+?$/,
      ['Money', 'Value'],
      '5.30£',
    ],
    //like
    [/^[-+]?[$£]?[0-9]([0-9,.])+(usd|eur|jpy|gbp|cad|aud|chf|cny|hkd|nzd|kr|rub)$/i, ['Money', 'Value'], '$400usd'],

    //numbers
    // 50 | -50 | 3.23  | 5,999.0  | 10+
    [/^[-+]?[0-9]+(,[0-9]{3})*(\.[0-9]+)?\+?$/, ['Cardinal', 'NumericValue'], '5,999'],
    [/^[-+]?[0-9]+(,[0-9]{3})*(\.[0-9]+)?(st|nd|rd|r?th)$/, ['Ordinal', 'NumericValue'], '53rd'],
    // .73th
    [/^\.[0-9]+\+?$/, ['Cardinal', 'NumericValue'], '.73th'],
    //percent
    [/^[-+]?[0-9]+(,[0-9]{3})*(\.[0-9]+)?%\+?$/, ['Percent', 'Cardinal', 'NumericValue'], '-4%'],
    [/^\.[0-9]+%$/, ['Percent', 'Cardinal', 'NumericValue'], '.3%'],
    //fraction
    [/^[0-9]{1,4}\/[0-9]{1,4}(st|nd|rd|th)?s?$/, ['Fraction', 'NumericValue'], '2/3rds'],
    //range
    [/^[0-9.]{1,3}[a-z]{0,2}[-–—][0-9]{1,3}[a-z]{0,2}$/, ['Value', 'NumberRange'], '3-4'],
    //time-range
    [/^[0-9]{1,2}(:[0-9][0-9])?(am|pm)? ?[-–—] ?[0-9]{1,2}(:[0-9][0-9])?(am|pm)$/, ['Time', 'NumberRange'], '3-4pm'],
    //with unit
    [/^[0-9.]+([a-z]{1,4})$/, 'Value', '9km'],
  ];

  var regexText = [
    // #coolguy
    [/^#[a-zäöü0-9_\u00C0-\u00FF]{2,}$/i, 'HashTag'],

    // @spencermountain
    [/^@\w{2,}$/, 'AtMention'],

    // period-ones acronyms - f.b.i.
    [/^([A-ZÄÖÜ]\.){2}[A-ZÄÖÜ]?/i, ['Acronym', 'Noun'], 'F.B.I'], //ascii-only

    // ending-apostrophes
    [/.{3}[lkmnp]in['‘’‛‵′`´]$/, 'Gerund', "chillin'"],
    [/.{4}s['‘’‛‵′`´]$/, 'Possessive', "flanders'"],
  ];

  const rb = 'Adverb';
  const nn = 'Noun';
  const vb = 'Verb';
  const jj = 'Adjective';
  const cond = 'Conditional';
  const fut = 'FutureTense';
  const inf = 'Infinitive';
  const g = 'Gerund';
  const ref = 'Reflexive';
  const first = 'FirstPerson';

  var suffixPatterns = [
    null,
    {
      // one-letter suffixes
      'ó': vb,
    },
    {
      // two-letter suffixes
      al: jj,
      // no: jj,
      // do: vb,
      // ar: vb,
      an: vb,
      'ió': vb,
      en: vb,
      ir: vb,
      er: vb,
      'tó': vb,
    },
    {
      // three-letter suffixes
      ico: jj,
      // ica: jj,
      ble: jj,
      nal: jj,
      ial: jj,
      oso: jj,
      ana: jj,
      // ado: vb,
      ndo: first,
      ada: vb,
      ron: vb,
      // ido: vb,
      aba: vb,
      tar: vb,
      'ían': vb,
      rar: vb,
      ría: cond,
      aré: fut,
      iré: fut,
      eré: fut,
      rás: fut,
      ará: fut,
      ado: vb,
      // ida: vb,
    },
    {
      // four-letter suffixes
      arse: inf,
      irse: inf,
      ales: jj,
      icos: jj,
      icas: jj,
      tico: jj,
      tica: jj,
      able: jj,
      tivo: jj,
      aria: jj,
      bles: jj,
      tiva: jj,
      ante: jj,
      'ción': nn,
      idad: nn,
      ento: nn,
      ncia: nn,
      'sión': nn,
      ando: g,
      endo: g,
      // ados: vb,
      aron: vb,
      adas: vb,
      tado: first,
      rías: cond,
      amos: cond,
      íais: cond,
      rían: cond,
      réis: fut,
      arán: fut,
      // refexive verbs
      arse: inf,
      arte: inf,
      arme: inf,
      irse: inf,
      irte: inf,
      erse: inf,
      dose: ref,
    },
    { // five-letter suffixes
      'ación': nn,
      mente: rb,
      iendo: g,
      yendo: g,
      ieron: vb,
      remos: fut,
      iente: jj,
    },
    {
      // six-letter suffixes
      ciones: nn
    },
    {
      // seven-letter suffixes
      aciones: nn
    }
  ];

  var model = {
    regexNormal,
    regexNumbers,
    regexText,
    suffixPatterns
  };

  const m$1 = 'm';
  const f$1 = 'f';

  // learned in ./learn/wikicorpus
  var suffixes = [
    {},
    {
      o: m$1,
      e: m$1, //this one is only 75% correct
      s: m$1,
      l: m$1,
      a: f$1
    },
    {
      os: m$1,
      to: m$1,
      io: m$1,
      or: m$1,
      do: m$1,
      ro: m$1,
      no: m$1,
      mo: m$1,
      lo: m$1,
      te: m$1,
      co: m$1,
      go: m$1,
      so: m$1,
      je: m$1,
      as: f$1,
      ia: f$1,
      ra: f$1,
      'ía': f$1,
      ta: f$1,
      da: f$1,
      na: f$1,
      la: f$1,
      ca: f$1,
      za: f$1,
      sa: f$1
    },
    {
      tos: m$1,
      dos: m$1,
      ios: m$1,
      ado: m$1,
      ros: m$1,
      nos: m$1,
      los: m$1,
      rio: m$1,
      les: m$1,
      ero: m$1,
      cos: m$1,
      ras: f$1,
      ias: f$1,
      tas: f$1,
      las: f$1,
      nas: f$1,
      ura: f$1,
      das: f$1,
      'ría': f$1,
      ada: f$1,
      era: f$1,
      'ías': f$1,
      ica: f$1,
      ina: f$1
    },
    {
      ento: m$1,
      ores: m$1,
      ador: m$1,
      ismo: m$1,
      ados: m$1,
      'ción': f$1,
      idad: f$1,
      'sión': f$1,
      tura: f$1
    },
    {
      entos: m$1,
      'ación': f$1,
      encia: f$1,
      lidad: f$1,
      'cción': f$1,
      dades: f$1,
      ncias: f$1,
      'ición': f$1
    },
    {
      miento: m$1,
      adores: m$1,
      ciones: f$1,
      'tación': f$1,
      'ración': f$1,
      'cación': f$1
    },
    {
      amiento: m$1,
      aciones: f$1,
      'ización': f$1
    }
  ];

  // some common exceptions to our rules (limited)
  const m = new Set([
    'nombre', 'año', 'tiempo', 'grupo', 'sistema',
    'and', 'sur', 'tipo', 'álbum', 'nivel',
    'origen', 'poder', 'cuerpo', 'hecho',
    'campo', 'papel', 'carácter',
    'tamaño', 'aire', 'problema', 'metal',
    'idioma', 'corazón', 'video', 'pie',
    'latín', 'obispo', 'single', 'príncipe',
    'catalán', 'deseo', 'alemán',
    'filósofo', 'huevo', 'tubo', 'géographique',
    'cráneo', 'reflejo', 'vértice', 'timbre',
  ]);

  const f = new Set([
    'ciudad', 'parte', 'forma', 'vez', 'serie',
    'the', 'región', 'muerte', 'agua',
    'capital', 'final', 'línea', 'área',
    'orden', 'edad', 'madre', 'mujer',
    'superficie', 'especie', 'luz', 'voz',
    'hija', 'lengua', 'imagen',
    'fecha', 'sede', 'sociedad', 'noche',
    'gente', 'calle', 'ley', 'clase',
  ]);
  var exceptions = { f, m };

  //sweep-through all suffixes
  const bySuffix = function (str) {
    const len = str.length;
    let max = 7;
    if (len <= max) {
      max = len - 1;
    }
    for (let i = max; i > 1; i -= 1) {
      let suffix = str.substr(len - i, len);
      if (suffixes[suffix.length].hasOwnProperty(suffix) === true) {
        // console.log(suffix)
        let tag = suffixes[suffix.length][suffix];
        return tag
      }
    }
    return null
  };

  const guessGender = function (str) {
    if (exceptions.f.has(str)) {
      return 'f'
    }
    if (exceptions.m.has(str)) {
      return 'm'
    }
    return bySuffix(str)
  };
  var bySuffix$1 = guessGender;

  // console.log(guessGender('chicos'))

  // import list from '/Users/spencer/mountain/es-compromise/fem.js'
  // let wrong = list.slice(0, 500).filter(str => guessGender(str) !== 'f')
  // console.log(wrong)

  var methods = {
    two: { guessGender: bySuffix$1 }
  };

  var preTagger = {
    compute: {
      tagger: tagger$1
    },
    model: {
      two: model
    },
    methods,
    hooks: ['tagger']
  };

  const postTagger$1 = function (doc) {
    // ne foo pas
    // doc.match('ne [.] pas', 0).tag('Verb', 'ne-verb-pas')
    // reflexive
    // doc.match('(se|me|te) [.]', 0).tag('Verb', 'se-noun')
    // numbers
    doc.match('#Value y #Value').tag('TextValue', 'num-y-num');
    // minus eight
    doc.match('menos #Value').tag('TextValue', 'minus-val');
    // 3 pintas de cerveza
    doc.match('#Value [#PresentTense] de #Noun', 0).tag('Plural', '3-pintas');
  };
  var postTagger$2 = postTagger$1;

  var postTagger = {
    compute: {
      postTagger: postTagger$2
    },
    hooks: ['postTagger']
  };

  const entity = ['Person', 'Place', 'Organization'];

  var nouns = {
    Noun: {
      not: ['Verb', 'Adjective', 'Adverb', 'Value', 'Determiner'],
    },
    Singular: {
      is: 'Noun',
      not: ['Plural'],
    },
    ProperNoun: {
      is: 'Noun',
    },
    Person: {
      is: 'Singular',
      also: ['ProperNoun'],
      not: ['Place', 'Organization', 'Date'],
    },
    FirstName: {
      is: 'Person',
    },
    MaleName: {
      is: 'FirstName',
      not: ['FemaleName', 'LastName'],
    },
    FemaleName: {
      is: 'FirstName',
      not: ['MaleName', 'LastName'],
    },
    LastName: {
      is: 'Person',
      not: ['FirstName'],
    },
    Honorific: {
      is: 'Noun',
      not: ['FirstName', 'LastName', 'Value'],
    },
    Place: {
      is: 'Singular',
      not: ['Person', 'Organization'],
    },
    Country: {
      is: 'Place',
      also: ['ProperNoun'],
      not: ['City'],
    },
    City: {
      is: 'Place',
      also: ['ProperNoun'],
      not: ['Country'],
    },
    Region: {
      is: 'Place',
      also: ['ProperNoun'],
    },
    Address: {
      // is: 'Place',
    },
    Organization: {
      is: 'ProperNoun',
      not: ['Person', 'Place'],
    },
    SportsTeam: {
      is: 'Organization',
    },
    School: {
      is: 'Organization',
    },
    Company: {
      is: 'Organization',
    },
    Plural: {
      is: 'Noun',
      not: ['Singular'],
    },
    Uncountable: {
      is: 'Noun',
    },
    Pronoun: {
      is: 'Noun',
      not: entity,
    },
    Actor: {
      is: 'Noun',
      not: entity,
    },
    Activity: {
      is: 'Noun',
      not: ['Person', 'Place'],
    },
    Unit: {
      is: 'Noun',
      not: entity,
    },
    Demonym: {
      is: 'Noun',
      also: ['ProperNoun'],
      not: entity,
    },
    Possessive: {
      is: 'Noun',
    },

    FemaleNoun: {
      is: 'Noun',
      not: ['MaleNoun']
    },
    MaleNoun: {
      is: 'Noun',
      not: ['FemaleNoun']
    },

  };

  var verbs = {
    Verb: {
      not: ['Noun', 'Adjective', 'Adverb', 'Value', 'Expression'],
    },
    PresentTense: {
      is: 'Verb',
      not: ['PastTense'],
    },
    Infinitive: {
      is: 'PresentTense',
      not: ['Gerund'],
    },
    Imperative: {
      is: 'Infinitive',
    },
    Gerund: {
      is: 'PresentTense',
      not: ['Copula'],
    },
    PastTense: {
      is: 'Verb',
      not: ['PresentTense', 'Gerund'],
    },
    Copula: {
      is: 'Verb',
    },
    Modal: {
      is: 'Verb',
      not: ['Infinitive'],
    },
    PerfectTense: {
      is: 'Verb',
      not: ['Gerund'],
    },
    Pluperfect: {
      is: 'Verb',
    },
    Participle: {
      is: 'PastTense',
    },
    PhrasalVerb: {
      is: 'Verb',
    },
    Particle: {
      is: 'PhrasalVerb',
      not: ['PastTense', 'PresentTense', 'Copula', 'Gerund'],
    },
    Auxiliary: {
      is: 'Verb',
      not: ['PastTense', 'PresentTense', 'Gerund', 'Conjunction'],
    },
    Conditional: {
      is: 'Verb',
      not: ['Infinitive', 'Imperative'],
    },

    Reflexive: {
      is: 'Verb',
    },


    // 
    FirstPerson: {
      is: 'Verb',
      not: ['SecondPerson', 'ThirdPerson', 'FirstPersonPlural', 'SecondPersonPlural', 'ThirdPersonPlural']
    },
    SecondPerson: {
      is: 'Verb',
      not: ['FirstPerson', 'ThirdPerson', 'FirstPersonPlural', 'SecondPersonPlural', 'ThirdPersonPlural']
    },
    ThirdPerson: {
      is: 'Verb',
      not: ['FirstPerson', 'SecondPerson', 'FirstPersonPlural', 'SecondPersonPlural', 'ThirdPersonPlural']
    },
    FirstPersonPlural: {
      is: 'Verb',
      not: ['FirstPerson', 'SecondPerson', 'ThirdPerson', 'SecondPersonPlural', 'ThirdPersonPlural']
    },
    SecondPersonPlural: {
      is: 'Verb',
      not: ['FirstPerson', 'SecondPerson', 'ThirdPerson', 'FirstPersonPlural', 'ThirdPersonPlural']
    },
    ThirdPersonPlural: {
      is: 'Verb',
      not: ['FirstPerson', 'SecondPerson', 'ThirdPerson', 'FirstPersonPlural', 'SecondPersonPlural']
    },
  };

  var values = {
    Value: {
      not: ['Verb', 'Adjective', 'Adverb'],
    },
    Ordinal: {
      is: 'Value',
      not: ['Cardinal'],
    },
    Cardinal: {
      is: 'Value',
      not: ['Ordinal'],
    },
    Fraction: {
      is: 'Value',
      not: ['Noun'],
    },
    Multiple: {
      is: 'Value',
    },
    RomanNumeral: {
      is: 'Cardinal',
      not: ['TextValue'],
    },
    TextValue: {
      is: 'Value',
      not: ['NumericValue'],
    },
    NumericValue: {
      is: 'Value',
      not: ['TextValue'],
    },
    Money: {
      is: 'Cardinal',
    },
    Percent: {
      is: 'Value',
    },
  };

  var dates = {
    Date: {
      not: ['Verb', 'Adverb', 'Adjective'],
    },
    Month: {
      is: 'Singular',
      also: ['Date'],
      not: ['Year', 'WeekDay', 'Time'],
    },
    WeekDay: {
      is: 'Noun',
      also: ['Date'],
    },
    Year: {
      is: 'Date',
      not: ['RomanNumeral'],
    },
    FinancialQuarter: {
      is: 'Date',
      not: 'Fraction',
    },
    // 'easter'
    Holiday: {
      is: 'Date',
      also: ['Noun'],
    },
    // 'summer'
    Season: {
      is: 'Date',
    },
    Timezone: {
      is: 'Noun',
      also: ['Date'],
      not: ['ProperNoun'],
    },
    Time: {
      is: 'Date',
      not: ['AtMention'],
    },
    // 'months'
    Duration: {
      is: 'Noun',
      also: ['Date'],
    },
  };

  const anything = ['Noun', 'Verb', 'Adjective', 'Adverb', 'Value', 'QuestionWord'];

  var misc = {
    Adjective: {
      not: ['Noun', 'Verb', 'Adverb', 'Value'],
    },
    FemaleAdjective: {
      is: 'Adjective',
      not: ['MaleAdjective'],
    },
    MaleAdjective: {
      is: 'Adjective',
      not: ['FemaleAdjective'],
    },
    PluralAdjective: {
      is: 'Adjective',
      not: ['SingularAdjective'],
    },
    SingularAdjective: {
      is: 'Adjective',
      not: ['PluralAdjective'],
    },
    Comparable: {
      is: 'Adjective',
    },
    Comparative: {
      is: 'Adjective',
    },
    Superlative: {
      is: 'Adjective',
      not: ['Comparative'],
    },
    NumberRange: {},
    Adverb: {
      not: ['Noun', 'Verb', 'Adjective', 'Value'],
    },

    Determiner: {
      not: ['Noun', 'Verb', 'Adjective', 'Adverb', 'QuestionWord', 'Conjunction'], //allow 'a' to be a Determiner/Value
    },
    Conjunction: {
      not: anything,
    },
    Preposition: {
      not: ['Noun', 'Verb', 'Adjective', 'Adverb', 'QuestionWord'],
    },
    QuestionWord: {
      not: ['Determiner'],
    },
    Currency: {
      is: 'Noun',
    },
    Expression: {
      not: ['Noun', 'Adjective', 'Verb', 'Adverb'],
    },
    Abbreviation: {},
    Url: {
      not: ['HashTag', 'PhoneNumber', 'Verb', 'Adjective', 'Value', 'AtMention', 'Email'],
    },
    PhoneNumber: {
      not: ['HashTag', 'Verb', 'Adjective', 'Value', 'AtMention', 'Email'],
    },
    HashTag: {},
    AtMention: {
      is: 'Noun',
      not: ['HashTag', 'Email'],
    },
    Emoji: {
      not: ['HashTag', 'Verb', 'Adjective', 'Value', 'AtMention'],
    },
    Emoticon: {
      not: ['HashTag', 'Verb', 'Adjective', 'Value', 'AtMention'],
    },
    Email: {
      not: ['HashTag', 'Verb', 'Adjective', 'Value', 'AtMention'],
    },
    Acronym: {
      not: ['Plural', 'RomanNumeral'],
    },
    Negative: {
      not: ['Noun', 'Adjective', 'Value'],
    },
    Condition: {
      not: ['Verb', 'Adjective', 'Noun', 'Value'],
    },
  };

  let tags = Object.assign({}, nouns, verbs, values, dates, misc);

  var tagset = {
    tags
  };

  //a hugely-ignorant, and widely subjective transliteration of latin, cryllic, greek unicode characters to english ascii.
  //approximate visual (not semantic or phonetic) relationship between unicode and ascii characters
  //http://en.wikipedia.org/wiki/List_of_Unicode_characters
  //https://docs.google.com/spreadsheet/ccc?key=0Ah46z755j7cVdFRDM1A2YVpwa1ZYWlpJM2pQZ003M0E


  // á	Alt + 0225
  // é	Alt + 0233
  // í	Alt + 0237
  // ó	Alt + 024
  // ú	Alt + 0250
  // ü	Alt + 0252
  // ñ	Alt + 0241
  // ¿	Alt + 0191
  // ¡	Alt + 0161

  let compact = {
    '?': 'Ɂ',
    '"': '“”"❝❞',
    "'": '‘‛❛❜’',
    '-': '—–',
    a: 'ªÃÅãåĀāĂăĄąǍǎǞǟǠǡǺǻȀȁȂȃȦȧȺΆΑΔΛάαλАаѦѧӐӑӒӓƛæ',
    b: 'þƀƁƂƃƄƅɃΒβϐϦБВЪЬвъьѢѣҌҍ',
    c: '¢©ĆćĈĉĊċČčƆƇƈȻȼͻͼϲϹϽϾСсєҀҁҪҫ',
    d: 'ÐĎďĐđƉƊȡƋƌ',
    e: 'ĒēĔĕĖėĘęĚěƐȄȅȆȇȨȩɆɇΈΕΞΣέεξϵЀЁЕеѐёҼҽҾҿӖӗ',
    f: 'ƑƒϜϝӺӻҒғſ',
    g: 'ĜĝĞğĠġĢģƓǤǥǦǧǴǵ',
    h: 'ĤĥĦħƕǶȞȟΉΗЂЊЋНнђћҢңҤҥҺһӉӊ',
    i: 'ĨĩĪīĬĭĮįİıƖƗȈȉȊȋΊΐΪίιϊІЇії',
    j: 'ĴĵǰȷɈɉϳЈј',
    k: 'ĶķĸƘƙǨǩΚκЌЖКжкќҚқҜҝҞҟҠҡ',
    l: 'ĹĺĻļĽľĿŀŁłƚƪǀǏǐȴȽΙӀӏ',
    m: 'ΜϺϻМмӍӎ',
    n: 'ŃńŅņŇňŉŊŋƝƞǸǹȠȵΝΠήηϞЍИЙЛПийлпѝҊҋӅӆӢӣӤӥπ',
    o: 'ÕØðõøŌōŎŏŐőƟƠơǑǒǪǫǬǭǾǿȌȍȎȏȪȫȬȭȮȯȰȱΌΘΟθοσόϕϘϙϬϴОФоѲѳӦӧӨөӪӫ',
    p: 'ƤΡρϷϸϼРрҎҏÞ',
    q: 'Ɋɋ',
    r: 'ŔŕŖŗŘřƦȐȑȒȓɌɍЃГЯгяѓҐґ',
    s: 'ŚśŜŝŞşŠšƧƨȘșȿЅѕ',
    t: 'ŢţŤťŦŧƫƬƭƮȚțȶȾΓΤτϮТт',
    u: 'µŨũŪūŬŭŮůŰűŲųƯưƱƲǓǔǕǖǗǘǙǚǛǜȔȕȖȗɄΰμυϋύ',
    v: 'νѴѵѶѷ',
    w: 'ŴŵƜωώϖϢϣШЩшщѡѿ',
    x: '×ΧχϗϰХхҲҳӼӽӾӿ',
    y: 'ÝýÿŶŷŸƳƴȲȳɎɏΎΥΫγψϒϓϔЎУучўѰѱҮүҰұӮӯӰӱӲӳ',
    z: 'ŹźŻżŽžƵƶȤȥɀΖ',
  };
  //decompress data into two hashes
  let unicode = {};
  Object.keys(compact).forEach(function (k) {
    compact[k].split('').forEach(function (s) {
      unicode[s] = k;
    });
  });
  var unicode$1 = unicode;

  var contractions = [

  ];

  var tokenizer = {
    mutate: (world) => {
      world.model.one.unicode = unicode$1;

      world.model.one.contractions = contractions;

      // 'que' -> 'quebec'
      delete world.model.one.lexicon.que;
    }
  };

  const findNumbers = function (view) {
    let m = view.match('#Value+');
    //5-8
    m = m.splitAfter('#NumberRange');
    // june 5th 1999
    m = m.splitBefore('#Year');
    return m
  };
  var find = findNumbers;

  var data = {
    ones: [
      [1, 'uno', 'primero'],
      [2, 'dos', 'segundo'],
      [3, 'tres', 'tercero'],
      [4, 'cuatro', 'cuarto'],
      [5, 'cinco', 'quinto'],
      [6, 'seis', 'sexto'],
      [7, 'siete', 'sétimo'],
      [8, 'ocho', 'octavo'],
      [9, 'nueve', 'noveno'],
      [10, 'diez', 'décimo'],
      [11, 'once', 'undécimo'],
      [12, 'doce', 'duodécimo'],
      [13, 'trece', 'decimotercero'],
      [14, 'catorce', 'decimocuarto'],
      [15, 'quince', 'decimoquinto'],
      [16, 'dieciséis', 'decimosexto'],
      [17, 'diecisiete', 'decimoséptimo'],
      [18, 'dieciocho', 'decimoctavo'],
      [19, 'diecinueve', 'decimonoveno'],
      [20, 'veinte', 'vigésimo'],//20th
      [21, 'veintiuno', 'vigésimo primero'],//21st
      [22, 'veintidós', 'vigésimo segundo'],//22nd
      [23, 'veintitrés', 'vigésimo tercero'],//23rd
      [24, 'veinticuatro', 'vigésimo cuarto'],//24th
      [25, 'veinticinco', 'vigésimo quinto'],
      [26, 'veintiséis', 'vigésimo sexto'],
      [27, 'veintisiete', 'vigésimo sétimo'],
      [28, 'veintiocho', 'vigésimo octavo'],
      [29, 'veintinueve', 'vigésimo noveno'],
    ],

    tens: [
      [30, 'treinta', 'trigésimo'],
      [40, 'cuarenta', 'cuadragésimo'],
      [50, 'cincuenta', 'quincuagésimo'],
      [60, 'sesenta', 'sexagésimo'],
      [70, 'setenta', 'septuagésimo'],
      [80, 'ochenta', 'octogésimo'],
      [90, 'noventa', 'nonagésimo'],
    ],

    hundreds: [
      [100, 'ciento', 'centésimo'],
      [200, 'doscientos', 'ducentésimo'],
      [300, 'trescientos', 'tricentésimo'],
      [400, 'cuatrocientos', 'cuadringentésimo'],
      [500, 'quinientos', 'quingentésimo'],
      [600, 'seiscientos', 'sexcentésimo'],
      [700, 'setecientos', 'septingentésimo'],
      [800, 'ochocientos', 'octingésimo'],
      [900, 'novecientos', 'noningentésimo'],
    ],
    multiples: [
      [1000, 'mil', 'milésimo'],
      [1000000, 'millón', 'millonésima'],
    ]
  };

  const toCardinal = {};
  const toNumber = {};

  Object.keys(data).forEach(k => {
    data[k].forEach(a => {
      let [num, card, ord] = a;
      toCardinal[ord] = card;
      toNumber[card] = num;
    });
  });
  // add extras
  toNumber['cien'] = 100;

  let multiples$1 = {
    // ciento: 100,
    mil: 1000,
    millones: 1000000,
    millón: 1000000
  };

  const fromText = function (terms) {
    let sum = 0;
    let carry = 0;
    let minus = false;
    for (let i = 0; i < terms.length; i += 1) {
      let { tags, normal } = terms[i];
      let w = normal || '';
      // ... y-ocho
      if (w === 'y') {
        continue
      }
      // minus eight
      if (w === 'menos') {
        minus = true;
        continue
      }
      // 'huitieme'
      if (tags.has('Ordinal')) {
        w = toCardinal[w];
      }
      // 'cent'
      if (multiples$1.hasOwnProperty(w)) {
        let mult = multiples$1[w] || 1;
        if (carry === 0) {
          carry = 1;
        }
        // console.log('carry', carry, 'mult', mult, 'sum', sum)
        sum += mult * carry;
        carry = 0;
        continue
      }
      // 'tres'
      if (toNumber.hasOwnProperty(w)) {
        carry += toNumber[w];
      } else {
        console.log('missing', w);
      }
    }
    // include any remaining
    if (carry !== 0) {
      sum += carry;
    }
    if (minus === true) {
      sum *= -1;
    }
    return sum
  };
  var fromText$1 = fromText;

  const fromNumber = function (m) {
    let str = m.text('normal').toLowerCase();
    str = str.replace(/(e|er)$/, '');
    let hasComma = false;
    if (/,/.test(str)) {
      hasComma = true;
      str = str.replace(/,/g, '');
    }
    // get prefix/suffix
    let arr = str.split(/([0-9.,]*)/);
    let [prefix, num] = arr;
    let suffix = arr.slice(2).join('');
    if (num !== '' && m.length < 2) {
      num = Number(num || str);
      //ensure that num is an actual number
      if (typeof num !== 'number') {
        num = null;
      }
      // strip an ordinal off the suffix
      if (suffix === 'e' || suffix === 'er') {
        suffix = '';
      }
    }
    return {
      hasComma,
      prefix,
      num,
      suffix,
    }
  };

  const parseNumber = function (m) {
    let terms = m.docs[0];
    let num = null;
    let prefix = '';
    let suffix = '';
    let hasComma = false;
    let isText = m.has('#TextValue');
    if (isText) {
      num = fromText$1(terms);
    } else {
      let res = fromNumber(m);
      prefix = res.prefix;
      suffix = res.suffix;
      num = res.num;
      hasComma = res.hasComma;
    }
    return {
      hasComma,
      prefix,
      num,
      suffix,
      isText,
      isOrdinal: m.has('#Ordinal'),
      isFraction: m.has('#Fraction'),
      isMoney: m.has('#Money'),
    }
  };
  var parse = parseNumber;

  const toOrdinal = {};

  Object.keys(data).forEach(k => {
    data[k].forEach(a => {
      let [num, card, ord] = a;
      toOrdinal[card] = ord;
    });
  });

  let ones = data.ones.reverse();
  let tens = data.tens.reverse();
  let hundreds = data.hundreds.reverse();

  let multiples = [
    [1000000, 'millón',],
    [1000, 'mil',],
    // [100, 'cent'],
    [1, 'one'],
  ];

  //turn number into an array of magnitudes, like [[5, million], [2, hundred]]
  const getMagnitudes = function (num) {
    let working = num;
    let have = [];
    multiples.forEach(a => {
      if (num >= a[0]) {
        let howmany = Math.floor(working / a[0]);
        working -= howmany * a[0];
        if (howmany) {
          have.push({
            unit: a[1],
            num: howmany,
          });
        }
      }
    });
    return have
  };

  const twoDigit = function (num) {
    let words = [];
    let addAnd = false;
    // 100-900
    for (let i = 0; i < hundreds.length; i += 1) {
      if (hundreds[i][0] <= num) {
        words.push(hundreds[i][1]);
        num -= hundreds[i][0];
        break
      }
    }
    // 30-90
    for (let i = 0; i < tens.length; i += 1) {
      if (tens[i][0] <= num) {
        words.push(tens[i][1]);
        num -= tens[i][0];
        addAnd = true;
        break
      }
    }
    if (num === 0) {
      return words
    }
    // 0-29
    for (let i = 0; i < ones.length; i += 1) {
      if (ones[i][0] <= num) {
        // 'y dos'
        if (words.length > 0 && addAnd) {
          words.push('y');
        }
        words.push(ones[i][1]);
        num -= ones[i][0];
        break
      }
    }
    return words
  };

  const toText = function (num) {
    if (num === 0) {
      return ['cero']
    }
    if (num === 100) {
      return ['cien']
    }
    let words = [];
    if (num < 0) {
      words.push('moins');
      num = Math.abs(num);
    }
    // handle multiples
    let found = getMagnitudes(num);
    found.forEach(obj => {
      let res = twoDigit(obj.num);
      words = words.concat(res);
      if (obj.unit !== 'one') {
        words.push(obj.unit);
      }
    });
    // console.log(num)
    return words
  };
  var toText$1 = toText;

  const formatNumber = function (parsed, fmt) {
    if (fmt === 'TextOrdinal') {
      let words = toText$1(parsed.num);
      words = words.map(w => {
        if (toOrdinal.hasOwnProperty) {
          return toOrdinal[w]
        }
        return w
      });
      return words.join(' ')
    }
    if (fmt === 'TextCardinal') {
      return toText$1(parsed.num).join(' ')
    }
    if (fmt === 'Cardinal') {
      return String(parsed.num)
    }
    return String(parsed.num || '')
  };
  var format = formatNumber;

  // return the nth elem of a doc
  const getNth = (doc, n) => (typeof n === 'number' ? doc.eq(n) : doc);

  const api = function (View) {
    /**   */
    class Numbers extends View {
      constructor(document, pointer, groups) {
        super(document, pointer, groups);
        this.viewType = 'Numbers';
      }
      parse(n) {
        return getNth(this, n).map(parse)
      }
      get(n) {
        return getNth(this, n).map(parse).map(o => o.num)
      }
      json(n) {
        let doc = getNth(this, n);
        return doc.map(p => {
          let json = p.toView().json(n)[0];
          let parsed = parse(p);
          json.number = {
            prefix: parsed.prefix,
            num: parsed.num,
            suffix: parsed.suffix,
            hasComma: parsed.hasComma,
          };
          return json
        }, [])
      }
      /** any known measurement unit, for the number */
      units() {
        return this.growRight('#Unit').match('#Unit$')
      }
      /** return only ordinal numbers */
      isOrdinal() {
        return this.if('#Ordinal')
      }
      /** return only cardinal numbers*/
      isCardinal() {
        return this.if('#Cardinal')
      }

      /** convert to numeric form like '8' or '8th' */
      toNumber() {
        let m = this.if('#TextValue');
        m.forEach(val => {
          let obj = parse(val);
          if (obj.num === null) {
            return
          }
          let fmt = val.has('#Ordinal') ? 'Ordinal' : 'Cardinal';
          let str = format(obj, fmt);
          if (str) {
            val.replaceWith(str, { tags: true });
            val.tag('NumericValue');
          }
        });
        return this
      }
      /** convert to numeric form like 'eight' or 'eighth' */
      toText() {
        let m = this;
        let res = m.map(val => {
          if (val.has('#TextValue')) {
            return val
          }
          let obj = parse(val);
          if (obj.num === null) {
            return val
          }
          let fmt = val.has('#Ordinal') ? 'TextOrdinal' : 'TextCardinal';
          let str = format(obj, fmt);
          if (str) {
            val.replaceWith(str, { tags: true });
            val.tag('TextValue');
          }
          return val
        });
        return new Numbers(res.document, res.pointer)
      }
      /** convert ordinal to cardinal form, like 'eight', or '8' */
      toCardinal() {
        let m = this;
        let res = m.map(val => {
          if (!val.has('#Ordinal')) {
            return val
          }
          let obj = parse(val);
          if (obj.num === null) {
            return val
          }
          let fmt = val.has('#TextValue') ? 'TextCardinal' : 'Cardinal';
          let str = format(obj, fmt);
          if (str) {
            val.replaceWith(str, { tags: true });
            val.tag('Cardinal');
          }
          return val
        });
        return new Numbers(res.document, res.pointer)
      }
      /** convert cardinal to ordinal form, like 'eighth', or '8th' */
      toOrdinal() {
        let m = this;
        let res = m.map(val => {
          if (val.has('#Ordinal')) {
            return val
          }
          let obj = parse(val);
          if (obj.num === null) {
            return val
          }
          let fmt = val.has('#TextValue') ? 'TextOrdinal' : 'Ordinal';
          let str = format(obj, fmt);
          if (str) {
            val.replaceWith(str, { tags: true });
            val.tag('Ordinal');
          }
          return val
        });
        return new Numbers(res.document, res.pointer)
      }

      /** return only numbers that are == n */
      isEqual(n) {
        return this.filter((val) => {
          let num = parse(val).num;
          return num === n
        })
      }
      /** return only numbers that are > n*/
      greaterThan(n) {
        return this.filter((val) => {
          let num = parse(val).num;
          return num > n
        })
      }
      /** return only numbers that are < n*/
      lessThan(n) {
        return this.filter((val) => {
          let num = parse(val).num;
          return num < n
        })
      }
      /** return only numbers > min and < max */
      between(min, max) {
        return this.filter((val) => {
          let num = parse(val).num;
          return num > min && num < max
        })
      }
      /** set these number to n */
      set(n) {
        if (n === undefined) {
          return this // don't bother
        }
        if (typeof n === 'string') {
          n = parse(n).num;
        }
        let m = this;
        let res = m.map((val) => {
          let obj = parse(val);
          obj.num = n;
          if (obj.num === null) {
            return val
          }
          let fmt = val.has('#Ordinal') ? 'Ordinal' : 'Cardinal';
          if (val.has('#TextValue')) {
            fmt = val.has('#Ordinal') ? 'TextOrdinal' : 'TextCardinal';
          }
          let str = format(obj, fmt);
          // add commas to number
          if (obj.hasComma && fmt === 'Cardinal') {
            str = Number(str).toLocaleString();
          }
          if (str) {
            val = val.not('#Currency');
            val.replaceWith(str, { tags: true });
            // handle plural/singular unit
            // agreeUnits(agree, val, obj)
          }
          return val
        });
        return new Numbers(res.document, res.pointer)
      }
      add(n) {
        if (!n) {
          return this // don't bother
        }
        if (typeof n === 'string') {
          n = parse(n).num;
        }
        let m = this;
        let res = m.map((val) => {
          let obj = parse(val);
          if (obj.num === null) {
            return val
          }
          obj.num += n;
          let fmt = val.has('#Ordinal') ? 'Ordinal' : 'Cardinal';
          if (obj.isText) {
            fmt = val.has('#Ordinal') ? 'TextOrdinal' : 'TextCardinal';
          }
          let str = format(obj, fmt);
          if (str) {
            val.replaceWith(str, { tags: true });
            // handle plural/singular unit
            // agreeUnits(agree, val, obj)
          }
          return val
        });
        return new Numbers(res.document, res.pointer)
      }
      /** decrease each number by n*/
      subtract(n, agree) {
        return this.add(n * -1, agree)
      }
      /** increase each number by 1 */
      increment(agree) {
        return this.add(1, agree)
      }
      /** decrease each number by 1 */
      decrement(agree) {
        return this.add(-1, agree)
      }
      // overloaded - keep Numbers class
      update(pointer) {
        let m = new Numbers(this.document, pointer);
        m._cache = this._cache; // share this full thing
        return m
      }
    }
    // aliases
    Numbers.prototype.isBetween = Numbers.prototype.between;
    Numbers.prototype.minus = Numbers.prototype.subtract;
    Numbers.prototype.plus = Numbers.prototype.add;
    Numbers.prototype.equals = Numbers.prototype.isEqual;

    View.prototype.numbers = function (n) {
      let m = find(this);
      m = getNth(m, n);
      return new Numbers(this.document, m.pointer)
    };
    // alias
    View.prototype.values = View.prototype.numbers;
  };
  var api$1 = api;

  var numbers = {
    api: api$1
  };

  nlp$1.plugin(tokenizer);
  nlp$1.plugin(tagset);
  nlp$1.plugin(lexicon);
  nlp$1.plugin(preTagger);
  nlp$1.plugin(postTagger);
  nlp$1.plugin(numbers);


  const de = function (txt, lex) {
    let dok = nlp$1(txt, lex);
    return dok
  };

  /** log the decision-making to console */
  de.verbose = function (set) {
    let env = typeof process === 'undefined' ? self.env || {} : process.env; //use window, in browser
    env.DEBUG_TAGS = set === 'tagger' || set === true ? true : '';
    env.DEBUG_MATCH = set === 'match' || set === true ? true : '';
    env.DEBUG_CHUNKS = set === 'chunker' || set === true ? true : '';
    return this
  };

  return de;

}));
