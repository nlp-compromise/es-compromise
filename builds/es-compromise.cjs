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
      // must start at beginning
      if (ptrs.length === 0 || ptrs[0][0] !== 0) {
        return false
      }
      let wantTerms = 0;
      let haveTerms = 0;
      this.document.forEach(terms => wantTerms += terms.length);
      this.docs.forEach(terms => haveTerms += terms.length);
      return wantTerms === haveTerms
      // for (let i = 0; i < ptrs.length; i += 1) {
      //   let [n, start, end] = ptrs[i]
      //   // it's not the start
      //   if (n !== i || start !== 0) {
      //     return false
      //   }
      //   // it's too short
      //   if (document[n].length > end) {
      //     return false
      //   }
      // }
      // return true
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
      let document = this.document.slice(0);    //node 17: structuredClone(document);
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

  var version$1 = '14.11.1';

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
          m.toPast.ex[k] = conj[k].pastTense;
        }
        if (m.fromPast) {
          m.fromPast.ex[conj[k].pastTense] = k;
        }
      }
      if (conj[k].presentTense) {
        if (m.toPresent) {
          m.toPresent.ex[k] = conj[k].presentTense;
        }
        if (m.fromPresent) {
          m.fromPresent.ex[conj[k].presentTense] = k;
        }
      }
      if (conj[k].gerund) {
        if (m.toGerund) {
          m.toGerund.ex[k] = conj[k].gerund;
        }
        if (m.fromGerund) {
          m.fromGerund.ex[conj[k].gerund] = k;
        }
      }
      // adjective forms
      if (conj[k].comparative) {
        if (m.toComparative) {
          m.toComparative.ex[k] = conj[k].comparative;
        }
        if (m.fromComparative) {
          m.fromComparative.ex[conj[k].comparative] = k;
        }
      }
      if (conj[k].superlative) {
        if (m.toSuperlative) {
          m.toSuperlative.ex[k] = conj[k].superlative;
        }
        if (m.fromSuperlative) {
          m.fromSuperlative.ex[conj[k].superlative] = k;
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
  const isTitleCase = (str) => /^\p{Lu}[\p{Ll}'’]/u.test(str) || /^\p{Lu}$/u.test(str);
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
    if (start !== 0 || !isTitleCase(from.text)) {
      return
    }
    // titlecase new first term
    needle[0].text = toTitleCase(needle[0].text);
    // should we un-titlecase the old word?
    let old = home[start];
    if (old.tags.has('ProperNoun') || old.tags.has('Acronym')) {
      return
    }
    if (isTitleCase(old.text) && old.text.length > 1) {
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
  const expand$1 = function (m) {
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
        expand$1(view.update([ptr]).firstTerm());
        cleanPrepend(home, ptr, terms, document);
      } else {
        expand$1(view.update([ptr]).lastTerm());
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

  const titleCase$3 = function (str) {
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
    let terms = main.docs[0];
    let isPossessive = keep.possessives && terms[terms.length - 1].tags.has('Possessive');
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

    // keep "John's"
    if (isPossessive) {
      let tmp = main.docs[0];
      let term = tmp[tmp.length - 1];
      if (!term.tags.has('Possessive')) {
        term.text += '\'s';
        term.normal += '\'s';
        term.tags.add('Possessive');
      }
    }
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
      m.docs[0][0].text = titleCase$3(m.docs[0][0].text);
    }

    // try to keep some pre-post punctuation
    // if (m.terms().length === 1 && main.terms().length === 1) {
    //   console.log(original.docs)
    // }

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

  // aliases
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
    { word: 'arent', out: ['are', 'not'] },
    { word: 'alot', out: ['a', 'lot'] },
    { word: 'brb', out: ['be', 'right', 'back'] },
    { word: 'cannot', out: ['can', 'not'] },
    { word: 'dun', out: ['do', 'not'] },
    { word: "can't", out: ['can', 'not'] },
    { word: "shan't", out: ['should', 'not'] },
    { word: "won't", out: ['will', 'not'] },
    { word: "that's", out: ['that', 'is'] },
    { word: "what's", out: ['what', 'is'] },
    { word: "let's", out: ['let', 'us'] },
    // { word: "there's", out: ['there', 'is'] },
    { word: 'dunno', out: ['do', 'not', 'know'] },
    { word: 'gonna', out: ['going', 'to'] },
    { word: 'gotta', out: ['have', 'got', 'to'] }, //hmm
    { word: 'gimme', out: ['give', 'me'] },
    { word: 'outta', out: ['out', 'of'] },
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
    // shoulda, coulda
    { word: 'shoulda', out: ['should', 'have'] },
    { word: 'coulda', out: ['coulda', 'have'] },
    { word: 'woulda', out: ['woulda', 'have'] },
    { word: 'musta', out: ['must', 'have'] },

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

    // missing apostrophes
    { word: 'shouldnt', out: ['should', 'not'] },
    { word: 'couldnt', out: ['could', 'not'] },
    { word: 'wouldnt', out: ['would', 'not'] },
    { word: 'hasnt', out: ['has', 'not'] },
    { word: 'wasnt', out: ['was', 'not'] },
    { word: 'isnt', out: ['is', 'not'] },
    { word: 'cant', out: ['can', 'not'] },
    { word: 'dont', out: ['do', 'not'] },
    { word: 'wont', out: ['will', 'not'] },
    // apostrophe d
    { word: 'howd', out: ['how', 'did'] },
    { word: 'whatd', out: ['what', 'did'] },
    { word: 'whend', out: ['when', 'did'] },
    { word: 'whered', out: ['where', 'did'] },
  ];

  // number suffixes that are not units
  const t$1 = true;
  var numberSuffixes = {
    'st': t$1,
    'nd': t$1,
    'rd': t$1,
    'th': t$1,
    'am': t$1,
    'pm': t$1,
    'max': t$1,
    '°': t$1,
    's': t$1, // 1990s
    'e': t$1, // 18e - french/spanish ordinal
    'er': t$1, //french 1er
    'ère': t$1, //''
    'ème': t$1, //french 2ème
  };

  var model$5 = {
    one: {
      contractions: contractions$4,
      numberSuffixes
    }
  };

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
  const isFeminine = /(e|é|aison|sion|tion)$/;
  const isMasculine = /(age|isme|acle|ege|oire)$/;
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
    if (after && isFeminine.test(after) && !isMasculine.test(after)) {
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

  const numberUnit = function (terms, i, world) {
    const notUnit = world.model.one.numberSuffixes || {};
    let term = terms[i];
    let parts = term.text.match(numUnit);
    if (parts !== null) {
      // is it a recognized unit, like 'km'?
      let unit = parts[2].toLowerCase().trim();
      // don't split '3rd'
      if (notUnit.hasOwnProperty(unit)) {
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
      else if (before !== null && before === o.before && after && after.length > 2) {
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

  // there's is usually [there, is]
  // but can be 'there has' for 'there has (..) been'
  const thereHas = function (terms, i) {
    for (let k = i + 1; k < 5; k += 1) {
      if (!terms[k]) {
        break
      }
      if (terms[k].normal === 'been') {
        return ['there', 'has']
      }
    }
    return ['there', 'is']
  };

  //really easy ones
  const contractions$2 = view => {
    let { world, document } = view;
    const { model, methods } = world;
    let list = model.one.contractions || [];
    // let units = new Set(model.one.units || [])
    // each sentence
    document.forEach((terms, n) => {
      // loop through terms backwards
      for (let i = terms.length - 1; i >= 0; i -= 1) {
        let before = null;
        let after = null;
        if (byApostrophe.test(terms[i].normal) === true) {
          let res = terms[i].normal.split(byApostrophe);
          before = res[0];
          after = res[1];
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
        // 'there is' vs 'there has'
        if (before === 'there' && after === 's') {
          words = thereHas(terms, i);
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
            methods.one.setTag(words, 'NumberRange', world); //add custom tag
            // is it a time-range, like '5-9pm'
            if (words[2] && words[2].tags.has('Time')) {
              methods.one.setTag([words[0]], 'Time', world, null, 'time-range');
            }
            reTag(document[n], view, i, words.length);
          }
          continue
        }
        // split-apart '4km'
        words = numberUnit$1(terms, i, world);
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

  var freeze = {
    // lib: {
    //   freeze: function (obj) {
    //     this.world().model.two.freeze = obj
    //   },
    // },

    mutate: world => {
      // add @isFrozen method
      world.methods.one.termMethods.isFrozen = term => term.frozen === true;
    },

    api: function (View) {
      // set all terms to reject any desctructive tags
      View.prototype.freeze = function () {
        this.docs.forEach(ts => {
          ts.forEach(term => {
            term.frozen = true;
          });
        });
        return this
      };
      // reset all terms to allow  any desctructive tags
      View.prototype.unfreeze = function () {
        this.docs.forEach(ts => {
          ts.forEach(term => {
            delete term.frozen;
          });
        });
        return this
      };
      // return all frozen terms
      View.prototype.isFrozen = function () {
        return this.match('@isFrozen+')
      };
    },
  };

  // scan-ahead to match multiple-word terms - 'jack rabbit'
  const multiWord = function (terms, start_i, world) {
    const { model, methods } = world;
    const setTag = methods.one.setTag;
    const multi = model.one._multiCache || {};
    const { lexicon, frozenLex } = model.one || {};
    let t = terms[start_i];
    let word = t.machine || t.normal;

    // found a word to scan-ahead on
    if (multi[word] !== undefined && terms[start_i + 1]) {
      let end = start_i + multi[word] - 1;
      for (let i = end; i > start_i; i -= 1) {
        let words = terms.slice(start_i, i + 1);
        if (words.length <= 1) {
          return false
        }
        let str = words.map(term => term.machine || term.normal).join(' ');
        // lookup frozen lexicon
        if (frozenLex.hasOwnProperty(str) === true) {
          setTag(words, frozenLex[str], world, false, '1-frozen-multi-lexicon');
          words.forEach(term => (term.frozen = true));
          return true
        }
        // lookup regular lexicon
        if (lexicon.hasOwnProperty(str) === true) {
          let tag = lexicon[str];
          setTag(words, tag, world, false, '1-multi-lexicon');
          // special case for phrasal-verbs - 2nd word is a #Particle
          if (tag && tag.length === 2 && (tag[0] === 'PhrasalVerb' || tag[1] === 'PhrasalVerb')) {
            setTag([words[1]], 'Particle', world, false, '1-phrasal-particle');
          }
          return true
        }
      }
      return false
    }
    return null
  };
  var multiWord$1 = multiWord;

  const prefix$1 = /^(under|over|mis|re|un|dis|semi|pre|post)-?/;
  // anti|non|extra|inter|intra|over
  const allowPrefix = new Set(['Verb', 'Infinitive', 'PastTense', 'Gerund', 'PresentTense', 'Adjective', 'Participle']);

  // tag any words in our lexicon
  const checkLexicon = function (terms, i, world) {
    const { model, methods } = world;
    // const fastTag = methods.one.fastTag
    const setTag = methods.one.setTag;
    const { lexicon, frozenLex } = model.one;

    // basic lexicon lookup
    let t = terms[i];
    let word = t.machine || t.normal;
    // freeze lex
    if (frozenLex[word] !== undefined && frozenLex.hasOwnProperty(word)) {
      setTag([t], frozenLex[word], world, false, '1-freeze-lexicon');
      t.frozen = true;
      return true
    }
    // normal lexicon lookup
    if (lexicon[word] !== undefined && lexicon.hasOwnProperty(word)) {
      setTag([t], lexicon[word], world, false, '1-lexicon');
      return true
    }
    // lookup aliases in the lexicon
    if (t.alias) {
      let found = t.alias.find(str => lexicon.hasOwnProperty(str));
      if (found) {
        setTag([t], lexicon[found], world, false, '1-lexicon-alias');
        return true
      }
    }
    // prefixing for verbs/adjectives
    if (prefix$1.test(word) === true) {
      let stem = word.replace(prefix$1, '');
      if (lexicon.hasOwnProperty(stem) && stem.length > 3) {
        // only allow prefixes for verbs/adjectives
        if (allowPrefix.has(lexicon[stem])) {
          // console.log('->', word, stem, lexicon[stem])
          setTag([t], lexicon[stem], world, false, '1-lexicon-prefix');
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
    lexicon: lexicon$5,
  };

  // derive clever things from our lexicon key-value pairs
  const expand = function (words) {
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
        // prefer longer ones
        if (_multi[split[0]] === undefined || split.length > _multi[split[0]]) {
          _multi[split[0]] = split.length;
        }
      }
      lex[word] = lex[word] || tag;
    });
    // cleanup
    delete lex[''];
    delete lex[null];
    delete lex[' '];
    return { lex, _multi }
  };
  var expandLexicon = expand;

  var methods$g = {
    one: {
      expandLexicon,
    }
  };

  /** insert new words/phrases into the lexicon */
  const addWords$1 = function (words, isFrozen = false) {
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
    // these words go into a seperate lexicon
    if (isFrozen === true) {
      let { lex, _multi } = methods.one.expandLexicon(words, world);
      Object.assign(model.one._multiCache, _multi);
      Object.assign(model.one.frozenLex, lex);
      return
    }
    // add some words to our lexicon
    if (methods.two.expandLexicon) {
      // do fancy ./two version
      let { lex, _multi } = methods.two.expandLexicon(words, world);
      Object.assign(model.one.lexicon, lex);
      Object.assign(model.one._multiCache, _multi);
    }
    // do basic ./one version
    let { lex, _multi } = methods.one.expandLexicon(words, world);
    Object.assign(model.one.lexicon, lex);
    Object.assign(model.one._multiCache, _multi);
  };

  var lib$5 = { addWords: addWords$1 };

  const model$4 = {
    one: {
      lexicon: {}, //setup blank lexicon
      _multiCache: {},
      frozenLex: {}, //2nd lexicon
    },
  };

  var lexicon$4 = {
    model: model$4,
    methods: methods$g,
    compute: compute$3,
    lib: lib$5,
    hooks: ['lexicon'],
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
    // repair matches to favor [match, after]
    // - instead of [before, match]
    for (let i = 0; i < all.length; i += 1) {
      // move a before to a preceding after
      if (!all[i].after && all[i + 1] && all[i + 1].before) {
        // ensure it's from the same original sentence
        if (all[i].match && all[i].match[0] === all[i + 1].before[0]) {
          all[i].after = all[i + 1].before;
          delete all[i + 1].before;
        }
      }
    }

    let res = [];
    all.forEach(o => {
      res.push(o.passthrough);
      res.push(o.before);
      // a, [x, b]
      if (o.match && o.after) {
        res.push(combine(o.match, o.after));
      } else {
        // a, [x], b
        res.push(o.match);
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
  const titleCase$2 = str => str.charAt(0).toUpperCase() + str.substring(1);
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
      if (end(w) === '?') {
        obj.optional = true;
        w = stripEnd(w);
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

      //regex
      if (start(w) === '/' && end(w) === '/') {
        w = stripBoth(w);
        if (opts.caseSensitive) {
          obj.use = 'text';
        }
        obj.regex = new RegExp(w); //potential vuln - security/detect-non-literal-regexp
        return obj
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
        obj.chunk = titleCase$2(w);
        obj.greedy = true;
        return obj
      }
      if (start(w) === '%' && end(w) === '%') {
        w = stripBoth(w);
        obj.switch = w;
        return obj
      }
    }
    //do the actual token content
    if (start(w) === '#') {
      obj.tag = stripStart(w);
      obj.tag = titleCase$2(obj.tag);
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
      let str = term.root || term.implicit || term.machine || term.normal;
      return reg.fastOr.has(str) || reg.fastOr.has(term.text)
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

  const escapeXml = str => {
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
        out += t.pre || '';
        out += t.text || '';
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
    if (opts.keepEndPunct === false) {
      // don't remove ':)' etc
      if (!docs[0][0].tags.has('Emoticon')) {
        text = text.replace(trimStart, '');
      }
      // remove ending periods
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
      this.docs.forEach(terms => {
        let words = terms.map(t => t.text);
        words = words.filter(t => t);
        list = list.concat(words);
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
      // is it a full document?
      if (opts.keepSpace === undefined && !this.isFull()) {    // 
        opts.keepSpace = false;
      }
      if (opts.keepEndPunct === undefined && this.pointer) {
        let ptr = this.pointer[0];
        if (ptr && ptr[1]) {
          opts.keepEndPunct = false;
        } else {
          opts.keepEndPunct = true;
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
        hooks[str] = Array.isArray(hooks[str]) ? hooks[str] : [];
        hooks[str].push(obj);
      });
      // add wants
      obj.wants.forEach(str => {
        hooks[str] = Array.isArray(hooks[str]) ? hooks[str] : [];
        hooks[str].push(obj);
      });
    });
    // remove duplicates
    Object.keys(hooks).forEach(k => {
      let already = {};
      hooks[k] = hooks[k].filter(obj => {
        if (typeof already[obj.match] === 'boolean') {
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
        if (typeof already[m.match] === 'boolean') {
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
  const canBe$2 = function (terms, tag, model) {
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
  var canBe$3 = canBe$2;

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
        if (canBe$3(terms, todo.tag, model) === false) {
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
        if (todo.tag === 'Noun' && looksPlural) {
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
    // don't overwrite any tags, if term is frozen
    if (term.frozen === true) {
      isSafe = true;
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
    let word = terms
      .map(t => {
        return t.text || '[' + t.implicit + ']'
      })
      .join(' ');
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
      console.warn(`compromise: Invalid tag '${tag}'`); // eslint-disable-line
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
      // don't untag anything if term is frozen
      if (term.frozen === true) {
        continue
      }
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

  // quick check if this tag will require any untagging
  const canBe = function (term, tag, tagSet) {
    if (!tagSet.hasOwnProperty(tag)) {
      return true // everything can be an unknown tag
    }
    let not = tagSet[tag].not || [];
    for (let i = 0; i < not.length; i += 1) {
      if (term.tags.has(not[i])) {
        return false
      }
    }
    return true
  };
  var canBe$1 = canBe;

  const e=function(e){return e.children=e.children||[],e._cache=e._cache||{},e.props=e.props||{},e._cache.parents=e._cache.parents||[],e._cache.children=e._cache.children||[],e},t=/^ *(#|\/\/)/,n=function(t){let n=t.trim().split(/->/),r=[];n.forEach((t=>{r=r.concat(function(t){if(!(t=t.trim()))return null;if(/^\[/.test(t)&&/\]$/.test(t)){let n=(t=(t=t.replace(/^\[/,"")).replace(/\]$/,"")).split(/,/);return n=n.map((e=>e.trim())).filter((e=>e)),n=n.map((t=>e({id:t}))),n}return [e({id:t})]}(t));})),r=r.filter((e=>e));let i=r[0];for(let e=1;e<r.length;e+=1)i.children.push(r[e]),i=r[e];return r[0]},r=(e,t)=>{let n=[],r=[e];for(;r.length>0;){let e=r.pop();n.push(e),e.children&&e.children.forEach((n=>{t&&t(e,n),r.push(n);}));}return n},i=e=>"[object Array]"===Object.prototype.toString.call(e),c=e=>(e=e||"").trim(),s=function(c=[]){return "string"==typeof c?function(r){let i=r.split(/\r?\n/),c=[];i.forEach((e=>{if(!e.trim()||t.test(e))return;let r=(e=>{const t=/^( {2}|\t)/;let n=0;for(;t.test(e);)e=e.replace(t,""),n+=1;return n})(e);c.push({indent:r,node:n(e)});}));let s=function(e){let t={children:[]};return e.forEach(((n,r)=>{0===n.indent?t.children=t.children.concat(n.node):e[r-1]&&function(e,t){let n=e[t].indent;for(;t>=0;t-=1)if(e[t].indent<n)return e[t];return e[0]}(e,r).node.children.push(n.node);})),t}(c);return s=e(s),s}(c):i(c)?function(t){let n={};t.forEach((e=>{n[e.id]=e;}));let r=e({});return t.forEach((t=>{if((t=e(t)).parent)if(n.hasOwnProperty(t.parent)){let e=n[t.parent];delete t.parent,e.children.push(t);}else console.warn(`[Grad] - missing node '${t.parent}'`);else r.children.push(t);})),r}(c):(r(s=c).forEach(e),s);var s;},h=e=>"[31m"+e+"[0m",o=e=>"[2m"+e+"[0m",l=function(e,t){let n="-> ";t&&(n=o("→ "));let i="";return r(e).forEach(((e,r)=>{let c=e.id||"";if(t&&(c=h(c)),0===r&&!e.id)return;let s=e._cache.parents.length;i+="    ".repeat(s)+n+c+"\n";})),i},a=function(e){let t=r(e);t.forEach((e=>{delete(e=Object.assign({},e)).children;}));let n=t[0];return n&&!n.id&&0===Object.keys(n.props).length&&t.shift(),t},p={text:l,txt:l,array:a,flat:a},d=function(e,t){return "nested"===t||"json"===t?e:"debug"===t?(console.log(l(e,!0)),null):p.hasOwnProperty(t)?p[t](e):e},u=e=>{r(e,((e,t)=>{e.id&&(e._cache.parents=e._cache.parents||[],t._cache.parents=e._cache.parents.concat([e.id]));}));},f$3=(e,t)=>(Object.keys(t).forEach((n=>{if(t[n]instanceof Set){let r=e[n]||new Set;e[n]=new Set([...r,...t[n]]);}else {if((e=>e&&"object"==typeof e&&!Array.isArray(e))(t[n])){let r=e[n]||{};e[n]=Object.assign({},t[n],r);}else i(t[n])?e[n]=t[n].concat(e[n]||[]):void 0===e[n]&&(e[n]=t[n]);}})),e),j=/\//;let g$1 = class g{constructor(e={}){Object.defineProperty(this,"json",{enumerable:!1,value:e,writable:!0});}get children(){return this.json.children}get id(){return this.json.id}get found(){return this.json.id||this.json.children.length>0}props(e={}){let t=this.json.props||{};return "string"==typeof e&&(t[e]=!0),this.json.props=Object.assign(t,e),this}get(t){if(t=c(t),!j.test(t)){let e=this.json.children.find((e=>e.id===t));return new g(e)}let n=((e,t)=>{let n=(e=>"string"!=typeof e?e:(e=e.replace(/^\//,"")).split(/\//))(t=t||"");for(let t=0;t<n.length;t+=1){let r=e.children.find((e=>e.id===n[t]));if(!r)return null;e=r;}return e})(this.json,t)||e({});return new g(n)}add(t,n={}){if(i(t))return t.forEach((e=>this.add(c(e),n))),this;t=c(t);let r=e({id:t,props:n});return this.json.children.push(r),new g(r)}remove(e){return e=c(e),this.json.children=this.json.children.filter((t=>t.id!==e)),this}nodes(){return r(this.json).map((e=>(delete(e=Object.assign({},e)).children,e)))}cache(){return (e=>{let t=r(e,((e,t)=>{e.id&&(e._cache.parents=e._cache.parents||[],e._cache.children=e._cache.children||[],t._cache.parents=e._cache.parents.concat([e.id]));})),n={};t.forEach((e=>{e.id&&(n[e.id]=e);})),t.forEach((e=>{e._cache.parents.forEach((t=>{n.hasOwnProperty(t)&&n[t]._cache.children.push(e.id);}));})),e._cache.children=Object.keys(n);})(this.json),this}list(){return r(this.json)}fillDown(){var e;return e=this.json,r(e,((e,t)=>{t.props=f$3(t.props,e.props);})),this}depth(){u(this.json);let e=r(this.json),t=e.length>1?1:0;return e.forEach((e=>{if(0===e._cache.parents.length)return;let n=e._cache.parents.length+1;n>t&&(t=n);})),t}out(e){return u(this.json),d(this.json,e)}debug(){return u(this.json),d(this.json,"debug"),this}};const _=function(e){let t=s(e);return new g$1(t)};_.prototype.plugin=function(e){e(this);};

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
      addTags: addTags$2,
      canBe: canBe$1,
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
      let canBe = this.methods.one.canBe;
      let nope = [];
      this.document.forEach((terms, n) => {
        terms.forEach((term, i) => {
          if (!canBe(term, tag, tagSet)) {
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
  const initSplit = /([.!?\u203D\u2E18\u203C\u2047-\u2049\u3002]+\s)/g;
  // merge these back into prev sentence
  const splitsOnly = /^[.!?\u203D\u2E18\u203C\u2047-\u2049\u3002]+\s$/;
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

  /* eslint-disable regexp/no-dupe-characters-character-class */

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
  const openQuote = RegExp('[' + Object.keys(pairs).join('') + ']', 'g');
  const closeQuote = RegExp('[' + Object.values(pairs).join('') + ']', 'g');

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

  let notWord = [
    '.',
    '?',
    '!',
    ':',
    ';',
    '-',
    '–',
    '—',
    '--',
    '...',
    '(',
    ')',
    '[',
    ']',
    '"',
    "'",
    '`',
    '«',
    '»',
    '*',
    '•',
  ];
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
  const hasPeriod = /\. *$/;
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
    // check for 'Mr.' (and not mr?)
    if (abbrevs.hasOwnProperty(lastWord) === true && hasPeriod.test(str) === true) {
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
    e: 'ÈÉÊËèéêëĒēĔĕĖėĘęĚěƐȄȅȆȇȨȩɆɇΈΕΞΣέεξϵЀЁЕеѐёҼҽҾҿӖӗễ',
    f: 'ƑƒϜϝӺӻҒғſ',
    g: 'ĜĝĞğĠġĢģƓǤǥǦǧǴǵ',
    h: 'ĤĥĦħƕǶȞȟΉΗЂЊЋНнђћҢңҤҥҺһӉӊ',
    I: 'ÌÍÎÏ',
    i: 'ìíîïĨĩĪīĬĭĮįİıƖƗȈȉȊȋΊΐΪίιϊІЇіїi̇',
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
  nlp$1.extend(freeze); //
  nlp$1.extend(tokenize); //7kb
  nlp$1.plugin(cache$1); //~1kb
  nlp$1.extend(lookup); //7kb
  nlp$1.extend(typeahead); //1kb
  nlp$1.extend(lexicon$4); //1kb
  nlp$1.extend(sweep); //1kb

  // generated in ./lib/lexicon
  var lexData = {
    "Conjunction": "true¦aunq5c4e2m1ni,o,p0q5sino,u,y;ero,orq4u2;as,ientras;!ntonc0;es;omo,uando;ue",
    "Determiner": "true¦a8c7e4lAmuchAning2otrDpocAsuEt1un0variB;!aDos;ant8odB;un0ún;a,o;l,s0;a8e,os,t0;a7e,os;ada,ualquier;lg3mb2quel0;!l0;a3os;as,os;un0ún;a0o0;!s",
    "Preposition": "true¦aGcBd8e5f3ha2junEmedi9p1s0tras;egún,in,ob6;aBor;cia,sta;rente 0uerB;a,de;n0xcepto;!cim8t0;re;e1ur0;ante;! acuerdo con,baj8lante Antr8sA;erc3on0;! respec1t0;ra;to a;a 5;! pesa3demás 4l1nte0;!s 3; lad0rededo1;o 1;r 0;de",
    "Pronoun": "true¦cuEdonde,eBleDm9n4quien,s3t2ustedFv1yo,é0;l,ste;oso5u3;e,i,uy9ú;e,uy8í;os1u0;estr6;!o0;tr0;as,os;e,í0;!a2o2;ll0sto;a0o0;!s;al0yo;!es",
    "Adverb": "true¦0:1N;1:1O;a12b10c0Pd0Me0Ef0Bg09h08i05jam1Ml01mXnVoTpFquizáErBs7t2usu0ya,ún11;a3o2radicTíp10;davía,t0;m3n2rde;!to;bién,pL;egu0Ti3ola1u2óI;ce09fic00pues0R;empre,gnifica1Bm2quie19;p0Nultánea1;a0Pe2ápi0W;al1ci2la18spec18;e0Vén;!s;arDerf09o5r2u0Lúbl0N;e3incip0o2áct0M;b0Ffun0Qgre00p0X;cisa1v0W;co7pAr 3s2;ib0Dter0T;e3lo 2supues07;menJt05;jemp2l contrario,ntonces;lo;! a p2;oco;ci0tic2;ular1;cas2fiSrigin0;ion0;atur0eces6o2ue0Q;rm0t00;a3en8u2ás;cho,y;l,yorit2;ar0E;e3i2oc0uego;geYt9;j2nW;os;gu0n2;cluso,depend2iFmediaT;ie01;abi0GistórUoy;en2radu0;er0;in0orm0recueXu2ácil1;er2ndament0;a,te1;conómOn 8s4ven0Ax2;acKclu2treR;si05;en4pec3tr2;echa1icH;i0ífJ;ci0;consecuencia,gran medida,línea;e3ir2;ecC;finiWla03masia05ntro,spués;asi,erca,laBo4u2;an2;to;m6n2;cre6jun6s2tinI;ider2taE;ab2;le1;ple2ún1;ta1;ra1;astaRien,ás2;ica1; Qbajo,cMdHhFlDmplCn7p3quí,rriba,s2trLun,yer,ún;imismo,í;are4enas,roxi2;ma2;da1;nte1;oche,t2u0;e3ig2;ua1;r2s;ior1;ia1;go,l2ta1;á,í;o2í;ra;e4ministra2;ti2;va1;la6m2;ás;tu0;al1;me2;nte;bor2la vez;do",
    "Ordinal": "true¦cWdLmilJnoIoctHpGquinEs8t2unNvigésimo0;! 0;cuSpEs5teN;eMr0;esUi0;ceXgésimo0;! 0;p9s0;eg5;e1é0;ptUtU;g2pt1x0;agRceQto;iOu2;undo;cu0geNto;agN;rim9;aDingLogL;nHv9;lonésim0ésK;a,o;ecimo2osCu0écI;ceFo0;décG;c4nov3quinAs2te0;rc0;ero;ex7éptC;eno;ta1u0;ar4;vo;e5ua0;dr2r1tro0;mil4;to;ag2i0;nge0;nt0;és0;imo",
    "Cardinal": "true¦billoXcMdEmilCnAo8quin7s5tre4u3veint0;e,i0;c0dós,nuJoIsGtrés,u1;inco,uatS;no;ce,inOsJ;e0iD;isHsLte4;ce,iH;ch0nN;enJoE;ove0uA;ciDnH;!l0;oJón;ie1o0;ce,s8;ci0z;nu3o2s0;i0éis;ete;cho;eve;ator9e8i3ua0;r4tro0;!ci0;entos;en3nc0;o,u0;en0;ta;!to;ro;ce;nes",
    "Unit": "true¦bHceFeDfahrenheitIgBhertz,jouleIk8liGm6p4terEy2z1°0µs;c,f,n;b,e1;b,o0;ttA;e0ouceD;rcent,t8;eg7il0³,è9;eAlili8;elvin9ilo1m0;!/h,s;!b6gr1mètre,s;ig2r0;amme5;b,x0;ab2;lsius,ntimè0;tre1;yte0;!s",
    "Month": "true¦a6dic4en3febr3ju1ma0nov4octu5sept4;rzo,yo;l0n0;io;ero;iem0;bre;bril,gosto",
    "WeekDay": "true¦domingo,juev1lun1m0sábado,viern1;art0iércol0;es",
    "Copula": "true¦eAfu5s0érE;e2i1o0;is,mPn,y;do,endo;a0d,rJáis;!mMn,s;e1i0ér8;!mKsC;!r0;a0on;is,n,s;rHs0;!t0;a9emEoy,uv2á0éG;!b0is,n,s;amC;e,i0o;e3mAs2é0;r0sem9;am8em8;te5;r0se8;a7e7on;ba6do,m4r0;em3á2é1ía0;!is,m2n,s;!is;!n,s;os;a0es;!is,n,s",
    "Auxiliary": "true¦h0;a3e2ub0;e,i0o;eron,mAste8;!m9;!b2n,s,y0;a0á2;!m6n,s;er,r1é0ía2;is;em3á2é1ía0;!is,m2n,s;!is;!n,s;os",
    "Modal": "true¦deb9p5qu3s0;ab0ol3uel5é;e0é8;!mBn,s;er0ier2;em9é5;od2ued0;e0o;!n,s;em5r3é1;e1o,é0;is;!m2n,r0s;ía0;!is,m0n,s;os",
    "Infinitive": "true¦0:WU;1:WM;2:WR;3:VM;4:WQ;5:VP;6:WO;7:WT;8:VO;9:RO;A:P2;B:WA;C:W4;D:O7;E:V6;F:TM;G:RT;H:KB;aR5bQ8cM2dI5eE8fDHgD7hCUiAYjAUlAAm9An91o8Dp5Wqu5Tr2Xs0Zt07u00vKxiPAyK2zI;aIel0oPW;ng0rp0;aReOiKoIulnC;ar,lImitG0t0;ar,c0t9Hv2;aj0br0gKnJol0rFYsIvD;ar,it0lumW3uH;cVSg0;iF5or0;lMDnJrIst1t0;!if6t2;c2d2er0g0ir,tU1;cLgKlJpPErIscuUHz0;i0r2;er,id0orNM;ar,ue0;iIun0;ar,l0n0;b6iv0ltNnKr9sItOM;ar,uI;fru1rp0;g1iIt0;fIr;ic0orm3;im0rapaRV;a08e01i00oXrJuI;mb0tT0;aLeKiJoI;c0peTVç0;bJAcPVlh0pl6tGunf0;in0m2p0;baQduN2er,f6g0iPmOnJpace0sIt0v0z6Kç0;ceSDlRPm7Rpas0;c0quO7sI;ar,boHXcKfJit0m7PpI;ir0orND;er1oKM;eS8r5XuMY;ar,it0;ci7r;j0lh0r;c0lCm0nArJsI;er,s1;c2n0tG;ng1pAr0tUR;cNj2lefon8CmMnLrKstIñ1;ar,emuL8iI;f6moni0;!m9;d2er,s0t0;bl0er,pC;er,le0;garSAll0p0rd0tu0ñ2;a15e0Wi0Qo08uI;a06b00cZd0fXgWicidTTjVmTpOrNsItG;cLpJsuTLtIuTL;eU7iLS;eIir0;it0nd2;it0r4Q;g1preeRLt0;erLlJoMMriI;m1r;eR2iI;c0r;ar,visAL;ar,erg1iI;nTQr;ar,e1R;ar,er1;oc0rI;ag0ir;ed2umb1;contIUestR1ir,jug0liKHmeMorLrQsJtra1veI;nLSrt2;an0cr4ViItiL9;di0st1;d9n0;rg1t2;r,v3;ar,breVcTfSlOmNnMpLrKsIñ0;lIpeIWsNMten2;ay0;preQYr1te0;es0l0oIOr0;ar,d0h0reír;ar,et2;d0eKiJloz0t0uIve5;ci7ç0;c8dA;r,tr0;oc0r2;aIiHo69;r,v0;car2QlKYpKsJvI;ivDo0;al1sa1;as0or;gnAlMmKnItu0;al3crABtI;et3on3;b6QpIul0;at3lA;b0enB;cPdOguNlMm67nKpJqu5MrIñTR;!r0v1;ar0uG6;sibM5tI;arTAir;ar,ecLSl0;ir,r0;i0uKU;ar,u5E;bPcOir,lLnKqNIr0tiIud0;r3sfaI;c2z2;ar,ci7e0gr0tA;d0iJt0ud0vaI;guaFLr;e5r;ar,i0rAud1;er,oI;re0t67;a28eMiLoJuI;g1ir;b0ci0d64er,g0l0mp2nIsn0tSIub0;c0r7;diculALm0r,sc0vH;a1Wb1Tc1Ed1Ae17f11g0Vh0Ti0Rj0Ql0Nm0Jn0Ior0Hp08qu07sVtQuPvIz0ír,ñ1;alu0eLiKoI;c0g0lI;uK7v2;d0gFr0sT1tHvD;l0nJrIst1;!tD;d2t0;n1tLC;aLeEViKoJrI;a9RiNRoced2;c0m0rn0;f6rQP;li0rd0;aF6cSe50fPTgRiQmuLBoGApNsMtJuI;c8lt0m1rg1;aIiJCr7V;bIr,ur0;el4l4;aF1o0usc8;ald0eJir0land4onI;d2sabKZ;it0t0;d1st1;at0uaEN;at0iJG;erDis8;aOeNlMoLrIuHU;eJim1oI;duJKgrDEv0;eOVse5;n2rJXs0us0;anKWic0;lDns0rcut1t1;rIsPO;ar,t1;g40ie5;a9AdDeg0ov0unB;arKeJit1oI;dP3nt0v2;di0nd0t2;!c0;aJeIlPQ;mRIr;ci7j0nz0t0x0;e8uvenesc2;nItCvind6;ar,iBteINve5;aIus0;b2Ec2;aMeLiKlaNVozij0reJularI;!iz0;d1sP6;r,stPL;nCr;l0r,te0;az2er1inaMleLorKrIut0;eIigC;ar,sc0;mA3z0ç0;ct1j0t1xi7;nBr;mJnconEsIxam9;crF9tru9S;bo92plQJ;aIIeKiJoIuIK;bCVnL4;g1m1rig1;fin1scubr1;aUeThQEiSlRoKrJtAuI;ar,pCrr1s0;e0i0ut0;br0g2lh2mMnJpOSrI;d0r2t0;cLRh4oc2sI;idCtI;iHOru1;eIpens0;nd0ç0;am0ut0;b1cl0t0;ar,b2it0;b0er,lc0pitQ5rIud0;g0rK0;aJe5oI;b9c0l0t0;ix0j0s0;bNcMfiFNg1juPFlLnKpJsi08tEYvI;er,iv0;ar4reN8;im0ud0;iz0z0ç0;ci7eN5tMR;ast4il8r1;biKMcKng2pQJsItAz7;g0p0tI;ej0re0;h0ioI;c9naPR;aJeIit0;braPFdO9im0jOZm0r2sFY;lAntA;a1Pe18i15l12o0RrLuIôr;bl6dr1lJn1rIx0;g0if6;ar,s0vJG;a0Me06i03oI;b0cZduHEfXgrVhUib1jAZloIQmSnRpNrrJ8sMteLvIyeHC;ar,eJiIoc0;d8Br;er,r;g2l0st0;eBVpCseBV;ag0iBoJuI;gn0;n2rI;!ci7;oCFunB;et2oIuBJ;ci7v2;ib1;am0eI;d1s0;an0eIund3;r1sN6t3;eJlAQrIur0;e0i0;d2sN3;ncipi0vI;aIileAP;r,t3;cVdTench2fOLgSj0NmiJPnd2ocupNEpP9sKteM2vI;al4eI;n1r;cNeKiJsIt0um1;ent1i7uEJ;d1on0;nIrv0;ci0tI;ar,e0ir;iG9rI;ev2;ar,u5;ec1iI;c0z2;av2ed2iI;p8s0;ct6guIXt6z2;bl0dRlPnOrt0sJt78uI;p0s0;ar,e2iKpCYsJtI;ar,eMXul0;ibJu1;bIci7;il8;dCer,tu0;iIu1;ci0r;ar,er;aIeg0;c2nIsm0t6;ar,ch0eZif6t1K;c0lJnDGor0r0sI;ar,c0;h0l0ot0;c0dXg0iWlUnTrJsI;ar,c0qu4AtanIE;cQdPec2fOgu5jNmMpe9SsKtIvert2;enIu6J;c2ec2;eIiGLonHuIV;gu1vC;an4it1;ud6;ecFGil0or0ur0;er,oLWur0;eb2ib1o0D;al3dGeEhFs0te0;ar,eIlizc0;ar,j0;d0n0;al0ir;cAdPg0ir0li0rMsLtI;eJin0rI;oc9uM5;ar,nGN;ar,e0m0s0Vt0;aJec2ir,paHRtiI;cKWlh0r;ben3fra1DliL1r;ec2r48;bZcWdi0fUlTmSpQrMsKtJuIír;s0v1;im3oLR;cIte5;il0ur4;ar,denMQgKiJquI;esE;e5g9;an3;er0in0o9KrC6tI;ar,im3;it1;er,h0vidLE;eIr4uHK;nd2r4;a9PoJuI;lt0p0rr1;rr2;ed4j85l21rMsIte9Bvi0;cKUeKtI;aIru1;cul3r;rv0;ar,ig0;aOeLivK7oIutr1;mJrmHtI;ar,if6;br0e0;cesJgIutrHv0;ar,lig58oB;it0s8;cId0mFrr0sc2vG5;er,i1W;a07e00iXoLuI;d0ltJrItKJ;ch0mG;ar,ipl6;bF8dQer,j0lOnLrKsEtIZvI;erMDiI;l3me5;ar,d2ir,r2;itorE0oIt0;!pI;ol3;dIe9Lh0;ar,e0;eIif6ul0;l0rI;ar,n3;gr0j0l8m0nIr0stGt16;ar,iIor0;m3sE;diNjFlhFmFFnLrJsIt2x2zI;cl0;eIguKG;c2nd0;ci7d0ZosIt1;cab0pre97;ar,r,t0;chuc0dGgo0lQm0nNquiF1rMsJtIxim3;ar,eriHrHT;c5IsaJtiI;c0g0;cr0ge0;cL3ginHtJ3;cL2d0ej0iJoLLte80uI;se0;feKOoLJpL9;dG0gaKNh0tA4vers0;aYeTiOlLoKuI;brAcIt0;h0ir,r0;cHgr0uv0;am0eJoI;r0v2;g0n0v0;bKc3XdJg0mIqu82st0vr0x0;it0p41;ar,er0i0;erIr0;aKYt0;ci7er,gKilo0mL5r,s0vI;aIit0;ntJFr;al3iI;sl0tHU;dr0mJnIrg0stHTt1vJD;ch0z0ç0;b2eKG;aKeju0oJuI;g0lg0nt0r0stAzg0;g0rr0;l0nt0rd9;d1Bg1Alu19m0VnLrJsIz0ç0;e5ol0;!rI;aAMi9ZuS;a0Qc0Id0Ff0Ag09i08j5YmiBYnov0ov0qJXsZtMuHLvI;aKeJit0oI;c0lucr0;j0nt0rtDstiL9;d1l7D;eIimBProduC8;gr0nSrI;aQcOesIFfK1lNn0pMrJvI;en1ir;oJuI;mp1;g0mp2;on2r5M;ig0;ambi0eI;d2pt0;c5Zg1;sAt0;cr8IerPiOpNtIu72;aLiIru1;g0tuI;ciIir;onH;l0r,ur0;ecCLir0;nu0st1;ir,t0;b1cC9;er1rFB;eLilElJo99rIuBC;ing1;aIig1u6Q;m0r;ct0r1;ag0eJiIuBF;c2IviduH;fJ8mn3x0;apac8enOh0iNlMoKrJuI;b0lc0mpl1t1;eG6im9;ar,mod0rI;pFr2;in0u1;d1nCt0;di0tG3;l0ugG;ag9iUpI;aSed1lQoNrKuI;gn0lsIt0;ar,i7;esJim1ovI;is0;i7si7;n2rI;!tI;ar,un0;a5eFPic0oI;d1r0;ct0rt1;gr0t0;d1m9sE;nFuJE;eIolaE;ar,ntA;aPeNiLoKuI;ir,mInd1sBY;an3ilCZ;menC0nr0sped0;bWd7FpI;not3otec0;l0rIs8;d0ed0ir,v1;bJc2ll0rmIv2;on3;iIl0;l8tI;ar,u0;aQeOir0lorAoMrKuI;a55erre0iIst0;ar,n7E;aIeH1it0uñ1;b0du0m1Bn3v0;bIl1Ast0te0vIz0;ern0;l0mDneBPrIs8E;ar,enBir,m9;b0guCMnHSrantiCXst0te0;a04e02iYlToOrLuI;g1m0nIrIPsi7zGC;ci7dI;a86ir;acasG3eJiIot0usE;s0t0;ar,g0n0que5ír;cHf1Vlhe0me5rIt88;j0mKnJtIz0ç0;al4if6;ec2ic0;aGTul0;eLorJuI;c3Nir,tu0;eIir;c2sc2;rt0xi7;c0gGj0lKnIrm0scHx0;aIg1;l3nB;m0tr0;ch0d2lic8rIstC0;ir,me5r0tAJv2;br6cKlJmiliIntaF7rBYsc9tGvor4z2;ar3;ar,ec2h0ir,l0sAEt0;il8tGu4F;c3Cd3Afe38je36l32m2Mn1Equi1Ar18s08tiqu2Sv02xI;aZcYeXhWiVoTpMtIum0;eKiJorqu1raI;d8er,ir,p5Hñ0;n3Prp0;nd2rm9;a8TeMiFQlKo9FrJuI;ls0;esF8im1;ic0oI;d1r0t0;d1l1riI;enBme5;nCrI;c3t0;b1g1m1st1;ib1o5Uum0;c4WmplArc2Q;av0ed2it0lu1;ceIgClt0m9;rb0;aMiKoI;c0luI;ci7ir;dIt0;enB;cu0d1lu0pF;b0Gc0Af08gB7m07p01quYtIvazi0;aUeTiRoQrKuI;dIpr0;ar,i0;aLeKoJuI;ctGtG;pe0;ar,ch0it0l0m4n0;g0nI;gG9h0;c0rnBFur0;c0mIpG7r0;ar,ul0;nd2r9A;bJci7f0lInc0r;ar,l0;el4il3l4;eJiI;ar,v0;c2nt0;aMeKiJreI;it0m2;ar,on0rr0;cIlh0r0t0;if6ul0;lh0nGCrc1;ag0uEX;aqAFol0rI;eg0i0;aMlar4oKrJuI;ch0lp1r4t0;av3ev2ib1;g2lInd2rreGJv0;h2t0;l0p0v0;aEOoE7;gu2ig1raI;d6r;liFQpJvI;oc0;arI;!ar;amFc0Gd0Ff08g01juiBl00mYoj0qua05rXsVtNuMvJxI;aCVeE0ug0;eJiIo3J;ar,d0;j4lh4nDPrgo5R;mCnB;abOeNoLrIusiasm0;aJeI;g0n0te1TviEJ;r,v0ñ0;ar,rI;n0p4;nd2rr0;l0ul0;aIeñ0in0uB;i0mbl0y0;a3iVol0;aIeC1;rc0scFB;az0ouS;aMenLlob0oKrI;aIos0;n0v1Sx0;l1rd0;dr0;j0nIrA5sg0t0ñ0;ar,ch0;aNeLi0laKoJrIur4;aJe5i0;c0rc0;qu4;it0rI;m0r1N;d0t3;ereD2ire8oAYur4;aOeMh2oKriEAuI;br1rI;rEZt0;br1lh2mInEr2Nst0;eBFi0;nIrCVt0;ar,d2;bez0ix0j0mDWnt0rIuz0;ar,g0n0r81;agr4bQePiOpIul0;aLeKiCXle0reJuI;j0nh0rr0;eBBg0nd2st0;nh0or0z0;c8OquIr8Kt0;et0;gr0t1;nd0rgD;aLeIorra31ruCP;beJlI;ez0l4;d0r;lIr29;ar,sI;am0;abFeKim9oJuI;c0Pd1;gi0;gDv0;c1OrcIt0;er,it0;cItu0;tu0;iIuc0;f6t0;h0lo0EoI;ar,nom3;a3Be0MiNoKrJuI;ch0d0pl6r0v0D;en0og0;ar,bJcuA3er,l2mIn0rm1t0;ar,e0Hin0;l0r0;a0Eb0Dct0f0Ag09lu07m04nam3ri03sMt0vJzI;er,im0;erJid1orBuI;lg0;g1sAt1;cVeñ0fTguCGiSminu1o1ApPsMtIu87;inKorJrI;aDi8L;c2si7;gu1;eJiNoIu82;ci0lv2;c0m9;ar0eJoIut0;n2r;ns0rs0;mCQp0;arç0rI;az0ut0;ar,ern1ipl9oJrim9uI;lp0rs0t1;rd0;g1m1;enJiI;nu1t1;si7;cIir;id0;er1itaCG;am0erJicuIu43;lt0;enBir;uj0;gnoIl61;st6;ambC7b25c1Yd1Xf1Tg1Si1Rj0l1Om1Mn1Kp1Hr1FsNtKvI;aBLer,oI;lv2r0;al6IeIon0;ct0n2rIst0;!iFm9;a0Yb0Wc0KdoCBe06f04h03i01lZmVn78oUpOrespe8tKvI;al5ReIi0;l0nd0;ac0iKrI;aIoz0u1;nc0v0;l0n0tu1;a10eKiJlBQreI;ci0z0;r,st0;d1g0j0nd2rI;diIt0;ci0ç0;bed4cup0nr0v0;aKeJoI;nt0r7;mBVnt1;i0nt9Brc0scC1;iIoc0umBT;g0z0;gn0lud1mped1nIst1;stC4te2Z;ac2;az2il0rI;ut0;ar,ch0j0mQnKrt0sI;pCtI;ab4Fim0;cLh0mascBQrKtJvoI;lv2;eACrañ0;ol0;ade9HorI;aj0;bJpI;ac5ReBI;arJoIru9V;c0ls0;aç0c0;aReOifr0oKrJuI;br1id0lp0;ev2ib1;br1l0mpKnI;e2Qfi0g8Loc2sidCtI;ar,ra1;on2;nIr;d2trH;al3;ns0rIsc0;g0r4Jt0;aIloq5A;rat0;bPcOfi0grad9NlNma9PnMpKrJtIyun0;ar,iv0;m0ro42;ar4eIo5roveN;rt0;im0uBD;e5oj0;elCred8t79;aJoto0roI;ch0;f0r;iv0og0rI;am0etDib0oARub0;ar0e7Hil0oJrIur0;im1;r2Is8;egIom9unB;ar,r1;a78it1oI;cr5IlDnsEr0sE;at0eJiI;bCm8ne0;g0t0;t0x0;r6Iu9B;eKinJoIra52;rm0;h0ir;c0nd2;ic0u1P;ap8ep1LiNlMoJreI;sc2t0;dAl0mJrI;ar,r2;por;ar0in0;dir9Vfr0r;atDer,il8;nJr,tIñ0;ar,ilW;if6ç0;a32e2Wh2Li2Jl2FoWrRuI;antAbr1esPid0lOmpMrLsI;p1tI;ar,e0oI;di0;ar,s0t1v0;liIriI;me5r;m9p0t63;ti7;eLiJonomeEuI;cAz0;ar,ptIt6;og4K;ar,c2er,m0r,sc2;ag1Zbr1Yc1XdAexi1Wg2incid1l1Pm15nToRpi0rMsKt3Lxe0zIç0;er,iI;nh0;eIt2X;ch0r;ar,o0rJtI;ar,ej0;eJig1oI;bFer,mp2;g1la0Mr,spo61;pCrdI;en0in0;c0Nd0Le0Kf0Dg0Bh4ju0Al09m08oc2qui83sXtNvI;eJiIoc0;d0vD;nJrI;g1s0tD;c2ir;aQePinu0orOrI;aIi43ol0;-aLaLbaKdJer,ir,rIst0t0;i0re7U;ec1iz2;la3Hn2W;tac0;c2n0;mpl0n2r,st0;b1Ect0m9r,t0;aRePiOolNp4EtJuI;lt0m15;aKiJrI;ang2u1;tu1;r,t0;ar,id0;dCgn0st1;gu1nt1rI;t0v0;gr0;emFov2;lev0;g0r0;el0rI;at7Teg0;eMiLorKrJuI;nd1;atern3o5;m0t0;ar,gGn0rm0sc0;cIr1s5U;ci7;ct0;en0iz2uI;c1z1;eMiLlu1orKretJuI;rr1;ar,iz0;d0r2;enBli0;bDd2nErt0;a4IbZeVpKuI;nIt0;g0ic0;aQePil0lNoLrIut0;ar,eJim1oI;b0met2v0;e4Gnd2;n2rI;!t0;ac2eIic0;me5t0;ns0t1;g9rI;ar,ec2ti2O;mFnKrIt2ç0;!cI;ia6Y;t0z0;atDin0;er,ir;aNeLg0h2iKm0oI;c0n3rI;e0ir;d1g1;cIt0;ci7i7;bFps0r;st1;er,in0;ar,ir;ir,ul0;aIic0;m0rJsIusG;if6sA;e0if6;catr3fr0me5rc6Dt0vI;il3;aQePiMoJuI;mb0p0t0;c0raIv2;miIr;ng0;ar,coJsI;me0;te0;c0fi0g0ir0;m0ntIrl0sq0Qte0;age0;d2g0if0le6AnLpiKrIs47;c0r0tA;if6;ll0;ar,sGtI;ra5X;b2d01er,g0ir,lZmYnWpTrPsNtKuJvaIz0ç0;lg0r;s0tQ;alJegI;or3;og0;ar5ZtI;ig0r0;actKec2g0iJrI;eg0;mb0;er3;ac8itJtI;ar,ur0;al3ul0;al3c36je0s0tarI;!ol0;bi0in54ufl0;ar,c5Ce5iIl0m0ç0;br0f6;asEuc0;a03eZisbilhYlVoOrJuI;ce0rl0sc0z9;anqViJoI;nze0t0;g0lJnI;c0d0;h0l0;cNiMmbKrIt0;d0rI;ar,if0;arIe0;de0;ar,cM;ej0;aIef0oqJ;nqIsf3E;ue0;ot0;b2ij0liKnIrr0s0;dIefiB;ec1;sc0;b0guRiQj0lOnNrMsLtIut3ñ0;a3GeJiI;r,z0;ar,r;ar,e0t0;a3Cbe0r2;c0h0ir;anIbuB;ce0ç0;l0x0;nç0;b54c4Ad3Sf3Ig39ho37isl0j34l2Mm28n1Xp19qu4r0Os0AtVuPvKyJñI;ad1;ud0;aLeJiI;s4Yv0;ntGrI;gonz0i1Q;li0n2T;d8me5n0tJxI;ili0;ent6oI;gJmIr3;at3;raf0;aVeQiPorOrJuI;a3Zr0;aJiIop1N;bu1;c0er,ir,paJs0vI;es20;lh0r;do0me5;ng1r0v0ç0;nLrrJstI;ar,i18;ar,iIor3;ss0z0;d2u0;c0j0r;aUce0TeRfixi0iQoBpPsIuJ;aMeLiKoJuI;m1st0;ar,bi0ci0m3Q;m1Sna0Fst1;di0gGnt0;lt0r,ss9;in0;ir0;gn0m1Nst1;gGnt0sI;in0or0;ur0;lt0r;ar,biEc00d2ej0gYmWqu01rJtIvF;ic34;aReLiKoJuI;in0m0;j0mb0t0;esg0sc0;bMcLdo05f4gKmInd0st0;at0eI;ss0;aç0l0;ad0;at0e5;nJsI;ar,t1F;c0h0j0;aIon3;r,z16;uIü1;me5;ar,hI;iv0;a02e00iZlXoVrLuI;nIr0;h36taI;l0r;eOiNoI;b0fuLnt0vJxI;im0;ar,eI;ch0it0;nd0;mFsi7;ci0eJnd2sIt0;e5s0ur0;nd2;dr4i0nt0rt0sIy0;e5t0;aIic0;c0st0ud1z0;l0me5t0;l0rIt4;fei34t0;ciJg0lp0nh0rIziJ;ar,ec2t0;gu0;aliRcFd0ePgaOhNiMot0si0tJuI;l0nB;eIicJ;cIv2;ip0;m0qu04;el0;ri0;steIx0;si0;s0z0;aRePinFoKpIu0;liIut0;ar,f6;l4rI;daç0tI;ec2iI;gu0z0;or0;aç0dro5nI;az0iz0;ci0dKldi2Fme5n4rJsI;ar,s0;!r0;ur4;aXbeWcanVeSgRiPlan0mMoLquKterJu08vIz0;ej0or4;ar,n0;il0;c0j0ng0;acJoI;rz0ç0;en0;ar,en0gCme5nIs1Pvi0;e0h0;em0;gJij0jInt0rt0;ar16;ar,r0;z0ç0;rg0;b0rIsEvanc0;g0m0;e8oeJuI;d0st0;lh0;g0nd0rI;c0r0;aPiOor0rKuI;aIe5;nt0rd0;aJeIup0;d1g0;dInd0v0;ar,ec2;l3r,t0;rr0;aQePiLlKog0roJuI;ge5nd0;nt0ux0;ig1oj0u1;aKlIn0rm0x0;ar,iI;arse;nz0r;ct0it0r1t0;st0;aYeVhUiQjuPmiMoKqJuc1vI;ert1og0;uir1;ec2pt0rIt0ç0;ar,m4n0;nIr0t1;isE;tr0;d6nt0;aKci7vI;inI;ar,h0;nt0r;er1;cu0lIqu0r1;a5gI;az0;pt0;a06c05e01h0i7l00oQreNtKuI;d1mIs0ñ0;ul0;iv0uaI;l3r;iz0;ce5d8sce5;it0;nt0;g2lh2mPnNpl0rMsI;ar,tI;arJumI;br0;!se;d0t0;seIt4;j0lh0;et2od0paI;nh0ñ0;ar0;d2it0lCnJpt0rIss0;c0t0;ar,d2tu0;er0;ed2i7;b0lm0mp0rJsIt0;al0;iBreI;ar,t0;ci0;aVd6enToQrLsoJuI;rr1s0;lv2rI;b2v2;aKeJiI;g0r;vi0;nIz0ç0;d0g2;l1n0rI;d0r4t0;ir;ço0;ic0;f0ix0l0nKrc0st4t2;ec2;er;ar,d7;on0;ar",
    "Noun": "true¦0:3F;1:3O;2:31;3:2U;4:2T;5:2K;6:36;7:2R;8:2O;9:3N;A:3G;B:3I;a3Ab37c2Bd24e1Uf1Ng1Ih1Fi1Aj18l14m0Tn0Qo0Np0Aquieb0Wr01sPtJuIvDweb3éC;t1Wxi1Z;ari0eEiDoCue27;c6lum1t0;no,rg1sP;cinCget2nta7;d39o;mbr2nión soviét1Qsu38;aGeErCáct1Pécn27;aCen,ibun6áf5;bajo,ta9;mCo0Rrmin6;pora1Tát1L;ll3maE;aLeIiGoEuC;eCspiB;ño;breviElicC;it0;gnifi0HrC;vi25;mDrpi24ñC;al2Wor;a7ifina8;b1YlCntand3;!ar2Res;aJeFiDoCégim1ío;b1Vn;tu6vC;al2Per;i29pEsC;taur0uC;l2Fm1;oso,resent0úbl1H;dica8na;aMeJico1SlIoGrEuCórt5;eCl05nta4;nArto r5;imo,oCueba,áct1C;pósi0Xspec0X;rtaCtenci2;da,l;an,ur2;rCso;egri1Viód5sC;on2pec2E;go,n,ra4sCt1F;a2Ho;céano Dpon1DrCso,t1X;b1Ld1ig1;atlánt5pacíf5;a4eDiC;nten9ño;ga26olít5umát5;aJeHiFo2CuC;eCj3n9;b8stC;ra;embBneraCra4to;!l1V;mbra7nest3rCt6zcla;ca9;druFgo,mífeBnDquinaria,rg1teria8yoCña7;ría;u2za7;aEev0iDleCás3íd3;ga4;bera8ngüíst02tor2;do,na;orna08uCúpit3;e1Mga4;d0Tmag1nC;cen1UfEglés,icia1Nst0teDvC;ernadeBi1A;gr2lectua8;anAormH;aCerma7imml3ospit6í1T;bCda,rry pott3;a7iU;a8eFobEraCu0;do,mC;átO;ern0ier0T;meYn,r0E;aGestiv6iFoEuCábr02;eCner2;nArzas arm04;n9rma;li2na8;bric0cha4lCrmacéut5;la,ta;ditori2jercic0XmKnIrudiHsCxam1;cla1BpFtC;aDudi0étC;ica;dístSnA;aHos08;to;a7cabeza9sala4trC;aEega;baja4ir,plea9;aHesFiEoDécaC;daX;cument2n0;agnóst5buj0enAneBpu0Fsposi0Y;arrolCord1;lo;tos,ño;aTerShicQiudada03lOoHrDuCánc3;er4l0Tra;iEát3ítDónC;icG;icaN;m1st6;mFnEordenCs05;adC;as;ceja8tribuyG;andDbustibCerci0;le;anAo;an,iC;enA;as,oC;!s;ea8;bOdáv3lza4mJnIpGrFsEtedrCud2;al,át5;ico;a,o;den6ga,m1nav2áct3;ita8;les;alTcill3;iDpa7;na;no;da;er;alleBle;aCienestar,ota;n9tmCño;an;bXdjeVguTlMmKnErsen2tenCyud0ño;ta9;al;a,iCtepasa9;m6versC;arC;io;alC;!es;anAiC;go;gui1iFmEtC;ar,ernaC;tiva;ir0uerzo;a9c0;anA;te;jeB;ro;tiC;vo;dom1oC;ga9;do;en",
    "Adjective": "true¦0:ME;1:ND;2:MZ;3:LH;4:N6;5:N8;6:MG;7:KR;8:K8;9:NA;A:LF;B:MU;C:MJ;D:M3;E:KQ;F:MY;G:KZ;H:FT;I:LD;aJMbIFcFLdE9eCIfBMgAZhAIi8Lj8Ckur1l7Om69n5Oo5Bp3Squ3Qr2Qs1Dt0Ju0EvVweb,xeUySzQáOíLóKúJ;ltimEnE2tFH;pAEs7;be3gn7nJ;fiN5tJ;eg3iN4;ci1l2LrJs3Tto0ur7vi1;abe4i1;aJur1;moLBpoAUragoza0;erMZuJ;caASgoslaKB;nófoIIróD9;aTePiLáKíJ;tr7vi1;li1ndaKO;ejFIguDkinFlGKolHrLsJtAu1vo4zcIM;iJuA;bG8go1;tuAulH;c0Mllu1nezoGGrKsperK4tJ;eKZus2;an4OdJsátEWt33;ader5e4;cPgOlNno,q46riMsJ;alKEcJto;oJón;!nN3;abFYop91;lisoleI2ón;abBJo;u0ío;bFRltraKBmbrIMnLrKteLKzbeJ;co,ko;b7Oug48;iJíCP;forFUversA;a0Ae02he,iZoVrOuLárta3éKíJ;mi1pD1;cni8rmL8;cuHWnHTrJ;bJco,ístCY;io,ulH;aKemBYiJoH5un8;lobuLXsJR;cMdicLXnKsJvieC;e3lúLH;quiJSsJ;grK0lúLFm08vLO;io,t9;le72n2rLscKtJ;al,ona8;a0o;do,e3;bKer0ll,n2roJ;id7lD;eHBio;atrAba0mpPn77rJsal6utGóri8;cMmóBZrJ;eKiJáqu7;to8L;no,s8M;erJio;!a;orArK1;iwVng31rJuKNí0;as8dHOt7W;a0Le0Ci07oYuKíICóJúpHE;li1rBD;ave4bUcSdReQficiJ1je2mPpKrc3ZsJtDL;odicJNtitu2;erKreJ;mo,s9;!doKRfKiJAvJ;is9;iBElI;er6o;co,l2vo;anD;es9iJulH;n2o;alJcampeGdesarrolKWmaK7u6O;pi0t9N;bOcialNlKmJnor5r1viéHS;brH6e3;aJemne,it0Oo;!rJ;!ieF;!es,isJ9;erKrJ;ehuGIio;a0b6;amDgMlLmKnJr6;ce3ieJDóB6;i2HpBZ;vA2íc7;nificaHEuiDJ;cQdPguOmiMnLptentrDXrKvJxuBñe3;e3ilEA;b6e0io,ra0;cill5egalDsa2;cJdesnu1áKS;on0BáBZ;nCOro;iHuGH;o4retoDCundariD1;b6crRgrCFjGlPmOnKrJ;do,race0;!gKjuani0o,tJ;afeJBiagJ9o;riHuJ;inolHín7;a45oa0;iJtGEvo;no,tGL;o,íleF;a0EeSiRoMuKápid5íJ;gi1;a0bJdo,ma0rBs5;io,ro;b9LcMd6jLmKn8q1IsaJt91;do,ri0;anEo;a,iblan8o4;ie3ke3ocó;c5oja0;a01cXdWfUgSlRmo2nPpLsponsD7tKvolucionJ;ar6;iBRrógGP;le2rJ;esKoJ;duFQ;alDMor;aJombraBU;centHYno;aBOigiosEle0;ioJul39;!nB;iJOleJ;ct9jo,xiGR;on1uFH;e54honcHOiLoleKtJípro8;ang2KilCUor;ct9to;enJNo;c6lJ;!eJ;nFs;dLlo,ncKquíd7ro,sJ;o,tFM;he3io;icA;eJie2ímEH;bequDchua,ri1;a0Pe0Ji0Hl0Eo03rNuLáAJéKíJóstuIZúblEF;ca3o;nduGRtr7;d8Ser8lc3ntiagu1rJto;iEHo,p9EulH;acFOeViSoLáctHWóJ;diFsJximBI;pe3;bC7cedBPduEVfNgen9QliF5mLn2pKsperan1teEVvJ;eniBOin8Y;enCiEuls9;eJiscIot9;d6tIT;a0esIJuJ;nd5so;e2mJn1V;aEBerJigFU;!a4os;cKdecGKmatu3r6SsJvi5;enIUidenFLo,to,un2;olombi0urs9;bSdRlOpu08rMsJtoHH;iKtJ;eriGEre3;b9Ntiv5;ci0tJ;u2RátAI;a8iKvoriHíJ;c1SfaFgaI7tDN;c1Rn4N;eros5ri1;la1re;aKeJ;be00n5;no,ye3;cu1gm7nJ;na1o,t9;cu75dunA0lNnMor,queñErKsqJ;ue3;la1manFLpJsonalCTteneciAUua0vHN;etIleE9;tá8Súl51;i43u1;cífi8ga0lRmpH1rKtJuH2;er0r6óGO;aMciAdLeE4iGTtiJ;cuJsa0;larHS;o,us8;gJleFG;uaJ;yo;aJesEYme3;cJti0;ieF;bRcPfiELmnC9pMrKsc5YtoD7vJ;i0oid7ípa3;al,deHNiJtodoB0;e5XginBun1;a8eraE5oKrFFuJ;es2lH;r39s89;ciJhava1ul2;de5Sta0;eClLre3sJtuCv6;cJole2;e0u3;icIonF;aYeTiSoMuJíECómada4;cleJevElo,meros63;aJó7D;do,rH4;b8BcNmbDZrKtJva2;ab8Ao;cKmaJoesENueF;lH0n1;orG4;iE7tur0;pGtrogeH2;cMfas2gKoJrv6Pto,ut3;grana4SyorqFS;aDJrJ;a,o4uz8;esariEio;cGKpoliC9tMvKzJ;are0i;aJie3;l,r3;al,o,urB;a0He0Bi06oVuOáxNédi8íMóLúJ;ltiplJsi8;e4o;r8Cv8O;nJse3;im5;do,er2la2nMsJtI;cKicJulmAX;alGEóE5;ulAS;dKiJ;cipB;a0iA;deSlRnMrJzo;aKe0iJmGo,u0;b57s8;do,l;ocMtKóJ;gaG0to0;aJevidF8és;no,ñD;roFX;daD9es2;rnEs2;lLsKxtJ;e8il9Co;mEógi0;anDitJ;arAN;dMjDRnLrJtropolitE9xicE9zqEQ;id91oJ;!vAF;orFQtAu1;iJo;a,evAo;cXdWeE8gUlRnPrOsNtKuJyDL;riB4;eJuCW;mát3UrJ;iAno;cuEOi7L;aga2ino4í2K;cheFdBMifiCZso,uJ;eELfacBS;aKig0lorquBLo,tJv2FéBC;r16és;!yo;nJro;o,éC0;eBNu3;ab3edBG;a02eYiRlQoNuKáct7íJúEL;m4Wqui1;sKteDCxemburJ;guD;iALo;buEUcJmbar1ngeCB;alF1oJ;!mBK;a0e0orG;bNgMmLnKs2tJ;erari5ua0;do,eAgEQ;p6ítrof9O;e3ue3;anDerJio,re4;al,ti0;cLgKja0n2oEWtJ;ra1ón;alEPo,í1S;he3t9;cLdrGnKrgEsciBWtJxo;erBin5o;ceolad6Hu1;io,rimóDD;aOeNoLuJóven9C;dJguetGnto4s2ven6N;i4Lí72;rJvEW;da0;mAAró4S;cobKponJ;esa,és;eo,i0;be3d1EguBl17mp11nNrLsKtaliJzquierd5;an6U;abeDEomorCMraelí,óC9;aJredH;c36n6;a0Uc0Qd0Ge0Ef0Ag08h07i06just05m01na2oZquie2sVtLus15vJút6A;as9erJá5K;so6Z;eKrJ;auteD4uCé3Rí3A;lec3XnPrJ;!ceNesE8iMmed6nKuJvent9;rba0;aJo4;!cDPs;no,or;pt9;cDBs5;atKeJospe5F;ct8Ggu3nsa2r2;isfJuAM;ecBX;cIdo3porJ;tu0;aLeKunJ;do,osuprBK;dia2nCrC;cuDBdu3;ifiCDo;ciAnterrum37;abiCVu93;enIlesJra2;a,es;aLeKraJun52;rro9M;liz,riB9;me,nt5F;quí3Ksper0AxpJ;er2loA4;eQiLoJustriBígena4;e7Jlo3nJ;es6;ferenc71g0o,sJviduB;cKtJ;in2;rJuA6;e2iCX;bi1fJpe5Ss4LterCW;enCi8Q;i4IoJruHul2ómo1;lo3mpKnJrpAA;cluCe6DtroCN;le2ren2Q;cabUdJlte9Pni43prop6Q;ecuTv22;ar,eNoMrKuJío;ls9ro;eJop6;s9v47;rtCWsib60;riA;eNiKusJ;tre4;mJr6;itJ;ad5;gíJso;tiCB;eAón7;aWeSiQoLuKáb4IíbCLúJ;me1n8X;e8gono9Xm6KracaCGér3C;cicu1mLnKrJ;izoASr21;do,es2;ogOóJ;fo0loFniC2;d2Crsu2sJ;pano0Atór7G;br7chi97lLrb6SteroJ;do5KgJ;én7;a1e0;bituBlóKmbrJr2;e,iH;fi9Nge0;a00eYiXlVoUrNuJé3C;aKerrJipuzcoa0;e3ill4J;po,rdi6BtemalJ;te8;aLecoKiJose3ueC;eg5s;!la90rW;nKsJto,ve4;iHo;!aJde4;di0;do,r1;aJobAút7;b3u8;g6Uta0;nJográfAEr73st9;erBui0étAD;di6WlJr35scGuc9M;lLoJés;!rJ;ro6Y;ar1eF;a0Ae07i01lXoVrQuMác3EéKísJ;icAX;rJti1;r7t3B;erBFnKtJ;ur5;c4CdameJes2;ntB;aKecu3VisGug5QíJ;a,o4vo8Q;ncKtJudulH;er0;es9Zis8Do,és;lclór9UrJ;mAni1;aKexi83oJ;jo,ri1;co,mJ;en8íge3;brad7WcticiNdedig0eMjo,lLnJr47;aJo;l,nciero4;ipi0óso91;lAMro;as,os;cKderAliJmenin5o;no,z;un1;lLmJríng7sci2Fvor3T;iJosE;li4U;lo,s5;br6conóm5Pd18f16g15jecu72l0Zm0Yn0Tp0Qqu0Nrrón7s01t00uropeEvid7YxJ;!ac8OcXen2haWiVpTtJó95;ePin2rJ;aLem5ovKíJ;nse8;er7D;ct9njerKterrJ;est9A;a4os;nKrJ;i81n2O;di1s5;erJreC;ime8Jto;gIst2T;us2;elJret9;en7Iso;er0rus8ér7;bel2cZenYlWpPqui73tJ;aNel48on6r1NuKánd48úJ;pi1;dKpJ;en1;ioC;b31dounidense4n8tB;aNeLiriKlénJur6;di1;tuA;cJso;iBíf09;ciBr50ñolJ;!a4es;a6PovJ;a8e0;ciA;aMleKoJue2;cDl3R;róJ;fi70;ndina6Is1U;iKíJ;vo8;lib62no,val6R;icKóJ;ni90;úr7;a0cMdLemiFfer8YoKreve6PtJ;e3usias7D;ja1rme4;oc82ó7S;ant9Cima;bara88is9;eJéctr5W;ctJva1;orLróJ;fi6JnJ;ic1D;!al;eo,ipc6oís72;ec0Ric5BíJ;me3;it9;a0Te00iMoLruCuJéb0R;lJr5;ce,zG;b1Wlo8Rmin3Wrmi1;e73fUgTminu2oce5KploSrect1DsNur0vKáJ;fa0;erJi0;sJti1;as,o4;cMj83pJtintE;erConibKuestJ;!o;le4;apaci7Ore2;ma1;itAno;er10uJíc22;n2so11; mo0Ab09c08f05l03n01pZrYsJvo2;aVcRdiQemplPhon5MiOnu1o13pKtru43vaJ;li1;iLrJ;e3RovJ;is2;aNer2;er2;ea1;cha1;alLonKuiJ;da1;o76tH;zo;fo77perciJ;bi1;ech5;ortivJred81;as,o;so,tiJ;cu7C;gJicJ;ad77;ens9iniJ;tiJ;va;a0idI;il;da;nDñi0;a1Qe1Hh19i15l13oXrQuLáKéleb6EóJ;mo1nca4Irn7;li1ntab3;aMba0er1ltLrJstod6ánt65;si,vJ;il0Ko;o,urB;d3r5F;an67eOiKoa5EuJí3S;do,en2;ol4QstJ;a65iJ;anJno;a,o4;ci4Hs6B;l0Lm0FnWoVque2rLsJ;a8tJ;era;a5YdRea0int6nu1pPreKso,tJuñD;a4e3To4;ctLspoJ;ndiJ;en6Y;a,oJ;!r;orAulHór7;en2;a1ille4Q;rde6N;c00du2HeZfXj67mov6Jo5VsOtLvJ;eJulC;rCxo;en2iJ;gInJ;e4Vu5;aPerv6PiMpLtJult9;an6KitucJri2A;ionA;icI;derJst3S;abJ;le;bi1nguJ;ín7;orJuC;me;xo;ienzu1re2;ar3Eer2ZpKunJún;es,is49;lKosteJ;la0;eJi4P;j5t5;e1SoJ;mbiJniAri1;a0no;aJo2Lás2P;ndes2Zr5;clóp7eLlKmarrGrcunv17vJ;il5M;ia1;go,ntíf2KrtE;aOecMiKoJur3;lo,ro;f59lJno;en5lG;he0oJ;!slova8;rJto;ro,t18;lPnLrJ;cJebrAra1;anE;s9trJ;al57oeKíJ;fuFpe2;urop7;es2Qtíbe3ulJ;ar;duc03l02mZnWpSrNsLtJu2;alJól3Z;án;e3tJ;ell3Eo;acterís1Nc3PnMoKroñe3tJ;ag0Ru16;!lJ;ing6;ívo3;aKitalJri0uchi0;!i0;cJz;es;an7cerí3Hi0o,sa1tJ;an29oJ;nDr;boKpeJ;ro,si0ón;ya0;cár7i23mo,vo;ifol6o;a0He09i02lanZoVrOuLáKíJúl11;fi1pe1;rba3sQva3;enKfo,rJ;do,guDlG;!a4o4;a1JeOiKuJ;jo,s0Dto;llLtJ;a0ánJ;icE;an1R;tGve;goLhem6mKol38rJsn6to,vi0;goñGrac2A;bo;ta0;cKdo,quJ;eci0;a4o4uz8;eMlbLnaKrJzar3;ma0;ria;aí0;lorruCnJ;veJ;ni1;a2l1FnMoc6rJ;ber10ebKlJ;inD;er;eKig0éJ;vo1A;dic0UfaJ;ct9;bilPilNjEldMrKstJyo;ar1o;a2bu1cel0WroJí26;co4;ío;arJ;ín;on6;b3Fc34d2Ve2Tf2Pg2Lje2Jl1Zm1Mn0Xp0Rqu7r07s02tWuPvLzuKére5ñeJ;jo;caLl37;aLenJ;tuJ;re3;n2Ero;dOstrohúnNtJ;oKóJ;c1Rgra1Enom5;gest2HmJpropul0M;ot9;ga3;az;eMlánLrJ;acJevi1oz;ti02;ti8;n2o,rJ;ciope2Ir34;esMiKtu2íJ;ncro0;dIlvestJr6;ra1;i0or;aZbYca0dIenWgSio,mRqueológicQrNtJábiF;eLifiKístJ;ic5;ciB;sa0;epenKies2WoJ;ce3;ti1;os;en6;eKiJ;vo;li0nJ;ti0;is8;co;ór7;gKm7uJ;ca0;onD;aKuJócrifo4;es2;iLrJ;enJ;te;sa1;a03c02d00eZfiXgWhid3iUtMuBáLóJ;maJni1P;lo;loF;eNiJ;aér7c1JguEsubJ;ma0R;a4o4;eo;cKriJ;or1K;es9;ma1sóJ;tropo;evi0losajGos2;b6triG;ón;jo,xo;aluz,i0orJ;ra0;ho;e0Tlfabe2rJ;anja1quJ;isJ;ta;aSbiMeriKorJpli5;fo;cJnd6;an5;dieMeKgI;uo;ntA;al;st3;ro;do,rJ;go,illJ;a,en2o;a01bZcaYdXeSfonRgOoNpi0tMucKócJ;to0;inóJ;ge0;a4er0o4;ca1;ebraKonqJ;ui0;ica;si0;gMjandLmJnt0W;anJán;a4es;ri0;re;ea0;li0;anDi0;és;do,no;dreJno;za1;iLrJudo4;adeJio,ícola4óno01;ci1;ta1;ga0icKoJ;rtu06;io05;no;rob6;io;ecQiNjMministrativLul2vJ;erC;so;a4o;un2;cKnteJ;la1;ionB;ua1;ampaSep2iaFoOtLuKérriJ;mo;miQ;iv5uB;alJ;!es;gJrazoM;ed9;go;to;na1;neTorigSrumQsOuJ;ndKrJ;ri1;anJ;te4;!s;olut5ur1;a,o;ad9;or;en;ga1;do",
    "City": "true¦0:3B;a2Zb29c1Zd1Ue1Tf1Rg1Lh1Di1Bjakar2Kk12l0Vm0Hn0Do0Bp00quiZrWsMtDuCv9w4y2z1;agreb,uri22;ang1We1okohama;katerin1Krev0;ars4e3i1rocl4;ckl0Yn1;nipeg,terth0Z;llingt1Rxford;aw;a2i1;en2Klni33;lenc2Yncouv0Ir2J;lan bat0Ftrecht;a7bilisi,e6he5i4o3rondheim,u1;nWr1;in,ku;kyo,ronJulouD;anj26l16miso2Mra2D; haKssaloni10;gucigalpa,hr0l av0O;i1llinn,mpe2Engi09rtu;chu25n0pU;a4e3h2kopje,t1ydney;ockholm,uttga15;angh1Ienzh20;o0Nv01;int peters0Xl4n1ppo1I; 1ti1E;jo1salv3;se;v1z0T;adW;eykjavik,i2o1;me,sario,t28;ga,o de janei1A;to;a9e7h6i5o3r1ueb1Tyongya1Q;a1etor28;gue;rt1zn0; elizabe4o;ls1Jrae28;iladelph23nom pe0Aoenix;r1tah tik1C;th;lerLr1tr13;is;dessa,s1ttawa;a1Klo;a3ew 1is;delWtaip1york ci1U;ei;goya,nt0Xpl0Xv0;a7e6i5o2u1;mb0Oni0L;nt2sco1;u,w;evideo,real;l0n03skolc;dellín,lbour0U;drid,l6n4r1;ib2se1;ille;or;chest1dalYi11;er;mo;a6i3o1vCy03;nd1s angel0H;on,r0G;ege,ma1nz,sb00verpo2;!ss1;ol; pla0Jusan0G;a6hark5i4laipeda,o2rak1uala lump3;ow;be,pavog1sice;ur;ev,ng9;iv;b4mpa0Lndy,ohsiu0Ira1un04;c1j;hi;ncheNstanb1̇zmir;ul;a6e4o1; chi mi2ms,u1;stJ;nh;lsin1rakliH;ki;ifa,m1noi,va0B;bu0UiltE;alw5dan4en3hent,iza,othen2raz,ua1;dalaj0Hngzhou;bu0R;eVoa,ève;sk;ay;es,rankfu1;rt;dmont5indhovV;a2ha02oha,u1;blSrb0shanbe;e1kar,masc0HugavpiK;gu,je1;on;a8ebu,h3o1raioKuriti02;lo1nstanKpenhagOrk;gGmbo;enn4i2ristchur1;ch;ang m2c1ttagoM;ago;ai;i1lgary,pe town,rac5;ro;aIeCirminghXogoBr6u1;char4dap4enos air3r1s0;g1sa;as;es;est;a3isba2usse1;ls;ne;silRtisla1;va;ta;i4lgrade,r1;g2l1n;in;en;ji1rut;ng;ku,n4r1sel;celo2ranquil1;la;na;g2ja lu1;ka;alo1kok;re;aDbBhmedabad,l8m5n3qa2sh1thens,uckland;dod,gabat;ba;k1twerp;ara;m0s1;terd1;am;exandr2ma1;ty;ia;idj0u dhabi;an;lbo2rh1;us;rg",
    "Country": "true¦0:2M;a2Cb1Yc1Nd1Me1Df19g12h11i0Sj0Qk0Nl0Gm08n04om2Op00rRsFtAu6v4wal3y2z1;a1Rimbab0A;emen,ibu0N;es,lis and futu2D;a1enezue2FietD;nuatu,tican city;cr2Fg0Snited 2ruXs1zbek2H;a,sr;arab emiratIkingdom,states1;! of ameB;a4imor orient0Vo3rinidad y toba08u1únez;r1valu;kmen2Bqu12;go,nS;i0Xnz27yik29;a8e7i6om0Eri lanka,u1;azi0Vdá2ec0iza,ri1;nam;f2n1;! del s18;ri1F;erra leo1Vngap16r0;neg0Jrb0ychell4;moa,n1o tomé y príncipe; 1ta luc0Q;cristóbal y niev1mariSvicente y las granad0N;es;e2u1;an1Qm1Ts0;ino unido,pública 1;c4d1;e1omin4; macedQl1mocrática del1; conL;entroafr1he11;ica1H;a2erú,o1;lLrtug04;k1Lla18namá,púa nueva guin0Gra1íses baj18;guay;a3ep01i2orue1ueva zelUíger;ga;caragua,ger0;mib0uru;a5icroSo2éxi1óna1;co;ldav0n2zambiq1;ue;gol0tenegro;dagasc0Jl1rruec0Xurit18;a1div0Xta,í;s0ui;a0Ue5i3uxembur2íba1;no;go;b1echtenste0Qtu12;er0ia;soZt1;on0;azaj10en0ir1uwait;gu0Ziba1;ti;a1ord0V;mai08pH;nd7r5s2t1;al0;la1rael;nd0s 1;marshall,salomC;ak,l1án;an0K;ia,o1;nes0;aití,ondur0AungrD;a5ha0Er4u1;atema0Ginea1ya0D;! ecuatori1-bisáu;al;ana0Cec0;b1mb0;ón;i1ranc0;lip2n1yi;land0;inZ;cu8gip7l salv8miratos árabe6ritr5s2tiop1;ía;lov2paña,t1;ado3on0;aqu0en0;ea;s unidR;to;ador;inamarDominiD;a8hi6o1roac0uba;lo4morNrea del 2sta 1te d'ivoi6;de marfEriA;norte,s1;ur;mb0;le,na,p1;re;bo verde,m2nadá,t1;ar;boya,erún;a9e8i7o6r4u2élgi1;ca;lgar0r1tO;kina faso,undi;as1unéi;il;liv0snia-herzegoviCtsuaC;elorrus0rmG;lice,nín;ham4ngladés,r1;bad2é1;in;os;as;fganBl8n5r2ustr1zerbaiyC;al0ia;abia saudita,ge1men0;l0nti1;na;dorra,go2tigua y barbu1;da;la;b1em1;an0;ia;ist1;án",
    "Place": "true¦aLbJcHdGeEfDgAh9i8jfk,kul,l7m5new eng4ord,p2s1the 0upIyyz;bronx,hamptons;fo,oho,under2yd;acifLek,h0;l,x;land;a0co,idCuc;libu,nhattJ;ax,gw,hr;ax,cn,ndianGst;arlem,kg,nd;ay village,re0;at 0enwich;britain,lak2;co,ra;urope,verglad0;es;en,fw,own1xb;dg,gk,hina0lt;town;cn,e0kk,rooklyn;l air,verly hills;frica,m5ntar1r1sia,tl0;!ant1;ct0;ic0; oce0;an;ericas,s",
    "Region": "true¦0:22;1:1T;a20b1Sc1Id1Des1Cf19g14h11i0Yj0Wk0Ul0Rm0GnZoXpTqQrNsEtButAv7w4y2zacatec22;o05u2;cat18kZ;a2est vi5isconsin,yomi14;rwick1shington2;! dc;er3i2;rgin1S;acruz,mont;ah,tar pradesh;a3e2laxca1DuscaB;nnessee,x1R;bas0Lmaulip1QsmK;a7i5o3taf0Pu2ylh13;ffVrr01s0Y;me10uth 2;cSdR;ber1Ic2naloa;hu0Sily;n3skatchew0Rxo2;ny; luis potosi,ta catari0;a2hode8;j2ngp03;asth0Mshahi;inghai,u2;e2intana roo;bec,ensXretaro;ara0e3rince edward2; isV;i,nnsylv2rnambu03;an14;axa0Odisha,h2klaho1Cntar2reg5x06;io;ayarit,eCo4u2;evo le2nav0M;on;r2tt0Sva scot0Y;f7mandy,th2; 2ampton1;c4d3yo2;rk1;ako0Z;aroli0;olk;bras0Yva02w2; 3foundland2;! and labrador;brunswick,hamp1jers3mexiLyork2;! state;ey;a7i3o2;nta0relos;ch4dlanCn3ss2;issippi,ouri;as geraHneso0M;igQoacQ;dhya,harasht04ine,ni4r2ssachusetts;anhao,y2;land;p2toba;ur;anca1e2incoln1ouis9;e2iH;ds;a2entucky,hul0;ns08rnata0Dshmir;alis2iangxi;co;daho,llino3nd2owa;ia0;is;a3ert2idalEunA;ford1;mp1waii;ansu,eorgWlou5u2;an2izhou,jarat;ajuato,gdo2;ng;cester1;lori3uji2;an;da;sex;e5o3uran2;go;rs2;et;lawaFrby1;a9ea8hi7o2umbrI;ahui5l4nnectic3rsi2ventry;ca;ut;iNorado;la;apFhuahua;ra;l9m2;bridge1peche;a6r5uck2;ingham1;shi2;re;emen,itish columb4;h3ja cal2sque,var3;iforn2;ia;guascalientes,l5r2;izo0kans2;as;na;a3ber2;ta;ba3s2;ka;ma",
    "FemaleName": "true¦0:FV;1:FZ;2:FO;3:FA;4:F9;5:FP;6:EO;7:GC;8:EW;9:EM;A:G8;B:E2;C:G5;D:FL;E:FI;F:ED;aDZbD1cB8dAIe9Gf91g8Hh83i7Sj6Uk60l4Om38n2To2Qp2Fqu2Er1Os0Qt04ursu6vUwOyLzG;aJeHoG;e,la,ra;lGna;da,ma;da,ra;as7EeHol1TvG;et9onB8;le0sen3;an8endBMhiB3iG;lInG;if3AniGo0;e,f39;a,helmi0lGma;a,ow;aMeJiG;cHviG;an9XenFY;kCWtor3;da,l8Vnus,rG;a,nGoniCZ;a,iD9;leGnesE9;nDIrG;i1y;aSePhNiMoJrGu6y4;acG0iGu0E;c3na,sG;h9Mta;nHrG;a,i;i9Jya;a5IffaCDna,s5;al3eGomasi0;a,l8Go6Xres1;g7Uo6WrHssG;!a,ie;eFi,ri7;bNliMmKnIrHs5tGwa0;ia0um;a,yn;iGya;a,ka,s5;a4e4iGmC7ra;!ka;a,t5;at5it5;a05carlet2Ye04hUiSkye,oQtMuHyG;bFGlvi1;e,sHzG;an2Tet9ie,y;anGi7;!a,e,nG;aEe;aIeG;fGl3DphG;an2;cF5r6;f3nGphi1;d4ia,ja,ya;er4lv3mon1nGobh75;dy;aKeGirlBIo0y6;ba,e0i6lIrG;iGrBMyl;!d70;ia,lBS;ki4nIrHu0w0yG;la,na;i,leAon,ron;a,da,ia,nGon;a,on;l5Yre0;bMdLi8lKmIndHrGs5vannaE;aEi0;ra,y;aGi4;nt5ra;lBKome;e,ie;in1ri0;a02eXhViToHuG;by,thBH;bQcPlOnNsHwe0xG;an93ie,y;aHeGie,lC;ann7ll1marBCtB;!lGnn1;iGyn;e,nG;a,d7W;da,i,na;an8;hel53io;bin,erByn;a,cGkki,na,ta;helBWki;ea,iannDUoG;da,n12;an0bIgi0i0nGta,y0;aGee;!e,ta;a,eG;cAOkaE;chGe,i0mo0n5EquCAvDy0;aC9elGi8;!e,le;een2ia0;aMeLhJoIrG;iGudenAT;scil1Uyamva8;lly,rt3;ilome0oebe,ylG;is,lis;arl,ggy,nelope,r6t4;ige,m0Fn4Oo6rvaB8tHulG;a,et9in1;ricGsy,tA5;a,e,ia;ctav3deHfATlGphAT;a,ga,iv3;l3t9;aQePiJoGy6;eHrG;aEeDma;ll1mi;aKcIkGla,na,s5ta;iGki;!ta;hoAZk8AolG;a,eBE;!mh;l7Sna,risF;dIi5PnHo23taG;li1s5;cy,et9;eAiCL;a01ckenz2eViLoIrignayani,uriBDyG;a,rG;a,na,tAP;i4ll9UnG;a,iG;ca,ka,qB1;a,chOkaNlJmi,nIrGtzi;aGiam;!n8;a,dy,erva,h,n2;a,dIi9GlG;iGy;cent,e;red;!e6;ae6el3G;ag4KgKi,lHrG;edi61isFyl;an2iGliF;nGsAJ;a,da;!an,han;b08c9Bd06e,g04i03l01nZrKtJuHv6Sx85yGz2;a,bell,ra;de,rG;a,eD;h74il8t2;a,cSgOiJjor2l6In2s5tIyG;!aGbe5QjaAlou;m,n9P;a,ha,i0;!aIbAIeHja,lCna,sGt53;!a,ol,sa;!l06;!h,m,nG;!a,e,n1;arIeHie,oGr3Kueri9;!t;!ry;et3IiB;elGi61y;a,l1;dGon,ue6;akranBy;iGlo36;a,ka,n8;a,re,s2;daGg2;!l2W;alCd2elGge,isBDon0;eiAin1yn;el,le;a0Ie08iWoQuKyG;d3la,nG;!a,dHe9PnGsAN;!a,e9O;a,sAL;aAYcJelIiFlHna,pGz;e,iB;a,u;a,la;iGy;a2Ae,l25n8;is,l1GrHtt2uG;el6is1;aIeHi7na,rG;a6Xi7;lei,n1tB;!in1;aQbPd3lLnIsHv3zG;!a,be4Ket9z2;a,et9;a,dG;a,sGy;ay,ey,i,y;a,iaIlG;iGy;a8De;!n4F;b7Qerty;!n5Q;aNda,e0iLla,nKoIslAOtGx2;iGt2;c3t3;la,nGra;a,ie,o4;a,or1;a,gh,laG;!ni;!h,nG;a,d4e,n4N;cNdon7Pi6kes5rMtKurIvHxGy6;mi;ern1in3;a,eGie,yn;l,n;as5is5oG;nya,ya;a,isF;ey,ie,y;aZeUhadija,iMoLrIyG;lGra;a,ee,ie;istGy5A;a,en,iGy;!e,n48;ri,urtn97;aMerLl96mIrGzzy;a,stG;en,in;!berlG;eGi,y;e,y;a,stD;!na,ra;el6MiJlInHrG;a,i,ri;d4na;ey,i,l9Ns2y;ra,s5;c8Ti5UlOma6nyakumari,rMss5JtJviByG;!e,lG;a,eG;e,i75;a5CeHhGi3PlCri0y;ar5Aer5Aie,leDr9Cy;!lyn70;a,en,iGl4Tyn;!ma,n31sF;ei6Zi,l2;a04eVilToMuG;anKdJliGst54;aHeGsF;!nAt0W;!n8U;i2Ry;a,iB;!anLcelCd5Sel6Yhan6FlJni,sHva0yG;a,ce;eGie;fi0lCph4V;eGie;en,n1;!a,e,n36;!i10lG;!i0Z;anLle0nIrHsG;i5Nsi5N;i,ri;!a,el6Mif1RnG;a,et9iGy;!e,f1P;a,e6ZiHnG;a,e6YiG;e,n1;cLd1mi,nHqueliAsmin2Uvie4yAzG;min7;a7eHiG;ce,e,n1s;!lGsFt06;e,le;inHk2lCquelG;in1yn;da,ta;da,lPmNnMo0rLsHvaG;!na;aHiGob6R;do4;!belGdo4;!a,e,l2G;en1i0ma;a,di4es,gr5O;el8ogG;en1;a,eAia0o0se;aNeKilHoGyacin1N;ll2rten1H;aHdGlaH;a,egard;ry;ath0WiHlGnrietBrmiAst0W;en24ga;di;il72lKnJrGtt2yl72z6A;iGmo4Cri4D;etG;!te;aEnaE;ey,l2;aYeTiOlMold12rIwG;enGyne18;!dolC;acHetGisel8;a,chD;e,ieG;!la;adys,enGor3yn1Y;a,da,na;aJgi,lHna,ov6YselG;a,e,le;da,liG;an;!n0;mYnIorgHrG;ald33i,m2Rtru70;et9i0;a,eGna;s1Nvieve;briel3Cil,le,rnet,yle;aReOio0loMrG;anHe8iG;da,e8;!cG;esHiGoi0G;n1s3S;!ca;!rG;a,en40;lHrnG;!an8;ec3ic3;rHtiGy7;ma;ah,rah;d0FileDkBl00mUn47rRsMtLuKvG;aIelHiG;e,ta;in0Ayn;!ngel2F;geni1la,ni3O;h4Zta;meral8peranJtG;eHhGrel6;er;l2Mr;za;iGma,nest27yn;cGka,n;a,ka;eJilImG;aGie,y;!liA;ee,i1y;lGrald;da,y;aTeRiMlLma,no4oJsIvG;a,iG;na,ra;a,ie;iGuiG;se;en,ie,y;a0c3da,nJsGzaH;aGe;!beG;th;!a,or;anor,nG;!a;in1na;en,iGna,wi0;e,th;aWeKiJoG;lor4Yminiq3Vn2XrGtt2;a,eDis,la,othGthy;ea,y;an08naEonAx2;anPbOde,eNiLja,lImetr3nGsir4R;a,iG;ce,se;a,iHla,orGphiA;es,is;a,l5G;dGrdG;re;!d4Jna;!b29oraEra;a,d4nG;!a,e;hl3i0mMnKphn1rHvi1TyG;le,na;a,by,cHia,lG;a,en1;ey,ie;a,et9iG;!ca,el17ka;arGia;is;a0Oe0Lh03i01lToIrHynG;di,th3;is2Ay03;lOnLrHurG;tn1B;aId26iGn26riA;!nG;a,e,n1;!l1Q;n2sG;tanGuelo;ce,za;eGleD;en,t9;aIeoHotG;il49;!pat4;ir7rIudG;et9iG;a,ne;e,iG;ce,sX;a4er4ndG;i,y;aPeMloe,rG;isHyG;stal;sy,tG;aHen,iGy;!an1e,n1;!l;lseHrG;!i7yl;a,y;nLrG;isJlHmG;aiA;a,eGot9;n1t9;!sa;d4el1NtG;al,el1M;cGli3E;el3ilG;e,ia,y;iXlWmilVndUrNsLtGy6;aJeIhGri0;erGleDrCy;in1;ri0;li0ri0;a2FsG;a2Eie;a,iLlJmelIolHrG;ie,ol;!e,in1yn;!a,la;a,eGie,y;ne,y;na,sF;a0Di0D;a,e,l1;isBl2;tlG;in,yn;arb0CeYianXlVoTrG;andRePiIoHyG;an0nn;nwCok7;an2NdgKg0ItG;n27tG;!aHnG;ey,i,y;ny;etG;!t7;an0e,nG;da,na;i7y;bbi7nG;iBn2;ancGossom,ytG;he;ca;aRcky,lin8niBrNssMtIulaEvG;!erlG;ey,y;hHsy,tG;e,i0Zy7;!anG;ie,y;!ie;nGt5yl;adHiG;ce;et9iA;!triG;ce,z;a4ie,ra;aliy29b24d1Lg1Hi19l0Sm0Nn01rWsNthe0uJvIyG;anGes5;a,na;a,r25;drIgusHrG;el3;ti0;a,ey,i,y;hHtrG;id;aKlGt1P;eHi7yG;!n;e,iGy;gh;!nG;ti;iIleHpiB;ta;en,n1t9;an19elG;le;aYdWeUgQiOja,nHtoGya;inet9n3;!aJeHiGmI;e,ka;!mGt9;ar2;!belHliFmT;sa;!le;ka,sGta;a,sa;elGie;a,iG;a,ca,n1qG;ue;!t9;te;je6rea;la;bHmGstas3;ar3;el;aIberHel3iGy;e,na;!ly;l3n8;da;aTba,eNiKlIma,yG;a,c3sG;a,on,sa;iGys0J;e,s0I;a,cHna,sGza;a,ha,on,sa;e,ia;c3is5jaIna,ssaIxG;aGia;!nd4;nd4;ra;ia;i0nHyG;ah,na;a,is,naE;c5da,leDmLnslKsG;haElG;inGyW;g,n;!h;ey;ee;en;at5g2nG;es;ie;ha;aVdiSelLrG;eIiG;anLenG;a,e,ne;an0;na;aKeJiHyG;nn;a,n1;a,e;!ne;!iG;de;e,lCsG;on;yn;!lG;iAyn;ne;agaJbHiG;!gaI;ey,i7y;!e;il;ah",
    "MaleName": "true¦0:C9;1:BG;2:BX;3:BO;4:B0;5:BU;6:AO;7:9Q;8:B8;9:AS;A:AJ;B:9D;aB0bA4c93d84e7Ef6Xg6Fh5Vi5Hj4Kk4Al3Rm2Pn2Eo28p22qu20r1As0Rt07u06v01wOxavi3yHzC;aCor0;cCh8Ene;hDkC;!aAX;ar50eAW;ass2i,oDuC;sEu25;nFsEusC;oCsD;uf;ef;at0g;aKeIiDoCyaAL;lfgang,odrow;lCn1O;bEey,frBFlC;aA1iC;am,e,s;e85ur;i,nde7sC;!l6t1;de,lDrr5yC;l1ne;lCt3;aBy;aFern1iC;cDha0nceCrg97va0;!nt;ente,t59;lentin48nBughn;lyss4Lsm0;aUePhLiJoFrDyC;!l3ro8s1;av9MeCist0oy,um0;nt9Ev53y;bEd7TmCny;!as,mCoharu;aAUie,y;i7Zy;mCt9;!my,othy;adEeoDia79omC;!as;!do7I;!de9;dFrC;enBrC;anBeCy;ll,nB;!dy;dgh,ic9Pnn3req,ts44;aRcotPeOhKiIoGpenc3tCur1Oylve8Dzym1;anEeCua77;f0phABvCwa76;e56ie;!islaw,l6;lom1n9ZuC;leyma8ta;dCl7Fm1;!n6;aEeC;lCrm0;d1t1;h6One,qu0Uun,wn,y8;am9basti0k1Xl40rg3Zth,ymo9E;!tC;!ie,y;lDmCnti22q4Iul;!mAu4;ik,vato6S;aXeThe8ZiPoGuDyC;an,ou;b6IdDf9pe6NssC;!elAF;ol2Uy;an,bJcIdHel,geGh0la7EmFnEry,sDyC;!ce;coe,s;a92nA;an,eo;l3Jr;e4Qg3n6olfo,ri65;co,ky;bAe9R;cCl6;ar5Mc5LhDkC;!ey,ie,y;a82ie;gDid,ub5x,yCza;ansh,nT;g8TiC;na8Ps;ch5Vfa4lEmDndCpha4sh6Rul,ymo6X;al9Vol2By;i9Fon;f,ph;ent2inC;cy,t1;aGeEhilDier5Zol,reC;st1;!ip,lip;d98rcy,tC;ar,e2V;b3Sdra6Ct44ul;ctav2Vliv3m93rGsDtCum8Rw5;is,to;aDc8PvC;al50;ma;i,vK;athKeIiEoC;aCel,l0ma0r2X;h,m;cDg4i3IkC;h6Rola;hol5UkCol5U;!ol5T;al,d,il,ls1vC;il4Y;anCy;!a4i4;aXeUiLoGuDyC;l21r1;hamDr5WstaC;fa,p4E;ed,mG;dibo,e,hamEis1XntDsCussa;es,he;e,y;ad,ed,mC;ad,ed;cHgu4kFlEnDtchC;!e7;a75ik;house,o04t1;e,olC;aj;ah,hCk6;a4eC;al,l;hDlv2rC;le,ri7v2;di,met;ck,hOlMmPnu4rIs1tEuricDxC;!imilian89we7;e,io;eo,hDi4ZtC;!eo,hew,ia;eCis;us,w;cEio,k83lDqu6Dsha7tCv2;i2Hy;in,on;!el,oLus;achCcolm,ik;ai,y;amCdi,moud;adC;ou;aReOiNlo2RoJuDyC;le,nd1;cFiEkCth3;aCe;!s;gi,s;as,iaC;no;g0nn6OrenEuCwe7;!iC;e,s;!zo;am,on4;a78evi,la4PnDonCst3vi;!a5Yel;!ny;mDnCr65ur4Rwr4R;ce,d1;ar,o4L;aJeEhaled,iCrist4Tu46y3A;er0p,rC;by,k,ollos;en0iFnCrmit,v2;!dDnCt5A;e0Zy;a7ri4L;r,th;na66rCthem;im,l;aZeRiPoEuC;an,liCst2;an,us;aqu2eKhnJnHrFsC;eDhCi79ue;!ua;!ph;dCge;an,i,on;!aCny;h,s,th4V;!ath4Uie,nA;!l,sCy;ph;an,e,mC;!mA;d,ffHrEsC;sCus;!e;a5HemDmai8oCry;me,ni0P;i6Sy;!e56rC;ey,y;cId5kHmGrEsDvi3yC;!d5s1;on,p3;ed,od,rCv4K;e4Xod;al,es,is1;e,ob,ub;k,ob,quC;es;aObrahNchika,gLkeKlija,nuJrHsEtCv0;ai,sC;uki;aCha0i6Dma4sac;ac,iaC;h,s;a,vinCw2;!g;k,nngu50;!r;nacCor;io;im;in,n;aKeGina4ToEuCyd54;be23gCmber4AsE;h,o;m3raBsCwa3V;se2;aEctDitDn4CrC;be1Ym0;or;th;bLlKmza,nJo,rEsDyC;a41d5;an,s0;lFo4DrEuCv6;hi3Yki,tC;a,o;is1y;an,ey;k,s;!im;ib;aReNiMlenLoJrFuC;illerDsC;!tavo;mo;aEegCov3;!g,orC;io,y;dy,h55nt;nzaCrd1;lo;!n;lbe4Ono,ovan4P;ne,oErC;aCry;ld,rd4S;ffr6rge;bri4l5rCv2;la1Xr3Cth,y;aReOiMlKorr0HrC;anEedCitz;!dAeCri22;ri21;cEkC;!ie,lC;in,yn;esJisC;!co,zek;etch3oC;yd;d4lConn;ip;deriDliCng,rnan01;pe,x;co;bi0di;arZdUfrTit0lNmHnGo2rDsteb0th0uge8vCym5zra;an,ere2U;gi,iDnCrol,v2w2;est44ie;c06k;och,rique,zo;aGerFiDmC;aFe2O;lCrh0;!io;s1y;nu4;be09d1iFliEmDt1viCwood;n,s;er,o;ot1Ts;!as,j43sC;ha;a2en;!dAg32mFuDwC;a25in;arC;do;o0Su0S;l,nC;est;aYeOiLoFrEuDwCyl0;ay8ight;a8dl6nc0st2;ag0ew;minicGnEri0ugDyC;le;!l03;!a29nCov0;e7ie,y;!k;armuDeCll1on,rk;go;id;anJj0lbeImetri9nGon,rFsEvDwCxt3;ay8ey;en,in;hawn,mo09;ek,ri0G;is,nCv3;is,y;rt;!dC;re;lLmJnIrEvC;e,iC;!d;en,iEne7rCyl;eCin,yl;l2Wn;n,o,us;e,i4ny;iCon;an,en,on;e,lC;as;a07e05hXiar0lMoHrFuDyrC;il,us;rtC;!is;aCistobal;ig;dy,lFnDrC;ey,neli9y;or,rC;ad;by,e,in,l2t1;aHeEiCyJ;fCnt;fo0Dt1;meDt9velaC;nd;nt;rEuDyC;!t1;de;enB;ce;aGeFrisDuC;ck;!tC;i0oph3;st3;d,rlCs;eCie;s,y;cCdric;il;lFmer1rC;ey,lDro7y;ll;!os,t1;eb,v2;ar03eVilUlaToQrDuCyr1;ddy,rtJ;aKeFiEuDyC;an,ce,on;ce,no;an,ce;nDtC;!t;dDtC;!on;an,on;dDndC;en,on;!foCl6y;rd;bDrCyd;is;!by;i8ke;al,lA;nGrCshoi;at,nDtC;!r11;aCie;rd0T;!edict,iDjam2nA;ie,y;to;n6rCt;eCy;tt;ey;ar0Yb0Od0Kgust2hm0Hid5ja0Fl00mYnQputsiPrGsaFuDveCya0ziz;ry;gust9st2;us;hi;aJchIi4jun,maGnEon,tCy0;hCu07;ur;av,oC;ld;an,nd;el;ie;ta;aq;dHgel06tC;hoFoC;i8nC;!i03y;ne;ny;reCy;!as,s,w;ir,mCos;ar;an,bePd5eJfGi,lFonEphonIt1vC;aNin;on;so,zo;an,en;onDrC;edQ;so;c,jaFksandEssaFxC;!and3;er;ar,er;ndC;ro;rtI;ni;en;ad,eC;d,t;in;aDolfCri0vik;!o;mCn;!a;dGeFraDuC;!bakr,lfazl;hCm;am;!l;allFel,oulaye,ulC;!lDrahm0;an;ah,o;ah;av,on",
    "FirstName": "true¦aEblair,cCdevBj8k6lashawn,m3nelly,quinn,re2sh0;ay,e0iloh;a,lby;g1ne;ar1el,org0;an;ion,lo;as8e0r9;ls7nyatta,rry;am0ess1ude;ie,m0;ie;an,on;as0heyenne;ey,sidy;lex1ndra,ubr0;ey;is",
    "LastName": "true¦0:2Z;1:36;2:34;3:2A;4:2T;5:2V;a36b2Wc2Jd2Ae27f22g1Wh1Mi1Hj1Bk14l0Wm0Mn0Io0Fp04rXsMtHvFwCxBy8zh6;a6ou,u;ng,o;a6eun2Poshi1Hun;ma6ng;da,guc1Wmo23sh1YzaQ;iao,u;a7il6o4right,u;li36s2;gn0lk0ng,tanabe;a6ivaldi;ssilj32zqu1;a9h8i2Bo7r6sui,urn0;an,ynisI;lst0Mrr1Rth;atch0omps2;kah0Snaka,ylor;aDchCemjon3himizu,iBmiAo9t7u6zabo;ar1lliv25zuD;a6ein0;l1Yrm0;sa,u4;rn3th;lva,mmo1Zngh;midt,neid0ulz;ito,n7sa6to;ki;ch1dLtos,z;amBeag1Vi9o7u6;iz,sD;b6dri1JgIj0Rme20osevelt,ssi,ux;erts,ins2;c6ve0D;ci,hards2;ir1os;aEeAh8ic6ow1W;as6hl0;so;a6illips;m,n1P;ders5et8r7t6;e0Lr3;ez,ry;ers;h1Xrk0t6vl3;el,te0H;baBg09liveiZr6;t6w1K;ega,iz;a6eils2guy5ix2owak,ym1A;gy,ka6;ji6muU;ma;aDeBiAo8u6;ll0n6rr09ssolini,ñ6;oz;lina,oIr6zart;al0Keau,r0R;hhail3ll0;rci0ssi6y0;!er;eVmmad3r6tsu06;in,tin1;aCe8i6op1uo;!n6u;coln,dholm;fe7n0Or6w0I;oy;bv6v6;re;mmy,rs5u;aBennedy,imuAle0Jo8u7wo6;k,n;mar,znets3;bay6vacs;asY;ra;hn,rl9to,ur,zl3;aAen9ha4imen1o6u4;h6nYu4;an6ns2;ss2;ki0Cs5;cks2nsse0B;glesi9ke8noue,shik7to,vano6;u,v;awa;da;as;aBe8itchcock,o7u6;!a4b0ghNynh;a4ffmann,rvat;mingw7nde6rM;rs2;ay;ns5rrPs7y6;asDes;an3hi6;moI;a9il,o8r7u6;o,tierr1;ayli4ub0;m1nzal1;nd6o,rcia;hi;er9lor8o7uj6;ita;st0urni0;es;nand1;d7insteGsposi6vaK;to;is2wards;aBevi,i9omin8u6;bo6rand;is;gu1;az,mitr3;ov;nkula,rw7vi6;es,s;in;aFhBlarkAo6;h5l6op0rbyn,x;em7li6;ns;an;!e;an8e7iu,o6ristens5u4we;i,ng,u4w,y;!n,on6u4;!g;mpb7rt0st6;ro;ell;aBe8ha4oyko,r6yrne;ooks,yant;ng;ck7ethov5nnett;en;er,ham;ch,h8iley,rn6;es,i0;er;k,ng;dDl9nd6;ers6rA;en,on,s2;on;eks7iy8var1;ez;ej6;ev;ams",
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

  const toArray = function (trie) {
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
    return toArray(trie)
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

  // 01- full-word exceptions
  const checkEx = function (str, ex = {}) {
    if (ex.hasOwnProperty(str)) {
      return ex[str]
    }
    return null
  };

  // 02- suffixes that pass our word through
  const checkSame = function (str, same = []) {
    for (let i = 0; i < same.length; i += 1) {
      if (str.endsWith(same[i])) {
        return str
      }
    }
    return null
  };

  // 03- check rules - longest first
  const checkRules = function (str, fwd, both = {}) {
    fwd = fwd || {};
    let max = str.length - 1;
    // look for a matching suffix
    for (let i = max; i >= 1; i -= 1) {
      let size = str.length - i;
      let suff = str.substring(size, str.length);
      // check fwd rules, first
      if (fwd.hasOwnProperty(suff) === true) {
        return str.slice(0, size) + fwd[suff]
      }
      // check shared rules
      if (both.hasOwnProperty(suff) === true) {
        return str.slice(0, size) + both[suff]
      }
    }
    // try a fallback transform
    if (fwd.hasOwnProperty('')) {
      return str += fwd['']
    }
    if (both.hasOwnProperty('')) {
      return str += both['']
    }
    return null
  };

  //sweep-through all suffixes
  const convert = function (str = '', model = {}) {
    // 01- check exceptions
    let out = checkEx(str, model.ex);
    // 02 - check same
    out = out || checkSame(str, model.same);
    // check forward and both rules
    out = out || checkRules(str, model.fwd, model.both);
    //return unchanged
    out = out || str;
    return out
  };
  var convert$1 = convert;

  const flipObj = function (obj) {
    return Object.entries(obj).reduce((h, a) => {
      h[a[1]] = a[0];
      return h
    }, {})
  };

  const reverse = function (model = {}) {
    return {
      reversed: true,
      // keep these two
      both: flipObj(model.both),
      ex: flipObj(model.ex),
      // swap this one in
      fwd: model.rev || {}
    }
  };
  var reverse$1 = reverse;

  const prefix = /^([0-9]+)/;

  const toObject = function (txt) {
    let obj = {};
    txt.split('¦').forEach(str => {
      let [key, vals] = str.split(':');
      vals = (vals || '').split(',');
      vals.forEach(val => {
        obj[val] = key;
      });
    });
    return obj
  };

  const growObject = function (key = '', val = '') {
    val = String(val);
    let m = val.match(prefix);
    if (m === null) {
      return val
    }
    let num = Number(m[1]) || 0;
    let pre = key.substring(0, num);
    let full = pre + val.replace(prefix, '');
    return full
  };

  const unpackOne = function (str) {
    let obj = toObject(str);
    return Object.keys(obj).reduce((h, k) => {
      h[k] = growObject(k, obj[k]);
      return h
    }, {})
  };

  const uncompress = function (model = {}) {
    if (typeof model === 'string') {
      model = JSON.parse(model);
    }
    model.fwd = unpackOne(model.fwd || '');
    model.both = unpackOne(model.both || '');
    model.rev = unpackOne(model.rev || '');
    model.ex = unpackOne(model.ex || '');
    return model
  };
  var uncompress$1 = uncompress;

  // generated in ./lib/models
  var model$1 = {
    "nouns": {
      "plurals": {
        "fwd": "ces:z¦uses:ús¦enes:én¦ases:ás¦oses:ós¦1s:e¦1es:d,j¦1ies:ly¦2es:es,an,as,is,us,os,ir,ls,ss¦2ies:ory¦2as:tuo¦3es:ren,bol,rol,lon,ori,nch,rin,ach¦3as:hico,luco,domo,antum¦3s:pla¦3illos:neco¦4es:lion¦4as:rdido,oteco,cáceo,ijado,ecero,utico,láceo¦4nes:stio¦5as:ntáneo,rújulo",
        "both": "5es:comité,óster,gster,filer,vasar,ínter,éster,uiler,ester,ánter,zúcar,ongol,ráter,aller¦5as:uerizo,illizo,éntico,ianero,rtáceo,terino,cobero,utáceo,diviso,vético,uciano,ensano,egial,iranio,oscano,resero,ginero,onesio,bañero,usiano,canero,ñorito,nésimo,camoso,xterno,ermero,éltico¦5citos:rqueo¦5s:beceo,arará,alaco,inter,áster,rineo,-mail,aster,onsor,rraco,emier,riaco,river,ráneo,eller¦5itos:ochino,zcocho¦5nes:imato,blazo¦5onas:hapera¦5illas:iralda¦4as:máceo,evido,ofano,viero,náceo,naico,gueño,iundo,frido,ptimo,rruso,ncito,olaco,aiano,menco¦4itos:ruque,ntojo,uineo¦4s:nceo,aíta,mper,esla,ppel,word,ysch,dola,yola,oker,aker,maco,tail,ilgo,rsey,oter,nior,vaco,aneo,tter,eneo,uceo,baco,scar,ffer,over,gola,tola,cola,cord,íneo,iola,pola,ampú,sola,caco,aseo,iseo,saco,cceo,uola,ipta,naco,bola,rola,rneo,iceo,íaco,rceo,eseo¦4es:lier,ecar,nker,imut,úsar,lsar,éter,áner,ocar,ésar,lver,áver,iser,wich,stol¦4ones:hasca¦4azos:porro¦4quillas:rranca¦4esas:elonés¦4itas:ctava¦3ones:uata,aspa,visa¦3as:uapo,jimo,uplo,diño,eigo,hato,óneo¦3s:ium,ton,brí,beo,úco,aid,ech,zer,heo,ool,ard,kin,rrí,ger,fla,eur,ndí,óer,meo,geo,vin,jeo,tta,ham,zgo,ain,fta,kgo,lin,dum,our,dem,boy,feo,xta,ueo,teo,reo,cla,eco,mbú,lco,deo,peo,nco,urú,cta,lta,oco,ala,uco,ago,ugo,rgo,ogo,sco,ila,gla,leo,ula,igo,ita,rco,rta,bla,rla,uta,ngo,nta,ego,ela,sgo,lla,ota,ata,sta,ico,eta¦3es:der,far,hem,bur,apú,var,tur,mam,har,col,ien,nol,zol,tem,tch,par,mur,voy,bar,zar,mol,uar,jar,hol,ñar,tar,mer,mar,lub,cer,gur,lar,ñol,dar,iar,sol,nar,ber,gar¦3esas:vanés,eonés¦3er:ied¦2icos:lao¦2s:xa,pá,ná,mú,há,má,fí,fá,lú,dá,ah,ll,mb,nú,ay,ka,om,lm,ko,oa,rn,ao,úa,oo,uo,nd,fa,eb,xo,ya,bo,yo,ua,fo,ga,sa,ba,mo,ío,za,ea,ha,so,na,jo,vo,ía,io,pa,ho,ño,ro,va,ja,ra,da,lo,zo,do,ña,po,to,ca,ma,no,ia¦2ies:try¦2es:úr,íl,úl,tú,hú,gú,ul,sh,dú,il,ey,el,al,or¦2esas:enés,amés¦2itos:ejío¦2itas:nna¦2onotes:ocón¦2is:rry¦1s:f,ó,w,k,p,g,u,t,c,i,é¦1i:eu¦1itas:iíta¦1ares:eá¦1sdalgo:odalgo¦1ies:ky,by,dy,ty¦1íacas:diaco,liaco¦1a:lum¦1ises:bís,nís¦1es:í,x¦1ímenes:rimen¦ómenes:omen¦orums:órum¦s-museo:-museo¦asars:ásar¦anta:ántum¦ítines:itin¦inolonas:ínola¦ólmenes:olmen¦érmenes:ermen¦ijoles:íjol¦íquenes:iquen¦amsters:ámster¦unes:ún¦acteres:ácter¦ánones:anon¦órdenes:orden¦ámenes:amen¦úmenes:umen¦árgenes:argen¦óvenes:oven¦írgenes:irgen¦egímenes:égimen¦ágenes:agen¦ines:ín¦anes:án¦eses:és¦ígenes:igen¦ones:ón",
        "rev": "1:ns,úes,ds,bs,ís¦2:ves,úos,ades,udes,íses,jes,ues,edes,eos,oes,ges,fes,pes,údes,zes,gos,ües,kes,obitos,ems,ees¦3:lces,lles,ntes,bres,ides,abes,rtes,ndes,dres,ates,jeres,rdes,etes,lmes,olas,ldes,cies,stes,bles,rmes,gles,cles,tires,rnes,nses,mbes,tres,acos,palitos,fles,pses,bumes,rbes,seres,rres,gres,corcillos,cres,ltes,nces,gies,rces,pires,ymes,omes,snes,ieses,mires,ytes,ibes,hires,cires,lers,sires,ples,sers,imes,leres,guses,pies,olazos,tars,fres,malotes,feres,zles,ieres,ebes,ttes,dides,asses,yeres,lides,xires¦4:agotes,lites,auces,lases,elojes,oches,aches,íboles,rches,dotes,eites,éboles,aroles,nades,ctoras,lches,troles,yotes,uites,derazos,rotes,idoras,steres,eches,fumes,uches,botes,dobes,rames,llyes,doles,wares,peres,dites,oplas,nches,yades,hiles,vases,bases,pites,fites,esses,óganes,fases,remes,aories,eroles,fices,zines,aires,sites,eotes,sames,rcajes,rutes,uries,cotes,izcos,eases,podes,laces,jotes,potes,fames,iotes,totes,audes,íades,oaches,vites,edoras¦5:ímites,railes,iliones,zadoras,sfiles,liches,ámites,padoras,balses,rtices,igotes,obites,ngotes,slotes,ocines,sadoras,amotes,matíes,viches,ódices,plices,íteres,elotes,eleles,olotes,ilotes,erniones,árboles,astrones,árices,oolies,venires,eadoras,ílices,élices,piches¦áter:aters¦cio:tzios¦1z:eces,íces¦1ús:buses¦1én:cenes,henes,jenes,lenes,tenes¦1ás:pases¦1a:jonas,nuchas¦1ós:doses¦2z:rices,voces,races,ruces,luces,faces,nices,roces,paces,foces,taces,buces,duces,iaces¦2o:aficos,pletas,anazos,acitos¦2én:ogenes,ndenes,ivenes,arenes,sdenes¦2a:llejas,uditas,ilotas,llitas,acitas¦2y:llies¦2ós:dioses¦2ón:otoncillos,isonas¦3z:apices,atices,cuaces,rdices,ápices,elices,slices¦3o:ocias,iudas,orditas¦3és:andesas¦3a:risones,legones,tadillas,linicas¦3e:ibritos,aquitos¦3ón:loronas¦4z:endices¦4o:buelas,inadas,ciadas,njeras,rdomas,ubanas,itanas,rianas,uradas,ocitas,osivas,treras,ereras,uillazos,ófilas,tentas,nianas¦4a:parretas¦4um:uantas¦5o:rimeras,tónicas,egiadas,sajeras,dicadas,osteras,uidadas,melucas,erdidas,leteras,licanas,rtarias,itarias,hijadas,veceras,oláceas,atarias,ibradas,deradas,oniadas,biáceas,igiosas,rnarias",
        "ex": "órdenes:orden¦anulocitos:ánulo¦slogans:eslogan¦5es:fagot,mujer,álbum,láser,éster,árbol¦3s:dúo,eco,ala,fan,ola,reo,led,son,pin,pub,ego,rad,fon,rem,job,pie,ole,ene,ale,ele,pre,eme,ace,ere¦4es:país,tabú,éter,bort,ayer,tren,plan,gris,clan,dios,flan,clon,vals,inch,crin¦1es:d,a,b,c¦8s:coetáneo,arahuaco,thriller,pellizco,rubiáceo,apéndice,almohade,hugonote,espádice,arúspice,desguace¦4s:saco,cola,isla,taco,bola,paco,spin,aseo,star,gola,cine,aire,dote,nube,base,fase,roce,pase,pene,sede,bote,pose,lote,vale,mote,kame,dele,goce,duce,lame,ñame,pote,ñire,nene¦3es:ser,par,fin,mar,don,rol,bar,gen,gol,ion,yen,lar,col,mol,lord,non,zar,sol,tar,ron,mes,gas,bus,dos,tos,vid,pan,ros,res,can,mir,lid,lis,bis,gis,kan,jan,mas¦1s:i,o¦5s:museo,esquí,máser,serie,baile,frase,peine,íbice,azote,ápice,elote,prole,trole,apure¦2as:tío¦4as:chino,socio,ciego,libio,viudo,vasco,amado,manco,tosco,chico,fatuo¦6as:primero,costero,mandado,soriano,librado,partero¦8as:curandero,britónico,lanzador,argentino,mensajero,trepador,iluminado,buscador,sardinero,levantino,acusador,seductor,billetero,reumático,implosivo,cantonero,anglicano,narrador,salitrero,sevillano,chupador,ordinario,cortador,prometido,costalero,apoderado,vadeador,fresador,tostador,saltador,esdrújulo,salicáceo¦10as:computador,asegurador,recolector,perjudicado,competidor,maquilador,desmesurado,obligatorio,ilustrador,quinceañero,endemoniado,planchador,euforbiáceo,irreligioso,preparador,perforador,acarreador,expendedor¦5as:abuelo,calero,cubano,gitano,mocito,casero,lotero,cerero¦11as:desaparecido,privilegiado,alimentador,presentador,continuador,radioemisor,montenegrino,farmacéutico,ranunculáceo¦5itos:nopal¦7as:conífero,asociado,africano,discreto,unitario,celador,maderero,hotelero,pedófilo,flechero,batidor,truchero,contento,heladero,ranchero,gracioso,zapoteco¦3as:mulo,majo,cojo¦2s:do,ca,ro,ba,fa,re,ve,ye,fe¦9s:crustáceo,cachalote,congénere,subíndice,hipérbole,abertzale¦6zos:cadera¦9as:valenciano,extranjero,despectivo,excavador,descuidado,denunciado,libertario,ordeñador,marisquero,envasador,cavernario,bostoniano,espontáneo,primuláceo¦7s:cetáceo,trailer,hidalgo,bellaco,cofrade,fetiche,brulote¦5cillos:picor¦4nes:jugo,biso¦13as:neutralizador,extorsionador¦4icos:grafo¦3illas:mota,jara¦6esas:irlandés¦4ones:prisa,penta,guija¦5ones:talega¦4ejas:calla¦6uelos:montero¦6illas:sentada¦3itas:ruda,taca¦5etas:triplo¦1aters:wáter,páter¦1etes:té¦3itos:mero,lob¦3ones:faca,luge,mará,erre¦4etas:serpa¦6etas:caparra¦9esas:norirlandés¦12as:metropolitano,consignatario¦9es:bachiller,canciller¦6azos:campano¦4itas:gordo¦4onas:guaja,llorón,frisón¦1ones:ce¦1azas:n¦3tzios:hercio¦4itos:libre,braco,taque,talle¦9nes:cuaternio,alabastro¦3otas:hila¦3uchas:pana¦1ucas:m,l,r¦8zos:cacerola¦2ones:cha¦1ejos:no¦2es:ch,as¦6itas:canilla¦7azos:taquillo¦6s:atraco,índice,afiche,chisme,marine,palote,pegote¦4tos:torio¦5otes:camal¦5itas:canana¦6es:chófer,somier¦4icas:clina¦3oncillos:botón¦3illos:jopo¦2ces:voz,luz,paz,coz,haz,hoz,faz¦3ies:tory¦4ces:cáliz¦5illos:caneco¦8nes:quaestio¦11s:superíndice"
      }
    },
    "adjectives": {
      "f": {
        "fwd": "ana:án¦ona:ón¦ina:ín¦a:e¦1a:r,z,l¦1ológica:cólogo¦2a:en,ptísimo,enísimo,obito,mbito¦3ia:marísimo",
        "both": "4ita:oreno¦3íaca:legiaco¦3ísima:iejo¦2ofílica:drófilo¦ófita:ofítico¦ultiplaza:últiplo¦osofica:ósofo¦artarica:ártaro¦esa:és¦a:o",
        "rev": "2:uza¦3:ñola,tora,sora,iala,ñora¦4:imera,rcera,adora,edora,idora¦1ón:eona,jona,iona,pona,mona,lona,cona,ñona,sona,zona¦1o:nilla,silla¦2án:emana,lmana¦2o:agica,anica¦2ón:etona,drona,rrona,orona,utona¦3án:talana¦3ín:larina,darina,tarina¦3ísimo:mena,octa¦3e:nota¦3ito:amba¦4ólogo:usicológica¦5ísimo:brupta¦5ín:lorquina",
        "ex": "3ica:mago¦3illa:pino,paso¦4a:doctísimo,buen¦6ica:britano¦6ana:guardián¦5ia:sumarísimo¦3a:bobito"
      },
      "mp": {
        "fwd": "s:¦1os:nísimo¦1ológicos:cólogo¦2os:er,ptísimo,obito¦2ios:arísimo",
        "both": "4tes:horo¦3os:ambito,uen¦3icos:sofo¦2íacos:egiaco¦2ofílicos:trófilo¦1es:r,l¦ines:ín¦ones:ón¦havos:tavo¦ces:z¦anes:án¦eses:és",
        "rev": "2:mos,dos,ios,gos,los,jos,sos,eos,ros,uos,íos,ños,hos,yos,xos,fos,pos,kos,nones¦3:rnos,ltos,rtos,ntos,ncos,etos,anos,inos,ivos,ecos,utos,atos,ocos,stos,ctos,rcos,xtos,scos,otos,izos,gnos,onos,ptos,rvos,unos,ucos,evos,ínos,lvos,zcos,lzos,rzos,ozos¦4:imeros,nicos,rceros,sicos,picos,lenos,ticos,dicos,gicos,micos,ricos,jenos,nitos,iacos,hitos,uicos,aicos,bicos,lavos,ravos,sitos,sacos,ditos,bitos,venos,hicos,genos,pacos,ritos,eicos,titos,cicos,jicos,cenos,oicos,renos,davos,notes,henos,fobos,ombos,nacos,xicos¦5:blicos,íficos,áficos,óficos,ólicos,díacos,ícitos,ívicos,éficos,inavos,clicos,ólitos,níacos,álicos,ovacos,élicos,spitos,rficos,ómitos¦o:azos¦1o:guitos¦3ísimo:menos,octos¦3o:acitos",
        "ex": "4uitos:amigo¦4os:doctísimo¦3azos:lato¦4tos:lacio¦4nes:cano¦4s:rico,sito¦6s:polaco,tácito¦8s:gratuito,cirílico,acrílico,fortuito,chiquito¦10s:hidráulico¦9s:policíaco,austríaco¦6os:abruptísimo¦7s:epífito,cóncavo,pélvico,idílico,etílico,celíaco¦5ios:sumarísimo¦5s:flaco¦3os:bobito¦11s:paradisíaco¦5ológicos:musicólogo"
      },
      "fp": {
        "fwd": "anas:án¦onas:ón¦inas:ín¦as:e¦1as:r,z,l¦1ológicas:cólogo¦2as:en,ptísimo,enísimo,obito¦3ias:marísimo",
        "both": "4ísimas:rboso¦4ecillas:uerdo¦3as:ambito¦2ofílicas:drófilo¦2ucas:lmo¦2onímicas:inónimo¦1íacas:giaco¦ófitas:ofítico¦ultiplazas:últiplo¦havas:tavo¦esas:és¦as:o",
        "rev": "2:uzas¦3:ñolas,toras,soras,ialas,ñoras¦4:imeras,rceras,adoras,edoras,idoras¦1ón:eonas,jonas,ionas,ponas,monas,lonas,conas,ñonas,sonas,zonas¦1o:dejas¦2án:emanas,lmanas¦2o:anitas,rditas,agicas,olitas¦2ón:etonas,dronas,rronas,oronas,utonas¦3án:talanas¦3ín:larinas,darinas,tarinas¦3ísimo:menas,octas¦3e:notas¦4ólogo:usicológicas¦5ísimo:bruptas¦5ín:lorquinas",
        "ex": "3itas:vano¦4itas:gordo,cholo¦3icas:mago¦4as:doctísimo,buen¦4ejas:tordo¦6anas:guardián¦5ias:sumarísimo¦3as:bobito"
      }
    },
    "presentTense": {
      "first": {
        "fwd": "o:ar,uer¦ierto:ertir¦jo:ger¦ido:edir¦ío:eír¦uestro:ostrar¦igo:ecir,eguir¦ijo:egir¦uedo:oder¦uerzo:orzar¦uelo:oler¦ulo:olir¦uyo:üir¦ibo:ebir¦ierno:ernir¦ubro:obrir¦imo:emir¦isto:estir¦uerdo:order¦onho:ôr¦icto:ectir¦indo:endir¦1go:ner,izer¦1o:per,rer,eer,mer,ñer,her,ser,zir,xer,jer¦1ito:retir,petir¦1jo:igir,ngir,agir,ugir¦1iento:lentar¦1iero:uerir¦1uevo:mover¦1ço:azer¦1zo:rcir¦2o:eber,imir,frir,nguir,idir,ivir,umir,udir,itir,ubir,atir,rrir,plir,adir,upir,ater,rber,eder,rter,roer,ozer,prir,inir,grir,utir,lpir,odir,rver,irir,mber,trir,iver,mbir¦2go:aler,alir¦2ço:mecer¦3o:onder,istir,artir,cibir,undir,urtir,antir,indir,letir,peler¦4o:cubrir,rreter,vender",
        "both": "5o:acender,etender,ssolver,iminuir,bsolver¦5ço:ertencer,ouquecer,lvorecer¦5enho:ntervir¦5zco:avorecer,ndurecer,laquecer¦5io:faquear,ncadear,elinear,bandear,icotear¦5jo:ntever¦5yo:sminuir¦4iendo:rascender¦4jo:umergir¦4o:orrir,pandir,eender,xhibir,pender,render¦4ço:andecer,ferecer,squecer,furecer,impedir,odrecer,ortecer¦4io:efrear,entear,rasear,errear,hatear¦4zco:valecer,ellecer,talecer,iquecer,tenecer,ontecer,lorecer¦4nho:anter¦4go:rvenir,nvenir¦4zo:nvencer¦4yo:nfluir¦3o:fruir,abrir,udrir,umpir,nibir,xibir,oluir,ullir,ruñir,ribir,rever,meter¦3io:acear,emear,ecear,ssear,omear,usear,mpear,lsear,stear,oxear,arear¦3nho:ster,bter¦3iro:querer¦3úo:petuar,entuar¦3ço:rnecer,elecer,grecer,torcer,etecer,olecer,doecer,rrecer¦3zco:rpecer,ejecer,frecer,anecer,blecer,arecer¦3ío:nfriar,esviar,squiar¦3yo:iluir,cluir¦3iego:splegar¦3iero:referir¦3zo:jercer¦3iendo:escender¦3iento:onsentir¦2irjo/submerjo:bmergir¦2iento:eventar,ecentar,esentir¦2ienso:epensar¦2enho:ovir¦2ino:evenir¦2into:ssentir¦2o:suir,air¦2úo:ctuar,aduar¦2iro:ngerir,igerir¦2io:hear,gear,zear,bear¦2ío:spiar,afiar,pliar¦2iendo:nmendar,efender,omendar,ncender,ntender,xtender¦2yo:tuir,ruir¦2ierro:nterrar¦2ço:hecer,fecer¦2uerdo:ncordar,ecordar¦2zco:lacer,nocer,nacer,decer¦2iero:dherir¦2íbo:ohibir¦2jo:urgir¦2ieso:nfesar¦2uevo:enovar¦2go:hacer,facer¦2ierno:obernar¦2iezo:opezar,mpezar¦2ierto:spertar¦1úno:eunir¦1íbo:oibir¦1ço/oiço:uvir¦1iesto:festar¦1iro:serir,ferir,derir¦1úo:luar,nuar¦1ízo:aizar¦1ueso/engroso:rosar¦1ierro:cerrar¦1into:mentir¦1ço:scer¦1irjo:vergir¦1nho:or¦1ierto:certar¦1ieso:vesar¦1iento:pentir¦1úso:husar¦1uebo:robar¦1igo:aer¦1uesto:postar¦1iendo:rendar¦1zco:ucir¦uelco:olcar¦usso:ossir¦iemblo:emblar¦e muevo:overse¦ei:aver¦urco:orquir¦ispo:espir¦üenzo:onzar¦ierdo:erder¦uero:orir¦uelgo:olgar¦ueño:oñar¦iño:eñir¦uermo:ormir¦ienzo:enzar",
        "rev": "egar:iego¦ensar:ienso¦errar:ierro¦ostar:uesto¦ebrar:iebro¦orar:üero¦olver:uelvo¦ervir:irvo,iervo¦ontrar:uentro¦uar:úo,úo/adecuo¦elar:ielo¦etar:ieto¦onar:ueno¦aber:é,e¦islar:íslo¦ocer:uezo¦ergir:irjo/emerjo¦iar:ío/palio¦oblar:ueblo¦er:o/roigo¦udar:údo¦embrar:iembro¦oldar:ueldo¦oltar:uelto¦1cer:azco,ezco¦1ertir:vierto¦1edir:pido,rido¦1iar:fío,vío,cío,uío¦1ar:eo,fo,toy,xo,oo¦1ordar:cuerdo¦1eguir:sigo¦1ir:uyo¦1ostrar:muestro¦1orzar:muerzo,fuerzo¦1ender:tiendo,ciendo¦1erir:giero¦1üir:guyo¦1oler:muelo¦1ernir:cierno¦1ectir:licto¦2ar:ico,apo,cio,dio,uco,izo,ulo,ilo,aso,ito,rlo,oro,eco,uso,cho,oco,ugo,oyo,año,ipo,aro,amo,pio,oto,iso,alo,gro,clo,uro,olo,ato,vio,sco,guo,smo,ono,ano,glo,obo,azo,abo,rgo,uto,aco,lmo,lho,ivo,pto,oço,ogo,fio,avo,nco,lzo,muo,sio,oio,ovo,sgo,xio,bio,tuo,seio,ueio,lço,flo,hio,upo,pso,gno,rso,lso,nro,gio,mio,ayo,zio,rpo,juo,zgo,vro,uvo,cro,sno,uço,nio,epo¦2er:ongo¦2eír:nrío¦2gir:xijo,injo,oajo,eajo,dijo¦2ecir:edigo,adigo,ldigo¦2erir:quiero¦2ger:cojo¦2etir:mpito,epito¦2egir:rrijo¦2cer:ueço,erço,leço,teço¦2ebir:ncibo¦2ir:uzo,buo¦2over:nmuevo,omuevo,emuevo¦2r:tenho,leio¦2zer:faço¦2obrir:ncubro¦2cir:arzo¦2estir:nvisto¦3ar:asto,reso,anso,illo,orto,fado,ulto,lego,vido,piro,unto,tino,nejo,alto,anto,adro,ligo,pago,leno,ordo,mino,orno,cino,pero,seño,erco,ormo,yudo,anzo,uemo,rado,ollo,eino,ampo,irmo,allo,nojo,velo,uido,helo,ardo,oblo,obro,uejo,alvo,arco,rago,redo,bajo,iajo,timo,vego,peto,usto,orco,raço,rigo,lero,esso,modo,oplo,inho,ecto,lojo,rego,judo,anço,gemo,ieno,ceno,asso,onto,alpo,itro,rejo,zeno,cado,gaço,ombo,rumo,sino,tajo,isso,tiço,ilio,unço,eijo,cejo,ibro,hego,ifro,bino,gino,ungo,gelo,dero,nsto,acto,deno,etro,urvo,lino,bero,rubo,nimo,sejo,maio,nudo,pejo,rezo,arço,ulgo,reno,levo,ueto,pujo,bezo,arno,cero,osto,osso,gajo,ablo,bozo,olto,frio,irro,tiro,relo,tudo,nero,ltro,orjo,anho,pedo,atro,tuno,cubo,dago,jeto,tigo,mido,dino,islo,impo,telo,delo,oldo,bsto,pino,airo,eido,vero,urbo,ceso,feso,eimo,aspo,alco,crio,gero,zijo,tero,nego,poso,aldo,tomo,viro,oubo,ello,peso,sego,unho,lado,rino,ango¦3ir:rimo,ufro,sumo,ñado,cudo,uado,vado,lodo,utro,sido,dimo,salgo,uplo¦3er:tengo,cedo,orvo,rroo,olvo,bebo,cebo,oseo,oveo,ofro¦3r:eveo,evejo¦3gir:flijo,irijo,olijo¦3cer:rmeço,ureço¦4ger:rotejo,tranjo¦4ar:testo,ustro,rindo,ayuno,servo,dmiro,ompro,horro,ivino,ibujo,mento,vento,umbro,fermo,tento,uisto,ncelo,vacuo,lebro,rando,cento,dequo,gento,garro,hondo,astro,lerto,listo,terno,lvejo,meaço,gario,perto,sento,bento,resto,ombro,terro,valio,sfemo,rimbo,heiro,humbo,mando,penso,nfino,serto,rario,rtejo,creto,eleto,nstro,rribo,marro,mpeño,orajo,spego,pisto,ucido,ebedo,mendo,penho,cauzo,rrujo,endro,nsaio,umero,gonho,barro,smago,cerbo,stejo,verno,berno,culco,nundo,nvejo,berto,istro,denho,elejo,caudo,ontro,flejo,forço,gisto,talio,surro,opeço,acuno,alido¦4uir:tingo¦4er:pondo,condo,fendo,sorbo,cendo,corro,nvivo,colho,premo,tendo,verto,encho,epelo¦4ir:sisto,dmito,mbato,burro,rmito,umplo,laudo,scupo,quiro,ncido,curro,umpro,iludo,ivido,xisto,cindo,emito,tituo,smito¦4cer:remeço¦4gir:terajo¦4r:rovejo¦5ar:rpreto,olesto,arreto,guento,ordaço,ofundo,rranjo,rruino,ropelo,avalgo,amingo,mpleto,templo,fraudo,esarmo,esenho,erdiço,svendo,belezo,mpurro,ncurto,frento,samblo,smurro,stupro,quento,riento,olongo,começo,lembro¦5ir:revivo,scubro,mparto,nfundo,ifundo,iscuto,aranto,ercibo,defino,efleto,eparto,ucumbo¦5er:erreto,rrompo,evendo",
        "ex": "voy:ir¦yerro:errar¦huelo:oler¦quepo:caber¦me acuesto:acostarse¦me afilio:afiliarse¦me alejo:alejarse¦me caso:casarse¦me decido:decidirse¦me levanto:levantarse¦me olvido:olvidarse¦me preocupo:preocuparse¦me quedo:quedarse¦me quejo:quejarse¦me retiro:retirarse¦me siento:sentarse¦me suicido:suicidarse¦2zco:yacer,nacer¦1oy:ser,dar¦1iego:negar,regar¦4ío:confiar¦1ienso:pensar¦3zco:crecer¦1uerzo:torcer,forzar¦1ierro:cerrar,serrar¦1uesto:costar¦3ío:enviar,variar,vaciar,rociar¦2o:unir,ver,moer,rir,usar,amar,leer,arar,asar,atar,içar,izar,orar,suar¦2iebro:quebrar¦2iero:querer¦2üero:agorar¦3o:meter,abrir,arder,dever,punir,dejar,beber,andar,vivir,cenar,pagar,pesar,bajar,nadar,mudar,temer,creer,rezar,subir,tomar,fijar,tirar,comer,dudar,cesar,batir,tañer,mirar,deber,untar,fumar,besar,pegar,aliar,arcar,armar,assar,caçar,cagar,ceder,cegar,coser,cozer,domar,erguer,feder,gelar,gemer,gerar,gozar,lamer,latir,lesar,levar,lidar,ligar,mexer,mijar,mimar,minar,mojar,nevar,obrar,pelar,pirar,podar,posar,remar,rimar,selar,somar,sudar,sujar,sumar,tejer,vagar,velar,vetar,virar,zelar¦3uelvo:resolver,devolver,disolver,envolver,revolver¦2uerdo:acordar¦2go:hacer¦1irvo:servir¦2ío:criar,guiar,freír¦2ego:jugar¦1iento:sentar,mentir,tentar¦1igo:oír,seguir,decir¦1uelo:volar,soler,doler,moler¦1iero:herir¦3uentro:encontrar¦2yo:huir¦3go:venir,tener,valer,salir¦5o:prever,ofender,acender,decidir,arrojar,saludar,recibir,afundar,alarmar,alongar,apartar,avistar,buzinar,centrar,coletar,colidir,começar,cotejar,debater,definir,dimitir,dizimar,encajar,encetar,incutir,lembrar,refinar,relajar,reviver¦3úo:situar¦4o:vender,cubrir,cuspir,render,mandar,pintar,romper,barrer,correr,culpar,entrar,quedar,cruzar,borrar,abater,acosar,acuñar,afetar,afinar,alejar,aludir,apelar,berrar,colher,cremar,curtir,dictar,eludir,emitir,encher,eximir,exumar,ferrar,ferver,forçar,fundar,furtar,herdar,hundir,iludir,jorrar,lamber,listar,morrer,narrar,omitir,partir,pingar,recuar,restar,sondar,sonhar,soprar,suprir,surtar,tensar,testar,tremer,tumbar,varrer,vingar,xingar¦1uevo:mover¦1uego:rogar¦1ielo:helar¦2uesto:acostar¦3ieto:apretar¦1ueno:sonar¦8yo:distribuir,contribuir¦1uelvo:volver¦2iendo:atender¦1é:saber¦3zo:vencer¦1uento:contar¦3oy:estar¦1iervo:hervir¦3iero:sugerir¦4zco:merecer,perecer¦6zco:abastecer,oscurecer¦4úo/adecuo:adecuar¦4yo:afluir¦1jo:agir¦1íslo:aislar¦7ço:amadurecer,obscurecer¦4ço:aquecer,exercer,falecer¦3iendo:ascender¦2iento:asentar,alentar¦6yo:atribuir¦1úno:aunar¦4io:basear,reler¦7io:branquear¦1uezo:cocer¦5nho:conter¦3io:crer,frear¦3iego:denegar¦9o:desenvolver,transcender,entrevistar¦4nho:deter,reter¦2irjo/emerjo:emergir¦8ço:enfraquecer,reabastecer¦7nho:entreter¦6ço:escurecer¦6o:estender,denegrir,esculpir,mendigar¦5io:estrear,vaguear¦1iro:ferir,gerir¦3yo:fluir¦2iego:fregar,plegar¦1e:haber¦2io:ler¦3ío/palio:paliar¦1ueblo:poblar¦5jo:prover,abranger¦7o:retribuir,aproximar,descartar,desculpar,destrozar,disculpar,endereçar,envenenar,salientar¦4jo:rever,emerger¦1uedo:rodar,poder¦2o/roigo:roer¦2údo:saudar¦1iembro:sembrar¦1ueldo:soldar¦1uelto:soltar¦8o:substituir,arredondar,concentrar,consolidar,desmembrar,orquestrar,repercutir,secuestrar,sequestrar¦2ço:tecer,fazer¦1iendo:tender¦2nho:ter¦1ierto:verter¦1enho:vir¦1ijo:regir¦4ito:derretir¦1uestro:mostrar¦1ido:medir,pedir¦3iento:calentar¦4igo:bendecir¦2jo:coger,fugir,reger,rugir,ungir¦2ijo:elegir¦1ío:reír¦1isto:vestir¦2ulo:abolir¦5go:condizer¦5iento:desalentar¦3jo:eleger,erigir,ranger¦3ulo:engolir¦1imo:gemir¦1uerdo:morder¦1ulo:polir¦1onho:pôr¦2imo:premir¦1indo:rendir¦3isto:revestir"
      },
      "second": {
        "fwd": "iges:egir¦ides:edir¦uestras:ostrar¦ienes:ener¦ueres:orir¦uyes:üir¦ibes:ebir¦ás:aver¦ões:ôr¦indes:endir¦1ientas:lentar¦1ieres:uerir¦1es:lir,zir,sir¦2es:frir,idir,ivir,itir,ngir,atir,igir,inir,rcir,mpir,mbir¦3es:cibir,remir,indir",
        "both": "5es:ssentir,deferir,impedir¦5éns:ntervir¦5ias:faquear,elinear,bandear,icotear¦5yes:sminuir¦4es:sferir,oferir,rferir,ngerir,iferir,mentir,nferir,xhibir¦4ias:efrear,entear,rasear,errear,cadear,ustear,hatear¦4es/exturques:orquir¦4éns:treter¦4ês:ntever¦3ias:guear,acear,emear,ecear,ssear,omear,usear,mpear,lsear,arear¦3es:letir,nibir,antir,andir,oluir,espir,urtir,undir,derir,cupir,artir,urrir,ruñir,ribir,nguir¦3ês:rover¦3úas:petuar,entuar¦3ienes:ervenir¦3ías:nfriar,safiar,mpliar¦3yes:iluir,cluir,fluir,truir¦3ieres:referir¦3iendes:escender¦3ientes:resentir¦2éns:ster,ovir,bter,nter¦2istes:evestir¦2ientas:eventar,ecentar¦2iensas:epensar¦2es:ctir,uvir,trir,odir,lpir,utir,grir,prir,agir,udir,irir,ucir,adir,brir,rgir,stir,umir,imir¦2ines:evenir¦2ias:gear,hear,xear,zear,bear¦2iendas:nmendar,omendar¦2ías:sviar,nviar¦2ierras:nterrar¦2uerdas:ncordar¦2iegas:plegar¦2igues:oseguir,rseguir,nseguir¦2íbes:ohibir¦2uelves:evolver,esolver¦2ienes:nvenir¦2úas:ctuar¦2iesas:nfesar¦2uevas:enovar¦2iendes:ncender,xtender¦2iernas:obernar¦2iertas:spertar¦2ientes:nsentir¦1únes:eunir¦1íbes:oibir¦1iestas:festar¦1úas:luar,nuar,duar¦1ízas:aizar¦1uesas/engrosas:rosar¦1ierras:cerrar¦1óis:roer¦1ueves:mover¦1iendas:rendar¦1ieres:herir¦1iertas:certar¦1iesas:vesar¦1ientes:pentir¦1ites:petir,retir¦1úsas:husar¦1uebas:robar¦1uestas:postar¦1iebras:uebrar¦1iezas:pezar¦1ías:uiar¦uelcas:olcar¦iemblas:emblar¦uerdes:order¦iernes:ernir¦ospes:uspir¦ões:or¦üenzas:onzar¦ueles:oler¦ierdes:erder¦uerzas:orzar¦uelgas:olgar¦ices:ecir¦iñes:eñir¦uermes:ormir¦íes:eír¦iertes:ertir¦ienzas:enzar¦s:r",
        "rev": "egar:iegas¦iar:ías,ías/palias¦ir:yes¦orcer:uerces¦ostar:uestas¦orar:üeras¦ervir:irves,ierves¦oñar:ueñas¦olar:uelas¦ender:iendes¦er:és,ês¦uar:úas,úas/adecuas¦over:ueves¦oder:uedes¦entir:ientes¦elar:ielas¦eguir:igues¦onar:uenas¦olver:uelves¦islar:íslas¦unar:únas¦oer:óis¦oblar:ueblas¦udar:údas¦embrar:iembras¦oldar:ueldas¦1edir:pides,rides¦1ordar:cuerdas¦1ener:tienes¦1ontrar:cuentras¦1ostrar:muestras¦1etar:rietas¦1ar:tás,eias¦1erir:gieres¦1entar:sientas¦1er:téns¦2erir:quieres¦2ir:ubes,lles,ples,ares,uzes,oles,dres,uges,sses¦2egir:rriges¦2üir:rguyes¦2ebir:ncibes¦3ir:ufres,xiges,cides,mites,inges,feres,lides,fines,geres,arces,seres,umpes,sides,diges,sales,umbes¦4ir:mbates,fliges,iriges,oliges,ivides,rcibes,cindes¦5ir:revives,ssegues",
        "ex": "vas:ir¦eres:ser¦yerras:errar¦hueles:oler¦te acuestas:acostarse¦te afilias:afiliarse¦te alejas:alejarse¦te casas:casarse¦te decides:decidirse¦te levantas:levantarse¦te mueves:moverse¦te olvidas:olvidarse¦te preocupas:preocuparse¦te quedas:quedarse¦te quejas:quejarse¦te retiras:retirarse¦te sientas:sentarse¦te suicidas:suicidarse¦1iegas:negar,regar¦4ías:confiar¦8yes:constituir,distribuir,contribuir¦1iensas:pensar¦1uerces:torcer¦1ierras:cerrar,serrar¦1uestas:costar¦2es:unir,agir¦2ieres:querer¦2üeras:agorar¦2uerdas:acordar¦1irves:servir¦2ías:criar¦1ueñas:soñar¦2egas:jugar¦1ientas:sentar,tentar¦3ías:variar,vaciar,espiar,rociar¦1yes:oír¦1uelas:volar¦1ieres:herir¦3iendes:entender,defender,ascender¦3uentras:encontrar¦2yes:huir¦1ienes:venir,tener¦4és:prever¦3úas:situar¦7yes:sustituir,destituir,instituir,restituir¦3es:subir,parir,ferir,gerir,punir,rugir,vivir,salir,batir,latir,ungir¦1ueves:mover¦1uegas:rogar¦1uedes:poder¦3uerdas:recordar¦1ientes:sentir,mentir¦1ielas:helar¦2uestas:acostar¦3ietas:apretar¦1igues:seguir¦1uenas:sonar¦1uelves:volver¦2iendes:atender¦1uentas:contar¦3ás:estar¦1istes:vestir¦1ierves:hervir¦3ieres:sugerir¦4úas/adecuas:adecuar¦4es:aferir,exibir,pudrir,erigir,premir¦1íslas:aislar¦2ientas:asentar,alentar¦6yes:atribuir¦1únas:aunar¦4ias:basear¦7ias:branquear¦1ueces:cocer¦2ês:crer¦3iegas:denegar¦3éns:deter,reter¦5es:digerir,inserir,referir,recibir¦3uelves:disolver,envolver¦5ias:estrear¦3yes:fluir¦3ias:frear¦2iegas:fregar,plegar¦1oges:fugir¦1imes:gemir¦2s:haber¦1ês:ler¦1óis:moer¦3ías/palias:paliar¦1ueblas:poblar¦1ules:polir¦8es:prosseguir¦10yes:reconstituir¦3ês:reler,rever¦1uedas:rodar¦2údas:saudar¦1iembras:sembrar¦1ueldas:soldar¦1ueltas:soltar¦1iendes:tender¦2ns:ter¦5iendes:trascender¦1iertes:verter¦1ens:vir¦1iges:regir¦1uestras:mostrar¦1ides:medir,pedir¦3ientas:calentar¦2iges:elegir¦1ueres:morir¦5ientas:desalentar¦1ás:haver¦1ões:pôr¦1indes:rendir"
      },
      "third": {
        "fwd": "1:zir¦ige:egir¦ide:edir¦uestra:ostrar¦iene:ener¦uye:üir¦ibe:ebir¦á:aver¦õe:ôr¦inde:endir¦1ienta:lentar¦1iere:uerir¦1e:lir,sir¦2e:frir,idir,ivir,itir,ngir,atir,igir,inir,rcir,mpir,mbir¦3e:cibir,remir,indir",
        "both": "2:izer,azer¦4:querer¦5e:ssentir,deferir,impedir¦5ém:ntervir¦5ia:faquear,elinear,bandear,icotear¦5ye:sminuir¦4e:sferir,oferir,rferir,ngerir,iferir,mentir,nferir,xhibir¦4ia:efrear,entear,rasear,errear,cadear,ustear,hatear¦4e/exturque:orquir¦4ém:treter¦4ê:ntever¦3ia:guear,acear,emear,ecear,ssear,omear,usear,mpear,lsear,arear¦3e:letir,nibir,antir,andir,oluir,espir,urtir,undir,derir,cupir,artir,urrir,ruñir,ribir,nguir¦3ê:rover¦3úa:petuar,entuar¦3iene:ervenir¦3ía:nfriar,safiar,mpliar¦3ye:iluir,cluir,fluir,truir¦3iere:referir¦3iende:escender¦3iente:resentir¦2ém:ster,ovir,bter,nter¦2iste:evestir¦2ienta:eventar,ecentar¦2iensa:epensar¦2e:ctir,uvir,trir,odir,lpir,utir,grir,prir,agir,udir,irir,ucir,adir,brir,rgir,stir,umir,imir¦2ine:evenir¦2ia:gear,hear,xear,zear,bear¦2ienda:nmendar,omendar¦2ía:sviar,nviar¦2ierra:nterrar¦2uerda:ncordar¦2iega:plegar¦2igue:oseguir,rseguir,nseguir¦2íbe:ohibir¦2uelve:evolver,esolver¦2iene:nvenir¦2úa:ctuar¦2iesa:nfesar¦2ueva:enovar¦2iende:ncender,xtender¦2ierna:obernar¦2ierta:spertar¦2iente:nsentir¦1úne:eunir¦1íbe:oibir¦1iesta:festar¦1úa:luar,nuar,duar¦1íza:aizar¦1uesa/engrosa:rosar¦1ierra:cerrar¦1ói:roer¦1ueve:mover¦1ienda:rendar¦1iere:herir¦1ierta:certar¦1iesa:vesar¦1iente:pentir¦1ite:petir,retir¦1úsa:husar¦1ueba:robar¦1uesta:postar¦1iebra:uebrar¦1ieza:pezar¦1ía:uiar¦uelca:olcar¦iembla:emblar¦e suicida:uicidarse¦ sienta:ntarse¦uerde:order¦ierne:ernir¦ospe:uspir¦õe:or¦üenza:onzar¦uele:oler¦ierde:erder¦uerza:orzar¦uere:orir¦uelga:olgar¦ice:ecir¦iñe:eñir¦uerme:ormir¦íe:eír¦ierte:ertir¦ienza:enzar¦:r",
        "rev": "egar:iega¦iar:ía,ía/palia¦ir:ye¦orcer:uerce¦ostar:uesta¦orar:üera¦ervir:irve,ierve¦oñar:ueña¦olar:uela¦ender:iende¦er:é,ê¦uar:úa,úa/adecua¦over:ueve¦oder:uede¦entir:iente¦elar:iela¦eguir:igue¦onar:uena¦olver:uelve¦islar:ísla¦unar:úna¦ber:/hay¦oer:ói¦oblar:uebla¦udar:úda¦embrar:iembra¦oldar:uelda¦1edir:pide,ride¦1ordar:cuerda¦1ener:tiene¦1ontrar:cuentra¦1ostrar:muestra¦1etar:rieta¦1ar:tá,eia¦1erir:giere¦1er:tém¦2erir:quiere¦2ir:ube,lle,ple,are,uz,ole,dre,uge,sse¦2egir:rrige¦2üir:rguye¦2ebir:ncibe¦3ir:ufre,xige,cide,mite,inge,fere,lide,fine,gere,arce,sere,umpe,side,dige,sale,umbe¦4ir:mbate,flige,irige,olige,ivide,rcibe,cinde¦5ir:revive,ssegue",
        "ex": "va:ir¦es:ser¦yerra:errar¦huele:oler¦se acuesta:acostarse¦se afilia:afiliarse¦se aleja:alejarse¦se casa:casarse¦se decide:decidirse¦se levanta:levantarse¦se mueve:moverse¦se olvida:olvidarse¦se preocupa:preocuparse¦se queda:quedarse¦se queja:quejarse¦se retira:retirarse¦1iega:negar,regar¦4ía:confiar¦8ye:constituir,distribuir,contribuir¦1iensa:pensar¦1uerce:torcer¦1ierra:cerrar,serrar¦1uesta:costar¦2e:unir,agir¦2iere:querer¦2üera:agorar¦2uerda:acordar¦1irve:servir¦2ía:criar¦1ueña:soñar¦2ega:jugar¦1ienta:sentar,tentar¦3ía:variar,vaciar,espiar,rociar¦1ye:oír¦1uela:volar¦1iere:herir¦3iende:entender,defender,ascender¦3uentra:encontrar¦2ye:huir¦1iene:venir,tener¦4é:prever¦3úa:situar¦7ye:sustituir,destituir,instituir,restituir¦3e:subir,parir,ferir,gerir,punir,rugir,vivir,salir,batir,latir,ungir¦1ueve:mover¦1uega:rogar¦1uede:poder¦3uerda:recordar¦1iente:sentir,mentir¦1iela:helar¦2uesta:acostar¦3ieta:apretar¦1igue:seguir¦1uena:sonar¦1uelve:volver¦2iende:atender¦1uenta:contar¦3á:estar¦1iste:vestir¦1ierve:hervir¦3iere:sugerir¦4úa/adecua:adecuar¦4e:aferir,exibir,pudrir,erigir,premir¦1ísla:aislar¦2ienta:asentar,alentar¦6ye:atribuir¦1úna:aunar¦4ia:basear¦7ia:branquear¦1uece:cocer¦2ê:crer¦3iega:denegar¦3ém:deter,reter¦5e:digerir,inserir,referir,recibir¦3uelve:disolver,envolver¦5ia:estrear¦3ye:fluir¦3ia:frear¦2iega:fregar,plegar¦1oge:fugir¦1ime:gemir¦2/hay:haber¦1ê:ler¦1ói:moer¦3ía/palia:paliar¦1uebla:poblar¦1ule:polir¦8e:prosseguir¦10ye:reconstituir¦3ê:reler,rever¦1ueda:rodar¦2úda:saudar¦1iembra:sembrar¦1uelda:soldar¦1uelta:soltar¦1iende:tender¦2m:ter¦5iende:trascender¦1ierte:verter¦1em:vir¦1ige:regir¦1uestra:mostrar¦1ide:medir,pedir¦3ienta:calentar¦2ige:elegir¦5ienta:desalentar¦1á:haver¦1õe:pôr¦1inde:rendir"
      },
      "firstPlural": {
        "fwd": "omos:ôr",
        "both": "5ímos:iminuir¦4mos/podrimos:udrir¦3ímos:fruir¦3mos/hemos:aver¦2ímos:suir¦1ímos:air¦mos:r",
        "rev": "1ir:uímos",
        "ex": "vamos:ir¦nos acostamos:acostarse¦nos afiliamos:afiliarse¦nos alejamos:alejarse¦nos casamos:casarse¦nos decidimos:decidirse¦nos levantamos:levantarse¦nos movemos:moverse¦nos olvidamos:olvidarse¦nos preocupamos:preocuparse¦nos quedamos:quedarse¦nos quejamos:quejarse¦nos retiramos:retirarse¦nos sentamos:sentarse¦nos suicidamos:suicidarse¦1omos:ser,pôr¦1emos:haber¦7ímos:retribuir¦8ímos:substituir"
      },
      "secondPlural": {
        "fwd": "ondes:ôr¦1s:ír¦4áis:lvidar",
        "both": "5is:igorar,acilar,rmizar,utelar,reinar,aficar,mperar,ufocar,bornar,bmeter,bjugar,letrar,pultar,abotar,otular,evidar,vender,etocar,tardar,elecer,ndecer,pudiar,emeter,gistar,efrear,uturar,ecusar,crutar,ebocar,ativar,biscar,ueimar,otelar,ofanar,eceder,liciar,tencer,rfurar,ndurar,elejar,entear,rasear,fuscar,ssitar,urchar,sturar,rtelar,bertar,evitar,radiar,nvejar,rceder,njetar,flamar,inerar,dratar,bituar,errear,vernar,guejar,rnicar,stejar,aturar,aditar,onerar,xercer,xcitar,aporar,tuprar,emecer,tragar,pionar,ecular,pantar,smagar,fregar,crever,coltar,barrar,xergar,nsinar,avidar,gasgar,nganar,forcar,riptar,rregar,purrar,mpatar,ebedar,grecer,fetuar,izimar,torcer,ssipar,eminar,cursar,plinar,vastar,vendar,travar,prezar,sonrar,sligar,sfilar,nrolar,dobrar,contar,pontar,animar,rochar,rreter,epilar,nstrar,eletar,apitar,metrar,rtejar,andear,ntatar,nsumar,atular,nfinar,omutar,oletar,agular,trizar,cotear,hatear,rimbar,arolar,aducar,uzinar,atizar,buciar,nturar,xiliar,nticar,uditar,opelar,ssinar,fixiar,rvorar,riscar,dondar,fundar,imorar,eender,drecer,etecer,ziguar,ecipar,ncorar,rtizar,olecer,enizar,marrar,maciar,lvejar,listar,larmar,uentar,gentar,rmecer,iantar,rretar,calmar,rrecer,bdicar,omitar¦5áis:sportar,uilizar,pificar,usurrar,uavizar,tetizar,etratar,esaltar,generar,dondear,eclamar,astrear,rcionar,ocionar,eocupar,tenciar,rientar,asionar,nimizar,morizar,ximizar,niobrar,lgastar,nstigar,esionar,usionar,malizar,cilitar,xagerar,timular,rilizar,squivar,nterrar,nmendar,nmarcar,fatizar,aquetar,uplicar,esticar,osticar,rdiciar,embocar,scifrar,emandar,rrestar,ncordar,ompilar,omentar,talizar,loquear,rorizar,rastrar,rrancar,umentar,lternar,ligerar,grandar,gilizar,ecentar,ccionar,nsuciar,vilizar,espetar,omendar,xplorar,bolizar,ntestar,riticar,galizar,espirar,ntentar,ealizar,rificar,etestar,ecordar,tumbrar,eplicar,municar,ganizar,asticar,xplicar,laticar,ublicar,reparar,cesitar,xportar,lanchar,onvidar,nmigrar,obernar,lonizar,spertar,estigar¦5ís:umergir,referir¦5éis:ocorrer,evolver,etender,isolver,talecer,ncender,iquecer,xtender,tenecer,esolver,ontecer,lorecer¦5s:fletir,gredir,evenir,ngerir,ncutir,igerir,mentir,iludir,rrigir,vergir,tingir,ssumir¦5ndes:tervir¦4áis:lnerar,ntilar,iturar,nsitar,amitar,olerar,ujetar,fragar,icitar,ocavar,botear,etirar,ucitar,mediar,rmular,flejar,uperar,opilar,cobrar,ecitar,caudar,anudar,rantar,piciar,mulgar,gramar,ipitar,stular,antear,petuar,rfilar,rdurar,netrar,padear,scilar,ulizar,bjetar,otivar,itigar,festar,lucrar,nundar,rrogar,nnovar,mnizar,rporar,ncitar,ntivar,ugurar,ustrar,tirpar,hortar,xcavar,cturar,ngular,stirar,scapar,adicar,trenar,uiciar,gordar,rentar,nfocar,erezar,ncajar,omizar,vulgar,sparar,isipar,amizar,spejar,montar,ntelar,slizar,adenar,barcar,aratar,rrocar,rramar,epurar,imitar,raudar,clinar,mbular,otejar,operar,statar,sagrar,igurar,cretar,certar,pletar,mparar,mbinar,entrar,pturar,ficiar,rrizar,esinar,ntalar,lastar,tiguar,llanar,justar,hondar,gravar,garrar,juntar,daptar,umular,ctivar,editar,entuar,riciar,rturar,horcar,scinar,fiscar,vantar,ecorar,vacuar,ltivar,ncelar,utizar,cticar,lestar,uistar,niciar,cantar,tudiar,nhelar,cortar,riguar,ventar,aludar,bortar,tregar,ndenar,uantar,cercar,edicar,enovar,legrar,ositar,eñalar,dornar,pretar,gociar,lentar,evorar,ndicar,bligar,egular,lantar,icipar,postar,horrar,rachar,ostrar,olocar,irizar,gustar,ayunar,rendar,gatear,nsejar,unciar,bricar¦4is:igiar,guear,rinar,remer,acear,fonar,atuar,segar,oprar,emear,ronar,vogar,virar,ousar,zijar,bolar,eatar,criar,ipiar,emiar,oupar,uisar,dalar,ssear,airar,omear,murar,torar,dular,sclar,horar,acrar,usear,hucar,impar,tunar,atrar,pedar,erdar,mpear,urtar,risar,matar,utuar,lsear,polar,xpiar,cizar,tudar,relar,ourar,irrar,gotar,folar,covar,xugar,aguar,nenar,gatar,gajar,rujar,ralar,rajar,cetar,cerar,cotar,beber,balar,leger,famar,iorar,sovar,ascar,uviar,sabar,colar,stear,solar,hecer,ceber,ungar,arear,hupar,ingar,eirar,efiar,hamar,algar,uflar,rigar,cejar,femar,hotar,obiar,nalar,rumar,ombar,fecer,cadar,batar,zenar,rovar,alpar,lugar,lisar,ienar,gemar,eijar,fogar,dotar,oecer,eitar,salar,eviar,banar¦4ís:irigir,esumir,rvenir,ringir,xpedir,nvenir,querir,nsumir,spedir¦4s:digir,abrir,oibir,serir,nibir,antir,oluir,urtir,lidir,obrir,ferir,derir¦4des:rover,tever¦4éis:oceder,llecer,ometer,fender,render,vencer,jercer,uceder,anecer,blecer,arecer,oteger¦3áis:arpar,ltear,gilar,engar,cunar,onear,sanar,rtear,ngrar,orear,odear,tomar,aldar,lajar,futar,lutar,cabar,zonar,uitar,dizar,curar,crear,egiar,cisar,anear,verar,forar,pinar,ldear,delar,digar,jorar,midar,aurar,nflar,dagar,ncoar,ndiar,ualar,bitar,rabar,lpear,ilmar,pular,tafar,spiar,calar,uipar,merar,aizar,ranar,ndrar,omiar,arnar,bezar,pujar,eorar,ogiar,tonar,sviar,pegar,satar,afiar,rivar,berar,latar,odiar,nstar,lidar,derar,jurar,ginar,olmar,borar,logar,mbiar,ibrar,rdear,vivar,rapar,tajar,sorar,uinar,esgar,hivar,itrar,ximar,echar,artar,nular,uilar,pliar,terar,labar,hogar,rupar,optar,catar,surar,vegar,iclar,dorar,rciar,escar,bajar,redar,uchar,ucear,opiar,ersar,timar,smear,ardar,ograr,uidar,velar,eciar,levar,bujar,husar,iviar,ampar,ctuar,uemar,hocar,yudar,ausar,vinar,zclar,robar,olgar,visar,vocar,mpiar,lenar,lotar,minar,tinar,mprar,mirar,ervar,donar,busar,legar,ultar,ebrar,ncear,nviar,indar,pezar,ailar,cular,intar,larar,eptar,bicar¦3ndes:ster,ovir,bter,nter¦3s:mbir,ctir,uvir,trir,odir,lpir,grir,spir,prir,agir,irir,olir¦3is:frer,snar,iver,spar,uvar,vrar,mber,juar,hear,ziar,aiar,ubar,scer,xear,roer,rter,hiar,ecar,gear,ifar,zear,efar,bear,njar,oiar,siar,muar,ncar,lhar,quar,nhar,ssar,rver,nger,ater,afar¦3ís:eunir,ximir,herir,audir,cibir,ubrir,hibir,urgir,ribir,cudir,rimir¦3is/heis:aver¦3éis:pecer,mover,jecer,onder,decer¦2áis:epar,niar,zgar,lcar,rjar,rbar,luar,osar,uzar,ozar,lsar,ibar,psar,jear,gnar,lzar,slar,plar,rgar,acar,glar,lvar,rzar,nuar,blar,smar,ojar,nzar,ctar,esar,lear,rmar,azar,adar,nfar,rlar,asar,llar,nsar,uiar,duar¦2s:sir,zir¦2ís/podrís:drir¦2is:xer,uer,zer,her,çar,oar,xar¦2éis:amer,rger,rber,ocer,rder,aber,oder,omer,oger,acer¦2ís:mpir,rnir,inir,ndir,ebir,arir,upir,adir,plir,llir,orir,rrir,alir,ubir,ivir,idir,rmir,frir,egir¦1éis:jer,ser,ñer,eer,ler,aer,ner¦1is:quir¦1ndes:or¦1ís:air,üir,ñir,uir,cir,tir¦1áis:yar,ñar¦s olvidáis:lvidarse",
        "rev": "er:éis,ois¦r:ndes¦1ar:jáis,táis,gáis,cáis,ráis,náis,záis,iáis,páis,uáis,láis,háis,eáis,váis,báis,máis,sáis¦1ir:nís,vís,mís,dís,gís¦1r:ais,edes,ides¦2ar:ndáis,rdáis,edáis,ldáis¦2ir:erís¦2r:eís,veis,deis,ceis,gis,tis,dis,ris,reis,mis,geis¦3ar:modáis¦3r:ibis,mpeis,guis¦4ar:ucidáis",
        "ex": "vais:ir¦os acostáis:acostarse¦os afiliáis:afiliarse¦os alejáis:alejarse¦os casáis:casarse¦os decidís:decidirse¦os levantáis:levantarse¦os movéis:moverse¦os preocupáis:preocuparse¦os quedáis:quedarse¦os quejáis:quejarse¦os retiráis:retirarse¦os sentáis:sentarse¦os suicidáis:suicidarse¦3áis:dejar,tapar,odiar,andar,negar,votar,secar,errar,criar,cenar,pagar,tocar,jugar,volar,notar,bajar,mudar,jurar,matar,rezar,picar,curar,tomar,echar,fijar,tirar,rogar,crear,dudar,durar,ganar,lavar,helar,sonar,regar,robar,mirar,parar,untar,estar,fumar,pegar,aunar,botar,cavar,citar,colar,donar,dotar,girar,idear,jalar,ligar,obrar,optar,pelar,pisar,remar,rodar,sanar,sudar,sumar,velar,virar¦3éis:beber,meter,temer,mover,deber,ceder¦4áis:gastar,mandar,educar,cerrar,costar,llorar,agorar,juntar,saltar,sentar,variar,ladrar,llamar,apagar,culpar,entrar,montar,desear,faltar,vaciar,situar,violar,calmar,tratar,evitar,peinar,buscar,quedar,gritar,cobrar,quejar,bordar,marcar,tragar,viajar,borrar,contar,cortar,reinar,gustar,abonar,acusar,afilar,afinar,agitar,alejar,animar,anotar,apelar,apilar,bastar,batear,brotar,cantar,captar,cifrar,cursar,editar,fregar,frenar,frotar,fundar,gotear,gravar,honrar,imitar,lidiar,mediar,obviar,ocupar,operar,paliar,pasear,patear,portar,rasgar,restar,rociar,saciar,serrar,soldar,soltar,tentar,tumbar¦1ois:ser¦8áis:clasificar,significar,crucificar,actualizar,certificar,conmemorar,contrastar,cuestionar,enmascarar,falsificar,fiscalizar,garantizar,justificar,modernizar,patrocinar,perjudicar,planificar,presenciar,rectificar,reintegrar,relacionar,reutilizar,secuestrar,sintonizar,socializar,solucionar,testificar,traicionar,vislumbrar,visualizar¦7áis:protestar,encontrar,modificar,controlar,preguntar,presentar,funcionar,registrar,disfrutar,adjudicar,alimentar,almacenar,apaciguar,armonizar,autorizar,blanquear,calificar,canalizar,capacitar,codificar,conciliar,contratar,coordinar,debilitar,despachar,dilucidar,disculpar,disimular,ejercitar,emparejar,enganchar,equiparar,finalizar,financiar,gestionar,habilitar,localizar,mencionar,notificar,optimizar,paralizar,penalizar,proclamar,prolongar,prosperar,ratificar,sancionar,sustentar,valorizar¦2áis:usar,amar,asar,atar,izar,orar¦5áis:confiar,invitar,acordar,manejar,reparar,asustar,abordar,cocinar,esperar,aspirar,afeitar,asociar,madurar,acostar,aplicar,visitar,regalar,emigrar,adecuar,agregar,alertar,alinear,aportar,apuntar,asaltar,asentar,demorar,denegar,derogar,encarar,enfriar,expirar,filtrar,generar,ignorar,imputar,manchar,marchar,militar,nombrar,ordenar,prestar,rebotar,saquear,sembrar,separar,simular,sofocar,titular,valorar,olvidar¦6áis:enamorar,reportar,importar,suspirar,conjugar,utilizar,soportar,instalar,lamentar,castigar,acarrear,acelerar,acomodar,afrontar,aminorar,analizar,asegurar,asimilar,congelar,derrotar,disputar,ejecutar,encerrar,implicar,insertar,inspirar,integrar,retornar,suscitar,unificar¦4éis:crecer,romper,torcer,barrer,querer,correr,prever,vender,volver,vencer,tender,verter¦2ís:unir¦4ís:exigir,servir,fingir,hervir,aludir,asumir,eludir,erigir¦7éis:descender,abastecer,corromper,endurecer,favorecer,oscurecer,suspender¦5éis:atrever,ofrecer,atender,merecer,acceder,exceder,perecer¦10áis:caracterizar,complementar,contabilizar,cumplimentar,distorsionar,diversificar,experimentar,intensificar,materializar,personalizar,racionalizar,sensibilizar,subcontratar¦3ís:medir,herir,venir,pedir,abrir,gemir,rugir¦6éis:entender,depender,ascender,conceder,envolver,recorrer¦9áis:entrevistar,generalizar,administrar,concienciar,cuantificar,diferenciar,especificar,estabilizar,evolucionar,fundamentar,identificar,implementar,incrementar,liberalizar,multiplicar,neutralizar,posibilitar,reflexionar,reglamentar,regularizar,rehabilitar,representar,simplificar,suministrar¦2is:dar,ver¦5ís:afligir,sugerir,impedir¦9éis:enflaquecer¦7is:abrandar,absolver,alastrar,angariar,aprontar,arquivar,arrastar,assaltar,assediar,assentar,associar,assustar,beliscar,cimentar,comandar,computar,decifrar,decorrer,deformar,delinear,deportar,desertar,deslocar,desnudar,destilar,edificar,elucidar,empregar,encostar,englobar,entornar,escorrer,esmurrar,esquecer,estender,executar,fornecer,germinar,guinchar,hibernar,implorar,incorrer,indiciar,internar,jardinar,lecionar,manobrar,mascarar,mastigar,oferecer,ostentar,otimizar,planejar,praticar,projetar,propagar,racionar,rebentar,remarcar,remendar,requerer,resfriar,retaliar,revistar,suportar,tributar¦5is:aceder,acenar,afetar,ajudar,alocar,aparar,apitar,apurar,arejar,atirar,ativar,aturar,basear,berrar,cercar,chegar,chutar,clamar,clicar,cremar,curvar,custar,discar,dobrar,drenar,drogar,ejetar,emular,enfiar,exumar,fechar,ferrar,fritar,gostar,inchar,inovar,jantar,jorrar,julgar,largar,listar,lucrar,migrar,moldar,morrer,narrar,obstar,pastar,peidar,piscar,planar,postar,pregar,rachar,raptar,recear,recuar,render,riscar,saudar,sediar,sondar,testar,tornar,tramar,travar,trocar,varrer,voltar,zangar¦6is:acender,acionar,afastar,alongar,amputar,apertar,aquecer,arrasar,arrotar,aterrar,atestar,atrasar,avaliar,avistar,castrar,chumbar,deparar,desejar,digitar,duvidar,emendar,encenar,envidar,escavar,escutar,esfriar,espetar,estalar,esticar,estocar,estrear,exaltar,exortar,falecer,farejar,flertar,fofocar,fuzilar,hesitar,imigrar,intimar,irritar,isentar,lanchar,lembrar,minorar,mutilar,namorar,ocorrer,pontuar,refinar,renegar,segurar,transar,usurpar,vacinar,venerar¦4is:achar,adiar,afiar,aliar,arcar,atuar,babar,cagar,calar,cegar,corar,datar,dever,ditar,domar,falar,feder,ficar,frear,furar,gabar,gelar,gemer,gerar,jogar,lesar,levar,lidar,lutar,mamar,mijar,mimar,minar,morar,nevar,ousar,pirar,podar,pular,rapar,reger,rimar,rolar,sarar,selar,socar,somar,sugar,sujar,tecer,uivar,vagar,vazar,vetar,visar,zelar¦10is:acrescentar,categorizar,centralizar,classificar,concretizar,decepcionar,decodificar,desacelerar,descongelar,desencadear,desenvolver,desinstalar,desintegrar,desmascarar,dimensionar,enfraquecer,enlouquecer,impulsionar,incapacitar,influenciar,inicializar,inspecionar,interromper,monitorizar,monopolizar,quantificar,reabastecer,recapitular,reconciliar,reencontrar,refinanciar,ressuscitar,sincronizar,solidificar,suplementar,transbordar,transcender¦8is:adicionar,alvorecer,amamentar,amortecer,apimentar,aposentar,apunhalar,assegurar,assimilar,assombrar,atualizar,branquear,cadastrar,capitular,comemorar,complicar,comportar,concorrer,confortar,congregar,consertar,conspirar,contornar,coordenar,danificar,desculpar,desfrutar,desmarcar,desocupar,despender,despistar,discordar,dissociar,dissolver,embelezar,emprestar,enfurecer,enquadrar,entabular,escurecer,esfaquear,etiquetar,exercitar,fermentar,flexionar,focalizar,gerenciar,humanizar,incomodar,infiltrar,licenciar,maltratar,ministrar,mobilizar,pacificar,percorrer,perguntar,reacender,rebobinar,relembrar,ressaltar,retificar,rivalizar,salientar,silenciar,sinalizar,subsidiar,sussurrar,tonificar,triplicar,vaporizar¦3s:agir¦9is:amadurecer,amedrontar,amplificar,apresentar,aprisionar,arrebentar,atormentar,cauterizar,colecionar,confrontar,contrariar,desapertar,desconfiar,desesperar,deslumbrar,desmembrar,dissimular,embalsamar,escravizar,estacionar,evidenciar,fertilizar,fortificar,harmonizar,hipnotizar,incriminar,interligar,lubrificar,movimentar,obscurecer,orquestrar,padronizar,pestanejar,posicionar,prejudicar,pressionar,profetizar,pulverizar,qualificar,questionar,raciocinar,reabilitar,reaprender,refrigerar,requisitar,santificar,selecionar,sequestrar,subordinar,transpirar¦3is:arar,moer,suar¦7s:assistir,infligir,investir¦6s:coligir,demitir,emergir,oprimir,redimir¦11áis:comercializar,desenmascarar¦13is:confraternizar,descentralizar¦12is:contra-atacar,correlacionar,desconsiderar,ridicularizar,supervisionar¦3des:crer¦11is:cumprimentar,desvalorizar,exemplificar,experienciar,familiarizar,impressionar,marginalizar,nacionalizar,negligenciar,possibilitar,providenciar,revolucionar,subvencionar¦12áis:desestabilizar,individualizar¦9s:desimpedir,pressentir,prosseguir¦4ndes:deter,reter¦8s:dissuadir,submergir¦7ndes:entreter¦5s:exibir,iludir,premir,tingir¦4s:ferir,fugir,gerir,punir,sumir,ungir¦15áis:institucionalizar¦2des:ler,rir¦8éis:prevalecer,trascender¦4des:reler,rever¦14is:responsabilizar¦2éis:roer¦5des:sorrir¦2ndes:ter,vir¦2s:oír¦1ondes:pôr"
      },
      "thirdPlural": {
        "fwd": "igen:egir¦uestran:ostrar¦ienen:ener¦uyen:üir¦iben:ebir¦õem:ôr¦inden:endir¦1ieren:uerir¦1em:zir¦2en:idir,itir,alir,rrir,rcir,mpir¦2n:ñer¦2m:zer,uer¦2em:mbir¦3n:eñar,aler,rger¦3en:cibir,indir¦3m:nger¦3em:remir¦4n:uedar¦4m:remer¦5n:entrar",
        "both": "5n:lnerar,igilar,ntilar,alorar,iturar,nsitar,amitar,olerar,fonear,ujetar,ortear,ocavar,etirar,ucitar,mediar,doblar,uperar,opilar,clamar,caudar,ebotar,rantar,mulgar,gramar,oceder,stular,antear,rfilar,rdurar,padear,scilar,ulizar,bjetar,otivar,archar,iobrar,gastar,imitar,gislar,rrogar,rporar,ntivar,ugurar,gnorar,ustrar,rmular,cturar,xpirar,hortar,xcavar,agerar,trenar,stirar,scapar,adicar,iparar,uiciar,gordar,rentar,nfocar,ncajar,peorar,llecer,logiar,vulgar,sputar,isipar,etonar,spejar,montar,ntelar,adenar,mbocar,editar,rrocar,rramar,epurar,raudar,clinar,mbular,otejar,operar,statar,njurar,igurar,cretar,pletar,mpilar,mparar,mbinar,pturar,oquear,rrizar,esinar,ntalar,lastar,tiguar,acenar,justar,gravar,garrar,doptar,juntar,daptar,umular,ctivar,ometer,cceder,arrear,barcar,rturar,suciar,horcar,scinar,fiscar,vantar,ecorar,lebrar,vacuar,ltivar,lvidar,ncelar,utizar,cticar,lestar,uistar,niciar,cantar,tudiar,render,cansar,cortar,riguar,aludar,bortar,tregar,ndenar,trolar,uantar,vencer,cercar,edicar,icitar,legrar,ositar,jercer,dornar,gociar,blicar,uceder,evorar,ndicar,bligar,egular,lantar,icipar,horrar,enecer,njugar,anecer,olocar,irizar,gustar,ayunar,iunfar,blecer,arecer,gatear,nsejar,ntecer,unciar,bricar¦5m:acilar,rmizar,utelar,reinar,ransar,aficar,ufocar,bornar,bmeter,bjugar,letrar,pultar,abotar,otular,evidar,vender,tardar,ndecer,pudiar,emeter,gistar,efinar,uturar,crutar,obinar,animar,opagar,ofanar,eceder,ontuar,liciar,tencer,ndurar,elejar,fuscar,ssitar,urchar,itorar,sturar,prezar,rtelar,bertar,evitar,rritar,ntimar,rceder,njetar,flamar,inerar,dratar,bituar,inchar,vernar,guejar,rnicar,stejar,aturar,onerar,xercer,xcitar,aporar,tuprar,tragar,elecer,pionar,ecular,murrar,sfriar,crever,coltar,xergar,travar,nsinar,uadrar,gasgar,nganar,rralar,ncenar,purrar,grecer,fetuar,uvidar,ssipar,cursar,plinar,igitar,vendar,stilar,pistar,sonrar,slocar,sligar,sfilar,nrolar,dobrar,contar,rregar,ativar,rochar,epilar,nstrar,eletar,apitar,metrar,rtejar,rariar,ntatar,atular,fortar,omutar,oletar,agular,trizar,arolar,muflar,aducar,uzinar,atizar,buciar,nturar,xiliar,nticar,uditar,opelar,ssinar,rrumar,bentar,rrasar,fundar,imorar,eender,pontar,etecer,ziguar,ecipar,ncorar,olecer,enizar,marrar,maciar,listar,uentar,gentar,fastar,iantar,calmar,bdicar¦5en:umergir,ercutir¦5em:sseguir,ssentir,nvestir,deferir,ssuadir,iminuir,impedir,ssistir¦5iam:faquear,elinear,icotear¦5yen:sminuir¦4m:angar,igiar,rinar,fonar,atuar,segar,virar,zijar,criar,bolar,eatar,eimar,ipiar,emiar,oupar,uisar,horar,dalar,airar,bstar,murar,dular,sclar,acrar,hucar,impar,amber,solar,adiar,vejar,tunar,atrar,pedar,erdar,zilar,risar,matar,utuar,polar,xpiar,cizar,tudar,relar,tocar,irrar,gotar,folar,covar,xugar,aguar,nenar,lobar,gatar,gajar,rujar,urtar,iptar,cerar,patar,lezar,bedar,samar,leger,zimar,famar,iorar,sovar,ronar,rajar,cotar,ascar,uviar,sabar,colar,urvar,remar,sumar,hecer,ceber,ungar,hupar,ingar,eirar,efiar,hamar,algar,imbar,rigar,cejar,femar,hotar,iscar,obiar,nalar,ombar,fecer,cadar,batar,zenar,rovar,alpar,lugar,lisar,ienar,gemar,eijar,judar,fogar,fetar,vogar,mecer,oecer,eitar,salar,eviar,balar¦4n:ltear,engar,cunar,sanar,pesar,ngrar,aldar,odear,tomar,catar,posar,peler,lajar,futar,lutar,cabar,bajar,zonar,uitar,dizar,curar,crear,cesar,egiar,cisar,anear,verar,forar,pinar,ldear,delar,digar,jorar,midar,aurar,nflar,dagar,ulcar,ncoar,ndiar,ualar,bitar,rabar,lpear,ilmar,irpar,pular,tafar,calar,pecer,ablar,ranar,omiar,arnar,bezar,pujar,pegar,satar,rivar,berar,latar,odiar,echar,nstar,lidar,derar,agrar,ginar,orear,borar,logar,mbiar,ibrar,rdear,vivar,rapar,tajar,sorar,uinar,esgar,hivar,itrar,ximar,artar,nular,uilar,terar,labar,hogar,rupar,cosar,bonar,surar,vegar,iclar,dorar,rciar,resar,escar,nocer,redar,ucear,alvar,opiar,ersar,timar,smear,uchar,helar,jecer,ograr,uidar,velar,eciar,levar,bujar,iviar,ampar,ardar,uemar,anzar,hocar,yudar,ausar,vinar,zclar,ñalar,visar,onder,vocar,mpiar,lenar,lotar,minar,tinar,mprar,mirar,ervar,donar,busar,ultar,decer,ncear,indar,ailar,cular,intar,teger,larar,eptar,bicar¦4ienden:rascender¦4em:sferir,orrir,edimir,oferir,rferir,iferir,mentir,iludir,rrigir,vergir,nferir,oligir,tingir,ssumir¦4en:esumir,ringir,scutir,xhibir,irigir,nsumir¦4iam:entear,rasear,errear,andear¦4êm:tervir,treter¦3iam:guear,acear,emear,frear,ecear,ssear,omear,usear,mpear,lsear,stear,arear¦3em:fruir,letir,digir,abrir,serir,nibir,antir,xibir,oluir,golir,espir,urtir,lidir,obrir,bolir¦3n:epar,niar,rbar,amer,zgar,rjar,uzar,ozar,lsar,ibar,gnar,psar,jear,lzar,uñar,plar,rber,rlar,rgar,acar,glar,smar,omer,ojar,oger,ctar,lear,rmar,azar,adar,añar,asar,llar,oner,acer¦3m:frer,snar,iver,spar,uvar,vrar,juar,rver,ziar,aiar,ubar,scer,roer,rter,hiar,ecar,xiar,njar,oiar,siar,muar,ssar,ncar,lhar,quar,nhar,ater¦3êem:rover,tever¦3úan:petuar,entuar¦3ienen:ervenir¦3en:andir,undir,audir,artir,ubrir,urgir,ribir,cudir,istir,nguir,xigir,rimir¦3ían:nfriar¦3yen:iluir,cluir,fluir¦3úan/adecuan:decuar¦3iegan:splegar¦3ieren:referir¦2n:jer,ser,eer,aer,yar¦2êm:ster,ovir,bter,nter¦2isten:evestir¦2ientan:eventar,ecentar¦2iensan:epensar¦2em:ctir,suir,uvir,trir,odir,lpir,grir,prir,agir,irir¦2en:drir,inir,arir,upir,adir,plir,llir,atir,uñir,ivir,frir,ucir¦2inem:evenir¦2m:xer,xar,her,çar,oar,far¦2iam:hear,xear,gear,zear,bear¦2em/exturquem:quir¦2iden:xpedir,spedir¦2ían:spiar,sviar,afiar,pliar,nviar¦2iendan:nmendar,omendar¦2uelven:isolver,evolver,esolver¦2ierran:nterrar¦2uerdan:ncordar,ecordar¦2iguen:oseguir,rseguir,nseguir¦2ieren:ugerir¦2ienden:efender,ncender,ntender,xtender¦2íben:ohibir¦2ienen:nvenir¦2úan:ctuar¦2iesan:nfesar¦2uevan:enovar¦2iernan:obernar¦2yen:tuir,ruir¦2iertan:spertar¦2ienten:esentir,nsentir¦1em:sir,air¦1únen:eunir¦1íbem:oibir¦1iestan:festar¦1úan:luar,nuar,duar¦1ízan:aizar¦1uesan/engrosan:rosar¦1ierran:cerrar¦1ueven:mover¦1idem:redir¦1ieren:herir¦1iertan:certar¦1iesan:vesar¦1ienten:pentir¦1iten:petir,retir¦1úsan:husar¦1ueban:robar¦1ientan:lentar¦1uestan:postar¦1iebran:uebrar¦1iendan:rendar¦1iezan:pezar¦1ían:uiar¦uelcan:olcar¦iemblan:emblar¦e suicidan:uicidarse¦ sientan:ntarse¦uerden:order¦ão:aver¦iernen:ernir¦ospem:uspir¦õem:or¦üenzan:onzar¦uelen:oler¦ierden:erder¦uerzan:orzar¦ueden:oder¦ueren:orir¦uelgan:olgar¦icen:ecir¦ueñan:oñar¦iñen:eñir¦uermen:ormir¦íen:eír¦ierten:ertir¦ienzan:enzar",
        "rev": "er:on,én,êem¦egar:iegan¦iar:ían,ían/palian¦ensar:iensan¦orcer:uercen¦ostar:uestan¦orar:üeran¦ender:ienden¦ordar:uerdan¦olar:uelan¦ontrar:uentran¦uar:úan¦over:ueven¦entir:ienten¦elar:ielan¦etar:ietan¦eguir:iguen¦onar:uenan¦olver:uelven¦ontar:uentan¦ar:án¦ervir:ierven¦islar:íslan¦unar:únan¦ugir:ogem¦oblar:ueblan¦olir:ulem¦udar:údam¦embrar:iembran¦errar:ierran¦oldar:ueldan¦oltar:ueltan¦1ener:tienen¦1ir:uyen¦1ostrar:muestran¦1üir:guyen¦1ar:eiam¦1er:têm¦1edir:piden¦1r:eem,iem¦2r:jan,han,man,pan,ean,tam,nam,cem,ham,mam,cam,zam,ram,lam,jam,vam,sam,bam,gam,pam,oem,uam,oen¦2ir:uben,ngen,bren,erem,uden,umen,uzem,item,rgem,udem,utem,igem,imem,unem,buem,tuem,umem¦2egir:rrigen¦2ebir:nciben¦3r:eben,igan,dian,ican,ucan,izan,otan,ecen,itan,gran,ecan,eten,agan,ocan,dran,aran,inan,udan,uran,olan,atan,iran,cian,aben,anan,onan,rcan,añen,oban,ncen,alan,oran,azem,lvem,ndem,usan,fiam,liam,riam,ilan,ncan,ndam,diam,ptan,fran,rrem,izem,ozem,rsan,ogan,udam,rdam,ciam,utan,idam,ivan,ulan,avan,odam,ovan,mpem,cran,ldam,vian,isan,ngan,sgan,egem,mban¦3ir:ciden,miten,urren,arcen,siden,salen,umbem,ingem¦4r:astan,andan,ansan,ortan,legan,orren,reven,untan,altan,ustan,ontan,señan,istan,uscan,oblan,ordan,orran,petan,angem,leran,regan,geran,iguan,antan,ceden,ilian,ompen,peñan,bebem,uetan,meran,ltran,renan,undan,neran,onran,peran,etran,fesan,obran,uerem,ornan,urran¦4ir:fligen,ividen,rumpen,cinden¦5r:testan,nvidan,pretan,mentan,sentan,umbran,tentan,penden,istran,omodan,hondan,ternan,astran,pensan,ngelan,rretem,ucidan,erezan,premem,sertan,ombran,rdenan,restan,ventan¦5ir:erciben",
        "ex": "van:ir¦yerran:errar¦huelen:oler¦se acuestan:acostarse¦se afilian:afiliarse¦se alejan:alejarse¦se casan:casarse¦se deciden:decidirse¦se levantan:levantarse¦se mueven:moverse¦se olvidan:olvidarse¦se preocupan:preocuparse¦se quedan:quedarse¦se quejan:quejarse¦se retiran:retirarse¦4n:dejar,tapar,beber,odiar,andar,votar,secar,meter,cenar,pagar,tocar,notar,pesar,bajar,mudar,jurar,temer,matar,rezar,picar,curar,tomar,echar,fijar,tirar,crear,dudar,cesar,caber,durar,ganar,lavar,robar,mirar,saber,deber,parar,untar,fumar,besar,pegar,arder,botar,cavar,ceder,citar,colar,donar,dotar,girar,idear,jalar,ligar,obrar,optar,pelar,pisar,posar,remar,sanar,sudar,sumar,velar,virar,valer¦5n:gastar,mandar,educar,cansar,crecer,romper,barrer,llorar,llegar,correr,juntar,saltar,ladrar,llamar,apagar,culpar,entrar,montar,desear,faltar,violar,calmar,tratar,evitar,vender,peinar,buscar,doblar,gritar,cobrar,quejar,bordar,marcar,tragar,vencer,viajar,borrar,cortar,reinar,gustar,acusar,afilar,afinar,agitar,alegar,alejar,animar,anotar,apelar,apilar,bastar,batear,brotar,cantar,captar,cifrar,colmar,cursar,editar,frenar,frotar,fundar,gotear,gravar,honrar,imitar,lidiar,mediar,obviar,ocupar,operar,pasear,patear,portar,rasgar,restar,saciar,tensar,tumbar,zarpar,quedar¦9n:investigar,clasificar,enriquecer,significar,clarificar,sacrificar,glorificar,simbolizar,fortalecer,crucificar,actualizar,argumentar,beneficiar,certificar,conmemorar,contrastar,cuestionar,desbaratar,documentar,domesticar,economizar,empaquetar,enmascarar,falsificar,fiscalizar,formalizar,garantizar,indemnizar,involucrar,justificar,modernizar,normalizar,patrocinar,perjudicar,planificar,precipitar,presenciar,prevalecer,reaccionar,rectificar,reintegrar,reinventar,relacionar,reorientar,reutilizar,secuestrar,sintetizar,sintonizar,socializar,solucionar,testificar,traicionar,vislumbrar,visualizar,concentrar¦1on:ser¦7n:florecer,enamorar,reportar,importar,inmigrar,convidar,planchar,suspirar,exportar,preparar,platicar,utilizar,explicar,masticar,replicar,aumentar,inventar,detestar,realizar,intentar,soportar,respirar,depender,criticar,instalar,explorar,respetar,lamentar,castigar,accionar,acelerar,acomodar,afrontar,agilizar,agrandar,aligerar,alternar,aminorar,analizar,arrancar,arrestar,asegurar,asimilar,comentar,conceder,congelar,demandar,derrotar,deslizar,disparar,duplicar,ejecutar,enmarcar,enumerar,esquivar,fomentar,fusionar,implicar,insertar,inspirar,instigar,integrar,orientar,penetrar,profesar,rastrear,reanudar,recalcar,recobrar,recorrer,reflejar,resaltar,retornar,retratar,sabotear,socorrer,suavizar,sufragar,suplicar,suscitar,susurrar,unificar¦1iegan:negar,regar¦8n:protestar,colonizar,necesitar,modificar,preguntar,organizar,comunicar,presentar,funcionar,verificar,legalizar,purificar,contestar,registrar,disfrutar,civilizar,abastecer,acariciar,adjudicar,alimentar,apaciguar,armonizar,arrastrar,autorizar,blanquear,calificar,canalizar,capacitar,codificar,compensar,conciliar,contratar,coordinar,corromper,debilitar,descifrar,despachar,dilucidar,dinamizar,disculpar,disimular,dispensar,ejercitar,emparejar,enderezar,endurecer,enfatizar,enganchar,engendrar,ensamblar,estimular,facilitar,favorecer,finalizar,financiar,gestionar,habilitar,localizar,maximizar,memorizar,mencionar,minimizar,movilizar,notificar,ocasionar,optimizar,oscurecer,paralizar,penalizar,potenciar,preocupar,presionar,pretender,prolongar,propiciar,prosperar,ratificar,redondear,regenerar,sancionar,solventar,suspender,sustentar,tipificar,valorizar¦3n:usar,amar,asar,atar,izar,orar,roer¦4ían:confiar¦1iensan:pensar¦1uercen:torcer¦1ierran:cerrar,serrar¦1uestan:costar¦6n:invitar,atrever,manejar,reparar,asustar,abordar,cocinar,esperar,aspirar,ofrecer,afeitar,asociar,madurar,aplicar,ofender,visitar,regalar,emigrar,merecer,agregar,ahondar,alertar,alinear,allanar,aportar,apuntar,asaltar,delegar,demorar,derogar,encarar,equipar,exceder,filtrar,generar,imputar,incitar,innovar,inundar,manchar,militar,mitigar,nombrar,ordenar,perecer,prestar,recitar,saquear,separar,simular,sofocar,titular,centrar,emerger¦2en:unir¦2ieren:querer¦2üeran:agorar¦4ienden:descender¦2uerdan:acordar¦1irven:servir¦10n:emborrachar,interpretar,entrevistar,generalizar,acostumbrar,enflaquecer,administrar,aterrorizar,capitalizar,concienciar,cuantificar,diferenciar,digitalizar,especificar,estabilizar,esterilizar,estrangular,evolucionar,fundamentar,identificar,implementar,impresionar,incrementar,liberalizar,multiplicar,neutralizar,posibilitar,promocionar,pronosticar,recompensar,reflexionar,reglamentar,regularizar,rehabilitar,reorganizar,representar,revitalizar,seleccionar,simplificar,suministrar,transportar¦2ían:criar¦11n:caracterizar,complementar,confeccionar,contabilizar,cumplimentar,desperdiciar,diagnosticar,distorsionar,diversificar,experimentar,inspeccionar,intensificar,materializar,perfeccionar,personalizar,proporcionar,racionalizar,sensibilizar,subcontratar,tranquilizar¦1iden:medir,pedir¦2egan:jugar¦1ientan:sentar,tentar¦3ían:variar,vaciar,rociar¦1yen:oír¦1uelan:volar¦1ieren:herir¦3uentran:encontrar¦2yen:huir¦1ienen:venir,tener¦4én:prever¦3úan:situar¦6m:vomitar,acender,acionar,alarmar,alongar,amputar,apertar,aquecer,arrotar,arvorar,aterrar,atestar,atrasar,avaliar,avistar,castrar,chumbar,deparar,desejar,embeber,emendar,encetar,envidar,escavar,escutar,esmagar,espetar,estalar,esticar,exaltar,exortar,falecer,farejar,flertar,fofocar,hesitar,imigrar,isentar,lanchar,lembrar,minorar,mutilar,namorar,ocorrer,rebocar,recusar,renegar,segurar,usurpar,vacinar,venerar,vigorar¦3en:subir,abrir,rugir,salir¦1ueven:mover¦1uegan:rogar¦1ienten:sentir,mentir¦4en:fingir,aludir,asumir,eludir,erigir,eximir¦1ielan:helar¦2uestan:acostar¦3ietan:apretar¦1iguen:seguir¦2n:dar,ver,haber¦5en:afligir,recibir¦1uenan:sonar¦8yen:distribuir,contribuir¦1uelven:volver¦2ienden:atender¦1uentan:contar¦3án:estar¦1isten:vestir¦1ierven:hervir¦5m:abanar,aceder,acenar,adotar,alocar,aparar,apitar,apurar,arejar,atirar,ativar,aturar,berrar,cercar,chegar,chutar,clamar,clicar,custar,dobrar,drenar,drogar,ejetar,emular,enfiar,exumar,fechar,ferrar,fritar,gostar,inchar,inovar,jantar,jorrar,julgar,largar,listar,lucrar,migrar,moldar,morrer,narrar,pastar,peidar,planar,postar,pousar,pregar,rachar,raptar,recuar,render,sediar,sondar,soprar,testar,tornar,tramar,travar,trocar,varrer,voltar,erguer,tremer¦8m:aborrecer,acarretar,adicionar,alvorecer,amamentar,amortecer,amortizar,apimentar,apodrecer,aposentar,apunhalar,assegurar,assimilar,assombrar,atualizar,cadastrar,capitular,comemorar,complicar,comportar,concorrer,congregar,consertar,conspirar,contorcer,contornar,coordenar,danificar,desculpar,desfrutar,desmarcar,desocupar,despender,discordar,dissociar,dissolver,distorcer,emprestar,enfurecer,entabular,escurecer,etiquetar,exercitar,fermentar,flexionar,focalizar,gerenciar,humanizar,incomodar,infiltrar,licenciar,maltratar,ministrar,mobilizar,pacificar,percorrer,perguntar,reacender,relembrar,ressaltar,retificar,revigorar,rivalizar,salientar,silenciar,sinalizar,subsidiar,sussurrar,tonificar,triplicar,vaporizar¦7m:abrandar,absolver,alastrar,angariar,aprontar,arquivar,arrastar,assaltar,assediar,assentar,associar,assustar,cimentar,comandar,computar,confinar,decifrar,decorrer,deformar,deportar,derreter,desertar,desnudar,devastar,edificar,elucidar,empregar,encostar,enforcar,entornar,esbarrar,escorrer,esfregar,espantar,esquecer,estender,estourar,executar,fornecer,germinar,hibernar,implorar,incorrer,indiciar,internar,jardinar,lecionar,manobrar,mascarar,mastigar,oferecer,ostentar,otimizar,perfurar,planejar,praticar,projetar,protelar,racionar,remarcar,remendar,repousar,requerer,retaliar,revistar,suportar,temperar,tributar¦4m:achar,adiar,afiar,aliar,arcar,atuar,babar,cagar,calar,cegar,corar,datar,dever,ditar,domar,falar,feder,ficar,furar,gabar,gelar,gemer,gerar,jogar,lesar,levar,lidar,lutar,mamar,mijar,mimar,minar,morar,nevar,ousar,pirar,podar,pular,rapar,reger,rimar,rolar,sarar,selar,socar,somar,sugar,sujar,tecer,uivar,vagar,vazar,vetar,visar,zelar¦10m:acrescentar,categorizar,centralizar,classificar,concretizar,decepcionar,decodificar,desacelerar,descongelar,desenvolver,desinstalar,desintegrar,desmascarar,dimensionar,enfraquecer,enlouquecer,impulsionar,incapacitar,influenciar,inicializar,inspecionar,interromper,monitorizar,monopolizar,quantificar,reabastecer,recapitular,reconciliar,reencontrar,refinanciar,ressuscitar,sincronizar,solidificar,suplementar,transbordar,transcender¦4em:aderir,aferir,iludir,reler,tingir,premir¦2em:agir,ler,rir¦1íslan:aislar¦9m:amadurecer,amedrontar,amplificar,apresentar,aprisionar,arredondar,atormentar,cauterizar,colecionar,confrontar,desapertar,desconfiar,desesperar,deslumbrar,desmembrar,disseminar,dissimular,engravidar,escravizar,estacionar,evidenciar,extraditar,fertilizar,fortificar,harmonizar,hipnotizar,incriminar,interligar,lubrificar,movimentar,obscurecer,orquestrar,padronizar,pestanejar,posicionar,prejudicar,pressionar,profetizar,pulverizar,qualificar,questionar,raciocinar,reabilitar,reaprender,refrigerar,requisitar,santificar,selecionar,sequestrar,subordinar,transpirar¦3m:arar,moer,suar¦3ienden:ascender¦2ientan:asentar¦6yen:atribuir¦1únan:aunar¦4iam:basear¦7iam:branquear¦5iam:chatear,estrear¦1uecen:cocer¦12n:comercializar,contrarrestar,desenmascarar¦13m:confraternizar,descentralizar¦12m:contra-atacar,correlacionar,desconsiderar,ridicularizar,supervisionar¦2êem:crer¦11m:cumprimentar,desvalorizar,exemplificar,experienciar,familiarizar,impressionar,marginalizar,nacionalizar,negligenciar,possibilitar,providenciar,revolucionar,subvencionar¦5em:demitir,digerir,emergir,incutir,ingerir,oprimir,referir¦3iegan:denegar¦9iam:desencadear¦13n:desestabilizar,individualizar¦3êm:deter,reter¦3uelven:envolver¦3em:ferir,gerir,punir,sumir,ungir¦3yen:fluir¦3iam:frear¦2iegan:fregar,plegar¦1ogem:fugir¦1imen:gemir¦3iden:impedir¦6em:infligir¦16n:institucionalizar¦3ían/palian:paliar¦1ueblan:poblar¦1ulem:polir¦14m:responsabilizar¦7em:retribuir,submergir¦3êem:rever¦1uedan:rodar¦2údam:saudar¦1iembran:sembrar¦1ueldan:soldar¦1ueltan:soltar¦8em:substituir¦1ienden:tender¦1êm:ter,vir¦1ierten:verter¦1igen:regir¦1uestran:mostrar¦4ieren:requerir¦2igen:elegir¦1õem:pôr¦1inden:rendir"
      }
    },
    "pastTense": {
      "first": {
        "fwd": "1:ír¦í:ir,erse,irse¦é:arse¦qué:carse¦uve:ener¦1é:uar¦1í:ger,ver,eer,mer,ler,ñer¦2í:rrer,eder",
        "both": "4í:ometer¦3je:traer¦3í:omper¦2í:rder,nder,eber¦2üé:iguar¦2é:oyar¦2ice:shacer,sfacer¦1je:ucir¦1é:bar,var,ear,mar,par,nar,har,rar,far,ñar,sar,lar,dar,iar,tar,jar¦1í:ser,cer¦1ué:gar¦upe:aber¦ude:oder¦ine:enir¦ije:ecir¦ise:erer¦cé:zar¦use:oner¦qué:car",
        "rev": "acer:ice¦1ar:duve,ie¦1ir:uí,ní,rí¦1carse:equé¦1ener:tuve¦1er:aje,aí¦2erse:oví¦2ir:rtí,imí,rmí,igí,idí,eñí,stí,ití,ibí,rgí,iví,ngí,atí,plí,adí,udí¦2er:lví,ogí,omí,olí¦2arse:amé,cté¦2irse:llí¦3ar:adué,itué,inué,ctué,acué¦3er:tegí,arrí¦3ir:pedí,retí,erví,sumí,ruñí,legí,petí¦3arse:eité,uejé¦4ir:sentí,rregí¦4r:nreí¦4arse:onceé¦4erse:treví¦4er:ucedí¦5arse:reparé¦5irse:epentí",
        "ex": "2:oír¦3:reír¦4:freír¦fui:ir¦3uve:andar,estar¦3í:meter,regir,medir,temer,creer,subir,valer,salir,pedir,tañer¦1ice:hacer¦3je:traer¦2í:caer,oler,leer¦1i:dar,ver¦3e:guiar¦5é:enterarse¦4é:quedarse,juntarse,hallarse¦4í:correr,prever,sentirse,mentir¦3é:mudarse¦1uve:tener"
      },
      "second": {
        "fwd": "ste:r,rse¦uviste:ener¦iste:erse¦udiste:oder¦1iste:per,ter,ver,mer,ger,ser,ñer,ler¦1íste:eer¦2iste:rrer",
        "both": "3iste:ceder¦2iste:rder,nder,eber¦2jiste:raer¦2iciste:sfacer¦1iciste:hacer¦1jiste:ucir¦1iste:cer¦upiste:aber¦iniste:enir¦ijiste:ecir¦isiste:erer¦usiste:oner",
        "rev": "acer:iciste¦1r:aste¦1ar:duviste¦1ener:tuviste¦1er:aíste¦2r:tiste,uiste,riste¦2er:mpiste,lviste,osiste,emiste,ogiste,omiste,añiste¦2ar:stuviste¦3r:imiste,rmiste,igiste,rviste,idiste,eñiste,ibiste,rgiste,iviste,ngiste,pliste,adiste¦3er:arriste¦3rse:ecaste,amaste,ctaste,lliste¦4rse:teraste,uedaste,nceaste,eitaste,uejaste¦4r:pediste,sumiste,ruñiste,audiste¦4erse:treviste¦5er:rotegiste,rometiste¦5r:onreíste,acudiste,rregiste",
        "ex": "fuiste:ir¦3uviste:andar,estar¦1iciste:hacer¦2íste:caer,leer¦1iste:dar,ver¦3iste:moverse,meter,valer,soler¦4ste:regir,medir,mudarse,subir,salir,pedir,freír¦3ste:unir,reír¦4iste:correr,prever¦5ste:juntarse,elegir,hallarse,sentirse¦2ste:oír¦7ste:prepararse¦2iste:oler¦3íste:creer¦1uviste:tener¦9ste:arrepentirse¦1udiste:poder"
      },
      "third": {
        "fwd": "ó:ar,arse¦intió:entir,entirse¦igió:egir¦itió:etir¦uvo:ener¦idió:edir¦istió:estir¦1ió:cer,per,ter,verse,ver,mer,ger,ler¦1ó:lirse,ñer¦2ió:rrer¦2ó:bir,lir¦3ó:igir,idir,ivir,udir,itir,rrir¦4ó:istir",
        "both": "4ó:artir,nguir,ufrir¦3ó:brir,adir,atir,ngir,rgir,umir,imir¦2yó:buir,nuir,luir,tuir,ruir¦2ió:rder,eder,nder,nreír,eber¦2ó:uñir¦2jo:raer¦2izo:sfacer¦1ió:ser¦1yó:eer¦1izo:hacer¦1jo:ucir¦upo:aber¦udo:oder¦urió:orir¦ino:enir¦iguió:eguir¦ijo:ecir¦irió:erir¦iñó:eñir¦irvió:ervir¦iso:erer¦irtió:ertir¦uso:oner",
        "rev": "ormir:urmió¦acer:izo¦1ar:có,pó,tó,zó,duvo,gó,só,ró,eó,ló,dó,nó,fó,hó,vó,mó,jó,bó,uó¦1entir:sintió¦1edir:pidió¦1etir:ritió,pitió¦1ener:tuvo¦1ir:uyó¦1entirse:pintió¦1er:ayó¦2erse:ovió¦2er:egió,eció,etió,lvió,emió,ogió¦2r:nió¦2ar:rio,oñó,oyó,eñó,uio,stuvo¦2arse:amó,ctó¦2egir:rrigió¦3arse:teró,nceó,eitó,uejó¦3ar:quió,gañó,pañó,ició,ució¦3er:ompió,arrió,orrió,erció,enció,noció¦3r:ibió,ubió,plió¦3irse:ulló¦4ar:unció,onfió,impió,soció,tudió¦4r:xigió,cidió,cudió,mitió,vivió,urrió,audió¦4erse:trevió¦4er:enació¦5arse:reparó¦5r:sistió,fligió,irigió¦5ar:preció,vorció",
        "ex": "fue:ir¦3uvo:andar,estar¦1urmió:dormir¦3ó:unir,odiar,secarse,mudarse,bañar,tañer¦1izo:hacer¦3o:criar,guiar¦1yó:oír¦2yó:huir,caer¦2ió:freír,oler¦1io:dar,reír,ver¦3ió:yacer,nacer,valer,comer,soler¦1igió:regir¦4ió:torcer,prever¦4ó:quedarse,enviar,vivir,juntarse,variar,vaciar,hallarse,salir,copiar¦1idió:medir,pedir¦6ó:negociar¦1uvo:tener¦2igió:elegir¦5ó:aliviar¦1intió:sentirse,mentir¦1istió:vestir"
      },
      "firstPlural": {
        "fwd": "mos:r,rse¦uvimos:ener¦imos:erse¦udimos:oder¦1imos:per,ter,ver,mer,ger,ser,ñer,ler¦1ímos:eer¦2imos:rrer",
        "both": "3imos:ceder¦2imos:rder,nder,eber¦2jimos:raer¦2icimos:sfacer¦1icimos:hacer¦1jimos:ucir¦1imos:cer¦upimos:aber¦inimos:enir¦ijimos:ecir¦isimos:erer¦usimos:oner",
        "rev": "acer:icimos¦1r:amos¦1ar:duvimos¦1ener:tuvimos¦1er:aímos¦2r:timos,uimos,rimos¦2er:mpimos,lvimos,osimos,emimos,ogimos,omimos,añimos¦2ar:stuvimos¦3r:imimos,rmimos,igimos,rvimos,idimos,eñimos,ibimos,rgimos,ivimos,ngimos,plimos,adimos¦3er:arrimos¦3rse:ecamos,amamos,ctamos,llimos¦4rse:teramos,uedamos,nceamos,eitamos,uejamos¦4r:pedimos,sumimos,ruñimos,audimos¦4erse:trevimos¦5er:rotegimos,rometimos¦5r:onreímos,acudimos,rregimos",
        "ex": "fuimos:ir¦3uvimos:andar,estar¦1icimos:hacer¦2ímos:caer,leer¦1imos:dar,ver¦3imos:moverse,meter,valer,soler¦4mos:regir,medir,mudarse,subir,salir,pedir,freír¦3mos:unir,reír¦4imos:correr,prever¦5mos:juntarse,elegir,hallarse,sentirse¦2mos:oír¦7mos:prepararse¦2imos:oler¦3ímos:creer¦1uvimos:tener¦9mos:arrepentirse¦1udimos:poder"
      },
      "secondPlural": {
        "fwd": "steis:r,rse¦uvisteis:ener¦isteis:erse¦udisteis:oder¦1isteis:per,ter,ver,mer,ger,ser,ñer,ler¦1ísteis:eer¦2isteis:rrer",
        "both": "3isteis:ceder¦2isteis:rder,nder,eber¦2jisteis:raer¦2icisteis:sfacer¦1icisteis:hacer¦1jisteis:ucir¦1isteis:cer¦upisteis:aber¦inisteis:enir¦ijisteis:ecir¦isisteis:erer¦usisteis:oner",
        "rev": "acer:icisteis¦1r:asteis¦1ar:duvisteis¦1ener:tuvisteis¦1er:aísteis¦2r:tisteis,uisteis,risteis¦2er:mpisteis,lvisteis,osisteis,emisteis,ogisteis,omisteis,añisteis¦2ar:stuvisteis¦3r:imisteis,rmisteis,igisteis,rvisteis,idisteis,eñisteis,ibisteis,rgisteis,ivisteis,ngisteis,plisteis,adisteis¦3er:arristeis¦3rse:ecasteis,amasteis,ctasteis,llisteis¦4rse:terasteis,uedasteis,nceasteis,eitasteis,uejasteis¦4r:pedisteis,sumisteis,ruñisteis,audisteis¦4erse:trevisteis¦5er:rotegisteis,rometisteis¦5r:onreísteis,acudisteis,rregisteis",
        "ex": "fuisteis:ir¦3uvisteis:andar,estar¦1icisteis:hacer¦2ísteis:caer,leer¦1isteis:dar,ver¦3isteis:moverse,meter,valer,soler¦4steis:regir,medir,mudarse,subir,salir,pedir,freír¦3steis:unir,reír¦4isteis:correr,prever¦5steis:juntarse,elegir,hallarse,sentirse¦2steis:oír¦7steis:prepararse¦2isteis:oler¦3ísteis:creer¦1uvisteis:tener¦9steis:arrepentirse¦1udisteis:poder"
      },
      "thirdPlural": {
        "fwd": "intieron:entir,entirse¦igieron:egir¦idieron:edir¦ieron:eír¦uvieron:ener¦itieron:etir¦udieron:oder¦istieron:estir¦1ieron:per,ter,ver,verse,ler,ser,mer,ger¦2on:arse¦2ieron:rrer¦2eron:bir,lir¦3eron:igir,idir,udir,itir¦3on:ñer¦4eron:istir",
        "both": "5eron:burrir¦4eron:artir,vivir,nguir,ufrir¦3eron:adir,ngir,brir,atir,rgir,umir,imir¦2yeron:buir,nuir,luir,tuir,ruir¦2ieron:eber,rder,eder,nder¦2eron:uñir¦2jeron:raer¦2on:ar¦1eron:lirse¦1yeron:eer¦1icieron:hacer,facer¦1jeron:ucir¦1ieron:cer¦upieron:aber¦urieron:orir¦inieron:enir¦iguieron:eguir¦ijeron:ecir¦irieron:erir¦iñeron:eñir¦irvieron:ervir¦isieron:erer¦urmieron:ormir¦irtieron:ertir¦usieron:oner",
        "rev": "4:añeron¦acer:icieron¦1entir:sintieron¦1ar:duvieron¦1edir:pidieron¦1etir:ritieron,pitieron¦1ener:tuvieron¦1ir:uyeron¦1entirse:pintieron¦1er:ayeron¦2erse:ovieron¦2er:egieron,mpieron,etieron,lvieron,osieron,emieron,ogieron¦2egir:rrigieron¦2ar:stuvieron¦3eír:onrieron¦3er:orrieron¦3r:ivieron,ibieron,ubieron,plieron¦4r:xigieron,cidieron,cudieron,mitieron,audieron¦4se:amaron,ctaron¦5se:teraron,uedaron,ncearon,eitaron,uejaron¦5r:sistieron,fligieron,irigieron",
        "ex": "fueron:ir¦3uvieron:andar,estar¦3eron:unir¦1icieron:hacer¦4eron:vivir,salir¦1yeron:oír¦2yeron:huir,caer¦1ieron:dar,ver,reír¦1igieron:regir¦4ieron:barrer,prever¦5on:secarse,mudarse¦5ieron:atreverse¦6on:juntarse,hallarse¦1idieron:medir,pedir¦8on:prepararse¦2ieron:oler,freír¦1uvieron:tener¦2igieron:elegir¦3ieron:valer,comer,soler¦1udieron:poder¦1intieron:sentirse,mentir¦1istieron:vestir"
      }
    },
    "imperfectTense": {
      "first": {
        "fwd": "ía:er,ir¦ba:rse¦1a:ír",
        "both": "1ba:ar",
        "rev": "1er:cía,vía,hía,oía,xía,jía¦1ir:uía,üía¦2er:ebía,onía,ndía,ogía,omía,añía,abía,azía,rbía,rdía,izía,osía,amía,seía,caía,elía¦2ir:imía,rmía,igía,idía,eñía,ería,stía,itía,ucía,rgía,uñía,ubía,ibía,oría,bría,llía,plía,adía,udía,upía,iría,agía,pría,spía,uzía,gría,rnía,lpía,ugía,utía,tría,uvía,umía,dría,inía,unía,saía,ssía¦3ir:entía,pedía,legía,venía,petía,regía,urría,artía,bolía,redía,undía,urtía,golía,andía,lodía,umpía,indía,salía,umbía,ingía¦3er:tegía,ompía,arría,metía,orría,cedía,tenía,ontía,molía,rguía,angía,ustía¦4r:nreía¦4ir:mbatía,rantía,tervía,ldecía,fletía,btraía¦4er:ebatía,straía,tretía,premía,roveía¦5ir:ivertía,erretía,dvertía,endecía,redecía,nvertía,sparcía,flectía¦5rse:filiaba¦5er:rvertía,evertía,bvertía",
        "ex": "era:ser¦1ba:ir¦2ía:ver,unir,oler,leer,caer,agir,crer,sair¦3ía:regir,meter,vivir,medir,venir,traer,temer,creer,tener,valer,salir,pedir,poder,batir,decir,soler,parir,ceder,cozer,deter,doler,feder,gemer,latir,moler,obter,polir,reter,ungir¦4ía:sufrir,querer,servir,atraer,hervir,abater,lamber,manter,premir,sofrer,sorrir,tremer,verter¦2a:oír¦8ía:sobrevivir¦4a:freír¦3a:reír¦9ía:contradecir,descontrair¦6ía:contraer¦5ía:emerger,extraer¦1ía:ler,rir,ter,vir¦7ba:suicidarse"
      },
      "second": {
        "fwd": "ías:er,ir¦bas:rse¦1as:ír",
        "both": "1bas:ar",
        "rev": "1er:cías,vías,hías,oías,xías,jías¦1ir:uías,üías¦2er:ebías,onías,ndías,ogías,omías,añías,abías,azías,rbías,rdías,izías,osías,amías,seías,caías,elías¦2ir:imías,rmías,igías,idías,eñías,erías,stías,itías,ucías,rgías,uñías,ubías,ibías,orías,brías,llías,plías,adías,udías,upías,irías,agías,prías,spías,uzías,grías,rnías,lpías,ugías,utías,trías,uvías,umías,drías,inías,unías,saías,ssías¦3ir:entías,pedías,legías,venías,petías,regías,urrías,artías,bolías,redías,undías,urtías,golías,andías,lodías,umpías,indías,salías,umbías,ingías¦3er:tegías,ompías,arrías,metías,orrías,cedías,tenías,ontías,molías,rguías,angías,ustías¦4r:nreías¦4ir:mbatías,rantías,tervías,ldecías,fletías,btraías¦4er:ebatías,straías,tretías,premías,roveías¦5ir:ivertías,erretías,dvertías,endecías,redecías,nvertías,sparcías,flectías¦5rse:filiabas¦5er:rvertías,evertías,bvertías",
        "ex": "eras:ser¦1bas:ir¦2ías:ver,unir,oler,leer,caer,agir,crer,sair¦3ías:regir,meter,vivir,medir,venir,traer,temer,creer,tener,valer,salir,pedir,poder,batir,decir,soler,parir,ceder,cozer,deter,doler,feder,gemer,latir,moler,obter,polir,reter,ungir¦4ías:sufrir,querer,servir,atraer,hervir,abater,lamber,manter,premir,sofrer,sorrir,tremer,verter¦2as:oír¦8ías:sobrevivir¦4as:freír¦3as:reír¦9ías:contradecir,descontrair¦6ías:contraer¦5ías:emerger,extraer¦1ías:ler,rir,ter,vir¦7bas:suicidarse"
      },
      "third": {
        "fwd": "ía:er,ir¦ba:rse¦1a:ír",
        "both": "1ba:ar",
        "rev": "1er:cía,vía,hía,oía,xía,jía¦1ir:uía,üía¦2er:ebía,onía,ndía,ogía,omía,añía,abía,azía,rbía,rdía,izía,osía,amía,seía,caía,elía¦2ir:imía,rmía,igía,idía,eñía,ería,stía,itía,ucía,rgía,uñía,ubía,ibía,oría,bría,llía,plía,adía,udía,upía,iría,agía,pría,spía,uzía,gría,rnía,lpía,ugía,utía,tría,uvía,umía,dría,inía,unía,saía,ssía¦3ir:entía,pedía,legía,venía,petía,regía,urría,artía,bolía,redía,undía,urtía,golía,andía,lodía,umpía,indía,salía,umbía,ingía¦3er:tegía,ompía,arría,metía,orría,cedía,tenía,ontía,molía,rguía,angía,ustía¦4r:nreía¦4ir:mbatía,rantía,tervía,ldecía,fletía,btraía¦4er:ebatía,straía,tretía,premía,roveía¦5ir:ivertía,erretía,dvertía,endecía,redecía,nvertía,sparcía,flectía¦5rse:filiaba¦5er:rvertía,evertía,bvertía",
        "ex": "era:ser¦1ba:ir¦2ía:ver,unir,oler,leer,caer,agir,crer,sair¦3ía:regir,meter,vivir,medir,venir,traer,temer,creer,tener,valer,salir,pedir,poder,batir,decir,soler,parir,ceder,cozer,deter,doler,feder,gemer,latir,moler,obter,polir,reter,ungir¦4ía:sufrir,querer,servir,atraer,hervir,abater,lamber,manter,premir,sofrer,sorrir,tremer,verter¦2a:oír¦8ía:sobrevivir¦4a:freír¦3a:reír¦9ía:contradecir,descontrair¦6ía:contraer¦5ía:emerger,extraer¦1ía:ler,rir,ter,vir¦7ba:suicidarse"
      },
      "firstPlural": {
        "fwd": "íamos:ir,er¦ábamos:arse¦1amos:ír",
        "both": "ábamos:ar",
        "rev": "1er:cíamos,víamos,híamos,oíamos,xíamos,jíamos¦1ir:uíamos,üíamos¦2er:ebíamos,oníamos,ndíamos,ogíamos,omíamos,añíamos,abíamos,azíamos,rbíamos,rdíamos,izíamos,osíamos,amíamos,seíamos,caíamos,elíamos¦2ir:imíamos,rmíamos,igíamos,idíamos,eñíamos,eríamos,stíamos,itíamos,ucíamos,rgíamos,uñíamos,ubíamos,ibíamos,oríamos,bríamos,llíamos,plíamos,adíamos,udíamos,upíamos,iríamos,agíamos,príamos,spíamos,uzíamos,gríamos,rníamos,lpíamos,ugíamos,utíamos,tríamos,uvíamos,umíamos,dríamos,iníamos,uníamos,saíamos,ssíamos¦3ir:entíamos,pedíamos,legíamos,veníamos,petíamos,regíamos,urríamos,artíamos,bolíamos,redíamos,undíamos,urtíamos,golíamos,andíamos,lodíamos,umpíamos,indíamos,salíamos,umbíamos,ingíamos¦3er:tegíamos,ompíamos,arríamos,metíamos,orríamos,cedíamos,teníamos,ontíamos,molíamos,rguíamos,angíamos,ustíamos¦4r:nreíamos¦4ir:mbatíamos,rantíamos,tervíamos,ldecíamos,fletíamos,btraíamos¦4arse:filiábamos,icidábamos¦4er:ebatíamos,straíamos,tretíamos,premíamos,roveíamos¦5ir:ivertíamos,erretíamos,dvertíamos,endecíamos,redecíamos,nvertíamos,sparcíamos,flectíamos¦5er:rvertíamos,evertíamos,bvertíamos",
        "ex": "íbamos:ir¦éramos:ser¦2íamos:ver,unir,oler,leer,caer,agir,crer,sair¦3íamos:regir,meter,vivir,medir,venir,traer,temer,creer,tener,valer,salir,pedir,poder,batir,decir,soler,parir,ceder,cozer,deter,doler,feder,gemer,latir,moler,obter,polir,reter,ungir¦4íamos:sufrir,querer,servir,atraer,hervir,abater,lamber,manter,premir,sofrer,sorrir,tremer,verter¦2amos:oír¦8íamos:sobrevivir¦4amos:freír¦3amos:reír¦9íamos:contradecir,descontrair¦6íamos:contraer¦5íamos:emerger,extraer¦1íamos:ler,rir,ter,vir"
      },
      "secondPlural": {
        "fwd": "íais:er,ir¦bais:rse¦1ais:ír",
        "both": "1bais:ar",
        "rev": "1er:cíais,víais,híais,oíais,xíais,jíais¦1ir:uíais,üíais¦2er:ebíais,oníais,ndíais,ogíais,omíais,añíais,abíais,azíais,rbíais,rdíais,izíais,osíais,amíais,seíais,caíais,elíais¦2ir:imíais,rmíais,igíais,idíais,eñíais,eríais,stíais,itíais,ucíais,rgíais,uñíais,ubíais,ibíais,oríais,bríais,llíais,plíais,adíais,udíais,upíais,iríais,agíais,príais,spíais,uzíais,gríais,rníais,lpíais,ugíais,utíais,tríais,uvíais,umíais,dríais,iníais,uníais,saíais,ssíais¦3ir:entíais,pedíais,legíais,veníais,petíais,regíais,urríais,artíais,bolíais,redíais,undíais,urtíais,golíais,andíais,lodíais,umpíais,indíais,salíais,umbíais,ingíais¦3er:tegíais,ompíais,arríais,metíais,orríais,cedíais,teníais,ontíais,molíais,rguíais,angíais,ustíais¦4r:nreíais¦4ir:mbatíais,rantíais,tervíais,ldecíais,fletíais,btraíais¦4er:ebatíais,straíais,tretíais,premíais,roveíais¦5ir:ivertíais,erretíais,dvertíais,endecíais,redecíais,nvertíais,sparcíais,flectíais¦5rse:filiabais¦5er:rvertíais,evertíais,bvertíais",
        "ex": "erais:ser¦1bais:ir¦2íais:ver,unir,oler,leer,caer,agir,crer,sair¦3íais:regir,meter,vivir,medir,venir,traer,temer,creer,tener,valer,salir,pedir,poder,batir,decir,soler,parir,ceder,cozer,deter,doler,feder,gemer,latir,moler,obter,polir,reter,ungir¦4íais:sufrir,querer,servir,atraer,hervir,abater,lamber,manter,premir,sofrer,sorrir,tremer,verter¦2ais:oír¦8íais:sobrevivir¦4ais:freír¦3ais:reír¦9íais:contradecir,descontrair¦6íais:contraer¦5íais:emerger,extraer¦1íais:ler,rir,ter,vir¦7bais:suicidarse"
      },
      "thirdPlural": {
        "fwd": "ían:er,ir¦ban:rse¦1an:ír",
        "both": "1ban:ar",
        "rev": "1er:cían,vían,hían,oían,xían,jían¦1ir:uían,üían¦2er:ebían,onían,ndían,ogían,omían,añían,abían,azían,rbían,rdían,izían,osían,amían,seían,caían,elían¦2ir:imían,rmían,igían,idían,eñían,erían,stían,itían,ucían,rgían,uñían,ubían,ibían,orían,brían,llían,plían,adían,udían,upían,irían,agían,prían,spían,uzían,grían,rnían,lpían,ugían,utían,trían,uvían,umían,drían,inían,unían,saían,ssían¦3ir:entían,pedían,legían,venían,petían,regían,urrían,artían,bolían,redían,undían,urtían,golían,andían,lodían,umpían,indían,salían,umbían,ingían¦3er:tegían,ompían,arrían,metían,orrían,cedían,tenían,ontían,molían,rguían,angían,ustían¦4r:nreían¦4ir:mbatían,rantían,tervían,ldecían,fletían,btraían¦4er:ebatían,straían,tretían,premían,roveían¦5ir:ivertían,erretían,dvertían,endecían,redecían,nvertían,sparcían,flectían¦5rse:filiaban¦5er:rvertían,evertían,bvertían",
        "ex": "eran:ser¦1ban:ir¦2ían:ver,unir,oler,leer,caer,agir,crer,sair¦3ían:regir,meter,vivir,medir,venir,traer,temer,creer,tener,valer,salir,pedir,poder,batir,decir,soler,parir,ceder,cozer,deter,doler,feder,gemer,latir,moler,obter,polir,reter,ungir¦4ían:sufrir,querer,servir,atraer,hervir,abater,lamber,manter,premir,sofrer,sorrir,tremer,verter¦2an:oír¦8ían:sobrevivir¦4an:freír¦3an:reír¦9ían:contradecir,descontrair¦6ían:contraer¦5ían:emerger,extraer¦1ían:ler,rir,ter,vir¦7ban:suicidarse"
      }
    },
    "futureTense": {
      "first": {
        "fwd": "é:,se¦iré:ír¦2ré:hacer¦2dré:enir,alir",
        "both": "3ré:sfacer¦2ré:aber,erer¦1dré:ner",
        "rev": "2:eré¦3:caré,paré,iaré,raré,garé,zaré,daré,tiré,giré,diré,taré,uiré,saré,laré,naré,haré,viré,ñaré,maré,riré,earé,jaré,biré,ciré,varé,uaré,baré,ñiré¦4:imiré,rmiré,nfaré,oyaré,pliré¦5:sumiré¦1ír:eiré¦2er:odré¦4se:overé,amaré,ctaré,lliré¦4cer:esharé¦5se:teraré,ncearé,eitaré,uejaré¦5ir:onvendré",
        "ex": "2ré:hacer¦3dré:valer,venir,salir¦3ré:poder¦1iré:decir,oír¦2é:ir¦6é:quedarse,juntarse,hallarse,sentirse¦4é:unir¦5é:secarse,mudarse¦7é:atreverse¦8é:prepararse¦10é:arrepentirse¦3é:dar"
      },
      "second": {
        "fwd": "ás:,se¦irás:ír¦2rás:hacer¦2drás:enir,alir",
        "both": "3rás:sfacer¦2rás:aber,erer¦1drás:ner",
        "rev": "2:erás¦3:carás,parás,iarás,rarás,garás,zarás,darás,tirás,girás,dirás,tarás,uirás,sarás,larás,narás,harás,virás,ñarás,marás,rirás,earás,jarás,birás,cirás,varás,uarás,barás,ñirás¦4:imirás,rmirás,nfarás,oyarás,plirás¦5:sumirás¦1ír:eirás¦2er:odrás¦4se:overás,amarás,ctarás,llirás¦4cer:esharás¦5se:terarás,ncearás,eitarás,uejarás¦5ir:onvendrás",
        "ex": "2rás:hacer¦3drás:valer,venir,salir¦3rás:poder¦1irás:decir,oír¦2ás:ir¦6ás:quedarse,juntarse,hallarse,sentirse¦4ás:unir¦5ás:secarse,mudarse¦7ás:atreverse¦8ás:prepararse¦10ás:arrepentirse¦3ás:dar"
      },
      "third": {
        "fwd": "á:,se¦irá:ír¦2rá:hacer¦2drá:enir,alir",
        "both": "3rá:sfacer¦2rá:aber,erer¦1drá:ner",
        "rev": "2:erá¦3:cará,pará,iará,rará,gará,zará,dará,tirá,girá,dirá,tará,uirá,sará,lará,nará,hará,virá,ñará,mará,rirá,eará,jará,birá,cirá,vará,uará,bará,ñirá¦4:imirá,rmirá,nfará,oyará,plirá¦5:sumirá¦1ír:eirá¦2er:odrá¦4se:overá,amará,ctará,llirá¦4cer:eshará¦5se:terará,nceará,eitará,uejará¦5ir:onvendrá",
        "ex": "2rá:hacer¦3drá:valer,venir,salir¦3rá:poder¦1irá:decir,oír¦2á:ir¦6á:quedarse,juntarse,hallarse,sentirse¦4á:unir¦5á:secarse,mudarse¦7á:atreverse¦8á:prepararse¦10á:arrepentirse¦3á:dar"
      },
      "firstPlural": {
        "fwd": "emos:,se¦iremos:ír¦2remos:hacer¦2dremos:enir,alir",
        "both": "3remos:sfacer¦2remos:aber,erer¦1dremos:ner",
        "rev": "2:eremos¦3:caremos,paremos,iaremos,raremos,garemos,zaremos,daremos,tiremos,giremos,diremos,taremos,uiremos,saremos,laremos,naremos,haremos,viremos,ñaremos,maremos,riremos,earemos,jaremos,biremos,ciremos,varemos,uaremos,baremos,ñiremos¦4:imiremos,rmiremos,nfaremos,oyaremos,pliremos¦5:sumiremos¦1ír:eiremos¦2er:odremos¦4se:overemos,amaremos,ctaremos,lliremos¦4cer:esharemos¦5se:teraremos,ncearemos,eitaremos,uejaremos¦5ir:onvendremos",
        "ex": "2remos:hacer¦3dremos:valer,venir,salir¦3remos:poder¦1iremos:decir,oír¦2emos:ir¦6emos:quedarse,juntarse,hallarse,sentirse¦4emos:unir¦5emos:secarse,mudarse¦7emos:atreverse¦8emos:prepararse¦10emos:arrepentirse¦3emos:dar"
      },
      "secondPlural": {
        "fwd": "éis:,se¦iréis:ír¦2réis:hacer¦2dréis:enir,alir",
        "both": "3réis:sfacer¦2réis:aber,erer¦1dréis:ner",
        "rev": "2:eréis¦3:caréis,paréis,iaréis,raréis,garéis,zaréis,daréis,tiréis,giréis,diréis,taréis,uiréis,saréis,laréis,naréis,haréis,viréis,ñaréis,maréis,riréis,earéis,jaréis,biréis,ciréis,varéis,uaréis,baréis,ñiréis¦4:imiréis,rmiréis,nfaréis,oyaréis,pliréis¦5:sumiréis¦1ír:eiréis¦2er:odréis¦4se:overéis,amaréis,ctaréis,lliréis¦4cer:esharéis¦5se:teraréis,ncearéis,eitaréis,uejaréis¦5ir:onvendréis",
        "ex": "2réis:hacer¦3dréis:valer,venir,salir¦3réis:poder¦1iréis:decir,oír¦2éis:ir¦6éis:quedarse,juntarse,hallarse,sentirse¦4éis:unir¦5éis:secarse,mudarse¦7éis:atreverse¦8éis:prepararse¦10éis:arrepentirse¦3éis:dar"
      },
      "thirdPlural": {
        "fwd": "án:,se¦irán:ír¦2rán:hacer¦2drán:enir,alir",
        "both": "3rán:sfacer¦2rán:aber,erer¦1drán:ner",
        "rev": "2:erán¦3:carán,parán,iarán,rarán,garán,zarán,darán,tirán,girán,dirán,tarán,uirán,sarán,larán,narán,harán,virán,ñarán,marán,rirán,earán,jarán,birán,cirán,varán,uarán,barán,ñirán¦4:imirán,rmirán,nfarán,oyarán,plirán¦5:sumirán¦1ír:eirán¦2er:odrán¦4se:overán,amarán,ctarán,llirán¦4cer:esharán¦5se:terarán,ncearán,eitarán,uejarán¦5ir:onvendrán",
        "ex": "2rán:hacer¦3drán:valer,venir,salir¦3rán:poder¦1irán:decir,oír¦2án:ir¦6án:quedarse,juntarse,hallarse,sentirse¦4án:unir¦5án:secarse,mudarse¦7án:atreverse¦8án:prepararse¦10án:arrepentirse¦3án:dar"
      }
    },
    "conditional": {
      "first": {
        "fwd": "ía:,se¦iría:ír¦2ría:hacer¦2dría:enir,alir",
        "both": "3ría:sfacer¦2ría:aber,erer¦1dría:ner",
        "rev": "2:ería¦3:caría,paría,iaría,raría,garía,zaría,daría,tiría,giría,diría,taría,uiría,saría,laría,naría,haría,viría,ñaría,maría,riría,earía,jaría,biría,ciría,varía,uaría,baría,ñiría¦4:imiría,rmiría,nfaría,oyaría,pliría¦5:sumiría¦1ír:eiría¦2er:odría¦4se:overía,amaría,ctaría,lliría¦4cer:esharía¦5se:teraría,ncearía,eitaría,uejaría¦5ir:onvendría",
        "ex": "2ría:hacer¦3dría:valer,venir,salir¦3ría:poder¦1iría:decir,oír¦2ía:ir¦6ía:quedarse,juntarse,hallarse,sentirse¦4ía:unir¦5ía:secarse,mudarse¦7ía:atreverse¦8ía:prepararse¦10ía:arrepentirse¦3ía:dar"
      },
      "second": {
        "fwd": "ías:,se¦irías:ír¦2rías:hacer¦2drías:enir,alir",
        "both": "3rías:sfacer¦2rías:aber,erer¦1drías:ner",
        "rev": "2:erías¦3:carías,parías,iarías,rarías,garías,zarías,darías,tirías,girías,dirías,tarías,uirías,sarías,larías,narías,harías,virías,ñarías,marías,rirías,earías,jarías,birías,cirías,varías,uarías,barías,ñirías¦4:imirías,rmirías,nfarías,oyarías,plirías¦5:sumirías¦1ír:eirías¦2er:odrías¦4se:overías,amarías,ctarías,llirías¦4cer:esharías¦5se:terarías,ncearías,eitarías,uejarías¦5ir:onvendrías",
        "ex": "2rías:hacer¦3drías:valer,venir,salir¦3rías:poder¦1irías:decir,oír¦2ías:ir¦6ías:quedarse,juntarse,hallarse,sentirse¦4ías:unir¦5ías:secarse,mudarse¦7ías:atreverse¦8ías:prepararse¦10ías:arrepentirse¦3ías:dar"
      },
      "third": {
        "fwd": "ía:,se¦iría:ír¦2ría:hacer¦2dría:enir,alir",
        "both": "3ría:sfacer¦2ría:aber,erer¦1dría:ner",
        "rev": "2:ería¦3:caría,paría,iaría,raría,garía,zaría,daría,tiría,giría,diría,taría,uiría,saría,laría,naría,haría,viría,ñaría,maría,riría,earía,jaría,biría,ciría,varía,uaría,baría,ñiría¦4:imiría,rmiría,nfaría,oyaría,pliría¦5:sumiría¦1ír:eiría¦2er:odría¦4se:overía,amaría,ctaría,lliría¦4cer:esharía¦5se:teraría,ncearía,eitaría,uejaría¦5ir:onvendría",
        "ex": "2ría:hacer¦3dría:valer,venir,salir¦3ría:poder¦1iría:decir,oír¦2ía:ir¦6ía:quedarse,juntarse,hallarse,sentirse¦4ía:unir¦5ía:secarse,mudarse¦7ía:atreverse¦8ía:prepararse¦10ía:arrepentirse¦3ía:dar"
      },
      "firstPlural": {
        "fwd": "íamos:,se¦iríamos:ír¦2ríamos:hacer¦2dríamos:enir,alir",
        "both": "3ríamos:sfacer¦2ríamos:aber,erer¦1dríamos:ner",
        "rev": "2:eríamos¦3:caríamos,paríamos,iaríamos,raríamos,garíamos,zaríamos,daríamos,tiríamos,giríamos,diríamos,taríamos,uiríamos,saríamos,laríamos,naríamos,haríamos,viríamos,ñaríamos,maríamos,riríamos,earíamos,jaríamos,biríamos,ciríamos,varíamos,uaríamos,baríamos,ñiríamos¦4:imiríamos,rmiríamos,nfaríamos,oyaríamos,pliríamos¦5:sumiríamos¦1ír:eiríamos¦2er:odríamos¦4se:overíamos,amaríamos,ctaríamos,lliríamos¦4cer:esharíamos¦5se:teraríamos,ncearíamos,eitaríamos,uejaríamos¦5ir:onvendríamos",
        "ex": "2ríamos:hacer¦3dríamos:valer,venir,salir¦3ríamos:poder¦1iríamos:decir,oír¦2íamos:ir¦6íamos:quedarse,juntarse,hallarse,sentirse¦4íamos:unir¦5íamos:secarse,mudarse¦7íamos:atreverse¦8íamos:prepararse¦10íamos:arrepentirse¦3íamos:dar"
      },
      "secondPlural": {
        "fwd": "íais:,se¦iríais:ír¦2ríais:hacer¦2dríais:enir,alir",
        "both": "3ríais:sfacer¦2ríais:aber,erer¦1dríais:ner",
        "rev": "2:eríais¦3:caríais,paríais,iaríais,raríais,garíais,zaríais,daríais,tiríais,giríais,diríais,taríais,uiríais,saríais,laríais,naríais,haríais,viríais,ñaríais,maríais,riríais,earíais,jaríais,biríais,ciríais,varíais,uaríais,baríais,ñiríais¦4:imiríais,rmiríais,nfaríais,oyaríais,pliríais¦5:sumiríais¦1ír:eiríais¦2er:odríais¦4se:overíais,amaríais,ctaríais,lliríais¦4cer:esharíais¦5se:teraríais,ncearíais,eitaríais,uejaríais¦5ir:onvendríais",
        "ex": "2ríais:hacer¦3dríais:valer,venir,salir¦3ríais:poder¦1iríais:decir,oír¦2íais:ir¦6íais:quedarse,juntarse,hallarse,sentirse¦4íais:unir¦5íais:secarse,mudarse¦7íais:atreverse¦8íais:prepararse¦10íais:arrepentirse¦3íais:dar"
      },
      "thirdPlural": {
        "fwd": "ían:,se¦irían:ír¦2rían:hacer¦2drían:enir,alir",
        "both": "3rían:sfacer¦2rían:aber,erer¦1drían:ner",
        "rev": "2:erían¦3:carían,parían,iarían,rarían,garían,zarían,darían,tirían,girían,dirían,tarían,uirían,sarían,larían,narían,harían,virían,ñarían,marían,rirían,earían,jarían,birían,cirían,varían,uarían,barían,ñirían¦4:imirían,rmirían,nfarían,oyarían,plirían¦5:sumirían¦1ír:eirían¦2er:odrían¦4se:overían,amarían,ctarían,llirían¦4cer:esharían¦5se:terarían,ncearían,eitarían,uejarían¦5ir:onvendrían",
        "ex": "2rían:hacer¦3drían:valer,venir,salir¦3rían:poder¦1irían:decir,oír¦2ían:ir¦6ían:quedarse,juntarse,hallarse,sentirse¦4ían:unir¦5ían:secarse,mudarse¦7ían:atreverse¦8ían:prepararse¦10ían:arrepentirse¦3ían:dar"
      }
    },
    "subjunctive": {
      "first": {
        "fwd": "ita:etir¦ija:egir¦ida:edir¦e:arse¦ienta:entir,entirse¦iera:erir,erer¦ja:ger¦iga:ecir,eguir¦a:erse¦uegue:ogar¦ista:estir¦1a:ter,per,mer,eer,bir,lirse,ñer¦1ga:ner¦1ja:igir¦2ga:enir,aler¦2e:eñar,enar,erar,evar¦2a:itir,nguir,rrer¦2za:ercer¦3e:estar",
        "both": "5e:elebrar,lustrar,rpretar,espetar¦5ga:tisfacer¦4ue:njugar¦4e:sentar,istrar,cionar,ventar,liviar,mentar,tentar,bordar,amorar¦4a:burrir,pender,rever,sistir,render,uceder¦4üe:eriguar¦3e:ersar,visar,dorar,indar,donar,mbrar,corar,resar,lorar,ortar,antar,cabar,yunar,ustar,istar,orrar,vorar,ansar,untar,ardar,ausar,ornar,ervar,intar¦3a:ruñir,artir,cidir,onder,sumir¦3ue:regar,vegar¦3zca:enacer¦3úe:raduar¦2íe:nviar,aciar¦2e:adar,utar,lvar,anar,piar,asar,avar,prar,añar,irar,cuar,diar,ltar,ivar,inar,edar,udar,grar,atar,urar,ciar,arar,otar,drar,itar,idar¦2ienda:efender¦2íba:ohibir¦2a:brir,adir,eber,plir,udir,atir,imir,ivir,frir¦2ue:rgar,agar,igar¦2ya:buir,ruir,luir,nuir,tuir¦2ga:hacer¦1e:far,har,yar,ear,par,lar,mar,jar¦1uebe:robar¦1iese:fesar,vesar¦1za:ncer¦1iebre:uebrar¦1iente:lentar¦1íe:fiar,uiar,riar¦1zca:ocer,ucir,ecer¦1ja:rgir,ngir¦1uerde:cordar¦1úe:tuar,nuar¦1ienda:tender,cender¦1üere:gorar¦1iga:aer¦1úse:husar¦1a:ser¦1iece:pezar¦uerma:ormir¦iense:ensar¦ience:enzar¦ierte:ertar¦uerza:orcer¦ierda:erder¦epa:aber¦uera:orir¦ierne:ernar¦uestre:ostrar¦ueñe:oñar¦ueva:over¦uentre:ontrar¦ueve:ovar¦ierta:ertir¦uela:oler¦iende:endar¦ueda:oder¦ía:eír¦uerce:orzar¦uelva:olver¦ueste:ostar¦ce:zar¦iña:eñir¦ierre:errar¦que:car",
        "rev": "entar:iente¦olgar:uelgue¦ontar:uente¦ervir:irva,ierva¦ar:é¦etar:iete¦ir:ya¦egar:iegue¦onar:uene¦olar:uele¦1cer:azca,aga¦1etir:rita,pita¦1edir:pida¦1erir:fiera,giera¦1ger:eja,oja¦1entirse:pienta¦1ecir:diga¦1eguir:siga¦1entir:sienta¦1ir:na¦2er:eta,mpa,onga,rea,oma,ema,aña¦2ar:pte,obe¦2gir:xija¦2ir:uba,iba¦2irse:lla¦2erir:quiera¦3ar:señe,orde,onte,ande,lene,pere,aste,legue,obre,leve¦3egir:orrija¦3arse:tere,ncee¦3gir:flija¦3ir:venga,mita¦3er:tenga,orra,arra¦3uir:inga¦3erse:reva¦3cer:jerza¦4ar:teste,ndene¦4er:fenda¦5ar:oleste",
        "ex": "yerre:errar¦huela:oler¦quepa:caber¦vaya:ir¦2zca:yacer,nacer¦4e:abusar,bordar,montar,mandar,gastar,cobrar,entrar,quejarse,jactarse¦2ga:hacer¦1iente:sentar¦1uelgue:colgar¦5e:aceptar¦1uente:contar¦1irva:servir¦3é:estar¦1iele:helar¦1é:dar¦3iete:apretar¦2ya:huir¦1iegue:negar,regar¦3e:untar,andar,besar,robar,cesar,pesar,cenar¦2a:ver,ser,unir,leer¦1uene:sonar¦3ue:pegar¦4ue:llegar¦5a:ofender¦1iga:oír,decir,seguir¦1uele:volar¦3ga:salir,venir,tener,valer¦4a:vender¦2egue:jugar¦2e:usar¦1ierva:hervir¦1ija:regir¦1ienta:mentir,sentir¦4ja:dirigir¦1ida:pedir,medir¦2ija:elegir¦1uegue:rogar¦2iera:querer¦1iera:herir¦1ista:vestir"
      },
      "second": {
        "fwd": "itas:etir¦ijas:egir¦idas:edir¦es:arse¦ientas:entir,entirse¦ieras:erir,erer¦jas:ger¦igas:ecir,eguir¦as:erse¦uegues:ogar¦istas:estir¦1as:ter,per,mer,eer,bir,lirse,ñer¦1gas:ner¦1jas:igir¦2gas:enir,aler¦2es:eñar,enar,erar,evar¦2as:itir,nguir,rrer¦2zas:ercer¦3es:estar",
        "both": "5es:elebrar,lustrar,rpretar,espetar¦5gas:tisfacer¦4ues:njugar¦4es:sentar,istrar,cionar,ventar,liviar,mentar,tentar,bordar,amorar¦4as:burrir,pender,rever,sistir,render,uceder¦4ües:eriguar¦3es:ersar,visar,dorar,indar,donar,mbrar,corar,resar,lorar,ortar,antar,cabar,yunar,ustar,istar,orrar,vorar,ansar,untar,ardar,ausar,ornar,ervar,intar¦3as:ruñir,artir,cidir,onder,sumir¦3ues:regar,vegar¦3zcas:enacer¦3úes:raduar¦2íes:nviar,aciar¦2es:adar,utar,lvar,anar,piar,asar,avar,prar,añar,irar,cuar,diar,ltar,ivar,inar,edar,udar,grar,atar,urar,ciar,arar,otar,drar,itar,idar¦2iendas:efender¦2íbas:ohibir¦2as:brir,adir,eber,plir,udir,atir,imir,ivir,frir¦2ues:rgar,agar,igar¦2yas:buir,ruir,luir,nuir,tuir¦2gas:hacer¦1es:far,har,yar,ear,par,lar,mar,jar¦1uebes:robar¦1ieses:fesar,vesar¦1zas:ncer¦1iebres:uebrar¦1ientes:lentar¦1íes:fiar,uiar,riar¦1zcas:ocer,ucir,ecer¦1jas:rgir,ngir¦1uerdes:cordar¦1úes:tuar,nuar¦1iendas:tender,cender¦1üeres:gorar¦1igas:aer¦1úses:husar¦1as:ser¦1ieces:pezar¦uermas:ormir¦ienses:ensar¦iences:enzar¦iertes:ertar¦uerzas:orcer¦ierdas:erder¦epas:aber¦ueras:orir¦iernes:ernar¦uestres:ostrar¦ueñes:oñar¦uevas:over¦uentres:ontrar¦ueves:ovar¦iertas:ertir¦uelas:oler¦iendes:endar¦uedas:oder¦ías:eír¦uerces:orzar¦uelvas:olver¦uestes:ostar¦ces:zar¦iñas:eñir¦ierres:errar¦ques:car",
        "rev": "entar:ientes¦olgar:uelgues¦ontar:uentes¦ervir:irvas,iervas¦ar:és¦etar:ietes¦ir:yas¦egar:iegues¦onar:uenes¦olar:ueles¦1cer:azcas,agas¦1etir:ritas,pitas¦1edir:pidas¦1erir:fieras,gieras¦1ger:ejas,ojas¦1entirse:pientas¦1ecir:digas¦1eguir:sigas¦1entir:sientas¦1ir:nas¦2er:etas,mpas,ongas,reas,omas,emas,añas¦2ar:ptes,obes¦2gir:xijas¦2ir:ubas,ibas¦2irse:llas¦2erir:quieras¦3ar:señes,ordes,ontes,andes,lenes,peres,astes,legues,obres,leves¦3egir:orrijas¦3arse:teres,ncees¦3gir:flijas¦3ir:vengas,mitas¦3er:tengas,orras,arras¦3uir:ingas¦3erse:revas¦3cer:jerzas¦4ar:testes,ndenes¦4er:fendas¦5ar:olestes",
        "ex": "yerres:errar¦huelas:oler¦quepas:caber¦vayas:ir¦2zcas:yacer,nacer¦4es:abusar,bordar,montar,mandar,gastar,cobrar,entrar,quejarse,jactarse¦2gas:hacer¦1ientes:sentar¦1uelgues:colgar¦5es:aceptar¦1uentes:contar¦1irvas:servir¦3és:estar¦1ieles:helar¦1es:dar¦3ietes:apretar¦2yas:huir¦1iegues:negar,regar¦3es:untar,andar,besar,robar,cesar,pesar,cenar¦2as:ver,ser,unir,leer¦1uenes:sonar¦3ues:pegar¦4ues:llegar¦5as:ofender¦1igas:oír,decir,seguir¦1ueles:volar¦3gas:salir,venir,tener,valer¦4as:vender¦2egues:jugar¦2es:usar¦1iervas:hervir¦1ijas:regir¦1ientas:mentir,sentir¦4jas:dirigir¦1idas:pedir,medir¦2ijas:elegir¦1uegues:rogar¦2ieras:querer¦1ieras:herir¦1istas:vestir"
      },
      "third": {
        "fwd": "ita:etir¦ija:egir¦ida:edir¦e:arse¦ienta:entir,entirse¦iera:erir,erer¦ja:ger¦iga:ecir,eguir¦a:erse¦uegue:ogar¦ista:estir¦1a:ter,per,mer,eer,bir,lirse,ñer¦1ga:ner¦1ja:igir¦2ga:enir,aler¦2e:eñar,enar,erar,evar¦2a:itir,nguir,rrer¦2za:ercer¦3e:estar",
        "both": "5e:elebrar,lustrar,rpretar,espetar¦5ga:tisfacer¦4ue:njugar¦4e:sentar,istrar,cionar,ventar,liviar,mentar,tentar,bordar,amorar¦4a:burrir,pender,rever,sistir,render,uceder¦4üe:eriguar¦3e:ersar,visar,dorar,indar,donar,mbrar,corar,resar,lorar,ortar,antar,cabar,yunar,ustar,istar,orrar,vorar,ansar,untar,ardar,ausar,ornar,ervar,intar¦3a:ruñir,artir,cidir,onder,sumir¦3ue:regar,vegar¦3zca:enacer¦3úe:raduar¦2íe:nviar,aciar¦2e:adar,utar,lvar,anar,piar,asar,avar,prar,añar,irar,cuar,diar,ltar,ivar,inar,edar,udar,grar,atar,urar,ciar,arar,otar,drar,itar,idar¦2ienda:efender¦2íba:ohibir¦2a:brir,adir,eber,plir,udir,atir,imir,ivir,frir¦2ue:rgar,agar,igar¦2ya:buir,ruir,luir,nuir,tuir¦2ga:hacer¦1e:far,har,yar,ear,par,lar,mar,jar¦1uebe:robar¦1iese:fesar,vesar¦1za:ncer¦1iebre:uebrar¦1iente:lentar¦1íe:fiar,uiar,riar¦1zca:ocer,ucir,ecer¦1ja:rgir,ngir¦1uerde:cordar¦1úe:tuar,nuar¦1ienda:tender,cender¦1üere:gorar¦1iga:aer¦1úse:husar¦1a:ser¦1iece:pezar¦uerma:ormir¦iense:ensar¦ience:enzar¦ierte:ertar¦uerza:orcer¦ierda:erder¦epa:aber¦uera:orir¦ierne:ernar¦uestre:ostrar¦ueñe:oñar¦ueva:over¦uentre:ontrar¦ueve:ovar¦ierta:ertir¦uela:oler¦iende:endar¦ueda:oder¦ía:eír¦uerce:orzar¦uelva:olver¦ueste:ostar¦ce:zar¦iña:eñir¦ierre:errar¦que:car",
        "rev": "entar:iente¦olgar:uelgue¦ontar:uente¦ervir:irva,ierva¦ar:é¦etar:iete¦ir:ya¦egar:iegue¦onar:uene¦olar:uele¦1cer:azca,aga¦1etir:rita,pita¦1edir:pida¦1erir:fiera,giera¦1ger:eja,oja¦1entirse:pienta¦1ecir:diga¦1eguir:siga¦1entir:sienta¦1ir:na¦2er:eta,mpa,onga,rea,oma,ema,aña¦2ar:pte,obe¦2gir:xija¦2ir:uba,iba¦2irse:lla¦2erir:quiera¦3ar:señe,orde,onte,ande,lene,pere,aste,legue,obre,leve¦3egir:orrija¦3arse:tere,ncee¦3gir:flija¦3ir:venga,mita¦3er:tenga,orra,arra¦3uir:inga¦3erse:reva¦3cer:jerza¦4ar:teste,ndene¦4er:fenda¦5ar:oleste",
        "ex": "yerre:errar¦huela:oler¦quepa:caber¦vaya:ir¦2zca:yacer,nacer¦4e:abusar,bordar,montar,mandar,gastar,cobrar,entrar,quejarse,jactarse¦2ga:hacer¦1iente:sentar¦1uelgue:colgar¦5e:aceptar¦1uente:contar¦1irva:servir¦3é:estar¦1iele:helar¦1é:dar¦3iete:apretar¦2ya:huir¦1iegue:negar,regar¦3e:untar,andar,besar,robar,cesar,pesar,cenar¦2a:ver,ser,unir,leer¦1uene:sonar¦3ue:pegar¦4ue:llegar¦5a:ofender¦1iga:oír,decir,seguir¦1uele:volar¦3ga:salir,venir,tener,valer¦4a:vender¦2egue:jugar¦2e:usar¦1ierva:hervir¦1ija:regir¦1ienta:mentir,sentir¦4ja:dirigir¦1ida:pedir,medir¦2ija:elegir¦1uegue:rogar¦2iera:querer¦1iera:herir¦1ista:vestir"
      },
      "firstPlural": {
        "fwd": "itamos:etir¦ijamos:egir¦idamos:edir¦emos:arse¦intamos:entir,entirse¦jamos:ger¦igamos:ecir,eguir¦amos:erse¦istamos:estir¦1amos:ter,per,der,eer,mer,lirse,bir,ñer¦1gamos:ner¦1jamos:igir¦1emos:uar¦2gamos:enir,aler,alir¦2amos:itir,rrer¦3amos:istir",
        "both": "4amos:primir¦3amos:inguir,urrir,ever,artir,cidir¦3yamos:cluir,fluir,inuir¦3emos:poyar¦3gamos:sfacer¦2emos:nfar¦2amos:erer,adir,eber,atir,plir,udir,brir,lver,ivir,umir¦2yamos:buir,ruir,tuir¦2zcamos:nacer¦2gamos:hacer¦1amos:ser¦1emos:par,har,bar,ear,jar,sar,lar,mar,nar,iar,rar,ñar,var,dar,tar¦1zamos:ncer,rcer¦1igamos:aer¦1zcamos:ucir,ocer,ecer¦1üemos:guar¦1jamos:ngir¦1uemos:gar¦urmamos:ormir¦epamos:aber¦uramos:orir¦irtamos:ertir¦irvamos:ervir¦iamos:eír¦iramos:erir¦iñamos:eñir¦cemos:zar¦quemos:car",
        "rev": "ir:yamos¦1cer:azcamos,agamos¦1edir:pidamos¦1ger:ejamos,ojamos¦1entirse:pintamos¦1gir:rjamos¦1ecir:digamos¦1eguir:sigamos¦1entir:sintamos¦1ir:namos¦1etir:pitamos¦2etir:rritamos¦2er:edamos,ndamos,ongamos,omamos,odamos,emamos,olamos,ovamos,etamos,añamos¦2ir:framos,ibamos,uñamos¦2egir:rrijamos¦2ar:nuemos,cuemos,tuemos¦2gir:xijamos¦2irse:llamos¦2erse:evamos¦3er:ompamos,tengamos,erdamos,arramos¦3arse:teremos,actemos¦3gir:flijamos¦3ar:aduemos¦3ir:vengamos,mitamos¦4ir:sistamos¦4arse:onceemos",
        "ex": "quepamos:caber¦vayamos:ir¦2zcamos:yacer,nacer¦4amos:sufrir,gruñir,correr¦2gamos:hacer¦2amos:oler,ver,ser,unir,leer¦1emos:dar¦2yamos:huir¦3jamos:surgir¦3amos:soler,mover,creer,subir¦1igamos:oír,decir,seguir¦3gamos:venir,tener,valer,salir¦1ijamos:regir¦1intamos:mentir,sentir¦4jamos:dirigir¦1idamos:pedir,medir¦4emos:quejarse¦2ijamos:elegir¦1istamos:vestir"
      },
      "secondPlural": {
        "fwd": "itáis:etir¦ijáis:egir¦idáis:edir¦éis:arse¦intáis:entir,entirse¦jáis:ger¦igáis:ecir,eguir¦áis:erse¦istáis:estir¦1áis:ter,per,der,eer,mer,lirse,bir,ñer¦1gáis:ner¦1jáis:igir¦1éis:uar¦2gáis:enir,aler,alir¦2áis:idir,rrer,rrir¦3áis:istir",
        "both": "5áis:plaudir¦4éis:iunfar,opezar¦4áis:rever¦4gáis:eshacer¦3áis:inguir,artir,cudir,mitir,sumir¦3yáis:ibuir¦3éis:poyar¦2áis:uñir,brir,ivir,eber,plir,atir,adir,lver,imir,frir¦2yáis:luir,ruir,nuir,tuir¦2jáis:urgir¦2zcáis:nacer¦2gáis:facer¦1áis:ser¦1éis:par,har,bar,ear,jar,sar,lar,mar,nar,iar,rar,ñar,var,dar,tar¦1záis:ncer,rcer¦1igáis:aer¦1zcáis:ucir,ocer,ecer¦1üéis:guar¦1jáis:ngir¦1uéis:gar¦urmáis:ormir¦epáis:aber¦uráis:orir¦irtáis:ertir¦irváis:ervir¦iáis:eír¦iráis:erir¦iñáis:eñir¦céis:zar¦quéis:car",
        "rev": "ar:eis¦ir:yáis¦1cer:azcáis,agáis¦1edir:pidáis¦1ger:ejáis,ojáis¦1entirse:pintáis¦1ecir:digáis¦1eguir:sigáis¦1entir:sintáis¦1ir:náis¦1etir:pitáis¦2etir:rritáis¦2er:edáis,ndáis,ongáis,omáis,odáis,emáis,oláis,ováis,etáis,eráis,añáis¦2egir:rrijáis¦2ar:nuéis,cuéis,tuéis¦2gir:xijáis¦2irse:lláis¦2ir:ibáis¦2erse:eváis¦3er:ompáis,tengáis,erdáis,arráis¦3arse:teréis,actéis¦3gir:flijáis¦3ar:aduéis¦3ir:vengáis,cidáis,urráis¦4ir:sistáis¦4arse:onceéis",
        "ex": "quepáis:caber¦vayáis:ir¦2zcáis:yacer,nacer¦2gáis:hacer¦2áis:oler,ver,ser,unir,leer¦1eis:dar¦2yáis:huir¦3áis:soler,mover,creer,subir¦1igáis:oír,decir,seguir¦4áis:querer,correr¦3gáis:venir,tener,valer,salir¦1ijáis:regir¦1intáis:mentir,sentir¦4jáis:dirigir¦1idáis:pedir,medir¦4éis:quejarse¦2ijáis:elegir¦1istáis:vestir"
      },
      "thirdPlural": {
        "fwd": "itan:etir¦ijan:egir¦idan:edir¦en:arse¦ientan:entir,entirse¦ieran:erir,erer¦jan:ger¦igan:ecir,eguir¦an:erse¦ueguen:ogar¦istan:estir¦1an:ter,per,mer,eer,bir,lirse,ñer¦1gan:ner¦1jan:igir¦2gan:enir,aler¦2en:eñar,enar,erar,evar¦2an:itir,nguir,rrer¦2zan:ercer¦3en:estar",
        "both": "5en:elebrar,lustrar,rpretar,espetar¦5gan:tisfacer¦4uen:njugar¦4en:sentar,istrar,cionar,ventar,liviar,mentar,tentar,bordar,amorar¦4an:burrir,pender,rever,sistir,render,uceder¦4üen:eriguar¦3en:ersar,visar,dorar,indar,donar,mbrar,corar,resar,lorar,ortar,antar,cabar,yunar,ustar,istar,orrar,vorar,ansar,untar,ardar,ausar,ornar,ervar,intar¦3an:ruñir,artir,cidir,onder,sumir¦3uen:regar,vegar¦3zcan:enacer¦3úen:raduar¦2íen:nviar,aciar¦2en:adar,utar,lvar,anar,piar,asar,avar,prar,añar,irar,cuar,diar,ltar,ivar,inar,edar,udar,grar,atar,urar,ciar,arar,otar,drar,itar,idar¦2iendan:efender¦2íban:ohibir¦2an:brir,adir,eber,plir,udir,atir,imir,ivir,frir¦2uen:rgar,agar,igar¦2yan:buir,ruir,luir,nuir,tuir¦2gan:hacer¦1en:far,har,yar,ear,par,lar,mar,jar¦1ueben:robar¦1iesen:fesar,vesar¦1zan:ncer¦1iebren:uebrar¦1ienten:lentar¦1íen:fiar,uiar,riar¦1zcan:ocer,ucir,ecer¦1jan:rgir,ngir¦1uerden:cordar¦1úen:tuar,nuar¦1iendan:tender,cender¦1üeren:gorar¦1igan:aer¦1úsen:husar¦1an:ser¦1iecen:pezar¦uerman:ormir¦iensen:ensar¦iencen:enzar¦ierten:ertar¦uerzan:orcer¦ierdan:erder¦epan:aber¦ueran:orir¦iernen:ernar¦uestren:ostrar¦ueñen:oñar¦uevan:over¦uentren:ontrar¦ueven:ovar¦iertan:ertir¦uelan:oler¦ienden:endar¦uedan:oder¦ían:eír¦uercen:orzar¦uelvan:olver¦uesten:ostar¦cen:zar¦iñan:eñir¦ierren:errar¦quen:car",
        "rev": "entar:ienten¦olgar:uelguen¦ontar:uenten¦ervir:irvan,iervan¦ar:én¦etar:ieten¦ir:yan¦egar:ieguen¦onar:uenen¦olar:uelen¦1cer:azcan,agan¦1etir:ritan,pitan¦1edir:pidan¦1erir:fieran,gieran¦1ger:ejan,ojan¦1entirse:pientan¦1ecir:digan¦1eguir:sigan¦1entir:sientan¦1ir:nan¦2er:etan,mpan,ongan,rean,oman,eman,añan¦2ar:pten,oben¦2gir:xijan¦2ir:uban,iban¦2irse:llan¦2erir:quieran¦3ar:señen,orden,onten,anden,lenen,peren,asten,leguen,obren,leven¦3egir:orrijan¦3arse:teren,nceen¦3gir:flijan¦3ir:vengan,mitan¦3er:tengan,orran,arran¦3uir:ingan¦3erse:revan¦3cer:jerzan¦4ar:testen,ndenen¦4er:fendan¦5ar:olesten",
        "ex": "yerren:errar¦huelan:oler¦quepan:caber¦vayan:ir¦2zcan:yacer,nacer¦4en:abusar,bordar,montar,mandar,gastar,cobrar,entrar,quejarse,jactarse¦2gan:hacer¦1ienten:sentar¦1uelguen:colgar¦5en:aceptar¦1uenten:contar¦1irvan:servir¦3én:estar¦1ielen:helar¦1en:dar¦3ieten:apretar¦2yan:huir¦1ieguen:negar,regar¦3en:untar,andar,besar,robar,cesar,pesar,cenar¦2an:ver,ser,unir,leer¦1uenen:sonar¦3uen:pegar¦4uen:llegar¦5an:ofender¦1igan:oír,decir,seguir¦1uelen:volar¦3gan:salir,venir,tener,valer¦4an:vender¦2eguen:jugar¦2en:usar¦1iervan:hervir¦1ijan:regir¦1ientan:mentir,sentir¦4jan:dirigir¦1idan:pedir,medir¦2ijan:elegir¦1ueguen:rogar¦2ieran:querer¦1ieran:herir¦1istan:vestir"
      }
    },
    "imperfectSubjunctive": {
      "first": {
        "fwd": "intiera:entir,entirse¦igiera:egir¦idiera:edir¦iera:eír¦uviera:ener¦itiera:etir¦udiera:oder¦istiera:estir¦1iera:per,ter,ver,verse,ler,ser,mer,ger¦2a:arse¦2iera:rrer¦2era:bir,lir¦3era:igir,idir,udir,itir¦3a:ñer¦4era:istir",
        "both": "5era:burrir¦4era:artir,vivir,nguir,ufrir¦3era:adir,ngir,brir,atir,rgir,umir,imir¦2yera:buir,nuir,luir,tuir,ruir¦2iera:eber,rder,eder,nder¦2era:uñir¦2jera:raer¦2a:ar¦1era:lirse¦1yera:eer¦1iciera:hacer,facer¦1jera:ucir¦1iera:cer¦upiera:aber¦uriera:orir¦iniera:enir¦iguiera:eguir¦ijera:ecir¦iriera:erir¦iñera:eñir¦irviera:ervir¦isiera:erer¦urmiera:ormir¦irtiera:ertir¦usiera:oner",
        "rev": "4:añera¦acer:iciera¦1entir:sintiera¦1ar:duviera¦1edir:pidiera¦1etir:ritiera,pitiera¦1ener:tuviera¦1ir:uyera¦1entirse:pintiera¦1er:ayera¦2erse:oviera¦2er:egiera,mpiera,etiera,lviera,osiera,emiera,ogiera¦2egir:rrigiera¦2ar:stuviera¦3eír:onriera¦3er:orriera¦3r:iviera,ibiera,ubiera,pliera¦4r:xigiera,cidiera,cudiera,mitiera,audiera¦4se:amara,ctara¦5se:terara,uedara,nceara,eitara,uejara¦5r:sistiera,fligiera,irigiera",
        "ex": "fuera:ir¦3uviera:andar,estar¦3era:unir¦1iciera:hacer¦4era:vivir,salir¦1yera:oír¦2yera:huir,caer¦1iera:dar,ver,reír¦1igiera:regir¦4iera:barrer,prever¦5a:secarse,mudarse¦5iera:atreverse¦6a:juntarse,hallarse¦1idiera:medir,pedir¦8a:prepararse¦2iera:oler,freír¦1uviera:tener¦2igiera:elegir¦3iera:valer,comer,soler¦1udiera:poder¦1intiera:sentirse,mentir¦1istiera:vestir"
      },
      "second": {
        "fwd": "intieras:entir,entirse¦igieras:egir¦idieras:edir¦ieras:eír¦uvieras:ener¦itieras:etir¦udieras:oder¦istieras:estir¦1ieras:per,ter,ver,verse,ler,ser,mer,ger¦2as:arse¦2ieras:rrer¦2eras:bir,lir¦3eras:igir,idir,udir,itir¦3as:ñer¦4eras:istir",
        "both": "5eras:burrir¦4eras:artir,vivir,nguir,ufrir¦3eras:adir,ngir,brir,atir,rgir,umir,imir¦2yeras:buir,nuir,luir,tuir,ruir¦2ieras:eber,rder,eder,nder¦2eras:uñir¦2jeras:raer¦2as:ar¦1eras:lirse¦1yeras:eer¦1icieras:hacer,facer¦1jeras:ucir¦1ieras:cer¦upieras:aber¦urieras:orir¦inieras:enir¦iguieras:eguir¦ijeras:ecir¦irieras:erir¦iñeras:eñir¦irvieras:ervir¦isieras:erer¦urmieras:ormir¦irtieras:ertir¦usieras:oner",
        "rev": "4:añeras¦acer:icieras¦1entir:sintieras¦1ar:duvieras¦1edir:pidieras¦1etir:ritieras,pitieras¦1ener:tuvieras¦1ir:uyeras¦1entirse:pintieras¦1er:ayeras¦2erse:ovieras¦2er:egieras,mpieras,etieras,lvieras,osieras,emieras,ogieras¦2egir:rrigieras¦2ar:stuvieras¦3eír:onrieras¦3er:orrieras¦3r:ivieras,ibieras,ubieras,plieras¦4r:xigieras,cidieras,cudieras,mitieras,audieras¦4se:amaras,ctaras¦5se:teraras,uedaras,ncearas,eitaras,uejaras¦5r:sistieras,fligieras,irigieras",
        "ex": "fueras:ir¦3uvieras:andar,estar¦3eras:unir¦1icieras:hacer¦4eras:vivir,salir¦1yeras:oír¦2yeras:huir,caer¦1ieras:dar,ver,reír¦1igieras:regir¦4ieras:barrer,prever¦5as:secarse,mudarse¦5ieras:atreverse¦6as:juntarse,hallarse¦1idieras:medir,pedir¦8as:prepararse¦2ieras:oler,freír¦1uvieras:tener¦2igieras:elegir¦3ieras:valer,comer,soler¦1udieras:poder¦1intieras:sentirse,mentir¦1istieras:vestir"
      },
      "third": {
        "fwd": "intiera:entir,entirse¦igiera:egir¦idiera:edir¦iera:eír¦uviera:ener¦itiera:etir¦udiera:oder¦istiera:estir¦1iera:per,ter,ver,verse,ler,ser,mer,ger¦2a:arse¦2iera:rrer¦2era:bir,lir¦3era:igir,idir,udir,itir¦3a:ñer¦4era:istir",
        "both": "5era:burrir¦4era:artir,vivir,nguir,ufrir¦3era:adir,ngir,brir,atir,rgir,umir,imir¦2yera:buir,nuir,luir,tuir,ruir¦2iera:eber,rder,eder,nder¦2era:uñir¦2jera:raer¦2a:ar¦1era:lirse¦1yera:eer¦1iciera:hacer,facer¦1jera:ucir¦1iera:cer¦upiera:aber¦uriera:orir¦iniera:enir¦iguiera:eguir¦ijera:ecir¦iriera:erir¦iñera:eñir¦irviera:ervir¦isiera:erer¦urmiera:ormir¦irtiera:ertir¦usiera:oner",
        "rev": "4:añera¦acer:iciera¦1entir:sintiera¦1ar:duviera¦1edir:pidiera¦1etir:ritiera,pitiera¦1ener:tuviera¦1ir:uyera¦1entirse:pintiera¦1er:ayera¦2erse:oviera¦2er:egiera,mpiera,etiera,lviera,osiera,emiera,ogiera¦2egir:rrigiera¦2ar:stuviera¦3eír:onriera¦3er:orriera¦3r:iviera,ibiera,ubiera,pliera¦4r:xigiera,cidiera,cudiera,mitiera,audiera¦4se:amara,ctara¦5se:terara,uedara,nceara,eitara,uejara¦5r:sistiera,fligiera,irigiera",
        "ex": "fuera:ir¦3uviera:andar,estar¦3era:unir¦1iciera:hacer¦4era:vivir,salir¦1yera:oír¦2yera:huir,caer¦1iera:dar,ver,reír¦1igiera:regir¦4iera:barrer,prever¦5a:secarse,mudarse¦5iera:atreverse¦6a:juntarse,hallarse¦1idiera:medir,pedir¦8a:prepararse¦2iera:oler,freír¦1uviera:tener¦2igiera:elegir¦3iera:valer,comer,soler¦1udiera:poder¦1intiera:sentirse,mentir¦1istiera:vestir"
      },
      "firstPlural": {
        "fwd": "intiéramos:entir,entirse¦igiéramos:egir¦iéramos:eír¦áramos:arse¦itiéramos:etir¦uviéramos:ener¦idiéramos:edir¦udiéramos:oder¦istiéramos:estir¦1iéramos:per,ter,verse,ver,mer,ger,ler,ser¦1éramos:ñer¦2iéramos:rrer¦2éramos:bir,lir¦3éramos:igir,idir,udir,itir¦4éramos:istir",
        "both": "5éramos:burrir¦4éramos:artir,vivir,nguir,ufrir¦3éramos:adir,ngir,brir,atir,rgir,umir,imir¦2yéramos:buir,nuir,luir,tuir,ruir¦2iéramos:rder,eder,nder,eber¦2éramos:uñir¦2jéramos:raer¦2iciéramos:sfacer¦1éramos:lirse¦1yéramos:eer¦1iciéramos:hacer¦1jéramos:ucir¦1iéramos:cer¦upiéramos:aber¦uriéramos:orir¦iniéramos:enir¦iguiéramos:eguir¦ijéramos:ecir¦iriéramos:erir¦iñéramos:eñir¦irviéramos:ervir¦isiéramos:erer¦irtiéramos:ertir¦usiéramos:oner¦áramos:ar",
        "rev": "ormir:urmiéramos¦acer:iciéramos¦1entir:sintiéramos¦1ar:duviéramos¦1edir:pidiéramos¦1etir:ritiéramos,pitiéramos¦1ener:tuviéramos¦1ir:uyéramos¦1entirse:pintiéramos¦1er:ayéramos¦2erse:oviéramos¦2er:egiéramos,mpiéramos,etiéramos,lviéramos,osiéramos,emiéramos,ogiéramos,añéramos¦2arse:amáramos¦2egir:rrigiéramos¦2ar:stuviéramos¦3arse:teráramos,uedáramos,nceáramos,eitáramos,uejáramos¦3eír:onriéramos¦3er:orriéramos¦3r:iviéramos,ibiéramos,ubiéramos,pliéramos¦4r:xigiéramos,cidiéramos,cudiéramos,mitiéramos,audiéramos¦5arse:reparáramos¦5r:sistiéramos,fligiéramos,irigiéramos",
        "ex": "fuéramos:ir¦3uviéramos:andar,estar¦1urmiéramos:dormir¦3éramos:unir¦1iciéramos:hacer¦4éramos:vivir,salir¦1yéramos:oír¦2yéramos:huir,caer¦1iéramos:dar,ver,reír¦1igiéramos:regir¦4iéramos:barrer,prever¦3áramos:secarse,mudarse¦5iéramos:atreverse¦4áramos:juntarse,jactarse,hallarse¦1idiéramos:medir,pedir¦2iéramos:oler,freír¦1uviéramos:tener¦2igiéramos:elegir¦3iéramos:valer,comer,soler¦1udiéramos:poder¦1intiéramos:sentirse,mentir¦1istiéramos:vestir"
      },
      "secondPlural": {
        "fwd": "intierais:entir,entirse¦igierais:egir¦idierais:edir¦ierais:eír¦uvierais:ener¦itierais:etir¦udierais:oder¦istierais:estir¦1ierais:per,ter,ver,verse,ler,ser,mer,ger¦2ais:arse¦2ierais:rrer¦2erais:bir,lir¦3erais:igir,idir,udir,itir¦3ais:ñer¦4erais:istir",
        "both": "5erais:burrir¦4erais:artir,vivir,nguir,ufrir¦3erais:adir,ngir,brir,atir,rgir,umir,imir¦2yerais:buir,nuir,luir,tuir,ruir¦2ierais:eber,rder,eder,nder¦2erais:uñir¦2jerais:raer¦2ais:ar¦1erais:lirse¦1yerais:eer¦1icierais:hacer,facer¦1jerais:ucir¦1ierais:cer¦upierais:aber¦urierais:orir¦inierais:enir¦iguierais:eguir¦ijerais:ecir¦irierais:erir¦iñerais:eñir¦irvierais:ervir¦isierais:erer¦urmierais:ormir¦irtierais:ertir¦usierais:oner",
        "rev": "4:añerais¦acer:icierais¦1entir:sintierais¦1ar:duvierais¦1edir:pidierais¦1etir:ritierais,pitierais¦1ener:tuvierais¦1ir:uyerais¦1entirse:pintierais¦1er:ayerais¦2erse:ovierais¦2er:egierais,mpierais,etierais,lvierais,osierais,emierais,ogierais¦2egir:rrigierais¦2ar:stuvierais¦3eír:onrierais¦3er:orrierais¦3r:ivierais,ibierais,ubierais,plierais¦4r:xigierais,cidierais,cudierais,mitierais,audierais¦4se:amarais,ctarais¦5se:terarais,uedarais,ncearais,eitarais,uejarais¦5r:sistierais,fligierais,irigierais",
        "ex": "fuerais:ir¦3uvierais:andar,estar¦3erais:unir¦1icierais:hacer¦4erais:vivir,salir¦1yerais:oír¦2yerais:huir,caer¦1ierais:dar,ver,reír¦1igierais:regir¦4ierais:barrer,prever¦5ais:secarse,mudarse¦5ierais:atreverse¦6ais:juntarse,hallarse¦1idierais:medir,pedir¦8ais:prepararse¦2ierais:oler,freír¦1uvierais:tener¦2igierais:elegir¦3ierais:valer,comer,soler¦1udierais:poder¦1intierais:sentirse,mentir¦1istierais:vestir"
      },
      "thirdPlural": {
        "fwd": "intieran:entir,entirse¦igieran:egir¦idieran:edir¦ieran:eír¦uvieran:ener¦itieran:etir¦udieran:oder¦istieran:estir¦1ieran:per,ter,ver,verse,ler,ser,mer,ger¦2an:arse¦2ieran:rrer¦2eran:bir,lir¦3eran:igir,idir,udir,itir¦3an:ñer¦4eran:istir",
        "both": "5eran:burrir¦4eran:artir,vivir,nguir,ufrir¦3eran:adir,ngir,brir,atir,rgir,umir,imir¦2yeran:buir,nuir,luir,tuir,ruir¦2ieran:eber,rder,eder,nder¦2eran:uñir¦2jeran:raer¦2an:ar¦1eran:lirse¦1yeran:eer¦1icieran:hacer,facer¦1jeran:ucir¦1ieran:cer¦upieran:aber¦urieran:orir¦inieran:enir¦iguieran:eguir¦ijeran:ecir¦irieran:erir¦iñeran:eñir¦irvieran:ervir¦isieran:erer¦urmieran:ormir¦irtieran:ertir¦usieran:oner",
        "rev": "4:añeran¦acer:icieran¦1entir:sintieran¦1ar:duvieran¦1edir:pidieran¦1etir:ritieran,pitieran¦1ener:tuvieran¦1ir:uyeran¦1entirse:pintieran¦1er:ayeran¦2erse:ovieran¦2er:egieran,mpieran,etieran,lvieran,osieran,emieran,ogieran¦2egir:rrigieran¦2ar:stuvieran¦3eír:onrieran¦3er:orrieran¦3r:ivieran,ibieran,ubieran,plieran¦4r:xigieran,cidieran,cudieran,mitieran,audieran¦4se:amaran,ctaran¦5se:teraran,uedaran,ncearan,eitaran,uejaran¦5r:sistieran,fligieran,irigieran",
        "ex": "fueran:ir¦3uvieran:andar,estar¦3eran:unir¦1icieran:hacer¦4eran:vivir,salir¦1yeran:oír¦2yeran:huir,caer¦1ieran:dar,ver,reír¦1igieran:regir¦4ieran:barrer,prever¦5an:secarse,mudarse¦5ieran:atreverse¦6an:juntarse,hallarse¦1idieran:medir,pedir¦8an:prepararse¦2ieran:oler,freír¦1uvieran:tener¦2igieran:elegir¦3ieran:valer,comer,soler¦1udieran:poder¦1intieran:sentirse,mentir¦1istieran:vestir"
      }
    },
    "imperative": {
      "first": {
        "fwd": "",
        "both": "",
        "rev": "",
        "ex": ":yacer"
      },
      "second": {
        "fwd": "2:ber¦3:enar¦4:estar¦uestes:ostarse¦istas:estirse¦iere:erer¦iste:estir¦1es:earse,narse¦1as:ter,lirse,rirse¦1ige:regir,legir¦1gas:nerse¦1iertas:vertirse¦1iere:uerir¦2es:erarse,orarse,rmarse,grarse,adarse,erar¦2as:eder,rrer,idir¦2e:igir,itir¦2gas:enir¦2zas:ercer¦3es:cular",
        "both": "2:alir,yar,ser¦3:emar,smar,ncer,utar,raer,ilar,tear,sear,eger,ivar,ojar,ptar,atar,rlar,añer,ijar,reer,udar,emer,ajar,ecar,prar¦4:fadar,indar,velar,astar,tinar,uidar,einar,cabar,sejar,ablar,vegar,plear,almar,gular,vidar,iguar,ñalar,larar,ricar,tacar,hazar,uedar,igrar,ustar,razar,ucear,ritar,eitar,ansar,uchar,licar,ticar,ausar,locar,citar,radar,pañar,orrar,mirar,morar,tigar¦5:frecer,sentar,orecer,lebrar,vanzar,ovocar,utizar,suciar,cortar,liviar,blecer,reglar,ocinar,mentar,ponder,lantar,ivinar,aminar,cantar,guntar,uardar,uillar,gociar,esitar,enecer¦5es:ascinar,eportar,liminar,uspirar,gistrar,nsultar,astimar,lustrar¦5ques:crificar,orificar,arificar¦5as:stinguir,sconder¦5e:raducir¦5zcas:rmanecer¦5yas:estruir¦4as:ecibir,pender,render¦4zcas:parecer,iquecer¦4es:ositar,ecorar,cionar,rminar,anchar,sociar,vantar,formar,rillar,pillar,icularse,tentar,racharse,ventar,bortar,dornar¦4e:xhibir,cubrir,nducir¦4gas:xponer,mponer¦4ques:cificar,dificar¦3zcas:erecer,alecer,educir,enacer,oducir¦3e:urrir,batir¦3ues:pagar,ligar,jugar,regar¦3es:vitar,gañar,ersar,rolar,redar,talar,donar,obrar,oblar,helar,pasar,surar,iciar,lorar,rciar,mbrarse,resar,elear,galar,nciar,celar,eciar,ollarse,lamarse,yunar,andar,durar,ograr,eitarse,mitar,allarse,istar,vorar,intar¦3ye:fluir¦3ques:nvocar,ivocar¦3ces:enazar,canzar¦3é:rever¦3as:artir¦3úa:ectuar¦3yas:cluir¦3iendas:escender¦2ierte:ivertir,dvertir¦2ía:nviar,aciar¦2es:mear,isar,anar,ctarse,piar,cuar,ujar,diar,avar,lvar,rear,eñar,clar,udarse,otar,drar¦2igue:oseguir,nseguir¦2as:uñir,ubir,omer,imir¦2ice:edecir¦2iendas:efender,ntender¦2íbas:ohibir¦2iertas:nvertir¦2ues:rgar¦2ieses:nfesar¦2itas:epetir¦2zcas:jecerse,tecer,decer¦2ques:orcar,ercar,hocar,nicar,dicar,bicar¦2ye:buir¦2z:facer,hacer¦2ías:nreír¦2e:rgir,umir,plir,ngir,adir,udir,ivir¦2iende:xtender,ncender¦2igas:ndecir,rseguir¦2gas:aler¦2jas:coger¦2ón:oponer,uponer¦2ite:mpetir¦2yas:nuir,tuir¦1ques:ucar,scar¦1iebra:uebrar¦1es:far,par¦1ientas:sentir¦1uestra:mostrar¦1ieras:gerir,ferir¦1écete:uecerse¦1íes:fiar,uiar¦1ieza:pezar¦1zcas:ocer¦1úa:duar,nuar¦1üeres:gorar¦1ieses:vesar¦1úses:husar¦1én:tener¦1ces:uzar,izar¦1édate:uedarse¦1ienta:lentar¦1iéntete:pentirse¦1úntate:guntarse¦1íate:riarse¦1idas:pedir¦1uesta:postar¦1itas:retir¦1as:per¦ierra:errar¦uerzas:orcer¦évete:everse¦iébrate:ebrarse¦ierdas:erder¦uere:orir¦ueve:over¦iéntate:entarse¦ásate:asarse¦uentres:ontrar¦ueva:ovar¦ásmate:asmarse¦ídate:idarse¦álmate:almarse¦órciate:orciarse¦ércate:ercarse¦áñate:añarse¦uelas:oler¦úate:uarse¦iernes:ernar¦iences:enzar¦ienda:endar¦iertes:ertarse¦úchate:ucharse¦éjate:ejarse¦ústate:ustarse¦uedas:oder¦ójate:ojarse¦ídete:idirse¦uerza:orzar¦úrlate:urlarse¦ócate:ocarse¦uelvas:olver¦ánsate:ansarse¦émate:emarse¦uerme:ormir¦íllate:illarse¦uérmete:ormirse¦écate:ecarse¦iégate:egarse¦uevas:overse",
        "rev": "car:ques¦eñir:iñe,iñas¦iar:ía,íes¦cer:z¦entir:iente¦olgar:uelgues¦ordar:uerdes,uerda¦edir:ide¦obar:ueba,uebes¦ontar:uenta¦eír:íe¦ar:á¦etar:ieta¦uar:úes¦egar:iega,iegues¦evar:ieva¦ensar:ienses¦entar:ientes¦ogar:uegues¦onar:uena¦olar:uela¦erir:ieras¦egir:ijas¦ervir:ierve¦1ar:ves,jes¦1ostarse:cuestes¦1zar:eces,aces¦1ir:uye,nas¦1ender:tiende¦1er:aigas¦1gar:uega¦2arse:cees¦2er:etas,on¦2ir:fre,bras,atas,ibas¦2r:ma,sa,ca,ha¦2ar:ases,etes,ires,ures,ares,ndes,agues,obes,oles¦2irse:llas¦2ertirse:iviertas¦2erir:quiere¦3r:ace,rta,ura,ita,aña,rva,ebe,abe,lta,aga,ira,iza,ora,ece,oge¦3arse:mores,untes,ermes,fades¦3er:cedas,arras,pongas¦3ar:irmes,ordes,altes,ardes¦3egir:orrige¦3ir:xige,cidas,ngue¦3erse:tengas¦3cer:jerzas¦4arse:nteres,legres¦4r:para,orda,dena,lena,anta,leva,ntra¦4ir:flige,nvengas,dmite,sistas,siste,rmite¦4er:fendas¦4ar:lcules¦5r:testa,preta,lesta¦5ir:scribe",
        "ex": "2:ver¦3:poner,usar¦4:yacer,jurar,tomar,durar,fumar,bañar,untar,pegar,casar,echar,nacer,coger,parar,cenar¦5:vender,formar,abusar,marcar,llevar,saltar,tragar,firmar,cortar,adorar,entrar¦6:reparar,abordar,visitar,parecer,estimar,aspirar¦7:soportar,amanecer,aguantar,respirar,exportar,importar,resultar¦8:verificar,purificar,preservar,confirmar¦9:clasificar,simbolizar¦10:interpretar,enflaquecer¦huelas:oler¦yerres:errar¦vayas:ir¦4ues:llegar¦6es:reservar,respetar,preparar¦4es:juntarse,bordar,montar,faltar,tardar,violar,peinarse¦2ques:tocar,picar,sacar¦4e:sufrir¦3zcas:crecer¦5es:afirmar,manejar,esperar¦1iñe:teñir¦2ía:criar¦3gas:tener,ponerse,venir¦3es:pasar,tirar,curar,andar,echarse,mirar,pesar,besar,robar,nadar,cesar,dejar¦4as:cubrir,correr¦1ientas:sentirse¦7ques:significar¦2z:hacer¦1iente:mentir,sentir¦1ueña:soñar¦1uelgues:colgar¦2uerdes:acordar¦2es:amar¦1ide:pedir¦2ueba:probar¦1uenta:contar¦1igas:seguir,decir¦2íe:freír¦1irvas:servir¦3á:estar¦1ieles:helar¦1es:dar¦3ieta:apretar¦4gas:oponer¦1iñas:reñir¦2ces:rezar,cazar¦7as:consistir,describir¦1íe:reír¦3íes:variar¦3úes:situar,actuar¦2ye:huir¦3uerda:recordar¦6e:insistir,escribir¦3as:batir,abrir¦1iega:negar¦2iende:atender¦1iegues:regar¦3ues:pagar¦7e:extinguir¦5as:asistir,ofender,aburrirse¦1ieva:nevar¦1ye:oír¦7ye:construir¦1uestes:costar¦1ienses:pensar¦2igas:caer¦1ientes:sentar¦2as:ser,unir,leer¦1uegues:rogar¦7es:conservar¦3uebes:aprobar¦2ega:jugar¦1uena:sonar¦1idas:medir¦1uela:volar¦1uestres:mostrar¦3ces:lanzar¦1ieras:herir¦1ijas:regir¦1ierve:hervir¦5e:dirigir¦2ige:elegir¦1istas:vestirse¦2iere:querer¦1iste:vestir"
      },
      "secondPlural": {
        "fwd": "irtáis:ertirse¦zcáis:cerse¦1áis:verse,per,ñer,dirse,rirse¦1éis:earse,narse,uarse¦2éis:erarse,grar,ularse,grarse,idarse,edar¦2gáis:enir,enerse¦2áis:stirse,nguir¦3éis:untarse,ucharse,cular¦3zcáis:quecer",
        "both": "5d:erecer,ecibir,ismear,edecir,sentir,cticar,rmitir,orecer,pender,costar,evelar,xponer,fender,cionar,sfacer,etener,edecer,alecer,educir,rminar,niciar,uantar,presar,cortar,liviar,clarar,btener,vantar,spirar,chazar,mentar,rendar,ponder,lantar,scoger,oponer,eferir,cender,anizar,ivocar,volver,nseñar,bortar,uardar,sticar,ezclar,gociar,render,plotar,esitar¦5éis:mportar,onvidar,rreglar,sgustar,taminar,oportar,alentar,agradar¦5quéis:crificar,arificar¦5uéis:astigar¦5zcáis:rmanecer,troducir¦5os:umbrarse,rollarse¦5áis:mprimir¦5íos:epentirse¦5yáis:estruir¦4d:estir,fadar,iolar,jecer,dorar,ercer,petir,ebrar,orrer,hibir,tinar,donar,einar,ertar,ntrar,novar,helar,vegar,surar,plear,gular,artir,bajar,ricar,gorar,udiar,galar,nicar,ritar,eciar,hacer,ñadir,uscar,rigir,eitar,ligir,ludar,mitar,pedir,irmar,ceder,pañar,morar,estar¦4céis:tilizar,lonizar,bolizar,galizar,ralizar¦4éis:mendar,scinar,ositar,sentar,versar,plorar,iminar,anchar,sperar,iseñar,sociar,ciclar,sustar,uistar,isitar,cordar,tinuar,tentar,racharse,ventar,guntar,postar,dmirar¦4áis:conder,solver,tender¦4gáis:ntener,mponer¦4os:entarse,almarse,antarse,strarse,nojarse,illarse¦4zcáis:ablecer,parecer¦4quéis:nificar,dificar,laticar¦3éis:nviar,iajar,errar,indar,gañar,ebrarse,rolar,corar,astar,uidar,talar,strar,obrar,mbrar,uciar,pasar,levar,rciar,mpiar,ormar,yudar,uejarse,elear,ontar,ermarse,vitar,celar,vinar,andar,uedarse,durar,ratar,citar,quiar,vorar¦3záis:vencer¦3d:rrir,isar,smar,rgar,ucar,utar,orir,buir,reír,agar,over,rcar,ocer,lmar,ilar,tear,riar,ezar,sear,eger,ngir,oder,etar,ltar,ivar,ojar,ejar,rzar,uzar,apar,rlar,omer,ijar,enar,usar,ivir,nuir,frir,tuir¦3os:onerse,smarse,adarse,rtarse,amarse,icarse,ocarse,itarse,udarse,ecarse,orarse¦3zcáis:frecer,aducir,nducir,enecer¦3jáis:ecoger¦3quéis:blicar¦3céis:vanzar,canzar,erizar¦3áis:batir,ever,vadir,meter¦3igáis:traer¦3uéis:ligar,regar,legar¦2igáis:oseguir,ndecir,rseguir¦2áis:uñir,rder,erer,umir,ubir,plir,udir,brir,reer,emer¦2záis:orcer¦2uéis:ogar,lgar,ugar¦2éis:ipar,mpar,blar,anar,fiar,ctarse,amar,esar,ujar,avar,ptar,unar,oñar,lvar,nsar,emarse,omar,llar,rnar,lpar,drar,prar¦2zcáis:tecer,nacer¦2quéis:escar,tacar,iscar,bicar¦2céis:nazar,tizar,enzar,razar¦2os:sarse,ñarse,iarse,garse¦2d:yar,uar¦2gáis:aler¦2yáis:luir¦1iráis:uerir,gerir¦1éis:far,bar¦1jáis:rgir¦1quéis:rcarse,ocar¦1íos:lirse¦1ijáis:regir¦1itáis:retir¦epáis:aber¦urmáis:ormirse",
        "rev": "r:d¦ervir:irváis¦eñir:iñáis¦eír:iais¦entir:intáis¦1rse:aos¦1car:iquéis¦1er:sáis,aigáis¦1ar:véis,guéis,iéis¦1r:eais¦1ger:ojáis¦2erse:ováis¦2er:mpáis,ndáis,añáis,ebáis,oláis¦2cer:dezcáis¦2ar:uréis,iméis,iréis,rdéis,otéis,adéis,onéis¦2gir:xijáis¦2arse:duéis¦2ertirse:ivirtáis¦2ir:ibáis¦2cerse:jezcáis¦2ertir:nvirtáis¦3arse:teréis,einéis¦3ar:orréis,ogréis,antéis,paréis,ortéis,entéis,igréis¦3irse:entáis,estáis¦3ir:vengáis,mitáis,istáis¦3er:pongáis¦3uir:ingáis¦4arse:onceéis,costéis,legréis,lvidéis¦4irse:ecidáis,burráis¦4cer:iquezcáis¦4erse:treváis¦5arse:riculéis¦5cerse:laquezcáis¦5ar:alculéis",
        "ex": "quepáis:caber¦vayáis:ir¦4d:yacer,secar,bajar,teñir,tener,pasar,hacer,coser,mudar,matar,picar,pedir,fumar,estar,helar,tirar,doler,poner,bañar,batir,negar,untar,notar,dudar,pegar,sacar,andar,nevar,echar,beber,nacer,traer,cazar,salir,meter,guiar,parar,volar,herir¦9d:investigar,glorificar,crucificar,clasificar¦5d:pintar,juntar,crecer,mentir,bordar,borrar,bucear,duchar,elegir,llorar,copiar,costar,cortar,vencer,gustar,lanzar,hervir¦9zcáis:desagradecer¦5éis:ahorrar,abordar,acostarse,estimar,heredar¦7d:reservar,replicar,realizar,lastimar,anunciar,producir,amanecer,escuchar,criticar,advertir,deprimir,exportar,invertir,divertir¦6d:reparar,suponer,dedicar,parecer,cocinar,agradar,señalar,aplicar,olvidar,padecer,caminar,alentar¦10d:entrevistar¦3éis:jurar,crear,durar,curar,casar,mirar,votar,odiar,nadar,errar,sonar¦4éis:callarse,luchar,tardar,sentar,vaciar,juntarse,ducharse¦4áis:vender,sentirse,barrer,volver¦5os:hallarse,burlarse¦8d:satirizar,purificar,agradecer,consistir,civilizar,construir,conseguir,describir¦6quéis:verificar¦6éis:encantar,preparar,reportar¦4quéis:indicar¦3d:oler,amar,huir,unir,leer,usar¦5áis:admitir,asistir¦6os:asustarse¦1igáis:seguir,decir¦3jáis:exigir¦1irváis:servir¦3áis:toser,deber,soler¦2d:dar,oír¦4gáis:oponer¦1iñáis:reñir¦1iais:reír¦6áis:insistir,escribir¦7éis:preservar,conservar,renunciar¦2áis:ver¦5quéis:explicar¦3uéis:regar¦4os:echarse¦2igáis:caer¦2ais:ser¦1idáis:medir¦4irtáis:convertir¦2jáis:coger¦1intáis:sentir¦1ijáis:regir¦5gáis:detenerse¦3gáis:venir"
      },
      "firstPlural": {
        "fwd": "",
        "both": "",
        "rev": "",
        "ex": ":yacer"
      },
      "third": {
        "fwd": "ita:etir¦ida:edir¦ija:egir¦ienta:entirse,entir¦ueste:ostarse,ostar¦iera:erir,erer¦iga:eguir,ecir¦ja:ger¦úe:uarse¦ista:estirse¦zca:cerse¦évase:everse¦ierta:ertir¦1a:per,ter,eer,mir,mer,lirse,bir¦1ga:ner¦1ja:igir¦1ierta:vertirse¦2a:eder,rrer,idir,stir,nguir¦2e:adar,eñar,asar,enar,edarse,grar,grarse,adarse,erar,edar¦2ga:enir,aler,enerse¦2za:ercer¦3e:untar,cularse,resar,ebrar,estar",
        "both": "5e:rpretar,nventar,evistar¦4a:currir,burrir,pender,partir,nvadir,render¦4e:sentar,ngañar,ecorar,mentar,istrar,uistar,tentar,ustrar,feitarse,evorar,omprar¦4ue:avegar¦3e:indar,astar,ionar,obrar,cabar,levar,asmarse,lorar,iviar,antar,mpiar,mbrarse,ustar,petar,tivar,ortar,andar,ansar,donar,busar,ardar,ausar,ornar,pañar,orrar,morar,terarse¦3a:mitir,ever,onder,ñadir,audir,cudir,ufrir¦3üe:riguar¦3ue:jugar,regar,legar¦2íe:nviar,aciar¦2a:uñir,atir,eber,plir,añer,brir,ivir¦2e:isar,utar,rsar,otar,anar,ltar,idar,cuar,diar,avar,ptar,inar,urar,unar,emarse,udar,atar,ciar,arar,drar,itar,rvar,irar¦2ienda:efender¦2íba:ohibir¦2ue:rgar,agar,igar¦2ya:buir,luir,nuir,tuir,ruir¦2ga:facer,hacer¦2úe:inuar¦1óngase:ponerse¦1za:ncer¦1uebe:robar¦1iese:fesar,vesar¦1e:far,yar,ear,har,lar,mar,jar,par¦1ueve:novar¦1íe:fiar,riar,uiar¦1iece:pezar¦1ja:rgir,ngir¦1zca:ocer,ucir,ecer¦1úe:tuar¦1üere:gorar¦1úse:husar¦1érmese:fermarse¦1iga:aer¦1uerde:cordar¦1a:ser¦1ienda:cender,tender¦1óquese:vocarse¦1iente:lentar¦1úntese:guntarse¦ierre:errar¦úrrase:urrirse¦árese:ararse¦uerza:orcer¦iebre:ebrarse¦óndase:onderse¦ierda:erder¦uera:orir¦iense:ensar¦uestre:ostrar¦ierte:ertar¦ueva:over¦ásese:asarse¦uentre:ontrar¦epa:aber¦ídese:idarse¦álmese:almarse¦áctese:actarse¦érquese:ercarse¦ántese:antarse¦uelva:olver¦uela:oler¦iña:eñir¦ierne:ernar¦ience:enzar¦iende:endar¦iértese:ertarse¦ía:eír¦éjese:ejarse¦ueda:oder¦óllese:ollarse¦uérdese:ordarse¦ídase:idirse¦ámese:amarse¦uerce:orzar¦íquese:icarse¦úrlese:urlarse¦ueñe:oñar¦éinese:einarse¦ánsese:ansarse¦áchese:acharse¦ce:zar¦íllese:illarse¦údese:udarse¦uerma:ormirse¦que:car¦éese:earse¦iéguese:egarse¦órese:orarse¦uévase:overse",
        "rev": "ecarse:équese¦allarse:állese¦olgar:uelgue¦ontar:uente¦ervir:irva,ierva¦ar:é¦etar:iete¦ir:ya¦egar:iegue¦evar:ieve¦entar:iente¦onar:uene¦olar:uele¦1cer:azca,aga¦1etir:rita,pita¦1ostar:pueste¦1edir:pida¦1entirse:pienta¦1ostarse:cueste¦1erir:fiera,giera¦1eguir:siga¦1ger:oja,eja¦1uarse:dúe¦1ar:ie¦1entir:sienta¦1ir:na¦1everse:révase¦1ecir:diga¦2er:mpa,eta,ema,onga¦2egir:rrija¦2ir:ima,uba,uma,iba¦2ar:lve,añe,obe¦2gir:xija¦2irse:lla¦2ertirse:ivierta¦2cerse:jezca¦2ertir:nvierta,dvierta¦2erir:quiera¦3ar:inte,orde,señe,dene,igre,lene,rade,pase,rede,dore¦3er:ceda,arra,orra¦3gir:flija¦3ir:venga,cida¦3arse:fade¦3uir:inga¦3cer:jerza¦4ar:teste,gunte,erese,grese,spere,prese,leste¦4arse:icule¦4er:ntenga,btenga,fenda¦4ir:sista¦4cerse:aquezca¦5er:retenga¦5ar:elebre",
        "ex": "huela:oler¦quepa:caber¦échese:echarse¦yerre:errar¦vaya:ir¦váyase:irse¦2zca:yacer,nacer¦4e:pintar,juntarse,callarse,salvar,bordar,montar,copiar,adorar,entrar,lograr,quedarse¦1équese:secarse¦5e:abordar,alegrarse¦4a:vender¦1állese:hallarse¦3ga:ponerse,salir,tener,valer,venir¦2ga:hacer¦1uelgue:colgar¦1uente:contar¦1irva:servir¦3é:estar¦1iele:helar¦1é:dar¦3iete:apretar¦3e:bañar,untar,andar,pesar,besar,robar,cesar,pasar,cenar,casar,nadar¦2ya:huir¦4zca:renacer¦1iegue:negar,regar¦2a:ver,ser,unir,leer¦3ue:pegar¦1ieve:nevar¦1iga:oír,seguir,decir¦5a:ofender¦1iente:sentar¦1uegue:rogar¦2egue:jugar¦1uene:sonar¦2e:usar¦1uele:volar¦1ierva:hervir¦3a:creer,comer¦1ienta:sentirse,mentir¦4ja:dirigir¦1ida:pedir,medir¦2ija:elegir¦1ista:vestirse¦5ga:detenerse¦1ueste:costar¦2iera:querer¦1iera:herir¦1ija:regir"
      },
      "thirdPlural": {
        "fwd": "uevan:overse,over¦ieguen:egarse¦itan:etir¦idan:edir¦ijan:egir¦uesten:ostarse,ostar¦ieran:erir,erer¦igan:eguir,ecir¦jan:ger¦istan:estir¦1an:per,ter,eer,mir,mer,dirse,lirse,bir¦1en:mar,lar¦1gan:ner,nerse¦1jan:igir¦1quen:rcarse¦2an:eder,rrer,nguir¦2en:enar,rmarse,erar¦2gan:enir,aler¦2zan:ercer¦3en:estar,cularse",
        "both": "5en:rpretar,ultivar,nventar¦4en:sentar,lebrar,cionar,liviar,mentar,istrar,spetar,ustrar,guntar,bordar,evorar,amorar¦4an:pender,conder,sistir,ponder,render¦3an:urrir,mitir,ever,artir,ufrir¦3en:ansar,indar,ersar,corar,astar,ardar,donar,obrar,cabar,lorar,antar,mpiar,mbrarse,resar,uejarse,ustar,istar,orrar,ollarse,lamarse,andar,acharse,busar,allarse,ausar,ornar,adrar,mprar,intar¦3uen:vegar,jugar,regar¦3üen:riguar¦2íen:nviar,aciar¦2an:uñir,atir,eber,plir,adir,udir,añer,brir,ivir¦2en:isar,utar,edar,anar,ltar,idar,arar,cuar,udar,diar,grar,avar,inar,urar,unar,lvar,emarse,asar,rtar,atar,ciar,adar,otar,itar,rvar,irar¦2iendan:efender¦2íban:ohibir¦2yan:buir,luir,nuir,tuir,ruir¦2uen:rgar,agar,igar¦2zcan:jecerse¦2gan:facer,hacer¦1zan:ncer¦1ueben:robar¦1iesen:fesar,vesar¦1iebren:uebrar¦1en:far,yar,ear,har,jar,par,ñar¦1ézcanse:uecerse¦1íen:fiar,riar,uiar¦1iértanse:vertirse¦1iecen:pezar¦1jan:rgir,ngir¦1zcan:ocer,ucir,ecer¦1úen:tuar,nuar¦1üeren:gorar¦1úsen:husar¦1igan:aer¦1uerden:cordar¦1an:ser¦1iendan:cender,tender¦1édense:uedarse¦1ienten:lentar¦1úntense:guntarse¦ierren:errar¦úrranse:urrirse¦iertan:ertir¦uerzan:orcer¦évanse:everse¦iébrense:ebrarse¦ierdan:erder¦ueran:orir¦uestren:ostrar¦ávense:avarse¦ásense:asarse¦uentren:ontrar¦ueven:ovar¦epan:aber¦ásmense:asmarse¦ídense:idarse¦álmense:almarse¦áctense:actarse¦ádense:adarse¦égrense:egrarse¦áñense:añarse¦ístanse:estirse¦uelan:oler¦úense:uarse¦iñan:eñir¦iernen:ernar¦ístrense:istrarse¦iencen:enzar¦ienden:endar¦ierten:ertarse¦ían:eír¦úchense:ucharse¦ústense:ustarse¦uedan:oder¦ójense:ojarse¦uérdense:ordarse¦uercen:orzar¦úrlense:urlarse¦ientan:entir¦uelvan:olver¦éinense:einarse¦ánsense:ansarse¦iéntanse:entirse¦éitense:eitarse¦íense:iarse¦cen:zar¦íllense:illarse¦údense:udarse¦uerman:ormirse¦quen:car¦éense:earse¦órense:orarse¦érense:erarse",
        "rev": "ecarse:équense¦oñar:ueñen¦olgar:uelguen¦ontar:uenten¦ervir:irvan,iervan¦ar:én¦elar:ielen¦etar:ieten¦uar:úen¦ir:yan¦evar:ieven¦ensar:iensen¦entar:ienten¦onar:uenen¦olar:uelen¦1cer:azcan,agan¦1etir:ritan,pitan¦1ostar:puesten¦1edir:pidan¦1ostarse:cuesten¦1erir:fieran,gieran¦1eguir:sigan¦1ger:ojan,ejan¦1ecir:digan¦1ar:ien¦1over:luevan¦1ir:nan¦2er:mpan,etan,ongan,oman¦2ar:rmen,clen,omen,rlen,pten,imen,umen,alen,glen,ilen,lmen,blen,olen,oben,oren,smen¦2egir:rrijan¦2gir:xijan¦2irse:llan¦2ir:uban,uman,iban,iman¦3ar:leguen,denen,orden,celen,illen,lenen,peren,leven,velen¦3er:cedan,arran¦3gir:flijan,irijan¦3irse:cidan¦3arse:ermen¦3carse:cerquen¦3uir:ingan¦3cer:jerzan¦3erir:equieran¦4ar:testen,tenten,nhelen,lesten¦4arse:iculen¦4er:ntengan,btengan,fendan¦5ir:onvengan¦5er:retengan¦5ar:alculen",
        "ex": "huelan:oler¦quepan:caber¦échense:echarse¦yerren:errar¦vayan:ir¦váyanse:irse¦2zcan:yacer,nacer¦4uen:llegar¦4en:juntarse,bordar,montar,llevar,copiar,adorar,entrar¦1équense:secarse¦4an:vender,correr¦6en:intentar¦2gan:hacer¦1ueñen:soñar¦1uelguen:colgar¦5en:aceptar,regular¦1uenten:contar¦1irvan:servir¦3én:estar¦1ielen:helar¦1en:dar¦3ieten:apretar¦4úen:graduar¦2yan:huir¦4zcan:renacer¦3en:untar,andar,pesar,besar,robar,cesar,cenar¦2an:ver,ser,unir,leer¦3uen:pegar¦1ieguen:regar,negarse¦1ieven:nevar¦1igan:oír,seguir,decir¦5an:ofender¦1iensen:pensar¦1ienten:sentar¦1ueguen:rogar¦3gan:salir,tener,ponerse,valer,venir¦2eguen:jugar¦1uenen:sonar¦2en:usar,amar¦1uelen:volar¦1iervan:hervir¦1uevan:moverse¦3an:temer,creer¦1idan:pedir,medir¦2ijan:elegir¦5gan:detenerse¦1uesten:costar¦2ieran:querer¦1ieran:herir¦1ijan:regir¦1istan:vestir"
      }
    },
    "gerunds": {
      "gerunds": {
        "fwd": "iendo:er,eír¦igiendo:egir¦itiendo:etir¦idiendo:edir¦istiendo:estir¦iniendo:enir¦indiendo:endir¦uyendo:üir¦1ibiendo:cebir¦1yendo:oer,oír¦2endo:lir,pir,sir¦2ndo:ñer¦3endo:igir,itir,irir,idir,rrir,rgir,rcir,inir¦4endo:istir",
        "both": "5endo:laudir,cindir,acudir¦4endo:urtir,andir,redir,nguir,undir,eunir,ludir,artir¦3endo:mbir,quir,utir,trir,adir,rnir,ngir,ivir,brir,frir,umir,imir,ibir,ucir,atir¦2endo:llir¦2yendo:buir,huir,nuir,tuir,luir,ruir¦1yendo:aer,eer¦1ndo:ar¦iñendo:eñir¦iciendo:ecir¦udriendo:odrir¦uriendo:orir¦intiendo:entir¦urmiendo:ormir¦iriendo:erir¦irtiendo:ertir¦irviendo:ervir¦iguiendo:eguir",
        "rev": "1etir:pitiendo,ritiendo¦1edir:pidiendo¦1enir:viniendo¦1er:jiendo¦1üir:guyendo¦1estir:bistiendo,vistiendo¦2er:abiendo,emiendo,eniendo,aciendo,eriendo,oniendo,osiendo,etiendo,ebiendo,ogiendo,eciendo,ociendo,omiendo,lviendo,oviendo,egiendo,eliendo,amiendo,rdiendo,rbiendo,odiendo,eviendo¦2egir:rrigiendo¦2ír:soyendo¦2eír:nriendo¦3er:endiendo,cediendo,enciendo,ompiendo,orriendo,orciendo,arriendo,ondiendo,ertiendo,moliendo¦3ebir:oncibiendo¦3r:pliendo,ugiendo,uliendo,upiendo,añendo,lpiendo¦4r:cudiendo,mitiendo,cidiendo,vidiendo,urriendo,saliendo,arciendo,finiendo,xigiendo,sidiendo,urgiendo,boliendo¦4er:jerciendo¦5r:irigiendo,sistiendo,rumpiendo,xistiendo,fligiendo,runciendo¦5er:nvergiendo",
        "ex": "yendo:ir¦5endo:acudir,erigir¦2yendo:huir,roer¦1udiendo:poder¦4endo:subir,rugir,salir,urgir¦3endo:unir,asir¦1yendo:oír¦6endo:fruncir¦1iendo:ver,reír¦2igiendo:elegir¦7endo:adquirir,sumergir,inquirir¦1idiendo:pedir,medir¦3iendo:valer,ceder,moler¦1istiendo:vestir¦1iniendo:venir¦5iendo:emerger¦1igiendo:regir¦1indiendo:rendir¦2iendo:freír"
      }
    },
    "perfecto": {
      "perfecto": {
        "fwd": "do:rse¦to:mper¦ido:erse¦1ido:ber,rer,ter,der,ger,ñer,ler¦1ído:eer¦1ado:t¦2ido:ener¦2to:ribir",
        "both": "4ía cepillado:pillar¦3isto:rever¦2icho:edecir¦2echo:shacer¦1ierto:brir¦1ido:ser,cer¦1ído:aer¦1echo:facer¦uerto:orir¦uelto:olver¦uesto:oner¦do:r",
        "rev": "3:mitado¦acer:echo¦ecir:icho¦er:isto¦1mper:oto¦2er:ebido,ndido,emido,ogido,omido,abido,añido,olido¦2erse:evido¦3er:tegido,metido,orrido,tenido,erdido¦3rse:amado,ctado¦3bir:crito¦4rse:terado,uedado,eitado,ullido,uejado¦4er:ucedido¦5rse:onceado,pentido",
        "ex": "1ido:ser¦1echo:hacer¦3ido:temer,comer,moverse,meter,tener,valer,poder¦2ito:freír¦1icho:decir¦1isto:ver¦4ido:barrer,querer¦4do:secarse,mudarse¦5do:juntarse,hallarse,sentirse¦7do:prepararse¦2ido:oler¦2ído:leer¦3ído:creer"
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

  // generate all reflexive forms of this verb
  const toReflexive$1 = function (str) {
    return {
      first: str + 'me',
      firstPlural: str + 'nos',
      second: str + 'te',
      secondPlural: str + 'os',
      third: str + 'se',
      thirdPlural: str + 'se'
    }
  };

  const stripReflexive$3 = function (str) {
    str = str.replace(/(me|nos|te|os|se)$/, ''); // 🤞
    return str
  };

  let { presentTense: presentTense$1, pastTense: pastTense$1, imperfectTense: imperfectTense$1, futureTense: futureTense$1, conditional: conditional$1, subjunctive: subjunctive$1, imperfectSubjunctive, imperative: imperative$1 } = model$1;

  const doEach = function (str, m) {
    return {
      first: convert$1(str, m.first),
      second: convert$1(str, m.second),
      third: convert$1(str, m.third),
      firstPlural: convert$1(str, m.firstPlural),
      secondPlural: convert$1(str, m.secondPlural),
      thirdPlural: convert$1(str, m.thirdPlural)
    }
  };

  const toPresent$1 = (str) => doEach(str, presentTense$1);
  const toPast$1 = (str) => doEach(str, pastTense$1);
  const toImperfect$1 = (str) => doEach(str, imperfectTense$1);
  const toFuture$1 = (str) => doEach(str, futureTense$1);
  const toSubjunctive$1 = (str) => doEach(str, subjunctive$1);
  // 'si pudiera...' (-ra series)
  const toImperfectSubjunctive$1 = (str) => doEach(str, imperfectSubjunctive);
  // 'si pudiese...' - the -se series is a regular respelling of the -ra one
  const toImperfectSubjunctiveSe$1 = (str) => {
    let obj = toImperfectSubjunctive$1(str);
    return {
      first: obj.first ? obj.first.replace(/ra$/, 'se') : obj.first,
      second: obj.second ? obj.second.replace(/ras$/, 'ses') : obj.second,
      third: obj.third ? obj.third.replace(/ra$/, 'se') : obj.third,
      firstPlural: obj.firstPlural ? obj.firstPlural.replace(/ramos$/, 'semos') : obj.firstPlural,
      secondPlural: obj.secondPlural ? obj.secondPlural.replace(/rais$/, 'seis') : obj.secondPlural,
      thirdPlural: obj.thirdPlural ? obj.thirdPlural.replace(/ran$/, 'sen') : obj.thirdPlural,
    }
  };
  const toConditional$1 = (str) => doEach(str, conditional$1);
  const toImperative$1 = (str) => {
    let obj = doEach(str, imperative$1);
    // imperative has no first-person
    // because ...you can't tell yourself to do something.
    obj.first = '';
    obj.firstPlural = '';
    return obj
  };

  // an array of every inflection, for '{inf}' syntax
  const all$2 = function (str) {
    let res = [str]
      .concat(
        Object.values(toPresent$1(str)),
        Object.values(toPast$1(str)),
        Object.values(toImperfect$1(str)),
        Object.values(toFuture$1(str)),
        Object.values(toConditional$1(str)),
        Object.values(toImperative$1(str)),
        Object.values(toSubjunctive$1(str)),
        Object.values(toImperfectSubjunctive$1(str)),
        Object.values(toImperfectSubjunctiveSe$1(str)),
        Object.values(toReflexive$1(str)), //infinitive reflexive - 'quemarme'
        toGerund$1(str),
        toPerfecto$1(str)
      )
      .filter((s) => s);
    res = new Set(res);
    return Array.from(res)
  };

  let { presentTense, pastTense, imperfectTense, futureTense, conditional, subjunctive, imperative } = model$1;

  // =-=-
  const revAll = function (m) {
    return Object.keys(m).reduce((h, k) => {
      h[k] = reverse$1(m[k]);
      return h
    }, {})
  };

  let presentRev = revAll(presentTense);
  let pastRev = revAll(pastTense);
  let imperfectRev = revAll(imperfectTense);
  let futureRev = revAll(futureTense);
  let conditionalRev = revAll(conditional);
  let subjunctRev = revAll(subjunctive);
  let imperativeRev = revAll(imperative);

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

  const fromImperfect = (str, form) => {
    let forms = {
      'FirstPerson': (s) => convert$1(s, imperfectRev.first),
      'SecondPerson': (s) => convert$1(s, imperfectRev.second),
      'ThirdPerson': (s) => convert$1(s, imperfectRev.third),
      'FirstPersonPlural': (s) => convert$1(s, imperfectRev.firstPlural),
      'SecondPersonPlural': (s) => convert$1(s, imperfectRev.secondPlural),
      'ThirdPersonPlural': (s) => convert$1(s, imperfectRev.thirdPlural),
    };
    if (forms.hasOwnProperty(form)) {
      return forms[form](str)
    }
    // person-ambiguous forms ('hablaba' is 1st or 3rd) - try third-person
    return convert$1(str, imperfectRev.third)
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

  const fromSubjunctive = (str, form) => {
    let forms = {
      'FirstPerson': (s) => convert$1(s, subjunctRev.first),
      'SecondPerson': (s) => convert$1(s, subjunctRev.second),
      'ThirdPerson': (s) => convert$1(s, subjunctRev.third),
      'FirstPersonPlural': (s) => convert$1(s, subjunctRev.firstPlural),
      'SecondPersonPlural': (s) => convert$1(s, subjunctRev.secondPlural),
      'ThirdPersonPlural': (s) => convert$1(s, subjunctRev.thirdPlural),
    };
    if (forms.hasOwnProperty(form)) {
      return forms[form](str)
    }
    return str
  };

  const fromImperative = (str, form) => {
    let forms = {
      'FirstPerson': (s) => convert$1(s, imperativeRev.first),
      'SecondPerson': (s) => convert$1(s, imperativeRev.second),
      'ThirdPerson': (s) => convert$1(s, imperativeRev.third),
      'FirstPersonPlural': (s) => convert$1(s, imperativeRev.firstPlural),
      'SecondPersonPlural': (s) => convert$1(s, imperativeRev.secondPlural),
      'ThirdPersonPlural': (s) => convert$1(s, imperativeRev.thirdPlural),
    };
    if (forms.hasOwnProperty(form)) {
      return forms[form](str)
    }
    return str
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

  var methods$1 = {
    verb: {
      fromGerund,
      fromPresent,
      fromPast,
      fromImperfect,
      fromFuture,
      fromConditional,
      fromSubjunctive,
      fromImperative,
      toPresent: toPresent$1,
      toPast: toPast$1,
      toImperfect: toImperfect$1,
      toFuture: toFuture$1,
      toConditional: toConditional$1,
      toGerund: toGerund$1,
      toSubjunctive: toSubjunctive$1,
      toImperfectSubjunctive: toImperfectSubjunctive$1,
      toImperfectSubjunctiveSe: toImperfectSubjunctiveSe$1,
      toImperative: toImperative$1,
      fromPerfecto,
      toPerfecto: toPerfecto$1,
      toReflexive: toReflexive$1,
      stripReflexive: stripReflexive$3,
      all: all$2
    },
    noun: {
      toPlural: toPlural$1,
      toSingular: toSingular$1,
      toMasculine: toMasculine$1,
      all: all$1
    },
    adjective
  };

  // hand-curated entries that win over everything else in the lexicon.
  // spanish marks question-words with an accent - 'qué es' vs 'creo que es'
  let lex = {
    // reflexive/impersonal clitic - 'se habla español'
    se: 'Pronoun',
    // 'yo sé' (saber) + imperative of ser
    'sé': ['Verb', 'PresentTense', 'FirstPerson'],

    // unaccented forms are conjunctions/relativizers
    que: 'Conjunction',
    como: 'Conjunction',
    donde: 'Pronoun',
    cuando: 'Conjunction',
    // accented forms are question-words
    'qué': 'QuestionWord',
    'cómo': 'QuestionWord',
    'dónde': 'QuestionWord',
    'cuándo': 'QuestionWord',
    'quién': 'QuestionWord',
    'quiénes': 'QuestionWord',
    'cuál': 'QuestionWord',
    'cuáles': 'QuestionWord',
    'cuánto': 'QuestionWord',
    'cuánta': 'QuestionWord',
    'cuántos': 'QuestionWord',
    'cuántas': 'QuestionWord',
    'por qué': 'QuestionWord',

    lo: 'Pronoun',
    algo: 'Pronoun',

    si: 'Condition',
    'sí': 'Adverb', // yes

    // impersonal 'there is/are' - present of haber
    hay: ['Verb', 'PresentTense'],

    no: 'Negative',
    nunca: 'Negative', //never

    // imperfect of ser
    era: ['Copula', 'Imperfect'],
    eras: ['Copula', 'Imperfect'],
    'éramos': ['Copula', 'Imperfect'],
    erais: ['Copula', 'Imperfect'],
    eran: ['Copula', 'Imperfect'],

    irse: ['Reflexive', 'Infinitive']
  };

  // possessive determiners - 'mi casa', not pronouns ('la mía')
  const possDet = [
    'mi', // singular  my (masculine and feminine)
    'mis', // plural my (masculine and feminine)
    'tu', // singular  your (informal singular, masculine and feminine)
    'tus', // plural your (informal singular, masculine and feminine)
    'su', // singular" his/her/its/your (formal singular, masculine and feminine)
    'sus', // plural  his/her/its/your/their (masculine and feminine)
    'nuestro', // singular masculine our
    'nuestra', // singular feminine  our
    'nuestros', // plural masculine  our
    'nuestras', // plural feminine   our
    'vuestro', // singular masculine your (informal plural)
    'vuestra', // singular feminine  your (informal plural)
    'vuestros', // plural masculine  your (informal plural)
    'vuestras' // plural feminine     your (informal plural)
  ];
  possDet.forEach((str) => {
    lex[str] = ['Determiner', 'Possessive'];
  });

  // possessive pronouns - 'la casa es mía'
  const possPro = [
    'mío', 'mía', 'míos', 'mías',
    'tuyo', 'tuya', 'tuyos', 'tuyas',
    'suyo', 'suya', 'suyos', 'suyas',
  ];
  possPro.forEach((str) => {
    lex[str] = ['Pronoun', 'Possessive'];
  });
  var misc$1 = lex;

  const {
    toPresent,
    toPast,
    toImperfect,
    toFuture,
    toConditional,
    toGerund,
    toPerfecto,
    toImperative,
    toSubjunctive,
    toImperfectSubjunctive,
    toImperfectSubjunctiveSe,
    toReflexive
  } = methods$1.verb;
  let lexicon$1 = {};

  const tagMap = {
    first: 'FirstPerson',
    second: 'SecondPerson',
    third: 'ThirdPerson',
    firstPlural: 'FirstPersonPlural',
    secondPlural: 'SecondPersonPlural',
    thirdPlural: 'ThirdPersonPlural'
  };

  const addWords = function (obj, tag, lex) {
    // when two persons share a form ('hablaba' is 1st + 3rd person),
    // don't pick one - just tag the tense
    let counts = {};
    Object.keys(obj).forEach((k) => {
      counts[obj[k]] = (counts[obj[k]] || 0) + 1;
    });
    Object.keys(obj).forEach((k) => {
      let w = obj[k];
      if (!w || lex[w]) {
        return
      }
      if (counts[w] > 1) {
        lex[w] = [tag];
      } else {
        lex[w] = [tag, tagMap[k]];
      }
    });
  };

  // attach the reflexive clitic to affirmative imperatives - 'lávate', 'lávese'
  const toImperativeReflexive = function (obj) {
    let out = {};
    if (obj.second) {
      out.second = obj.second + 'te';
    }
    if (obj.third) {
      out.third = obj.third + 'se';
    }
    if (obj.firstPlural) {
      out.firstPlural = obj.firstPlural + 'nos';
    }
    if (obj.thirdPlural) {
      out.thirdPlural = obj.thirdPlural + 'se';
    }
    return out
  };

  Object.keys(lexData).forEach((tag) => {
    let wordsObj = unpack$1(lexData[tag]);
    Object.keys(wordsObj).forEach((w) => {
      lexicon$1[w] = tag;

      // add conjugations for our verbs
      if (tag === 'Infinitive') {
        // add present tense
        let obj = toPresent(w);
        addWords(obj, 'PresentTense', lexicon$1);
        // add past tense
        obj = toPast(w);
        addWords(obj, 'PastTense', lexicon$1);
        // add imperfect
        obj = toImperfect(w);
        addWords(obj, 'Imperfect', lexicon$1);
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
        // add reflexive infinitive forms
        obj = toReflexive(w);
        addWords(obj, 'Reflexive', lexicon$1);
        // add imperative
        obj = toImperative(w);
        addWords(obj, 'Imperative', lexicon$1);
        // add reflexive for some imperative forms
        obj = toImperativeReflexive(obj);
        addWords(obj, 'Reflexive', lexicon$1);
        // add toSubjunctive
        obj = toSubjunctive(w);
        addWords(obj, 'Subjunctive', lexicon$1);
        // imperfect subjunctive - 'si pudiera', 'si pudiese'
        obj = toImperfectSubjunctive(w);
        addWords(obj, 'Subjunctive', lexicon$1);
        obj = toImperfectSubjunctiveSe(w);
        addWords(obj, 'Subjunctive', lexicon$1);
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

  // hand-curated entries always win
  Object.assign(lexicon$1, misc$1);
  // console.log(lexicon['ganado'])

  var lexicon$2 = lexicon$1;

  const verbForm$1 = function (term) {
    let want = [
      'FirstPerson',
      'SecondPerson',
      'ThirdPerson',
      'FirstPersonPlural',
      'SecondPersonPlural',
      'ThirdPersonPlural'
    ];
    return want.find((tag) => term.tags.has(tag))
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
    view.docs.forEach((terms) => {
      terms.forEach((term) => {
        // 'machine' may hold a clitic-stripped stem - 'dámelo' → 'da'
        let str = term.implicit || term.machine || term.normal || term.text;

        if (term.tags.has('Verb')) {
          // copulas are a closed set - ser + estar
          if (term.tags.has('Copula')) {
            term.root = /^est/.test(str) ? 'estar' : 'ser';
            return
          }
          // get infinitive form of the verb
          if (term.tags.has('Reflexive')) {
            term.root = stripReflexive$1(str);
            return
          }
          let form = verbForm$1(term);
          if (term.tags.has('Gerund')) {
            term.root = verb.fromGerund(str, form);
          } else if (term.tags.has('Perfecto')) {
            term.root = verb.fromPerfecto(str, form);
          } else if (term.tags.has('Imperfect')) {
            term.root = verb.fromImperfect(str, form);
          } else if (term.tags.has('PresentTense')) {
            term.root = verb.fromPresent(str, form);
          } else if (term.tags.has('PastTense')) {
            term.root = verb.fromPast(str, form);
          } else if (term.tags.has('FutureTense')) {
            term.root = verb.fromFuture(str, form);
          } else if (term.tags.has('Conditional')) {
            term.root = verb.fromConditional(str, form);
          } else if (term.tags.has('Imperative')) {
            term.root = verb.fromImperative(str, form);
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
    words: lexicon$2,
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
    { word: 'al', out: ['a', 'el'] },
    { word: 'del', out: ['de', 'el'] },
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

  const titleCase = /^\p{Lu}[\p{Ll}'’]/u;
  const hasNumber = /[0-9]/;
  const notProper = ['Date', 'Month', 'WeekDay', 'Unit', 'Expression'];

  const tagTitleCase = function (terms, index, world) {
    let setTag = world.methods.one.setTag;
    let term = terms[index];
    let str = term.text || '';
    // titlecase and not first word of sentence
    if (index !== 0 && titleCase.test(str) === true && hasNumber.test(str) === false) {
      // skip Dates and stuff
      if (notProper.find((tag) => term.tags.has(tag))) {
        return
      }
      // first word in a quotation?
      if (term.pre.match(/["']$/)) {
        return
      }
      if (term.normal === 'the') {
        return
      }
      setTag([term], ['ProperNoun', 'Noun'], world, false, '2-titlecase');
    }
  };
  var titleCase$1 = tagTitleCase;

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

  // spanish attaches object/reflexive pronouns to the end of infinitives,
  // gerunds and affirmative imperatives - 'quemarme', 'diciéndoselo', 'dámelo'.
  // attaching them usually adds a written accent to preserve stress,
  // so we de-accent the stem before checking it.

  // indirect-object clitics can stack before a direct-object one - 'me lo'
  const indirect = ['me', 'te', 'se', 'nos', 'os', 'le', 'les'];
  const direct = ['lo', 'los', 'la', 'las', 'le', 'les'];
  let endings = [];
  indirect.forEach(a => {
    direct.forEach(b => {
      endings.push(a + b);
    });
  });
  endings = endings.concat(indirect, direct);
  // longest-first, so 'melo' is tried before 'lo'
  endings.sort((a, b) => b.length - a.length);

  const accents = { 'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u' };
  const deAccent = (str) => str.replace(/[áéíóú]/g, (c) => accents[c]);

  const isGerund = /(ando|iendo|yendo)$/;
  const isInfinitive = /(ar|er|ir)$/;

  const verbish = ['Imperative', 'PresentTense', 'Infinitive', 'Verb', 'Copula', 'Subjunctive'];
  const isVerb = function (entry) {
    if (!entry) {
      return false
    }
    let tags = typeof entry === 'string' ? [entry] : entry;
    return tags.some(t => verbish.includes(t))
  };

  const tryStem = function (stem, ending, lexicon) {
    let plain = deAccent(stem);
    // 'levantándose', 'diciéndomelo'
    if (isGerund.test(plain)) {
      return { tags: ['Gerund'], stem: plain }
    }
    // 'quemarme', 'mezclarlo' - verify against the lexicon,
    // or accept a long-enough infinitive shape ('bloguearlo')
    if (isInfinitive.test(plain)) {
      if (isVerb(lexicon[plain]) || plain.length >= 5) {
        return { tags: ['Infinitive'], stem: plain }
      }
      return null
    }
    // affirmative imperative - 'dámelo' → 'da', 'hazme' → 'haz'
    if (isVerb(lexicon[plain])) {
      return { tags: ['Imperative', 'SecondPerson'], stem: plain }
    }
    // 'vámonos' → 'vamos' (the final -s is dropped before 'nos')
    if (ending.startsWith('nos') && isVerb(lexicon[plain + 's'])) {
      return { tags: ['Imperative', 'FirstPersonPlural'], stem: plain + 's' }
    }
    return null
  };

  const checkEnclitic = function (terms, i, world) {
    const setTag = world.methods.one.setTag;
    const lexicon = world.model.one.lexicon;
    let term = terms[i];
    if (term.tags.size > 0) {
      return null
    }
    let str = term.machine || term.normal;
    for (let k = 0; k < endings.length; k += 1) {
      let e = endings[k];
      if (str.length - e.length >= 2 && str.endsWith(e)) {
        let stem = str.slice(0, str.length - e.length);
        let found = tryStem(stem, e, lexicon);
        if (found !== null) {
          // let the root-computation see through the clitics
          term.machine = found.stem;
          setTag([term], found.tags, world, false, '2-enclitic');
          term.confidence = 0.8;
          return true
        }
      }
    }
    return null
  };
  var enclitic = checkEnclitic;

  // const isTitleCase = function (str) {
  //   return /^[A-ZÄÖÜ][a-z'\u00C0-\u00FF]/.test(str) || /^[A-ZÄÖÜ]$/.test(str)
  // }

  // const hasNoVerb = function (terms) {
  //   return !terms.find(t => t.tags.has('#Verb'))
  // }

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

  // deduce plurality of a noun, by its suffix
  const guessPlural = function (terms, i, world) {
    const setTag = world.methods.one.setTag;
    const looksPlural = world.methods.two.looksPlural;
    let term = terms[i];
    if (term.tags.has('Noun') && !term.tags.has('Singular') && !term.tags.has('Plural') && !term.tags.has('Pronoun')) {
      let str = term.machine || term.normal;
      if (looksPlural(str)) {
        setTag([term], 'Plural', world, false, '3-guessPlural');
      }
    }
  };
  var guessPlural$1 = guessPlural;

  // deduce plurality of an adjective, by its suffix
  const guessAdjPlural = function (terms, i, world) {
    const setTag = world.methods.one.setTag;
    const looksPlural = world.methods.two.looksPlural;
    let term = terms[i];
    if (term.tags.has('Adjective') && !term.tags.has('SingularAdjective') && !term.tags.has('PluralAdjective')) {
      let str = term.machine || term.normal;
      if (looksPlural(str) === true) {
        setTag([term], 'PluralAdjective', world, false, '3-guessPlural');
      } else {
        setTag([term], 'SingularAdjective', world, false, '3-guessPlural');
      }
    }
  };
  var adjPlural = guessAdjPlural;

  // only -o/-a adjectives are gendered.
  // '-e' and consonant endings are common-gender ('grande', 'feliz', 'azul')
  const guessGender$1 = function (str) {
    if (str.endsWith('o') || str.endsWith('os')) {
      return 'm'
    }
    if (str.endsWith('a') || str.endsWith('as')) {
      return 'f'
    }
    return null
  };

  // deduce gender of an adjective, by its suffix
  const guessAdjGender = function (terms, i, world) {
    const setTag = world.methods.one.setTag;
    let term = terms[i];
    if (term.tags.has('Adjective') && !term.tags.has('FemaleAdjective') && !term.tags.has('MaleAdjective')) {
      let str = term.machine || term.normal;
      let found = guessGender$1(str);
      if (found === 'f') {
        setTag([term], 'FemaleAdjective', world, false, '3-guessGender');
      } else if (found === 'm') {
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
    // imperfect - 'hablaba' is 1st or 3rd person, so no person tag
    ['aba', ['Imperfect']],
    ['abas', ['SecondPerson', 'Imperfect']],
    ['ábamos', ['FirstPersonPlural', 'Imperfect']],
    ['abais', ['SecondPersonPlural', 'Imperfect']],
    ['aban', ['ThirdPersonPlural', 'Imperfect']],
    ['ías', ['SecondPerson', 'Imperfect']],
    ['íamos', ['FirstPersonPlural', 'Imperfect']],
    ['íais', ['SecondPersonPlural', 'Imperfect']],
    ['ían', ['ThirdPersonPlural', 'Imperfect']],
    // future-tense
    ['ré', ['FirstPerson', 'FutureTense']],
    ['rás', ['SecondPerson', 'FutureTense']],
    ['rá', ['ThirdPerson', 'FutureTense']],
    ['remos', ['FirstPersonPlural', 'FutureTense']],
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
    'Imperfect',
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
      // skip non-finite forms and moods - 'comprado' ends in -o but is not first-person
      if (
        term.tags.has('Infinitive') ||
        term.tags.has('Auxiliary') ||
        term.tags.has('Negative') ||
        term.tags.has('Gerund') ||
        term.tags.has('Perfecto') ||
        term.tags.has('Participle') ||
        term.tags.has('Imperative') ||
        term.tags.has('Subjunctive') ||
        term.tags.has('Copula')
      ) {
        return
      }
      // do we already have both?
      if (forms.filter(tag => term.tags.has(tag)).length >= 2) {
        return
      }
      let str = term.machine || term.normal;

      //relajarse -> relajar
      str = stripReflexive(str);
      for (let k = 0; k < rules.length; k += 1) {
        let [suff, tag] = rules[k];
        if (str.endsWith(suff)) {
          setTag([term], tag, world, true, '3-guessForm');
          break
        }
      }
    }
  };
  var verbForm = guessVerbForm;

  // auxiliary forms we don't have conjugations of
  let isAux = new Set([
    //  imperfect subjunctive of 'poder'
    'pudiera',
    'pudieras',
    'pudiera',
    'pudiéramos',
    'pudierais',
    'pudieran',
    'pudiese',
    'pudieses',
    'pudiese',
    'pudiésemos',
    'pudieseis',
    'pudiesen',
    // Ser (to be)
    // First set (-ara/-ase endings):
    'fuera',
    'fueras',
    'fuera',
    'fuéramos',
    'fuerais',
    'fueran',
    // Second set (-iera/-iese endings):
    'fuese',
    'fueses',
    'fuese',
    'fuésemos',
    'fueseis',
    'fuesen',

    // Haber (to have, when used as an auxiliary)
    // First set (-ara/-ase endings):
    'hubiera',
    'hubieras',
    'hubiera',
    'hubiéramos',
    'hubierais',
    'hubieran',

    // Second set (-iera/-iese endings):
    'hubiese',
    'hubieses',
    'hubiese',
    'hubiésemos',
    'hubieseis',
    'hubiesen',

    // Estar (to be, in the context of state / condition)
    // First set (-ara/-ase endings):
    'estuviera',
    'estuvieras',
    'estuviera',
    'estuviéramos',
    'estuvierais',
    'estuvieran',
    // Second set (-iera/-iese endings):
    'estuviese',
    'estuvieses',
    'estuviese',
    'estuviésemos',
    'estuvieseis',
    'estuviesen',

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

    // Tener (to have, in the context of possession', 'obligation)
    // First set (-ara/-ase endings):
    'tuviera',
    'tuvieras',
    'tuviera',
    'tuviéramos',
    'tuvierais',
    'tuvieran',
    // Second set (-iera/-iese endings):
    'tuviese',
    'tuvieses',
    'tuviese',
    'tuviésemos',
    'tuvieseis',
    'tuviesen',

    // Hacer (to do, to make)
    // First set (-ara/-ase endings):
    'hiciera',
    'hiciese',
    'hicieras',
    'hicieses',
    'hiciera',
    'hiciese',
    'hiciéramos',
    'hiciésemos',
    'hicierais',
    'hicieseis',
    'hicieran',
    'hiciesen',

    // Venir (to come)
    // First set (-ara/-ase endings):
    'viniera',
    'vinieras',
    'viniera',
    'viniéramos',
    'vinierais',
    'vinieran',
    // Second set (-iera/-iese endings):
    'viniese',
    'vinieses',
    'viniese',
    'viniésemos',
    'vinieseis',
    'viniesen'
  ]);

  const tagAuxVerb = function (terms, i, world) {
    const setTag = world.methods.one.setTag;
    let term = terms[i];
    // only when an actual verb follows - 'fuera de la ciudad' is not an auxiliary
    if (isAux.has(term.normal) && term.tags.has('Verb') && terms[i + 1] && terms[i + 1].tags.has('Verb')) {
      setTag([term], 'Auxiliary', world, false, '3-auxiliary');
    }
  };
  var auxVerb = tagAuxVerb;

  // '¡Corre más rápido!' - a sentence-initial verb in an exclamation is a command.
  // tú/usted commands share their form with the present-tense, so they need this context to disambiguate
  const checkImperative = function (terms, i, world) {
    const setTag = world.methods.one.setTag;
    let term = terms[i];
    if (i !== 0 || !term.pre.includes('¡')) {
      return
    }
    if (
      term.tags.has('PresentTense') &&
      (term.tags.has('SecondPerson') || term.tags.has('ThirdPerson'))
    ) {
      setTag([term], 'Imperative', world, false, '3-exclamation-imperative');
    }
  };
  var checkImperative$1 = checkImperative;

  // 1st pass

  // these methods don't care about word-neighbours
  const firstPass = function (terms, world) {
    for (let i = 0; i < terms.length; i += 1) {
      //  is it titlecased?
      let found = titleCase$1(terms, i, world);
      // try look-like rules
      found = found || checkRegex$1(terms, i, world);
      // turn '1993' into a year
      checkYear(terms, i, world);
    }
  };
  const secondPass = function (terms, world) {
    for (let i = 0; i < terms.length; i += 1) {
      let found = acronym(terms, i, world);
      found = found || enclitic(terms, i, world);
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
      auxVerb(terms, i, world);
      verbForm(terms, i, world);
      checkImperative$1(terms, i, world);
    }
  };

  const tagger = function (view) {
    let world = view.world;
    view.docs.forEach((terms) => {
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
    [/^#[a-z0-9_\u00C0-\u00FF]{2,}$/i, 'HashTag'],

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
  // const inf = 'Infinitive'
  const g = 'Gerund';
  const ref = 'Reflexive';
  const imp = 'Imperfect';
  const pl = ['Noun', 'Plural'];

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
      // an: vb, - too greedy - 'pan', 'plan', 'capitán'
      'ió': vb,
      // en: vb, - too greedy - 'examen', 'imagen', 'orden'
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
      ita: jj,
      izo: jj,
      cto: jj,
      ana: jj,
      eos: jj,
      // ado: vb,
      // ndo: first, - 'ando'/'endo' gerund rules cover this
      // ada: vb, - 'llegada', 'mirada' are nouns
      ron: vb,
      // ido: vb,
      aba: imp,
      tar: vb,
      gar: vb,
      nar: vb,
      'ían': imp,
      rar: vb,
      // ría: cond, - 'librería', 'categoría' - see aría/ería/iría below
      aré: fut,
      iré: fut,
      eré: fut,
      rás: fut,
      ará: fut,
      ado: vb,
      pto: jj,
      osa: jj,
      tos: pl,

      // ida: vb,
    },
    {
      // four-letter suffixes
      itas: jj,
      itos: jj,
      icos: jj,
      icas: jj,
      tico: jj,
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
      // tado: first, - 'cantado' is a participle, not first-person
      // amos: cond, - '-amos' is present/preterite, never conditional
      // rías: cond, - 'librerías' - see arías/erías/irías below
      // rían: cond,
      abas: imp,
      aban: imp,
      'íais': imp,
      'aría': cond,
      // ería: cond, - 'librería', 'panadería' - too many -ería nouns
      'iría': cond,
      'dría': cond, // podría, tendría
      'bría': cond, // habría, sabría
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
      nero: jj,
      tero: jj,
      ares: pl, // lugares, hogares
      ores: pl, // profesores, flores
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
      'íamos': imp,
      'arías': cond,
      // erías: cond, - 'librerías'
      'irías': cond,
      'drías': cond,
      'brías': cond,
      'arían': cond,
      'erían': cond,
      'irían': cond,
      'drían': cond,
      'brían': cond,
    },
    {
      // six-letter suffixes
      ística: jj,
      ciones: nn,
      'ábamos': imp,
      'ríamos': cond,
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
    'día', 'mapa', 'planeta', 'sofá', 'clima',
    'tema', 'drama', 'programa', 'poema', 'tranvía',
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
    'mano', 'foto', 'moto', 'flor', 'radio',
    'sal', 'piel', 'miel', 'nube', 'sangre',
  ]);
  var exceptions$1 = { f, m };

  //sweep-through all suffixes
  const bySuffix = function (str) {
    const len = str.length;
    let max = 7;
    if (len <= max) {
      max = len - 1;
    }
    for (let i = max; i > 0; i -= 1) {
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

  // singular words that end in -s
  let exceptions = new Set([
    'análisis',
    'jueves',
    'ciempiés',
    // weekdays
    'lunes',
    'martes',
    'miércoles',
    'viernes',
    // invariants + singulars in -s
    'crisis',
    'tesis',
    'dosis',
    'sintaxis',
    'énfasis',
    'paréntesis',
    'oasis',
    'virus',
    'campus',
    'dios',
    'adiós',
    'vals',
  ]);

  const looksPlural = function (str) {
    // not long enough to be plural - 'gas', 'mes', 'res', 'tos'
    if (!str || str.length <= 3) {
      return false
    }
    if (exceptions.has(str)) {
      return false
    }
    if (!str.endsWith('s')) {
      return false
    }
    // stressed final syllable - 'país', 'inglés', 'autobús', 'cortés'
    if (/[áéíóú]s$/.test(str)) {
      return false
    }
    // 'crisis'-type words
    if (str.endsWith('sis') || str.endsWith('xis')) {
      return false
    }
    return true
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
    // el final de
    { match: '#Determiner [#Adjective] (de|del)', group: 0, tag: 'Noun', reason: 'det-adj' },

    // homographs - 'él vino a casa' (he came home)
    { match: '#Pronoun [vino] (a|de|en|con)', group: 0, tag: ['Verb', 'PastTense', 'ThirdPerson'], reason: 'el-vino' },
    // 'la cura', 'el canto' - determiner + verb-form is a noun
    { match: '(el|la|un|una) [#PresentTense]$', group: 0, tag: 'Noun', reason: 'la-cura' },
    { match: '(el|la|un|una) [#PresentTense] #Preposition', group: 0, tag: 'Noun', reason: 'el-canto-de' },
    // 'las casas' - plural determiner + verb-form is a plural noun
    { match: '(los|las|unos|unas) [#PresentTense]$', group: 0, tag: 'Plural', reason: 'las-casas' },
    // 'gran parte de', 'forma parte de'
    { match: '(gran|mayor|buena|toda|esa|esta) [parte]', group: 0, tag: 'Noun', reason: 'gran-parte' },

    // no exageres
    { match: 'no [#Noun]', group: 0, tag: 'Verb', reason: 'no-noun' },

    // moods
    // 'espero que tengas' - a command-form after 'que' is subjunctive
    { match: 'que [#Imperative]', group: 0, tag: 'Subjunctive', reason: 'que-subjunctive' },
    // 'ojalá llueva mañana'
    { match: '(ojalá|quizás|quizá) [#Imperative]', group: 0, tag: 'Subjunctive', reason: 'ojalá-subjunctive' },
    // 'no hables tan alto' - a negative command borrows the subjunctive form
    { match: '^no [#Subjunctive]', group: 0, tag: 'Imperative', reason: 'negative-imperative' },

    // auxiliary verbs
    { match: '[#Modal] #Verb', group: 0, tag: 'Auxiliary', reason: 'modal-verb' },
    // alcanzar + infinitive (to manage to do)
    // comenzar + infinitive (to begin doing)
    // resultar + infinitive (to end up doing)
    {
      match: '[(alcanzar|comenzar|resultar)] #Infinitive',
      group: 0,
      tag: 'Auxiliary',
      reason: 'alcanzar-inf'
    },
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
    // poder  "to be able to"
    { match: '[{poder/verb}] #Infinitive', group: 0, tag: 'Auxiliary', reason: 'poder-inf' },
    // any missing estar
    { match: '[#Copula] #Infinitive', group: 0, tag: 'Auxiliary', reason: 'copula-inf' },

    // possessives - 'my taste'
    { match: '(#Possessive && #Determiner) [#FirstPerson]', group: 0, tag: 'Noun', reason: 'mi-gusto' },
    //Los avances en
    { match: '(los|las) [#Verb] #Preposition', group: 0, tag: 'Plural', reason: 'los-advances' },
    //confundo los numbres
    { match: '#Verb (los|las) [#Verb]$', group: 0, tag: 'Plural', reason: 'los-numbres' },
    //de la cola
    { match: 'de (la|las) [#Verb]', group: 0, tag: 'Noun', reason: 'de-la-cola' },
    //of the #verb
    { match: 'del [#Verb]', group: 0, tag: 'Noun', reason: 'del-verb' }
  ];

  let net = null;

  // rules like 'la-cura' flip a verb into a noun, after the preTagger's
  // gender-pass already ran - so give those new nouns a gender here
  const nounGender = function (view) {
    const world = view.world;
    view.docs.forEach(terms => {
      for (let i = 0; i < terms.length; i += 1) {
        guessNounGender$1(terms, i, world);
      }
    });
  };

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
    nounGender(view);
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
    // a feature-tag - applies to determiners ('mi casa') and pronouns ('es mío')
    Possessive: {},

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
    // non-finite - 'hablar' is not a present-tense form in spanish
    Infinitive: {
      is: 'Verb',
      not: ['PresentTense', 'PastTense', 'FutureTense', 'Gerund'],
    },
    // non-finite - 'hablando'
    Gerund: {
      is: 'Verb',
      not: ['PresentTense', 'PastTense', 'FutureTense', 'Copula'],
    },
    PastTense: {
      is: 'Verb',
      not: ['PresentTense', 'Gerund', 'FutureTense'],
    },
    // pretérito imperfecto - 'hablaba'
    Imperfect: {
      is: 'PastTense',
      not: ['Conditional'],
    },
    FutureTense: {
      is: 'Verb',
      not: ['PresentTense', 'Gerund', 'PastTense'],
    },
    Copula: {
      is: 'Verb',
    },
    // a feature-tag - 'no', 'nunca' are not verbs
    Negative: {},
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
    // moods
    Imperative: {
      is: 'Verb',
      not: ['Subjunctive']
    },
    Subjunctive: {
      is: 'Verb',
      not: ['Imperative']
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

  const toOrdinal = {};

  Object.keys(data).forEach(k => {
    data[k].forEach(a => {
      let [num, card, ord] = a;
      toOrdinal[card] = ord;
    });
  });
  // add extras
  toOrdinal.cien = 'centésimo';

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
        let res = m.map(val => {
          let obj = parse(val);
          if (obj.num === null) {
            return val
          }
          let fmt = val.has('#Ordinal') ? 'Ordinal' : 'Cardinal';
          let str = format(obj, fmt);
          if (str) {
            val.replaceWith(str, { tags: true });
            val.tag('NumericValue');
          }
          return val
        });
        return new Numbers(res.document, res.pointer)
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

  const toPluralArt = {
    el: 'los',
    la: 'las',
    un: 'unos',
    una: 'unas',
    mi: 'mis',
    tu: 'tus',
    nuestro: 'nuestros',
    nuestra: 'nuestras',
    vuestro: 'vuestros',
    vuestra: 'vuestras',
  };
  const toSingularArt = {
    los: 'el',
    las: 'la',
    unos: 'un',
    unas: 'una',
    mis: 'mi',
    tus: 'tu',
    nuestros: 'nuestro',
    nuestras: 'nuestra',
    vuestros: 'vuestro',
    vuestras: 'vuestra',
  };

  // flip 'los' → 'el', etc
  const swapArticle = function (m, mapping) {
    let art = m.before(`(${Object.keys(mapping).join('|')})$`);
    if (art.found) {
      let w = art.text('normal');
      if (mapping.hasOwnProperty(w)) {
        art.replaceWith(mapping[w]);
      }
    }
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
        getNth$2(this, n).ifNo('#Plural').forEach(m => {
          let str = m.text('normal');
          let plural = methods.toPlural(str);
          m.replaceWith(plural);
          // flip article, too
          swapArticle(m, toPluralArt);
        });
        return this
      }
      toSingular(n) {
        const methods = this.methods.two.transform.noun;
        getNth$2(this, n).if('#Plural').forEach(m => {
          let str = m.text('normal');
          let singular = methods.toSingular(str);
          m.replaceWith(singular);
          // flip article, too
          swapArticle(m, toSingularArt);
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
  const getRoot = function (m) {
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
        const { toPresent, toPast, toFuture, toConditional, toGerund, toPerfecto, toImperative, toSubjunctive } = methods;
        return getNth(this, n).map(m => {
          let str = getRoot(m);
          return {
            presentTense: toPresent(str),
            pastTense: toPast(str),
            futureTense: toFuture(str),
            conditional: toConditional(str),
            gerund: toGerund(str),
            perfecto: toPerfecto(str),
            imperative: toImperative(str),
            subjunctive: toSubjunctive(str),
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

  var version = '0.3.0';

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
