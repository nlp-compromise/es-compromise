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

  const isArray$9 = input => Object.prototype.toString.call(input) === '[object Array]';

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
      else if (isArray$9(input)) {
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

  // wrappers for loops in javascript arrays

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
    let res = ptrs.map((ptr, i) => {
      let view = this.update([ptr]);
      let out = cb(view, i);
      // if we returned nothing, return a view
      if (out === undefined) {
        return this.none()
      }
      return out
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
    ptrs = ptrs.filter((ptr, i) => {
      let view = this.update([ptr]);
      return cb(view, i)
    });
    let res = this.update(ptrs);
    return res
  };

  const find$1 = function (cb) {
    let ptrs = this.fullPointer;
    let found = ptrs.find((ptr, i) => {
      let view = this.update([ptr]);
      return cb(view, i)
    });
    return this.update([found])
  };

  const some = function (cb) {
    let ptrs = this.fullPointer;
    return ptrs.some((ptr, i) => {
      let view = this.update([ptr]);
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
      if (!ptr) {
        ptr = this.docs.map((_doc, i) => [i]);
      }
      if (ptr[n]) {
        return this.update([ptr[n]])
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

    // is the pointer the full sentence?
    isFull: function () {
      let ptrs = this.pointer;
      if (!ptrs) {
        return true
      }
      let document = this.document;
      for (let i = 0; i < ptrs.length; i += 1) {
        let [n, start, end] = ptrs[i];
        // it's not the start
        if (n !== i || start !== 0) {
          return false
        }
        // it's too short
        if (document[n].length > end) {
          return false
        }
      }
      return true
    },

    // return the nth elem of a doc
    getNth: function (n) {
      if (typeof n === 'number') {
        return this.eq(n)
      } else if (typeof n === 'string') {
        return this.if(n)
      }
      return this
    }

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
  var api$j = methods$n;

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
      if (this._cache && pointer && pointer.length > 0) {
        // only keep cache if it's a full-sentence
        let cache = [];
        pointer.forEach((ptr, i) => {
          let [n, start, end] = ptr;
          if (ptr.length === 1) {
            cache[i] = this._cache[n];
          } else if (start === 0 && this.document[n].length === end) {
            cache[i] = this._cache[n];
          }
        });
        if (cache.length > 0) {
          m._cache = cache;
        }
      }
      m.world = this.world;
      return m
    }
    // create a new View, from this one
    toView(pointer) {
      return new View(this.document, pointer || this.pointer)
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
  Object.assign(View.prototype, api$j);
  var View$1 = View;

  var version$1 = '14.8.0';

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

  const addIrregulars = function (model, conj) {
    let m = model.two.models || {};
    Object.keys(conj).forEach(k => {
      // verb forms
      if (conj[k].pastTense) {
        if (m.toPast) {
          m.toPast.exceptions[k] = conj[k].pastTense;
        }
        if (m.fromPast) {
          m.fromPast.exceptions[conj[k].pastTense] = k;
        }
      }
      if (conj[k].presentTense) {
        if (m.toPresent) {
          m.toPresent.exceptions[k] = conj[k].presentTense;
        }
        if (m.fromPresent) {
          m.fromPresent.exceptions[conj[k].presentTense] = k;
        }
      }
      if (conj[k].gerund) {
        if (m.toGerund) {
          m.toGerund.exceptions[k] = conj[k].gerund;
        }
        if (m.fromGerund) {
          m.fromGerund.exceptions[conj[k].gerund] = k;
        }
      }
      // adjective forms
      if (conj[k].comparative) {
        if (m.toComparative) {
          m.toComparative.exceptions[k] = conj[k].comparative;
        }
        if (m.fromComparative) {
          m.fromComparative.exceptions[conj[k].comparative] = k;
        }
      }
      if (conj[k].superlative) {
        if (m.toSuperlative) {
          m.toSuperlative.exceptions[k] = conj[k].superlative;
        }
        if (m.fromSuperlative) {
          m.fromSuperlative.exceptions[conj[k].superlative] = k;
        }
      }
    });
  };

  const extend = function (plugin, world, View, nlp) {
    const { methods, model, compute, hooks } = world;
    if (plugin.methods) {
      mergeQuick(methods, plugin.methods);
    }
    if (plugin.model) {
      mergeDeep(model, plugin.model);
    }
    if (plugin.irregulars) {
      addIrregulars(model, plugin.irregulars);
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

  const isArray$8 = function (arr) {
    return Object.prototype.toString.call(arr) === '[object Array]'
  };

  // internal Term objects are slightly different
  const fromJson = function (json) {
    return json.map(o => {
      return o.terms.map(term => {
        if (isArray$8(term.tags)) {
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
    if (isArray$8(input)) {
      // pre-tokenized array-of-arrays 
      if (isArray$8(input[0])) {
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
  nlp.version = version$1;

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
        if (term.root) {
          stuff.add(term.root);
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
  var api$i = addAPI$3;

  var compute$7 = {
    cache: function (view) {
      view._cache = view.methods.one.cacheDoc(view.document);
    }
  };

  var cache$1 = {
    api: api$i,
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
  let index$2 = 0;

  const pad3 = (str) => {
    str = str.length < 3 ? '0' + str : str;
    return str.length < 3 ? '0' + str : str
  };

  const toId = function (term) {
    let [n, i] = term.index || [0, 0];
    index$2 += 1;

    //don't overflow index
    index$2 = index$2 > 46655 ? 0 : index$2;
    //don't overflow sentences
    n = n > 46655 ? 0 : n;
    // //don't overflow terms
    i = i > 1294 ? 0 : i;

    // 3 digits for time
    let id = pad3(index$2.toString(36));
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
    if (m.has('@hasContraction') && typeof m.contractions === 'function') {//&& m.after('^.').has('@hasContraction')
      let more = m.grow('@hasContraction');
      more.contractions().expand();
    }
  };

  const isArray$7 = (arr) => Object.prototype.toString.call(arr) === '[object Array]';

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
      return input.clone().docs[0] || [] //assume one sentence
    }
    //allow an array of terms, too
    if (isArray$7(input)) {
      return isArray$7(input[0]) ? input[0] : input
    }
    return []
  };

  const insert = function (input, view, prepend) {
    const { document, world } = view;
    view.uncache();
    // insert words at end of each doc
    let ptrs = view.fullPointer;
    let selfPtrs = view.fullPointer;
    view.forEach((m, i) => {
      let ptr = m.fullPointer[0];
      let [n] = ptr;
      // add-in the words
      let home = document[n];
      let terms = getTerms(input, world);
      // are we inserting nothing?
      if (terms.length === 0) {
        return
      }
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
    this.uncache();
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
    if (typeof input === 'string') {
      input = this.fromText(input).compute('id');
    }
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
    // console.log(input.docs[0])
    // let regs = input.docs[0].map(t => {
    //   return { id: t.id, optional: true }
    // })
    // m.after('(a|hoy)').debug()
    // m.growRight('(a|hoy)').debug()
    // console.log(m)
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
    this.soften();
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
      this.uncache();
      // two modes:
      //  - a. remove self, from full parent
      let self = this.all();
      let not = this;
      //  - b. remove a match, from self
      if (reg) {
        self = this;
        not = this.match(reg);
      }
      let isFull = !self.ptrs;
      // is it part of a contraction?
      if (not.has('@hasContraction') && not.contractions) {
        let more = not.grow('@hasContraction');
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
      // if we started zoomed-out, try to end zoomed-out
      if (isFull) {
        self.ptrs = undefined;
      }
      if (!reg) {
        this.ptrs = [];
        return self.none()
      }
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

  var whitespace = methods$j;

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
    this.uncache();
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
    if (this._cache) {
      this._cache = this._cache.reverse();
    }
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

  const isArray$6 = (arr) => Object.prototype.toString.call(arr) === '[object Array]';

  // append a new document, somehow
  const combineDocs = function (homeDocs, inputDocs) {
    if (homeDocs.length > 0) {
      // add a space
      let end = homeDocs[homeDocs.length - 1];
      let last = end[end.length - 1];
      if (/ /.test(last.post) === false) {
        last.post += ' ';
      }
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
    home.document = combineDocs(home.document, input.docs);
    return home.all()
  };

  var concat = {
    // add string as new match/sentence
    concat: function (input) {
      // parse and splice-in new terms
      if (typeof input === 'string') {
        let more = this.fromText(input);
        // easy concat
        if (!this.found || !this.ptrs) {
          this.document = this.document.concat(more.document);
        } else {
          // if we are in the middle, this is actually a splice operation
          let ptrs = this.fullPointer;
          let at = ptrs[ptrs.length - 1][0];
          this.document.splice(at, 0, ...more.document);
        }
        // put the docs
        return this.all().compute('index')
      }
      // plop some view objects together
      if (typeof input === 'object' && input.isView) {
        return combineViews(this, input)
      }
      // assume it's an array of terms
      if (isArray$6(input)) {
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

  const methods$h = Object.assign({}, caseFns, insert$1, replace, remove, whitespace, sort$1, concat, harden$1);

  const addAPI$2 = function (View) {
    Object.assign(View.prototype, methods$h);
  };
  var api$h = addAPI$2;

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
    api: api$h,
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

  const numUnit = /^([+-]?[0-9][.,0-9]*)([a-z°²³µ/]+)$/; //(must be lowercase)

  const notUnit = new Set([
    'st',
    'nd',
    'rd',
    'th',
    'am',
    'pm',
    'max',
    '°',
    's', // 1990s
    'e' // 18e - french/spanish ordinal
  ]);

  const numberUnit = function (terms, i) {
    let term = terms[i];
    let parts = term.text.match(numUnit);
    if (parts !== null) {
      // is it a recognized unit, like 'km'?
      let unit = parts[2].toLowerCase().trim();
      // don't split '3rd'
      if (notUnit.has(unit)) {
        return null
      }
      return [parts[1], unit] //split it
    }
    return null
  };
  var numberUnit$1 = numberUnit;

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
    doc.compute(['id', 'alias']);
    return doc.docs[0]
  };

  //really easy ones
  const contractions$2 = (view) => {
    let { world, document } = view;
    const { model, methods } = world;
    let list = model.one.contractions || [];
    new Set(model.one.units || []);
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
              methods.one.setTag([words[0]], 'Time', world, null, 'time-range');
            }
            reTag(document[n], view, i, words.length);
          }
          continue
        }
        // split-apart '4km'
        words = numberUnit$1(terms, i);
        if (words) {
          words = toDocs(words, view);
          splice(document, [n, i], words);
          methods.one.setTag([words[1]], 'Unit', world, null, 'contraction-unit');
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
  const lexicon$5 = function (view) {
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
    lexicon: lexicon$5
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
      word = word.replace(/'s\b/, '');
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
    let terms = methods.one.tokenize.splitTerms(phrase, model).map(t => methods.one.tokenize.splitWhitespace(t, model));
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

  function api$g (View) {

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
    buildTrie: function (input) {
      const trie = build(input, this.world());
      return compress$1(trie)
    }
  };
  // add alias
  lib$4.compile = lib$4.buildTrie;

  var lookup = {
    api: api$g,
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

  const parseRegs = function (regs, opts, world) {
    const one = world.methods.one;
    if (typeof regs === 'number') {
      regs = String(regs);
    }
    // support param as string
    if (typeof regs === 'string') {
      regs = one.killUnicode(regs, world);
      regs = one.parseMatch(regs, opts, world);
    }
    return regs
  };

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
    regs = parseRegs(regs, opts, this.world);
    let todo = { regs, group };
    let res = one.match(this.docs, todo, this._cache);
    let { ptrs, byGroup } = fixPointers(res, this.fullPointer);
    let view = this.toView(ptrs);
    view._groups = byGroup;
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
    regs = parseRegs(regs, opts, this.world);
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
    regs = parseRegs(regs, opts, this.world);
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
    regs = parseRegs(regs, opts, this.world);
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
    regs = parseRegs(regs, opts, this.world);
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

  const combine = function (left, right) {
    return [left[0], left[1], right[2]]
  };

  const isArray$5 = function (arr) {
    return Object.prototype.toString.call(arr) === '[object Array]'
  };

  const getDoc$3 = (reg, view, group) => {
    if (typeof reg === 'string' || isArray$5(reg)) {
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
        res.push(combine(o.match, o.after));
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
        res.push(combine(o.before, o.match));
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
  var api$f = matchAPI;

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

      //root/sense overloaded
      if (start(w) === '{' && end(w) === '}') {
        w = stripBoth(w);
        // obj.sense = w
        obj.root = w;
        if (/\//.test(w)) {
          let split = obj.root.split(/\//);
          obj.root = split[0];
          obj.pos = split[1];
          if (obj.pos === 'adj') {
            obj.pos = 'Adjective';
          }
          // titlecase
          obj.pos = obj.pos.charAt(0).toUpperCase() + obj.pos.substr(1).toLowerCase();
          // add sense-number too
          if (split[2] !== undefined) {
            obj.sense = split[2];
          }
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

  // add all conjugations of this verb
  const addVerbs = function (token, world) {
    let { all } = world.methods.two.transform.verb || {};
    let str = token.root;
    // if (toInfinitive) {
    //   str = toInfinitive(str, world.model)
    // }
    if (!all) {
      return []
    }
    return all(str, world.model)
  };

  // add all inflections of this noun
  const addNoun = function (token, world) {
    let { all } = world.methods.two.transform.noun || {};
    if (!all) {
      return [token.root]
    }
    return all(token.root, world.model)
  };

  // add all inflections of this adjective
  const addAdjective = function (token, world) {
    let { all } = world.methods.two.transform.adjective || {};
    if (!all) {
      return [token.root]
    }
    return all(token.root, world.model)
  };

  // turn '{walk}' into 'walking', 'walked', etc
  const inflectRoot = function (regs, world) {
    // do we have compromise/two?
    regs = regs.map(token => {
      // a reg to convert '{foo}'
      if (token.root) {
        // check if compromise/two is loaded
        if (world.methods.two && world.methods.two.transform) {
          let choices = [];
          // have explicitly set from POS - '{sweet/adjective}'
          if (token.pos) {
            if (token.pos === 'Verb') {
              choices = choices.concat(addVerbs(token, world));
            } else if (token.pos === 'Noun') {
              choices = choices.concat(addNoun(token, world));
            } else if (token.pos === 'Adjective') {
              choices = choices.concat(addAdjective(token, world));
            }
          } else {
            // do verb/noun/adj by default
            choices = choices.concat(addVerbs(token, world));
            choices = choices.concat(addNoun(token, world));
            choices = choices.concat(addAdjective(token, world));
          }
          choices = choices.filter(str => str);
          if (choices.length > 0) {
            token.operator = 'or';
            token.fastOr = new Set(choices);
          }
        } else {
          // if no compromise/two, drop down into 'machine' lookup
          token.machine = token.root;
          delete token.id;
          delete token.root;
        }
      }
      return token
    });

    return regs
  };
  var inflectRoot$1 = inflectRoot;

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
    // '{walk}'
    tokens = inflectRoot$1(tokens, world);
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
  const hasDash$1 = / [-–—]{1,3} /;

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
    /** is there a colon after term word? */
    hasColon: term => hasPost(term, ':'),
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
    // match an id
    if (reg.id !== undefined && reg.id === term.id) {
      return true
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
      // {work/verb} must be a verb
      if (reg.pos && !term.tags.has(reg.pos)) {
        return null
      }
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

  const isArray$4 = function (arr) {
    return Object.prototype.toString.call(arr) === '[object Array]'
  };

  const doOrBlock$1 = function (state, skipN = 0) {
    let block = state.regs[state.r];
    let wasFound = false;
    // do each multiword sequence
    for (let c = 0; c < block.choices.length; c += 1) {
      // try to match this list of tokens
      let regs = block.choices[c];
      if (!isArray$4(regs)) {
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

  const negGreedy = function (state, reg, nextReg) {
    let skip = 0;
    for (let t = state.t; t < state.terms.length; t += 1) {
      let found = matchTerm(state.terms[t], reg, state.start_i + state.t, state.phrase_length);
      // we don't want a match, here
      if (found) {
        break//stop going
      }
      // are we doing 'greedy-to'?
      // - "!foo+ after"  should stop at 'after'
      if (nextReg) {
        found = matchTerm(state.terms[t], nextReg, state.start_i + state.t, state.phrase_length);
        if (found) {
          break
        }
      }
      skip += 1;
      // is it max-length now?
      if (reg.max !== undefined && skip === reg.max) {
        break
      }
    }
    if (skip === 0) {
      return false //dead
    }
    // did we satisfy min for !foo{min,max}
    if (reg.min && reg.min > skip) {
      return false//dead
    }
    state.t += skip;
    // state.r += 1
    return true
  };

  var negGreedy$1 = negGreedy;

  // '!foo' should match anything that isn't 'foo'
  // if it matches, return false
  const doNegative = function (state) {
    const { regs } = state;
    let reg = regs[state.r];

    // match *anything* but this term
    let tmpReg = Object.assign({}, reg);
    tmpReg.negative = false; // try removing it

    // found it? if so, we die here
    let found = matchTerm(state.terms[state.t], tmpReg, state.start_i + state.t, state.phrase_length);
    if (found) {
      return false//bye
    }
    // should we skip the term too?
    if (reg.optional) {
      // "before after" - "before !foo? after"
      // does the next reg match the this term?
      let nextReg = regs[state.r + 1];
      if (nextReg) {
        let fNext = matchTerm(state.terms[state.t], nextReg, state.start_i + state.t, state.phrase_length);
        if (fNext) {
          state.r += 1;
        } else if (nextReg.optional && regs[state.r + 2]) {
          // ugh. ok,
          // support "!foo? extra? need"
          // but don't scan ahead more than that.
          let fNext2 = matchTerm(state.terms[state.t], regs[state.r + 2], state.start_i + state.t, state.phrase_length);
          if (fNext2) {
            state.r += 2;
          }
        }
      }
    }
    // negative greedy - !foo+  - super hard!
    if (reg.greedy) {
      return negGreedy$1(state, tmpReg, regs[state.r + 1])
    }
    state.t += 1;
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
    // console.log(`\n\n:start: '${terms[0].text}':`)
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
        // '!.' negative anything should insta-fail
        if (reg.negative && reg.anything) {
          return null
        }
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
      // ok, it doesn't match - but maybe it wasn't *supposed* to?
      if (reg.negative) {
        // we want *anything* but this term
        let alive = doNegative$1(state);
        if (!alive) {
          return null
        }
        continue
      }
      // ok, finally test the term-reg
      // console.log('   - ' + state.terms[state.t].text)
      let hasMatch = matchTerm(state.terms[state.t], reg, state.start_i + state.t, state.phrase_length);
      if (hasMatch === true) {
        let alive = simpleMatch$1(state);
        if (!alive) {
          return null
        }
        continue
      }
      // console.log('=-=-=-= here -=-=-=-')

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

  const notIf = function (results, not, docs) {
    results = results.filter(res => {
      let [n, start, end] = res.pointer;
      let terms = docs[n].slice(start, end);
      for (let i = 0; i < terms.length; i += 1) {
        let slice = terms.slice(i);
        let found = fromHere(slice, not, i, terms.length);
        if (found !== null) {
          return false
        }
      }
      return true
    });
    return results
  };

  var notIf$1 = notIf;

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
    if (todo.notIf) {
      results = notIf$1(results, todo.notIf, docs);
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
    api: api$f,
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
      keepSpace: false,
      whitespace: 'some',
      punctuation: 'some',
      case: 'none',
      unicode: 'some',
      form: 'machine',
    },
    root: {
      keepSpace: false,
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

  /* eslint-disable no-bitwise */
  /* eslint-disable no-mixed-operators */
  /* eslint-disable no-multi-assign */

  // https://github.com/jbt/tiny-hashes/
  let k = [], i$1 = 0;
  for (; i$1 < 64;) {
    k[i$1] = 0 | Math.sin(++i$1 % Math.PI) * 4294967296;
  }

  function md5(s) {
    let b, c, d,
      h = [b = 0x67452301, c = 0xEFCDAB89, ~b, ~c],
      words = [],
      j = decodeURI(encodeURI(s)) + '\x80',
      a = j.length;

    s = (--a / 4 + 2) | 15;

    words[--s] = a * 8;

    for (; ~a;) {
      words[a >> 2] |= j.charCodeAt(a) << 8 * a--;
    }

    for (i$1 = j = 0; i$1 < s; i$1 += 16) {
      a = h;

      for (; j < 64;
        a = [
          d = a[3],
          (
            b +
            ((d =
              a[0] +
              [
                b & c | ~b & d,
                d & b | ~d & c,
                b ^ c ^ d,
                c ^ (b | ~d)
              ][a = j >> 4] +
              k[j] +
              ~~words[i$1 | [
                j,
                5 * j + 1,
                3 * j + 5,
                7 * j
              ][a] & 15]
            ) << (a = [
              7, 12, 17, 22,
              5, 9, 14, 20,
              4, 11, 16, 23,
              6, 10, 15, 21
            ][4 * a + j++ % 4]) | d >>> -a)
          ),
          b,
          c
        ]
      ) {
        b = a[1] | 0;
        c = a[2];
      }
      for (j = 4; j;) h[--j] += a[j];
    }

    for (s = ''; j < 32;) {
      s += ((h[j >> 3] >> ((1 ^ j++) * 4)) & 15).toString(16);
    }

    return s;
  }

  // console.log(md5('food-safety'))

  const defaults$1 = {
    text: true,
    terms: true,
  };

  let opts = { case: 'none', unicode: 'some', form: 'machine', punctuation: 'some' };

  const merge = function (a, b) {
    return Object.assign({}, a, b)
  };

  const fns$1 = {
    text: (terms) => textFromTerms(terms, { keepPunct: true }, false),
    normal: (terms) => textFromTerms(terms, merge(fmts$1.normal, { keepPunct: true }), false),
    implicit: (terms) => textFromTerms(terms, merge(fmts$1.implicit, { keepPunct: true }), false),

    machine: (terms) => textFromTerms(terms, opts, false),
    root: (terms) => textFromTerms(terms, merge(opts, { form: 'root' }), false),

    hash: (terms) => md5(textFromTerms(terms, { keepPunct: true }, false)),

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
          text = `{${t.normal}/${t.sense}}`;
        }
        if (t.implicit) {
          text = '[' + t.implicit + ']';
        }
        text = cli$1.yellow(text);
        let word = "'" + text + "'";
        if (t.reference) {
          let str = view.update([t.reference]).text('normal');
          word += ` - ${cli$1.dim(cli$1.i('[' + str + ']'))}`;
        }
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
          text += terms[i].pre || '';
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
    if (method === 'root') {
      return this.text('root')
    }
    if (method === 'machine' || method === 'reduced') {
      return this.text('machine')
    }
    if (method === 'hash' || method === 'md5') {
      return md5(this.text())
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
    out,
    /** */
    wrap: function (obj) {
      return wrap$1(this, obj)
    },
  };

  var out$1 = methods$9;

  const isObject$1 = val => {
    return Object.prototype.toString.call(val) === '[object Object]'
  };

  var text = {
    /** */
    text: function (fmt) {
      let opts = {};
      if (fmt && typeof fmt === 'string' && fmts$1.hasOwnProperty(fmt)) {
        opts = Object.assign({}, fmts$1[fmt]);
      } else if (fmt && isObject$1(fmt)) {
        opts = Object.assign({}, fmt);//todo: fixme
      }
      if (opts.keepSpace === undefined && this.pointer) {
        opts.keepSpace = false;
      }
      if (opts.keepPunct === undefined && this.pointer) {
        let ptr = this.pointer[0];
        if (ptr && ptr[1]) {
          opts.keepPunct = false;
        } else {
          opts.keepPunct = true;
        }
      }
      // set defaults
      if (opts.keepPunct === undefined) {
        opts.keepPunct = true;
      }
      if (opts.keepSpace === undefined) {
        opts.keepSpace = true;
      }
      return textFromDoc(this.docs, opts)
    },
  };

  const methods$8 = Object.assign({}, out$1, text, json, html$1);

  const addAPI$1 = function (View) {
    Object.assign(View.prototype, methods$8);
  };
  var api$e = addAPI$1;

  var output = {
    api: api$e,
    methods: {
      one: {
        hash: md5
      }
    }
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

  const max$1 = 20;

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

  const isArray$3 = function (arr) {
    return Object.prototype.toString.call(arr) === '[object Array]'
  };

  const getDoc = (m, view) => {
    if (typeof m === 'string' || isArray$3(m)) {
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
  var api$d = addAPI;

  var pointers = {
    methods: methods$7,
    api: api$d,
  };

  var lib$2 = {
    // compile a list of matches into a match-net
    buildNet: function (matches) {
      const methods = this.methods();
      let net = methods.one.buildNet(matches, this.world());
      net.isNet = true;
      return net
    }
  };

  const api$b = function (View) {

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
  var api$c = api$b;

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

  const getNeeds = function (regs) {
    let needs = [];
    regs.forEach(reg => {
      needs.push(getTokenNeeds(reg));
      // support AND (foo && tag)
      if (reg.operator === 'and' && reg.choices) {
        reg.choices.forEach(oneSide => {
          oneSide.forEach(r => {
            needs.push(getTokenNeeds(r));
          });
        });
      }
    });
    return needs.filter(str => str)
  };

  const getWants = function (regs) {
    let wants = [];
    let count = 0;
    regs.forEach(reg => {
      if (reg.operator === 'or' && !reg.optional && !reg.negative) {
        // add fast-or terms
        if (reg.fastOr) {
          Array.from(reg.fastOr).forEach(w => {
            wants.push(w);
          });
        }
        // add slow-or
        if (reg.choices) {
          reg.choices.forEach(rs => {
            rs.forEach(r => {
              let n = getTokenNeeds(r);
              if (n) {
                wants.push(n);
              }
            });
          });
        }
        count += 1;
      }
    });
    return { wants, count }
  };

  const parse$2 = function (matches, world) {
    const parseMatch = world.methods.one.parseMatch;
    matches.forEach(obj => {
      obj.regs = parseMatch(obj.match, {}, world);
      // wrap these ifNo properties into an array
      if (typeof obj.ifNo === 'string') {
        obj.ifNo = [obj.ifNo];
      }
      if (obj.notIf) {
        obj.notIf = parseMatch(obj.notIf, {}, world);
      }
      // cache any requirements up-front 
      obj.needs = getNeeds(obj.regs);
      let { wants, count } = getWants(obj.regs);
      obj.wants = wants;
      obj.minWant = count;
      // get rid of tiny sentences
      obj.minWords = obj.regs.filter(o => !o.optional).length;
    });
    return matches
  };

  var parse$3 = parse$2;

  // do some indexing on the list of matches
  const buildNet = function (matches, world) {
    // turn match-syntax into json
    matches = parse$3(matches, world);

    // collect by wants and needs
    let hooks = {};
    matches.forEach(obj => {
      // add needs
      obj.needs.forEach(str => {
        hooks[str] = hooks[str] || [];
        hooks[str].push(obj);
      });
      // add wants
      obj.wants.forEach(str => {
        hooks[str] = hooks[str] || [];
        hooks[str].push(obj);
      });
    });
    // remove duplicates
    Object.keys(hooks).forEach(k => {
      let already = {};
      hooks[k] = hooks[k].filter(obj => {
        if (already[obj.match]) {
          return false
        }
        already[obj.match] = true;
        return true
      });
    });

    // keep all un-cacheable matches (those with no needs) 
    let always = matches.filter(o => o.needs.length === 0 && o.wants.length === 0);
    return {
      hooks,
      always
    }
  };

  var buildNet$1 = buildNet;

  // for each cached-sentence, find a list of possible matches
  const getHooks = function (docCaches, hooks) {
    return docCaches.map((set, i) => {
      let maybe = [];
      Object.keys(hooks).forEach(k => {
        if (docCaches[i].has(k)) {
          maybe = maybe.concat(hooks[k]);
        }
      });
      // remove duplicates
      let already = {};
      maybe = maybe.filter(m => {
        if (already[m.match]) {
          return false
        }
        already[m.match] = true;
        return true
      });
      return maybe
    })
  };

  var getHooks$1 = getHooks;

  // filter-down list of maybe-matches
  const localTrim = function (maybeList, docCache) {
    return maybeList.map((list, n) => {
      let haves = docCache[n];
      // ensure all stated-needs of the match are met
      list = list.filter(obj => {
        return obj.needs.every(need => haves.has(need))
      });
      // ensure nothing matches in our 'ifNo' property
      list = list.filter(obj => {
        if (obj.ifNo !== undefined && obj.ifNo.some(no => haves.has(no)) === true) {
          return false
        }
        return true
      });
      // ensure atleast one(?) of the wants is found
      list = list.filter(obj => {
        if (obj.wants.length === 0) {
          return true
        }
        // ensure there's one cache-hit
        let found = obj.wants.filter(str => haves.has(str)).length;
        return found >= obj.minWant
      });
      return list
    })
  };
  var trimDown = localTrim;

  // finally,
  // actually run these match-statements on the terms
  const runMatch = function (maybeList, document, docCache, methods, opts) {
    let results = [];
    for (let n = 0; n < maybeList.length; n += 1) {
      for (let i = 0; i < maybeList[n].length; i += 1) {
        let m = maybeList[n][i];
        // ok, actually do the work.
        let res = methods.one.match([document[n]], m);
        // found something.
        if (res.ptrs.length > 0) {
          res.ptrs.forEach(ptr => {
            ptr[0] = n; // fix the sentence pointer
            // check ifNo
            // if (m.ifNo !== undefined) {
            //   let terms = document[n].slice(ptr[1], ptr[2])
            //   for (let k = 0; k < m.ifNo.length; k += 1) {
            //     const no = m.ifNo[k]
            //     // quick-check cache
            //     if (docCache[n].has(no)) {
            //       if (no.startsWith('#')) {
            //         let tag = no.replace(/^#/, '')
            //         if (terms.find(t => t.tags.has(tag))) {
            //           console.log('+' + tag)
            //           return
            //         }
            //       } else if (terms.find(t => t.normal === no || t.tags.has(no))) {
            //         console.log('+' + no)
            //         return
            //       }
            //     }
            //   }
            // }
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
    let maybeList = getHooks$1(docCache, net.hooks);
    // ensure all defined needs are met for each match
    maybeList = trimDown(maybeList, docCache);
    // add unchacheable matches to each sentence's todo-list
    if (net.always.length > 0) {
      maybeList = maybeList.map(arr => arr.concat(net.always));
    }
    // if we don't have enough words
    maybeList = tooSmall(maybeList, document);

    // now actually run the matches
    let results = runMatch$1(maybeList, document, docCache, methods, opts);
    // console.dir(results, { depth: 5 })
    return results
  };
  var bulkMatch = sweep$1;

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

  const tagger$1 = function (list, document, world) {
    const { model, methods } = world;
    const { getDoc, setTag, unTag } = methods.one;
    const looksPlural = methods.two.looksPlural;
    if (list.length === 0) {
      return list
    }
    // some logging for debugging
    const env = typeof process === 'undefined' || !process.env ? self.env || {} : process.env;
    if (env.DEBUG_TAGS) {
      console.log(`\n\n  \x1b[32m→ ${list.length} post-tagger:\x1b[0m`); //eslint-disable-line
    }
    return list.map(todo => {
      if (!todo.tag && !todo.chunk && !todo.unTag) {
        return
      }
      let reason = todo.reason || todo.match;
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
        setTag(terms, todo.tag, world, todo.safe, `[post] '${reason}'`);
        // quick and dirty plural tagger
        if (todo.tag === 'Noun') {
          let term = terms[terms.length - 1];
          if (looksPlural(term.text)) {
            setTag([term], 'Plural', world, todo.safe, 'quick-plural');
          } else {
            setTag([term], 'Singular', world, todo.safe, 'quick-singular');
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
  var bulkTagger = tagger$1;

  var methods$5 = {
    buildNet: buildNet$1,
    bulkMatch,
    bulkTagger
  };

  var sweep = {
    lib: lib$2,
    api: api$c,
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
    // now it's dirty?
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
  const log = (terms, tag, reason = '') => {
    const yellow = str => '\x1b[33m\x1b[3m' + str + '\x1b[0m';
    const i = str => '\x1b[3m' + str + '\x1b[0m';
    let word = terms.map(t => {
      return t.text || '[' + t.implicit + ']'
    }).join(' ');
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
      log(terms, tag, reason);
    }
    if (isArray$2(tag) === true) {
      tag.forEach(tg => setTag(terms, tg, world, isSafe));
      return
    }
    if (typeof tag !== 'string') {
      console.warn(`compromise: Invalid tag '${tag}'`);// eslint-disable-line
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

  const e=function(e){return e.children=e.children||[],e._cache=e._cache||{},e.props=e.props||{},e._cache.parents=e._cache.parents||[],e._cache.children=e._cache.children||[],e},t=/^ *(#|\/\/)/,n=function(t){let n=t.trim().split(/->/),r=[];n.forEach((t=>{r=r.concat(function(t){if(!(t=t.trim()))return null;if(/^\[/.test(t)&&/\]$/.test(t)){let n=(t=(t=t.replace(/^\[/,"")).replace(/\]$/,"")).split(/,/);return n=n.map((e=>e.trim())).filter((e=>e)),n=n.map((t=>e({id:t}))),n}return [e({id:t})]}(t));})),r=r.filter((e=>e));let i=r[0];for(let e=1;e<r.length;e+=1)i.children.push(r[e]),i=r[e];return r[0]},r=(e,t)=>{let n=[],r=[e];for(;r.length>0;){let e=r.pop();n.push(e),e.children&&e.children.forEach((n=>{t&&t(e,n),r.push(n);}));}return n},i=e=>"[object Array]"===Object.prototype.toString.call(e),c=e=>(e=e||"").trim(),s=function(c=[]){return "string"==typeof c?function(r){let i=r.split(/\r?\n/),c=[];i.forEach((e=>{if(!e.trim()||t.test(e))return;let r=(e=>{const t=/^( {2}|\t)/;let n=0;for(;t.test(e);)e=e.replace(t,""),n+=1;return n})(e);c.push({indent:r,node:n(e)});}));let s=function(e){let t={children:[]};return e.forEach(((n,r)=>{0===n.indent?t.children=t.children.concat(n.node):e[r-1]&&function(e,t){let n=e[t].indent;for(;t>=0;t-=1)if(e[t].indent<n)return e[t];return e[0]}(e,r).node.children.push(n.node);})),t}(c);return s=e(s),s}(c):i(c)?function(t){let n={};t.forEach((e=>{n[e.id]=e;}));let r=e({});return t.forEach((t=>{if((t=e(t)).parent)if(n.hasOwnProperty(t.parent)){let e=n[t.parent];delete t.parent,e.children.push(t);}else console.warn(`[Grad] - missing node '${t.parent}'`);else r.children.push(t);})),r}(c):(r(s=c).forEach(e),s);var s;},h=e=>"[31m"+e+"[0m",o=e=>"[2m"+e+"[0m",l=function(e,t){let n="-> ";t&&(n=o("→ "));let i="";return r(e).forEach(((e,r)=>{let c=e.id||"";if(t&&(c=h(c)),0===r&&!e.id)return;let s=e._cache.parents.length;i+="    ".repeat(s)+n+c+"\n";})),i},a=function(e){let t=r(e);t.forEach((e=>{delete(e=Object.assign({},e)).children;}));let n=t[0];return n&&!n.id&&0===Object.keys(n.props).length&&t.shift(),t},p={text:l,txt:l,array:a,flat:a},d=function(e,t){return "nested"===t||"json"===t?e:"debug"===t?(console.log(l(e,!0)),null):p.hasOwnProperty(t)?p[t](e):e},u=e=>{r(e,((e,t)=>{e.id&&(e._cache.parents=e._cache.parents||[],t._cache.parents=e._cache.parents.concat([e.id]));}));},f$3=(e,t)=>(Object.keys(t).forEach((n=>{if(t[n]instanceof Set){let r=e[n]||new Set;e[n]=new Set([...r,...t[n]]);}else {if((e=>e&&"object"==typeof e&&!Array.isArray(e))(t[n])){let r=e[n]||{};e[n]=Object.assign({},t[n],r);}else i(t[n])?e[n]=t[n].concat(e[n]||[]):void 0===e[n]&&(e[n]=t[n]);}})),e),j=/\//;class g$1{constructor(e={}){Object.defineProperty(this,"json",{enumerable:!1,value:e,writable:!0});}get children(){return this.json.children}get id(){return this.json.id}get found(){return this.json.id||this.json.children.length>0}props(e={}){let t=this.json.props||{};return "string"==typeof e&&(t[e]=!0),this.json.props=Object.assign(t,e),this}get(t){if(t=c(t),!j.test(t)){let e=this.json.children.find((e=>e.id===t));return new g$1(e)}let n=((e,t)=>{let n=(e=>"string"!=typeof e?e:(e=e.replace(/^\//,"")).split(/\//))(t=t||"");for(let t=0;t<n.length;t+=1){let r=e.children.find((e=>e.id===n[t]));if(!r)return null;e=r;}return e})(this.json,t)||e({});return new g$1(n)}add(t,n={}){if(i(t))return t.forEach((e=>this.add(c(e),n))),this;t=c(t);let r=e({id:t,props:n});return this.json.children.push(r),new g$1(r)}remove(e){return e=c(e),this.json.children=this.json.children.filter((t=>t.id!==e)),this}nodes(){return r(this.json).map((e=>(delete(e=Object.assign({},e)).children,e)))}cache(){return (e=>{let t=r(e,((e,t)=>{e.id&&(e._cache.parents=e._cache.parents||[],e._cache.children=e._cache.children||[],t._cache.parents=e._cache.parents.concat([e.id]));})),n={};t.forEach((e=>{e.id&&(n[e.id]=e);})),t.forEach((e=>{e._cache.parents.forEach((t=>{n.hasOwnProperty(t)&&n[t]._cache.children.push(e.id);}));})),e._cache.children=Object.keys(n);})(this.json),this}list(){return r(this.json)}fillDown(){var e;return e=this.json,r(e,((e,t)=>{t.props=f$3(t.props,e.props);})),this}depth(){u(this.json);let e=r(this.json),t=e.length>1?1:0;return e.forEach((e=>{if(0===e._cache.parents.length)return;let n=e._cache.parents.length+1;n>t&&(t=n);})),t}out(e){return u(this.json),d(this.json,e)}debug(){return u(this.json),d(this.json,"debug"),this}}const _=function(e){let t=s(e);return new g$1(t)};_.prototype.plugin=function(e){e(this);};

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
    Hyphenated: 'cyan',
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
      tag = tag.replace(/^#/, '');
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
  var api$a = tagAPI;

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
    api: api$a,
    lib: lib$1
  };

  // split by periods, question marks, unicode ⁇, etc
  const initSplit = /([.!?\u203D\u2E18\u203C\u2047-\u2049]+\s)/g;
  // merge these back into prev sentence
  const splitsOnly = /^[.!?\u203D\u2E18\u203C\u2047-\u2049]+\s$/;
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
        // merge 'foo' + '.'
        if (arr[o + 1] && splitsOnly.test(arr[o + 1]) === true) {
          arr[o] += arr[o + 1];
          arr[o + 1] = '';
        }
        if (arr[o] !== '') {
          all.push(arr[o]);
        }
      }
    }
    return all
  };
  var simpleSplit = basicSplit;

  const hasLetter$1 = /[a-z0-9\u00C0-\u00FF\u00a9\u00ae\u2000-\u3300\ud000-\udfff]/i;
  const hasSomething$1 = /\S/;

  const notEmpty = function (splits) {
    let chunks = [];
    for (let i = 0; i < splits.length; i++) {
      let s = splits[i];
      if (s === undefined || s === '') {
        continue
      }
      //this is meaningful whitespace
      if (hasSomething$1.test(s) === false || hasLetter$1.test(s) === false) {
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
    return chunks
  };
  var simpleMerge = notEmpty;

  //loop through these chunks, and join the non-sentence chunks back together..
  const smartMerge = function (chunks, world) {
    const isSentence = world.methods.one.tokenize.isSentence;
    const abbrevs = world.model.one.abbreviations || new Set();

    let sentences = [];
    for (let i = 0; i < chunks.length; i++) {
      let c = chunks[i];
      //should this chunk be combined with the next one?
      if (chunks[i + 1] && isSentence(c, abbrevs) === false) {
        chunks[i + 1] = c + (chunks[i + 1] || '');
      } else if (c && c.length > 0) {
        //this chunk is a proper sentence..
        sentences.push(c);
        chunks[i] = '';
      }
    }
    return sentences
  };
  var smartMerge$1 = smartMerge;

  // merge embedded quotes into 1 sentence
  // like - 'he said "no!" and left.' 
  const MAX_QUOTE = 280;// ¯\_(ツ)_/¯

  // don't support single-quotes for multi-sentences
  const pairs = {
    '\u0022': '\u0022', // 'StraightDoubleQuotes'
    '\uFF02': '\uFF02', // 'StraightDoubleQuotesWide'
    // '\u0027': '\u0027', // 'StraightSingleQuotes'
    '\u201C': '\u201D', // 'CommaDoubleQuotes'
    // '\u2018': '\u2019', // 'CommaSingleQuotes'
    '\u201F': '\u201D', // 'CurlyDoubleQuotesReversed'
    // '\u201B': '\u2019', // 'CurlySingleQuotesReversed'
    '\u201E': '\u201D', // 'LowCurlyDoubleQuotes'
    '\u2E42': '\u201D', // 'LowCurlyDoubleQuotesReversed'
    '\u201A': '\u2019', // 'LowCurlySingleQuotes'
    '\u00AB': '\u00BB', // 'AngleDoubleQuotes'
    '\u2039': '\u203A', // 'AngleSingleQuotes'
    '\u2035': '\u2032', // 'PrimeSingleQuotes'
    '\u2036': '\u2033', // 'PrimeDoubleQuotes'
    '\u2037': '\u2034', // 'PrimeTripleQuotes'
    '\u301D': '\u301E', // 'PrimeDoubleQuotes'
    // '\u0060': '\u00B4', // 'PrimeSingleQuotes'
    '\u301F': '\u301E', // 'LowPrimeDoubleQuotesReversed'
  };
  const openQuote = RegExp('(' + Object.keys(pairs).join('|') + ')', 'g');
  const closeQuote = RegExp('(' + Object.values(pairs).join('|') + ')', 'g');

  const closesQuote = function (str) {
    if (!str) {
      return false
    }
    let m = str.match(closeQuote);
    if (m !== null && m.length === 1) {
      return true
    }
    return false
  };

  // allow micro-sentences when inside a quotation, like:
  // the doc said "no sir. i will not beg" and walked away.
  const quoteMerge = function (splits) {
    let arr = [];
    for (let i = 0; i < splits.length; i += 1) {
      let split = splits[i];
      // do we have an open-quote and not a closed one?
      let m = split.match(openQuote);
      if (m !== null && m.length === 1) {

        // look at the next sentence for a closing quote,
        if (closesQuote(splits[i + 1]) && splits[i + 1].length < MAX_QUOTE) {
          splits[i] += splits[i + 1];// merge them
          arr.push(splits[i]);
          splits[i + 1] = '';
          i += 1;
          continue
        }
        // look at n+2 for a closing quote,
        if (closesQuote(splits[i + 2])) {
          let toAdd = splits[i + 1] + splits[i + 2];// merge them all
          //make sure it's not too-long
          if (toAdd.length < MAX_QUOTE) {
            splits[i] += toAdd;
            arr.push(splits[i]);
            splits[i + 1] = '';
            splits[i + 2] = '';
            i += 2;
            continue
          }
        }
      }
      arr.push(splits[i]);
    }
    return arr
  };
  var quoteMerge$1 = quoteMerge;

  const MAX_LEN = 250;// ¯\_(ツ)_/¯

  // support unicode variants?
  // https://stackoverflow.com/questions/13535172/list-of-all-unicodes-open-close-brackets
  const hasOpen = /\(/g;
  const hasClosed = /\)/g;
  const mergeParens = function (splits) {
    let arr = [];
    for (let i = 0; i < splits.length; i += 1) {
      let split = splits[i];
      let m = split.match(hasOpen);
      if (m !== null && m.length === 1) {
        // look at next sentence, for closing parenthesis
        if (splits[i + 1] && splits[i + 1].length < MAX_LEN) {
          let m2 = splits[i + 1].match(hasClosed);
          if (m2 !== null && m.length === 1 && !hasOpen.test(splits[i + 1])) {
            // merge in 2nd sentence
            splits[i] += splits[i + 1];
            arr.push(splits[i]);
            splits[i + 1] = '';
            i += 1;
            continue
          }
        }
      }
      arr.push(splits[i]);
    }
    return arr
  };
  var parensMerge = mergeParens;

  //(Rule-based sentence boundary segmentation) - chop given text into its proper sentences.
  // Ignore periods/questions/exclamations used in acronyms/abbreviations/numbers, etc.
  //regs-
  const hasSomething = /\S/;
  const startWhitespace = /^\s+/;

  const splitSentences = function (text, world) {
    text = text || '';
    text = String(text);
    // Ensure it 'smells like' a sentence
    if (!text || typeof text !== 'string' || hasSomething.test(text) === false) {
      return []
    }
    // cleanup unicode-spaces
    text = text.replace('\xa0', ' ');
    // First do a greedy-split..
    let splits = simpleSplit(text);
    // Filter-out the crap ones
    let sentences = simpleMerge(splits);
    //detection of non-sentence chunks:
    sentences = smartMerge$1(sentences, world);
    // allow 'he said "no sir." and left.'
    sentences = quoteMerge$1(sentences);
    // allow 'i thought (no way!) and left.'
    sentences = parensMerge(sentences);
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
  var splitSentences$1 = splitSentences;

  const hasHyphen = function (str, model) {
    let parts = str.split(/[-–—]/);
    if (parts.length <= 1) {
      return false
    }
    const { prefixes, suffixes } = model.one;

    // l-theanine, x-ray
    if (parts[0].length === 1 && /[a-z]/i.test(parts[0])) {
      return false
    }
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

  let notWord = ['.', '?', '!', ':', ';', '-', '–', '—', '--', '...', '(', ')', '[', ']', '"', "'", '`', '«', '»', '*'];
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
  var splitTerms = splitWords;

  //all punctuation marks, from https://en.wikipedia.org/wiki/Punctuation

  //we have slightly different rules for start/end - like #hashtags.
  const isLetter = /\p{Letter}/u;
  const isNumber$1 = /[\p{Number}\p{Currency_Symbol}]/u;
  const hasAcronym = /^[a-z]\.([a-z]\.)+/i;
  const chillin = /[sn]['’]$/;

  const normalizePunctuation = function (str, model) {
    // quick lookup for allowed pre/post punctuation
    let { prePunctuation, postPunctuation, emoticons } = model.one;
    let original = str;
    let pre = '';
    let post = '';
    let chars = Array.from(str);

    // punctuation-only words, like '<3'
    if (emoticons.hasOwnProperty(str.trim())) {
      return { str: str.trim(), pre, post: ' ' } //not great
    }

    // pop any punctuation off of the start
    let len = chars.length;
    for (let i = 0; i < len; i += 1) {
      let c = chars[0];
      // keep any declared chars
      if (prePunctuation[c] === true) {
        continue//keep it
      }
      // keep '+' or '-' only before a number
      if ((c === '+' || c === '-') && isNumber$1.test(chars[1])) {
        break//done
      }
      // '97 - year short-form
      if (c === "'" && c.length === 3 && isNumber$1.test(chars[1])) {
        break//done
      }
      // start of word
      if (isLetter.test(c) || isNumber$1.test(c)) {
        break //done
      }
      // punctuation
      pre += chars.shift();//keep going
    }

    // pop any punctuation off of the end
    len = chars.length;
    for (let i = 0; i < len; i += 1) {
      let c = chars[chars.length - 1];
      // keep any declared chars
      if (postPunctuation[c] === true) {
        continue//keep it
      }
      // start of word
      if (isLetter.test(c) || isNumber$1.test(c)) {
        break //done
      }
      // F.B.I.
      if (c === '.' && hasAcronym.test(original) === true) {
        continue//keep it
      }
      //  keep s-apostrophe - "flanders'" or "chillin'"
      if (c === "'" && chillin.test(original) === true) {
        continue//keep it
      }
      // punctuation
      post = chars.pop() + post;//keep going
    }

    str = chars.join('');
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

  const parseTerm = (txt, model) => {
    // cleanup any punctuation as whitespace
    let { str, pre, post } = tokenize$1(txt, model);
    const parsed = {
      text: str,
      pre: pre,
      post: post,
      tags: new Set(),
    };
    return parsed
  };
  var splitWhitespace = parseTerm;

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

  const isAcronym$2 = function (str) {
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
    if (isAcronym$2(str)) {
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

  // turn a string input into a 'document' json format
  const parse$1 = function (input, world) {
    const { methods, model } = world;
    const { splitSentences, splitTerms, splitWhitespace } = methods.one.tokenize;
    input = input || '';
    // split into sentences
    let sentences = splitSentences(input, world);
    // split into word objects
    input = sentences.map((txt) => {
      let terms = splitTerms(txt, model);
      // split into [pre-text-post]
      terms = terms.map(t => splitWhitespace(t, model));
      // add normalized term format, always
      terms.forEach((t) => {
        normal(t, world);
      });
      return terms
    });
    return input
  };
  var fromString = parse$1;

  const isAcronym$1 = /[ .][A-Z]\.? *$/i; //asci - 'n.s.a.'
  const hasEllipse = /(?:\u2026|\.{2,}) *$/; // '...'
  const hasLetter = /\p{L}/u;
  const leadInit = /^[A-Z]\. $/; // "W. Kensington"

  /** does this look like a sentence? */
  const isSentence = function (str, abbrevs) {
    // must have a letter
    if (hasLetter.test(str) === false) {
      return false
    }
    // check for 'F.B.I.'
    if (isAcronym$1.test(str) === true) {
      return false
    }
    // check for leading initial - "W. Kensington"
    if (str.length === 3 && leadInit.test(str)) {
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

  var methods$3 = {
    one: {
      killUnicode: killUnicode$1,
      tokenize: {
        splitSentences: splitSentences$1,
        isSentence: isSentence$1,
        splitTerms,
        splitWhitespace,
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
    'surg'
    //miss
    //misses
  ];

  var months = ['jan', 'feb', 'mar', 'apr', 'jun', 'jul', 'aug', 'sep', 'sept', 'oct', 'nov', 'dec'];

  var nouns$2 = [
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
    // 'ft', //ambiguous
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
    // 'gb', //ambig
    'tb', //terabyte
    'lx', //lux
    'lm', //lumen
    // 'pa', //ambig
    'fl oz', //
    'yb',
  ];

  // add our abbreviation list to our lexicon
  let list = [
    [misc$2],
    [units, 'Unit'],
    [nouns$2, 'Noun'],
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
    'ex',//ex-wife

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
    u: 'ÙÚÛÜùúûüŨũŪūŬŭŮůŰűŲųƯưƱƲǓǔǕǖǗǘǙǚǛǜȔȕȖȗɄΰυϋύ',
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

  // https://util.unicode.org/UnicodeJsps/list-unicodeset.jsp?a=%5Cp%7Bpunctuation%7D

  // punctuation to keep at start of word
  const prePunctuation = {
    '#': true, //#hastag
    '@': true, //@atmention
    '_': true,//underscore
    '°': true,
    // '+': true,//+4
    // '\\-',//-4  (escape)
    // '.',//.4
    // zero-width chars
    '\u200B': true,
    '\u200C': true,
    '\u200D': true,
    '\uFEFF': true
  };

  // punctuation to keep at end of word
  const postPunctuation = {
    '%': true,//88%
    '_': true,//underscore
    '°': true,//degrees, italian ordinal
    // '\'',// sometimes
    // zero-width chars
    '\u200B': true,
    '\u200C': true,
    '\u200D': true,
    '\uFEFF': true
  };

  const emoticons = {
    '<3': true,
    '</3': true,
    '<\\3': true,
    ':^P': true,
    ':^p': true,
    ':^O': true,
    ':^3': true,
  };

  var model$3 = {
    one: {
      aliases: aliases$1,
      abbreviations,
      prefixes,
      suffixes: suffixes$1,
      prePunctuation,
      postPunctuation,
      lexicon: lexicon$3, //give this one forward
      unicode: unicode$3,
      emoticons
    },
  };

  const hasSlash = /\//;
  const hasDomain = /[a-z]\.[a-z]/i;
  const isMath = /[0-9]/;
  // const hasSlash = /[a-z\u00C0-\u00FF] ?\/ ?[a-z\u00C0-\u00FF]/
  // const hasApostrophe = /['’]s$/

  const addAliases = function (term, world) {
    let str = term.normal || term.text || term.machine;
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

  const api$8 = function (View) {
    View.prototype.autoFill = autoFill;
  };
  var api$9 = api$8;

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
    api: api$9,
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
  nlp$1.plugin(cache$1); //~1kb
  nlp$1.extend(lookup); //7kb
  nlp$1.extend(typeahead); //1kb
  nlp$1.extend(lexicon$4); //1kb
  nlp$1.extend(sweep); //1kb

  // generated in ./lib/lexicon
  var lexData = {
    "Conjunction": "true¦aun2e1mas,ni,o,p0sino,u,y;ero,or1;!ntonces;que",
    "Determiner": "true¦algun6c5e2l1muchos,otra4su4toda4un0vari6;!os;a2os;l,s0;e,ta0;!s;ada,ualquier;as,os",
    "Cardinal": "true¦billoXcMdEmilCnAo8quin7s5tre4un3veint0;e,i0;c0dós,nuJoIsGtrés,uno;inco,uatS;a,o;ce,inOsJ;e0iD;isHsLte4;ce,iH;ch0nN;enJoE;ove0uA;ciDnH;!l0;oJón;ie1o0;ce,s8;ci0z;nu3o2s0;i0éis;ete;cho;eve;ator9e8i3ua0;r4tro0;!ci0;entos;en3nc0;o,u0;en0;ta;!to;ro;ce;nes",
    "Adjective": "true¦0:MG;1:NF;2:N1;3:LJ;4:N8;5:NA;6:MI;7:KT;8:KA;9:NC;A:LH;B:MW;C:ML;D:KS;E:M5;F:N0;G:L1;H:FU;I:LF;aJObIHcFNdEBeCJfBNgB1hAKi8Mj8Dkur1l7Pm68n5No5Ap3Rqu3Pr2Qs1Dt0Ju0EvVweb,xeUySzQáOíLóKúJ;ltimDnE4tFJ;pAGs7;be3gn7nJ;fiN7tJ;eg3iN6;ci1l2LrJs3Sto0ur7vi1;abe4i1;aJur1;moLDpoAVragoza0;erN1uJ;caATgoslaKD;nófoIKróDB;aTePiLáKíJ;tr7vi1;li1ndaKQ;ejFKguEkinFlGLolHrLsJtAu1vo4zcIO;iJuA;bG9go1;tuAulH;c0Mllu1nezoGHrKsperK6tJ;eL1us2;an4NdJsátEYt32;ader5e4;cPgOlNno,q45riMsJ;alKGcJto;oJón;!nN5;abFZop92;lisoleI4ón;abBKo;u0ío;bFSltraKDmbrIOnLrKteLMzbeJ;co,ko;b7Pug47;iJíCR;forFVversA;a0Ae02he,iZoVrOuLárta3éKíJ;mi1pD3;cni8rmLA;cuHYnHVrJ;bJco,ístD0;io,ulH;aKemBZiJoH7un8;lobuLZsJT;cMdicLZnKsJvieC;e3lúLJ;quiJUsJ;grK2lúLHm08vLQ;io,t9;le73n2rLscKtJ;al,ona8;a0o;do,e3;bKer0ll,n2roJ;id7lE;eHDio;atrAba0mpPn78rJsal6utGóri8;cMmóC1rJ;eKiJáqu7;to8N;no,s8O;erJio;!a;orArK3;iwVng30rJuKPí0;as8dHQt7X;a0Le0Ci07oYuKíIEóJúpHG;li1rBF;ave4bUcSdReQficiJ3je2mPpKrc3YsJtDN;odicJPtitu2;erKreJ;mo,s9;!doKTfKiJCvJ;is9;iBGlI;er6o;co,l2vo;anE;es9iJulH;n2o;alJcampeGdesarrolKYmaK9u6P;pi0t9O;bOcialNlKmJnor5r1viéHU;brH8e3;aJemne,it0No;!rJ;!ieF;!es,isJB;erKrJ;ehuGKio;a0b6;amEgMlLmKnJr6;ce3ieJFóB8;il4FpC1;vA3íc7;nificaHGuiDK;cQdPguOmiMnLptentrDYrKvJxuBñe3;e3ilEB;b6e0io,ra0;cill5egalEsa2;cJdesnu1áKU;on0AáC1;nCQro;iHuGJ;o4retoDDundariD3;b6crRgrCHjGlPmOnKrJ;do,race0;!gKjuani0o,tJ;afeJDiagJBo;riHuJ;inolHín7;a46oa0;iJtGGvo;no,tGN;o,íleF;a0DeRiQoLuKápid5íJ;gi1;a0b3do,ma0rBs5;b9NcMd6jLmKn8q1IsaJt93;do,ri0;anDo;a,iblan8o4;ie3ke3ocó;c5oja0;a01cXdWfUgSlRmo2nPpLsponsD9tKvolucionJ;ar6;iBUrógGS;le2rJ;esKoJ;duFT;alDPor;aJombraBX;centI1no;aBRigiosDle0;ioJularEH;!nB;iJRleJ;ct9jo,xiGU;on1uFK;e56honcHRiLoleKtJípro8;ang2LilCWor;ct9to;enJQo;c6lJ;!eJ;nFs;dLlo,ncKquíd7ro,sJ;o,tFP;he3io;icA;eJie2ímEK;bequEchua,ri1;a0Pe0Ji0Hl0Eo03rNuLáAMéKíJóstuJ2úblEI;ca3o;nduGUtr7;d8Uer8lc3ntiagu1rJto;iEKo,p9HulH;acFReViSoLáctHZóJ;diFsJximBL;pe3;bC9cedBRduEYfNgen9TliF8mLn2pKsperan1teEYvJ;eniBQin91;enCiDuls9;eJiscIot9;d6tIW;a0esIMuJ;nd5so;e2mJn1W;aEEerJigFX;!a4os;cKdecGNmatu3r6UsJvi5;enIXidenFOo,to,un2;olombi0urs9;bSdRlOp08rMsJtoHK;iKtJ;eriGHre3;b9Qtiv5;ci0tJ;u2TátAL;a8iKvoriHíJ;c1TfaFgaIAtDQ;c1Sn4P;eros5ri1;la1re;aKeJ;be00n5;no,ye3;cu1gm7nJ;na1o,t9;cu77dunA3lNnMor,queñDrKsqJ;ue3;la1manFOpJsonalCWteneciAWua0vHQ;etIleEC;tá8Vúl54;i45u1;cífi8ga0lRmpH4rKtJuH5;er0r6óGR;aMciAdLeE7iGWtiJ;cJsa0;ul1H;o,us8;gJleFJ;uaJ;yo;aJesF1me3;cJti0;ieF;bRcPfiEOmnCCpMrKsc60toDAvJ;i0oid7ípa3;al,deHQiJtodoB2;e5ZginBun1;a8eraE8oKrFIuJ;es2lH;r3Bs8C;ciJhava1ul2;de5Uta0;eClLre3sJtuCv6;cJole2;e0u3;icIonF;aYeTiSoMuJíEFómada4;cleJevDlo,meros65;aJó7G;do,rH7;b8EcNmbE2rKtJva2;ab8Do;cKmaJoesEQueF;lH3n1;orG7;iEAtur0;pGtrogeH5;cMfas2gKoJrv6Rto,ut3;grana4UyorqFV;aDMrJ;a,o4uz8;esariDio;cGNpoliCCtMvKzJ;are0i;aJie3;l,r3;al,o,urB;a0Je0Ci07oWuPáNédi8íMóLúJ;ltiplJsi8;e4o;r8Fv8R;nKse3;s,xJ;im5;do,er2la2nMsJtI;cKicJulmAZ;alGGóE7;ulAU;dKiJ;cipB;a0iA;deSlRnMrJzo;aKe0iJmGo,u0;b58s8;do,l;ocMtKóJ;gaG2to0;aJevidFAés;no,ñE;roFZ;daDBes2;rnDs2;lLsKxtJ;e8il9Do;mDógi0;anEitJ;arFW;dNjDTnLrJtropolitEBxicEBzqES;id92oJ;!vAH;oJtAu1;rFRs;iJo;a,evAo;cXdWeE9gUlRnPrOsNtKuJyDM;riB5;eJuCX;mát3UrJ;iAno;cuEPi7M;aga2ino4í2L;cheFdBNifiD0so,uJ;eEMfacBT;!aKig0lorquBMo,tJv2GéBD;r16és;!yo;nJro;o,éC1;eBOu3;ab3edBH;a02eYiRlQoNuKáct7íJúEM;m4Wqui1;sKteDDxemburJ;guE;iAMo;buEVcJmbar1ngeCC;alF2oJ;!mBL;a0e0orG;bNgMmLnKs2tJ;erari5ua0;do,eAgER;p6ítrof9P;e3ue3;anEerJio,re4;al,ti0;cLgKja0n2oEXtJ;ra1ón;alEQo,í1T;he3t9;cLdrGnKrgDsciBXtJxo;erBin5o;ceolad6Iu1;io,rimóDE;aOeNoLuJóven9D;dJguetGnto4s2ven6O;i4Mí73;rJvEX;da0;mABró4T;cobKponJ;esa,és;eo,i0;be3d1FguBl18mp12nNrLsKtaliJzquierd5;an6V;abeDFomorCNraelí,óCA;aJredH;c36n6;a0Vc0Rd0Ge0Ef0Ag08h07i06just05m01na2oZquie2sVtLus16vJút6B;as9erJá5L;so6Z;eKrJ;auteD5uCé3Rí3A;lec3YnPrJ;!ceNesE9iMmed6nKuJvent9;rba0;aJo4;!cDQs;no,or;pt9;cDCs5;atKeJospe5G;ct8Hgu3nsa2r2;isfJuAN;ecBY;cIdo3porJ;tu0;aLeKunJ;do,osuprBL;dia2nCrC;cuDCdu3;ifiCEo;ciAnterrum37;abiCWu94;enIlesJra2;a,es;aLeKraJun53;rro9N;liz,riBA;me,nt5G;quí3Lsper0BxpJ;er2loA5;eQiLoJustriBígena4;e7Klo3nJ;es6;ferenc72g0o,sJviduB;cKtJ;in2;rJuA7;e2iCY;bi1fKpendienteJs4MterCX;!mAKs;enCi8Q;i4IoJruHul2ómo1;lo3mpKnJrpAA;cluCe6CtroCN;le2ren2Q;cabUdJlte9Pni43prop6Q;ecuTv21;ar,eNoMrKuJío;ls9ro;eJop6;s9v47;rtCWsib5Z;riA;eNiKusJ;tre4;mJr6;itJ;ad5;gíJso;tiCB;eAón7;aWeSiQoLuKáb4IíbCLúJ;me1n8X;e8gono9XmanDracaCGér3C;cicu1mLnKrJ;izoASr20;do,es2;ogOóJ;fo0loFniC2;d2Crsu2sJ;pano09tór7G;br7chi97lLrb6SteroJ;do5JgJ;én7;a1e0;bituBlóKmbrJr2;e,iH;fi9Nge0;aZeXiWlUoTrMuJé3C;aJerrill4Kipuzcoa0;po,rdi6CtemalJ;te8;aLecoKiJose3ueC;eg5s;!la91rW;nKsJto,ve4;iHo;!aJde4;di0;do,r1;aJobAút7;b3u8;g6Vta0;nJográfAFr74st9;erBui0étAE;di6XlJr36scGuc9N;lLoJés;!rJ;ro6Z;ar1eF;a0Ae07i01lXoVrQuMác3FéKísJ;icAY;rJti1;r7t3C;erBGnKtJ;ur5;c4CdameJes2;ntB;aKecu3VisGug5RíJ;a,o4vo8R;ncKtJudulH;er0;esA0is8Eo,és;lclór9VrJ;mAni1;aKexi84oJ;jo,ri1;co,mJ;en8íge3;brad7XcticiNdedig0eMjo,lLnJr47;aJo;l,nciero4;ipi0óso92;lANro;as,os;cKderAliJmenin5o;no,z;un1;lLmJríng7sci2Gvor3T;iJosD;li4V;lo,s5;br6conóm5Qd19f17g16jecu73l10m0Zn0Up0Rqu0Orrón7s01t00uropeDvid7ZxJ;!ac8PcXen2haWiVpTtJó96;ePin2rJ;aLem5ovKíJ;nse8;er7E;ct9njerKterrJ;est9B;a4os;nKrJ;i82n2P;di1s5;erJreC;ime8Kto;gIst2T;us2;elJret9;en7Jso;er0rus8ér7;bel2c00enZlXpQqui74tJ;aOeNon6r1OuKánd49úJ;pi1;dKpJ;en1;ioC;!l44;b30dounidense4n8tB;aNeLiriKlénJur6;di1;tuA;cJso;iBíf09;ciBr50ñolJ;!a4es;a6PovJ;a8e0;ciA;aMleKoJue2;cEl3R;róJ;fi70;ndina6Is1U;iKíJ;vo8;lib62no,val6R;icKóJ;ni90;úr7;a0cMdLemiFfer8YoKreve6PtJ;e3usias7D;ja1rme4;oc82ó7S;ant9Cima;bara88is9;eJéctr5W;ctJva1;orLróJ;fi6JnJ;ic1D;!al;eo,ipc6oís72;ec0Ric5BíJ;me3;it9;a0Te00iMoLruCuJéb0R;lJr5;ce,zG;b1Vlo8Rmin3Wrmi1;e73fUgTminu2oce5KploSrect1CsNur0vKáJ;fa0;erJi0;sJti1;as,o4;cMj83pJtintD;erConibKuestJ;!o;le4;apaci7Ore2;ma1;itAno;er0ZuJíc21;n2so10; mo0Ab09c08f05l03n01pZrYsJvo2;aVcRdiQemplPhon5MiOnu1o12pKtru43vaJ;li1;iLrJ;e3RovJ;is2;aNer2;er2;ea1;cha1;alLonKuiJ;da1;o76tH;zo;fo77perciJ;bi1;ech5;ortivJred81;as,o;so,tiJ;cu7C;gJicJ;ad77;ens9iniJ;tiJ;va;a0idI;il;da;nEñi0;a1Qe1Hh19i14l12oXrQuLáKéleb6EóJ;mo1nca4Irn7;li1ntab3;aMba0er1ltLrJstod6ánt65;si,vJ;il0Jo;o,urB;d3r5F;an67eOiKoa5EuJí3S;do,en2;ol4QstJ;a65iJ;anJno;a,o4;ci4Hs6B;l0Km0EnVoUque2rLsJ;a8tJ;era;a5YdQea0int6nu1pOreKso,tJuñE;a4e3To4;ctKspondiJ;en6Z;a,oJ;!r;orAulHór7;en2;a1ille4R;rde6O;c00du2IeZfXj68mov6Ko5WsOtLvJ;eJulC;rCxo;en2iJ;gInJ;e4Wu5;aPerv6QiMpLtJult9;an6LitucJri2B;ionA;icI;derJst3T;abJ;le;bi1nguJ;ín7;orJuC;me;xo;ienzu1re2;ar3Fer30pKunJún;es,is4A;lKosteJ;la0;eJi4Q;j5t5;e1ToJ;mbiJniAri1;a0no;aJo2Más2Q;ndes30r5;clóp7eMlLmarrGrcuKvJ;il5N;l01nv16;ia1;go,ntíf2KrtD;aOecMiKoJur3;lo,ro;f59lJno;en5lG;he0oJ;!slova8;rJto;ro,t18;lPnLrJ;caJebrAra1;!nD;s9trJ;al57oeKíJ;fuFpe2;urop7;es2Qtíbe3ulJ;ar;duc03l02mZnWpSrNsLtJu2;alJól3Z;án;e3tJ;ell3Eo;acterís1Nc3PnMoKroñe3tJ;ag0Ru16;!lJ;ing6;ívo3;aKitalJri0uchi0;!i0;cJz;es;an7cerí3Hi0o,sa1tJ;an29oJ;nEr;boKpeJ;ro,si0ón;ya0;cár7i23mo,vo;ifol6o;a0He09i02lanZoVrOuLáKíJúl11;fi1pe1;rba3sQva3;enKfo,rJ;do,guElG;!a4o4;a1JeOiKuJ;jo,s0Dto;llLtJ;a0ánJ;icD;an1R;tGve;goLhem6mKol38rJsn6to,vi0;goñGrac2A;bo;ta0;cKdo,quJ;eci0;a4o4uz8;eMlbLnaKrJzar3;ma0;ria;aí0;lorruCnJ;veJ;ni1;a2l1FnMoc6rJ;ber10ebKlJ;inE;er;eKig0éJ;vo1A;dic0UfaJ;ct9;bilPilNjDldMrKstJyo;ar1o;a2bu1cel0WroJí26;co4;ío;arJ;ín;on6;b3Fc34d2Ve2Tf2Pg2Lje2Jl1Zm1Mn0Xp0Rqu7r07s02tWuPvLzuKére5ñeJ;jo;caLl37;aLenJ;tuJ;re3;n2Ero;dOstrohúnNtJ;oKóJ;c1Rgra1Enom5;gest2HmJpropul0M;ot9;ga3;az;eMlánLrJ;acJevi1oz;ti02;ti8;n2o,rJ;ciope2Ir34;esMiKtu2íJ;ncro0;dIlvestJr6;ra1;i0or;aZbYca0dIenWgSio,mRqueológicQrNtJábiF;eLifiKístJ;ic5;ciB;sa0;epenKies2WoJ;ce3;ti1;os;en6;eKiJ;vo;li0nJ;ti0;is8;co;ór7;gKm7uJ;ca0;onE;aKuJócrifo4;es2;iLrJ;enJ;te;sa1;a03c02d00eZfiXgWhid3iUtMuBáLóJ;maJni1P;lo;loF;eNiJ;aér7c1JguDsubJ;ma0R;a4o4;eo;cKriJ;or1K;es9;ma1sóJ;tropo;evi0losajGos2;b6triG;ón;jo,xo;aluz,i0orJ;ra0;ho;e0Tlfabe2rJ;anja1quJ;isJ;ta;aSbiMeriKorJpli5;fo;cJnd6;an5;dieMeKgI;uo;ntA;al;st3;ro;do,rJ;go,illJ;a,en2o;a01bZcaYdXeSfonRgOoNpi0tMucKócJ;to0;inóJ;ge0;a4er0o4;ca1;ebraKonqJ;ui0;ica;si0;gMjandLmJnt0W;anJán;a4es;ri0;re;ea0;li0;anEi0;és;do,no;dreJno;za1;iLrJudo4;adeJio,ícola4óno01;ci1;ta1;ga0icKoJ;rtu06;io05;no;rob6;io;ecQiNjMministrativLul2vJ;erC;so;a4o;un2;cKnteJ;la1;ionB;ua1;ampaSep2iaFoOtLuKérriJ;mo;miQ;iv5uB;alJ;!es;gJrazoM;ed9;go;to;na1;neTorigSrumQsOuJ;ndKrJ;ri1;anJ;te4;!s;olut5ur1;a,o;ad9;or;en;ga1;do",
    "Pronoun": "true¦alguna,cu8donde,e5le7m4n2otros,quien,s1t1vu3é0;l,ste;e,uy4;os,u0;estr2;e,í1;ll0sto;a0o0;!s;al0yo;!es",
    "Noun": "true¦0:3K;1:3V;2:34;3:2X;4:2W;5:2N;6:3U;7:3B;a38b36c2Ad23e1Sf1Lg1Gh1Ci17j15l11m0Rn0Oo0Kp06quieb3UrXsLtFuEv9web3é8;t1Uxi1Y;ari0eAi9o8ue26;c7lum1t0;no,rg1sL;cin8get2nta2W;d3Ao;mbr2nión soviét1Osu39;aCeAodo2Ir8áct1Nécn26;a8en,ibun7áf5;bajo,ta6;m8o0Ormin7;pora1Sát1J;ll3maA;aHeEiCoAu8;e8spi3H;ño;breviAlic8;it0;gnifi0Er8;vi24;m9rpi23ñ8;al2Xor;a2Eifina2B;b1Xl8ntand3;!ar2Ses;aFeBi9o8égim1ío;b1Un;tu7v8;al2Qer;i28pAs8;taur0u8;l2Em1;oso,resent0úbl1G;dica20na;aJeGico1RlEoCrAu8órt5;e8l02nta4;n2Rrto r5;imo,o8ueba,áct1B;pósi0Wspec0W;co,rta8tenci2;da,l;a8ur2;c3n;r8so;egri1Tiód5s8;on2pec2E;go,n,ra4s8t1D;a2Jo;céano Apon1Br9so,t8;an,ro;b1Id1ig1;atlánt5pacíf5;a4e9i8;nten6ño;ga25olít5umát5;aEeCiAo2Du8;e8j3n6;b1Cst28;emb29nera8ra4to;!l1V;mbra1Cnest3r8t7zcla;ca6;druBgo,mífe25n9quinaria,rg1teria17yo8ña1A;ría;u2za18;aAev0i9le8ás3íd3;ga4;bera12ngüístZtor2;do,na;orna06u8úpit3;e1Mga4;d0Rmag1n8;cen1WfAglés,icia1Nst0te9v8;ernade1Ui18;gr2lectua0V;an1OormE;a9erma0Wimml3o8í1V;spit7y;b8da,rry pott3;a0TiR;a0PeBobAra8u0;do,m8;átK;ern0ier0Q;meVn,r0B;aCestiv7iBoAu8ábrZ;e8ner2;n1Crzas arm01;n6rma;li2na0G;bric0cha4l8rmacéut5;la,ta;ditori2jercic0WmHnFrudiEs8xam1;cla1CpCt8;a9udi0ét8;ica;d8n13;o,ístO;aDos04;to;a08cabeza6sala4tr8;aAega;baja4ir,plea6;aDesBiAo9éca8;daT;cument2n0;agnóst5buj0en0Tne0Xpu0Bsposi0Y;arrol8ord1;lo;t0Bño;aPerOhicMiudadaZlKoDr9u8ánc3;an6er4l0Tra;iAát3ít9ón8;icC;icaJ;m1st7;mBnAorden8s01;ad8;as;cejaMtribuyC;and9bustib8erci0;le;an0Do;an,i8;en0B;as,o8;!s;eaE;bKdáv3lza4mFnEpCrBsAtedr8ud2;al,át5;ico;a,o;den7ga,m1nav2áct3;ita8;les;alRcill3;i9pa8;na;no;da;er;alleYle;a8ienestar,ota;n6tman,ño;bYdjeWguUhoTlLmJnDquBrsen2ten9y8ño;er,ud0;ta6;al;ell8í;os;a,i8tepasa6;m7vers8;ar8;io;al8;!es;anFi8;go;gEiBmAt8;ar,erna8;tiva;ir0uerzo;a6c0;an8;te;o,ui1;ra;je8;ro;ti8;vo;dom1o8;ga6;do;en",
    "Preposition": "true¦aGcBd8e5f3ha2junEmedi9p1que,s0tras;egún,in,ob6;aBor;cia,sta;rente 0uerB;a,de;n0xcepto;!cim8t0;re;e1ur0;ante;! acuerdo con,baj8lante Antr8sA;erc3on0;! respec1t0;ra;to a;a 5;! pesa3demás 4l1nte0;!s 3; lad0rededo1;o 1;r 0;de",
    "Adverb": "true¦0:1I;1:1J;a0Zb0Xc0Md0Je0Bf08g06h05i03jam1HlZmWnUoSpFquizáErBs7t2usu0ya,ún0Y;a3o2radicSíp0X;!davía,t0;m3n2rde;!to;bién,pK;egu0Qi3ola1u2í,óI;ce06ficie0Xpues0O;empre,gnifica16m2quiera;p0Kultánea1;a0Me2ápi0T;al1ci2la13spec13;e0Sén;!s;arCerf06o5r2u0Iylori,úbl0K;e3incip0o2áct0J;b0Cfun0NgreXp0U;cisa1v0T;co a p7p9r 3s2;ib0Ater0Q;e3lo 2supues04;menHt02;jemp2l contrario,ntonces;lo;oco;ci0tic2;ular1;cas2fiQrigin0;ion0;atur0eces5o2ue0M;rm0tY;ayorit3u2;cho,y;ar0D;e3i2oc0uego;geXt8;j2nV;os;gu0n2;cluso,iEmediaS;abi0EistórU;en2radu0;er0;in0orm0recueXu2ácil1;er2ndament0;a,te1;conómOn 8s4ven08x2;acKclu2treR;si03;en4pec3tr2;echa1icH;i0ífJ;ci0;consecuencia,gran medida,línea;e3ir2;ecC;finiUla01masia03ntro,spués;asi,laBo4u2;an2;to;m6n2;cre6jun6s2tinI;ider2taE;ab2;le1;ple2ún1;ta1;ra1;astaPien,ás2;ica1; Obajo,cKdFhí,lDmplCn7p3rriba,s2trJun,ún;imismo,í;are4enas,roxi2;ma2;da1;nte1;t2u0;e3ig2;ua1;r2s;ior1;ia1;l2ta1;á,í;e4ministra2;ti2;va1;la6m2;ás;tu0;al1;me2;nte;bor2la vez;do",
    "Region": "true¦0:23;1:1U;a21b1Tc1Jd1Ees1Df1Ag14h11i0Yj0Wk0Ul0Rm0GnZoXpTqQrNsEtButAv7w4y2zacatec23;o05u2;cat19kZ;a2est vi5isconsin,yomi15;rwick1shington2;! dc;er3i2;rgin1T;acruz,mont;ah,tar pradesh;a3e2laxca1EuscaB;nnessee,x1S;bas0Lmaulip1RsmK;a7i5o3taf0Pu2ylh14;ffVrr01s0Z;me11uth 2;cSdR;ber1Jc2naloa;hu0Tily;n3skatchew0Sxo2;ny; luis potosi,ta catari0;a2hode8;j2ngp03;asth0Nshahi;inghai,u2;e2intana roo;bec,ensXreta0F;ara0e3rince edward2; isV;i,nnsylv2rnambu03;an15;axa0Pdisha,h2klaho1Dntar2reg5x06;io;ayarit,eCo4u2;evo le2nav0N;on;r2tt0Tva scot0Z;f7mandy,th2; 2ampton1;c4d3yo2;rk1;ako10;aroli0;olk;bras0Zva03w2; 3foundland2;! and labrador;brunswick,hamp1jers3mexiLyork2;! state;ey;a7i3o2;nta0relos;ch4dlanCn3ss2;issippi,ouri;as geraHneso0N;igRoacR;dhya,harasht05ine,ni4r2ssachusetts;anhao,y2;land;p2toba;ur;anca1e2incoln1ouis9;e2iI;ds;a2entucky,hul0;ns09rnata0Eshmir;alis2iangxi;co;daho,llino3nd2owa;ia0;is;a3ert2idalFunB;ford1;mp1waii;ansu,eorgXlou6u2;an3erre2izhou,jarat;ro;ajuato,gdo2;ng;cester1;lori3uji2;an;da;sex;e5o3uran2;go;rs2;et;lawaFrby1;a9ea8hi7o2umbrI;ahui5l4nnectic3rsi2ventry;ca;ut;iNorado;la;apFhuahua;ra;l9m2;bridge1peche;a6r5uck2;ingham1;shi2;re;emen,itish columb4;h3ja cal2sque,var3;iforn2;ia;guascalientes,l5r2;izo0kans2;as;na;a3ber2;ta;ba3s2;ka;ma",
    "LastName": "true¦0:2Z;1:36;2:34;3:2A;4:2T;5:2V;a36b2Wc2Jd2Ae27f22g1Wh1Mi1Hj1Bk14l0Wm0Mn0Io0Fp04rXsMtHvFwCxBy8zh6;a6ou,u;ng,o;a6eun2Poshi1Hun;ma6ng;da,guc1Wmo23sh1YzaQ;iao,u;a7il6o4right,u;li36s2;gn0lk0ng,tanabe;a6ivaldi;ssilj32zqu1;a9h8i2Bo7r6sui,urn0;an,ynisI;lst0Mrr1Rth;atch0omps2;kah0Snaka,ylor;aDchCemjon3himizu,iBmiAo9t7u6zabo;ar1lliv25zuD;a6ein0;l1Yrm0;sa,u4;rn3th;lva,mmo1Zngh;midt,neid0ulz;ito,n7sa6to;ki;ch1dLtos,z;amBeag1Vi9o7u6;bio,iz,sD;b6dri1JgIj0Rme20osevelt,ssi,ux;erts,ins2;c6ve0D;ci,hards2;ir1os;aEeAh8ic6ow1W;as6hl0;so;a6illips;m,n1P;ders5et8r7t6;e0Lr3;ez,ry;ers;h1Xrk0t6vl3;el,te0H;baBg09liveiZr6;t6w1K;ega,iz;a6eils2guy5ix2owak,ym1A;gy,ka6;ji6muU;ma;aDeBiAo8u6;ll0n6rr09ssolini,ñ6;oz;lina,oIr6zart;al0Keau,r0R;hhail3ll0;rci0ssi6y0;!er;eVmmad3r6tsu06;in,tin1;aCe8i6op1uo;!n6u;coln,dholm;fe7n0Or6w0I;oy;bv6v6;re;mmy,rs5u;aBennedy,imuAle0Jo8u7wo6;k,n;mar,znets3;bay6vacs;asY;ra;hn,rl9to,ur,zl3;aAen9ha4imen1o6u4;h6nYu4;an6ns2;ss2;ki0Cs5;cks2nsse0B;glesi9ke8noue,shik7to,vano6;u,v;awa;da;as;aBe8itchcock,o7u6;!a4b0ghNynh;a4ffmann,rvat;mingw7nde6rM;rs2;ay;ns5rrPs7y6;asDes;an3hi6;moI;a9il,o8r7u6;o,tierr1;ayli4ub0;m1nzal1;nd6o,rcia;hi;er9lor8o7uj6;ita;st0urni0;es;nand1;d7insteGsposi6vaK;to;is2wards;aBevi,i9omin8u6;bo6rand;is;gu1;az,mitr3;ov;nkula,rw7vi6;es,s;in;aFhBlarkAo6;h5l6op0rbyn,x;em7li6;ns;an;!e;an8e7iu,o6ristens5u4we;i,ng,u4w,y;!n,on6u4;!g;mpb7rt0st6;ro;ell;aBe8ha4oyko,r6yrne;ooks,yant;ng;ck7ethov5nnett;en;er,ham;ch,h8iley,rn6;es,i0;er;k,ng;dDl9nd6;ers6rA;en,on,s2;on;eks7iy8var1;ez;ej6;ev;ams",
    "Ordinal": "true¦cWdLmilJnoIoctHpGquinEs8t2unNvigésimo0;! 0;cuSpEs5teN;eMr0;esUi0;ceXgésimo0;! 0;p9s0;eg5;e1é0;ptUtU;g2pt1x0;agRceQto;iOu2;undo;cu0geNto;agN;rim9;aDingLogL;nHv9;lonésim0ésK;a,o;ecimo2osCu0écI;ceFo0;décG;c4nov3quinAs2te0;rc0;ero;ex7éptC;eno;ta1u0;ar4;vo;e5ua0;dr2r1tro0;mil4;to;ag2i0;nge0;nt0;és0;imo",
    "Unit": "true¦bHceFeDfahrenheitIgBhertz,jouleIk8liGm6p4terEy2z1°0µs;c,f,n;b,e1;b,o0;ttA;e0ouceD;rcent,t8;eg7il0³,è9;eAlili8;elvin9ilo1m0;!/h,s;!b6gr1mètre,s;ig2r0;amme5;b,x0;ab2;lsius,ntimè0;tre1;yte0;!s",
    "City": "true¦0:3B;a2Zb29c1Zd1Ue1Tf1Rg1Lh1Di1Bjakar2Kk12l0Vm0Hn0Do0Bp00quiZrWsMtDuCv9w4y2z1;agreb,uri22;ang1We1okohama;katerin1Krev0;ars4e3i1rocl4;ckl0Yn1;nipeg,terth0Z;llingt1Rxford;aw;a2i1;en2Klni33;lenc2Yncouv0Ir2J;lan bat0Ftrecht;a7bilisi,e6he5i4o3rondheim,u1;nWr1;in,ku;kyo,ronJulouD;anj26l16miso2Mra2D; haKssaloni10;gucigalpa,hr0l av0O;i1llinn,mpe2Engi09rtu;chu25n0pU;a4e3h2kopje,t1ydney;ockholm,uttga15;angh1Ienzh20;o0Nv01;int peters0Xl4n1ppo1I; 1ti1E;jo1salv3;se;v1z0T;adW;eykjavik,i2o1;me,sario,t28;ga,o de janei1A;to;a9e7h6i5o3r1ueb1Tyongya1Q;a1etor28;gue;rt1zn0; elizabe4o;ls1Jrae28;iladelph23nom pe0Aoenix;r1tah tik1C;th;lerLr1tr13;is;dessa,s1ttawa;a1Klo;a3ew 1is;delWtaip1york ci1U;ei;goya,nt0Xpl0Xv0;a7e6i5o2u1;mb0Oni0L;nt2sco1;u,w;evideo,real;l0n03skolc;dellín,lbour0U;drid,l6n4r1;ib2se1;ille;or;chest1dalYi11;er;mo;a6i3o1vCy03;nd1s angel0H;on,r0G;ege,ma1nz,sb00verpo2;!ss1;ol; pla0Jusan0G;a6hark5i4laipeda,o2rak1uala lump3;ow;be,pavog1sice;ur;ev,ng9;iv;b4mpa0Lndy,ohsiu0Ira1un04;c1j;hi;ncheNstanb1̇zmir;ul;a6e4o1; chi mi2ms,u1;stJ;nh;lsin1rakliH;ki;ifa,m1noi,va0B;bu0UiltE;alw5dan4en3hent,iza,othen2raz,ua1;dalaj0Hngzhou;bu0R;eVoa,ève;sk;ay;es,rankfu1;rt;dmont5indhovV;a2ha02oha,u1;blSrb0shanbe;e1kar,masc0HugavpiK;gu,je1;on;a8ebu,h3o1raioKuriti02;lo1nstanKpenhagOrk;gGmbo;enn4i2ristchur1;ch;ang m2c1ttagoM;ago;ai;i1lgary,pe town,rac5;ro;aIeCirminghXogoBr6u1;char4dap4enos air3r1s0;g1sa;as;es;est;a3isba2usse1;ls;ne;silRtisla1;va;ta;i4lgrade,r1;g2l1n;in;en;ji1rut;ng;ku,n4r1sel;celo2ranquil1;la;na;g2ja lu1;ka;alo1kok;re;aDbBhmedabad,l8m5n3qa2sh1thens,uckland;dod,gabat;ba;k1twerp;ara;m0s1;terd1;am;exandr2ma1;ty;ia;idj0u dhabi;an;lbo2rh1;us;rg",
    "Country": "true¦0:2M;a2Cb1Yc1Nd1Me1Df19g12h11i0Sj0Qk0Nl0Gm08n04om2Op00rRsFtAu6v4wal3y2z1;a1Rimbab0A;emen,ibu0N;es,lis and futu2D;a1enezue2FietD;nuatu,tican city;cr2Fg0Snited 2ruXs1zbek2H;a,sr;arab emiratIkingdom,states1;! of ameB;a4imor orient0Vo3rinidad y toba08u1únez;r1valu;kmen2Bqu12;go,nS;i0Xnz27yik29;a8e7i6om0Eri lanka,u1;azi0Vdá2ec0iza,ri1;nam;f2n1;! del s18;ri1F;erra leo1Vngap16r0;neg0Jrb0ychell4;moa,n1o tomé y príncipe; 1ta luc0Q;cristóbal y niev1mariSvicente y las granad0N;es;e2u1;an1Qm1Ts0;ino unido,pública 1;c4d1;e1omin4; macedQl1mocrática del1; conL;entroafr1he11;ica1H;a2erú,o1;lLrtug04;k1Lla18namá,púa nueva guin0Gra1íses baj18;guay;a3ep01i2orue1ueva zelUíger;ga;caragua,ger0;mib0uru;a5icroSo2éxi1óna1;co;ldav0n2zambiq1;ue;gol0tenegro;dagasc0Jl1rruec0Xurit18;a1div0Xta,í;s0ui;a0Ue5i3uxembur2íba1;no;go;b1echtenste0Qtu12;er0ia;soZt1;on0;azaj10en0ir1uwait;gu0Ziba1;ti;a1ord0V;mai08pH;nd7r5s2t1;al0;la1rael;nd0s 1;marshall,salomC;ak,l1án;an0K;ia,o1;nes0;aití,ondur0AungrD;a5ha0Er4u1;atema0Ginea1ya0D;! ecuatori1-bisáu;al;ana0Cec0;b1mb0;ón;i1ranc0;lip2n1yi;land0;inZ;cu8gip7l salv8miratos árabe6ritr5s2tiop1;ía;lov2paña,t1;ado3on0;aqu0en0;ea;s unidR;to;ador;inamarDominiD;a8hi6o1roac0uba;lo4morNrea del 2sta 1te d'ivoi6;de marfEriA;norte,s1;ur;mb0;le,na,p1;re;bo verde,m2nadá,t1;ar;boya,erún;a9e8i7o6r4u2élgi1;ca;lgar0r1tO;kina faso,undi;as1unéi;il;liv0snia-herzegoviCtsuaC;elorrus0rmG;lice,nín;ham4ngladés,r1;bad2é1;in;os;as;fganBl8n5r2ustr1zerbaiyC;al0ia;abia saudita,ge1men0;l0nti1;na;dorra,go2tigua y barbu1;da;la;b1em1;an0;ia;ist1;án",
    "Place": "true¦aLbJcHdGeEfDgAh9i8jfk,kul,l7m5new eng4ord,p2s1the 0upIyyz;bronx,hamptons;fo,oho,under2yd;acifLek,h0;l,x;land;a0co,idCuc;libu,nhattJ;ax,gw,hr;ax,cn,ndianGst;arlem,kg,nd;ay village,re0;at 0enwich;britain,lak2;co,ra;urope,verglad0;es;en,fw,own1xb;dg,gk,hina0lt;town;cn,e0kk,rooklyn;l air,verly hills;frica,m5ntar1r1sia,tl0;!ant1;ct0;ic0; oce0;an;ericas,s",
    "Infinitive": "true¦0:7Q;1:7M;2:7G;3:7F;4:69;5:5G;6:6M;7:62;8:79;9:5D;a6Cb64c4Md3We2Vf2Pg2Jh2Fi20ju1Zl1Tm1Kn1Go1Cp0Qque0Pr07sStLuJvAy4A;aGeDiCoA;lAmit,t0;ar,v2;aj0ol0s79v1;nBrAst1;!if5;c2d2ir;ci0lAri0;er,id0;b5nAs0t5G;ir,t0;aFeEir0oCrA;aAiunf0opez0;baj0d1Rer,g0i9t0;c0m0rAs2;c2t5G;m2n2rm8st57ñ1;p0rd0ñ2;aKeIiHoEuA;bCced2fr1g0FpBrg1sA;p60ti4P;ervis0on2;ir,ven9;breviv1cav0f2OlBnApo1Qrpre4ñ0;ar,reír;er,loz0;gn4Xlb0mbol7tu0;c0gu1ll0nt06rAñ1I;!v1;b2cClBtiA;r7sf3F;ir,t0ud0v0;ar,r4Rud1;eBoA;b0g0mp2;aOcLd15emKfIgFhus0in0nEpCquZsAtras0v5Wz0ír,ñ1;erv0olv2pAu18;ald0et0ir0o4;aAet1l5o1B;r0s0;ac2ov0un6;aBiAr5Bul0;r,s3B;l0r,te0;leAo5T;j0xi6O;bo1Opl5N;h5MiBoA;g2m27noc2rd0;b1cl0;c9l7;br0d0m0r2;aTeNiMlaKoJrBuA;bl5r46;act5eDoA;b0d0Lh2Tmet2poBse2JteAv1S;g2st0;n2r9;d4MfCgu5Kp2XseAv2;ntArv0;ar,ir;er1;d2n2;nAt5;ch0t0;c0nt0;d1g0in0lEns0rBsA;ar,c0;dBfec9mAse26ten3;an3it1;er,on0;e0lizc0;d3g0rAs0t8;ar,ec2ticip0;bCcurr1di0fBlApon2rgan7ír;er,vid0;e4r3;ed3l3Tstacul7t1C;aCeAot0;ces55gAv0;ar,o6;c2d0veg0;aFeDiCoAud0;d3Cle48nAr1s26v2;o,t0;r0t3L;d1nt1reAt2zcl0;c2nd0;d3Flvers0nBqui3Drc0st5tAxim7;ar,ric3L;d0ej0t0Z;aEeDimpi0lAo18u19;am0eBoA;r0v2;g0n0v0;er,gZva4J;dr0me4Inz0stim0v0;g0nt0r0;lus1RmpMnAr;clu1dKfJi6mi10sGtCvA;ad1eAit0oc0;nt0rt1st35;eBrodA;uc1;nt0rA;es0pret0;i2CtBuA;lt0;al0;lu1o4A;ic0uc1;oAr1D;rt0;aCeAu1;l0rA;ed0ir,v1;bl0c2ll0;aEenerDlor2EoCrBuA;ard0i0st0;adu0it0uñ1;bern0te0;al7;n0st0te0;aEelic3XiDlor3orCreBuA;m0n9;n0ír;m0tal3;j0ng1rm0;br5lt0sc8;c09duc0fectu0jerc2l08m04nRquivQrr0sJvIxA;hGig1pBtA;e4in0F;lCoBr2SuA;ls0;n2rt0;ic0oA;r0t0;ib1um0;acu0it0oc0;cEper0quiDtA;aBimAorn2Grope0udi0;ar,ul0;bl3ll0r;ar,v0;ap0oAr0CuS;g2nd2;oc0;amor0cKfHg3Mjui6mGoj0riIsFtBvA;ej3i0;e4rAusiasm0;ar,eA;g0tAvi2C;en2;eñ0u6;end0;aBe30laA;qu3;d0t7;aAe4on03;nt0rg0;borraCiBpA;ez0le0;gr0;ch0;eg1im8;h0losi3C;ar,eHiCoBuA;ch0d0r0;bl0l2rm1;buj0feren6r2LsBvA;e2Oor6;eñ0frut0gu1Sminu1tA;inAri0C;gu1;b2cOd5fe4j0mosNpLrret1sCtBvoA;lv2r0;a0Xe09;aHcEeDhCmant1YpAtru1v1Y;eAre6;d1rt0;ac2;ar,ncaden0;aBe4rAubr1;ib1;ns0rg0;fi0grad23par3rro0Oyun0;e4os26rA;im1;tr0;ep9iBlAor0;ar0;d1r;a0Ke0Gh0Eiv0Dla0AoGrCuA;br1id0lAmpl1r0;p0tiv0;eCiBuA;c07z0;ar,t5;ar,c2er;br0c8g2l00mWnEpi0rCsA;eAt0;ch0r;reAt0;g1r;dQfOjug0oc2qui0VsJtEvA;eAid0;nBrA;s0t1;c2ir;aDeCinu0rA;iAol0;bu1;n2st0;m8r;eDiCtAum1;iAru1;tu1;st1;gu1nt1rv0;es0iA;ar,rm0sc0;en0uc1;bat1eCpAun5;a17et1on2rA;ar,e4;nz0r;ec9g0oA;c0n7;ci1L;rAsA;if5;ic0;il7;aAisme0oc0;rl0sque0te0;le12nBpiArr0s0;ll0;ar,sA;ur0;b2er,lEm8nDrCsAus0z0;ar,tA;ig0;acter7g0;c04s0;cAe0El0m0;ul0;aFeDorCriBuA;ce0rl0sc0;ll0nd0;d0r0;b2ndAs0;ec1;il0j0rr2t1ut7ñ0;iz0;b0Qc0Gd0Bf07g03hor02lXmUnRpLrrKsGtCume04vByAñad1;ud0;aZerigu0is0;ac0e4raA;er,vA;es0;nd2;ar,iCo6pBuA;st0;ir0;mOst1;egl0oj0;aElDoCrA;eAob0;ci0nd2t0;st0y0;aud1ic0;g0r3;d0hBim0un6;ci0;el0;aBenA;az0;n3r;caDeCivi0moBquA;il0;rz0;gr0nt0;nz0;c0r0;or0rBuaA;nt0;adAeg0;ar,ec2;eCiBlA;ig1;rm0;it0;iv8miCorBveA;rt1;ar,n0;r0t1;in0;aIeHoAtu0;mpFnCrMstA;ar,umA;br0;sej0t3;ec2;er;añ0;pt0rc0;b0mp0;andEorDrCuA;rr1s0;ir;az0ir;d0t0;on0;ar",
    "Modal": "true¦debEhBp7qu5s2t0;en0iene8;emHgo,éDíaG;ab0ol3uel5é;e0éB;!mEn,s;er0ier2;emCé8;od2ued0;e0o;!n,s;em8r6é4;a1e0;!m6;!bé1n,s;e1o,é0;is;!m2n,r0s;ía0;!is,m0n,s;os",
    "Auxiliary": "true¦oído",
    "Copula": "true¦eGfu8s0é9;e2i1o0;is,mAn,y;do,endo;a3d,r0áis;em7á1é6ía0;!is,m6n,s;!n,s;!m4n,s;e4i1é0;ram2;!m1ste0;!is;os;!r0;a0on;is,n,s;r0s;a0es;!is,n,s",
    "Month": "true¦a6dic4en3febr3ju1ma0nov4octu5sept4;rzo,yo;l0n0;io;ero;iem0;bre;bril,gosto",
    "WeekDay": "true¦domingo,juev1lun1m0sábado,viern1;art0iércol0;es",
    "FemaleName": "true¦0:FV;1:FZ;2:FO;3:FA;4:F9;5:FP;6:EO;7:GC;8:EW;9:EM;A:G8;B:E2;C:G5;D:FL;E:FI;F:ED;aDZbD1cB8dAIe9Gf91g8Hh83i7Sj6Uk60l4Om38n2To2Qp2Fqu2Er1Os0Qt04ursu6vUwOyLzG;aJeHoG;e,la,ra;lGna;da,ma;da,ra;as7EeHol1TvG;et9onB8;le0sen3;an8endBMhiB3iG;lInG;if3AniGo0;e,f39;a,helmi0lGma;a,ow;aMeJiG;cHviG;an9XenFY;kCWtor3;da,l8Vnus,rG;a,nGoniCZ;a,iD9;leGnesE9;nDIrG;i1y;aSePhNiMoJrGu6y4;acG0iGu0E;c3na,sG;h9Mta;nHrG;a,i;i9Jya;a5IffaCDna,s5;al3eGomasi0;a,l8Go6Xres1;g7Uo6WrHssG;!a,ie;eFi,ri7;bNliMmKnIrHs5tGwa0;ia0um;a,yn;iGya;a,ka,s5;a4e4iGmC7ra;!ka;a,t5;at5it5;a05carlet2Ye04hUiSkye,oQtMuHyG;bFGlvi1;e,sHzG;an2Tet9ie,y;anGi7;!a,e,nG;aEe;aIeG;fGl3DphG;an2;cF5r6;f3nGphi1;d4ia,ja,ya;er4lv3mon1nGobh75;dy;aKeGirlBIo0y6;ba,e0i6lIrG;iGrBMyl;!d70;ia,lBS;ki4nIrHu0w0yG;la,na;i,leAon,ron;a,da,ia,nGon;a,on;l5Yre0;bMdLi8lKmIndHrGs5vannaE;aEi0;ra,y;aGi4;nt5ra;lBKome;e,ie;in1ri0;a02eXhViToHuG;by,thBH;bQcPlOnNsHwe0xG;an93ie,y;aHeGie,lC;ann7ll1marBCtB;!lGnn1;iGyn;e,nG;a,d7W;da,i,na;an8;hel53io;bin,erByn;a,cGkki,na,ta;helBWki;ea,iannDUoG;da,n12;an0bIgi0i0nGta,y0;aGee;!e,ta;a,eG;cAOkaE;chGe,i0mo0n5EquCAvDy0;aC9elGi8;!e,le;een2ia0;aMeLhJoIrG;iGudenAT;scil1Uyamva8;lly,rt3;ilome0oebe,ylG;is,lis;arl,ggy,nelope,r6t4;ige,m0Fn4Oo6rvaB8tHulG;a,et9in1;ricGsy,tA5;a,e,ia;ctav3deHfATlGphAT;a,ga,iv3;l3t9;aQePiJoGy6;eHrG;aEeDma;ll1mi;aKcIkGla,na,s5ta;iGki;!ta;hoAZk8AolG;a,eBE;!mh;l7Sna,risF;dIi5PnHo23taG;li1s5;cy,et9;eAiCL;a01ckenz2eViLoIrignayani,uriBDyG;a,rG;a,na,tAP;i4ll9UnG;a,iG;ca,ka,qB1;a,chOkaNlJmi,nIrGtzi;aGiam;!n8;a,dy,erva,h,n2;a,dIi9GlG;iGy;cent,e;red;!e6;ae6el3G;ag4KgKi,lHrG;edi61isFyl;an2iGliF;nGsAJ;a,da;!an,han;b08c9Bd06e,g04i03l01nZrKtJuHv6Sx85yGz2;a,bell,ra;de,rG;a,eD;h74il8t2;a,cSgOiJjor2l6In2s5tIyG;!aGbe5QjaAlou;m,n9P;a,ha,i0;!aIbAIeHja,lCna,sGt53;!a,ol,sa;!l06;!h,m,nG;!a,e,n1;arIeHie,oGr3Kueri9;!t;!ry;et3IiB;elGi61y;a,l1;dGon,ue6;akranBy;iGlo36;a,ka,n8;a,re,s2;daGg2;!l2W;alCd2elGge,isBDon0;eiAin1yn;el,le;a0Ie08iWoQuKyG;d3la,nG;!a,dHe9PnGsAN;!a,e9O;a,sAL;aAYcJelIiFlHna,pGz;e,iB;a,u;a,la;iGy;a2Ae,l25n8;is,l1GrHtt2uG;el6is1;aIeHi7na,rG;a6Xi7;lei,n1tB;!in1;aQbPd3lLnIsHv3zG;!a,be4Ket9z2;a,et9;a,dG;a,sGy;ay,ey,i,y;a,iaIlG;iGy;a8De;!n4F;b7Qerty;!n5Q;aNda,e0iLla,nKoIslAOtGx2;iGt2;c3t3;la,nGra;a,ie,o4;a,or1;a,gh,laG;!ni;!h,nG;a,d4e,n4N;cNdon7Pi6kes5rMtKurIvHxGy6;mi;ern1in3;a,eGie,yn;l,n;as5is5oG;nya,ya;a,isF;ey,ie,y;aZeUhadija,iMoLrIyG;lGra;a,ee,ie;istGy5A;a,en,iGy;!e,n48;ri,urtn97;aMerLl96mIrGzzy;a,stG;en,in;!berlG;eGi,y;e,y;a,stD;!na,ra;el6MiJlInHrG;a,i,ri;d4na;ey,i,l9Ns2y;ra,s5;c8Ti5UlOma6nyakumari,rMss5JtJviByG;!e,lG;a,eG;e,i75;a5CeHhGi3PlCri0y;ar5Aer5Aie,leDr9Cy;!lyn70;a,en,iGl4Tyn;!ma,n31sF;ei6Zi,l2;a04eVilToMuG;anKdJliGst54;aHeGsF;!nAt0W;!n8U;i2Ry;a,iB;!anLcelCd5Sel6Yhan6FlJni,sHva0yG;a,ce;eGie;fi0lCph4V;eGie;en,n1;!a,e,n36;!i10lG;!i0Z;anLle0nIrHsG;i5Nsi5N;i,ri;!a,el6Mif1RnG;a,et9iGy;!e,f1P;a,e6ZiHnG;a,e6YiG;e,n1;cLd1mi,nHqueliAsmin2Uvie4yAzG;min7;a7eHiG;ce,e,n1s;!lGsFt06;e,le;inHk2lCquelG;in1yn;da,ta;da,lPmNnMo0rLsHvaG;!na;aHiGob6R;do4;!belGdo4;!a,e,l2G;en1i0ma;a,di4es,gr5O;el8ogG;en1;a,eAia0o0se;aNeKilHoGyacin1N;ll2rten1H;aHdGlaH;a,egard;ry;ath0WiHlGnrietBrmiAst0W;en24ga;di;il72lKnJrGtt2yl72z6A;iGmo4Cri4D;etG;!te;aEnaE;ey,l2;aYeTiOlMold12rIwG;enGyne18;!dolC;acHetGisel8;a,chD;e,ieG;!la;adys,enGor3yn1Y;a,da,na;aJgi,lHna,ov6YselG;a,e,le;da,liG;an;!n0;mYnIorgHrG;ald33i,m2Rtru70;et9i0;a,eGna;s1Nvieve;briel3Cil,le,rnet,yle;aReOio0loMrG;anHe8iG;da,e8;!cG;esHiGoi0G;n1s3S;!ca;!rG;a,en40;lHrnG;!an8;ec3ic3;rHtiGy7;ma;ah,rah;d0FileDkBl00mUn47rRsMtLuKvG;aIelHiG;e,ta;in0Ayn;!ngel2F;geni1la,ni3O;h4Zta;meral8peranJtG;eHhGrel6;er;l2Mr;za;iGma,nest27yn;cGka,n;a,ka;eJilImG;aGie,y;!liA;ee,i1y;lGrald;da,y;aTeRiMlLma,no4oJsIvG;a,iG;na,ra;a,ie;iGuiG;se;en,ie,y;a0c3da,nJsGzaH;aGe;!beG;th;!a,or;anor,nG;!a;in1na;en,iGna,wi0;e,th;aWeKiJoG;lor4Yminiq3Vn2XrGtt2;a,eDis,la,othGthy;ea,y;an08naEonAx2;anPbOde,eNiLja,lImetr3nGsir4R;a,iG;ce,se;a,iHla,orGphiA;es,is;a,l5G;dGrdG;re;!d4Jna;!b29oraEra;a,d4nG;!a,e;hl3i0mMnKphn1rHvi1TyG;le,na;a,by,cHia,lG;a,en1;ey,ie;a,et9iG;!ca,el17ka;arGia;is;a0Oe0Lh03i01lToIrHynG;di,th3;is2Ay03;lOnLrHurG;tn1B;aId26iGn26riA;!nG;a,e,n1;!l1Q;n2sG;tanGuelo;ce,za;eGleD;en,t9;aIeoHotG;il49;!pat4;ir7rIudG;et9iG;a,ne;e,iG;ce,sX;a4er4ndG;i,y;aPeMloe,rG;isHyG;stal;sy,tG;aHen,iGy;!an1e,n1;!l;lseHrG;!i7yl;a,y;nLrG;isJlHmG;aiA;a,eGot9;n1t9;!sa;d4el1NtG;al,el1M;cGli3E;el3ilG;e,ia,y;iXlWmilVndUrNsLtGy6;aJeIhGri0;erGleDrCy;in1;ri0;li0ri0;a2FsG;a2Eie;a,iLlJmelIolHrG;ie,ol;!e,in1yn;!a,la;a,eGie,y;ne,y;na,sF;a0Di0D;a,e,l1;isBl2;tlG;in,yn;arb0CeYianXlVoTrG;andRePiIoHyG;an0nn;nwCok7;an2NdgKg0ItG;n27tG;!aHnG;ey,i,y;ny;etG;!t7;an0e,nG;da,na;i7y;bbi7nG;iBn2;ancGossom,ytG;he;ca;aRcky,lin8niBrNssMtIulaEvG;!erlG;ey,y;hHsy,tG;e,i0Zy7;!anG;ie,y;!ie;nGt5yl;adHiG;ce;et9iA;!triG;ce,z;a4ie,ra;aliy29b24d1Lg1Hi19l0Sm0Nn01rWsNthe0uJvIyG;anGes5;a,na;a,r25;drIgusHrG;el3;ti0;a,ey,i,y;hHtrG;id;aKlGt1P;eHi7yG;!n;e,iGy;gh;!nG;ti;iIleHpiB;ta;en,n1t9;an19elG;le;aYdWeUgQiOja,nHtoGya;inet9n3;!aJeHiGmI;e,ka;!mGt9;ar2;!belHliFmT;sa;!le;ka,sGta;a,sa;elGie;a,iG;a,ca,n1qG;ue;!t9;te;je6rea;la;bHmGstas3;ar3;el;aIberHel3iGy;e,na;!ly;l3n8;da;aTba,eNiKlIma,yG;a,c3sG;a,on,sa;iGys0J;e,s0I;a,cHna,sGza;a,ha,on,sa;e,ia;c3is5jaIna,ssaIxG;aGia;!nd4;nd4;ra;ia;i0nHyG;ah,na;a,is,naE;c5da,leDmLnslKsG;haElG;inGyW;g,n;!h;ey;ee;en;at5g2nG;es;ie;ha;aVdiSelLrG;eIiG;anLenG;a,e,ne;an0;na;aKeJiHyG;nn;a,n1;a,e;!ne;!iG;de;e,lCsG;on;yn;!lG;iAyn;ne;agaJbHiG;!gaI;ey,i7y;!e;il;ah",
    "MaleName": "true¦0:C9;1:BG;2:BX;3:BO;4:B0;5:BU;6:AO;7:9Q;8:B8;9:AS;A:AJ;B:9D;aB0bA4c93d84e7Ef6Xg6Fh5Vi5Hj4Kk4Al3Rm2Pn2Eo28p22qu20r1As0Rt07u06v01wOxavi3yHzC;aCor0;cCh8Ene;hDkC;!aAX;ar50eAW;ass2i,oDuC;sEu25;nFsEusC;oCsD;uf;ef;at0g;aKeIiDoCyaAL;lfgang,odrow;lCn1O;bEey,frBFlC;aA1iC;am,e,s;e85ur;i,nde7sC;!l6t1;de,lDrr5yC;l1ne;lCt3;aBy;aFern1iC;cDha0nceCrg97va0;!nt;ente,t59;lentin48nBughn;lyss4Lsm0;aUePhLiJoFrDyC;!l3ro8s1;av9MeCist0oy,um0;nt9Ev53y;bEd7TmCny;!as,mCoharu;aAUie,y;i7Zy;mCt9;!my,othy;adEeoDia79omC;!as;!do7I;!de9;dFrC;enBrC;anBeCy;ll,nB;!dy;dgh,ic9Pnn3req,ts44;aRcotPeOhKiIoGpenc3tCur1Oylve8Dzym1;anEeCua77;f0phABvCwa76;e56ie;!islaw,l6;lom1n9ZuC;leyma8ta;dCl7Fm1;!n6;aEeC;lCrm0;d1t1;h6One,qu0Uun,wn,y8;am9basti0k1Xl40rg3Zth,ymo9E;!tC;!ie,y;lDmCnti22q4Iul;!mAu4;ik,vato6S;aXeThe8ZiPoGuDyC;an,ou;b6IdDf9pe6NssC;!elAF;ol2Uy;an,bJcIdHel,geGh0la7EmFnEry,sDyC;!ce;coe,s;a92nA;an,eo;l3Jr;e4Qg3n6olfo,ri65;co,ky;bAe9R;cCl6;ar5Mc5LhDkC;!ey,ie,y;a82ie;gDid,ub5x,yCza;ansh,nT;g8TiC;na8Ps;ch5Vfa4lEmDndCpha4sh6Rul,ymo6X;al9Vol2By;i9Fon;f,ph;ent2inC;cy,t1;aGeEhilDier5Zol,reC;st1;!ip,lip;d98rcy,tC;ar,e2V;b3Sdra6Ct44ul;ctav2Vliv3m93rGsDtCum8Rw5;is,to;aDc8PvC;al50;ma;i,vK;athKeIiEoC;aCel,l0ma0r2X;h,m;cDg4i3IkC;h6Rola;hol5UkCol5U;!ol5T;al,d,il,ls1vC;il4Y;anCy;!a4i4;aXeUiLoGuDyC;l21r1;hamDr5WstaC;fa,p4E;ed,mG;dibo,e,hamEis1XntDsCussa;es,he;e,y;ad,ed,mC;ad,ed;cHgu4kFlEnDtchC;!e7;a75ik;house,o04t1;e,olC;aj;ah,hCk6;a4eC;al,l;hDlv2rC;le,ri7v2;di,met;ck,hOlMmPnu4rIs1tEuricDxC;!imilian89we7;e,io;eo,hDi4ZtC;!eo,hew,ia;eCis;us,w;cEio,k83lDqu6Dsha7tCv2;i2Hy;in,on;!el,oLus;achCcolm,ik;ai,y;amCdi,moud;adC;ou;aReOiNlo2RoJuDyC;le,nd1;cFiEkCth3;aCe;!s;gi,s;as,iaC;no;g0nn6OrenEuCwe7;!iC;e,s;!zo;am,on4;a78evi,la4PnDonCst3vi;!a5Yel;!ny;mDnCr65ur4Rwr4R;ce,d1;ar,o4L;aJeEhaled,iCrist4Tu46y3A;er0p,rC;by,k,ollos;en0iFnCrmit,v2;!dDnCt5A;e0Zy;a7ri4L;r,th;na66rCthem;im,l;aZeRiPoEuC;an,liCst2;an,us;aqu2eKhnJnHrFsC;eDhCi79ue;!ua;!ph;dCge;an,i,on;!aCny;h,s,th4V;!ath4Uie,nA;!l,sCy;ph;an,e,mC;!mA;d,ffHrEsC;sCus;!e;a5HemDmai8oCry;me,ni0P;i6Sy;!e56rC;ey,y;cId5kHmGrEsDvi3yC;!d5s1;on,p3;ed,od,rCv4K;e4Xod;al,es,is1;e,ob,ub;k,ob,quC;es;aObrahNchika,gLkeKlija,nuJrHsEtCv0;ai,sC;uki;aCha0i6Dma4sac;ac,iaC;h,s;a,vinCw2;!g;k,nngu50;!r;nacCor;io;im;in,n;aKeGina4ToEuCyd54;be23gCmber4AsE;h,o;m3raBsCwa3V;se2;aEctDitDn4CrC;be1Ym0;or;th;bLlKmza,nJo,rEsDyC;a41d5;an,s0;lFo4DrEuCv6;hi3Yki,tC;a,o;is1y;an,ey;k,s;!im;ib;aReNiMlenLoJrFuC;illerDsC;!tavo;mo;aEegCov3;!g,orC;io,y;dy,h55nt;nzaCrd1;lo;!n;lbe4Ono,ovan4P;ne,oErC;aCry;ld,rd4S;ffr6rge;bri4l5rCv2;la1Xr3Cth,y;aReOiMlKorr0HrC;anEedCitz;!dAeCri22;ri21;cEkC;!ie,lC;in,yn;esJisC;!co,zek;etch3oC;yd;d4lConn;ip;deriDliCng,rnan01;pe,x;co;bi0di;arZdUfrTit0lNmHnGo2rDsteb0th0uge8vCym5zra;an,ere2U;gi,iDnCrol,v2w2;est44ie;c06k;och,rique,zo;aGerFiDmC;aFe2O;lCrh0;!io;s1y;nu4;be09d1iFliEmDt1viCwood;n,s;er,o;ot1Ts;!as,j43sC;ha;a2en;!dAg32mFuDwC;a25in;arC;do;o0Su0S;l,nC;est;aYeOiLoFrEuDwCyl0;ay8ight;a8dl6nc0st2;ag0ew;minicGnEri0ugDyC;le;!l03;!a29nCov0;e7ie,y;!k;armuDeCll1on,rk;go;id;anJj0lbeImetri9nGon,rFsEvDwCxt3;ay8ey;en,in;hawn,mo09;ek,ri0G;is,nCv3;is,y;rt;!dC;re;lLmJnIrEvC;e,iC;!d;en,iEne7rCyl;eCin,yl;l2Wn;n,o,us;e,i4ny;iCon;an,en,on;e,lC;as;a07e05hXiar0lMoHrFuDyrC;il,us;rtC;!is;aCistobal;ig;dy,lFnDrC;ey,neli9y;or,rC;ad;by,e,in,l2t1;aHeEiCyJ;fCnt;fo0Dt1;meDt9velaC;nd;nt;rEuDyC;!t1;de;enB;ce;aGeFrisDuC;ck;!tC;i0oph3;st3;d,rlCs;eCie;s,y;cCdric;il;lFmer1rC;ey,lDro7y;ll;!os,t1;eb,v2;ar03eVilUlaToQrDuCyr1;ddy,rtJ;aKeFiEuDyC;an,ce,on;ce,no;an,ce;nDtC;!t;dDtC;!on;an,on;dDndC;en,on;!foCl6y;rd;bDrCyd;is;!by;i8ke;al,lA;nGrCshoi;at,nDtC;!r11;aCie;rd0T;!edict,iDjam2nA;ie,y;to;n6rCt;eCy;tt;ey;ar0Yb0Od0Kgust2hm0Hid5ja0Fl00mYnQputsiPrGsaFuDveCya0ziz;ry;gust9st2;us;hi;aJchIi4jun,maGnEon,tCy0;hCu07;ur;av,oC;ld;an,nd;el;ie;ta;aq;dHgel06tC;hoFoC;i8nC;!i03y;ne;ny;reCy;!as,s,w;ir,mCos;ar;an,bePd5eJfGi,lFonEphonIt1vC;aNin;on;so,zo;an,en;onDrC;edQ;so;c,jaFksandEssaFxC;!and3;er;ar,er;ndC;ro;rtI;ni;en;ad,eC;d,t;in;aDolfCri0vik;!o;mCn;!a;dGeFraDuC;!bakr,lfazl;hCm;am;!l;allFel,oulaye,ulC;!lDrahm0;an;ah,o;ah;av,on",
    "FirstName": "true¦aEblair,cCdevBj8k6lashawn,m3nelly,quinn,re2sh0;ay,e0iloh;a,lby;g1ne;ar1el,org0;an;ion,lo;as8e0r9;ls7nyatta,rry;am0ess1ude;ie,m0;ie;an,on;as0heyenne;ey,sidy;lex1ndra,ubr0;ey;is",
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
    "nouns": {
      "plurals": {
        "rules": "ctava|4itas,arranca|5quillas,ivisa|4ones,alega|4ones,uínola|1inolonas,erpa|3etas,uaja|3onas,iralda|5illas,hapera|5onas,hiíta|2itas,unna|3itas,acerola|7zos,uija|3ones,hasca|4ones,uata|3ones,a|1s,agot|4es,imut|4es,t|1s,aís|3es,celonés|5esas,ompás|3ases,eonés|3esas,als|3es,iamés|3esas,avanés|4esas,ienés|3esas,ypass|5es,us|2es,ís|ises,ós|oses,es|2es,as|2es,is|2es,os|2es,bús|1uses,és|eses,magen|1ágenes,ren|3es,égimen|egímenes,irgen|írgenes,oven|óvenes,argen|árgenes,rimen|1ímenes,anon|ánones,iquen|íquenes,ermen|érmenes,olmen|ólmenes,itin|ítines,ocón|2onotes,rin|3es,ewton|5s,bdomen|2ómenes,risón|3onas,ien|3es,origen|2ígenes,rn|2s,tún|1unes,orden|órdenes,amen|ámenes,umen|úmenes,on|2es,in|2s,an|2es,én|enes,án|anes,ín|ines,ón|ones,lamenco|6as,hico|3as,awaiano|6as,rimero|5as,randero|6as,itónico|6as,éltico|5as,fermero|6as,onífero|6as,gentino|6as,nsajero|6as,liaco|1íacas,xterno|5as,udicado|6as,olaco|4as,uminado|6as,enciano|6as,sociado|6as,scamoso|6as,pectivo|6as,ontáneo|6as,izcocho|6itos,vencito|6as,eñorito|6as,lorruso|6as,ucanero|6as,ameluco|6as,iudo|3as,éptimo|5as,rusiano|6as,ufrido|5as,vantino|6as,riundo|5as,erdido|5as,yordomo|6as,ubano|4as,amporro|6azos,abañero|6as,ontero|5uelos,esurado|6as,donesio|6as,drújulo|6as,apoteco|6as,ntonero|6as,glicano|6as,lagueño|6as,uineo|4itos,aginero|6as,oblazo|6nes,litrero|6as,ertario|6as,oscano|5as,renaico|6as,ardiaco|3íacas,aviero|5as,ampano|5azos,licáceo|6as,eigo|3as,jodalgo|2sdalgo,aneco|4illos,aderero|6as,ntojo|4itos,aternio|7nes,hijado|5as,oiranio|6as,mandiño|6as,ceañero|6as,ejío|2itos,rvecero|6as,uplo|3as,céutico|6as,rofano|5as,abastro|7nes,uaestio|7nes,aquillo|6azos,otelero|6as,rensano|6as,stalero|6as,fuciano|6as,edófilo|6as,lvético|6as,a-museo|1s-museo,ndiviso|6as,rójimo|5as,moniado|6as,ruchero|6as,rbiáceo|6as,ltimato|7nes,utáceo|5as,ochino|5itos,trevido|6as,scobero|6as,negrino|6as,eladero|6as,nterino|6as,irtáceo|6as,dianero|6as,racioso|6as,déntico|6as,rillizo|6as,rqueo|5citos,querizo|6as,atuo|3as,allao|4icos,uapo|3as,lmáceo|5as,onésimo|6as,ledóneo|6as,anáceo|5as,láceo|4as,o|1s,urú|3s,ambú|4s,hampú|5s,enú|3s,ulú|3s,mú|2s,ú|1es,anzador|7as,arácter|2acteres,gurador|7as,repador|7as,river|5s,ámster|amsters,cavador|7as,uscador|7as,cusador|7as,over|4s,remier|6s,uffer|5s,our|3s,scar|4s,ponsor|6s,arrador|7as,railer|6s,aster|5s,inuador|7as,oemisor|7as,hupador|7as,cooter|6s,deñador|7as,uásar|1asars,óer|3s,mateur|6s,hriller|7s,áster|5s,peaker|6s,roker|5s,atidor|6as,adeador|7as,printer|7s,nchador|7as,resador|7as,lldozer|7s,vasador|7as,ostador|7as,altador|7as,forador|7as,umper|5s,rreador|7as,tter|4s,nior|4s,seller|6s,ger|3s,r|1es,eb|2s,oulomb|6s,club|4es,lbum|4es,ogrom|5s,eréndum|7s,rículum|5a,uántum|1anta,mam|3es,irham|5s,irhem|5es,órum|orums,édium|5s,uantum|4as,dem|3s,tem|3es,film|4s,ríjol|1ijoles,-mail|5s,olegial|7as,ocktail|7s,ool|3s,appel|5s,ll|2s,l|1es,owboy|5s,erry|3is,onvoy|5es,ally|3ies,ady|2ies,hisky|4ies,ersey|5s,ry|1ies,ty|1ies,obby|3ies,ay|2s,ey|2es,ied|3er,aid|3s,nd|2s,rd|2s,d|1es,squí|4s,arandí|6s,ufí|3s,opurrí|6s,olibrí|6s,í|1es,oleá|3ares,á|1s,atollah|7s,lysch|5s,romlech|7s,h|1es,aori|4es,i|1s,lató|4s,eu|1i,u|1s,heriff|6s,ruque|4itos,e|1s,bcomité|6es,é|1s,j|1es,ow|2s,x|1es,c|1s,p|1s,g|1s,k|1s,z|ces",
        "exceptions": "gato|3itos,tío|2as,chino|4as,fin|3es,socio|4as,fan|3s,computador|10as,abuelo|5as,desaparecido|11as,ciego|4as,privilegiado|11as,nopal|5itos,recolector|10as,mulo|3as,gen|3es,cadera|6zos,led|3s,competidor|10as,africano|7as,picor|5cillos,extranjero|9as,jugo|4nes,neutralizador|13as,grafo|4icos,libio|4as,yen|3es,costero|6as,descuidado|9as,denunciado|9as,son|3s,sardinero|8as,discreto|7as,mota|3illas,calero|5as,irlandés|6esas,mandado|6as,maquilador|10as,lord|3es,jara|3illas,biso|4nes,prisa|4ones,calla|4ejas,gitano|5as,soriano|6as,pub|3s,seductor|8as,alimentador|11as,sentada|6illas,billetero|8as,ruda|3itas,mocito|5as,reumático|8as,presentador|11as,triplo|5etas,majo|3as,implosivo|8as,ánulo|anulocitos,a|1es,fresero|6as,obligatorio|10as,sevillano|8as,wáter|1aters,unitario|7as,b|1es,té|1etes,mero|3itos,faca|3ones,caparra|6etas,norirlandés|9esas,metropolitano|12as,máser|5s,luge|3ones,bort|4es,chato|4as,gordo|4itas,ordinario|8as,casero|5as,celador|7as,cortador|8as,ce|1ones,n|1azas,prometido|8as,hercio|3tzios,libre|4itos,braco|4itos,ilustrador|10as,hila|3otas,vasco|4as,pana|3uchas,eslogan|slogans,m|1ucas,c|1es,cha|2ones,rad|3s,no|1ejos,canilla|6itas,l|1ucas,amado|4as,star|4s,consignatario|12as,penta|4ones,fon|3s,librado|6as,apoderado|8as,flechero|7as,torio|4tos,camal|5otes,lob|3itos,canana|5itas,marisquero|9as,manco|4as,rem|3s,taque|4itos,clina|4icas,mará|3ones,job|3s,partero|6as,irreligioso|10as,preparador|10as,cavernario|9as,contento|7as,extorsionador|13as,llorón|4onas,erre|3ones,páter|1aters,taca|3itas,lotero|5as,cojo|3as,ranchero|7as,talle|4itos,r|1ucas,botón|3oncillos,tosco|4as,bostoniano|9as,cerero|5as,raspa|4ones,jopo|3illos,expendedor|10as,d|1es,mes|3es,tren|4es,chico|4as,plan|4es,régimen|1egímenes,gas|3es,tory|3ies,clan|4es,bus|3es,curandero|8as,don|3es,dios|4es,rol|3es,asegurador|10as,argentino|8as,coz|2ces,dos|3es,valenciano|9as,barranca|6quillas,haz|2ces,tos|3es,ion|3es,despectivo|9as,espontáneo|9as,divisa|5ones,vid|3es,hoz|2ces,pan|3es,excavador|9as,ros|3es,buscador|8as,res|3es,levantino|8as,non|3es,can|3es,cabañero|7as,montero|6uelos,rail|4es,lápiz|4ces,flan|4es,esdrújulo|8as,quínola|2inolonas,zapoteco|7as,cantonero|8as,narrador|8as,poblazo|7nes,camarín|5ines,continuador|11as,radioemisor|11as,salicáceo|8as,clon|4es,giralda|6illas,caneco|5illos,vals|4es,inch|4es,farmacéutico|11as,crin|4es,ch|2es,quaestio|8nes,as|2es,taquillo|7azos,hotelero|7as,costalero|8as,ranunculáceo|11as,guija|4ones,chasca|5ones,planchador|10as,truchero|7as,primuláceo|9as,ultimato|8nes,tostador|8as,montenegrino|11as,saltador|8as,kan|3es,jan|3es,perforador|10as,heladero|7as,ron|3es,arqueo|6citos,fatuo|4as,mas|3es",
        "rev": "tavitas|3a,agotes|4,aíses|3,mágenes|1agen,amencas|5o,ujeres|4,elojes|4,atitos|2o,írgenes|irgen,apices|3z,óvenes|oven,óstoles|5,endices|4z,atices|3z,dwiches|5,árgenes|argen,iliones|5,fíboles|5,ráteres|5,waianas|5o,rimeras|5o,tónicas|5o,élticas|5o,ocias|3o,ártires|5,buelas|4o,levines|3ín,rímenes|1imen,ánones|anon,réboles|5,acteres|ácter,egiadas|5o,ercedes|5,aroles|4,ermeras|5o,níferas|5o,ntroles|5,sajeras|5o,lbumes|4,lonesas|3és,ehenes|2én,xternas|5o,ecuaces|4z,derazos|4,dicadas|5o,olacas|4o,minadas|5o,camosas|5o,anatíes|5,ricanas|5o,mbrices|4z,amsters|ámster,anjeras|5o,álices|3z,lashes|4,rubines|3ín,raficos|3o,íquenes|iquen,rroces|3z,apires|4,rijoles|1íjol,ochitos|3o,osteras|5o,ndenes|2én,gutíes|4,encitas|5o,uidadas|5o,ñoritas|5o,orrusas|5o,caneras|5o,scretas|5o,melucas|5o,iudas|3o,éptimas|5o,ompases|3ás,erdices|4z,usianas|5o,aivenes|3én,rozales|5,érmenes|ermen,ufridas|5o,ieses|3,riundas|5o,bañiles|5,ólmenes|olmen,nises|1ís,erdidas|5o,ordomas|5o,risones|3a,legones|3a,allejas|3a,erris|3y,ubanas|4o,orrazos|3o,mejenes|3én,lfoces|3z,eonesas|3és,onvoyes|5,orianas|5o,allies|3y,cáneres|5,suradas|5o,leteras|5o,uditas|2a,onesias|5o,oeles|3,ocitas|4o,adies|2y,ipletas|3o,idioses|3ós,ítines|itin,enhires|5,losivas|5o,licanas|5o,agueñas|5o,ineitos|3o,arenes|2én,ambises|3ís,gineras|5o,ecires|4,reseras|5o,dazoles|5,pataces|4z,itreras|5o,rtarias|5o,illanas|5o,isires|4,oscanas|5o,itarias|5o,jíes|2,zahares|5,erpetas|3a,enaicas|5o,mames|3,stures|4,hatas|3o,avieras|5o,oxales|4,zudes|3,unguses|5,panazos|3o,orditas|3o,conotes|1ón,hiskies|4y,cabuces|4z,uajonas|3a,eigas|3o,bades|3,aúles|3,veniles|5,peronas|3a,ertzios|2cio,ibritos|3e,racitos|3o,tojitos|3o,rniones|4,lóganes|5,ñadoras|5,oleares|3á,hijadas|5o,ilotas|2a,hiitas|2íta,unnitas|3a,iranias|5o,andiñas|5o,eañeras|5o,aories|4,ejitos|2ío,anuchas|2a,egialas|5,auzales|5,veceras|5o,uplas|3o,iamesas|3és,oláceas|5o,uasars|1ásar,aíles|3,rolazos|4,oatíes|4,vanesas|3és,illitas|3a,rofanas|5o,strones|4,ienesas|3és,atarias|5o,ensanas|5o,lbures|4,arvales|5,ahúres|4,oseles|4,ibradas|5o,esdenes|3én,lfiles|4,ucianas|5o,deradas|5o,casines|3ín,dófilas|5o,arcajes|5,malotes|3,obitos|2,nanitas|3a,véticas|5o,radoses|3ós,hóferes|5,divisas|5o,ancines|3ín,aquitos|3e,aqueles|5,ondeles|5,venires|5,linicas|3a,irhemes|5,caduces|4z,rójimas|5o,oniadas|5o,orums|órum,apiaces|4z,etzales|5,biáceas|5o,núfares|5,igiosas|5o,utáceas|5o,bacines|3ín,rnarias|5o,hinitos|3o,revidas|5o,coberas|5o,tarines|3ín,ntentas|5o,únkeres|5,achines|3ín,loronas|3ón,untries|4y,darines|3ín,terinas|5o,acitas|2a,rdides|4,rtáceas|5o,ypasses|5,ianeras|5o,aciosas|5o,eslices|4z,hiíes|3,roaches|5,yeres|3,énticas|5o,dómenes|1omen,illizas|5o,lixires|5,onianas|5o,aravíes|5,aspones|3a,risonas|3ón,uantas|4um,uerizas|5o,uquitos|3e,llaicos|3o,dedoras|5,éjeles|4,uapas|3o,comites|5é,lmáceas|5o,uatones|3a,ienes|3,rígenes|1igen,pales|3,ivales|4,rfiles|4,urines|2ín,cenes|1én,veres|3,zadoras|5,biles|3,races|2z,ctoras|4,ruces|2z,íacas|iaco,aludes|4,arices|3z,goles|3,padoras|5,ciadas|4o,tidoras|5,tunes|1ún,nésimas|5o,ezales|4,xeles|3,rnices|3z,aúdes|3,edóneas|5o,pines|1ín,nteres|4,jines|1ín,mines|1ín,ties|1y,andesas|3és,azales|4,añares|4,coholes|5,éspedes|5,rzales|4,erines|2ín,itanas|4o,émures|4,tches|3,lenes|1én,míes|2,temes|3,imutes|4,aters|áter,obbies|3y,anáceas|5o,ereras|4o,clubes|4,beles|3,árboles|5,felices|4z,eadoras|5,ieres|3,ayales|4,lides|3,orines|2ín,dines|1ín,redes|3,viles|3,xes|1,seres|3,ñoles|3,gures|3,órdenes|orden,íces|1z,voces|2z,coles|3,diles|3,cares|3,meres|3,rdeles|4,ogenes|2én,sadoras|5,hales|3,uares|3,moles|3,bares|3,paces|2z,vares|3,mires|3,pares|3,fenoles|5,síes|2,eroles|4,peles|3,geles|3,ises|2,larines|3ín,ñales|3,fines|1ín,jales|3,luces|2z,faces|2z,avales|4,sares|3,ules|2,izales|4,reles|3,díes|2,miles|3,ciles|3,éteres|4,tenes|1én,gares|3,veles|3,ieles|3,neles|3,buses|1ús,leres|3,eales|3,dares|3,ámenes|amen,bíes|2,steres|4,jares|3,zares|3,beres|3,bales|3,iares|3,celes|3,gales|3,deres|3,soles|3,úmenes|umen,eyes|2,siles|3,úes|1,riles|3,líes|2,uíes|2,quines|2ín,ceres|3,tares|3,níes|2,mares|3,ríes|2,trices|3z,lines|1ín,males|3,tades|3,uales|3,dales|3,sales|3,nares|3,teles|3,tines|1ín,tiles|3,tudes|3,eces|1z,cales|3,iales|3,rales|3,tales|3,lares|3,nales|3,anes|án,eses|és,dades|3,ores|2,ones|ón,s|,ieder|3,rrícula|6um,uanta|1ántum,osdalgo|1dalgo,s-museo|-museo,ei|1u"
      }
    },
    "adjectives": {
      "f": {
        "rules": "uen|3a,ín|ina,án|ana,ón|ona,iejo|3ísima,ptísimo|2a,oreno|4ita,ártaro|artarica,enísimo|2a,arísimo|2ia,ilósofo|2osofica,obito|2a,ctísimo|2a,últiplo|ultiplaza,ambito|3a,drófilo|2ofílica,ofítico|ófita,icólogo|2ológica,legiaco|3íaca,o|a,ndaluz|6a,ugonote|6a,l|1a,és|esa,r|1a",
        "exceptions": "mago|3ica,pino|3illa,britano|6ica,paso|3illa,tártaro|1artarica,mallorquín|8ina,bobito|3a,múltiplo|1ultiplaza,musicólogo|5ológica",
        "rev": "rimera|5,spañola|6,uena|3,ercera|5,nglesa|3és,ejísima|2o,atalana|4án,sulmana|4án,ndaluza|6,brupta|5ísimo,ilarina|4ín,agica|2o,itriona|4ón,inilla|2o,orenita|4o,ipona|2ón,legiala|6,mena|3ísimo,ardiana|4án,ndarina|4ín,umaria|4ísimo,ormona|3ón,osofica|ósofo,eñora|4,adrona|3ón,ugonota|6e,marrona|4ón,rgoñona|4ón,octa|3ísimo,lorona|3ón,amba|3ito,itanica|4o,risona|3ón,asilla|2o,ofílica|ófilo,erófita|2ofítico,iamesa|3és,bequesa|4és,legíaca|3iaco,ulzona|3ón,eutona|3ón,irolesa|4és,ltarina|4ín,cesa|1és,ampeona|4ón,ñesa|1és,sajona|3ón,tesa|1és,ascona|3ón,alemana|4án,galesa|3és,etona|2ón,lona|1ón,guesa|2és,andesa|3és,idora|4,nesa|1és,edora|4,sora|3,tora|3,adora|4,a|o"
      },
      "mp": {
        "rules": "uen|3os,ín|ines,án|anes,ón|ones,ndaluz|5ces,ctavo|1havos,ptísimo|2os,enísimo|2os,arísimo|2ios,ilósofo|6icos,obito|2os,ctísimo|2os,trófilo|2ofílicos,ambito|3os,icólogo|2ológicos,legiaco|3íacos,horo|4tes,o|1s,ugonote|7s,er|2os,or|2es,l|1es,és|eses",
        "exceptions": "amigo|4uitos,lato|3azos,lacio|4tos,cano|4nes,bobito|3os,electrófilo|6ofílicos,musicólogo|5ológicos",
        "rev": "rimeros|5,uenos|3,erceros|5,daluces|4z,chavos|1tavo,bruptos|5ísimo,iguitos|2o,menos|3ísimo,umarios|4ísimo,soficos|3o,octos|3ísimo,ambos|3ito,egíacos|2iaco,atazos|2o,acitos|3o,horotes|4,anones|3,les|1,ines|ín,anes|án,ones|ón,eses|és,ores|2,s|"
      },
      "fp": {
        "rules": "uen|3as,ín|inas,án|anas,ón|onas,ndaluz|6as,ctavo|1havas,ptísimo|2as,inónimo|2onímicas,uerdo|4ecillas,enísimo|2as,arísimo|2ias,obito|2as,ctísimo|2as,últiplo|ultiplazas,almo|3ucas,ambito|3as,drófilo|2ofílicas,ofítico|ófitas,icólogo|2ológicas,holo|3itas,orboso|5ísimas,legiaco|3íacas,o|as,ugonote|6as,l|1as,és|esas,r|1as",
        "exceptions": "vano|3itas,gordo|4itas,mago|3icas,tordo|4ejas,sinónimo|3onímicas,mallorquín|8inas,bobito|3as,múltiplo|1ultiplazas,hidrófilo|4ofílicas,musicólogo|5ológicas",
        "rev": "rimeras|5,pañolas|5,uenas|3,erceras|5,nglesas|3és,talanas|3án,ulmanas|3án,daluzas|5,chavas|1tavo,anitas|2o,bruptas|5ísimo,orditas|3o,ecillas|o,larinas|3ín,agicas|2o,trionas|3ón,iponas|2ón,egialas|5,menas|3ísimo,rdianas|3án,darinas|3ín,umarias|4ísimo,ormonas|3ón,eñoras|4,adronas|3ón,gonotas|5e,arronas|3ón,goñonas|3ón,octas|3ísimo,loronas|3ón,almucas|3o,ambas|3ito,risonas|3ón,rófitas|1ofítico,holitas|3o,iamesas|3és,ordejas|3o,equesas|3és,sísimas|1o,egíacas|2iaco,ulzonas|3ón,eutonas|3ón,rolesas|3és,tarinas|3ín,cesas|1és,lemanas|3án,mpeonas|3ón,ñesas|1és,sajonas|3ón,tesas|1és,asconas|3ón,galesas|3és,etonas|2ón,lonas|1ón,guesas|2és,andesas|3és,idoras|4,nesas|1és,edoras|4,soras|3,toras|3,adoras|4,as|o"
      }
    },
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
    "subjunctive": {
      "first": {
        "rules": "isfacer|4ga,ufrir|3a,omper|3a,ntinuar|4úe,raduar|3úe,lmorzar|2uerce,olgar|uelgue,oder|ueda,ehusar|2úse,aler|2ga,gorar|1üere,umplir|4a,eriguar|4üe,mpartir|5a,rever|4a,aciar|2íe,onfiar|3íe,enovar|2ueve,contrar|1uentre,over|ueva,oñar|ueñe,obernar|2ierne,orir|uera,erder|ierda,alir|2ga,uebrar|1iebre,ravesar|3iese,burrir|4a,orcer|uerza,ogar|uegue,spertar|2ierte,onfesar|3iese,rohibir|3íba,efender|2ienda,omenzar|2ience,uerer|1iera,ensar|iense,ormir|uerma,ruñir|3a,añer|2a,nviar|2íe,estir|ista,jercer|3za,pezar|1iece,meter|3a,riar|1íe,uiar|1íe,eñir|iña,vivir|3a,eer|1a,mer|1a,cender|1ienda,oser|2a,venir|3ga,mitir|3a,hacer|2ga,batir|3a,endar|iende,cordar|1uerde,eber|2a,tinguir|4a,mostrar|1uestre,alentar|2iente,rrer|2a,probar|2uebe,vencer|3za,etir|ita,mir|1a,egir|ija,edir|ida,ostar|ueste,olver|uelva,brir|2a,aer|1iga,reír|1ía,sistir|4a,tender|1ienda,tuar|1úe,decir|1iga,entir|ienta,erir|iera,ger|ja,seguir|1iga,vertir|1ierta,gir|ja,dir|1a,bir|1a,ducir|2zca,der|1a,uir|1ya,gar|1ue,ner|1ga,zar|ce,cer|zca,car|que,ar|e,omit|4e,dar\\(se\\)|1e,entirse|ienta,ullirse|3a,reverse|3a,arse|e",
        "exceptions": "cerrar|1ierre,sentar|1iente,errar|yerre,oler|huela,contar|1uente,servir|1irva,estar|3é,helar|1iele,dar|1é,apretar|3iete,negar|1iegue,caber|quepa,ver|2a,sonar|1uene,soler|1uela,regar|1iegue,oír|1iga,volar|1uele,saber|1epa,ser|2a,unir|2a,ir|vaya,jugar|2egue,hervir|1ierva,mudar(se)|3e,valer|3ga,leer|2a,elegir|2ija,salir|3ga,rogar|1uegue,querer|2iera,vestir|1ista",
        "rev": "onsuma|5ir,uceda|4er,ufra|3ir,ompa|3er,rea|2er,oma|2er,flija|3gir,irija|3gir,ueda|oder,xija|2gir,irva|ervir,ecida|4ir,inja|2gir,roteja|4ger,umpla|4ir,epienta|2entirse,omparta|6ir,ema|2er,urja|2gir,ambulla|6irse,ueva|over,uera|orir,ierda|erder,na|1ir,treva|4erse,burra|4ir,uerza|orcer,rohíba|3ibir,uerma|ormir,ierva|ervir,ruña|3ir,aña|2er,meta|3er,iña|eñir,viva|3ir,rija|1egir,prima|4ir,osa|2er,venga|3ir,mita|3ir,ada|2ir,bata|3ir,uda|2ir,eba|2er,tinga|4uir,rra|2er,aga|1cer,ita|etir,ida|edir,uelva|olver,bra|2ir,aiga|1er,ría|1eír,sista|4ir,ea|1r,diga|1ecir,coja|2ger,za|cer,ienta|entir,iera|erir,siga|1eguir,vierta|1ertir,ba|1ir,duzca|2cir,ienda|ender,nda|2er,uya|1ir,nga|1er,zca|cer,ierre|errar,omite|4,ntere|4arse,lmuerce|2orzar,uelgue|olgar,uente|ontar,ehúse|2usar,ueje|3arse,iele|elar,priete|2etar,güere|1orar,verigüe|5uar,acte|3arse,roncee|5arse,uene|onar,enueve|2ovar,cuentre|1ontrar,ueñe|oñar,uele|olar,obierne|2ernar,uiebre|1ebrar,spierte|2ertar,omience|2enzar,iense|ensar,piece|1ezar,iende|endar,cuerde|1ordar,iegue|egar,muestre|1ostrar,iese|esar,pruebe|2obar,ueste|ostar,iente|entar,úe|uar,íe|iar,gue|1ar,ce|zar,que|car,e|ar,é|ar"
      },
      "second": {
        "rules": "isfacer|4gas,ufrir|3as,omper|3as,ntinuar|4úes,raduar|3úes,lmorzar|2uerces,olgar|uelgues,oder|uedas,ehusar|2úses,aler|2gas,gorar|1üeres,umplir|4as,eriguar|4ües,mpartir|5as,rever|4as,aciar|2íes,onfiar|3íes,enovar|2ueves,contrar|1uentres,over|uevas,oñar|ueñes,obernar|2iernes,orir|ueras,erder|ierdas,alir|2gas,uebrar|1iebres,ravesar|3ieses,burrir|4as,orcer|uerzas,ogar|uegues,spertar|2iertes,onfesar|3ieses,rohibir|3íbas,efender|2iendas,omenzar|2iences,uerer|1ieras,ensar|ienses,ormir|uermas,ruñir|3as,añer|2as,nviar|2íes,estir|istas,jercer|3zas,pezar|1ieces,meter|3as,riar|1íes,uiar|1íes,eñir|iñas,vivir|3as,eer|1as,mer|1as,cender|1iendas,oser|2as,venir|3gas,mitir|3as,hacer|2gas,batir|3as,endar|iendes,cordar|1uerdes,eber|2as,tinguir|4as,mostrar|1uestres,alentar|2ientes,rrer|2as,probar|2uebes,vencer|3zas,etir|itas,mir|1as,egir|ijas,edir|idas,ostar|uestes,olver|uelvas,brir|2as,aer|1igas,reír|1ías,sistir|4as,tender|1iendas,tuar|1úes,decir|1igas,entir|ientas,erir|ieras,ger|jas,seguir|1igas,vertir|1iertas,gir|jas,dir|1as,bir|1as,ducir|2zcas,der|1as,uir|1yas,gar|1ues,ner|1gas,zar|ces,cer|zcas,car|ques,ar|es,omit|4es,dar\\(se\\)|1es,entirse|ientas,ullirse|3as,reverse|3as,arse|es",
        "exceptions": "cerrar|1ierres,sentar|1ientes,errar|yerres,oler|huelas,contar|1uentes,servir|1irvas,estar|3és,helar|1ieles,apretar|3ietes,negar|1iegues,caber|quepas,ver|2as,sonar|1uenes,soler|1uelas,regar|1iegues,oír|1igas,volar|1ueles,saber|1epas,ser|2as,unir|2as,ir|vayas,jugar|2egues,hervir|1iervas,mudar(se)|3es,valer|3gas,leer|2as,elegir|2ijas,salir|3gas,rogar|1uegues,querer|2ieras,vestir|1istas",
        "rev": "onsumas|5ir,ucedas|4er,ufras|3ir,ierres|errar,omites|4,ompas|3er,reas|2er,nteres|4arse,omas|2er,flijas|3gir,irijas|3gir,muerces|1orzar,uelgues|olgar,uedas|oder,uentes|ontar,ehúses|2usar,uejes|3arse,xijas|2gir,irvas|ervir,ecidas|4ir,injas|2gir,stés|2ar,ieles|elar,rotejas|4ger,prietes|2etar,güeres|1orar,umplas|4ir,pientas|1entirse,erigües|4uar,mpartas|5ir,emas|2er,urjas|2gir,actes|3arse,mbullas|5irse,roncees|5arse,uenes|onar,enueves|2ovar,uentres|ontrar,uevas|over,ueñes|oñar,ueles|olar,biernes|1ernar,ueras|orir,ierdas|erder,nas|1ir,trevas|4erse,uiebres|1ebrar,burras|4ir,uerzas|orcer,piertes|1ertar,rohíbas|3ibir,miences|1enzar,ienses|ensar,uermas|ormir,iervas|ervir,ruñas|3ir,añas|2er,pieces|1ezar,uestres|ostrar,metas|3er,iñas|eñir,vivas|3ir,rijas|1egir,primas|4ir,osas|2er,vengas|3ir,mitas|3ir,adas|2ir,batas|3ir,udas|2ir,iendes|endar,cuerdes|1ordar,iegues|egar,ebas|2er,tingas|4uir,rras|2er,ieses|esar,pruebes|2obar,agas|1cer,itas|etir,idas|edir,uestes|ostar,uelvas|olver,ientes|entar,bras|2ir,aigas|1er,rías|1eír,sistas|4ir,eas|1r,digas|1ecir,cojas|2ger,zas|cer,ientas|entir,ieras|erir,sigas|1eguir,viertas|1ertir,úes|uar,bas|1ir,duzcas|2cir,iendas|ender,íes|iar,ndas|2er,uyas|1ir,gues|1ar,ngas|1er,ces|zar,zcas|cer,ques|car,es|ar"
      },
      "third": {
        "rules": "isfacer|4ga,ufrir|3a,omper|3a,ntinuar|4úe,raduar|3úe,lmorzar|2uerce,olgar|uelgue,oder|ueda,ehusar|2úse,aler|2ga,gorar|1üere,umplir|4a,eriguar|4üe,mpartir|5a,rever|4a,aciar|2íe,onfiar|3íe,enovar|2ueve,contrar|1uentre,over|ueva,oñar|ueñe,obernar|2ierne,orir|uera,erder|ierda,alir|2ga,uebrar|1iebre,ravesar|3iese,burrir|4a,orcer|uerza,ogar|uegue,spertar|2ierte,onfesar|3iese,rohibir|3íba,efender|2ienda,omenzar|2ience,uerer|1iera,ensar|iense,ormir|uerma,ruñir|3a,añer|2a,nviar|2íe,estir|ista,jercer|3za,pezar|1iece,meter|3a,riar|1íe,uiar|1íe,eñir|iña,vivir|3a,eer|1a,mer|1a,cender|1ienda,oser|2a,venir|3ga,mitir|3a,hacer|2ga,batir|3a,endar|iende,cordar|1uerde,eber|2a,tinguir|4a,mostrar|1uestre,alentar|2iente,rrer|2a,probar|2uebe,vencer|3za,etir|ita,mir|1a,egir|ija,edir|ida,ostar|ueste,olver|uelva,brir|2a,aer|1iga,reír|1ía,sistir|4a,tender|1ienda,tuar|1úe,decir|1iga,entir|ienta,erir|iera,ger|ja,seguir|1iga,vertir|1ierta,gir|ja,dir|1a,bir|1a,ducir|2zca,der|1a,uir|1ya,gar|1ue,ner|1ga,zar|ce,cer|zca,car|que,ar|e,omit|4e,dar\\(se\\)|1e,entirse|ienta,ullirse|3a,reverse|3a,arse|e",
        "exceptions": "cerrar|1ierre,sentar|1iente,errar|yerre,oler|huela,contar|1uente,servir|1irva,estar|3é,helar|1iele,dar|1é,apretar|3iete,negar|1iegue,caber|quepa,ver|2a,sonar|1uene,soler|1uela,regar|1iegue,oír|1iga,volar|1uele,saber|1epa,ser|2a,unir|2a,ir|vaya,jugar|2egue,hervir|1ierva,mudar(se)|3e,valer|3ga,leer|2a,elegir|2ija,salir|3ga,rogar|1uegue,querer|2iera,vestir|1ista",
        "rev": "onsuma|5ir,uceda|4er,ufra|3ir,ompa|3er,rea|2er,oma|2er,flija|3gir,irija|3gir,ueda|oder,xija|2gir,irva|ervir,ecida|4ir,inja|2gir,roteja|4ger,umpla|4ir,epienta|2entirse,omparta|6ir,ema|2er,urja|2gir,ambulla|6irse,ueva|over,uera|orir,ierda|erder,na|1ir,treva|4erse,burra|4ir,uerza|orcer,rohíba|3ibir,uerma|ormir,ierva|ervir,ruña|3ir,aña|2er,meta|3er,iña|eñir,viva|3ir,rija|1egir,prima|4ir,osa|2er,venga|3ir,mita|3ir,ada|2ir,bata|3ir,uda|2ir,eba|2er,tinga|4uir,rra|2er,aga|1cer,ita|etir,ida|edir,uelva|olver,bra|2ir,aiga|1er,ría|1eír,sista|4ir,ea|1r,diga|1ecir,coja|2ger,za|cer,ienta|entir,iera|erir,siga|1eguir,vierta|1ertir,ba|1ir,duzca|2cir,ienda|ender,nda|2er,uya|1ir,nga|1er,zca|cer,ierre|errar,omite|4,ntere|4arse,lmuerce|2orzar,uelgue|olgar,uente|ontar,ehúse|2usar,ueje|3arse,iele|elar,priete|2etar,güere|1orar,verigüe|5uar,acte|3arse,roncee|5arse,uene|onar,enueve|2ovar,cuentre|1ontrar,ueñe|oñar,uele|olar,obierne|2ernar,uiebre|1ebrar,spierte|2ertar,omience|2enzar,iense|ensar,piece|1ezar,iende|endar,cuerde|1ordar,iegue|egar,muestre|1ostrar,iese|esar,pruebe|2obar,ueste|ostar,iente|entar,úe|uar,íe|iar,gue|1ar,ce|zar,que|car,e|ar,é|ar"
      },
      "firstPlural": {
        "rules": "isfacer|4gamos,ufrir|3amos,omper|3amos,aler|2gamos,umplir|4amos,eriguar|4üemos,mpartir|5amos,rever|4amos,orir|uramos,alir|2gamos,burrir|4amos,ormir|urmamos,ruñir|3amos,añer|2amos,estir|istamos,meter|3amos,eñir|iñamos,vivir|3amos,eer|1amos,mer|1amos,oser|2amos,venir|3gamos,mitir|3amos,hacer|2gamos,batir|3amos,ervir|irvamos,eber|2amos,oler|2amos,tinguir|4amos,rcer|1zamos,vencer|3zamos,etir|itamos,mir|1amos,egir|ijamos,edir|idamos,brir|2amos,aer|1igamos,reír|1iamos,sistir|4amos,decir|1igamos,rer|1amos,ver|1amos,entir|intamos,erir|iramos,ger|jamos,seguir|1igamos,vertir|1irtamos,gir|jamos,dir|1amos,ducir|2zcamos,bir|1amos,uir|1yamos,ner|1gamos,gar|1uemos,der|1amos,zar|cemos,cer|zcamos,car|quemos,ar|emos,omit|4emos,dar\\(se\\)|1emos,entirse|intamos,ullirse|3amos,reverse|3amos,arse|emos",
        "exceptions": "caber|quepamos,ver|2amos,oír|1igamos,saber|1epamos,ser|2amos,unir|2amos,ir|vayamos,venir|3gamos,afligir|4jamos,dirigir|4jamos,convenir|6gamos,mudar(se)|3emos,valer|3gamos,arrepentirse|5intamos,leer|2amos,elegir|2ijamos,salir|3gamos,vestir|1istamos",
        "rev": "sumamos|3ir,uframos|3ir,mitemos|3,ompamos|3er,reamos|2er,teremos|3arse,omamos|2er,uejemos|3arse,xijamos|2gir,cidamos|3ir,injamos|2gir,tejamos|2ger,mplamos|3ir,igüemos|2uar,artamos|3ir,emamos|2er,urjamos|2gir,actemos|3arse,ullamos|3irse,nceemos|3arse,ovamos|2er,uramos|orir,namos|1ir,revamos|3erse,urramos|3ir,ueramos|3er,urmamos|ormir,ruñamos|3ir,añamos|2er,metamos|3er,iñamos|eñir,vivamos|3ir,rijamos|1egir,rimamos|3ir,osamos|2er,mitamos|3ir,adamos|2ir,batamos|3ir,irvamos|ervir,udamos|2ir,ebamos|2er,olamos|2er,ingamos|3uir,rramos|2er,agamos|1cer,itamos|etir,idamos|edir,olvamos|3er,bramos|2ir,aigamos|1er,riamos|1eír,istamos|3ir,eamos|1r,digamos|1ecir,cojamos|2ger,intamos|entir,iramos|erir,sigamos|1eguir,irtamos|ertir,zamos|cer,uzcamos|1cir,bamos|1ir,uyamos|1ir,ngamos|1er,guemos|1ar,damos|1er,cemos|zar,zcamos|cer,quemos|car,emos|ar"
      },
      "secondPlural": {
        "rules": "mpezar|3céis,isfacer|4gáis,ufrir|3áis,omper|3áis,lmorzar|4céis,aler|2gáis,umplir|4áis,eriguar|4üéis,mpartir|5áis,rever|4áis,ruzar|2céis,orir|uráis,alir|2gáis,burrir|4áis,ormir|urmáis,ruñir|3áis,añer|2áis,estir|istáis,meter|3áis,eñir|iñáis,vivir|3áis,eer|1áis,mer|1áis,oser|2áis,venir|3gáis,mitir|3áis,hacer|2gáis,batir|3áis,ervir|irváis,eber|2áis,oler|2áis,tinguir|4áis,rcer|1záis,vencer|3záis,etir|itáis,mir|1áis,egir|ijáis,edir|idáis,brir|2áis,aer|1igáis,reír|1iáis,sistir|4áis,decir|1igáis,rer|1áis,ver|1áis,entir|intáis,erir|iráis,ger|jáis,azar|1céis,seguir|1igáis,vertir|1irtáis,nzar|1céis,gir|jáis,dir|1áis,ducir|2zcáis,bir|1áis,uir|1yáis,izar|1céis,ner|1gáis,gar|1uéis,der|1áis,cer|zcáis,car|quéis,ar|éis,omit|4éis,dar\\(se\\)|1éis,entirse|intáis,ullirse|3áis,reverse|3áis,arse|éis",
        "exceptions": "dar|1eis,caber|quepáis,ver|2áis,oír|1igáis,saber|1epáis,ser|2áis,unir|2áis,ir|vayáis,rezar|2céis,mudar(se)|3éis,valer|3gáis,leer|2áis,elegir|2ijáis,salir|3gáis,vestir|1istáis",
        "rev": "nsumáis|4ir,ufráis|3ir,omitéis|4,ompáis|3er,reáis|2er,nteréis|4arse,omáis|2er,flijáis|3gir,irijáis|3gir,uejéis|3arse,xijáis|2gir,ecidáis|4ir,injáis|2gir,eis|ar,otejáis|3ger,umpláis|4ir,pintáis|1entirse,rigüéis|3uar,partáis|4ir,emáis|2er,urjáis|2gir,actéis|3arse,bulláis|4irse,onceéis|4arse,ováis|2er,uráis|orir,náis|1ir,treváis|4erse,burráis|4ir,ueráis|3er,urmáis|ormir,ruñáis|3ir,añáis|2er,metáis|3er,iñáis|eñir,viváis|3ir,rijáis|1egir,primáis|4ir,osáis|2er,vengáis|3ir,mitáis|3ir,adáis|2ir,batáis|3ir,irváis|ervir,udáis|2ir,ebáis|2er,oláis|2er,tingáis|4uir,rráis|2er,agáis|1cer,itáis|etir,idáis|edir,olváis|3er,bráis|2ir,aigáis|1er,riáis|1eír,sistáis|4ir,eáis|1r,digáis|1ecir,cojáis|2ger,intáis|entir,iráis|erir,sigáis|1eguir,virtáis|1ertir,záis|cer,duzcáis|2cir,báis|1ir,uyáis|1ir,ngáis|1er,guéis|1ar,dáis|1er,céis|zar,zcáis|cer,quéis|car,éis|ar"
      },
      "thirdPlural": {
        "rules": "isfacer|4gan,ufrir|3an,omper|3an,ntinuar|4úen,raduar|3úen,lmorzar|2uercen,olgar|uelguen,oder|uedan,ehusar|2úsen,aler|2gan,gorar|1üeren,umplir|4an,eriguar|4üen,mpartir|5an,rever|4an,aciar|2íen,onfiar|3íen,enovar|2ueven,contrar|1uentren,over|uevan,oñar|ueñen,obernar|2iernen,orir|ueran,erder|ierdan,alir|2gan,uebrar|1iebren,ravesar|3iesen,burrir|4an,orcer|uerzan,ogar|ueguen,spertar|2ierten,onfesar|3iesen,rohibir|3íban,efender|2iendan,omenzar|2iencen,uerer|1ieran,ensar|iensen,ormir|uerman,ruñir|3an,añer|2an,nviar|2íen,estir|istan,jercer|3zan,pezar|1iecen,meter|3an,riar|1íen,uiar|1íen,eñir|iñan,vivir|3an,eer|1an,mer|1an,cender|1iendan,oser|2an,venir|3gan,mitir|3an,hacer|2gan,batir|3an,endar|ienden,cordar|1uerden,eber|2an,tinguir|4an,mostrar|1uestren,alentar|2ienten,rrer|2an,probar|2ueben,vencer|3zan,etir|itan,mir|1an,egir|ijan,edir|idan,ostar|uesten,olver|uelvan,brir|2an,aer|1igan,reír|1ían,sistir|4an,tender|1iendan,tuar|1úen,decir|1igan,entir|ientan,erir|ieran,ger|jan,seguir|1igan,vertir|1iertan,gir|jan,dir|1an,bir|1an,ducir|2zcan,der|1an,uir|1yan,gar|1uen,ner|1gan,zar|cen,cer|zcan,car|quen,ar|en,omit|4en,dar\\(se\\)|1en,entirse|ientan,ullirse|3an,reverse|3an,arse|en",
        "exceptions": "cerrar|1ierren,sentar|1ienten,errar|yerren,oler|huelan,contar|1uenten,servir|1irvan,estar|3én,helar|1ielen,apretar|3ieten,negar|1ieguen,caber|quepan,ver|2an,sonar|1uenen,soler|1uelan,regar|1ieguen,oír|1igan,volar|1uelen,saber|1epan,ser|2an,unir|2an,ir|vayan,jugar|2eguen,hervir|1iervan,mudar(se)|3en,valer|3gan,leer|2an,elegir|2ijan,salir|3gan,rogar|1ueguen,querer|2ieran,vestir|1istan",
        "rev": "onsuman|5ir,ucedan|4er,ufran|3ir,ierren|errar,omiten|4,ompan|3er,rean|2er,nteren|4arse,oman|2er,flijan|3gir,irijan|3gir,muercen|1orzar,uelguen|olgar,uedan|oder,uenten|ontar,ehúsen|2usar,uejen|3arse,xijan|2gir,irvan|ervir,ecidan|4ir,injan|2gir,stén|2ar,ielen|elar,rotejan|4ger,prieten|2etar,güeren|1orar,umplan|4ir,pientan|1entirse,erigüen|4uar,mpartan|5ir,eman|2er,urjan|2gir,acten|3arse,mbullan|5irse,ronceen|5arse,uenen|onar,enueven|2ovar,uentren|ontrar,uevan|over,ueñen|oñar,uelen|olar,biernen|1ernar,ueran|orir,ierdan|erder,nan|1ir,trevan|4erse,uiebren|1ebrar,burran|4ir,uerzan|orcer,pierten|1ertar,rohíban|3ibir,miencen|1enzar,iensen|ensar,uerman|ormir,iervan|ervir,ruñan|3ir,añan|2er,piecen|1ezar,uestren|ostrar,metan|3er,iñan|eñir,vivan|3ir,rijan|1egir,priman|4ir,osan|2er,vengan|3ir,mitan|3ir,adan|2ir,batan|3ir,udan|2ir,ienden|endar,cuerden|1ordar,ieguen|egar,eban|2er,tingan|4uir,rran|2er,iesen|esar,prueben|2obar,agan|1cer,itan|etir,idan|edir,uesten|ostar,uelvan|olver,ienten|entar,bran|2ir,aigan|1er,rían|1eír,sistan|4ir,ean|1r,digan|1ecir,cojan|2ger,zan|cer,ientan|entir,ieran|erir,sigan|1eguir,viertan|1ertir,úen|uar,ban|1ir,duzcan|2cir,iendan|ender,íen|iar,ndan|2er,uyan|1ir,guen|1ar,ngan|1er,cen|zar,zcan|cer,quen|car,en|ar"
      }
    },
    "imperative": {
      "first": {
        "rules": "",
        "exceptions": "yacer|",
        "rev": ""
      },
      "second": {
        "rules": "overse|uevas,egarse|iégate,ncearse|3es,ormirse|uérmete,udarse|2es,illarse|íllate,riarse|1íate,eitarse|3es,uemarse|1émate,ansarse|ánsate,uedarse|1édate,einarse|3es,ostarse|uestes,urlarse|úrlate,lamarse|3es,cidirse|1ídete,nojarse|1ójate,ermarse|3es,ustarse|ústate,uejarse|1éjate,ucharse|úchate,ertarse|iertes,aduarse|2úate,ullirse|3as,estirse|istas,añarse|áñate,ercarse|ércate,fadarse|3es,actarse|3es,almarse|álmate,vidarse|1ídate,ertirse|iertas,asmarse|ásmate,asarse|ásate,entarse|iéntate,ebrarse|iébrate,jecerse|2zcas,reverse|1évete,urrirse|3as,nerse|1gas,charse|2es,uecerse|1écete,rarse|1es,larse|1es,estruir|5yas,namorar|6,intar|3es,omper|3as,legar|3ues,dmirar|5,tenecer|6,omprar|5,ecar|3,adrar|3es,uceder|4as,ufrir|3e,dornar|4es,egociar|6,postar|1uesta,olocar|5,quillar|6,emer|3,sminuir|5yas,ntregar|5ues,ompetir|3ite,bortar|4es,uponer|2ón,ormir|uerme,reer|3,rear|2es,nventar|5es,onjugar|5ues,ograr|3es,ntender|2iendas,lustrar|5es,alvar|3es,scubrir|5e,arcar|4,ntentar|5es,omer|2as,añer|3,bligar|4ues,oñar|ueña,ntinuar|4úa,scender|2iendas,lmorzar|2uerza,olgar|uelgues,ncender|2iende,sayunar|5es,anejar|4es,roponer|3ón,astimar|5es,ancelar|5es,rseguir|2igas,ultivar|6,avar|2es,nsultar|5es,brazar|5,espetar|5es,oder|uedas,ehusar|2úses,elear|3es,ibujar|4es,sponder|6,ravesar|3ieses,ncluir|4yas,gistrar|5es,ecidir|4as,omponer|5gas,omenzar|2iences,aler|2gas,roteger|6,vacuar|4es,nformar|5es,echazar|6,tacar|4,obernar|2iernes,gorar|1üeres,umplir|4e,poyar|4,raduar|3úa,uspirar|5es,evantar|5es,abricar|6,rreglar|6,fectuar|4úa,ubir|2as,ariar|2íes,ablecer|6,eñalar|5,enacer|3zcas,sperar|4es,ecordar|2uerda,eriguar|6,mpartir|5as,egular|5,onsumir|5e,liviar|5,rever|3é,lanchar|5es,liminar|5es,onfiar|3íes,avegar|5,levar|4,anar|2es,erminar|5es,nsuciar|6,nhelar|4es,ablar|4,educir|3zcas,autizar|6,enovar|2ueva,contrar|1uentres,oblar|3es,cabar|4,raducir|5e,rovocar|6,onreír|3ías,isfacer|4z,obrar|3es,ombatir|5e,ragar|4,eportar|5es,nstruir|5ye,vanzar|5,lover|1ueve,ensar|ienses,eredar|4es,xponer|4gas,xhibir|4e,elebrar|6,orir|uere,sconder|5as,riunfar|5es,sificar|6,nfluir|4ye,uerer|1iere,bolizar|6,evelar|5,erder|ierdas,nseguir|2igue,ogar|uegues,nversar|5es,alir|2,uebrar|1iebra,epender|5as,onfesar|3ieses,lorecer|6,jercer|3zas,argar|3ues,orcer|uerzas,ngañar|4es,dorar|4,dvertir|2ierte,aquecer|6,positar|5es,ascinar|5es,rohibir|3íbas,alcular|5es,frecer|5,efender|2iendas,redecir|3ice,visar|3es,ruñir|3as,oseguir|2igue,hismear|5es,equerir|3iere,aciar|2ía,nviar|2ía,currir|4e,ecibir|4as,ivertir|2ierte,estir|iste,stigar|5,stituir|5yas,pezar|1ieza,orrar|4,servar|4es,etir|itas,añar|3,meter|3as,uiar|1íes,istar|3es,clar|2es,edir|idas,vivir|3e,señar|3es,egir|ige,primir|4as,brir|2as,rrer|2as,nducir|4e,alentar|2ienta,andar|3es,rlar|3,venir|3gas,udir|2e,oser|3,mitir|3e,adir|2e,traer|4,hacer|2z,vitar|3es,coger|2jas,alar|2es,roducir|4zcas,migrar|5,diar|2es,reír|1íe,illar|3es,endar|ienda,piar|2es,decir|1igas,oler|uelas,sistir|4as,tuar|1úes,ilar|3,tender|1iende,conocer|4zcas,spirar|5,pasar|3es,sentir|1ientas,tribuir|5ye,olar|2es,nvertir|2iertas,cansar|5,vencer|5,pagar|3ues,otar|2es,arar|3,prender|5as,usar|3,enar|3,onar|2es,urar|2es,olver|uelvas,erir|ieras,par|1es,orar|2es,ticar|4,licar|4,char|3,ear|2,tener|1én,ber|2,gir|1e,ciar|2es,esar|2es,jar|2,inar|3,mar|2,ecer|1zcas,dar|2,zar|ces,car|ques,tar|2,omit|4es,dar\\(se\\)|2",
        "exceptions": "yacer|4,juntarse|4es,secarse|equivócate,afirmar|5es,teñir|1iñe,jurar|4,criar|2ía,vender|5,tener|3gas,preguntarse|4úntate,arrepentirse|5iéntete,sentirse|1ientas,verificar|8,mentir|1iente,bordar|4es,durar|4,oler|huelas,acordar|2uerdes,amar|2es,pedir|1ide,probar|2ueba,parecer|6,contar|1uenta,montar|4es,seguir|1igas,servir|1irvas,estar|3á,helar|1ieles,dar|1es,apretar|3ieta,purificar|8,tirar|3es,oponer|4gas,reñir|1iñas,amanecer|7,poner|3,divorciarse|3órciate,huir|2ye,insistir|6e,batir|3as,negar|1iega,preservar|8,ver|2,faltar|4es,pegar|4,preparar|6es,regar|1iegues,casar|4,escribir|6e,extinguir|7e,mirar|3es,nevar|1ieva,oír|1ye,demostrar|3uestra,costar|1uestes,ofender|5as,tardar|4es,caer|2igas,nacer|4,distinguir|7as,robar|3es,sentar|1ientes,ser|2as,unir|2as,leer|2as,nadar|3es,errar|yerres,aprobar|3uebes,ir|vayas,jugar|2ega,sonar|1uena,describir|7as,entrar|5,cerrar|1ierra,coger|4,sentir|1iente,volar|1uela,mostrar|1uestres,dejar|3es,regir|1ijas,hervir|1ierve,ponerse|3gas,acostarse|2uestes,mudar(se)|4,elegir|2ige,vestirse|1istas,divertirse|3iertas,echarse|3es,querer|2iere,vestir|1iste",
        "rev": "uevas|overse,nteres|4arse,namores|5arse,ompas|3er,roncees|5arse,untes|3arse,ucedas|4er,udes|2arse,omites|4,feites|4arse,rraches|5arse,eines|3arse,omas|2er,ricules|5arse,uelgues|olgar,lames|3arse,cuerdes|1ordar,rrolles|5arse,nfermes|5arse,uedas|oder,ehúses|2usar,irvas|ervir,piertes|1ertarse,ecidas|4ir,ieles|elar,miences|1enzar,tumbres|5arse,algas|2er,biernes|1ernar,iñas|eñir,güeres|1orar,mbullas|5irse,legres|4arse,nfades|4arse,mpartas|5ir,atas|2ir,actes|3arse,etengas|4erse,uentres|ontrar,iegues|egar,onrías|3eír,ienses|ensar,aigas|1er,stingas|5uir,ierdas|erder,ientes|entar,uegues|ogar,ejezcas|3cerse,nas|1ir,jerzas|3cer,pruebes|2obar,uerzas|orcer,burras|4irse,rohíbas|3ibir,uestres|ostrar,ruñas|3ir,ijas|egir,itas|etir,metas|3er,idas|edir,alles|3arse,primas|4ir,bras|2ir,rras|2er,vengas|3ir,sigas|1eguir,cojas|2ger,ieses|esar,digas|1ecir,uelas|oler,sistas|4ir,túes|1uar,sientas|1entir,viertas|1ertir,iendas|ender,uelvas|olver,ieras|erir,duzcas|2cir,pongas|3er,bas|1ir,íes|iar,uyas|1ir,ndas|2er,gues|1ar,zcas|cer,ces|zar,ques|car,es|ar,iégate|egarse,ufre|3ir,uérmete|ormirse,iñe|eñir,uíllate|1illarse,eme|3r,ríate|1iarse,ompite|3etir,gúntate|1untarse,uerme|ormir,ree|3r,orrige|3egir,iéntete|entirse,uémate|1emarse,ánsate|ansarse,uédate|1edarse,escubre|6ir,añe|3r,úrlate|urlarse,ecídete|2idirse,ide|edir,nójate|1ojarse,sústate|1ustarse,uéjate|1ejarse,esponde|7r,úchate|ucharse,rotege|6r,umple|4ir,radúate|3uarse,áñate|añarse,cércate|1ercarse,órciate|orciarse,nsiste|5ir,onsume|5ir,álmate|almarse,lvídate|2idarse,iásmate|1asmarse,ásate|asarse,iéntate|entarse,xtingue|6ir,ombate|5ir,lueve|1over,uere|orir,iébrate|ebrarse,trévete|2everse,oge|3r,redice|3ecir,equiere|3erir,ierve|ervir,curre|4ir,vive|3ir,iente|entir,ude|2ir,ose|3r,mite|3ir,ade|2ir,trae|4r,ríe|1eír,quécete|2ecerse,ibe|2ir,sigue|1eguir,vierte|1ertir,duce|3ir,iende|ender,be|2r,ge|1ir,uye|1ir,ce|2r,puesta|1ostar,ueña|oñar,lmuerza|2orzar,rueba|1obar,uenta|ontar,prieta|2etar,ecuerda|2ordar,iega|egar,enueva|2ovar,ieva|evar,muestra|1ostrar,uiebra|1ebrar,uega|1gar,uena|onar,ierra|errar,uela|olar,pieza|1ezar,alienta|2entar,ienda|endar,ía|iar,úa|uar,a|1r,stá|2ar,on|2er,pón|1oner,tén|1ener,revé|3er,al|2ir,az|1cer"
      },
      "third": {
        "rules": "terarse|3éis,ncearse|3éis,untarse|3éis,ecarse|1quéis,ormirse|urmáis,uemarse|3éis,acharse|3éis,uedarse|3éis,einarse|3éis,ostarse|3éis,cularse|3éis,cidirse|3áis,ermarse|3éis,uejarse|3éis,ucharse|3éis,aduarse|3éis,ullirse|3íos,estirse|3áis,ercarse|2quéis,egrarse|3éis,actarse|3éis,tenerse|3gáis,vidarse|3éis,ertirse|irtáis,ebrarse|3éis,urrirse|3áis,verse|1áis,ecerse|1zcáis,ponerse|4os,arse|1os,estruir|5yáis,omper|3áis,legar|3uéis,tenecer|4zcáis,omprar|4éis,horrar|4éis,erretir|3itáis,adrar|3éis,rometer|5áis,ulpar|3éis,evorar|4éis,squiar|4éis,laticar|4quéis,licitar|5éis,postar|4éis,olocar|3quéis,emer|2áis,terizar|4céis,ralizar|4céis,ratar|3éis,bicar|2quéis,omar|2éis,eguntar|5éis,dificar|4quéis,reer|2áis,rear|2éis,nventar|5éis,mprimir|5áis,arrer|3áis,nificar|4quéis,alvar|3éis,ntentar|5éis,añer|2áis,oportar|5éis,bligar|4uéis,oñar|2éis,ntinuar|5éis,ncantar|5éis,ndicar|3quéis,olgar|3uéis,sayunar|5éis,dmitir|4áis,taminar|5éis,divinar|5éis,ceptar|4éis,isitar|4éis,ancelar|5éis,rseguir|2igáis,avar|2éis,brazar|3céis,quistar|5éis,sgustar|5éis,sustar|4éis,elear|3éis,ibujar|4éis,nfiscar|4quéis,ravesar|5éis,xigir|2jáis,teresar|5éis,yudar|3éis,omponer|5gáis,omenzar|4céis,aler|2gáis,eciclar|5éis,impiar|4éis,endecir|3igáis,tacar|2quéis,umplir|4áis,galizar|4céis,nvadir|4áis,egresar|5éis,sociar|4éis,vorciar|5éis,rreglar|5éis,lamar|3éis,ubir|2áis,ablecer|4zcáis,iseñar|4éis,enacer|3zcáis,sperar|4éis,onvidar|5éis,hocar|2quéis,onsumir|5áis,lcanzar|4céis,urgir|2jáis,rever|4áis,lanchar|5éis,liminar|5éis,onfiar|4éis,levar|3éis,anar|2éis,epasar|4éis,esolver|5áis,nsuciar|5éis,autizar|4céis,campar|4éis,xplicar|4quéis,tumbrar|5éis,raducir|4zcáis,ugerir|2iráis,iquecer|4zcáis,rovocar|4quéis,obrar|3éis,ombatir|5áis,eportar|5éis,xplorar|5éis,vanzar|3céis,nstalar|5éis,eredar|4éis,uidar|3éis,menazar|4céis,escar|2quéis,astar|3éis,sconder|5áis,nvocar|3quéis,ecorar|4éis,riunfar|5éis,uerer|3áis,ntrolar|5éis,bolizar|4céis,erder|3áis,ontecer|4zcáis,ticipar|5éis,ublicar|4quéis,ogar|2uéis,nversar|5éis,onfesar|5éis,nservar|5éis,ecoger|3jáis,orcer|2záis,ngañar|4éis,lonizar|4céis,astigar|5uéis,rindar|4éis,positar|5éis,ascinar|5éis,iajar|3éis,alcular|5éis,frecer|3zcáis,ruñir|3áis,oseguir|2igáis,equerir|3iráis,mportar|5éis,nvencer|4záis,aciar|3éis,omendar|5éis,tilizar|4céis,nviar|3éis,mirar|3éis,rnar|2éis,regar|3uéis,regir|1ijáis,jugar|3uéis,durar|3éis,nducir|3zcáis,venir|3gáis,udir|2áis,cordar|4éis,vitar|3éis,ntener|4gáis,ontar|3éis,luir|2yáis,formar|4éis,blar|2éis,tinguir|4áis,sentar|4éis,errar|3éis,grar|2éis,tender|4áis,brir|2áis,nsar|2éis,strar|3éis,bar|1éis,llar|2éis,r|d,omit|4ad,dar\\(se\\)|2d",
        "exceptions": "desagradecer|9zcáis,tocar|2quéis,desaparecer|8zcáis,desagradar|8éis,jurar|3éis,abordar|5éis,callarse|4éis,vender|4áis,arrepentirse|8íos,luchar|4éis,sentirse|4áis,calentar|6éis,verificar|6quéis,mandar|4éis,clarificar|7quéis,atraer|4igáis,introducir|7zcáis,seguir|1igáis,servir|1irváis,decir|1igáis,toser|3áis,estimar|5éis,oponer|4gáis,reñir|1iñáis,volver|4áis,reír|1iais,insistir|6áis,preservar|7éis,caber|quepáis,ver|2áis,permanecer|7zcáis,deber|3áis,curar|3éis,preparar|6éis,saber|1epáis,soler|3áis,casar|3éis,escribir|6áis,asistir|5áis,pesar|3éis,tardar|4éis,caer|2igáis,besar|3éis,votar|3éis,odiar|3éis,ser|2ais,nadar|3éis,cesar|3éis,ir|vayáis,sonar|3éis,medir|1idáis,sacrificar|7quéis,convertir|4irtáis,aparecer|5zcáis,coger|2jáis,renunciar|7éis,sentir|1intáis,juntarse|4éis,mudar(se)|4d,ducharse|4éis,detenerse|5gáis,divertirse|3irtáis,enflaquecerse|8zcáis",
        "rev": "ováis|2erse,nteréis|4arse,ompáis|3er,onceéis|4arse,rritáis|2etir,equéis|1carse,ometáis|4er,urmáis|ormirse,emáis|2er,reáis|2er,primáis|4ir,ueméis|3arse,entáis|3irse,arráis|3er,rachéis|4arse,uedéis|3arse,einéis|3arse,añáis|2er,costéis|4arse,iculéis|4arse,ecidáis|4irse,dmitáis|4ir,ferméis|4arse,uejéis|3arse,xijáis|2gir,irváis|ervir,osáis|2er,algáis|2er,iñáis|eñir,umpláis|4ir,raduéis|4arse,nvadáis|4ir,estáis|3irse,erquéis|2carse,iais|eír,legréis|4arse,nsumáis|4ir,urjáis|2gir,actéis|3arse,ebáis|2er,lvidéis|4arse,oláis|2er,mbatáis|4ir,ueráis|3er,eais|1r,uebréis|4arse,jezcáis|2cerse,treváis|4erse,burráis|4irse,intáis|entir,ruñáis|3ir,rijáis|1egir,íos|irse,vengáis|3ir,udáis|2ir,aigáis|1er,tengáis|3er,pongáis|3er,digáis|1ecir,olváis|3er,báis|1ir,sistáis|4ir,veáis|2r,iráis|erir,tingáis|4uir,cojáis|2ger,záis|cer,uyáis|1ir,bráis|2ir,sigáis|1eguir,duzcáis|2cir,dáis|1er,guéis|1ar,zcáis|cer,céis|zar,quéis|car,os|rse,éis|ar,omitad|4,d|r"
      },
      "firstPlural": {
        "rules": "",
        "exceptions": "yacer|",
        "rev": ""
      },
      "secondPlural": {
        "rules": "overse|uévase,terarse|3e,morarse|1órese,egarse|iéguese,ncearse|2éese,ormirse|uerma,udarse|údese,illarse|íllese,eitarse|3e,uemarse|3e,acharse|áchese,ansarse|ánsese,uedarse|3e,einarse|éinese,ostarse|ueste,urlarse|úrlese,cularse|3e,lamarse|1ámese,cidirse|1ídase,ordarse|uérdese,ollarse|óllese,ermarse|érmese,uejarse|1éjese,ertarse|iértese,mbrarse|3e,aduarse|2úe,ullirse|3a,antarse|ántese,estirse|ista,ercarse|érquese,egrarse|3e,fadarse|3e,actarse|áctese,almarse|álmese,vidarse|1ídese,ertirse|ierta,asmarse|3e,asarse|ásese,onderse|óndase,ebrarse|iebre,reverse|1évase,pararse|1árese,urrirse|úrrase,entirse|ienta,nerse|1ga,icarse|íquese,ecerse|1zca,omper|3a,añer|2a,oñar|ueñe,ntinuar|4úe,lmorzar|2uerce,olgar|uelgue,oder|ueda,ehusar|2úse,ravesar|3iese,omenzar|2ience,aler|2ga,obernar|2ierne,gorar|1üere,umplir|4a,eriguar|4üe,mpartir|5a,rever|4a,onfiar|3íe,enovar|2ueve,contrar|1uentre,spertar|2ierte,isfacer|4ga,ensar|iense,orir|uera,uerer|1iera,erder|ierda,ogar|uegue,alir|2ga,onfesar|3iese,jercer|3za,orcer|uerza,rohibir|3íba,efender|2ienda,ruñir|3a,aciar|2íe,nviar|2íe,pezar|1iece,meter|3a,uiar|1íe,eñir|iña,ostar|ueste,mer|1a,riar|1íe,vivir|3a,eer|1a,rrer|2a,alentar|2iente,cender|1ienda,venir|3ga,oser|2a,cordar|1uerde,mitir|3a,hacer|2ga,endar|iende,oler|uela,eber|2a,over|ueva,tinguir|4a,batir|3a,mostrar|1uestre,probar|2uebe,vencer|3za,etir|ita,edir|ida,egir|ija,mir|1a,tender|1ienda,olver|uelva,entir|ienta,aer|1iga,reír|1ía,decir|1iga,sistir|4a,tuar|1úe,vertir|1ierta,erir|iera,seguir|1iga,ger|ja,gir|ja,dir|1a,bir|1a,rir|1a,ducir|2zca,der|1a,uir|1ya,ner|1ga,gar|1ue,zar|ce,cer|zca,car|que,ar|e,omit|4e,dar\\(se\\)|1e",
        "exceptions": "juntarse|4e,secarse|equivóquese,callarse|4e,hallarse|1állese,preguntarse|4úntese,oler|huela,contar|1uente,servir|1irva,estar|3é,helar|1iele,dar|1é,apretar|3iete,negar|1iegue,caber|quepa,ver|2a,saber|1epa,regar|1iegue,echarse|échese,nevar|1ieve,oír|1iga,sentar|1iente,ser|2a,unir|2a,errar|yerre,ir|vaya,irse|váyase,jugar|2egue,sonar|1uene,cerrar|1ierre,oponerse|2óngase,volar|1uele,hervir|1ierva,ponerse|3ga,sentirse|1ienta,acostarse|2ueste,mudar(se)|3e,valer|3ga,elegir|2ija,vestirse|1ista,detenerse|5ga,querer|2iera,rogar|1uegue,salir|3ga,leer|2a",
        "rev": "uévase|overse,ntere|4arse,amórese|2orarse,iéguese|egarse,oncéese|3earse,údese|udarse,uíllese|1illarse,omite|4,állese|allarse,gúntese|1untarse,feite|4arse,ueme|3arse,ráchese|1acharse,ánsese|ansarse,uede|3arse,éinese|einarse,ueñe|oñar,úrlese|urlarse,tricule|6arse,lmuerce|2orzar,uelgue|olgar,lámese|1amarse,ecídase|2idirse,uérdese|ordarse,róllese|1ollarse,férmese|1ermarse,uente|ontar,ehúse|2usar,uéjese|1ejarse,iértese|ertarse,iele|elar,omience|2enzar,stumbre|6arse,priete|2etar,obierne|2ernar,güere|1orar,radúe|3uarse,vántese|1antarse,érquese|ercarse,legre|4arse,nfade|4arse,verigüe|5uar,áctese|actarse,álmese|almarse,lvídese|2idarse,usiasme|6arse,enueve|2ovar,cuentre|1ontrar,ásese|asarse,spierte|2ertar,ieve|evar,iense|ensar,cóndase|1onderse,uiebre|1ebrarse,trévase|2everse,uene|onar,epárese|2ararse,búrrase|1urrirse,ierre|errar,póngase|1onerse,uele|olar,piece|1ezar,ueste|ostar,íquese|icarse,cuerde|1ordar,iese|esar,iende|endar,iegue|egar,muestre|1ostrar,pruebe|2obar,iente|entar,úe|uar,íe|iar,gue|1ar,ce|zar,que|car,e|ar,ompa|3er,uceda|4er,ufra|3ir,uerma|ormirse,ema|2er,rea|2er,epienta|2entirse,arra|3er,oma|2er,aña|2er,flija|3gir,irija|3gir,ueda|oder,xija|2gir,irva|ervir,ecida|4ir,inja|2gir,roteja|4ger,umpla|4ir,ambulla|6irse,omparta|6ir,onsuma|5ir,urja|2gir,ivierta|2ertirse,aquezca|4cerse,uera|orir,ierda|erder,orra|3er,vejezca|4cerse,na|1ir,uerza|orcer,rohíba|3ibir,ruña|3ir,ierva|ervir,meta|3er,iña|eñir,viva|3ir,rija|1egir,prima|4ir,venga|3ir,uda|2ir,osa|2er,mita|3ir,ada|2ir,uela|oler,eba|2er,ueva|over,tinga|4uir,bata|3ir,urra|3ir,ita|etir,ida|edir,bra|2ir,aga|1cer,uelva|olver,ienta|entir,aiga|1er,coja|2ger,ría|1eír,diga|1ecir,sista|4ir,ea|1r,za|cer,vierta|1ertir,iera|erir,siga|1eguir,ba|1ir,ienda|ender,duzca|2cir,nda|2er,uya|1ir,nga|1er,zca|cer,é|ar"
      },
      "thirdPlural": {
        "rules": "overse|uevan,terarse|1érense,morarse|1órense,egarse|ieguen,ncearse|2éense,ormirse|uerman,udarse|údense,illarse|íllense,riarse|1íense,eitarse|éitense,acharse|3en,ansarse|ánsense,uedarse|1édense,einarse|éinense,ostarse|uesten,urlarse|úrlense,cidirse|3an,ordarse|uérdense,nojarse|1ójense,ustarse|ústense,uejarse|3en,ucharse|úchense,ertarse|ierten,mbrarse|3en,aduarse|2úense,ullirse|3an,estirse|ístanse,añarse|áñense,ercarse|2quen,egrarse|égrense,fadarse|1ádense,actarse|áctense,almarse|álmense,vidarse|1ídense,ertirse|iértanse,asmarse|ásmense,asarse|ásense,avarse|ávense,ebrarse|iébrense,jecerse|2zcan,reverse|1évanse,urrirse|úrranse,entirse|iéntanse,nerse|1gan,uecerse|1ézcanse,marse|1en,larse|1en,omper|3an,añer|2an,oñar|ueñen,ntinuar|4úen,lmorzar|2uercen,olgar|uelguen,oder|uedan,ehusar|2úsen,ravesar|3iesen,omenzar|2iencen,aler|2gan,obernar|2iernen,gorar|1üeren,umplir|4an,raduar|3úen,eriguar|4üen,mpartir|5an,rever|4an,onfiar|3íen,enovar|2ueven,contrar|1uentren,isfacer|4gan,lover|1uevan,ensar|iensen,orir|ueran,uerer|1ieran,erder|ierdan,ogar|ueguen,alir|2gan,uebrar|1iebren,onfesar|3iesen,jercer|3zan,orcer|uerzan,rohibir|3íban,efender|2iendan,ruñir|3an,aciar|2íen,nviar|2íen,estir|istan,pezar|1iecen,meter|3an,uiar|1íen,eñir|iñan,ostar|uesten,mer|1an,riar|1íen,vivir|3an,eer|1an,rrer|2an,alentar|2ienten,cender|1iendan,venir|3gan,oser|2an,cordar|1uerden,mitir|3an,hacer|2gan,endar|ienden,oler|uelan,eber|2an,tinguir|4an,batir|3an,mostrar|1uestren,probar|2ueben,vencer|3zan,etir|itan,edir|idan,egir|ijan,mir|1an,tender|1iendan,olver|uelvan,aer|1igan,reír|1ían,decir|1igan,sistir|4an,tuar|1úen,entir|ientan,dir|1an,erir|ieran,seguir|1igan,ger|jan,vertir|1iertan,gir|jan,bir|1an,rir|1an,ducir|2zcan,der|1an,uir|1yan,ner|1gan,gar|1uen,zar|cen,cer|zcan,car|quen,ar|en,omit|4en,dar\\(se\\)|1en",
        "exceptions": "juntarse|4en,secarse|equivóquense,preguntarse|4úntense,oler|huelan,contar|1uenten,servir|1irvan,estar|3én,helar|1ielen,apretar|3ieten,registrarse|3ístrense,caber|quepan,ver|2an,saber|1epan,regar|1ieguen,echarse|échense,nevar|1ieven,oír|1igan,sentar|1ienten,ser|2an,unir|2an,errar|yerren,ir|vayan,irse|váyanse,jugar|2eguen,sonar|1uenen,cerrar|1ierren,volar|1uelen,hervir|1iervan,moverse|1uevan,negarse|1ieguen,arrepentirse|5iéntanse,ponerse|3gan,sentirse|1iéntanse,acostarse|2uesten,mudar(se)|3en,acordarse|2uérdense,valer|3gan,elegir|2ijan,detenerse|5gan,divertirse|3iértanse,querer|2ieran,quebrarse|2iébrense,rogar|1ueguen,salir|3gan,leer|2an,vestir|1istan",
        "rev": "térense|1erarse,mórense|1orarse,ncéense|2earse,údense|udarse,íllense|illarse,ríense|1iarse,úntense|untarse,éitense|eitarse,ánsense|ansarse,uédense|1edarse,éinense|einarse,úrlense|urlarse,nójense|1ojarse,ústense|ustarse,úchense|ucharse,adúense|2uarse,ístanse|estirse,áñense|añarse,égrense|egrarse,fádense|1adarse,áctense|actarse,álmense|almarse,vídense|1idarse,ásmense|asmarse,ásense|asarse,ávense|avarse,révanse|1everse,úrranse|urrirse,ézcanse|ecerse,ompan|3er,ucedan|4er,ufran|3ir,uerman|ormirse,eman|2er,omiten|4,rean|2er,uemen|3arse,arran|3er,rrachen|5arse,oman|2er,añan|2er,flijan|3gir,ueñen|oñar,irijan|3gir,riculen|5arse,muercen|1orzar,uelguen|olgar,lamen|3arse,ecidan|4irse,rrollen|5arse,nfermen|5arse,uedan|oder,uenten|ontar,ehúsen|2usar,uejen|3arse,xijan|2gir,irvan|ervir,pierten|1ertarse,injan|2gir,stén|2ar,ielen|elar,miencen|1enzar,tumbren|5arse,rotejan|4ger,prieten|2etar,biernen|1ernar,güeren|1orar,umplan|4ir,mbullan|5irse,cerquen|3carse,erigüen|4uar,mpartan|5ir,onsuman|5ir,urjan|2gir,enueven|2ovar,uentren|ontrar,ieven|evar,luevan|1over,iensen|ensar,ueran|orir,ierdan|erder,orran|3er,ejezcan|3cerse,nan|1ir,uiebren|1ebrar,uerzan|orcer,uenen|onar,ierren|errar,rohíban|3ibir,uelen|olar,ruñan|3ir,iervan|ervir,piecen|1ezar,metan|3er,iñan|eñir,uesten|ostar,allen|3arse,vivan|3ir,rijan|1egir,priman|4ir,vengan|3ir,udan|2ir,osan|2er,cuerden|1ordar,mitan|3ir,adan|2ir,iesen|esar,ienden|endar,uelan|oler,eban|2er,tingan|4uir,batan|3ir,uestren|ostrar,prueben|2obar,urran|3ir,itan|etir,idan|edir,bran|2ir,ienten|entar,agan|1cer,uelvan|olver,aigan|1er,cojan|2ger,rían|1eír,digan|1ecir,sistan|4ir,ean|1r,zan|cer,ientan|entir,ieran|erir,sigan|1eguir,viertan|1ertir,úen|uar,ban|1ir,iendan|ender,duzcan|2cir,íen|iar,ndan|2er,uyan|1ir,ngan|1er,guen|1ar,cen|zar,zcan|cer,quen|car,en|ar"
      }
    },
    "gerunds": {
      "gerunds": {
        "rules": "omper|3iendo,ormir|urmiendo,oncebir|3ibiendo,orir|uriendo,odrir|udriendo,oer|1yendo,ejer|2iendo,endir|indiendo,rgüir|2uyendo,ngullir|5endo,ervir|irviendo,oser|2iendo,minuir|4yendo,huir|2yendo,oír|1yendo,mer|1iendo,egir|igiendo,etir|itiendo,estir|istiendo,eñir|iñendo,reír|1iendo,ler|1iendo,pedir|1idiendo,struir|4yendo,eer|1yendo,seguir|1iguiendo,entir|intiendo,buir|2yendo,rer|1iendo,decir|1iciendo,luir|2yendo,vertir|1irtiendo,ter|1iendo,venir|1iniendo,ber|1iendo,stituir|5yendo,ger|1iendo,aer|1yendo,erir|iriendo,ver|1iendo,ner|1iendo,der|1iendo,cer|1iendo,ir|1endo,r|ndo",
        "exceptions": "ir|yendo,poder|1udiendo,medir|1idiendo,seguir|1iguiendo,servir|1irviendo,convertir|4irtiendo,elegir|2igiendo,conseguir|4iguiendo,romper|4iendo,repetir|3itiendo,adquirir|7endo,sufrir|5endo,correr|4iendo,recorrer|6iendo,reír|1iendo,pedir|1idiendo,valer|3iendo,dormir|1urmiendo,concebir|4ibiendo,impedir|3idiendo,derretir|4itiendo,barrer|4iendo,vestir|1istiendo,sentir|1intiendo,hundir|5endo,mentir|1intiendo,extinguir|8endo,distinguir|9endo,podrir|1udriendo,verter|4iendo,expandir|7endo,invertir|3irtiendo,esparcir|7endo,roer|2yendo,difundir|7endo,perseguir|4iguiendo,definir|6endo,converger|7iendo,emerger|5iendo,revertir|3irtiendo,hervir|1irviendo,despedir|4idiendo,confundir|8endo,moler|3iendo,transgredir|10endo,corregir|4igiendo,proseguir|4iguiendo,demoler|5iendo,regir|1igiendo,fundir|5endo,reseguir|3iguiendo,advertir|3irtiendo,rendir|1indiendo,redefinir|8endo,freír|2iendo,competir|4itiendo,prescindir|9endo,desmentir|4intiendo,consentir|4intiendo,embestir|3istiendo,refundir|7endo,expedir|3idiendo,reconvertir|6irtiendo,revestir|3istiendo,infundir|7endo,blandir|6endo,divertir|3irtiendo,inquirir|7endo,fruncir|6endo,pervertir|4irtiendo,descorrer|7iendo,asir|3endo,presentir|4intiendo,escindir|7endo",
        "rev": "emiendo|2er,omiendo|2er,uriendo|orir,egiendo|2er,rniendo|3r,eliendo|2er,amiendo|2er,ejiendo|2er,triendo|3r,guyendo|1üir,ullendo|3ir,quiendo|3r,nriendo|2eír,eriendo|2er,osiendo|2er,ebiendo|2er,uniendo|3r,oyendo|1ír,abiendo|2er,rbiendo|2er,piendo|2r,iñendo|eñir,adiendo|3r,eyendo|1er,iviendo|3r,udiendo|3r,ogiendo|2er,iciendo|ecir,rriendo|3r,etiendo|2er,liendo|2r,briendo|3r,idiendo|3r,iniendo|enir,ayendo|1er,iriendo|erir,uciendo|3r,giendo|2r,viendo|1er,biendo|2r,miendo|2r,yendo|ir,niendo|1er,tiendo|2r,diendo|1er,ciendo|1er,ndo|r"
      }
    },
    "perfecto": {
      "perfecto": {
        "rules": "omper|1to,epillar|5ía cepillado,isfacer|3echo,rever|3isto,redecir|3icho,orir|uerto,hacer|1echo,scribir|4to,eer|1ído,olver|uelto,aer|1ído,brir|1ierto,poner|1uesto,er|ido,r|do,omit|4ado,verse|1ido,rse|do",
        "exceptions": "freír|2ito,decir|1icho,ver|1isto,cepillar|6ía cepillado,querer|4ido,juntarse|5do,prepararse|7do,mudarse|4do,leer|2ído,creer|3ído,hallarse|5do,valer|3ido,sentirse|5do",
        "rev": "ovido|2erse,nterado|5rse,otegido|4er,ntecido|4er,oto|1mper,arrido|3er,uedado|4rse,onceado|5rse,ecado|3rse,orrido|3er,trevido|4erse,lamado|4rse,ucedido|4er,edecido|4er,actado|4rse,emido|2er,omitado|4,feitado|5rse,pentido|5rse,omido|2er,uerto|orir,ejecido|4er,odido|2er,bullido|5rse,uejado|4rse,añido|2er,erdido|3er,ebido|2er,rcido|2er,lecido|3er,metido|3er,quecido|4er,visto|1er,escrito|5bir,vencido|4er,dicho|1ecir,abido|2er,onocido|4er,olido|2er,acido|2er,adecido|4er,echo|acer,uelto|olver,necido|3er,aído|1er,sido|1er,cogido|3er,bierto|1rir,puesto|1oner,tenido|3er,recido|3er,ndido|2er,do|r"
      }
    }
  };

  // uncompress them
  Object.keys(model$1).forEach(k => {
    Object.keys(model$1[k]).forEach(form => {
      model$1[k][form] = uncompress$1(model$1[k][form]);
    });
  });

  let { gerunds } = model$1;
  // =-=-
  let m$3 = {
    fromGerund: reverse$1(gerunds.gerunds),
    toGerund: gerunds.gerunds,
  };

  const fromGerund = function (str) {
    return convert$1(str, m$3.fromGerund)
  };
  const toGerund$1 = function (str) {
    return convert$1(str, m$3.toGerund)
  };

  // does this make any sense?
  const toReflexive = function (str) {
    str = str.replace(/ar$/, 'arse');
    // str = str.replace(/ar$/, 'irte') //TODO:fixme
    // str = str.replace(/ar$/, 'arme')

    str = str.replace(/ir$/, 'irse');
    // str = str.replace(/ir$/, 'irte')

    str = str.replace(/er$/, 'erse');
    str = str.replace(/o$/, 'ose');
    return str
  };

  let { presentTense: presentTense$1, pastTense: pastTense$1, futureTense: futureTense$1, conditional: conditional$1 } = model$1;

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

  const toPresent$1 = (str) => doEach(str, presentTense$1);
  const toPast$1 = (str) => doEach(str, pastTense$1);
  const toFuture$1 = (str) => doEach(str, futureTense$1);
  const toConditional$1 = (str) => doEach(str, conditional$1);

  // an array of every inflection, for '{inf}' syntax
  const all$2 = function (str) {
    let res = [str].concat(
      Object.values(toPresent$1(str)),
      Object.values(toPast$1(str)),
      Object.values(toFuture$1(str)),
      Object.values(toConditional$1(str)),
      toGerund$1(str),
      toReflexive(str),
    ).filter(s => s);
    res = new Set(res);
    return Array.from(res)
  };

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

  let pRev = reverse$1(model$1.nouns.plurals);

  const toPlural$1 = (str) => convert$1(str, model$1.nouns.plurals);
  const toSingular$1 = (str) => convert$1(str, pRev);

  const all$1 = function (str) {
    let plur = toPlural$1(str);
    if (str === plur) {
      return [str]
    }
    return [str, plur]
  };
  // console.log(toFemale("principesco") === "principesca")
  // console.log(fromFemale("principesca") === "principesco")
  // console.log(toPlural("principesco") === "principescos")
  // console.log(toSingular("principescos") === "principesco")
  // console.log(toSingular("sombras") === "sombra")

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

  let { f: f$2, mp, fp } = model$1.adjectives;

  let fRev = reverse$1(f$2);
  let mpRev = reverse$1(mp);
  let fpRev = reverse$1(fp);

  const toFemale = (str) => convert$1(str, f$2);
  const toPlural = (str) => convert$1(str, mp);
  const toFemalePlural = (str) => convert$1(str, fp);
  const fromFemale = (str) => convert$1(str, fRev);
  const toSingular = (str) => convert$1(str, mpRev);
  const fromFemalePlural = (str) => convert$1(str, fpRev);

  const all = function (str) {
    let arr = [str];
    arr.push(toFemale(str));
    arr.push(toPlural(str));
    arr.push(toFemalePlural(str));
    arr = arr.filter(s => s);
    arr = new Set(arr);
    return Array.from(arr)
  };

  var adjective = {
    all,
    toFemale,
    toPlural,
    toFemalePlural,
    fromFemale,
    toSingular,
    fromFemalePlural,
  };
  // console.log(toFemale("principesco") === "principesca")
  // console.log(fromFemale("principesca") === "principesco")
  // console.log(toPlural("principesco") === "principescos")
  // console.log(toSingular("principescos") === "principesco")

  let { perfecto } = model$1;

  // =-=-
  let m$2 = {
    fromPerfecto: reverse$1(perfecto.perfecto),
    toPerfecto: perfecto.perfecto,
  };

  const fromPerfecto = function (str) {
    return convert$1(str, m$2.fromPerfecto)
  };
  const toPerfecto$1 = function (str) {
    return convert$1(str, m$2.toPerfecto)
  };

  var methods$1 = {
    verb: {
      fromGerund, fromPresent, fromPast, fromFuture, fromConditional,
      toPresent: toPresent$1, toPast: toPast$1, toFuture: toFuture$1, toConditional: toConditional$1, toGerund: toGerund$1,
      fromPerfecto, toPerfecto: toPerfecto$1,
      all: all$2,
    },
    noun: {
      toPlural: toPlural$1,
      toSingular: toSingular$1,
      toMasculine: toMasculine$1,
      all: all$1
    },
    adjective,
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

    'no': 'Negative',
    'nunca': 'Negative',//never

    irse: ['Reflexive', 'Infinitive']
  };
  copulas.forEach(str => {
    lex[str] = 'Copula';
  });
  haves.forEach(str => {
    lex[str] = 'Auxiliary';
  });

  var misc$1 = lex;

  const { toPresent, toPast, toFuture, toConditional, toGerund, toPerfecto } = methods$1.verb;
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
        let obj = toPresent(w);
        addWords(obj, 'PresentTense', lexicon$1);
        // add past tense
        obj = toPast(w);
        addWords(obj, 'PastTense', lexicon$1);
        // add future tense
        obj = toFuture(w);
        addWords(obj, 'FutureTense', lexicon$1);
        // add conditional
        obj = toConditional(w);
        addWords(obj, 'Conditional', lexicon$1);
        // add gerund
        let str = toGerund(w);
        lexicon$1[str] = lexicon$1[str] || 'Gerund';
        // add perfecto
        str = toPerfecto(w);
        lexicon$1[str] = lexicon$1[str] || 'Perfecto';
      }
      if (tag === 'Adjective') {
        let f = methods$1.adjective.toFemale(w);
        lexicon$1[f] = lexicon$1[f] || ['Adjective', 'FemaleAdjective', 'SingularAdjective'];
        let fs = methods$1.adjective.toFemalePlural(w);
        lexicon$1[fs] = lexicon$1[fs] || ['Adjective', 'FemaleAdjective', 'PluralAdjective'];
      }
      if (tag === 'Cardinal') {
        lexicon$1[w] = ['Cardinal', 'TextValue'];
      }
      if (tag === 'Ordinal') {
        lexicon$1[w] = ['Ordinal', 'TextValue'];
      }
    });
  });
  // console.log(lexicon['ganado'])

  var lexicon$2 = lexicon$1;

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
          } else if (term.tags.has('Perfecto')) {
            term.root = verb.fromPerfecto(str, form);
          } else if (term.tags.has('PresentTense')) {
            term.root = verb.fromPresent(str, form);
          } else if (term.tags.has('PastTense')) {
            term.root = verb.fromPast(str, form);
          } else if (term.tags.has('FutureTense')) {
            term.root = verb.fromFuture(str, form);
          } else if (term.tags.has('Conditional')) {
            term.root = verb.fromConditional(str, form);
          } else {
            // guess!
            term.root = verb.fromPresent(str, form);
          }
        }

        // nouns -> singular masculine form
        if (term.tags.has('Noun')) {
          if (term.tags.has('Plural')) {
            str = noun.toSingular(str);
          }
          if (term.tags.has('FemaleNoun')) ;
          term.root = str;
        }

        // nouns -> singular masculine form
        if (term.tags.has('Adjective')) {
          if (term.tags.has('PluralAdjective')) {
            if (term.tags.has('FemaleAdjective')) {
              str = adjective.fromFemalePlural(str);
            } else {
              str = adjective.toSingular(str);
            }
          }
          if (term.tags.has('FemaleAdjective')) {
            str = adjective.fromFemale(str);
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
    if (term.tags.has('Verb')) {
      // skip these
      if (term.tags.has('Infinitive') || term.tags.has('Auxiliary') || term.tags.has('Negative')) {
        return
      }
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
  var preTagger$1 = tagger;

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
    [/^[-+]?[0-9]+(,[0-9]{3})*(\.[0-9]+)?(st|nd|rd|r?th|°)$/, ['Ordinal', 'NumericValue'], '53rd'],
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
      ño: jj,
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
      iso: jj,
      ito: jj,
      izo: jj,
      cto: jj,
      ana: jj,
      eos: jj,
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
      pto: jj,
      osa: jj,
      tos: jj,

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
      fica: jj,
      gica: jj,
      mica: jj,
      nica: jj,
      lica: jj,
      tica: jj,
      able: jj,
      tivo: jj,
      sivo: jj,
      esco: jj,
      iaco: jj,
      íaco: jj,
      áceo: jj,
      áneo: jj,
      icio: jj,
      culo: jj,
      ento: jj,
      aria: jj,
      bles: jj,
      tiva: jj,
      ante: jj,
      ente: jj,
      ánea: jj,
      siva: jj,
      ular: jj,
      osas: jj,
      ales: jj,
      iles: jj,
      anos: jj,
      osos: jj,
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
      arse: ref,
      arte: ref,
      arme: ref,
      irse: ref,
      irte: ref,
      erse: ref,
      dose: ref,
      ario: jj,
      orio: jj,
      iano: jj,
      dero: jj,
      fero: jj,
      jero: jj,
      lero: jj,
      ales: jj,
      nero: jj,
      tero: jj,
      ares: jj,
      ores: jj,
      rios: jj,
      ivos: jj,
    },
    { // five-letter suffixes
      'ación': nn,
      mente: rb,
      ísimo: jj,
      icano: jj,
      ntino: jj,
      tivas: jj,
      andés: jj,
      adora: jj,
      antes: jj,
      iendo: g,
      yendo: g,
      ieron: vb,
      remos: fut,
      iente: jj,
      entes: jj,
    },
    {
      // six-letter suffixes
      ística: jj,
      ciones: nn,
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
  var exceptions$1 = { f, m };

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
    if (exceptions$1.f.has(str)) {
      return 'f'
    }
    if (exceptions$1.m.has(str)) {
      return 'm'
    }
    return bySuffix(str)
  };
  var bySuffix$1 = guessGender;

  // roughly, split a document by comma or semicolon
  const splitOn = function (terms, i) {
    const isNum = /^[0-9]+$/;
    let term = terms[i];
    // early on, these may not be dates yet:
    if (!term) {
      return false
    }
    const maybeDate = new Set(['may', 'april', 'august', 'jan']);
    // veggies, like figs
    if (term.normal === 'like' || maybeDate.has(term.normal)) {
      return false
    }
    // toronto, canada  - tuesday, march
    if (term.tags.has('Place') || term.tags.has('Date')) {
      return false
    }
    if (terms[i - 1]) {
      let lastTerm = terms[i - 1];
      // thursday, june
      if (lastTerm.tags.has('Date') || maybeDate.has(lastTerm.normal)) {
        return false
      }
      // pretty, nice, and fun
      if (lastTerm.tags.has('Adjective') || term.tags.has('Adjective')) {
        return false
      }
    }
    // don't split numbers, yet
    let str = term.normal;
    if (str.length === 1 || str.length === 2 || str.length === 4) {
      if (isNum.test(str)) {
        return false
      }
    }
    return true
  };

  // kind-of a dirty sentence chunker
  const quickSplit = function (document) {
    const splitHere = /[,:;]/;
    let arr = [];
    document.forEach(terms => {
      let start = 0;
      terms.forEach((term, i) => {
        // does it have a comma/semicolon ?
        if (splitHere.test(term.post) && splitOn(terms, i + 1)) {
          arr.push(terms.slice(start, i + 1));
          start = i + 1;
        }
      });
      if (start < terms.length) {
        arr.push(terms.slice(start, terms.length));
      }
    });
    return arr
  };

  var quickSplit$1 = quickSplit;

  let exceptions = {
    análisis: false,
    jueves: false,
    ciempiés: false,
  };

  const looksPlural = function (str) {
    // not long enough to be plural
    if (!str || str.length <= 3) {
      return false
    }
    // 'menus' etc
    if (exceptions.hasOwnProperty(str)) {
      return exceptions[str]
    }
    if (str.endsWith('s')) {
      return true
    }
    return false
  };
  var looksPlural$1 = looksPlural;

  var methods = {
    two: {
      quickSplit: quickSplit$1,
      looksPlural: looksPlural$1,
      guessGender: bySuffix$1,
    }
  };

  var preTagger = {
    compute: {
      preTagger: preTagger$1
    },
    model: {
      two: model
    },
    methods,
    hooks: ['preTagger']
  };

  var matches = [
    // east berlin
    { match: '[este] #Place', group: 0, tag: 'Adjective', reason: 'este-place' },
    // hundred and two
    { match: '#Value [y] #Value', group: 0, tag: 'TextValue', reason: 'num-y-num' },
    // minus 8
    { match: '[menos] #Value', group: 0, tag: 'TextValue', reason: 'minus 4' },
    // 3 pintas de cerveza
    { match: '#Value [#PresentTense] de #Noun', group: 0, tag: 'Plural', reason: '3-pintas' },

    // adjective-noun
    { match: '#Determiner [#Adjective]$', group: 0, tag: 'Noun', reason: 'det-adj' },
    // la tarde
    { match: '#Determiner [#Adverb]$', group: 0, tag: 'Noun', reason: 'det-adv' },

    // no exageres
    { match: 'no [#Noun]', group: 0, tag: 'Verb', reason: 'no-noun' },


    // auxiliary verbs
    { match: '[#Modal] #Verb', group: 0, tag: 'Auxiliary', reason: 'modal-verb' },
    // alcanzar + infinitive (to manage to do)
    // comenzar + infinitive (to begin doing)
    // resultar + infinitive (to end up doing)
    { match: '[(alcanzar|comenzar|resultar)] #Infinitive', group: 0, tag: 'Auxiliary', reason: 'alcanzar-inf' },
    // haber de + infinitive (to have to do)
    // parar de + infinitive (to stop doing)
    { match: '[{haber/verb} de] #Infinitive', group: 0, tag: 'Auxiliary', reason: 'haber-de-inf' },
    { match: '[{parar/verb} de] #Infinitive', group: 0, tag: 'Auxiliary', reason: 'haber-de-inf' },
    // seguir + gerund (to keep on doing, to continue to do)
    { match: '[{seguir/verb}] #Gerund', group: 0, tag: 'Auxiliary', reason: 'seguir-gerund' },
    // be walking
    { match: '[{estar/verb}] #Gerund', group: 0, tag: 'Auxiliary', reason: 'estar-gerund' },
    // andar + present participle (to go about done)
    { match: '[{andar/verb}] #Verb', group: 0, tag: 'Auxiliary', reason: 'andar-verb' },
    // acabar (present tense) de + past participle (to have recently done)
    { match: '[{acabar/verb}] #Verb de', group: 0, tag: 'Auxiliary', reason: 'acabar-verb-de' },
    // echar a + infinitive (to begin doing)
    { match: '[{echar/verb}] #Infinitive', group: 0, tag: 'Auxiliary', reason: 'echar-inf' },
    // quedar en + infinitive (to arrange to do )
    { match: '[{quedar/verb} en] #Infinitive', group: 0, tag: 'Auxiliary', reason: 'quedar-en-inf' },

  ];

  let net = null;

  const postTagger$1 = function (view) {
    const { world } = view;
    const { methods } = world;
    // rebuild this only lazily
    net = net || methods.one.buildNet(matches, world);
    // perform these matches on a comma-seperated document
    let document = methods.two.quickSplit(view.document);
    let ptrs = document.map(terms => {
      let t = terms[0];
      return [t.index[0], t.index[1], t.index[1] + terms.length]
    });
    let m = view.update(ptrs);
    m.cache();
    m.sweep(net);
    view.uncache();
    // view.cache()
    return view
  };
  var postTagger$2 = postTagger$1;

  var postTagger = {
    compute: {
      postTagger: postTagger$2
    },
    hooks: ['postTagger']
  };

  const entity = ['Person', 'Place', 'Organization'];

  var nouns$1 = {
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

  var verbs$1 = {
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
      not: ['Copula', 'FutureTense'],
    },
    PastTense: {
      is: 'Verb',
      not: ['PresentTense', 'Gerund', 'FutureTense'],
    },
    FutureTense: {
      is: 'Verb',
      not: ['PresentTense', 'Gerund', 'PastTense'],
    },
    Copula: {
      is: 'Verb',
    },
    Negative: {
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
    // sometimes 'pretérito'
    Perfecto: {
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
    Condition: {
      not: ['Verb', 'Adjective', 'Noun', 'Value'],
    },
  };

  let tags = Object.assign({}, nouns$1, verbs$1, values, dates, misc);

  var tagset = {
    tags
  };

  const findNumbers = function (view) {
    let m = view.match('#Value+');
    //5-8
    m = m.splitAfter('#NumberRange');
    // june 5th 1999
    m = m.splitBefore('#Year');
    // 1993/44 y 1994/44
    m = m.splitAfter('#Fraction');
    // not 'y una'
    m = m.not('^y');
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
      [1000000000, 'billones', 'milmillonésima'],
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
  toNumber['una'] = 1;
  // sétimo / séptimo
  toNumber['séptimo'] = 7;
  toCardinal['séptimo'] = 'siete';

  const isNumber = /^[0-9,$.+-]+$/;

  let multiples$1 = {
    // ciento: 100,
    mil: 1000,
    millones: 1000000,
    millón: 1000000,
    billones: 1000000000,
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
      } else if (isNumber.test(w)) {
        w = w.replace(/[,$+-]/g, '');
        let num = Number(w) || 0;
        carry += num;
      } else ;
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
  // add extras
  toOrdinal.cien = 'centésimo';

  let ones = data.ones.reverse();
  let tens = data.tens.reverse();
  let hundreds = data.hundreds.reverse();

  let multiples = [
    [1000000000, 'billones', 'billones'],
    [1000000, 'millón', 'millones'],
    [1000, 'mil', 'mil'],
    // [100, 'cent'],
    [1, 'one', 'one'],
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
          let str = a[1];
          if (howmany > 1) {
            str = a[2];//use plural version
          }
          have.push({
            unit: str,
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
    // 'uno mil' -> 'mil'
    if (words.length > 1 && words[0] === 'uno') {
      words = words.slice(1);
    }
    // 'ciento mil' -> 'cien mil'
    if (words.length === 2 && words[0] === 'ciento') {
      if (words[1] === 'mil' || words[1] === 'millones') {
        words[0] = 'cien';
      }
    }
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
    // numeric formats
    if (fmt === 'Ordinal') {
      return String(parsed.num) + '°'
    }
    if (fmt === 'Cardinal') {
      return String(parsed.num)
    }
    return String(parsed.num || '')
  };
  var format = formatNumber;

  // return the nth elem of a doc
  const getNth$3 = (doc, n) => (typeof n === 'number' ? doc.eq(n) : doc);

  const api$6 = function (View) {
    /**   */
    class Numbers extends View {
      constructor(document, pointer, groups) {
        super(document, pointer, groups);
        this.viewType = 'Numbers';
      }
      parse(n) {
        return getNth$3(this, n).map(parse)
      }
      get(n) {
        return getNth$3(this, n).map(parse).map(o => o.num)
      }
      json(n) {
        let doc = getNth$3(this, n);
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
      m = getNth$3(m, n);
      return new Numbers(this.document, m.pointer)
    };
    // alias
    View.prototype.values = View.prototype.numbers;
  };
  var api$7 = api$6;

  var numbers = {
    api: api$7
  };

  const getNth$2 = (doc, n) => (typeof n === 'number' ? doc.eq(n) : doc);

  // get root form of adjective
  const getRoot$2 = function (m) {
    let str = m.text('normal');
    let isPlural = m.has('Plural');
    if (isPlural) {
      return transform.adjective.toSingular(str)
    }
    return str
  };


  const api$4 = function (View) {
    class Nouns extends View {
      constructor(document, pointer, groups) {
        super(document, pointer, groups);
        this.viewType = 'Nouns';
      }
      conjugate(n) {
        const methods = this.methods.two.transform.noun;
        return getNth$2(this, n).map(m => {
          let str = m.text();
          if (m.has('#PluralNoun')) {
            return {
              plural: str,
              singular: methods.toSingular(str)
            }
          }
          return {
            singular: str,
            plural: methods.toPlural(str)
          }
        }, [])
      }
      isPlural(n) {
        return getNth$2(this, n).if('#PluralNoun')
      }
      toPlural(n) {
        const methods = this.methods.two.transform.noun;
        getNth$2(this, n).if('#Singular').forEach(m => {
          let str = getRoot$2(m);
          let plural = methods.toPlural(str);
          return m.replaceWith(plural)
        });
        return this
      }
      toSingular(n) {
        const methods = this.methods.two.transform.noun;
        getNth$2(this, n).if('#Plural').forEach(m => {
          let str = getRoot$2(m);
          let singular = methods.toSingular(str);
          m.replaceWith(singular);
          // flip article, too
          let art = m.before('(los|las|unos|unas|mis|tus|nuestro|nuestra|vuestro|vuestra)$');
          if (art.found) {
            let toPlur = {
              los: 'el',
              las: 'la',
              unos: 'un',
              unas: 'una',
              mis: 'mi',
              tus: 'tu',
              // sus:'su',
              nuestro: 'nuestros',
              nuestra: 'nuestras',
              vuestro: 'vuestros',
              vuestra: 'vuestras',
            };
            let str = art.text('normal');
            if (toPlur.hasOwnProperty(str)) {
              art.replaceWith(toPlur[str]);
            }
          }
        });
        return this
      }
    }

    View.prototype.nouns = function (n) {
      let m = this.match('#Noun');
      m = getNth$2(m, n);
      return new Nouns(this.document, m.pointer)
    };
  };
  var api$5 = api$4;

  var nouns = {
    api: api$5,
  };

  const getNth$1 = (doc, n) => (typeof n === 'number' ? doc.eq(n) : doc);

  // get root form of adjective
  const getRoot$1 = function (m, methods) {
    let str = m.text('normal');
    let isPlural = m.has('#PluralAdjective');
    let isFemale = m.has('#FemaleAdjective');
    if (isPlural && isFemale) {
      return methods.fromFemalePlural(str)
    } else if (isFemale) {
      return methods.fromFemale(str)
    } else if (isPlural) {
      return methods.toSingular(str)
    }
    return str
  };

  const api$2 = function (View) {
    class Adjectives extends View {
      constructor(document, pointer, groups) {
        super(document, pointer, groups);
        this.viewType = 'Adjectives';
      }
      conjugate(n) {
        const methods = this.methods.two.transform.adjective;
        return getNth$1(this, n).map(m => {
          let str = getRoot$1(m, methods);
          return {
            male: str,
            female: methods.toFemale(str),
            plural: methods.toPlural(str),
            femalePlural: methods.toFemalePlural(str),
          }
        }, [])
      }
    }

    View.prototype.adjectives = function (n) {
      let m = this.match('#Adjective');
      m = getNth$1(m, n);
      return new Adjectives(this.document, m.pointer)
    };
  };
  var api$3 = api$2;

  var adjectives = {
    api: api$3,
  };

  const getNth = (doc, n) => (typeof n === 'number' ? doc.eq(n) : doc);

  // get root form of adjective
  const getRoot = function (m, methods) {
    m.compute('root');
    let str = m.text('root');
    return str
  };

  const api = function (View) {
    class Verbs extends View {
      constructor(document, pointer, groups) {
        super(document, pointer, groups);
        this.viewType = 'Verbs';
      }
      conjugate(n) {
        const methods = this.methods.two.transform.verb;
        const { toPresent, toPast, toFuture, toConditional, toGerund, toPerfecto } = methods;
        return getNth(this, n).map(m => {
          let str = getRoot(m);
          return {
            presentTense: toPresent(str),
            pastTense: toPast(str),
            futureTense: toFuture(str),
            conditional: toConditional(str),
            gerund: toGerund(str),
            perfecto: toPerfecto(str),
          }
        }, [])
      }
    }

    View.prototype.verbs = function (n) {
      let m = this.match('#Verb+');
      m = getNth(m, n);
      return new Verbs(this.document, m.pointer)
    };
  };
  var api$1 = api;

  var verbs = {
    api: api$1,
  };

  var version = '0.2.6';

  nlp$1.plugin(tokenizer);
  nlp$1.plugin(tagset);
  nlp$1.plugin(lexicon);
  nlp$1.plugin(preTagger);
  nlp$1.plugin(postTagger);
  nlp$1.plugin(nouns);
  nlp$1.plugin(adjectives);
  nlp$1.plugin(verbs);
  nlp$1.plugin(numbers);


  const es = function (txt, lex) {
    return nlp$1(txt, lex)
  };

  // copy constructor methods over
  Object.keys(nlp$1).forEach(k => {
    if (nlp$1.hasOwnProperty(k)) {
      es[k] = nlp$1[k];
    }
  });

  // this one is hidden
  Object.defineProperty(es, '_world', {
    value: nlp$1._world,
    writable: true,
  });

  /** log the decision-making to console */
  es.verbose = function (set) {
    let env = typeof process === 'undefined' ? self.env || {} : process.env; //use window, in browser
    env.DEBUG_TAGS = set === 'tagger' || set === true ? true : '';
    env.DEBUG_MATCH = set === 'match' || set === true ? true : '';
    env.DEBUG_CHUNKS = set === 'chunker' || set === true ? true : '';
    return this
  };

  es.version = version;

  return es;

}));
