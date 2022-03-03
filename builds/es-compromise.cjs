(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.esCompromise = factory());
})(this, (function () { 'use strict';

  let methods$n = {
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
  let compute$a = {};
  let hooks = [];

  var tmp = { methods: methods$n, model: model$6, compute: compute$a, hooks };

  const isArray$7 = input => Object.prototype.toString.call(input) === '[object Array]';

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
      else if (isArray$7(input)) {
        input.forEach(name => world.compute.hasOwnProperty(name) && compute[name](this));
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
  var compute$9 = fns$4;

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
      return cb(view, i)
    });
    if (res.length === 0) {
      return empty || this.update([])
    }
    // return an array of values, or View objects?
    // user can return either from their callback
    if (res[0] !== undefined && typeof res[0] === 'object' && (res[0] === null || !res[0].isView)) {
      return res
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
    return this.update(ptrs)
  };

  const find = function (cb) {
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
  var loops = { forEach, map, filter, find, some, random };

  const utils = {
    /** */
    termList: function () {
      return this.methods.one.termList(this.docs)
    },
    /** */
    terms: function (n) {
      let m = this.match('.').toView(); //make this faster
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
    is: function (b) {
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

  const methods$m = Object.assign({}, util, compute$9, loops);

  // aliases
  methods$m.get = methods$m.eq;
  var api$9 = methods$m;

  class View {
    constructor(document, pointer, groups = {}) {
      // invisible props
      [
        ['document', document],
        ['world', tmp],
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
        docs = tmp.methods.one.getDoc(this.ptrs, this.document);
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
        let [n, start, end, id] = a;
        start = start || 0;
        end = end || (document[n] || []).length;
        //add frozen id, for good-measure
        if (document[n] && document[n][start]) {
          id = id || document[n][start].id;
        }
        return [n, start, end, id]
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
      const { methods, world } = this;
      //assume ./01-tokenize is installed
      let document = methods.one.tokenize(input, world);
      let doc = new View(document);
      doc.world = world;
      // doc.compute(world.hooks)
      doc.compute(['normal', 'lexicon', 'preTagger']);
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
  Object.assign(View.prototype, api$9);
  var View$1 = View;

  var version = '13.11.4-rc5';

  const isObject$4 = function (item) {
    // let isSet = item instanceof Set
    return item && typeof item === 'object' && !Array.isArray(item)
  };

  // recursive merge of objects
  function mergeDeep(model, plugin) {
    if (isObject$4(plugin)) {
      for (const key in plugin) {
        if (isObject$4(plugin[key])) {
          if (!model[key]) Object.assign(model, { [key]: {} });
          mergeDeep(model[key], plugin[key]); //recursion
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

  const isArray$6 = arr => Object.prototype.toString.call(arr) === '[object Array]';

  const isObject$3 = item => item && typeof item === 'object' && !Array.isArray(item);

  const isSet = item => item instanceof Set;

  // deep-i-guess clone of model object
  const deepClone$1 = function (model) {
    for (const key in model) {
      if (isObject$3(model[key])) {
        model[key] = Object.assign({}, model[key]);
        model[key] = deepClone$1(model[key]); //recursive
      } else if (isArray$6(model[key])) {
        model[key] = model[key].slice(0);
      } else if (isSet(model[key])) {
        model[key] = new Set(model[key]);
      }
    }
    return model
  };
  var clone = deepClone$1;

  /** add words to assume by prefix in typeahead */

  /** log the decision-making to console */
  const verbose = function (set) {
    let env = typeof process === 'undefined' ? self.env || {} : process.env; //use window, in browser
    env.DEBUG_TAGS = set === 'tagger' || set === true ? true : '';
    env.DEBUG_MATCH = set === 'match' || set === true ? true : '';
    env.DEBUG_CHUNKS = set === 'chunker' || set === true ? true : '';
    return this
  };

  /** pre-compile a list of matches to lookup */
  const compile = function (input) {
    return this().compile(input)
  };

  let world = Object.assign({}, tmp);

  const nlp = function (input, lex) {
    const { methods, hooks } = world;
    if (lex) {
      nlp.addWords(lex);
    }
    //assume ./01-tokenize is installed
    let document = methods.one.tokenize(input, world);
    let doc = new View$1(document);
    doc.world = world;
    doc.compute(hooks);
    return doc
  };
  Object.defineProperty(nlp, '_world', {
    value: world,
    writable: true,
  });

  /** don't run the POS-tagger */
  nlp.tokenize = function (input, lex) {
    const { methods, compute } = this._world;
    // add user-given words to lexicon
    if (lex) {
      nlp.addWords(lex);
    }
    // run the tokenizer
    let document = methods.one.tokenize(input, this._world);
    let doc = new View$1(document);
    // give contractions a shot, at least
    if (compute.contractions) {
      doc.compute(['alias', 'normal', 'machine', 'contractions']); //run it if we've got it
    }
    return doc
  };

  /** deep-clone the library's model*/
  nlp.fork = function (str) {
    this._world = Object.assign({}, this._world);
    this._world.methods = Object.assign({}, this._world.methods);
    this._world.model = clone(this._world.model);
    this._world.model.fork = str;
    return this
  };

  /** extend compromise functionality */
  nlp.plugin = function (plugin) {
    extend$1(plugin, this._world, View$1, this);
    return this
  };
  nlp.extend = nlp.plugin;

  /** log the decision-making to console */
  nlp.verbose = verbose;
  /** pre-compile a list of matches to lookup */
  nlp.compile = compile;
  /** current library release version */
  nlp.version = version;
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

  // apply our only default plugins
  var nlp$1 = nlp;

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

  // punctuation we wanna transfer

  // splice an array into an array
  const spliceArr = (parent, index, child) => {
    // tag them as dirty
    child.forEach(term => term.dirty = true);
    let args = [index, 0].concat(child);
    Array.prototype.splice.apply(parent, args);
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
    const juicy = /[.?!,;:)-–—'"]/g;
    let wasLast = source[end - 1];
    if (!wasLast) {
      return
    }
    let post = wasLast.post;
    if (juicy.test(post)) {
      let punct = post.match(juicy).join(''); //not perfect
      let last = needle[needle.length - 1];
      last.post = punct + last.post; //+ ' '
      // remove it, from source
      wasLast.post = wasLast.post.replace(juicy, '');
    }
  };

  const isTitleCase$1 = function (str) {
    return /^[A-Z][a-z'\u00C0-\u00FF]/.test(str) || /^[A-Z]$/.test(str)
  };

  const toTitleCase = function (str) {
    str = str.replace(/^[a-z\u00C0-\u00FF]/, x => x.toUpperCase()); //TODO: support unicode
    return str
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
      old.text = old.text.replace(/^[A-Z]/, x => x.toLowerCase());
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
    movePunct(home, end, needle);
    spliceArr(home, start, needle);
  };

  const cleanAppend = function (home, ptr, needle, document) {
    let [n, , end] = ptr;
    let total = document[n].length;
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
    }
    spliceArr(home, ptr[2], needle);
  };

  /*
  unique & ordered term ids, based on time & term index

  Base 36 (numbers+ascii)
    3 digit 4,600
    2 digit 1,200
    1 digit 36

    TTT|NNN|II|R

  TTT -> 46 seconds since load
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
  const start$1 = new Date().getTime();

  const pad3 = (str) => {
    str = str.length < 3 ? '0' + str : str;
    return str.length < 3 ? '0' + str : str
  };

  const toId = function (term) {
    let [n, i] = term.index || [0, 0];
    var now = new Date().getTime() - start$1;
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

    if (id.length !== 9) {
      console.error('id !9 ' + id);
    }
    return term.normal + '|' + id.toUpperCase()
  };

  var uuid = toId;

  // setInterval(() => console.log(toId(4, 12)), 100)

  // are we inserting inside a contraction?
  // expand it first
  const expand$2 = function (m) {
    if (m.has('@hasContraction') && m.after('^.').has('@hasContraction')) {
      let more = m.grow('@hasContraction');
      more.contractions().expand();
    }
  };

  const isArray$5 = (arr) => Object.prototype.toString.call(arr) === '[object Array]';

  const addIds$2 = function (terms) {
    terms.forEach((term, i) => {
      term.id = uuid(term);
    });
    return terms
  };

  const getTerms = function (input, world) {
    const { methods } = world;
    // create our terms from a string
    if (typeof input === 'string') {
      return methods.one.tokenize(input, world)[0] //assume one sentence
    }
    //allow a view object
    if (typeof input === 'object' && input.isView) {
      return input.docs[0] //assume one sentence
    }
    //allow an array of terms, too
    if (isArray$5(input)) {
      return isArray$5(input[0]) ? input[0] : input
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
      if (!document[n][ptr[1]]) {
        console.log('soft-pointer', ptr);
      } else {
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
    doc.compute(['index', 'lexicon', 'preTagger']);
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
    return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase())
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
    input = input.replace(dollarStub, (a, b, c) => {
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
    let m = main.toView(ptrs).compute(['index', 'lexicon', 'preTagger']);
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
    // console.log(document)
    return document
  };



  const methods$l = {
    /** */
    remove: function (reg) {
      const { indexN } = this.methods.one;
      // two modes:
      //  - a. remove self, from full parent
      let self = this.all();
      let not = this;
      //  - b. remove a part, from self
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
      let document = pluckOut(this.document, nots);
      // repair our pointers
      let gone = indexN(nots);
      ptrs = ptrs.map(ptr => {
        let [n] = ptr;
        if (!gone[n]) {
          return ptr
        }
        gone[n].forEach(no => {
          let len = no[2] - no[1];
          // does it effect our pointer?
          if (ptr[1] <= no[1] && ptr[2] >= no[2]) {
            ptr[2] -= len;
          }
        });
        return ptr
      });

      // remove any now-empty pointers
      ptrs = ptrs.filter((ptr, i) => {
        const len = ptr[2] - ptr[1];
        if (len <= 0) {
          // adjust downstream pointers
          for (let x = i + 1; x < ptrs.length; x += 1) {
            ptrs.filter(a => a[0] === x).forEach(a => {
              a[0] -= 1;
            });
          }
          return false
        }
        return true
      });
      // strip hardened-pointers
      ptrs = ptrs.map(ptr => ptr.slice(0, 3));
      // mutate original
      self.ptrs = ptrs;
      self.document = document;
      if (reg) {
        return self.toView(ptrs).compute('index') //return new document
      }
      return self.none()
    },
  };
  // aliases
  methods$l.delete = methods$l.remove;
  var remove = methods$l;

  const methods$k = {
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
  methods$k.deHyphenate = methods$k.dehyphenate;
  methods$k.toQuotation = methods$k.toQuotations;

  var whitespace$1 = methods$k;

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

  var methods$j = { alpha, length, wordCount: wordCount$2, sequential, byFreq };

  // aliases
  const seqNames = new Set(['index', 'sequence', 'seq', 'sequential', 'chron', 'chronological']);
  const freqNames = new Set(['freq', 'frequency', 'topk', 'repeats']);
  const alphaNames = new Set(['alpha', 'alphabetical']);

  // support function as parameter
  const customSort = function (view, fn) {
    let ptrs = view.fullPointer;
    let all = [];
    ptrs.forEach((ptr, i) => {
      all.push(view.update([ptr]));
    });
    let none = view.none();
    //! not working yet
    return none.concat(all.sort(fn))
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
      arr = methods$j.byFreq(arr);
      return this.update(arr.map(o => o.pointer))
    }
    // apply sort method on each phrase
    if (typeof methods$j[input] === 'function') {
      arr = arr.sort(methods$j[input]);
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
      let txt = m.text('normal');
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

  const deepClone = function (obj) {
    return JSON.parse(JSON.stringify(obj))
  };
  const methods$i = {
    fork: function () {
      let after = this;
      after.world.model = deepClone(after.world.model);
      after.world.methods = Object.assign({}, after.world.methods);
      if (after.ptrs) {
        after.ptrs = after.ptrs.slice(0);
      }
      // clone the cache?
      // clone the document?
      return after
    },
  };
  var fork = methods$i;

  const isArray$4 = (arr) => Object.prototype.toString.call(arr) === '[object Array]';

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
    ptrs = ptrs.map(a => {
      a[0] += home.document.length;
      return a
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
        let json = methods.one.tokenize(input, world);
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
      if (isArray$4(input)) {
        let docs = combineDocs(this.document, input);
        this.document = docs;
        return this.all()
      }
      return this
    },
  };

  const methods$h = {
    // allow re-use of this view, after a mutation
    freeze: function () {
      // this.compute('id')
      // let docs = this.docs
      // let pointer = this.fullPointer
      // pointer = pointer.map((a, n) => {
      //   a[3] = docs[n].map(t => t.id)
      //   return a
      // })
      // this.ptrs = pointer
      // this.frozen = true
      return this
    },
    // make it fast again
    unFreeze: function () {
      let pointer = this.fullPointer;
      pointer = pointer.map((a, n) => {
        return a.slice(0, 3)
      });
      this.ptrs = pointer;
      delete this.frozen;
      return this
    },
    // helper method for freeze-state
    isFrozen: function () {
      return Boolean(this.ptrs && this.ptrs[0] && this.ptrs[0][3])
    }
  };
  // aliases
  methods$h.unfreeze = methods$h.unFreeze;
  var freeze = methods$h;

  const methods$g = {
    // fix a potentially-broken match
    repair: function () {
      // let ptrs = []
      // let document = this.document
      // if (this.ptrs && this.ptrs[0] && !this.ptrs[0][3]) {
      //   console.warn('Compromise: .repair() called before .freeze()')//eslint-disable-line
      //   return this
      // }
      // this.ptrs.forEach(ptr => {
      //   let [n, i, end, ids] = ptr
      //   ids = ids || []
      //   let terms = (document[n] || []).slice(i, end)
      //   // we still okay?
      //   if (looksOk(terms, ids)) {
      //     ptrs.push(ptr)
      //   } else {
      //     // look-around for a fix
      //     let found = lookFor(ids, document, n)
      //     if (found) {
      //       ptrs.push(found)
      //     }
      //     //so, drop this match
      //   }
      // })
      // this.ptrs = ptrs
      // this.frozen = false
      // this.freeze()
      return this
    }
  };
  var repair = methods$g;

  const methods$f = Object.assign({}, caseFns, insert$1, replace, remove, whitespace$1, sort$1, fork, concat, freeze, repair);

  const addAPI$3 = function (View) {
    Object.assign(View.prototype, methods$f);
  };
  var api$8 = addAPI$3;

  const compute$7 = {
    id: function (view) {
      let docs = view.docs;
      for (let n = 0; n < docs.length; n += 1) {
        for (let i = 0; i < docs[n].length; i += 1) {
          let term = docs[n][i];
          term.id = uuid(term);
        }
      }
    }
  };

  var compute$8 = compute$7;

  var change = {
    api: api$8,
    compute: compute$8,
  };

  const relPointer = function (ptrs, parent) {
    if (!parent) {
      return ptrs
    }
    ptrs.forEach(ptr => {
      let n = ptr[0];
      if (parent[n]) {
        ptr[0] = parent[n][0];
        ptr[1] += parent[n][1];
        ptr[2] += parent[n][1];
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

  // did they pass-in a compromise object?
  const isView = regs => regs && typeof regs === 'object' && regs.isView === true;

  const match$2 = function (regs, group) {
    const one = this.methods.one;
    // support param as view object
    if (isView(regs)) {
      return this.intersection(regs)
    }
    // support param as string
    if (typeof regs === 'string') {
      regs = one.parseMatch(regs);
    }
    let todo = { regs, group };
    let res = one.match(this.docs, todo, this._cache);
    let { ptrs, byGroup } = fixPointers(res, this.fullPointer);
    let view = this.toView(ptrs);
    view._groups = byGroup;
    return view
  };

  const matchOne = function (regs, group) {
    const one = this.methods.one;
    // support at view as a param
    if (isView(regs)) {
      return this.intersection(regs).eq(0)
    }
    if (typeof regs === 'string') {
      regs = one.parseMatch(regs);
    }
    let todo = { regs, group, justOne: true };
    let res = one.match(this.docs, todo, this._cache);
    let { ptrs, byGroup } = fixPointers(res, this.fullPointer);
    let view = this.toView(ptrs);
    view._groups = byGroup;
    return view
  };

  const has = function (regs, group) {
    const one = this.methods.one;
    let ptrs;
    if (typeof regs === 'string') {
      regs = one.parseMatch(regs);
      let todo = { regs, group, justOne: true };
      ptrs = one.match(this.docs, todo, this._cache).ptrs;
    } else if (isView(regs)) {
      ptrs = regs.fullPointer; // support a view object as input
    }
    return ptrs.length > 0
  };

  // 'if'
  const ifFn = function (regs, group) {
    const one = this.methods.one;
    if (typeof regs === 'string') {
      regs = one.parseMatch(regs);
      let todo = { regs, group, justOne: true };
      let ptrs = this.fullPointer;
      ptrs = ptrs.filter(ptr => {
        let m = this.update([ptr]);
        let res = one.match(m.docs, todo, this._cache).ptrs;
        return res.length > 0
      });
      return this.update(ptrs)
    }
    if (isView(regs)) {
      return this.filter(m => m.intersection(regs).found)
    }
    return this.none()
  };

  const ifNo = function (regs, group) {
    const { methods } = this;
    const one = methods.one;
    // support a view object as input
    if (isView(regs)) {
      return this.difference(regs)
    }
    // otherwise parse the match string
    if (typeof regs === 'string') {
      regs = one.parseMatch(regs);
    }
    return this.filter(m => {
      let todo = { regs, group, justOne: true };
      let ptrs = one.match(m.docs, todo, m._cache).ptrs;
      return ptrs.length === 0
    })

  };

  var match$3 = { matchOne, match: match$2, has, if: ifFn, ifNo };

  // import { indexN } from '../../pointers/methods/lib/index.js'


  const before = function (regs, group) {
    const { indexN } = this.methods.one;
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
    return preWords.match(regs, group)
  };

  const after = function (regs, group) {
    const { indexN } = this.methods.one;
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
    return postWords.match(regs, group)
  };

  const growLeft = function (regs, group) {
    regs = this.world.methods.one.parseMatch(regs);
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

  const growRight = function (regs, group) {
    regs = this.world.methods.one.parseMatch(regs);
    regs[0].start = true;// ensure matches are beside us →
    let ptrs = this.fullPointer;
    this.forEach((m, n) => {
      let more = m.after(regs, group);
      if (more.found) {
        let terms = more.terms();
        ptrs[n][2] += terms.length;
      }
    });
    return this.update(ptrs)
  };

  const grow = function (regs, group) {
    return this.growRight(regs, group).growLeft(regs, group)
  };

  var lookaround = { before, after, growLeft, growRight, grow };

  const combine = function (left, right) {
    return [left[0], left[1], right[2]]
  };

  const getDoc$3 = (reg, view, group) => {
    let m = reg;
    if (typeof reg === 'string') {
      m = view.match(reg, group);
    }
    // are we splitting within a contraction?
    // if (m.has('@hasContraction')) {
    //   let more = m.grow('@hasContraction')
    //   more.contractions().expand()
    // }
    return m
  };

  const addIds$1 = function (ptr, view) {
    let [n, start] = ptr;
    if (view.document[n] && view.document[n][start]) {
      ptr[3] = ptr[3] || view.document[n][start].id;
    }
    return ptr
  };

  const methods$e = {};
  // [before], [match], [after]
  methods$e.splitOn = function (m, group) {
    const { splitAll } = this.methods.one;
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
  methods$e.splitBefore = function (m, group) {
    const { splitAll } = this.methods.one;
    let splits = getDoc$3(m, this, group).fullPointer;
    let all = splitAll(this.fullPointer, splits);
    let res = [];
    all.forEach(o => {
      res.push(o.passthrough);
      res.push(o.before);
      if (o.match && o.after) {
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
  methods$e.splitAfter = function (m, group) {
    const { splitAll } = this.methods.one;
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
  methods$e.split = methods$e.splitAfter;

  var split$1 = methods$e;

  const methods$d = Object.assign({}, match$3, lookaround, split$1);
  // aliases
  methods$d.lookBehind = methods$d.before;
  methods$d.lookBefore = methods$d.before;

  methods$d.lookAhead = methods$d.after;
  methods$d.lookAfter = methods$d.after;

  methods$d.notIf = methods$d.ifNo;
  const matchAPI = function (View) {
    Object.assign(View.prototype, methods$d);
  };
  var api$7 = matchAPI;

  // match  'foo /yes/' and not 'foo/no/bar'
  const bySlashes = /(?:^|\s)([![^]*(?:<[^<]*>)?\/.*?[^\\/]\/[?\]+*$~]*)(?:\s|$)/;
  // match '(yes) but not foo(no)bar'
  const byParentheses = /([![^]*(?:<[^<]*>)?\([^)]+[^\\)]\)[?\]+*$~]*)(?:\s|$)/;
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

  const hasMinMax = /\{([0-9]+)(, *[0-9]*)?\}/;
  const andSign = /&&/;
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
  const titleCase$1 = str => {
    return str.charAt(0).toUpperCase() + str.substr(1)
  };
  const end = function (str) {
    return str[str.length - 1]
  };
  const start = function (str) {
    return str[0]
  };
  const stripStart = function (str) {
    return str.substr(1)
  };
  const stripEnd = function (str) {
    return str.substr(0, str.length - 1)
  };
  const stripBoth = function (str) {
    str = stripStart(str);
    str = stripEnd(str);
    return str
  };
  //
  const parseToken = function (w) {
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
          return str.split(/ /g).map(parseToken)
        });
        w = '';
      }
      //regex
      if (start(w) === '/' && end(w) === '/') {
        w = stripBoth(w);
        obj.regex = new RegExp(w); //potential vuln - security/detect-non-literal-regexp
        return obj
      }
      //soft-match
      if (start(w) === '~' && end(w) === '~') {
        w = stripBoth(w);
        obj.soft = true;
        obj.word = w;
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
    // support #Tag{1,9}
    if (hasMinMax.test(w) === true) {
      w = w.replace(hasMinMax, (_a, b, c) => {
        if (c === undefined) {
          // '{3}'	Exactly three times
          obj.min = Number(b);
          obj.max = Number(b);
        } else {
          c = c.replace(/, */, '');
          // '{2,4}' Two to four times
          // '{3,}' Three or more times
          obj.min = Number(b);
          obj.max = Number(c || 999);
        }
        // use same method as '+'
        obj.greedy = true;
        // 0 as min means the same as '?'
        obj.optional = true;
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
      obj.word = w.toLowerCase();
    }
    return obj
  };
  var parseToken$1 = parseToken;

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
        // are they all straight-up words? then optimize them.
        let shouldPack = token.choices.every(block => {
          if (block.length !== 1) {
            return false
          }
          let reg = block[0];
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

  const postProcess = function (regs, opts = {}) {
    // ensure all capture groups names are filled between start and end
    regs = nameGroups(regs);
    // convert 'choices' format to 'fastOr' format
    if (!opts.fuzzy) {
      regs = doFastOrMode(regs);
    }
    return regs
  };
  var postProcess$1 = postProcess;

  // add fuzziness etc to each reg
  const addOptions = function (tokens, opts) {
    // add default fuzzy-search limit
    if (opts.fuzzy === true) {
      opts.fuzzy = 0.85;
    }
    if (typeof opts.fuzzy === 'number') {
      tokens = tokens.map(reg => {
        // add a fuzzy-match on 'word' tokens
        if (opts.fuzzy > 0 && reg.word) {
          reg.fuzzy = opts.fuzzy;
        }
        //add it to or|and choices too
        if (reg.choices) {
          reg.choices.forEach(block => {
            block.forEach(r => {
              r.fuzzy = opts.fuzzy;
            });
          });
        }
        return reg
      });
    }
    return tokens
  };
  /** parse a match-syntax string into json */
  const syntax = function (input, opts = {}) {
    // fail-fast
    if (input === null || input === undefined || input === '') {
      return []
    }
    if (typeof input === 'number') {
      input = String(input); //go for it?
    }
    let tokens = parseBlocks$1(input);
    //turn them into objects
    tokens = tokens.map(str => parseToken$1(str, opts));
    //clean up anything weird
    tokens = postProcess$1(tokens, opts);
    // add fuzzy limits, etc
    tokens = addOptions(tokens, opts);
    // console.log(tokens)
    return tokens
  };
  var parseMatch$1 = syntax;

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
      if (reg.optional === true || reg.negation === true) {
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
  const hasDash = / [-–—] /;

  /** search the term's 'post' punctuation  */
  const hasPost = (term, punct) => term.post.indexOf(punct) !== -1;
  /** search the term's 'pre' punctuation  */
  const hasPre = (term, punct) => term.pre.indexOf(punct) !== -1;

  const methods$c = {
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
    hasDash: term => hasDash.test(term.post) || hasDash.test(term.pre),
    /** is it multiple words combinded */
    hasContraction: term => Boolean(term.implicit),
    /** is it an acronym */
    isAcronym: term => term.tags.has('Acronym'),
    isKnown: term => term.tags.size > 0,
    isTitleCase: term => /^[A-Z][a-z'\u00C0-\u00FF]/.test(term.text), //|| /^[A-Z]$/.test(term.text)
  };
  // aliases
  methods$c.hasQuotation = methods$c.hasQuote;

  var termMethods = methods$c;

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
      //match contractions, machine-form
      if (term.machine !== null && term.machine === reg.word) {
        return true
      }
      // term aliases for slashes and things
      if (term.alias !== undefined && term.alias.hasOwnProperty(reg.word)) {
        return true
      }
      // support ~ match
      if (reg.soft === true && reg.word === term.root) {
        return true
      }
      // support fuzzy match param
      if (reg.fuzzy !== undefined) {
        let score = fuzzy(reg.word, term.normal);
        if (score > reg.fuzzy) {
          return true
        }
        // support fuzzy + soft match
        if (reg.soft === true) {
          score = fuzzy(reg.word, term.root);
          if (score > reg.fuzzy) {
            return true
          }
        }
      }
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
      return reg.regex.test(term.normal)
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
      return term.normal === reg.machine || term.machine === reg.machine
    }
    //support {word/sense}
    if (reg.sense !== undefined) {
      return term.sense === reg.sense
    }
    // support optimized (one|two)
    if (reg.fastOr !== undefined) {
      if (term.implicit && reg.fastOr.has(term.implicit) === true) {
        return true
      }
      return reg.fastOr.has(term.normal) || reg.fastOr.has(term.text)
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

  const env = typeof process === 'undefined' ? self.env || {} : process.env;
  const log$2 = msg => {
    if (env.DEBUG_MATCH) {
      console.log(`\n  \x1b[32m ${msg} \x1b[0m`); // eslint-disable-line
    }
  };

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
        log$2(`greedyTo ${state.terms[t].normal}`);
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
          log$2(`endGreedy ${state.terms[state.t].normal}`);
          return true
        }
      }
    }
    return false
  };

  const isArray$3 = function (arr) {
    return Object.prototype.toString.call(arr) === '[object Array]'
  };

  const doOrBlock = function (state, skipN = 0) {
    let block = state.regs[state.r];
    let wasFound = false;
    // do each multiword sequence
    for (let c = 0; c < block.choices.length; c += 1) {
      // try to match this list of tokens
      let regs = block.choices[c];
      if (!isArray$3(regs)) {
        // console.log('=-=-=-= bad -=-=-=-')
        // console.dir(state.regs, { depth: 5 })
        return false
      }// } else {
      //   // console.log('=-=-=-= good -=-=-=-')
      //   // console.dir(state.regs[0], { depth: 5 })
      // }
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
      return doOrBlock(state, skipN) // try it again!
    }
    return skipN
  };

  const doAndBlock = function (state) {
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
      log$2(`doAndBlock ${state.terms[state.t].normal}`);
      return longest
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

  // const log = msg => {
  //   const env = typeof process === 'undefined' ? self.env || {} : process.env
  //   if (env.DEBUG_MATCH === true) {
  //     console.log(`\n  \x1b[32m ${msg} \x1b[0m`) // eslint-disable-line
  //   }
  // }

  // i formally apologize for how complicated this is.
  /** tries to match a sequence of terms, starting from here */
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
    // log('-> [' + terms.map(t => t.implicit || t.normal).join(', ') + ']')

    // we must satisfy each rule in 'regs'
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
        const haveNeeds = regs.slice(state.r).some(remain => !remain.optional);
        if (haveNeeds === false) {
          break //done!
        }
        // log(`✗ |terms done|`)
        return null // die
      }
      //support 'unspecific greedy' .* properly
      if (reg.anything === true && reg.greedy === true) {
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
          continue
        }
        // set the group result
        if (state.hasGroup === true) {
          const g = getGroup$2(state, state.t);
          g.length = skipto - state.t;
        }
        state.t = skipto;
        // log(`✓ |greedy|`)
        continue
      }
      // support multi-word OR (a|b|foo bar)
      if (reg.choices !== undefined && reg.operator === 'or') {
        let skipNum = doOrBlock(state);
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
          // log(`✓ |found-or|`)
          continue
        } else if (!reg.optional) {
          return null //die
        }
      }
      // support AND (#Noun && foo) blocks
      if (reg.choices !== undefined && reg.operator === 'and') {
        let skipNum = doAndBlock(state);
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
          continue
        } else if (!reg.optional) {
          return null //die
        }
      }
      // ok, finally test the term/reg
      let term = state.terms[state.t];
      let hasMatch = matchTerm(term, reg, state.start_i + state.t, state.phrase_length);
      if (reg.anything === true || hasMatch === true || isEndGreedy(reg, state)) {
        let startAt = state.t;
        // if it's a negative optional match... :0
        if (reg.optional && regs[state.r + 1] && reg.negative) {
          continue
        }
        // okay, it was a match, but if it's optional too,
        // we should check the next reg too, to skip it?
        if (reg.optional && regs[state.r + 1]) {
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
        }
        // log(`✓ |matched '${state.terms[state.t].normal}'|`)
        //advance to the next term!
        state.t += 1;
        //check any ending '$' flags
        if (reg.end === true) {
          //if this isn't the last term, refuse the match
          if (state.t !== state.terms.length && reg.greedy !== true) {
            // log(`✗ |end-flag|`)
            return null //die
          }
        }
        //try keep it going!
        if (reg.greedy === true) {
          state.t = getGreedy(state, regs[state.r + 1]);
          if (state.t === null) {
            // log(`✗ |too-short|`)
            return null //greedy was too short
          }
          if (reg.min && reg.min > state.t) {
            // log(`✗ |too-short2|`)
            return null //greedy was too short
          }
          // if this was also an end-anchor match, check to see we really
          // reached the end
          if (reg.end === true && state.start_i + state.t !== phrase_length) {
            // log(`✗ |not-end|`)
            return null //greedy didn't reach the end
          }
        }
        if (state.hasGroup === true) {
          // Get or create capture group
          const g = getGroup$2(state, startAt);
          // Update group - add greedy or increment length
          if (state.t > 1 && reg.greedy) {
            g.length += state.t - startAt;
          } else {
            g.length++;
          }
        }
        // should we clump-in the 2nd word of a contraction?
        // let lastTerm = state.terms[state.t - 1]
        // let thisTerm = state.terms[state.t]
        // if (lastTerm && thisTerm && lastTerm.implicit && thisTerm.implicit) {
        //   // only if it wouldn't match, organically
        //   let nextReg = regs[state.r + 1]
        //   if (!nextReg || !matchTerm(thisTerm, nextReg, state.start_i + state.t, state.phrase_length)) {
        //     state.t += 1
        //   }
        // }
        continue
      }

      // ok, it doesn't match.
      // did it *actually match* a negative?
      if (reg.negative) {
        let tmpReg = Object.assign({}, reg);
        tmpReg.negative = false; // try removing it
        let foundNeg = matchTerm(state.terms[state.t], tmpReg, state.start_i + state.t, state.phrase_length);
        if (foundNeg === true) {
          // log(`✗ |no neg|`)
          return null //bye!
        }
      }
      //bah, who cares, keep going
      if (reg.optional === true) {
        // log(`- |optional reg '${reg.word}'|`)
        continue
      }

      if (Boolean(state.terms[state.t].implicit) && regs[state.r - 1] && state.terms[state.t + 1]) {
        // if the last match was implicit too, we're missing a word.
        if (state.terms[state.t - 1] && state.terms[state.t - 1].implicit === regs[state.r - 1].word) {
          return null
        }
        // does the next one match?
        if (matchTerm(state.terms[state.t + 1], reg, state.start_i + state.t, state.phrase_length)) {
          // log(`✓ |contraction| '${state.terms[state.t + 1].implicit}'`)
          state.t += 2;
          continue
        }
      }
      return null //die
    }
    //return our results, as pointers
    let pntr = [null, start_i, state.t + start_i]; //`${start_i}:${state.t + start_i}`
    if (pntr[1] === pntr[2]) {
      // log(`✗ |found nothing|`)
      return null
    }
    let groups = {};
    Object.keys(state.groups).forEach(k => {
      let o = state.groups[k];
      let start = start_i + o.start;
      groups[k] = [null, start, start + o.length]; //`${start}:${start + o.length}`
    });
    return { pointer: pntr, groups: groups }
  };
  var fromHere = tryHere;

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
  const runMatch = function (docs, todo, cache) {
    cache = cache || [];
    let { regs, group, justOne } = todo;
    let results = [];
    if (!regs || regs.length === 0) {
      return { ptrs: [], byGroup: {} }
    }

    const minLength = regs.filter(r => r.optional !== true && r.negative !== true).length;
    docs: for (let n = 0; n < docs.length; n += 1) {
      let terms = docs[n];
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
      let [n, start] = ptr;
      ptr.push(docs[n][start].id);
    });
    return results
  };

  var match$1 = runMatch;

  const methods$a = {
    one: {
      termMethods,
      parseMatch: parseMatch$1,
      match: match$1,
    },
  };

  var methods$b = methods$a;

  /** pre-parse any match statements */
  const parseMatch = function (str) {
    const world = this.world();
    return world.methods.one.parseMatch(str)
  };
  var lib$3 = {
    parseMatch
  };

  var match = {
    api: api$7,
    methods: methods$b,
    lib: lib$3,
  };

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
        if (typeof module !== undefined) {
          text = cli$1.yellow(text);
        }
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

  /** some named output formats */
  const out = function (method) {
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
      let terms = this.compute('freq').terms().unique().termList();
      return terms.sort((a, b) => (a.freq > b.freq ? -1 : 0))
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
      return this.debug()
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

  const trimEnd = /[,:;)\]*.?~!\u0022\uFF02\u201D\u2019\u00BB\u203A\u2032\u2033\u2034\u301E\u00B4—-]+$/;
  const trimStart =
    /^[(['"*~\uFF02\u201C\u2018\u201F\u201B\u201E\u2E42\u201A\u00AB\u2039\u2035\u2036\u2037\u301D\u0060\u301F]+/;

  const punctToKill = /[,:;)('"\u201D]/;
  const isHyphen = /^[-–—]$/;
  const hasSpace = / /;

  const textFromTerms = function (terms, opts, keepSpace = true) {
    let txt = '';
    terms.forEach(t => {
      let pre = t.pre || '';
      let post = t.post || '';
      if (opts.punctuation === 'some') {
        pre = pre.replace(trimStart, '');
        // replace a hyphen with a space
        if (isHyphen.test(post)) {
          post = ' ';
        }
        post = post.replace(punctToKill, '');
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
    for (let i = 0; i < docs.length; i += 1) {
      // middle
      text += textFromTerms(docs[i], opts, true);
    }
    if (!opts.keepSpace) {
      text = text.trim();
    }
    if (opts.keepPunct === false) {
      text = text.replace(trimStart, '');
      text = text.replace(trimEnd, '');
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

  const isObject$2 = val => {
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
        // silently trigger a root?
        // if (fmt === 'root' && this.document[0][0] && !this.document[0][0].root) {
        //   this.compute('root')
        // }
      } else if (fmt && isObject$2(fmt)) {
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

  const toJSON = function (view, opts) {
    opts = opts || {};
    if (typeof opts === 'string') {
      opts = {};
    }
    opts = Object.assign({}, defaults$1, opts);
    // run any necessary upfront steps
    if (opts.offset) {
      view.compute('offset');
    }
    return view.docs.map((terms, i) => {
      let res = {};
      Object.keys(opts).forEach(k => {
        if (opts[k] && fns$1[k]) {
          res[k] = fns$1[k](terms, view, i);
        }
      });
      return res
    })
  };


  var json = {
    /** return data */
    json: function (n) {
      let res = toJSON(this, n);
      if (typeof n === 'number') {
        return res[n]
      }
      return res
    },
  };

  const trailSpace = /\s+$/;

  const toText = function (term) {
    let pre = term.pre || '';
    let post = term.post || '';
    return pre + term.text + post
  };

  const html = function (obj) {
    // index ids to highlight
    let starts = {};
    Object.keys(obj).forEach(k => {
      let ptrs = obj[k].fullPointer;
      ptrs.forEach(a => {
        starts[a[3]] = { tag: k, end: a[2] };
      });
    });
    // create the text output
    let out = '';
    this.docs.forEach(terms => {
      for (let i = 0; i < terms.length; i += 1) {
        let t = terms[i];
        // do a span tag
        if (starts.hasOwnProperty(t.id)) {
          let { tag, end } = starts[t.id];
          out += `<span class="${tag}">`;
          for (let k = i; k < end; k += 1) {
            out += toText(terms[k]);
          }
          // move trailing whitespace after tag
          let after = '';
          out = out.replace(trailSpace, (a, b) => {
            after = a;
            return ''
          });
          out += `</span>${after}`;
          i = end - 1;
        } else {
          out += toText(t);
        }
      }
    });
    return out
  };
  var html$1 = { html };

  const methods$8 = Object.assign({}, out$1, text, json, html$1);
  // aliases
  methods$8.data = methods$8.json;

  const addAPI$2 = function (View) {
    Object.assign(View.prototype, methods$8);
  };
  var api$6 = addAPI$2;

  var output = {
    api: api$6,
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

  const max$1 = 4;

  // sweep-around looking for our term uuid
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

  /** return a subset of the document, from a pointer */
  const getDoc$1 = function (ptrs, document) {
    let doc = [];
    ptrs.forEach((ptr, i) => {
      if (!ptr) {
        return
      }
      let [n, start, end, id] = ptr; //parsePointer(ptr)
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
          ptrs[i] = [wild[0], wild[1], wild[1] + len, terms[0].id];
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
      // otherwise, looks good!
      doc.push(terms);
    });
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
      getUnion: getUnion$1,
      getIntersection: getIntersection$1,
      getDifference,
      indexN,
      doesOverlap,
      splitAll: splitAll$1,
    },
  };

  const getDoc = (m, view) => {
    return typeof m === 'string' ? view.match(m) : m
  };

  // 'harden' our json pointers, again
  const addIds = function (ptrs, docs) {
    return ptrs.map(ptr => {
      let [n, start] = ptr;
      if (docs[n][start]) {
        ptr.push(docs[n][start].id);
      }
      return ptr
    })
  };

  const methods$6 = {};

  // all parts, minus duplicates
  methods$6.union = function (m) {
    const { getUnion } = this.methods.one;
    m = getDoc(m, this);
    let ptrs = getUnion(this.fullPointer, m.fullPointer);
    ptrs = addIds(ptrs, this.document);
    return this.toView(ptrs)
  };
  methods$6.and = methods$6.union;

  // only parts they both have
  methods$6.intersection = function (m) {
    const { getIntersection } = this.methods.one;
    m = getDoc(m, this);
    let ptrs = getIntersection(this.fullPointer, m.fullPointer);
    ptrs = addIds(ptrs, this.document);
    return this.toView(ptrs)
  };

  // only parts of a that b does not have
  methods$6.difference = function (m) {
    const { getDifference } = this.methods.one;
    m = getDoc(m, this);
    let ptrs = getDifference(this.fullPointer, m.fullPointer);
    ptrs = addIds(ptrs, this.document);
    return this.toView(ptrs)
  };
  methods$6.not = methods$6.difference;

  // get opposite of a
  methods$6.complement = function () {
    const { getDifference } = this.methods.one;
    let doc = this.all();
    let ptrs = getDifference(doc.fullPointer, this.fullPointer);
    ptrs = addIds(ptrs, this.document);
    return this.toView(ptrs)
  };

  // remove overlaps
  methods$6.settle = function () {
    const { getUnion } = this.methods.one;
    let ptrs = this.fullPointer;
    ptrs.forEach(ptr => {
      ptrs = getUnion(ptrs, [ptr]);
    });
    ptrs = addIds(ptrs, this.document);
    return this.update(ptrs)
  };


  const addAPI$1 = function (View) {
    // add set/intersection/union
    Object.assign(View.prototype, methods$6);
  };
  var api$5 = addAPI$1;

  var pointers = {
    methods: methods$7,
    api: api$5,
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
  const log$1 = (term, tag, reason = '') => {
    const yellow = str => '\x1b[33m\x1b[3m' + str + '\x1b[0m';
    const i = str => '\x1b[3m' + str + '\x1b[0m';
    let word = term.text || '[' + term.implicit + ']';
    if (typeof tag !== 'string' && tag.length > 2) {
      tag = tag.slice(0, 2).join(', #') + ' +'; //truncate the list of tags
    }
    tag = typeof tag !== 'string' ? tag.join(', #') : tag;
    console.log(` ${yellow(word).padEnd(24)} \x1b[32m→\x1b[0m #${tag.padEnd(25)}  ${i(reason)}`); // eslint-disable-line
  };

  // add a tag to all these terms
  const setTag = function (terms, tag, world = {}, isSafe, reason) {
    const tagSet = world.model.one.tagSet || {};
    if (!tag) {
      return
    }
    // some logging for debugging
    let env = typeof process === 'undefined' ? self.env || {} : process.env;
    if (env && env.DEBUG_TAGS) {
      log$1(terms[0], tag, reason);
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

  const e=function(e){return e.children=e.children||[],e._cache=e._cache||{},e.props=e.props||{},e._cache.parents=e._cache.parents||[],e._cache.children=e._cache.children||[],e},t=/^ *(#|\/\/)/,n=function(t){let n=t.trim().split(/->/),r=[];n.forEach((t=>{r=r.concat(function(t){if(!(t=t.trim()))return null;if(/^\[/.test(t)&&/\]$/.test(t)){let n=(t=(t=t.replace(/^\[/,"")).replace(/\]$/,"")).split(/,/);return n=n.map((e=>e.trim())).filter((e=>e)),n=n.map((t=>e({id:t}))),n}return [e({id:t})]}(t));})),r=r.filter((e=>e));let i=r[0];for(let e=1;e<r.length;e+=1)i.children.push(r[e]),i=r[e];return r[0]},r=(e,t)=>{let n=[],r=[e];for(;r.length>0;){let e=r.pop();n.push(e),e.children&&e.children.forEach((n=>{t&&t(e,n),r.push(n);}));}return n},i=e=>"[object Array]"===Object.prototype.toString.call(e),c=e=>(e=e||"").trim(),s=function(c=[]){return "string"==typeof c?function(r){let i=r.split(/\r?\n/),c=[];i.forEach((e=>{if(!e.trim()||t.test(e))return;let r=(e=>{const t=/^( {2}|\t)/;let n=0;for(;t.test(e);)e=e.replace(t,""),n+=1;return n})(e);c.push({indent:r,node:n(e)});}));let s=function(e){let t={children:[]};return e.forEach(((n,r)=>{0===n.indent?t.children=t.children.concat(n.node):e[r-1]&&function(e,t){let n=e[t].indent;for(;t>=0;t-=1)if(e[t].indent<n)return e[t];return e[0]}(e,r).node.children.push(n.node);})),t}(c);return s=e(s),s}(c):i(c)?function(t){let n={};t.forEach((e=>{n[e.id]=e;}));let r=e({});return t.forEach((t=>{if((t=e(t)).parent)if(n.hasOwnProperty(t.parent)){let e=n[t.parent];delete t.parent,e.children.push(t);}else console.warn(`[Grad] - missing node '${t.parent}'`);else r.children.push(t);})),r}(c):(r(s=c).forEach(e),s);var s;},h=e=>"[31m"+e+"[0m",o=e=>"[2m"+e+"[0m",l=function(e,t){let n="-> ";t&&(n=o("→ "));let i="";return r(e).forEach(((e,r)=>{let c=e.id||"";if(t&&(c=h(c)),0===r&&!e.id)return;let s=e._cache.parents.length;i+="    ".repeat(s)+n+c+"\n";})),i},a=function(e){let t=r(e);t.forEach((e=>{delete(e=Object.assign({},e)).children;}));let n=t[0];return n&&!n.id&&0===Object.keys(n.props).length&&t.shift(),t},p={text:l,txt:l,array:a,flat:a},d=function(e,t){return "nested"===t||"json"===t?e:"debug"===t?(console.log(l(e,!0)),null):p.hasOwnProperty(t)?p[t](e):e},u=e=>{r(e,((e,t)=>{e.id&&(e._cache.parents=e._cache.parents||[],t._cache.parents=e._cache.parents.concat([e.id]));}));},f=(e,t)=>(Object.keys(t).forEach((n=>{if(t[n]instanceof Set){let r=e[n]||new Set;e[n]=new Set([...r,...t[n]]);}else {if((e=>e&&"object"==typeof e&&!Array.isArray(e))(t[n])){let r=e[n]||{};e[n]=Object.assign({},t[n],r);}else i(t[n])?e[n]=t[n].concat(e[n]||[]):void 0===e[n]&&(e[n]=t[n]);}})),e),j=/\//;class g{constructor(e={}){Object.defineProperty(this,"json",{enumerable:!1,value:e,writable:!0});}get children(){return this.json.children}get id(){return this.json.id}get found(){return this.json.id||this.json.children.length>0}props(e={}){let t=this.json.props||{};return "string"==typeof e&&(t[e]=!0),this.json.props=Object.assign(t,e),this}get(t){if(t=c(t),!j.test(t)){let e=this.json.children.find((e=>e.id===t));return new g(e)}let n=((e,t)=>{let n=(e=>"string"!=typeof e?e:(e=e.replace(/^\//,"")).split(/\//))(t=t||"");for(let t=0;t<n.length;t+=1){let r=e.children.find((e=>e.id===n[t]));if(!r)return null;e=r;}return e})(this.json,t)||e({});return new g(n)}add(t,n={}){if(i(t))return t.forEach((e=>this.add(c(e),n))),this;t=c(t);let r=e({id:t,props:n});return this.json.children.push(r),new g(r)}remove(e){return e=c(e),this.json.children=this.json.children.filter((t=>t.id!==e)),this}nodes(){return r(this.json).map((e=>(delete(e=Object.assign({},e)).children,e)))}cache(){return (e=>{let t=r(e,((e,t)=>{e.id&&(e._cache.parents=e._cache.parents||[],e._cache.children=e._cache.children||[],t._cache.parents=e._cache.parents.concat([e.id]));})),n={};t.forEach((e=>{e.id&&(n[e.id]=e);})),t.forEach((e=>{e._cache.parents.forEach((t=>{n.hasOwnProperty(t)&&n[t]._cache.children.push(e.id);}));})),e._cache.children=Object.keys(n);})(this.json),this}list(){return r(this.json)}fillDown(){var e;return e=this.json,r(e,((e,t)=>{t.props=f(t.props,e.props);})),this}depth(){u(this.json);let e=r(this.json),t=e.length>1?1:0;return e.forEach((e=>{if(0===e._cache.parents.length)return;let n=e._cache.parents.length+1;n>t&&(t=n);})),t}out(e){return u(this.json),d(this.json,e)}debug(){return u(this.json),d(this.json,"debug"),this}}const _=function(e){let t=s(e);return new g(t)};_.prototype.plugin=function(e){e(this);};

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
      let { not, also, is } = node.props;
      let parents = node._cache.parents;
      if (also) {
        parents = parents.concat(also);
      }
      res[node.id] = {
        is,
        not,
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
  const compute$6 = function (allTags) {
    // setup graph-lib format
    const flatList = Object.keys(allTags).map(k => {
      let o = allTags[k];
      const props = { not: new Set(o.not), also: o.also, is: o.is };
      return { id: k, parent: o.is, props, children: [] }
    });
    const graph = _(flatList).cache().fillDown();
    return graph.out('array')
  };

  const addTags$1 = function (tags, already) {
    tags = validate$1(tags, already);

    let allTags = Object.assign({}, already, tags);
    // do some basic setting-up
    // 'fill-down' parent logic
    const nodes = compute$6(allTags);
    // convert it to our final format
    const res = fmt$1(nodes);
    return res
  };
  var addTags$2 = addTags$1;

  var methods$5 = {
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
        input.forEach(tag => methods.one.setTag(terms, tag, world, isSafe));
      } else {
        methods.one.setTag(terms, input, world, isSafe);
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
    const addTags = methods.one.addTags;

    let res = addTags(tags, tagSet);
    model.one.tagSet = res;
    return this
  };

  var lib$2 = { addTags };

  var tag = {
    model: {
      one: { tagSet: {} }
    },
    methods: methods$5,
    api: api$4,
    lib: lib$2
  };

  const initSplit = /(\S.+?[.!?\u203D\u2E18\u203C\u2047-\u2049])(?=\s|$)/g;
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
  const hasLetter$1 = /[a-z0-9\u00C0-\u00FF\u00a9\u00ae\u2000-\u3300\ud000-\udfff]/i;

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
      if (chunks[i + 1] && isSentence$1(c, abbrevs, hasLetter) === false) {
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

  const isSlash = /[a-z] ?\/ ?[a-z]+$/;
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
  var tokenize$3 = normalizePunctuation;

  const parseTerm = txt => {
    // cleanup any punctuation as whitespace
    let { str, pre, post } = tokenize$3(txt);
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
    // coerce single curly quotes
    // str = str.replace(/[\u0027\u0060\u00B4\u2018\u2019\u201A\u201B\u2032\u2035\u2039\u203A]+/g, "'")
    // // coerce double curly quotes
    // str = str.replace(
    //   /[\u0022\u00AB\u00BB\u201C\u201D\u201E\u201F\u2033\u2034\u2036\u2037\u2E42\u301D\u301E\u301F\uFF02]+/g,
    //   '"'
    // )
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

  const killUnicode = function (str, world) {
    const unicode = world.model.one.unicode || {};
    let chars = str.split('');
    chars.forEach((s, i) => {
      if (unicode[s]) {
        chars[i] = unicode[s];
      }
    });
    return chars.join('')
  };
  var doUnicode = killUnicode;

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
    let str = term.text || '';
    str = cleanup(str);
    //(very) rough ASCII transliteration -  bjŏrk -> bjork
    str = doUnicode(str, world);
    str = doAcronyms(str);
    term.normal = str;
  };
  var normal = normalize;

  // turn a string input into a 'document' json format
  const tokenize$2 = function (input, world) {
    const { methods, model } = world;
    const { splitSentences, splitTerms, splitWhitespace } = methods.one;
    input = input || '';
    if (typeof input === 'number') {
      input = String(input);
    }
    if (typeof input === 'string') {
      // split into sentences
      let sentences = splitSentences(input, model);
      // split into word objects
      input = sentences.map((txt, n) => {
        let terms = splitTerms(txt, model);
        // split into [pre-text-post]
        terms = terms.map(splitWhitespace);
        // add normalized term format, always
        terms.forEach((term, i) => {
          normal(term, world);
        });
        return terms
      });
    }
    return input
  };

  var methods$4 = {
    one: {
      splitSentences: sentence,
      splitTerms: term,
      splitWhitespace: whitespace,
      tokenize: tokenize$2,
    },
  };

  const aliases = {
    '&': 'and',
    '@': 'at',
    '%': 'percent',
  };
  var aliases$1 = aliases;

  var misc$1 = [
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
    [misc$1],
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
  let lexicon$4 = {};

  list.forEach(a => {
    a[0].forEach(w => {
      // sentence abbrevs
      abbreviations[w] = true;
      // future-lexicon
      lexicon$4[w] = 'Abbreviation';
      if (a[1] !== undefined) {
        lexicon$4[w] = [lexicon$4[w], a[1]];
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
    'counter',
    'de',
    'extra',
    'infra',
    'inter',
    'intra',
    'macro',
    'micro',
    'mid',
    'mis',
    'mono',
    'multi',
    'non',
    'over',
    'peri',
    'post',
    'pre',
    'pro',
    'proto',
    'pseudo',
    're',
    'semi',
    'sub',
    // 'super', //'super-cool'
    'supra',
    'trans',
    'tri',
    // 'ultra', //'ulta-cool'
    'un',
    'out',
    // 'under',
    // 'whole',
  ].reduce((h, str) => {
    h[str] = true;
    return h
  }, {});

  // dashed suffixes that are not independent words
  //  'flower-like', 'president-elect'
  var suffixes = {
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

  var model$5 = {
    one: {
      aliases: aliases$1,
      abbreviations,
      prefixes,
      suffixes,
      lexicon: lexicon$4, //give this one forward
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

  // 'machine' is a normalized form that looses human-readability
  const doMachine = function (term) {
    let str = term.implicit || term.normal || term.text;
    // remove apostrophes
    str = str.replace(/['’]s$/, '');
    str = str.replace(/s['’]$/, 's');
    //lookin'->looking (make it easier for conjugation)
    str = str.replace(/([aeiou][ktrp])in'$/, '$1ing');
    //turn re-enactment to reenactment
    if (/^(re|un)-?[^aeiou]./.test(str) === true) {
      str = str.replace('-', '');
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

  const methods$3 = {
    alias: (view) => termLoop(view, alias),
    machine: (view) => termLoop(view, machine),
    normal: (view) => termLoop(view, normal),
    freq: freq$1,
    offset: offset$1,
    index: index$1,
    wordCount: wordCount$1,
  };
  var compute$5 = methods$3;

  var tokenize$1 = {
    compute: compute$5,
    methods: methods$4,
    model: model$5,
    hooks: ['alias', 'machine', 'index', 'id'],
  };

  // const plugin = function (world) {
  //   let { methods, model, parsers } = world
  //   Object.assign({}, methods, _methods)
  //   Object.assign(model, _model)
  //   methods.one.tokenize = tokenize
  //   parsers.push('normal')
  //   parsers.push('alias')
  //   parsers.push('machine')
  //   // extend View class
  //   // addMethods(View)
  // }
  // export default plugin

  // edited by Spencer Kelly
  // credit to https://github.com/BrunoRB/ahocorasick by Bruno Roberto Búrigo.

  const tokenize = function (phrase, world) {
    const { methods, model } = world;
    let terms = methods.one.splitTerms(phrase, model).map(methods.one.splitWhitespace);
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
      let words = tokenize(phrase, world);
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
    return { goNext, endAs, failTo, }
  };
  var build = buildTrie;

  // console.log(buildTrie(['smart and cool', 'smart and nice']))

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
          let [n, start] = term.index;
          results.push([n, start, start + len, term.id]);
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
      console.error('Compromise invalid lookup trie');
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

  const isObject$1 = val => {
    return Object.prototype.toString.call(val) === '[object Object]'
  };

  const api$3 = function (View) {
    /** turn an array or object into a compressed trie*/
    View.prototype.compile = function (obj) {
      const trie = build(obj, this.world);
      return compress$1(trie)
    };

    /** find all matches in this document */
    View.prototype.lookup = function (input, opts = {}) {
      if (!input) {
        return this.none()
      }
      if (typeof input === 'string') {
        input = [input];
      }
      let trie = isObject$1(input) ? input : build(input, this.world);
      let res = scan$1(this, trie, opts);
      res = res.settle();
      return res
    };
  };

  var lookup = {
    api: api$3,
  };

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

  const cacheMatch = function (regs) {
    // parse match strings
    let need = new Set();
    regs.forEach(reg => {
      // negatives can't be cached
      if (reg.optional === true || reg.negative === true) {
        return
      }
      if (reg.tag) {
        need.add('#' + reg.tag);
      }
      if (reg.word) {
        need.add(reg.word);
      }
    });
    return need
  };
  var cacheMatch$1 = cacheMatch;

  var methods$2 = {
    one: {
      cacheDoc,
      cacheMatch: cacheMatch$1,
    },
  };

  const methods$1 = {
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
  const addAPI = function (View) {
    Object.assign(View.prototype, methods$1);
  };
  var api$2 = addAPI;

  const cache$2 = function (view) {
    view._cache = view.methods.one.cacheDoc(view.document);
  };

  var compute$4 = {
    cache: cache$2
  };

  var cache$1 = {
    api: api$2,
    compute: compute$4,
    methods: methods$2,
    // hooks: ['cache']
  };

  // lookup last word in the type-ahead prefixes
  const compute$2 = function (view) {
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
      lastTerm.machine = found;
      lastTerm.typeahead = true;
      // tag it, as our assumed term
      if (view.compute.preTagger) {
        view.last().unTag('*').compute(['lexicon', 'preTagger']);
      }
    }
  };

  var compute$3 = { typeahead: compute$2 };

  // assume any discovered prefixes
  const autoFill = function () {
    const docs = this.docs;
    if (docs.length === 0) {
      return
    }
    let lastPhrase = docs[docs.length - 1] || [];
    let term = lastPhrase[lastPhrase.length - 1];
    if (term.typeahead === true && term.machine) {
      term.text = term.machine;
      term.normal = term.machine;
    }
    return this
  };

  const api = function (View) {
    View.prototype.autoFill = autoFill;
  };
  var api$1 = api;

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
        let prefix = str.substr(0, size);
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

  var lib$1 = {
    typeahead: prepare,
    typeAhead: prepare,
  };

  const model$4 = {
    one: {
      typeahead: {}
    }
  };
  var typeahead = {
    model: model$4,
    api: api$1,
    lib: lib$1,
    compute: compute$3,
    hooks: ['typeahead']
  };

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

  const prefix$2 = /^(under|over|mis|re|un|dis|pre|post)-?/;
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
        setTag([t], tag, world, '1-lexicon-alias');
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
          setTag([t], lexicon[stem], world, '1-lexicon-prefix');
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

  var compute$1 = {
    lexicon: firstPass$1
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
    console.log(` ${yellow(word).padEnd(24)} \x1b[32m→\x1b[0m #${tag.padEnd(25)}  ${i(reason)}`); // eslint-disable-line
  };

  // a faster version than the user-facing one in ./methods
  const fastTag = function (term, tag, reason) {
    if (!tag || tag.length === 0) {
      return
    }
    // some logging for debugging
    let env = typeof process === 'undefined' ? self.env || {} : process.env;
    if (env && env.DEBUG_TAGS) {
      log(term, tag, reason);
    }
    term.tags = term.tags || new Set();
    if (typeof tag === 'string') {
      term.tags.add(tag);
    } else {
      tag.forEach(tg => term.tags.add(tg));
    }
  };

  var fastTag$1 = fastTag;

  // derive clever things from our lexicon key-value pairs
  const expand$1 = function (words, world) {
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

  var methods = {
    one: {
      expandLexicon,
      fastTag: fastTag$1
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

  var lib = {
    addWords: addWords$1
  };

  const model$3 = {
    one: {
      lexicon: {},
      _multiCache: {},
    }
  };

  var lexicon$3 = {
    model: model$3,
    methods,
    compute: compute$1,
    lib,
    hooks: ['lexicon']
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
    { word: 'dunno', out: ['do', 'not', 'know'] },
    { word: 'gonna', out: ['going', 'to'] },
    { word: 'gotta', out: ['have', 'got', 'to'] }, //hmm
    { word: 'gtg', out: ['got', 'to', 'go'] },
    { word: 'im', out: ['i', 'am'] },
    { word: 'imma', out: ['I', 'will'] },
    { word: 'imo', out: ['in', 'my', 'opinion'] },
    { word: 'irl', out: ['in', 'real', 'life'] },
    { word: 'ive', out: ['i', 'have'] },
    { word: 'rn', out: ['right', 'now'] },
    { word: 'tbh', out: ['to', 'be', 'honest'] },
    { word: 'wanna', out: ['want', 'to'] },
    // apostrophe d
    { word: 'howd', out: ['how', 'did'] },
    { word: 'whatd', out: ['what', 'did'] },
    { word: 'whend', out: ['when', 'did'] },
    { word: 'whered', out: ['where', 'did'] },

    { word: "'tis", out: ['it', 'is'] },
    { word: "'twas", out: ['it', 'was'] },
    { word: 'twas', out: ['it', 'was'] },
    { word: 'y\'know', out: ['you', 'know'] },
    { word: "ne'er", out: ['never'] },
    { word: "o'er ", out: ['over'] },
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
    // more-complex ones
    // { after: 's', out: apostropheS }, //spencer's
    // { after: 'd', out: apostropheD }, //i'd
    // { after: 't', out: apostropheT }, //isn't
    // { before: 'l', out: preL }, // l'amour
    // { before: 'd', out: preD }, // d'amerique
  ];

  var model$2 = { one: { contractions: contractions$4 } };

  // put n new words where 1 word was
  const insertContraction = function (document, point, words) {
    let [n, w] = point;
    if (!words || words.length === 0) {
      return
    }
    words = words.map((word) => {
      word.implicit = word.text;
      word.machine = word.text;
      word.pre = '';
      word.post = '';
      word.text = '';
      word.normal = '';
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

  const hasContraction$2 = /'/;
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
    let before = terms[i].normal.split(hasContraction$2)[0];

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

  const hasContraction$1 = /'/;

  const isHas = (terms, i) => {
    //look for a past-tense verb
    let after = terms.slice(i + 1, i + 3);
    return after.some(t => t.tags.has('PastTense'))
  };

  // 's -> [possessive, 'has', or 'is']
  const apostropheS = function (terms, i) {
    // possessive, is/has
    let before = terms[i].normal.split(hasContraction$1)[0];
    // spencer's got -> 'has'
    if (isHas(terms, i)) {
      return [before, 'has']
    }
    // let's
    if (before === 'let') {
      return [before, 'us']
    }
    // allow slang "there's" -> there are
    if (before === 'there') {
      let nextTerm = terms[i + 1];
      if (nextTerm && nextTerm.tags.has('Plural')) {
        return [before, 'are']
      }
    }
    return [before, 'is']
  };
  var apostropheS$1 = apostropheS;

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

  const isRange = /^([0-9.]{1,3}[a-z]{0,2}) ?[-–—] ?([0-9]{1,3}[a-z]{0,2})$/i;
  const timeRange = /^([0-9]{1,2}(:[0-9][0-9])?(am|pm)?) ?[-–—] ?([0-9]{1,2}(:[0-9][0-9])?(am|pm)?)$/i;

  const numberRange = function (terms, i) {
    let term = terms[i];
    if (term.tags.has('PhoneNumber') === true) {
      return null
    }
    let parts = term.text.match(isRange);
    if (parts !== null) {
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

  // always a contracttion
  const always = new Set([
    'here',
    'there',
    'she',
    'it',
    'he',
    'that',
    'here',
    'there',
    'your',
    'who',
    'what',
    'where',
    'why',
    'when',
    'how',
    'let',
    'else',

    'name', //name's dave
    // 'god', //god's gift
  ]);

  // // always a posessive
  // const never = new Set([
  //   'one',
  //   'men',
  //   'man',
  //   'woman',
  //   'women',
  //   'girl',
  //   'boy',
  //   'mankind',
  //   'world',
  //   'today',
  //   'tomorrow',
  // ])

  // // spencer's cool
  const afterYes = new Set([
    //   'cool',
    //   'nice',
    //   'beautiful',
    //   'ugly',
    //   'good',
    //   'bad',
    //   'ok',
    //   'right',
    //   'wrong',
    //   'big',
    //   'small',
    //   'large',
    //   'huge',
    //   'above',
    //   'below',
    //   'in',
    //   'out',
    //   'inside',
    //   'outside',
    //   'always',
    //   'even',
    //   'same',
    //   'still',
    //   'cold',
    //   'hot',
    //   'old',
    //   'young',
    //   'rich',
    //   'poor',
    //   'early',
    //   'late',
    // 'new',
    // 'old',
    // 'tiny',
    // 'huge',

    // adverbs
    'really',
    'very',
    'barely',
    'also',
    'not',
    'just',
    'more',
    'only',
    'often',
    'quite',
    'so',
    'too',
    'well',
  ]);

  const shouldSplit = (terms, i) => {
    let term = terms[i];

    const byApostrophe = /'s/;
    let [before] = term.normal.split(byApostrophe);
    if (always.has(before)) {
      return true
    }
    // if (never.has(before)) {
    //   return false
    // }

    // gandhi's so cool
    let nextTerm = terms[i + 1];
    if (nextTerm && afterYes.has(nextTerm.normal)) {
      return true
    }

    // if (nextTerm) {
    //   console.log(term.normal, nextTerm.normal)

    // } else {
    //   console.log(term.normal)
    // }
    // console.log(before)
    // these can't be possessive
    // if (hereThere.hasOwnProperty(term.machine)) {
    //   return false
    // }
    // // if we already know it
    // if (term.tags.has('Possessive')) {
    //   return true
    // }
    // //a pronoun can't be possessive - "he's house"
    // if (term.tags.has('Pronoun') || term.tags.has('QuestionWord')) {
    //   return false
    // }
    // if (banList.hasOwnProperty(term.normal)) {
    //   return false
    // }
    // //if end of sentence, it is possessive - "was spencer's"
    // let nextTerm = terms[i + 1]
    // if (!nextTerm) {
    //   return true
    // }
    // //a gerund suggests 'is walking'
    // if (nextTerm.tags.has('Verb')) {
    //   //fix 'jamie's bite'
    //   if (nextTerm.tags.has('Infinitive')) {
    //     return true
    //   }
    //   //fix 'spencer's runs'
    //   if (nextTerm.tags.has('PresentTense')) {
    //     return true
    //   }
    //   return false
    // }
    // //spencer's house
    // if (nextTerm.tags.has('Noun')) {
    //   // 'spencer's here'
    //   if (hereThere.hasOwnProperty(nextTerm.normal) === true) {
    //     return false
    //   }
    //   return true
    // }
    // //rocket's red glare
    // let twoTerm = terms[i + 2]
    // if (twoTerm && twoTerm.tags.has('Noun') && !twoTerm.tags.has('Pronoun')) {
    //   return true
    // }
    // //othwerwise, an adjective suggests 'is good'
    // if (nextTerm.tags.has('Adjective') || nextTerm.tags.has('Adverb') || nextTerm.tags.has('Verb')) {
    //   return false
    // }
    // default to posessive
    return false
  };
  var shouldSplit$1 = shouldSplit;

  const byApostrophe = /'/;
  const numDash = /^[0-9][^-–—]*[-–—].*?[0-9]/;

  // run tagger on our new implicit terms
  const reTag = function (terms, view) {
    let tmp = view.update();
    tmp.document = [terms];
    tmp.compute(['lexicon', 'preTagger', 'index']);
  };

  const byEnd = {
    // ain't
    t: (terms, i) => apostropheT$1(terms, i),
    // how'd
    d: (terms, i) => apostropheD(terms, i),
    // bob's
    s: (terms, i, world) => {
      // [bob's house] vs [bob's cool]
      if (shouldSplit$1(terms, i) === true) {
        return apostropheS$1(terms, i)
      }
    },
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
    return view.fromText(words.join(' ')).docs[0]
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
          reTag(document[n], view);
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
            reTag(document[n], view);
          }
        }
      }
    });
  };
  var contractions$3 = contractions$2;

  var compute = { contractions: contractions$3 };

  const plugin = {
    model: model$2,
    compute: compute,
    hooks: ['contractions'],
  };
  var contractions$1 = plugin;

  nlp$1.extend(change); //0kb
  nlp$1.extend(output); //0kb
  nlp$1.extend(match); //10kb
  nlp$1.extend(pointers); //2kb
  nlp$1.extend(tag); //2kb
  nlp$1.plugin(contractions$1); //~6kb
  nlp$1.extend(tokenize$1); //7kb
  nlp$1.plugin(cache$1); //~1kb
  nlp$1.extend(lookup); //7kb
  nlp$1.extend(typeahead); //1kb
  nlp$1.extend(lexicon$3); //1kb

  // generated in ./lib/lexicon
  var lexData = {
    "Conjunction": "true¦e1mas,ni,o,pero,s0u,y;ea,ino;!ntonces",
    "Determiner": "true¦algun7c6e2l1muchos,otr1su5tod1un0vari7;!a,os;a3o3;l,s0;e,t0;a0e,os;!s;ada,ualquier;as,os",
    "Preposition": "true¦aGcBd8e5f3ha2junEmedi9p1s0tras;egún,in,ob6;aBor;cia,sta;rente 0uerB;a,de;n0xcepto;!cim8t0;re;e1ur0;ante;! acuerdo con,baj8lante Antr8sA;erc3on0;! respec1t0;ra;to a;a 5;! pesa3demás 4l1nte0;!s 3; lad0rededo1;o 1;r 0;de",
    "Pronouns": "true¦cu5donde,e2le4nos,qu1se,é0;l,ste;e,ien;ll0sto;a0o0;!s;al0yo;!es",
    "Adverb": "true¦0:1P;1:1Q;a14b12c0Qd0Ne0Ff0Cg0Ah09i06jam1Okm²,l02mYnVoTpFquizáErBs7t2usu0ya,ún13;a3o2radicTíp12;!davía,t0;m3n2rde;!to;bién,pL;egu0Ui3ola1u2í,óI;ce0Afic01pues0S;empre,gnifica1Dm2quie1B;p0Oultánea1;a0Qe2ápi0Y;al1ci2la1Aspec1A;e0Xén;!s;arDerf0Ao5r2u0Mylori,úbl0P;e3incip0o2áct0O;b0Gfun0Sgre01p0Z;cisa1v0Y;co7pAr 3s2;ib0Eter0V;e3lo 2supues08;menKt06;jemp2l contrario,ntonces;lo;! a p2;oco;ci0tic2;ular1;cas2fiTrigin0;ion0;atur0eces7o3u2;e0Rn06;!rm0t00;a3en8u2ás;cho,y;l,yorit2;ar0F;e3i2oc0uego;geYt9;j2nW;os;gu0n2;!cluso,depend2iFmediaT;ie02;abi0HistórVoy;en2radu0;er0;in0orm0recueYu2ácil1;er2ndament0;a,te1;conómPn 8s4ven0Bx2;acKclu2treS;si06;en4pec3tr2;echa1icH;i0ífK;ci0;consecuencia,gran medida,línea;e3ir2;ecC;finiXla04masia06ntro,spués;asi,erClaBo4u2;an2;to;m6n2;cre6jun6s2tinJ;ider2taF;ab2;le1;ple2ún1;ta1;ra1;ca;astaRien,ás2;ica1; Qbajo,cMdHhFlDmplCn7p3quí,rriba,s2trLun,ún;imismo,í;are4enas,roxi2;ma2;da1;nte1;t2u0;e3ig2;ua1;r2s;ior1;ia1;go,l2ta1;á,í;o2í;ra;e4ministra2;ti2;va1;la6m2;ás;tu0;al1;me2;nte;bor2la vez;do",
    "Adjective": "true¦0:6H;1:5Z;2:6B;3:6G;4:63;5:46;a5Nb5Bc3Yd3Ie2Vf2Kg2Eh2Bi1Vj1Sl1Mm14n0Wo0Tp0Cquím5Fr03sPtFuDv7web,árabe3ú6;ltim4n3Ft3I;ari4He8i6;ej0ol5Lr33s6t1vo3;ib4Gu1;cHr6;d6t05;ader0e3;ni6rb3V;for2Ivers1;e9he,ill,ot1r8ur7é6íp36;cni5Brmi4U;bul5Cco,íst34;adi60emen20;atr1mpAr6;cer8r6;estre3i6;to1S;!a;or1r4N;aHeFiCo8u6úp50;a4Wfi3Kper6;!fi2Oi5E;cial8l6vié4K;a6itJo;!r;!es,is3Y;g7m6;il0Mp2X;nifica08ui5;c6gun1Cncill0ptentr3Nxu2;o,undari39;gr2Zn6;!gri4R;adDe8i47o7u6ápid0;r2s0;cocó,j0m41t0C;al5Gc9don1Cg8l7nomb12spons3Ivolucion6;ario;a2Tigios4;i5Aular46;i5tang3P;ic1;arKeIl3RoFr6u26úbl48;eCi9o6ác2TóxX;b3Aced5f7pi4v6;eni5in20;esi53und0;m6nX;a46er6;!a3os;s6vi0;en54iden4C;b2Ideros0lít3YpBs6;i6te4H;b26tiv0;or,queñ4r6;man4As4Tteneci5ua49;ci1tic6;ulR;ccide0Zfi44peraDr6scur0;al,i6;e0Xgin2un0N;aBe8o7u6óm24;cleMev4meros1V;b1Wrm2tab1W;cesari4g6rvioso;a6r29;tivo;ci4Ht6v1zi;al,ur2;aJeGiEoBu7áx6édi3Nín6óv1Kúltipl3B;im0;n7s6;c2Sic2;di1i6;cip2;dern4r6;al,ib6;un06;lit6sm4;ar48;di7j3Qn6rid27tropolit2Wx3S;or46t1u02;a,ev1o;gné2Ul8rítimo,s7te6y3N;mática3ri1;culi3Fi1I;a,vaQ;a9e8i6oc2;b6ne1terari0;er1re3;g2n3M;nceoladas,rg4t6;er2in0;aponEem2Xov40u6óven2N;d6nt35s3I;i0Lí0;de1gu2lKmpHn6tali1Dzquierd0;aEdDespeCfBglAi0Jmedia3Fte6usitaF;lec0Ens0r6;!es3Qi1Sn6;a6o3;!ci3Js;e0Fés;ant0Me32;ra8;epe1Bividu2ustri2ígena3;caba6decua6;da;e7o6;rt3Gsib1H;ri1;imitad0ustr25;abitu2istór29o6um1Vúme7;n6rizo2W;do;e9ig27lob1r6;a6ieg0;n6ve3;!de3;n6ográfi1S;er2é0N;aEeDiBorm1r9u6ác04ísic2X;er34n6tu0R;c10dame6;nt2;anc6ecu5í0;esa3és;el,n1r6;me;der1menin0;lNm6vor0V;ili1Eos4;conóm1PfRlOnMquival25sCurope4vid25x6;!ac0Xcel24en2Fist5perime2Ct6;e8r6;anjer6em0;a,os;ns0r6;i24n08;caEenDp8t6;a6rUánd15;b0Ldounidense3t2;a8ec7iri6;tu1;i2ífE;ci2ñol6;!a3es;ci1;sa;orme3te6;ro;ect6éctr1I;or1rón6;icT;ecKicaz;eEi9o8u7éb6;il;lce,r0;b04min10;f9git1rect0s7vers6;as,os;ponib6tint4;le3;er5íc08;finiAl8portiv7r6;echa;as,o;g6ic6;ada3;ti6;va;a0Be06h03iZlYoDr9u7éleb6;re;arTltur2án6;ti09;e8isti6;an6;a,o3;ci0V;loPmLnBr7ste6;ra;por1re6t4;ct0spo6;ndi5;en1E;s8t6;en0Yin6;e0Uu0;ervadBi8t6;an19ituc6;ion1;der6st0I;ab6;le;or;er0Bple8un6ún;es,is6;ta;j0t0;mbia09ni1;ar0ás05;e8rc7v6;il0T;ulE;ntíf01rt4;artTi6;l6no;en0;l8ntr2r6;c6ebr1;an4;esZul6;ar;liWntHp9racterís8stell7tóli6;ca;ana;tiK;a6it1;c6z;es;aFerebEinaDlanCr7uen6ás9;!a3o3;e9i6;ll7tán6;ic4;anL;ve;c4do;ria;er;j4rro6;co;b00ctXdTgrícola3lPmJnFparDr7t6utónoma,zul,ére0;enN;gentiAqueológic9t6;ifi7íst6;ic0;ci2;os;no;en6;te;t6u2;e6igu4;ri6;orM;arill9bie7er6pli0;ican0;nt1;al;a,en6o;to;em7t4;a3o3;an6án;a3es;i7ministrativ6;a3o;ci6;on2;iv0u2;al6;!es;origAsolut0und6;an6;te3;!s;a,o;en",
    "Ordinal": "true¦cVdKmilJnoIoctHpGquinEs8t2unMvigésimo0;! 0;cuRpEs5teM;eLr0;esTi0;ceWgésimo0;! 0;p9s0;eg5;e1é0;ptTtT;g2pt1x0;agQcePto;iNu2;undo;cu0geMto;agM;rim8;aCingKogK;nGv8;lonIésJ;ecimo2osCu0écI;ceFo0;décG;c4nov3quinAs2te0;rc0;ero;ex7éptC;eno;ta1u0;ar4;vo;e5ua0;dr2r1tro0;mil4;to;ag2i0;nge0;nt0;és0;imo",
    "Cardinal": "true¦cLdDmilCnAo8quin7s5tre4u3veint0;e,i0;c0dós,nuIoHsFtrés,u1;inco,uatro;no;ce,inNsI;e0iC;isGsKte4;ce,iG;ch0nK;enIoD;ove0u9;ciCnG;!lones;ie1o0;ce,s8;ci0z;nu3o2s0;i0éis;ete;cho;eve;ator7i3ua0;r4tro0;!ci0;entos;en,nc0;o,u0;en0;ta;ce",
    "City": "true¦0:3B;a2Zb29c1Zd1Ue1Tf1Rg1Lh1Di1Bjakar2Kk12l0Vm0Hn0Do0Bp00quiZrWsMtDuCv9w4y2z1;agreb,uri22;ang1We1okohama;katerin1Krev0;ars4e3i1rocl4;ckl0Yn1;nipeg,terth0Z;llingt1Rxford;aw;a2i1;en2Klni33;lenc2Yncouv0Ir2J;lan bat0Ftrecht;a7bilisi,e6he5i4o3rondheim,u1;nWr1;in,ku;kyo,ronJulouD;anj26l16miso2Mra2D; haKssaloni10;gucigalpa,hr0l av0O;i1llinn,mpe2Engi09rtu;chu25n0pU;a4e3h2kopje,t1ydney;ockholm,uttga15;angh1Ienzh20;o0Nv01;int peters0Xl4n1ppo1I; 1ti1E;jo1salv3;se;v1z0T;adW;eykjavik,i2o1;me,sario,t28;ga,o de janei1A;to;a9e7h6i5o3r1ueb1Tyongya1Q;a1etor28;gue;rt1zn0; elizabe4o;ls1Jrae28;iladelph23nom pe0Aoenix;r1tah tik1C;th;lerLr1tr13;is;dessa,s1ttawa;a1Klo;a3ew 1is;delWtaip1york ci1U;ei;goya,nt0Xpl0Xv0;a7e6i5o2u1;mb0Oni0L;nt2sco1;u,w;evideo,real;l0n03skolc;dellín,lbour0U;drid,l6n4r1;ib2se1;ille;or;chest1dalYi11;er;mo;a6i3o1vCy03;nd1s angel0H;on,r0G;ege,ma1nz,sb00verpo2;!ss1;ol; pla0Jusan0G;a6hark5i4laipeda,o2rak1uala lump3;ow;be,pavog1sice;ur;ev,ng9;iv;b4mpa0Lndy,ohsiu0Ira1un04;c1j;hi;ncheNstanb1̇zmir;ul;a6e4o1; chi mi2ms,u1;stJ;nh;lsin1rakliH;ki;ifa,m1noi,va0B;bu0UiltE;alw5dan4en3hent,iza,othen2raz,ua1;dalaj0Hngzhou;bu0R;eVoa,ève;sk;ay;es,rankfu1;rt;dmont5indhovV;a2ha02oha,u1;blSrb0shanbe;e1kar,masc0HugavpiK;gu,je1;on;a8ebu,h3o1raioKuriti02;lo1nstanKpenhagOrk;gGmbo;enn4i2ristchur1;ch;ang m2c1ttagoM;ago;ai;i1lgary,pe town,rac5;ro;aIeCirminghXogoBr6u1;char4dap4enos air3r1s0;g1sa;as;es;est;a3isba2usse1;ls;ne;silRtisla1;va;ta;i4lgrade,r1;g2l1n;in;en;ji1rut;ng;ku,n4r1sel;celo2ranquil1;la;na;g2ja lu1;ka;alo1kok;re;aDbBhmedabad,l8m5n3qa2sh1thens,uckland;dod,gabat;ba;k1twerp;ara;m0s1;terd1;am;exandr2ma1;ty;ia;idj0u dhabi;an;lbo2rh1;us;rg",
    "Country": "true¦0:2M;a2Cb1Yc1Nd1Me1Df19g12h11i0Sj0Qk0Nl0Gm08n04om2Op00rRsFtAu6v4wal3y2z1;a1Rimbab0A;emen,ibu0N;es,lis and futu2D;a1enezue2FietD;nuatu,tican city;cr2Fg0Snited 2ruXs1zbek2H;a,sr;arab emiratIkingdom,states1;! of ameB;a4imor orient0Vo3rinidad y toba08u1únez;r1valu;kmen2Bqu12;go,nS;i0Xnz27yik29;a8e7i6om0Eri lanka,u1;azi0Vdá2ec0iza,ri1;nam;f2n1;! del s18;ri1F;erra leo1Vngap16r0;neg0Jrb0ychell4;moa,n1o tomé y príncipe; 1ta luc0Q;cristóbal y niev1mariSvicente y las granad0N;es;e2u1;an1Qm1Ts0;ino unido,pública 1;c4d1;e1omin4; macedQl1mocrática del1; conL;entroafr1he11;ica1H;a2erú,o1;lLrtug04;k1Lla18namá,púa nueva guin0Gra1íses baj18;guay;a3ep01i2orue1ueva zelUíger;ga;caragua,ger0;mib0uru;a5icroSo2éxi1óna1;co;ldav0n2zambiq1;ue;gol0tenegro;dagasc0Jl1rruec0Xurit18;a1div0Xta,í;s0ui;a0Ue5i3uxembur2íba1;no;go;b1echtenste0Qtu12;er0ia;soZt1;on0;azaj10en0ir1uwait;gu0Ziba1;ti;a1ord0V;mai08pH;nd7r5s2t1;al0;la1rael;nd0s 1;marshall,salomC;ak,l1án;an0K;ia,o1;nes0;aití,ondur0AungrD;a5ha0Er4u1;atema0Ginea1ya0D;! ecuatori1-bisáu;al;ana0Cec0;b1mb0;ón;i1ranc0;lip2n1yi;land0;inZ;cu8gip7l salv8miratos árabe6ritr5s2tiop1;ía;lov2paña,t1;ado3on0;aqu0en0;ea;s unidR;to;ador;inamarDominiD;a8hi6o1roac0uba;lo4morNrea del 2sta 1te d'ivoi6;de marfEriA;norte,s1;ur;mb0;le,na,p1;re;bo verde,m2nadá,t1;ar;boya,erún;a9e8i7o6r4u2élgi1;ca;lgar0r1tO;kina faso,undi;as1unéi;il;liv0snia-herzegoviCtsuaC;elorrus0rmG;lice,nín;ham4ngladés,r1;bad2é1;in;os;as;fganBl8n5r2ustr1zerbaiyC;al0ia;abia saudita,ge1men0;l0nti1;na;dorra,go2tigua y barbu1;da;la;b1em1;an0;ia;ist1;án",
    "Place": "true¦aLbJcHdGeEfDgAh9i8jfk,kul,l7m5new eng4ord,p2s1the 0upIyyz;bronx,hamptons;fo,oho,under2yd;acifLek,h0;l,x;land;a0co,idCuc;libu,nhattJ;ax,gw,hr;ax,cn,ndianGst;arlem,kg,nd;ay village,re0;at 0enwich;britain,lak2;co,ra;urope,verglad0;es;en,fw,own1xb;dg,gk,hina0lt;town;cn,e0kk,rooklyn;l air,verly hills;frica,m5ntar1r1sia,tl0;!ant1;ct0;ic0; oce0;an;ericas,s",
    "Region": "true¦0:23;1:1U;a21b1Tc1Jd1Ees1Df1Ag14h11i0Yj0Wk0Ul0Rm0GnZoXpTqQrNsEtButAv7w4y2zacatec23;o05u2;cat19kZ;a2est vi5isconsin,yomi15;rwick1shington2;! dc;er3i2;rgin1T;acruz,mont;ah,tar pradesh;a3e2laxca1EuscaB;nnessee,x1S;bas0Lmaulip1RsmK;a7i5o3taf0Pu2ylh14;ffVrr01s0Z;me11no1Buth 2;cSdR;ber1Jc2naloa;hu0Tily;n3skatchew0Sxo2;ny; luis potosi,ta catari0;a2hode8;j2ngp03;asth0Nshahi;inghai,u2;e2intana roo;bec,ensXreta0F;ara0e3rince edward2; isV;i,nnsylv2rnambu03;an15;axa0Pdisha,h2klaho1Dntar2reg5x06;io;ayarit,eCo4u2;evo le2nav0N;on;r2tt0Tva scot0Z;f7mandy,th2; 2ampton1;c4d3yo2;rk1;ako10;aroli0;olk;bras0Zva03w2; 3foundland2;! and labrador;brunswick,hamp1jers3mexiLyork2;! state;ey;a7i3o2;nta0relos;ch4dlanCn3ss2;issippi,ouri;as geraHneso0N;igRoacR;dhya,harasht05ine,ni4r2ssachusetts;anhao,y2;land;p2toba;ur;anca1e2incoln1ouis9;e2iI;ds;a2entucky,hul0;ns09rnata0Eshmir;alis2iangxi;co;daho,llino3nd2owa;ia0;is;a3ert2idalFunB;ford1;mp1waii;ansu,eorgXlou6u2;an3erre2izhou,jarat;ro;ajuato,gdo2;ng;cester1;lori3uji2;an;da;sex;e5o3uran2;go;rs2;et;lawaFrby1;a9ea8hi7o2umbrI;ahui5l4nnectic3rsi2ventry;ca;ut;iNorado;la;apFhuahua;ra;l9m2;bridge1peche;a6r5uck2;ingham1;shi2;re;emen,itish columb4;h3ja cal2sque,var3;iforn2;ia;guascalientes,l5r2;izo0kans2;as;na;a3ber2;ta;ba3s2;ka;ma",
    "Infinitive": "true¦0:76;1:6M;2:6U;3:6X;4:6T;5:5O;6:4W;a5Ob5Fc40d3Be2Hf2Bg26h22i1Nj1Ll1Fm18n14o10p0Fque0Er00sNtHuFv7y3Pzambulli60;aDeAi9o7;l7mit,t0;ar,v2;aj0ol0s3Sv1;n8r7st72;!if6;c2d2ir;ci0l2ri0;b6n7s0t4U;ir,t0;aBeAir0o9r7;a7iunf0opez0;baj0d1Fer,g0t0;c0m0rc2s2;m2n2rm6Eñ1;p0rd0ñ2;aFeCiBo9u7;b1ced2fr1g06p02rg1s7;p5Dti44;breviv1l2n7po1Hrpre5ñ0;ar,r1S;gn4Fmbol51tu0;c3gu1nt8r7ñ1A;!v1;ar6Jir6J;b2c9l8ti7;r4Wsf2Y;ir,t0ud0v0;ar,r48ud1;e8o7;b0g0mp2;al4RcFd0WgChus0in0nBp9quSs7v5Dz0ír,ñ1;erv0olv2p7u0Z;et0ir0o5;a7et1l6o12;r0s0;ac2ov0un57;a8i7r4Rul0;r,str3;l0r,te0;h56i8o7;g2mend0noc2rd0;b1cl0;br3d3ja4Sm3r2;aPeKiJlaHoGr8u7;bl6r3R;act6eAo7;b0d0Gh2Fmet2p8se26te7voc0;g2st0;on2;d46f9gu3Zpar3se7v2;nt7rv0;ar,ir;er1;d2n23;n7t6;ch0t0;c0nt0;d1g0in3le0ns0r8s7;ar,c0;d8m7se1Tten4;an4it1;er,on0;d4g0r7s0t51;ar,ec2ticip0;b9curr1di0f8l7pon1Srgan3Tír;er,vid3;e5r4;ed4l3Dt13;a9e7ot0;ces1Xg7v0;ar58o48;c2d0veg0;aAe8ir0o7ud3;d2Yle2Mnt0r1s1Uv1J;d1nt1re7t2zcl0;c2nd0;d31n8qui1Nrc0st6t7;ar,ricul3;d0ej0t0S;aBeAimpi0l7o10u0K;am3e8o7;r0v2;g0n0v0;er,gWva31;dr0me44nz0stim0v3;acta3Lu7;g0nt3r0;lus1GmpJn7r4R;clu1dHfGi3Qmi0RsDt9v7;ad1e7it0oc0;nt0rt1st2Q;e8rod7;uc1;nt0r7;es0pret0;i38t8u7;lt0;al0;lu1o3V;ic0uc1;o7r11;rt0;a9e7u1;l0r7;ed0ir,v1;bl0c2ll3;aAener9lor21obern0r8u7;ard0i0st0;adu3it0uñ1;al2K;n0st0;aBelic0RiAlor4or9r8u7;m0nci45;eír;m0tal4;j0ng1rm0;br6lt0sc3J;ch3duc0fectu0jerc2lZmWnKquivoc3rr0sEvDx7;h0Fig1p8t7;e5in05;l8o7r2F;n2rt0;ic0o7;r0t0;acu0it0;c9per0qui0t7;a7im0udi0;bl4r;o8r05u7;ch0;g2ndY;amor3cHfEg3Coj3riFsDt8v7;ejFi0;eAr7usiasm3;ar,e7;g0t7vi0W;en2;nd2ra25;eñ0u2C;ad3erm3la7;qu7;ecN;a2Ie5onX;borrach3i8p7;ez0le0;gr0;eg1im2P;ar,eEi9o8u7;ch3d0r0;bl0l2rm30;buj0r2Es8v7;ert2Yorci3;eñ0frut0gu0Fminu1t7;in7ri07;gu1;b2cLd0Hfe5j0mosKpHrret1sAte8vo7;lv2r0;n7st0;er2S;aBc9e0h8pe7tru1;d1rt3;ac2;ans0e5r7ubr1;ib1;gr1Xpar4rro7yun0;ll3;e5os8r7;im1;it0;tr0;i7lar0or0;d2Er;a0Ee0Bh0Aiv09la06oDr9u7;br1id0l7mpl1r0;p0tiv0;e9i8u7;c03z0;ar29t6;ar,c2er;br0c1Sg2lXmSnApi0r8s7;er,t0;re7t0;g1r;dNfLjug0oc2quiKsGtBv7;e7id0;n8r7;s0t1;c2ir;aAe9inu0r7;i7ol0;bu1;n2st0;m1Fr;e9i0It7um1;i7ru1;tu1;gu1nt1rv0;st0;es0i7;ar,rm0sc0;en0uc1;bat1eAp8un7;ic3;a10et1on2r7;ar,e5;nz0r;g0o7;c0nU;r7s7;if6;ic0;ilQ;arl0isme0oc0;lebr0n7pill0rr0s0;ar,s7;ur0;b2er,lBm0RnAr9s7us0z0;ar15t7;ig0;acterIg0;c03s3;cul0e7l3m3;nt3;aDeBorAr8u7;ce0rl3sc0;i7onceaP;ll0nd0;d0r0;b2nd7s0;ec1;il0j0rr2t1ut7ñ3;iz0;b0Nc0Cd06f03gZhorYlVmSnPpJrrGsDt8ume00v7yud0ñad1;aWerigu0is0;ac0e5r7;a7eveF;er,v7;es0;nd2;i8oJp7ust3;ir0;st1;e7oj0;gl0penti7;rse;aBlAo9r7;e7ob0;ci0nd2t0;st0y0;aud1ic0;g0r4;d0h8un7;ci0;el0;a8en7;az0;n4r;ca8e7ivi0morz0quil0;gr3nt0;nz0;c0r0;or0r8ua7;nt0;ad7;ar,ec2;eit3i8l7;ig1;rm0;ivBmi9or8ve7;rt1;ar,n0;r0t1;ir;in0;aGeEo7tu0;mpCn9r8st7;arIumbr3;d3t0;sej0t4;ec2;er;añ0;pt0rc3;arB;b0mp0;andCorBrAu7;rr7s0;ir7;!se;az0ir;d0t0;on0;ar",
    "Modal": "true¦debEhBp7qu5s2t0;en0iene8;emHgo,éDíaG;ab0ol3uel5é;e0éB;!mEn,s;er0ier2;emCé8;od2ued0;e0o;!n,s;em8r6é4;a1e0;!m6;!bé1n,s;e1o,é0;is;!m2n,r0s;ía0;!is,m0n,s;os",
    "Month": "true¦a6dic4en3febr3ju1ma0nov4octu5sept4;rzo,yo;l0n0;io;ero;iem0;bre;bril,gosto",
    "WeekDay": "true¦domingo,juev1lun1m0sábado,viern1;art0iércol0;es",
    "FemaleName": "true¦0:FX;1:G1;2:FQ;3:FC;4:FB;5:FR;6:EQ;7:GE;8:EY;9:EO;A:GA;B:E4;C:G7;D:FN;E:FK;F:EF;aE1bD3cB8dAIe9Gf91g8Hh83i7Sj6Uk60l4Om38n2To2Qp2Fqu2Er1Os0Qt04ursu6vUwOyLzG;aJeHoG;e,la,ra;lGna;da,ma;da,ra;as7EeHol1TvG;et9onB9;le0sen3;an8endBNhiB4iG;lInG;if3AniGo0;e,f39;a,helmi0lGma;a,ow;aMeJiG;cHviG;an9XenG0;kCYtor3;da,l8Vnus,rG;a,nGoniD1;a,iDB;leGnesEB;nDKrG;i1y;aSePhNiMoJrGu6y4;acG2iGu0E;c3na,sG;h9Mta;nHrG;a,i;i9Jya;a5IffaCFna,s5;al3eGomasi0;a,l8Go6Xres1;g7Uo6WrHssG;!a,ie;eFi,ri7;bNliMmKnIrHs5tGwa0;ia0um;a,yn;iGya;a,ka,s5;a4e4iGmC9ra;!ka;a,t5;at5it5;a05carlet2Ye04hUiSkye,oQtMuHyG;bFIlvi1;e,sHzG;an2Tet9ie,y;anGi7;!a,e,nG;aEe;aIeG;fGl3DphG;an2;cF7r6;f3nGphi1;d4ia,ja,ya;er4lv3mon1nGobh75;dy;aKeGirlBKo0y6;ba,e0i6lIrG;iGrBOyl;!d70;ia,lBU;ki4nIrHu0w0yG;la,na;i,leAon,ron;a,da,ia,nGon;a,on;l5Yre0;bMdLi8lKmIndHrGs5vannaE;aEi0;ra,y;aGi4;nt5ra;lBMome;e,ie;in1ri0;a02eXhViToHuG;by,thBJ;bQcPlOnNsHwe0xG;an94ie,y;aHeGie,lC;ann7ll1marBEtB;!lGnn1;iGyn;e,nG;a,d7W;da,i,na;an8;hel53io;bin,erByn;a,cGkki,na,ta;helBYki;ea,iannDWoG;da,n12;an0bIgi0i0nGta,y0;aGee;!e,ta;a,eG;cAQkaE;chGe,i0mo0n5EquCCvDy0;aCBelGi8;!e,le;een2ia0;aMeLhJoIrG;iGudenAV;scil1Uyamva8;lly,rt3;ilome0oebe,ylG;is,lis;arl,ggy,nelope,r6t4;ige,m0Fn4Oo6rvaBAtHulG;a,et9in1;ricGsy,tA7;a,e,ia;ctav3deHfAVlGphAV;a,ga,iv3;l3t9;aQePiJoGy6;eHrG;aEeDma;ll1mi;aKcIkGla,na,s5ta;iGki;!ta;hoB1k8BolG;a,eBG;!mh;l7Tna,risF;dIi5PnHo23taG;li1s5;cy,et9;eAiCN;a01ckenz2eViLoIrignayani,uriBFyG;a,rG;a,na,tAR;i4ll9WnG;a,iG;ca,ka,qB3;a,chOkaNlJmi,nIrGtzi;aGiam;!n8;a,dy,erva,h,n2;a,dIi9IlG;iGy;cent,e;red;!e6;ae6el3G;ag4KgKi,lHrG;edi61isFyl;an2iGliF;nGsAL;a,da;!an,han;b08c9Dd06e,g04i03l01nZrKtJuHv6Sx86yGz2;a,bell,ra;de,rG;a,eD;h75il8t2;a,cSgOiJjor2l6In2s5tIyG;!aGbe5QjaAlou;m,n9R;a,ha,i0;!aIbAKeHja,lCna,sGt53;!a,ol,sa;!l06;!h,m,nG;!a,e,n1;arIeHie,oGr3Kueri9;!t;!ry;et3IiB;elGi61y;a,l1;dGon,ue6;akranBy;iGlo36;a,ka,n8;a,re,s2;daGg2;!l2W;alCd2elGge,isBFon0;eiAin1yn;el,le;a0Ie08iWoQuKyG;d3la,nG;!a,dHe9RnGsAP;!a,e9Q;a,sAN;aB0cJelIiFlHna,pGz;e,iB;a,u;a,la;iGy;a2Ae,l25n8;is,l1GrHtt2uG;el6is1;aIeHi7na,rG;a6Yi7;lei,n1tB;!in1;aQbPd3lLnIsHv3zG;!a,be4Ket9z2;a,et9;a,dG;a,sGy;ay,ey,i,y;a,iaIlG;iGy;a8Fe;!n4F;b7Serty;!n5R;aNda,e0iLla,nKoIslAQtGx2;iGt2;c3t3;la,nGra;a,ie,o4;a,or1;a,gh,laG;!ni;!h,nG;a,d4e,n4N;cNdon7Ri6kes5na,rMtKurIvHxGy6;mi;ern1in3;a,eGie,yn;l,n;as5is5oG;nya,ya;a,isF;ey,ie,y;aZeUhadija,iMoLrIyG;lGra;a,ee,ie;istGy5B;a,en,iGy;!e,n48;ri,urtn99;aMerLl98mIrGzzy;a,stG;en,in;!berlG;eGi,y;e,y;a,stD;!na,ra;el6OiJlInHrG;a,i,ri;d4na;ey,i,l9Ps2y;ra,s5;c8Vi5WlOma6nyakumari,rMss5KtJviByG;!e,lG;a,eG;e,i77;a5DeHhGi3PlCri0y;ar5Ber5Bie,leDr9Ey;!lyn72;a,en,iGl4Uyn;!ma,n31sF;ei71i,l2;a04eVilToMuG;anKdJliGst55;aHeGsF;!nAt0W;!n8W;i2Ry;a,iB;!anLcelCd5Uel70han6HlJni,sHva0yG;a,ce;eGie;fi0lCph4W;eGie;en,n1;!a,e,n36;!i10lG;!i0Z;anLle0nIrHsG;i5Psi5P;i,ri;!a,el6Oif1RnG;a,et9iGy;!e,f1P;a,e71iHnG;a,e70iG;e,n1;cLd1mi,nHqueliAsmin2Uvie4yAzG;min7;a7eHiG;ce,e,n1s;!lGsFt06;e,le;inHk2lCquelG;in1yn;da,ta;da,lPmNnMo0rLsHvaG;!na;aHiGob6T;do4;!belGdo4;!a,e,l2G;en1i0ma;a,di4es,gr5Q;el8ogG;en1;a,eAia0o0se;aNeKilHoGyacin1N;ll2rten1H;aHdGlaH;a,egard;ry;ath0WiHlGnrietBrmiAst0W;en24ga;di;il74lKnJrGtt2yl74z6C;iGmo4Eri4F;etG;!te;aEnaE;ey,l2;aYeTiOlMold12rIwG;enGyne18;!dolC;acHetGisel8;a,chD;e,ieG;!la;adys,enGor3yn1Y;a,da,na;aJgi,lHna,ov70selG;a,e,le;da,liG;an;!n0;mYnIorgHrG;ald34i,m2Stru72;et9i0;a,eGna;s1Nvieve;briel3Eil,le,rnet,yle;aReOio0loMrG;anHe8iG;da,e8;!cG;esHiGoi0G;n1s3U;!ca;!rG;a,en42;lHrnG;!an8;ec3ic3;rHtiGy7;ma;ah,rah;d0FileDkBl00mUn49rRsMtLuKvG;aIelHiG;e,ta;in0Ayn;!ngel2G;geni1la,ni3Q;h51ta;meral8peranJtG;eHhGrel6;er;l2Or;za;iGma,nest28yn;cGka,n;a,ka;eJilImG;aGie,y;!liA;ee,i1y;lGrald;da,y;aTeRiMlLma,no4oJsIvG;a,iG;na,ra;a,ie;iGuiG;se;en,ie,y;a0c3da,nJsGzaH;aGe;!beG;th;!a,or;anor,nG;!a;in1na;en,iGna,wi0;e,th;aWeKiJoG;lor50miniq3Xn2ZrGtt2;a,eDis,la,othGthy;ea,y;an09naEonAx2;anPbOde,eNiLja,lImetr3nGsir4T;a,iG;ce,se;a,iHla,orGphiA;es,is;a,l5I;dGrdG;re;!d4Lna;!b2BoraEra;a,d4nG;!a,e;hl3i0mMnKphn1rHvi1VyG;le,na;a,by,cHia,lG;a,en1;ey,ie;a,et9iG;!ca,el19ka;arGia;is;a0Pe0Mh04i02lUoJrHynG;di,th3;istGy04;al,i0;lOnLrHurG;tn1C;aId27iGn27riA;!nG;a,e,n1;!l1R;n2sG;tanGuelo;ce,za;eGleD;en,t9;aIeoHotG;il4A;!pat4;ir7rIudG;et9iG;a,ne;e,iG;ce,sX;a4er4ndG;i,y;aPeMloe,rG;isHyG;stal;sy,tG;aHen,iGy;!an1e,n1;!l;lseHrG;!i7yl;a,y;nLrG;isJlHmG;aiA;a,eGot9;n1t9;!sa;d4el1OtG;al,el1N;cGli3F;el3ilG;e,ia,y;iYlXmilWndVrNsLtGy6;aJeIhGri0;erGleDrCy;in1;ri0;li0ri0;a2GsG;a2Fie;a,iMlKmeIolHrG;ie,ol;!e,in1yn;lGn;!a,la;a,eGie,y;ne,y;na,sF;a0Di0D;a,e,l1;isBl2;tlG;in,yn;arb0CeYianXlVoTrG;andRePiIoHyG;an0nn;nwCok7;an2NdgKg0ItG;n27tG;!aHnG;ey,i,y;ny;etG;!t7;an0e,nG;da,na;i7y;bbi7nG;iBn2;ancGossom,ytG;he;ca;aRcky,lin8niBrNssMtIulaEvG;!erlG;ey,y;hHsy,tG;e,i0Zy7;!anG;ie,y;!ie;nGt5yl;adHiG;ce;et9iA;!triG;ce,z;a4ie,ra;aliy29b24d1Lg1Hi19l0Sm0Nn01rWsNthe0uJvIyG;anGes5;a,na;a,r25;drIgusHrG;el3;ti0;a,ey,i,y;hHtrG;id;aKlGt1P;eHi7yG;!n;e,iGy;gh;!nG;ti;iIleHpiB;ta;en,n1t9;an19elG;le;aYdWeUgQiOja,nHtoGya;inet9n3;!aJeHiGmI;e,ka;!mGt9;ar2;!belHliFmT;sa;!le;ka,sGta;a,sa;elGie;a,iG;a,ca,n1qG;ue;!t9;te;je6rea;la;!bHmGstas3;ar3;el;aIberHel3iGy;e,na;!ly;l3n8;da;aTba,eNiKlIma,yG;a,c3sG;a,on,sa;iGys0J;e,s0I;a,cHna,sGza;a,ha,on,sa;e,ia;c3is5jaIna,ssaIxG;aGia;!nd4;nd4;ra;ia;i0nHyG;ah,na;a,is,naE;c5da,leDmLnslKsG;haElG;inGyW;g,n;!h;ey;ee;en;at5g2nG;es;ie;ha;aVdiSelLrG;eIiG;anLenG;a,e,ne;an0;na;aKeJiHyG;nn;a,n1;a,e;!ne;!iG;de;e,lCsG;on;yn;!lG;iAyn;ne;agaJbHiG;!gaI;ey,i7y;!e;il;ah",
    "MaleName": "true¦0:CD;1:BK;2:C1;3:BS;4:B4;5:BY;6:AS;7:9U;8:BC;9:AW;A:AN;aB3bA7c96d87e7Gf6Yg6Gh5Wi5Ij4Lk4Bl3Rm2Pn2Eo28p22qu20r1As0Qt06u05v00wNxavi3yGzB;aBor0;cBh8Hne;hCkB;!aB0;ar51eAZ;ass2i,oCuB;sDu25;nEsDusB;oBsC;uf;ef;at0g;aJeHiCoByaAO;lfgang,odrow;lBn1O;bDey,frBIlB;aA4iB;am,e,s;e88ur;i,nde7sB;!l6t1;de,lCrr5yB;l1ne;lBt3;a92y;aEern1iB;cCha0nceBrg9Ava0;!nt;ente,t5A;lentin49n8Xughn;lyss4Msm0;aTeOhKiIoErCyB;!l3ro8s1;av9PeBist0oy,um0;nt9Hv54y;bDd7WmBny;!as,mBoharu;aAXie,y;i82y;mBt9;!my,othy;adDeoCia7ComB;!as;!do7L;!de9;dErB;en8GrB;an8FeBy;ll,n8E;!dy;dgh,ic9Snn3req,ts45;aRcotPeNhJiHoFpenc3tBur1Oylve8Gzym1;anDeBua7A;f0phAEvBwa79;e57ie;!islaw,l6;lom1nA2uB;leyma8ta;dBl7Im1;!n6;aDeB;lBrm0;d1t1;h6Rne,qu0Uun,wn,y8;aBbasti0k1Xl41rg40th,ymo9H;m9n;!tB;!ie,y;lCmBnti21q4Iul;!mAu4;ik,vato6U;aWeShe91iOoFuCyB;an,ou;b6KdCf9pe6PssB;!elAH;ol2Uy;an,bIcHdGel,geFh0landA8mEnDry,sCyB;!ce;coe,s;!a94nA;an,eo;l3Jr;e4Qg3n6olfo,ri67;co,ky;bAe9T;cBl6;ar5Oc5NhCkBo;!ey,ie,y;a84ie;gCid,ub5x,yBza;ansh,nS;g8ViB;na8Rs;ch5Xfa4lDmCndBpha4sh6Tul,ymo6Z;al9Xol2By;i9Hon;f,ph;ent2inB;cy,t1;aFeDhilCier61ol,reB;st1;!ip,lip;d9Arcy,tB;ar,e2V;b3Sdra6Et44ul;ctav2Vliv3m95rFsCtBum8Tw5;is,to;aCc8RvB;al52;ma;i,l49vJ;athJeHiDoB;aBel,l0ma0r2X;h,m;cCg4i3IkB;h6Tola;hol5WkBol5W;!ol5V;al,d,il,ls1vB;il50;anBy;!a4i4;aWeTiKoFuCyB;l21r1;hamCr5YstaB;fa,p4G;ed,mF;dibo,e,hamDis1XntCsBussa;es,he;e,y;ad,ed,mB;ad,ed;cGgu4kElDnCtchB;!e7;a77ik;house,o03t1;e,olB;aj;ah,hBk6;a4eB;al,l;hClv2rB;le,ri7v2;di,met;ck,hNlLmOnu4rHs1tDuricCxB;!imilian8Bwe7;e,io;eo,hCi51tB;!eo,hew,ia;eBis;us,w;cDio,k85lCqu6Fsha7tBv2;i2Hy;in,on;!el,oKus;achBcolm,ik;ai,y;amBdi,moud;adB;ou;aReNiMlo2RoIuCyB;le,nd1;cEiDkBth3;aBe;!s;gi,s;as,iaB;no;g0nn6QrenDuBwe7;!iB;e,s;!zo;am,on4;a7Aevi,la4RnDoBst3vi;!nB;!a5Zel;!ny;mCnBr66ur4Swr4S;ce,d1;ar,o4M;aIeDhaled,iBrist4Uu47y3B;er0p,rB;by,k,ollos;en0iEnBrmit,v2;!dCnBt5B;e0Yy;a7ri4M;r,th;na67rBthem;im,l;aYeQiOoDuB;an,liBst2;an,us;aqu2eJhnInGrEsB;eChBi7Aue;!ua;!ph;dBge;an,i,on;!aBny;h,s,th4W;!ath4Vie,nA;!l,sBy;ph;an,e,mB;!mA;d,ffGrDsB;sBus;!e;a5IemCmai8oBry;me,ni0O;i6Ty;!e57rB;ey,y;cHd5kGmFrDsCvi3yB;!d5s1;on,p3;ed,od,rBv4L;e4Yod;al,es,is1;e,ob,ub;k,ob,quB;es;aNbrahMchika,gKkeJlija,nuIrGsDtBv0;ai,sB;uki;aBha0i6Ema4sac;ac,iaB;h,s;a,vinBw2;!g;k,nngu51;!r;nacBor;io;im;in,n;aJeFina4UoDuByd55;be24gBmber4BsD;h,o;m3ra32sBwa3W;se2;aDctCitCn4DrB;be1Zm0;or;th;bKlJmza,nIo,rDsCyB;a42d5;an,s0;lEo4ErDuBv6;hi3Zki,tB;a,o;is1y;an,ey;k,s;!im;ib;aQeMiLlenKoIrEuB;illerCsB;!tavo;mo;aDegBov3;!g,orB;io,y;dy,h56nt;nzaBrd1;lo;!n;lbe4Pno,ovan4Q;ne,oDrB;aBry;ld,rd4T;ffr6rge;bri4l5rBv2;la1Yr3Dth,y;aReNiLlJorr0IrB;anDedBitz;!dAeBri23;ri22;cDkB;!ie,lB;in,yn;esJisB;!co,zek;etch3oB;yd;d4lBonn;ip;deriDliCng,rnB;an01;pe,x;co;bi0di;arZdUfrTit0lNmGnFo2rCsteb0th0uge8vBym5zra;an,ere2U;gi,iCnBrol,v2w2;est44ie;c06k;och,rique,zo;aGerFiCmB;aFe2O;lCrB;!h0;!io;s1y;nu4;be08d1iEliDmCt1viBwood;n,s;er,o;ot1Ss;!as,j42sB;ha;a2en;!dAg31mEuCwB;a24in;arB;do;o0Ru0R;l,nB;est;aXeNiKoErDuCwByl0;ay8ight;a8dl6nc0st2;ag0ew;minicFnDri0ugCyB;le;!l02;!a28nBov0;e7ie,y;!k;armuCeBll1on,rk;go;id;anIj0lbeHmetri9nFon,rEsDvCwBxt3;ay8ey;en,in;hawn,mo08;ek,ri0F;is,nBv3;is,y;rt;!dB;re;lKmInHrDvB;e,iB;!d;en,iDne7rByl;eBin,yl;l2Vn;n,o,us;!e,i4ny;iBon;an,en,on;e,lB;as;a06e04hWiar0lLoGrEuCyrB;il,us;rtB;!is;aBistobal;ig;dy,lEnCrB;ey,neli9y;or,rB;ad;by,e,in,l2t1;aGeDiByI;fBnt;fo0Ct1;meCt9velaB;nd;nt;rDuCyB;!t1;de;enB;ce;aFeErisCuB;ck;!tB;i0oph3;st3;d,rlBs;eBie;s,y;cBdric;il;lEmer1rB;ey,lCro7y;ll;!os,t1;eb,v2;ar02eUilTlaSoPrCuByr1;ddy,rtI;aJeEiDuCyB;an,ce,on;ce,no;an,ce;nCtB;!t;dCtB;!on;an,on;dCndB;en,on;!foBl6y;rd;bCrByd;is;!by;i8ke;al,lA;nFrBshoi;at,nCtB;!r10;aBie;rd0S;!edict,iCjam2nA;ie,y;to;n6rBt;eBy;tt;ey;ar0Xb0Nd0Jgust2hm0Gid5ja0ElZmXnPputsiOrFsaEuCveBya0ziz;ry;gust9st2;us;hi;aIchHi4jun,maFnDon,tBy0;hBu06;ur;av,oB;ld;an,nd0A;el;ie;ta;aq;dGgel05tB;hoEoB;i8nB;!i02y;ne;ny;reBy;!as,s,w;ir,mBos;ar;an,beOd5eIfFi,lEonDphonHt1vB;aMin;on;so,zo;an,en;onCrB;edP;so;c,jaEksandDssaExB;!and3;er;ar,er;ndB;ro;rtH;ni;en;ad,eB;d,t;in;aColfBri0vik;!o;mBn;!a;dFeEraCuB;!bakr,lfazl;hBm;am;!l;allEel,oulaye,ulB;!lCrahm0;an;ah,o;ah;av,on",
    "FirstName": "true¦aEblair,cCdevBj8k6lashawn,m3nelly,quinn,re2sh0;ay,e0iloh;a,lby;g1ne;ar1el,org0;an;ion,lo;as8e0r9;ls7nyatta,rry;am0ess1ude;ie,m0;ie;an,on;as0heyenne;ey,sidy;lex1ndra,ubr0;ey;is",
    "LastName": "true¦0:34;1:3B;2:39;3:2Y;4:2E;5:30;a3Bb31c2Od2Ee2Bf25g1Zh1Pi1Kj1Ek17l0Zm0Nn0Jo0Gp05rYsMtHvFwCxBy8zh6;a6ou,u;ng,o;a6eun2Uoshi1Kun;ma6ng;da,guc1Zmo27sh21zaR;iao,u;a7eb0il6o3right,u;li3Bs2;gn0lk0ng,tanabe;a6ivaldi;ssilj37zqu1;a9h8i2Go7r6sui,urn0;an,ynisJ;lst0Prr1Uth;at1Uomps2;kah0Vnaka,ylor;aEchDeChimizu,iBmiAo9t7u6zabo;ar1lliv2AzuE;a6ein0;l23rm0;sa,u3;rn4th;lva,mmo24ngh;mjon4rrano;midt,neid0ulz;ito,n7sa6to;ki;ch1dLtos,z;amBeag1Zi9o7u6;bio,iz,sD;b6dri1MgIj0Tme24osevelt,ssi,ux;erts,ins2;c6ve0F;ci,hards2;ir1os;aEeAh8ic6ow20;as6hl0;so;a6illips;m,n1T;ders5et8r7t6;e0Nr4;ez,ry;ers;h21rk0t6vl4;el,te0J;baBg0Blivei01r6;t6w1O;ega,iz;a6eils2guy5ix2owak,ym1E;gy,ka6var1K;ji6muW;ma;aEeCiBo8u6;ll0n6rr0Bssolini,ñ6;oz;lina,oKr6zart;al0Me6r0U;au,no;hhail4ll0;rci0ssi6y0;!er;eWmmad4r6tsu07;in6tin1;!o;aCe8i6op1uo;!n6u;coln,dholm;fe7n0Qr6w0J;oy;bv6v6;re;mmy,rs5u;aBennedy,imuAle0Lo8u7wo6;k,n;mar,znets4;bay6vacs;asY;ra;hn,rl9to,ur,zl4;aAen9ha3imen1o6u3;h6nYu3;an6ns2;ss2;ki0Es5;cks2nsse0D;glesi9ke8noue,shik7to,vano6;u,v;awa;da;as;aBe8itchcock,o7u6;!a3b0ghNynh;a3ffmann,rvat;mingw7nde6rN;rs2;ay;ns5rrQs7y6;asDes;an4hi6;moJ;a9il,o8r7u6;o,tierr1;ayli3ub0;m1nzal1;nd6o,rcia;hi;erAis9lor8o7uj6;ita;st0urni0;es;ch0;nand1;d7insteHsposi6vaL;to;is2wards;aCeBi9omin8u6;bo6rand;is;gu1;az,mitr4;ov;lgado,vi;nkula,rw7vi6;es,s;in;aFhBlarkAo6;h5l6op0rbyn,x;em7li6;ns;an;!e;an8e7iu,o6ristens5u3we;i,ng,u3w,y;!n,on6u3;!g;mpb7rt0st6;ro;ell;aBe8ha3oyko,r6yrne;ooks,yant;ng;ck7ethov5nnett;en;er,ham;ch,h8iley,rn6;es,i0;er;k,ng;dDl9nd6;ers6rA;en,on,s2;on;eks7iy8var1;ez;ej6;ev;ams",
    "Person": "true¦ashton kutchSbRcMdKeIgastNhGinez,jEkDleCmBnettJoAp8r4s3t2v0;a0irgin maG;lentino rossi,n go3;heresa may,iger woods,yra banks;addam hussain,carlett johanssJlobodan milosevic,uB;ay romano,eese witherspoIo1ush limbau0;gh;d stewart,nald0;inho,o;a0ipJ;lmIris hiltD;prah winfrFra;essiaen,itt romnEubarek;bron james,e;anye west,iefer sutherland,obe bryant;aime,effers8k rowli0;ng;alle ber0itlBulk hogan;ry;ff0meril lagasse,zekiel;ie;a0enzel washingt2ick wolf;lt1nte;ar1lint0ruz;on;dinal wols1son0;! palm2;ey;arack obama,rock;er"
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
        "rules": "bicar|4,abricar|6mos,apar|3,ceptar|4áis,nsentir|2iento,astar|4mos,estigar|6n,omponer|6,omenzar|6mos,raduar|4áis,lorecer|6mos,ivertir|2iertes,esentir|5ís,eprimir|6mos,roteger|6mos,sificar|5áis,intar|4,squiar|3ío,espedir|3ide,ontecer|6mos,otestar|6mos,spertar|2ierta,ducar|3áis,estruir|5ís,onfiar|4áis,lonizar|5áis,namorar|6mos,ufrir|3ís,onsejar|6n,lustrar|6n,alcular|5áis,omper|4n,ailar|3o,orcer|uerce,onreír|3ío,arrer|3éis,mpezar|2iezas,epasar|5n,ablecer|6mos,ormir|uermes,erretir|3ite,ropezar|5áis,rindar|5mos,nvitar|5s,erendar|6mos,ngañar|5n,nviar|2ían,obernar|6mos,xigir|3ís,riunfar|6mos,uebrar|1iebran,uerer|1ieren,nfadar|5,sayunar|6s,esultar|6mos,rometer|6,gorar|3áis,legar|4mos,isfacer|6,sgustar|6s,brazar|5n,scender|2iende,busar|4s,onvidar|6n,tirizar|6,eshacer|4go,lanchar|6s,andonar|6,olocar|5s,esolver|2uelves,dvertir|2ierten,orrer|4,onjugar|5o,retener|5go,dmirar|5,ecidir|4e,omprar|5s,horrar|5n,oñar|2áis,xtender|2ienden,postar|4áis,atinar|5mos,terizar|6s,poyar|4mos,anejar|5,ompañar|6mos,ticipar|6,lantar|5,adrar|3o,egular|5,taminar|6mos,xplotar|6,ndicar|5,lenar|4s,evorar|5s,ulpar|4s,onsumir|5ís,eparar|4o,impiar|4áis,uceder|5n,endecir|5ís,sponder|5o,iquecer|6mos,egociar|6s,nseguir|5ís,iseñar|5,contrar|1uentra,liminar|6n,visar|4mos,laticar|6mos,bedecer|4zco,olgar|3áis,dornar|4o,evistar|5o,ocinar|5s,acudir|4ís,eñalar|4o,sperar|4áis,jercer|5,nfluir|4ís,positar|5áis,tilizar|6n,ncender|5éis,legrar|4áis,aciar|2ían,rever|3éis,dmitir|4ís,ituar|2úan,enovar|5mos,licitar|5o,edicar|4o,frecer|5mos,nseñar|4áis,quillar|5o,enacer|3zco,cercar|5mos,nformar|6n,divinar|6mos,reer|2o,iolar|3áis,almar|3áis,ralizar|6n,ratar|4s,onfesar|5áis,ausar|4,dificar|6s,yudar|4s,sminuir|6mos,urgir|3es,redecir|3ices,guantar|6mos,hocar|4,ruñir|3ís,vanzar|5mos,ntrolar|6s,nstruir|6mos,uemar|3áis,scoger|5,ganizar|6,roponer|6,fectuar|4úa,uardar|4áis,legir|1iges,rrollar|5áis,revivir|5ís,rseguir|5ís,ubir|2e,ntregar|6s,campar|4o,omar|2o,liviar|4áis,onvenir|3ienes,mplear|4o,nificar|6mos,nfirmar|6mos,ehusar|2úso,ombatir|5ís,rrojar|4o,ompetir|5ís,bortar|5,municar|6mos,ibujar|5mos,aludar|4áis,eplicar|5áis,aler|2go,levar|4n,umentar|6n,preciar|5o,ijar|3,nojar|4mos,nventar|6s,esentar|6s,evelar|5mos,uscar|4,uponer|4éis,ogar|2áis,rohibir|3íbes,rear|3s,orregir|3ijo,nservar|5áis,uidar|4mos,mprimir|5e,tumbrar|5áis,eriguar|6mos,raducir|6mos,sociar|5n,alir|3mos,sconder|6mos,lcanzar|6n,ograr|4n,siasmar|5áis,lquilar|6n,ermitir|5en,vejecer|4zco,oder|3mos,nhelar|4o,erdonar|6s,ontener|3iene,adurar|5,oblar|4mos,anar|3mos,avar|3s,astimar|6,nfermar|6n,ingir|3en,nversar|6n,ntinuar|6mos,ritar|3áis,ncionar|6,obrar|4s,ricular|5o,lmorzar|6mos,opiar|3o,ablar|4n,ecoger|5mos,studiar|5o,mpartir|5en,alvar|3o,arcar|4s,ealizar|5o,añer|3n,rreglar|5o,ntentar|6,ucear|4mos,oportar|6s,fligir|5mos,erder|ierdo,ncantar|5o,erminar|6s,ruzar|4,niciar|5s,echazar|6mos,espirar|6,umplir|4ís,ecibir|4en,galizar|6s,epender|6mos,quistar|6s,olestar|6mos,irigir|3jo,eredar|5n,autizar|6n,epetir|5mos,btener|4go,ravesar|3iesas,rabajar|6mos,nstalar|6mos,menazar|5áis,referir|3ieres,bolizar|5áis,plaudir|6mos,iajar|3áis,talecer|6,gistrar|5áis,xplorar|5o,omendar|2iendan,vorciar|6s,ancelar|6s,aquecer|6n,dorar|4,cabar|4n,lvidar|4áis,argar|4mos,egalar|5,ultivar|6mos,avegar|5,vacuar|5,umar|2o,sfrutar|6,elebrar|5áis,nsultar|6n,estir|isten,cificar|5o,espetar|6,ensurar|5áis,ecorar|5mos,efender|5éis,evantar|5o,ugerir|2iere,vilizar|6mos,ncluir|4yo,antener|5éis,amentar|6mos,rovocar|6s,educir|4e,ascinar|5áis,horcar|5,xponer|5,oseguir|2igues,nsuciar|6mos,erecer|5mos,nunciar|5o,arar|2áis,roducir|5e,stituir|5ye,nsar|2áis,rlar|3mos,migrar|5mos,spirar|5mos,cordar|5mos,necer|4n,parecer|6s,riar|3mos,enar|2áis,agar|3s,sitar|4mos,igar|2o,asar|3,traer|4n,ustar|3áis,vocar|3o,tender|5mos,pretar|4áis,clar|2o,nducir|4ís,mer|2n,vencer|3zo,untar|4s,volver|1uelve,testar|4o,acar|3n,adir|2ís,scar|3mos,resar|4s,llar|3s,licar|4mos,ibir|3mos,ticar|3áis,ear|1áis,ortar|3áis,char|2áis,rir|2mos,overse|ueves,uedarse|3áis,ncearse|4,ecarse|3,reverse|3éis,lamarse|3áis,udarse|3,actarse|4mos,allarse|4mos,ullirse|3en,uejarse|4mos,rarse|2mos,tarse|2s,omit|4a",
        "exceptions": "dejar|3áis,beber|4mos,yacer|4mos,oponer|4éis,ir|voy,ser|1omos,odiar|4n,andar|3o,mandar|4áis,negar|4mos,regir|4mos,usar|3s,aprender|6éis,votar|3o,cansar|5,crecer|5,cerrar|1ierro,costar|1uesto,unir|2en,llorar|5,extinguir|7ís,desagradecer|11s,desagradar|9mos,meter|3o,errar|yerran,reservar|6o,hacer|3éis,servir|1irve,mostrar|6mos,vivir|3es,teñir|4mos,amar|3mos,afirmar|6,medir|4mos,tocar|4,jugar|2egan,saltar|4o,sentar|5mos,oír|1igo,volar|4mos,apagar|5mos,herir|1ieres,comprender|9,formar|4áis,entrar|5n,montar|5,calentar|3ientas,abordar|6s,notar|3áis,consistir|7o,pesar|4n,faltar|5n,aprobar|5áis,convertir|4ierten,huir|3mos,firmar|4o,venir|1iene,bajar|4,nadar|4n,oler|huelo,nacer|4mos,leer|3mos,jurar|4mos,coser|4,asistir|5e,tener|1ienen,matar|4mos,rezar|3o,bañar|3áis,lanzar|4áis,alentar|6mos,agradar|6s,coger|3éis,evitar|5mos,vender|5s,picar|4mos,peinar|4áis,curar|4,tirar|4s,demostrar|7áis,arrepentirse|5ientes,amanecer|5zco,poner|4s,pedir|1ides,dudar|4mos,cesar|4s,caber|quepo,caminar|5áis,durar|4mos,sorprender|8o,tardar|5n,distinguir|9mos,preservar|8mos,luchar|5s,sentirse|4ís,helar|1iela,toser|4n,insistir|6en,freír|4mos,acostar|6mos,bordar|4o,caer|3s,verificar|8mos,batir|3o,detener|3ienen,seguir|1igue,clarificar|9s,dar|2is,guiar|2ía,sonar|3áis,regar|4mos,robar|3o,mentir|1ientes,invertir|7mos,actuar|3úas,mirar|3o,distribuir|8yen,decir|4mos,saber|4s,reír|3s,agradecer|6zco,purificar|8,deber|3éis,cazar|4mos,padecer|6,sacrificar|9mos,ofender|6mos,glorificar|9,conocer|6,borrar|4o,estimar|6n,contar|5mos,cortar|5mos,probar|5mos,estar|3án,reinar|5mos,soler|1uelo,reñir|1iñe,hervir|1ierves,besar|3áis,pegar|3áis,reconocer|8n,aparecer|7,ver|2mos,contribuir|8yo,juntarse|5s,vestir|1isten",
        "rev": "nsiento|2entir,squío|3iar,onrío|3eír,ierro|errar,uesto|ostar,eto|2er,eshago|4cer,espondo|6er,onsisto|6ir,reo|2er,ehúso|2usar,algo|2er,orrijo|3egir,rprendo|6er,ato|2ir,ierdo|erder,irijo|3gir,tengo|3er,venzo|3cer,uyo|1ir,zco|cer,o|ar,ueves|overse,omos|er,viertes|1ertir,teramos|4rse,mpiezas|2ezar,uedáis|3arse,uermes|ormir,suelves|1olver,ives|2ir,trevéis|4erse,paramos|4rse,lamáis|3arse,lientas|1entar,actamos|4rse,urges|3ir,redices|3ecir,liges|1egir,endes|4r,nvienes|2enir,allamos|4rse,feitas|5rse,rohíbes|3ibir,pientes|1entirse,ones|3r,ides|edir,uejamos|4rse,aes|2r,ais|1r,ctúas|2uar,abes|3r,eís|2r,aviesas|2esar,ierves|ervir,osigues|2eguir,ieres|erir,eces|3r,éis|er,ís|ir,as|1r,áis|ar,mos|r,espide|3edir,uerce|orcer,errite|3etir,romete|6r,sciende|2ender,irve|ervir,orre|4r,ecide|4ir,mprende|7r,ose|3r,siste|4ir,scoge|5r,ube|2ir,mprime|5ir,ontiene|3ener,igue|eguir,iñe|eñir,ugiere|2erir,stituye|5ir,vuelve|1olver,pone|4r,duce|3ir,ce|2r,spierta|2ertar,roncea|6rse,eca|3rse,cuentra|1ontrar,uda|3rse,omita|4,fectúa|4uar,iela|elar,uía|1iar,a|1r,uiebran|1ebrar,uieren|1erer,tienden|1ender,uegan|1gar,itúan|2uar,ermiten|5ir,mbullen|5irse,ingen|3ir,nsisten|5ir,mparten|5ir,eciben|4ir,ribuyen|4ir,miendan|1endar,stán|2ar,ían|iar,vierten|1ertir,tienen|1ener,n|r"
      },
      "second": {
        "rules": "bicar|4n,abricar|5áis,apar|2o,ceptar|4o,nsentir|2iente,eclarar|5o,astar|3áis,estigar|6s,omponer|6s,omenzar|2ienzas,raduar|3úan,lorecer|5éis,ivertir|2ierten,eprimir|5es,roteger|5éis,sificar|6,intar|3o,egresar|6mos,squiar|3ía,espedir|3ido,ontecer|4zco,spertar|2iertan,ducar|4s,estruir|5yo,onfiar|3ía,lonizar|6mos,namorar|5o,ufrir|3o,onsejar|5áis,lustrar|6s,alcular|6s,egatear|6mos,omper|4s,ailar|4,orcer|uerces,arrer|4s,mpezar|2iezo,epasar|5s,ablecer|4zco,ormir|uermen,ropezar|3iezas,rindar|5,erendar|5áis,urlar|3áis,nviar|2ías,obernar|2iernan,xigir|4mos,riunfar|6s,nmigrar|6s,uebrar|1iebro,uerer|1ieres,nfadar|4áis,sayunar|6n,esultar|6,rometer|5o,gorar|1üeras,legar|4s,isfacer|6n,brazar|5s,scender|2iendo,busar|4n,onvidar|6s,tirizar|5o,eshacer|6mos,lanchar|6n,andonar|5o,olocar|5n,uspirar|6s,esolver|6mos,dvertir|2iertes,orrer|3o,onjugar|6,retener|3iene,dmirar|4áis,rrachar|6,ecidir|4ís,omprar|5n,horrar|5s,oñar|3mos,xtender|2iendes,postar|1uestan,atinar|4áis,terizar|6n,poyar|4,cesitar|6s,anejar|5s,ticipar|5o,ariar|2ía,lantar|4o,adrar|4,egular|4o,bligar|5,taminar|6s,xplotar|5o,ndicar|4o,lenar|4n,evorar|5n,ulpar|4n,onsumir|5o,impiar|4o,uceder|5s,ublicar|5áis,ntender|2ienden,sponder|6,esear|4mos,iquecer|6,egociar|6n,nseguir|2iguen,rpretar|5o,contrar|1uentro,liminar|6s,visar|4s,laticar|5áis,bedecer|6mos,olgar|uelgo,dornar|5,evistar|6,ocinar|4áis,acudir|5mos,sperar|4o,jercer|5mos,nfluir|4yen,positar|5o,tilizar|6mos,ncender|2iende,legrar|5n,aciar|2ías,rever|3é,dmitir|5mos,ituar|2úas,enovar|4áis,licitar|6,edicar|5,ezclar|5,frecer|5n,onducir|6mos,quillar|6,enacer|5s,cercar|4áis,nformar|6s,divinar|5áis,iolar|4s,almar|4,ralizar|6s,onfesar|3iesas,ausar|3áis,dificar|5áis,yudar|4n,sminuir|5ís,urgir|3en,redecir|3icen,guantar|5áis,hocar|3o,ruñir|3en,equerir|3iere,ntrolar|6n,nstruir|5yen,ondenar|6,uemar|4mos,scoger|5mos,eguntar|6n,ganizar|5o,roponer|5go,fectuar|4úo,uardar|4o,legir|1igen,rseguir|2igo,ubir|2o,ntregar|6n,campar|5,omar|3,liviar|5,onvenir|3ienen,nificar|5o,ehusar|2úsa,ombatir|6mos,rrojar|5,bortar|4o,municar|5o,ibujar|5s,aludar|5mos,eplicar|6s,aler|3n,levar|4s,umentar|6s,preciar|6,ijar|2o,nojar|3o,nventar|5o,esentar|6n,evelar|4o,uscar|3o,uponer|5,ogar|uegas,rohibir|3íben,rear|3n,nservar|6s,uidar|4n,mprimir|5o,tumbrar|5o,eriguar|6,raducir|4zco,sociar|5s,alir|2es,sconder|6n,burrir|4en,ograr|4s,siasmar|6mos,lquilar|6s,ermitir|5es,orir|ueren,vejecer|6n,oder|uedo,nhelar|5,erdonar|6n,ecordar|2uerdan,ontener|3ienen,adurar|5mos,oblar|4,hismear|6mos,anar|3n,avar|3n,astimar|5o,nfermar|6s,ingir|3es,nversar|5o,ntinuar|5áis,ncionar|5o,obrar|4n,ricular|6,lmorzar|2uerzan,opiar|4,ablar|4s,ecoger|5,mpartir|5es,alvar|4,arcar|4n,ealizar|6,añer|3s,rreglar|6,ntentar|5o,ucear|3áis,oportar|6n,fligir|3jo,erder|ierde,ncantar|6n,erminar|6n,ruzar|3o,niciar|5n,echazar|6s,ragar|4,espirar|5o,umplir|4e,ecibir|4es,ñadir|4mos,galizar|6n,epender|6,quistar|6n,olestar|5o,irigir|4ís,eredar|5s,autizar|6s,nvadir|4es,epetir|2iten,btener|5mos,xhibir|4ís,ravesar|3iesan,rabajar|6n,menazar|6,referir|6mos,scuchar|6,bolizar|6mos,teresar|6,plaudir|5o,talecer|5éis,gistrar|5o,xplorar|6s,omendar|2iendas,vorciar|6n,ancelar|6n,aquecer|6s,dorar|3o,cabar|4s,lvidar|4o,argar|3áis,eciclar|5áis,egalar|4o,ultivar|6n,avegar|4o,vacuar|4o,umar|3,sfrutar|5o,xpresar|6n,elebrar|6mos,nsultar|6s,estir|istes,cificar|6,espetar|6s,ensurar|6n,ecorar|5s,efender|2iendo,evantar|6,ugerir|2iero,vilizar|5o,ncluir|4ye,antener|3iene,harlar|5,amentar|6n,astigar|6n,tacar|4s,rovocar|6n,educir|4ís,ascinar|6s,horcar|4o,xponer|4go,oseguir|2iguen,nsuciar|5áis,erecer|4éis,diar|3,entir|ienten,stituir|5yo,nsar|3mos,reír|1íe,etir|ito,añar|3s,ustar|4,eservar|6,firmar|4o,asar|2o,traer|4s,parar|4,vocar|4,decir|1igo,lear|3,señar|3o,probar|2ueban,alar|3s,ajar|3s,eer|2,mer|2s,plicar|5n,atar|2áis,vencer|4éis,anzar|4s,volver|1uelvo,regir|3ís,aber|3n,brir|2en,scar|3,conocer|5éis,testar|5,portar|5mos,adecer|5n,necer|4s,vir|2mos,ticar|4mos,rificar|5o,llar|3n,itar|3n,overse|ueven,terarse|3áis,uedarse|4,ncearse|3o,ecarse|2o,reverse|4mos,pararse|4n,lamarse|4s,udarse|2o,actarse|3o,allarse|3áis,ullirse|3o,uejarse|3o,tarse|2n,omit|4o",
        "exceptions": "dejar|4,beber|3éis,renunciar|8s,yacer|4s,oponer|5mos,ir|vais,ser|es,andar|4,mandar|5s,negar|1iegan,introducir|8es,usar|2áis,aprender|7n,votar|4,cansar|4o,parecer|6mos,crecer|3zco,cerrar|1ierra,costar|1uesta,unir|2es,llorar|5n,extinguir|7e,desagradar|9s,meter|4s,errar|yerras,acordar|2uerdas,hacer|2go,servir|1irvo,mostrar|1uestra,desaparecer|10n,criar|3áis,teñir|1iñen,cenar|3o,pagar|4n,amar|2o,medir|3ís,tocar|4n,jugar|2egas,saltar|5mos,sentar|1ientas,oír|2s,volar|3áis,apagar|4áis,herir|1ieren,comprender|9mos,formar|5mos,entrar|4áis,montar|4o,calentar|3ientan,abordar|6n,notar|4s,consistir|7e,pesar|4s,faltar|5s,convertir|7ís,huir|2yes,firmar|5,venir|3go,nadar|4s,oler|huele,aspirar|5áis,nacer|4,describir|7o,jurar|3o,coser|3o,asistir|5o,tener|1ienes,rezar|4,bañar|4mos,lanzar|5mos,alentar|2ienta,agradar|6n,coger|4n,vender|5n,picar|3áis,peinar|5,curar|3o,echar|4mos,tirar|4n,demostrar|8mos,arrepentirse|5ienten,poner|4n,acortar|5o,pedir|1iden,dudar|3áis,cesar|4,cubrir|4es,caminar|6,durar|4s,sorprender|9,tardar|5s,distinguir|8ís,luchar|5n,sentirse|5mos,helar|1ielan,toser|3éis,insistir|6ís,acostar|2uesto,bordar|5,apretar|3ieto,caer|3n,verificar|8,batir|3e,detener|3ienes,seguir|1igues,clarificar|9n,dar|2,guiar|2ías,duchar|5mos,sonar|1uenas,escribir|6ís,regar|3áis,robar|4,sacar|4,invertir|3ierten,actuar|3úan,mirar|4,distribuir|8ís,atender|5éis,reír|1íen,deber|4mos,cazar|4,ofender|6,untar|4mos,borrar|5,estimar|6s,contar|4áis,cortar|4áis,estar|3ás,reinar|4áis,soler|1uele,anunciar|7,producir|5zco,reñir|1iño,besar|4,pegar|4s,gustar|5mos,aparecer|6éis,emigrar|5áis,ver|2n,contribuir|8ye,inducir|4zco,juntarse|5n,mudarse|3o,rogar|1uegas",
        "rev": "nsiente|2entir,xtingue|6ir,nciende|2ender,equiere|3erir,upone|5r,ecoge|5r,ierde|erder,umple|4ir,ríe|1eír,tiene|1ener,ce|2r,te|1ir,ee|2r,uye|1ir,nde|3r,ompones|6r,mienzas|1enzar,nteráis|4arse,eprimes|5ir,roduces|5ir,ompes|4r,uerces|orcer,arres|4r,opiezas|2ezar,uieres|1erer,güeras|1orar,etes|3r,cuerdas|1ordar,viertes|1ertir,revemos|4rse,tiendes|1ender,ientas|entar,lamas|4rse,ucedes|5r,uyes|1ir,itúas|2uar,nfiesas|2esar,alláis|3arse,ales|2ir,ermites|5ir,ubres|3ir,entimos|4rse,inges|3ir,mpartes|5ir,igues|eguir,añes|3r,uenas|onar,ecibes|4ir,nvades|4ir,miendas|1endar,stás|2ar,istes|estir,traes|4r,mes|2r,tienes|1ener,ías|iar,ces|2r,éis|er,ís|ir,áis|ar,mos|r,as|1r,ueven|overse,iegan|egar,piertan|1ertar,uermen|ormir,biernan|1ernar,iñen|eñir,puestan|1ostar,reparan|6rse,ieren|erir,lientan|1entar,tienden|1ender,urgen|3ir,redicen|3ecir,ruñen|3ir,ligen|1egir,nvienen|2enir,feitan|5rse,rohíben|3ibir,pienten|1entirse,iden|edir,ueren|orir,cuerdan|1ordar,ntienen|2ener,ielan|elar,muerzan|1orzar,íen|eír,epiten|2etir,aviesan|2esar,úan|uar,vierten|1ertir,ienten|entir,siguen|1eguir,prueban|2obar,uyen|1ir,ren|1ir,n|r,espido|3edir,ufro|3ir,mpiezo|2ezar,errito|3etir,ronceo|5arse,uiebro|1ebrar,rometo|5er,eco|2arse,ago|1cer,irvo|ervir,orro|3er,onsumo|5ir,cuentro|1ontrar,uelgo|olgar,engo|2ir,oso|2er,acto|3arse,sisto|4ir,omito|4,fectúo|4uar,ersigo|3eguir,ompito|3etir,mprimo|5ir,uedo|oder,ambullo|6irse,cuesto|1ostar,uejo|3arse,prieto|2etar,flijo|3gir,plaudo|5ir,iño|eñir,ugiero|2erir,iendo|ender,digo|1ecir,bo|1ir,pongo|3er,vuelvo|1olver,ezco|1cer,uyo|1ir,duzco|2cir,o|ar,ierra|errar,uesta|ostar,ueda|4rse,uestra|ostrar,lienta|1entar,ehúsa|2usar,ía|iar,a|1r,revé|3er"
      },
      "third": {
        "rules": "bicar|4mos,abricar|6s,apar|2áis,ceptar|5,nsentir|5ís,eclarar|6,astar|3o,estigar|5áis,omponer|6n,omenzar|2ienzan,raduar|3úas,lorecer|6s,esentir|2ientes,eprimir|5en,roteger|6s,sificar|5o,intar|4mos,squiar|5mos,espedir|5ís,ontecer|5éis,otestar|5o,spertar|2iertas,ducar|4n,estruir|5ye,onfiar|3ío,lonizar|6s,namorar|6,ufrir|3e,onsejar|6mos,lustrar|5o,alcular|6n,egatear|5o,ensar|iensas,omper|4,ailar|4mos,orcer|uercen,onreír|3íes,epillar|6mos,eportar|6s,arrer|4n,mpezar|2ieza,epasar|5mos,mportar|6s,ablecer|6,ormir|4mos,erretir|6mos,allar|3áis,ropezar|3iezan,rindar|4o,nvitar|5,erendar|2iendan,ngañar|4áis,urlar|4s,nviar|3áis,obernar|2iernas,xigir|2jo,riunfar|5o,uebrar|1iebras,uerer|3éis,nfadar|4o,sayunar|5o,esultar|5o,rometer|5éis,gorar|1üeran,legar|4n,isfacer|4go,brazar|5mos,scender|6mos,busar|4mos,onvidar|5áis,tirizar|6mos,eshacer|5éis,lanchar|5o,andonar|6s,olocar|4áis,uspirar|6,esolver|2uelven,orrer|4mos,xportar|6,onjugar|6s,retener|3ienen,dmirar|4o,rrachar|6s,ecidir|4o,omprar|4áis,oñar|ueña,xtender|5éis,postar|1uestas,atinar|4o,terizar|5áis,poyar|3o,cesitar|6n,anejar|5n,ompañar|6n,ticipar|6n,ariar|2ío,lantar|5mos,adrar|4mos,bligar|5mos,taminar|6n,xplotar|6mos,ndicar|4áis,lenar|3áis,evorar|4o,ulpar|3áis,onsumir|5e,eparar|5s,impiar|5,uceder|5mos,uivocar|6n,ublicar|6s,endecir|6mos,ntender|2iendes,esear|4n,elear|3o,iquecer|6n,egociar|6mos,nseguir|2igues,rpretar|6,contrar|1uentran,liminar|5áis,visar|4n,laticar|6s,bedecer|6,olgar|uelga,dornar|5n,evistar|6mos,ocinar|5,sperar|5,jercer|4éis,nfluir|5mos,positar|6,tilizar|5o,ncender|2iendo,legrar|5s,aciar|4mos,rever|4o,dmitir|4en,ituar|2úa,enovar|2uevo,licitar|6mos,edicar|5mos,frecer|5s,onducir|5e,quillar|6n,cercar|4o,emer|3mos,nformar|5o,divinar|5o,reer|3n,iolar|4n,almar|3o,ralizar|6mos,xplicar|5áis,ratar|4n,onfesar|3iesan,ausar|4mos,dificar|6n,yudar|3áis,sminuir|5ye,urgir|3ís,redecir|3igo,guantar|5o,hocar|4s,ruñir|3es,vanzar|5n,equerir|3iero,ntrolar|6mos,nstruir|5yes,asticar|6,ondenar|5o,uemar|4n,scoger|4éis,eguntar|6mos,ganizar|6mos,roponer|5éis,fectuar|4úas,uardar|5n,legir|3ís,rrollar|6s,revivir|5e,rillar|4o,rseguir|6mos,ubir|3mos,ntregar|5áis,campar|5n,omar|3s,liviar|4o,onvenir|5go,mplear|4áis,nificar|5áis,nfirmar|6,ehusar|4áis,ombatir|5e,rrojar|5mos,bortar|4áis,municar|6,ibujar|5n,evolver|6mos,eplicar|6n,levar|4mos,umentar|6mos,preciar|5áis,ijar|3mos,nojar|4,nventar|6mos,esentar|5áis,evelar|5,uscar|4n,uponer|5n,ogar|uegan,rohibir|3íbo,rear|2o,orregir|6mos,nservar|6n,omer|2éis,uidar|4s,mprimir|5ís,tumbrar|6,eriguar|5o,raducir|5ís,sociar|4o,alir|2en,lcanzar|5áis,burrir|4es,ograr|4,siasmar|6,lquilar|6,ermitir|6mos,orir|ueres,vejecer|6,oder|uede,scansar|6n,nhelar|5mos,erdonar|6,ecordar|2uerdas,ontener|3ienes,adurar|4áis,etestar|6mos,oblar|3o,hismear|6s,anar|3s,avar|2o,astimar|5áis,nfermar|5o,ingir|3ís,nversar|6,ntinuar|4úan,ritar|4s,ncionar|6mos,obrar|4mos,lmorzar|2uerzas,opiar|4n,ablar|3áis,ecoger|3jo,studiar|6mos,alvar|4n,ealizar|5áis,añer|2éis,rreglar|6n,ntentar|6n,ucear|4,oportar|6mos,erder|4mos,ncantar|6s,erminar|5o,ruzar|4n,niciar|5,echazar|6n,espirar|6mos,umplir|4es,ecibir|5mos,ñadir|3es,galizar|5o,epender|5éis,quistar|5áis,olestar|6,nvocar|5s,acticar|6s,riticar|5o,eredar|4o,autizar|5áis,nvadir|4en,btener|2iene,ntestar|6s,xhibir|4o,ravesar|3iesa,rabajar|6s,menazar|6s,referir|3ieren,scuchar|5o,bolizar|6s,iajar|4n,talecer|6s,gistrar|6,xplorar|6n,omendar|5áis,vorciar|5o,ancelar|5o,isitar|4áis,aquecer|5éis,dorar|3áis,cabar|3o,lvidar|5,argar|4n,egalar|4áis,ultivar|6s,avegar|5mos,vacuar|4áis,umar|2áis,sfrutar|6mos,elebrar|6s,nsultar|5áis,estir|4mos,cificar|5áis,espetar|6n,ensurar|6s,ecorar|5n,efender|2iende,evantar|5áis,ugerir|4ís,vilizar|6,ncluir|4ís,antener|3ienen,harlar|4o,amentar|6s,astigar|6s,tacar|3áis,rovocar|5áis,educir|4es,ascinar|6n,xponer|4éis,oseguir|2igo,nsuciar|6s,erecer|5,nunciar|6n,prender|6s,otar|3n,migrar|5n,ustar|3o,necer|4mos,parecer|5éis,orrar|4mos,firmar|5mos,ular|3s,asar|2áis,agar|2o,alentar|2iento,onder|4s,señar|4mos,probar|2uebas,udir|2e,alar|3n,ler|2mos,clar|3n,aer|2,oser|3s,nacer|4n,vencer|5mos,petir|1ite,udar|2o,brir|2es,rcar|3mos,igir|2e,adecer|5s,scar|2o,rtir|3mos,resar|3o,vir|1ís,overse|uevo,terarse|4n,uedarse|3o,ncearse|3áis,ecarse|3mos,reverse|4,pararse|4s,lamarse|4n,udarse|3n,actarse|4,allarse|4s,ullirse|4mos,uejarse|4,tarse|2mos,omit|4as",
        "exceptions": "dejar|3o,beber|4n,yacer|4n,oponer|5n,ir|va,ser|1ois,odiar|3o,andar|3áis,mandar|5n,negar|1iegas,introducir|8en,regir|1ige,usar|2o,constituir|8yen,cansar|4áis,crecer|5n,cerrar|4áis,costar|5mos,unir|3mos,llorar|5s,extinguir|7en,desagradecer|9zco,desagradar|9n,meter|4n,errar|yerro,acordar|2uerdan,reservar|7s,hacer|4s,mostrar|1uestro,criar|2ías,teñir|1iñes,cenar|4,pagar|4mos,amar|3,medir|1iden,tocar|4s,jugar|4mos,saltar|5s,sentar|1ientan,oír|1ye,volar|1uela,atraer|5mos,herir|1iere,formar|5s,entrar|5s,montar|5n,abordar|5áis,consistir|7es,pesar|4,faltar|5,convertir|4ierte,huir|2yen,venir|1ienen,bajar|3o,nadar|3o,aspirar|6n,describir|7e,leer|2o,jurar|4n,asistir|5ís,tener|4mos,matar|4,rezar|4s,bañar|3o,lanzar|4o,agradar|5áis,coger|4s,sustituir|8mos,evitar|5s,vender|5mos,picar|3o,peinar|4o,curar|3áis,echar|4,tirar|4mos,demostrar|3uestra,arrepentirse|8ís,amanecer|7n,poner|4mos,acortar|6,pedir|1ido,cesar|3o,cubrir|4en,caber|4s,caminar|5o,durar|4n,sorprender|9mos,tardar|5mos,distinguir|7o,preservar|7o,luchar|5mos,sentirse|1iente,helar|1ielas,insistir|6o,freír|2ío,acostar|2uesta,bordar|5mos,aplicar|6s,apretar|3ieta,verificar|7o,batir|3es,detener|3iene,seguir|1iguen,clarificar|9mos,dar|1oy,guiar|2ían,duchar|5s,sonar|4mos,escribir|6en,regar|1iego,robar|3áis,sacar|3o,mentir|5mos,invertir|3iertes,actuar|5mos,mirar|3áis,distribuir|8yes,volver|4éis,decir|1icen,atender|2iendo,saber|3éis,reír|3mos,purificar|7áis,deber|3o,cazar|3o,sacrificar|9,ofender|5o,glorificar|8áis,parar|3o,conocer|6mos,untar|4n,estimar|6mos,contar|1uentas,cortar|4o,estar|4mos,reinar|5s,soler|1ueles,producir|6ís,reñir|4mos,besar|4n,pegar|4n,gustar|5s,reconocer|8,aparecer|7n,ver|2,contribuir|8ís,inducir|5es,moverse|1uevo,juntarse|5mos,prepararse|7s",
        "rev": "mienzan|1enzar,nteran|5rse,eprimen|5ir,roducen|5ir,uercen|orcer,opiezan|2ezar,riendan|1endar,tinguen|5ir,güeran|1orar,suelven|1olver,cuerdan|1ordar,iden|edir,ientan|entar,laman|4rse,uentran|ontrar,dmiten|4ir,udan|3rse,nfiesan|2esar,uegan|ogar,alen|2ir,ubren|3ir,ntinúan|4uar,iguen|eguir,uían|1iar,scriben|5ir,icen|ecir,nvaden|4ir,efieren|2erir,uyen|1ir,tienen|1ener,n|r,ois|er,sientes|1entir,iegas|egar,piertas|1ertar,iensas|ensar,onríes|3eír,biernas|1ernar,onceáis|4arse,uiebras|1ebrar,ecamos|3rse,rías|1iar,iñes|eñir,puestas|1ostar,tiendes|1ender,nsigues|2eguir,nsistes|5ir,omitas|4,ruñes|3ir,allas|4rse,eitamos|4rse,epentís|5irse,ueres|orir,abes|3r,cuerdas|1ordar,ntienes|2ener,ullimos|4rse,ielas|elar,muerzas|1orzar,ates|2ir,umples|4ir,viertes|1ertir,ñades|3ir,uentas|ontar,ueles|oler,úas|uar,ges|2r,pruebas|2obar,oses|3r,uyes|1ir,duces|3ir,res|1ir,ndes|3r,ces|2r,ís|ir,éis|er,as|1r,áis|ar,mos|r,ufre|3ir,ompe|4r,treve|5rse,iere|erir,onsume|5ir,nvierte|2ertir,onduce|5ir,escribe|6ir,brevive|6ir,ombate|5ir,uede|oder,iente|entirse,efiende|2ender,uye|1ir,ude|2ir,ae|2r,pite|1etir,tiene|1ener,ige|2ir,ce|2r,mpieza|2ezar,ueña|oñar,uela|olar,uelga|olgar,itúa|2uar,acta|4rse,muestra|1ostrar,cuesta|1ostar,ueja|4rse,prieta|2etar,raviesa|3esar,a|1r,uedo|3arse,xijo|2gir,radezco|4cer,tisfago|5cer,uestro|ostrar,ecido|4ir,reveo|4r,enuevo|2ovar,redigo|3ecir,equiero|3erir,onvengo|5ir,rohíbo|3ibir,istingo|6uir,nsisto|5ir,ecojo|3ger,iego|egar,ebo|2er,xhibo|4ir,fendo|4er,rosigo|3eguir,ío|iar,aliento|2entar,iendo|ender,o|ar,oy|ar"
      },
      "firstPlural": {
        "rules": "bicar|3o,abricar|6n,ceptar|5mos,nsentir|6mos,eclarar|6s,astar|4,estigar|6mos,omponer|6mos,omenzar|2ienza,raduar|3úa,lorecer|6n,ivertir|5ís,esentir|2iente,eprimir|5e,roteger|6n,sificar|6mos,intar|3áis,squiar|3ías,espedir|3iden,ontecer|6n,otestar|5áis,spertar|6mos,ducar|4mos,estruir|6mos,onfiar|5mos,namorar|5áis,ufrir|3en,onsejar|6s,lustrar|6,egatear|6,ensar|iensan,omper|3o,ailar|4s,orcer|4mos,onreír|3íen,epillar|5áis,eportar|6n,arrer|4mos,mpezar|2iezan,epasar|4áis,mportar|6n,ablecer|5éis,ormir|3ís,erretir|3iten,allar|4,ropezar|3iezo,rindar|4áis,nvitar|4o,erendar|2iendas,ngañar|5mos,urlar|4n,nviar|4mos,obernar|2ierno,xigir|3e,riunfar|6,nmigrar|5áis,uebrar|4áis,uerer|1iero,nfadar|5mos,sayunar|6,esultar|5áis,rometer|6s,gorar|1üera,legar|4,isfacer|6mos,scender|5éis,busar|4,onvidar|5o,tirizar|5áis,eshacer|6,lanchar|6,andonar|6n,olocar|4o,uspirar|5o,dvertir|2ierte,orrer|3éis,xportar|5o,onjugar|6n,retener|3ienes,dmirar|5s,rrachar|6n,tenecer|4zco,ecidir|4es,omprar|4o,horrar|4o,oñar|ueño,xtender|6mos,postar|5mos,atinar|5,terizar|5o,poyar|3áis,anejar|4o,ompañar|5o,lantar|5s,adrar|4n,bligar|5s,taminar|5áis,xplotar|5áis,ndicar|5n,evorar|4áis,ulpar|3o,onsumir|5es,eparar|5n,sustar|5mos,uceder|4o,uivocar|6s,ublicar|6n,endecir|3icen,sponder|6n,esear|4s,elear|4s,iquecer|6s,egociar|5áis,nseguir|6mos,rpretar|6n,contrar|1uentras,liminar|5o,visar|4,laticar|6n,bedecer|6s,olgar|uelgan,dornar|5s,evistar|6s,acudir|4en,eñalar|5mos,sperar|5n,jercer|3zo,nfluir|4yo,positar|6n,tilizar|6,ncender|6mos,legrar|4o,aciar|3áis,rever|3és,dmitir|4es,ituar|2úo,enovar|2ueva,licitar|6n,edicar|5s,frecer|5,quillar|6mos,enacer|5mos,cercar|5,emer|3,divinar|6,iolar|4mos,almar|4s,xplicar|6s,ratar|4mos,onfesar|6mos,ausar|4s,nvencer|6s,dificar|5o,yudar|3o,sminuir|5yo,urgir|4mos,redecir|5ís,guantar|6,hocar|4n,ruñir|4mos,equerir|5ís,ntrolar|5áis,nstruir|5yo,asticar|6s,uemar|4s,scoger|5n,eguntar|5o,roponer|6mos,fectuar|4úan,uardar|5s,rrollar|5o,revivir|5o,rillar|5,rseguir|2igue,ubir|2ís,ntregar|6,omar|2áis,liviar|5s,onvenir|6mos,mplear|5n,nificar|6n,nfirmar|5áis,ehusar|5mos,ombatir|5o,ompetir|3ites,bortar|5mos,municar|5áis,ibujar|5,aludar|5n,eplicar|6mos,aler|3s,levar|3áis,preciar|6n,ijar|3s,nventar|6,esentar|6mos,evelar|5n,uscar|4s,uponer|5s,ogar|uego,rohibir|3íbe,rear|3,orregir|3igen,nservar|6mos,omer|3mos,uidar|3áis,mprimir|6mos,tumbrar|6mos,eriguar|6n,sociar|5,alir|2go,sconder|5o,burrir|4e,ograr|3o,siasmar|6n,lquilar|5o,ermitir|5ís,orir|uere,vejecer|6s,oder|uedes,nhelar|4áis,erdonar|5o,ecordar|2uerda,ontener|5go,adurar|4o,etestar|6s,oblar|4s,hismear|6n,anar|3,avar|3,astimar|6mos,nfermar|6,ingir|4mos,nversar|6mos,scubrir|5ís,ntinuar|4úas,ritar|4mos,ncionar|6s,obrar|4,ricular|6n,lmorzar|2uerza,ablar|4mos,ecoger|5s,studiar|6s,mpartir|5e,alvar|4s,arcar|3o,ealizar|6s,añer|2o,rreglar|6s,ntentar|6s,ucear|3o,oportar|5o,fligir|4ís,erder|3éis,ncantar|6mos,erminar|6,ruzar|4s,niciar|4o,espirar|5áis,umplir|4en,ecibir|4e,ñadir|3en,epender|6n,quistar|6mos,olestar|5áis,irigir|4es,nvocar|5n,acticar|6n,riticar|6,eredar|5,autizar|6mos,nvadir|4o,epetir|2ito,btener|2ienes,ntestar|6mos,xhibir|4e,ravesar|3ieso,rabajar|5áis,nstalar|5o,menazar|6n,escar|3áis,referir|3iere,scuchar|6s,bolizar|6n,teresar|6mos,plaudir|5es,iajar|3o,talecer|6n,gistrar|6s,xplorar|6,omendar|2ienda,vorciar|6,ancelar|6,aquecer|6mos,dorar|4mos,cabar|3áis,lvidar|5mos,argar|3o,egalar|5n,ultivar|6,avegar|5s,vacuar|5s,umar|3s,sfrutar|5áis,elebrar|6n,nsultar|5o,estir|3ís,cificar|6s,espetar|5o,ensurar|6mos,ecorar|5,efender|6mos,evantar|6mos,ugerir|2ieren,vilizar|6s,nfiscar|6n,ncluir|4yen,antener|3ienes,harlar|4áis,astigar|6,tacar|3o,rovocar|6mos,horcar|4áis,xponer|5s,oseguir|5ís,nsuciar|6n,erecer|5s,egir|ijo,resar|4,nizar|4n,ular|3mos,radecer|6,gustar|5n,olver|3éis,eservar|6n,riar|1ían,agar|2áis,sitar|3o,aer|1igo,enar|3mos,piar|3s,alentar|5áis,tender|1iende,señar|4n,cinar|3o,clar|3s,scribir|5es,eer|2s,formar|5,alizar|5,einar|4n,ojar|2áis,mentar|4áis,cansar|5s,brir|2e,tribuir|6mos,conocer|4zco,par|2s,azar|2áis,anzar|4,rificar|6s,ducir|3en,overse|ueve,terarse|4s,uedarse|4n,ncearse|4n,ecarse|3n,reverse|3o,pararse|4,lamarse|4,udarse|3s,allarse|3o,eitarse|4,ullirse|3ís,uejarse|4n,tarse|1áis,omit|4an",
        "exceptions": "dejar|4mos,beber|4s,renunciar|8,yacer|2zco,oponer|5s,ir|van,ser|eres,odiar|3áis,andar|4mos,mandar|5,negar|3áis,introducir|7zco,usar|3mos,constituir|8yes,aprender|7mos,votar|4s,parecer|4zco,crecer|5s,cerrar|5mos,costar|4áis,unir|2e,llorar|4áis,extinguir|7es,desagradar|8áis,meter|4,errar|yerra,acordar|5áis,hacer|4n,servir|1irves,permanecer|8éis,mostrar|5áis,desaparecer|10mos,vivir|3en,teñir|3ís,cenar|4s,amar|3n,afirmar|6s,medir|1ides,tocar|3o,jugar|3áis,saltar|5n,sentar|1ienta,oír|1yen,volar|1uelo,casar|4mos,apagar|5,herir|1iero,comprender|9n,entrar|5mos,montar|5s,abordar|6mos,notar|4mos,consistir|7en,pesar|3o,faltar|4o,aprobar|6mos,convertir|4ierto,huir|2ís,firmar|5n,venir|1ienes,bajar|4mos,nadar|4,oler|2éis,aspirar|6s,nacer|4s,traer|4mos,jurar|4s,coser|4n,asistir|5es,tener|1iene,matar|3o,rezar|4mos,bañar|4,agradar|5o,coger|2jo,sustituir|7ís,evitar|4áis,vender|4o,picar|4,curar|4mos,echar|3o,tirar|4,demostrar|3uestro,arrepentirse|9mos,pasar|4n,amanecer|7,poner|4,acortar|6n,pedir|1ide,dudar|4,cesar|4n,caber|4,caminar|6mos,durar|3áis,sorprender|9s,tardar|4áis,distinguir|8e,luchar|4áis,sentirse|1iento,helar|1ielo,toser|4mos,insistir|6e,freír|4s,acostar|2uestas,bordar|4áis,aplicar|5áis,apretar|6mos,batir|3en,detener|5go,seguir|1igo,clarificar|8áis,dar|2mos,guiar|2ío,duchar|5n,sonar|1uenan,regar|1iega,robar|4n,sacar|3áis,mentir|4ís,invertir|6ís,actuar|3úa,mirar|4mos,volver|5mos,decir|1ices,saber|1é,reír|1íe,vencer|5,purificar|8n,deber|4,padecer|4zco,ofender|5éis,parar|4mos,untar|4,borrar|5n,estimar|5áis,contar|1uentan,cortar|5,probar|4áis,estar|3á,soler|1uelen,anunciar|7s,producir|7mos,reñir|1iñen,hervir|1ierve,besar|4s,pegar|3o,aparecer|7s,emigrar|6s,ver|2is,tañer|3o",
        "rev": "ebes|3r,nteras|5rse,squías|3iar,tituyes|4ir,riendas|1endar,tingues|5ir,rometes|6r,irves|ervir,ecides|4ir,untáis|3arse,onsumes|5ir,uentras|ontrar,revés|3er,dmites|4ir,udas|3rse,actáis|3arse,sistes|4ir,ompites|3etir,ales|3r,uedes|oder,prendes|6r,mbullís|5irse,ntinúas|4uar,reís|3r,cuestas|1ostar,ecoges|5r,ices|ecir,iriges|4ir,plaudes|5ir,eis|1r,scribes|5ir,ees|2r,pones|4r,tienes|1ener,ces|2r,éis|er,ís|ir,as|1r,áis|ar,mos|r,ueve|overse,esiente|2entir,eprime|5ir,xige|3ir,ete|3r,dvierte|2ertir,eme|3r,iene|ener,ersigue|3eguir,rohíbe|3ibir,one|3r,ide|edir,uere|orir,abe|3r,stingue|6ir,nsiste|5ir,omparte|6ir,íe|eír,ebe|3r,refiere|3erir,ierve|ervir,tiende|1ender,ibe|2ir,re|1ir,ce|2r,omienza|2enzar,güera|1orar,ienta|entar,repara|6rse,lama|4rse,enueva|2ovar,feita|5rse,ecuerda|2ordar,lmuerza|2orzar,iega|egar,omienda|2endar,úa|uar,a|1r,roduzco|4cir,ompo|3er,ropiezo|3ezar,obierno|2ernar,uiero|1erer,onvido|5ar,trevo|4erse,ueño|oñar,cterizo|6ar,anejo|4ar,compaño|6ar,uelo|olar,ulpo|3ar,ucedo|4er,nvierto|2ertir,jerzo|3cer,itúo|2uar,yudo|3ar,grado|4ar,ojo|1ger,arrollo|6ar,brevivo|6ir,ombato|5ir,cho|2ar,allo|3arse,muestro|1ostrar,uego|ogar,algo|2ir,lquilo|5ar,iento|entirse,ielo|elar,arco|3ar,uío|1iar,uceo|3ar,nicio|4ar,nvado|4ir,epito|2etir,ravieso|3esar,nstalo|5ar,iajo|3ar,argo|3ar,taco|3ar,ico|2ar,ijo|egir,oco|2ar,aigo|1er,ndo|2er,tengo|3er,uyo|1ir,no|1ar,zco|cer,ro|1ar,to|1ar,espiden|3edir,ufren|3ir,iensan|ensar,onríen|3eír,mpiezan|2ezar,uedan|4rse,erriten|3etir,roncean|6rse,ecan|3rse,iven|2ir,endicen|3ecir,uelgan|olgar,acuden|4ir,omitan|4,fectúan|4uar,orrigen|3egir,uejan|4rse,uenan|onar,umplen|4ir,ñaden|3ir,uentan|ontar,uelen|oler,iñen|eñir,ugieren|2erir,ncluyen|4ir,rían|1iar,ten|1ir,ducen|3ir,n|r,é|aber,stá|2ar"
      },
      "secondPlural": {
        "rules": "bicar|4s,abricar|5o,apar|3n,ceptar|5n,nsentir|2ienten,astar|4s,estigar|5o,omponer|5éis,omenzar|2ienzo,raduar|3úo,lorecer|6,ivertir|2ierte,esentir|2iento,eprimir|5ís,roteger|4jo,sificar|6s,intar|4s,squiar|3ían,espedir|3ides,ontecer|6s,otestar|6s,spertar|5áis,ducar|3o,estruir|5yes,onfiar|3ías,lonizar|6,namorar|6s,ufrir|3es,onsejar|5o,lustrar|6mos,alcular|5o,egatear|6s,ensar|ienso,omper|4mos,ailar|4n,orcer|3éis,onreír|5s,epillar|5o,eportar|6,arrer|4,epasar|5,mportar|5o,ablecer|6s,ormir|uermo,allar|4mos,ropezar|3ieza,rindar|5n,nvitar|5mos,erendar|2ienda,urlar|3o,nviar|2ía,obernar|2ierna,riunfar|6n,uebrar|5mos,uerer|1iere,nfadar|5n,sayunar|5áis,esultar|6n,rometer|6n,gorar|1üero,legar|3áis,isfacer|6s,sgustar|6mos,brazar|5,busar|3o,onvidar|6,tirizar|6n,eshacer|6s,lanchar|5áis,andonar|5áis,olocar|5,uspirar|6n,esolver|2uelvo,dvertir|2ierto,orrer|4s,xportar|6n,onjugar|5áis,dmirar|5n,rrachar|6mos,ecidir|4en,omprar|5,horrar|5,oñar|ueñan,xtender|2iende,postar|1uesto,atinar|5n,terizar|6,poyar|4s,anejar|4áis,ticipar|6mos,ariar|3áis,adrar|4s,egular|5n,bligar|5n,taminar|5o,xplotar|6n,ndicar|5s,lenar|3o,evorar|5,ulpar|4,onsumir|5en,eparar|5mos,sustar|5n,impiar|5n,uceder|5,uivocar|5áis,ublicar|6,endecir|3ices,ntender|2iendo,sponder|5éis,esear|4,elear|4n,iquecer|5éis,egociar|5o,nseguir|2igo,iseñar|4áis,rpretar|6s,contrar|5áis,liminar|6,visar|3o,laticar|6,bedecer|6n,olgar|uelgas,dornar|5mos,evistar|6n,ocinar|5n,acudir|4es,eñalar|4áis,sperar|5s,jercer|5s,nfluir|4ye,positar|6s,tilizar|5áis,aciar|2ío,rever|3én,enovar|2uevan,licitar|6s,edicar|5n,ezclar|4áis,frecer|4éis,onducir|5es,nseñar|5s,quillar|5áis,enacer|5,cercar|5s,emer|2o,nformar|6mos,divinar|6s,reer|2éis,iolar|4,almar|4n,ralizar|5o,ratar|3o,onfesar|3ieso,ausar|4n,nvencer|6n,dificar|6,yudar|4,sminuir|5yen,urgir|2jo,redecir|6mos,hocar|4mos,ruñir|3e,equerir|3ieren,ntrolar|5o,nstruir|5ye,asticar|6n,ondenar|6s,uemar|3o,scoger|5s,eguntar|6,ganizar|6s,roponer|6s,uardar|5mos,legir|1ige,rrollar|6,revivir|5en,rillar|5mos,rseguir|2igues,ubir|2en,ntregar|5o,campar|4áis,omar|3mos,liviar|5n,onvenir|5ís,mplear|5s,nificar|6s,ehusar|2úsan,ombatir|5en,ompetir|3iten,bortar|5n,municar|6s,ibujar|4o,aludar|5s,aler|3,levar|4,preciar|6s,ijar|3n,nventar|5áis,esentar|6,evelar|5s,uscar|3áis,uponer|4go,ogar|uega,rohibir|5ís,rear|3mos,orregir|3iges,nservar|5o,omer|3,uidar|3o,mprimir|5en,tumbrar|6n,eriguar|6s,raducir|5es,alir|2ís,sconder|6,burrir|4o,ograr|3áis,siasmar|6s,lquilar|6mos,orir|uero,vejecer|6mos,oder|2éis,scansar|6,nhelar|5s,erdonar|6mos,ecordar|2uerdo,adurar|5n,oblar|4n,hismear|5o,anar|2áis,avar|2áis,astimar|6n,nfermar|6mos,ingir|3e,nversar|5áis,scubrir|5e,ntinuar|4úa,ritar|3o,ncionar|5áis,obrar|3áis,ricular|6mos,lmorzar|2uerzo,opiar|4mos,ablar|4,ecoger|5n,studiar|6n,mpartir|5o,alvar|4mos,arcar|4,ealizar|6n,añer|3mos,rreglar|5áis,ntentar|6mos,ucear|4n,oportar|6,fligir|4es,erder|ierden,ncantar|6,erminar|6mos,ruzar|4mos,echazar|5o,espirar|6s,umplir|5mos,ecibir|4o,galizar|5áis,epender|6s,quistar|5o,olestar|6s,nvocar|5mos,acticar|5o,riticar|6s,eredar|5mos,autizar|5o,btener|2ienen,xhibir|4es,ravesar|6mos,nstalar|6,menazar|6mos,referir|3iero,scuchar|6mos,bolizar|5o,plaudir|5en,talecer|6mos,gistrar|6mos,xplorar|5áis,omendar|2iendo,ancelar|6mos,aquecer|6,dorar|4s,cabar|4,lvidar|5s,argar|4,eciclar|6,egalar|5s,ultivar|5o,avegar|5n,vacuar|5n,umar|3n,sfrutar|6s,xpresar|6mos,elebrar|6,nsultar|6,estir|iste,cificar|6n,espetar|5áis,ensurar|5o,ecorar|4o,efender|2iendes,ugerir|2ieres,vilizar|6n,ncluir|4yes,harlar|5s,astigar|6mos,rovocar|6,educir|5mos,ascinar|6,horcar|5n,xponer|5n,oseguir|6mos,nsuciar|6,erecer|5n,arar|3n,resar|4n,ezar|2áis,etir|ites,añar|3,igir|2en,radecer|6mos,agradar|6,cender|1ienden,necer|3éis,parecer|4zco,firmar|5n,sitar|4,traer|3éis,agar|3n,probar|2uebo,mitir|3e,tuar|3mos,plicar|4o,anzar|3o,ojar|3n,volver|1uelves,mentar|5,mostrar|1uestran,cortar|5s,brir|2o,testar|5n,acar|3mos,adir|2e,ajar|3,scar|3s,grar|3,antar|4n,rificar|6n,tener|4mos,ciar|2áis,overse|3mos,terarse|4,uedarse|4s,ncearse|4s,ecarse|3s,reverse|4s,pararse|3o,lamarse|3o,udarse|2áis,actarse|4n,allarse|4,ullirse|3e,uejarse|4s,tarse|1o,omit|4amos",
        "exceptions": "dejar|4s,beber|4,yacer|3éis,oponer|5,ir|vas,ser|1on,odiar|4s,andar|4s,mandar|4o,negar|1iego,introducir|8ís,regir|1igen,usar|3n,constituir|9mos,aprender|7,votar|3áis,cansar|5n,parecer|6n,crecer|4éis,cerrar|1ierran,costar|1uestas,unir|2o,llorar|5mos,extinguir|6o,meter|3éis,errar|3áis,acordar|2uerda,reservar|6áis,hacer|4mos,servir|1irven,permanecer|9,criar|2ía,vivir|3e,teñir|1iño,cenar|4n,pagar|3o,amar|3s,medir|1ido,tocar|3áis,jugar|2ega,saltar|4áis,sentar|1iento,oír|1yes,volar|1uelan,casar|4n,herir|4mos,comprender|8éis,formar|5n,entrar|5,montar|4áis,calentar|7mos,abordar|6,notar|4,consistir|7ís,pesar|4mos,faltar|5mos,convertir|4iertes,huir|2yo,firmar|5s,venir|4mos,bajar|4n,nadar|3áis,oler|hueles,aspirar|5o,nacer|2zco,describir|7ís,leer|3n,jurar|4,coser|4mos,asistir|5en,tener|3go,matar|4s,bañar|4n,lanzar|5s,alentar|2ientan,coger|4,sustituir|7yes,evitar|5,vender|5,picar|4n,peinar|5s,curar|4s,echar|4n,tirar|3o,arrepentirse|5iento,pasar|4s,poner|3go,pedir|4mos,dudar|4n,cesar|3áis,caber|3éis,caminar|6n,durar|3o,sorprender|9n,tardar|5,distinguir|8es,preservar|8s,luchar|4o,sentirse|1ientes,helar|4mos,toser|3o,insistir|7mos,freír|2íes,acostar|2uestan,bordar|5s,aplicar|6,apretar|3ietas,caer|3mos,batir|4mos,seguir|4ís,clarificar|8o,dar|2n,guiar|3áis,duchar|5,sonar|1uena,escribir|6e,regar|1iegan,robar|4s,mentir|1iente,invertir|3ierte,actuar|3úo,mirar|4s,distribuir|8yo,decir|3ís,atender|2ienden,saber|4,reír|1ío,vencer|5s,purificar|8s,deber|4n,cazar|4s,padecer|5éis,ofender|6n,conocer|6s,untar|3o,borrar|5s,estimar|6,contar|1uento,estar|3áis,reinar|4o,soler|4mos,producir|6es,reñir|1iñes,hervir|1iervo,besar|3o,pegar|4,gustar|5,reconocer|8mos,ver|2s,contribuir|8yes,inducir|5e,juntarse|4o,temer|3o,rogar|1uega",
        "rev": "sienten|1entir,on|er,squían|3iar,ierran|errar,irven|ervir,eciden|4ir,ueñan|oñar,uelan|olar,revén|3er,enuevan|2ovar,actan|4rse,sisten|4ir,minuyen|4ir,quieren|2erir,lientan|1entar,reviven|5ir,uben|2ir,ehúsan|2usar,ombaten|5ir,ompiten|3etir,cuestan|1ostar,ierden|erder,iegan|egar,btienen|2ener,plauden|5ir,igen|2ir,uestran|ostrar,men|1ir,ienden|ender,n|r,vestigo|6ar,omienzo|2enzar,ando|3ar,esiento|2entir,iego|egar,rotejo|4ger,consejo|6ar,ienso|ensar,mporto|5ar,uermo|ormir,xtingo|5uir,güero|1orar,buso|3ar,esuelvo|2olver,dvierto|2ertir,iño|eñir,puesto|1ostar,ago|2ar,reparo|5arse,lamo|3arse,ntiendo|2ender,egocio|5ar,onsigo|3eguir,viso|3ar,acío|2iar,rato|3ar,onfieso|3esar,urjo|2gir,uemo|3ar,ntrego|5ar,ibujo|4ar,feito|4arse,onservo|6ar,epiento|2entirse,uido|3ar,burro|4ir,uero|orir,ecuerdo|2ordar,ucho|3ar,hismeo|5ar,rito|3ar,oso|2er,lmuerzo|2orzar,omparto|6ir,ecibo|4ir,nquisto|6ar,refiero|3erir,omiendo|2endar,uento|ontar,ultivo|5ar,ecoro|4ar,iervo|ervir,úo|uar,pruebo|2obar,uyo|1ir,iro|2ar,bro|2ir,uro|2ar,zco|cer,no|1ar,ngo|1er,lo|1ar,co|1ar,zo|1ar,ovemos|3rse,espides|3edir,onfías|3iar,ufres|3ir,onreís|5r,uestas|ostar,uedas|4rse,ronceas|6rse,ecas|3rse,orres|4r,treves|5rse,endices|3ecir,uelgas|olgar,acudes|4ir,viertes|1ertir,udáis|2arse,mitamos|3,scoges|5r,ropones|6r,rsigues|2eguir,orriges|3egir,tingues|5ir,ientes|entirse,ríes|1eír,uejas|4rse,prietas|2etar,fliges|4ir,ependes|6r,xhibes|4ir,iñes|eñir,fiendes|1ender,ugieres|2erir,ites|etir,vuelves|1olver,duces|3ir,uyes|1ir,ces|2r,ís|ir,éis|er,áis|ar,as|1r,mos|r,pone|4r,arre|4r,uiere|1erer,ive|2ir,xtiende|2ender,ruñe|3ir,oge|3r,lige|1egir,ale|3r,ome|3r,ambulle|6irse,inge|3ir,escubre|6ir,scribe|5ir,iente|entir,iste|estir,nduce|4ir,be|2r,vierte|1ertir,uye|1ir,mite|3ir,ade|2ir,ce|2r,de|2r,ntera|5rse,ropieza|3ezar,erienda|2endar,obierna|2ernar,cuerda|1ordar,alla|4rse,ontinúa|5uar,uena|onar,ía|iar,a|1r"
      },
      "thirdPlural": {
        "rules": "bicar|3áis,abricar|6,ceptar|5s,nsentir|2ientes,eclarar|6mos,astar|4n,estigar|6,omponer|5go,omenzar|5áis,raduar|5mos,lorecer|4zco,ivertir|2ierto,esentir|6mos,eprimir|5o,roteger|6,sificar|6n,intar|4n,squiar|4áis,espedir|6mos,ontecer|6,otestar|6n,spertar|2ierto,ducar|4,estruir|5yen,onfiar|3ían,lonizar|5o,namorar|6n,ufrir|4mos,onsejar|6,lustrar|5áis,alcular|6,egatear|6n,ensar|iensa,omper|3éis,orcer|uerzo,onreír|5mos,epillar|6,eportar|5o,arrer|3o,epasar|4o,mportar|6,ablecer|6n,ormir|uerme,allar|3o,rindar|5s,nvitar|4áis,erendar|2iendo,ngañar|4o,urlar|4,nviar|2ío,xigir|3es,riunfar|5áis,uebrar|1iebra,uerer|4mos,nfadar|5s,sayunar|6mos,esultar|6s,gorar|4mos,legar|3o,isfacer|5éis,sgustar|5áis,brazar|4o,busar|3áis,onvidar|6mos,tirizar|6s,eshacer|6n,lanchar|6mos,andonar|6mos,olocar|5mos,uspirar|5áis,esolver|2uelve,dvertir|5ís,orrer|4n,xportar|6s,onjugar|6mos,dmirar|5mos,rrachar|5o,tenecer|6,ecidir|5mos,omprar|5mos,oñar|ueñas,xtender|2iendo,postar|1uesta,atinar|5s,terizar|6mos,poyar|4n,cesitar|5áis,anejar|5mos,ompañar|5áis,ticipar|5áis,ariar|2ías,lantar|4áis,adrar|3áis,taminar|6,xplotar|6s,ndicar|5mos,lenar|4,evorar|5mos,onsumir|6mos,eparar|4áis,sustar|5s,impiar|5mos,uceder|4éis,uivocar|6mos,ublicar|5o,ntender|5éis,sponder|6mos,esear|3o,egociar|6,nseguir|2igue,iseñar|5s,contrar|6mos,liminar|6mos,visar|3áis,laticar|5o,olgar|4mos,evistar|5áis,acudir|4o,eñalar|5,sperar|5mos,jercer|5n,nfluir|4yes,positar|6mos,tilizar|6s,legrar|5mos,aciar|2ía,rever|4mos,enovar|2uevas,licitar|5áis,edicar|4áis,frecer|3zco,onducir|4zco,nseñar|5,quillar|6s,cercar|5n,emer|2éis,divinar|6n,reer|3mos,iolar|3o,almar|4mos,ralizar|5áis,ratar|4,onfesar|3iesa,ausar|3o,nvencer|6,dificar|6mos,yudar|4mos,sminuir|5yes,urgir|3e,guantar|6s,hocar|3áis,ruñir|3o,vanzar|4áis,equerir|3ieres,ntrolar|6,nstruir|5ís,asticar|5o,ondenar|6n,uemar|4,scoger|3jo,ganizar|5áis,roponer|6n,uardar|5,legir|4mos,rrollar|6mos,revivir|5es,rillar|4áis,rseguir|2iguen,ubir|2es,ntregar|6mos,omar|3n,liviar|5mos,onvenir|3iene,nificar|6,nfirmar|6s,ehusar|2úsas,ombatir|5es,ompetir|6mos,bortar|5s,municar|6n,ibujar|4áis,aludar|5,levar|3o,ijar|2áis,nventar|6n,esentar|5o,uscar|4mos,uponer|5mos,ogar|3mos,rohibir|6mos,rear|2áis,orregir|3ige,nservar|6,omer|2o,uidar|4,mprimir|5es,tumbrar|6s,raducir|5e,alir|2e,sconder|5éis,lcanzar|6mos,ograr|4mos,siasmar|5o,vejecer|5éis,oder|ueden,scansar|5o,nhelar|5n,erdonar|5áis,ecordar|5áis,adurar|5s,oblar|3áis,hismear|6,anar|2o,avar|3mos,astimar|6s,ingir|2jo,nversar|6s,scubrir|5o,ntinuar|4úo,ritar|4,ncionar|6n,obrar|3o,lmorzar|5áis,opiar|3áis,ablar|3o,ecoger|4éis,studiar|5áis,mpartir|5ís,alvar|3áis,arcar|3áis,añer|3,rreglar|6mos,ntentar|5áis,ucear|4s,oportar|5áis,fligir|4en,erder|ierdes,ncantar|5áis,erminar|5áis,ruzar|3áis,echazar|6,ragar|4mos,espirar|6n,umplir|4o,ecibir|4ís,ñadir|3o,epender|5o,quistar|6,olestar|6n,irigir|5mos,nvocar|4áis,acticar|6,riticar|6n,eredar|4áis,autizar|6,nvadir|5mos,xhibir|4en,rabajar|5o,nstalar|5áis,menazar|5o,escar|4n,scuchar|6n,bolizar|6,plaudir|5ís,iajar|4mos,talecer|4zco,gistrar|6n,xplorar|6mos,omendar|6mos,isitar|5s,dorar|4n,cabar|4mos,lvidar|5n,argar|4s,egalar|5mos,ultivar|5áis,avegar|4áis,vacuar|5mos,umar|3mos,sfrutar|6n,elebrar|5o,nsultar|6mos,estir|isto,cificar|6mos,ensurar|6,ecorar|4áis,efender|2ienden,evantar|6s,ugerir|5mos,vilizar|5áis,nfiscar|5áis,ncluir|5mos,antener|5go,harlar|5n,tacar|4,rovocar|5o,educir|3zco,horcar|5s,xponer|5mos,oseguir|2igue,nsuciar|5o,erecer|3zco,prender|5o,ilar|2áis,pezar|4mos,etir|2ís,nir|1ís,rnar|2áis,migrar|4o,meter|4mos,cender|1iendes,parecer|6,orrar|3áis,ular|2áis,igar|2áis,lear|3mos,quecer|3zco,etar|3mos,sistir|5mos,probar|2ueba,cinar|4mos,mitir|3o,clar|3mos,nacer|3éis,plicar|5,untar|3áis,ojar|3s,volver|1uelven,ler|1éis,mentar|4o,mostrar|1uestras,aber|3mos,testar|4áis,alizar|5mos,par|2mos,decer|3éis,decir|1ice,elar|2áis,rmar|2áis,uar|1áis,esar|2áis,tener|3éis,ciar|3mos,rir|1ís,overse|2éis,terarse|3o,ncearse|4mos,ecarse|2áis,reverse|4n,untarse|4,pararse|3áis,lamarse|4mos,actarse|4s,allarse|4n,eitarse|3áis,ullirse|3es,uejarse|3áis,darse|2mos,omit|4áis",
        "exceptions": "dejar|4n,beber|3o,yacer|4,oponer|4go,ir|vamos,ser|1oy,odiar|4mos,andar|4n,mandar|5mos,negar|1iega,introducir|9mos,regir|1iges,usar|3,constituir|8ís,votar|4mos,cansar|5mos,crecer|5mos,cerrar|1ierras,costar|1uestan,llorar|4o,extinguir|8mos,desagradar|8o,errar|4mos,acordar|2uerdo,reservar|7mos,hacer|4,servir|5mos,permanecer|7zco,criar|2ío,vivir|3o,teñir|1iñe,cenar|4mos,pagar|4,amar|2áis,medir|1ide,tocar|4mos,jugar|2ego,saltar|5,sentar|4áis,oír|2mos,volar|1uelas,casar|4s,atraer|5,apagar|5s,formar|4o,entrar|4o,montar|5mos,calentar|3ienta,abordar|5o,notar|3o,faltar|4áis,convertir|8mos,huir|2ye,bajar|3áis,nadar|4mos,oler|huelen,aspirar|6,traer|3igo,describir|7en,leer|2éis,jurar|3áis,coser|3éis,matar|4n,rezar|4n,bañar|4s,lanzar|5n,alentar|2ientas,agradar|6mos,coger|4mos,sustituir|7yen,evitar|4o,vender|4éis,picar|4s,peinar|5mos,curar|4n,echar|4s,tirar|3áis,arrepentirse|5iente,pasar|4mos,amanecer|7mos,poner|3éis,acortar|6mos,pedir|3ís,dudar|4s,cesar|4mos,caminar|6s,durar|4,sorprender|8éis,tardar|4o,distinguir|8en,preservar|7áis,luchar|5,sentirse|1ienten,toser|4,insistir|6es,freír|2íen,acostar|5áis,bordar|5n,aplicar|5o,apretar|3ietan,caer|2éis,verificar|7áis,batir|3ís,seguir|5mos,clarificar|9,dar|2s,guiar|4mos,duchar|4o,sonar|1ueno,escribir|6o,regar|1iegas,robar|4mos,sacar|4s,mentir|1iento,invertir|3ierto,mirar|4n,distribuir|8ye,atender|2iendes,reír|1íes,vencer|5n,purificar|8mos,deber|4s,cazar|4n,padecer|6mos,sacrificar|8áis,ofender|6s,glorificar|9mos,parar|4s,conocer|6n,estimar|5o,contar|1uenta,cortar|5n,estar|3oy,reinar|5,producir|6en,reñir|3ís,hervir|1ierven,besar|4mos,pegar|4mos,gustar|4o,reconocer|8s,aparecer|7mos,ver|2o,contribuir|8yen,inducir|6mos,prepararse|6áis,mudarse|4mos",
        "rev": "ebo|2er,ntero|4arse,eprimo|5ir,spierto|2ertar,uerzo|orcer,eporto|5ar,arro|3er,eriendo|2endar,ngaño|4ar,sagrado|6ar,lego|3ar,cuerdo|1ordar,ivo|2ir,xtiendo|2ender,uego|1gar,eseo|3ar,oto|2ar,acudo|4ir,raigo|2er,ruño|3ir,scojo|3ger,vito|3ar,levo|3ar,omo|2er,ano|2ar,injo|2gir,escubro|6ir,ontinúo|5uar,ueno|onar,scribo|5ir,iento|entir,umplo|4ir,ñado|3ir,rabajo|5ar,isto|estir,usto|3ar,rovoco|5ar,nsucio|5ar,vierto|1ertir,ío|iar,cho|2ar,rdo|2ar,mito|3ir,duzco|2cir,ngo|1er,zo|1ar,endo|3er,so|1ar,lo|1ar,mo|1ar,ento|3ar,ico|2ar,ro|1ar,ezco|1cer,sientes|1entir,ovéis|2erse,ierras|errar,uedamos|4rse,nceamos|4rse,xiges|3ir,ecáis|2arse,ueñas|oñar,arías|2iar,uelas|olar,lamamos|4rse,enuevas|2ovar,actas|4rse,omitáis|4,quieres|2erir,lientas|1entar,revives|5ir,ubes|2ir,ehúsas|2usar,feitáis|4arse,mprimes|5ir,mbulles|5irse,uejáis|3arse,ierdes|erder,iegas|egar,íes|eír,ebes|3r,fendes|5r,conoces|6r,uestras|ostrar,uyes|1ir,tes|1ir,iendes|ender,ís|ir,éis|er,as|1r,áis|ar,mos|r,iega|egar,iensa|ensar,uiebra|1ebrar,unta|4rse,puesta|1ostar,alienta|2entar,acía|2iar,onfiesa|3esar,uenta|ontar,prueba|2obar,a|1r,rotege|6r,uerme|ormir,esuelve|2olver,iñe|eñir,ide|edir,trae|4r,urge|3ir,onviene|3enir,orrige|3egir,epiente|2entirse,raduce|5ir,ale|2ir,ose|3r,añe|3r,sigue|1eguir,uye|1ir,dice|1ecir,ce|2r,onfían|3iar,uestan|ostar,treven|5rse,rsiguen|2eguir,allan|4rse,ueden|oder,tinguen|5ir,ienten|entirse,ríen|1eír,prietan|2etar,fligen|4ir,roducen|5ir,ierven|ervir,fienden|1ender,iben|2ir,vuelven|1olver,uyen|1ir,n|r,stoy|2ar"
      }
    },
    "pastTense": {
      "first": {
        "rules": "bicar|2qué,abricar|7on,apar|2ó,ceptar|5ste,nsentir|5í,eclarar|6ste,astar|4ste,omponer|3usiste,omenzar|6mos,raduar|6on,lorecer|5iste,ivertir|6mos,esentir|6ste,eprimir|6mos,roteger|5imos,sificar|6steis,intar|3ó,egresar|6mos,squiar|4ó,espedir|6steis,ontecer|5ieron,otestar|6mos,spertar|6steis,ducar|4steis,estruir|5í,onfiar|4ó,lonizar|6mos,namorar|6steis,ufrir|4ste,onsejar|6mos,lustrar|6ste,egatear|7on,ensar|4mos,omper|3í,ailar|4ste,orcer|3isteis,onreír|5steis,epillar|6mos,eportar|6mos,arrer|3imos,mpezar|6on,epasar|5ste,mportar|6ste,ablecer|5imos,ormir|3í,allar|5on,rindar|5mos,nvitar|4ó,erendar|6mos,urlar|4mos,obernar|6ste,xigir|4ste,riunfar|6mos,uebrar|5steis,uerer|1isimos,sayunar|5ó,rometer|5imos,gorar|3ó,legar|5on,isfacer|3icieron,sgustar|5ó,scender|5ió,busar|4steis,onvidar|7on,tirizar|5ó,eshacer|3iciste,lanchar|6steis,andonar|5ó,olocar|5steis,esolver|5ió,dvertir|5í,orrer|3í,xportar|7on,onjugar|5ó,retener|3uvo,dmirar|4ó,rrachar|6steis,tenecer|5imos,ecidir|4í,omprar|5ste,oñar|3ste,atinar|5mos,terizar|6steis,poyar|5on,cesitar|6steis,anejar|4é,ompañar|6steis,ticipar|6ste,lantar|5ste,adrar|5on,egular|6on,bligar|4ó,taminar|6mos,xplotar|5é,ndicar|5steis,lenar|4ste,evorar|5ste,ulpar|5on,onsumir|6ó,eparar|4ó,sustar|4é,impiar|4é,uceder|4iste,uivocar|4qué,ublicar|7on,endecir|3ijo,ntender|5ió,sponder|5isteis,esear|4steis,elear|3ó,iquecer|5ió,egociar|6steis,nseguir|6mos,iseñar|4é,contrar|7on,liminar|7on,visar|4mos,laticar|6steis,bedecer|5isteis,olgar|5on,dornar|4é,evistar|5é,ocinar|5steis,eñalar|5ste,sperar|5steis,jercer|4iste,nfluir|4í,positar|6ste,tilizar|5ó,ncender|5í,legrar|6on,aciar|3é,rever|3iste,ituar|4mos,enovar|4ó,licitar|5é,edicar|5ste,ezclar|4ó,frecer|4ió,onducir|4jo,nseñar|5steis,enacer|4isteis,nformar|6steis,divinar|6steis,reer|2yeron,iolar|4steis,almar|3ó,ralizar|7on,onfesar|7on,ausar|3ó,nvencer|5ieron,dificar|5ó,sminuir|6mos,urgir|4ste,redecir|3ijiste,guantar|6mos,hocar|4steis,ruñir|4steis,vanzar|5mos,equerir|6ste,ntrolar|7on,nstruir|6ste,asticar|7on,ondenar|5é,uemar|4mos,scoger|4í,eguntar|7on,ganizar|5ó,roponer|3use,fectuar|7on,uardar|5ste,legir|1igieron,rrollar|6steis,revivir|6ó,rseguir|2iguió,ubir|3mos,ntregar|6steis,campar|4é,omar|2ó,onvenir|3ino,mplear|5steis,nificar|4qué,nfirmar|6mos,ehusar|4ó,ombatir|5í,rrojar|5ste,ompetir|5í,bortar|4é,municar|4qué,ibujar|5mos,evolver|5imos,eplicar|4qué,aler|2iste,levar|4ste,preciar|5é,ijar|3ste,nojar|4steis,nventar|5ó,evelar|5mos,uscar|2qué,uponer|2uso,ogar|2ó,rohibir|6steis,rear|3steis,nservar|7on,uidar|4mos,mprimir|5í,tumbrar|5é,eriguar|6steis,raducir|4jo,sociar|6on,alir|3steis,sconder|5imos,lcanzar|7on,burrir|5mos,ograr|3é,siasmar|5é,lquilar|7on,orir|2í,vejecer|5imos,oder|ude,scansar|6steis,erdonar|6steis,ecordar|5é,ontener|3uvimos,adurar|4ó,etestar|6steis,oblar|4mos,hismear|7on,anar|3ste,avar|3ste,astimar|5é,nfermar|6ste,ingir|4ó,nversar|7on,ntinuar|7on,ritar|4ste,ncionar|6ste,obrar|4ste,lmorzar|4cé,opiar|4steis,ablar|4steis,studiar|5é,mpartir|6eron,alvar|3é,ealizar|5ó,añer|4on,rreglar|6ste,ucear|4mos,oportar|6ste,fligir|5mos,erder|3ió,ncantar|5ó,erminar|6ste,ruzar|3ó,niciar|5ste,echazar|7on,umplir|5ste,ecibir|5eron,galizar|6steis,epender|5í,quistar|6mos,olestar|6ste,irigir|5eron,acticar|4qué,riticar|7on,eredar|5steis,autizar|7on,btener|2uve,ntestar|5é,xhibir|5mos,ravesar|7on,nstalar|6mos,escar|4mos,referir|3irieron,scuchar|5ó,bolizar|7on,talecer|5ieron,gistrar|5é,xplorar|5ó,omendar|6steis,vorciar|6steis,ancelar|6ste,isitar|5mos,aquecer|5iste,dorar|3ó,cabar|4ste,lvidar|5steis,argar|4mos,eciclar|5é,egalar|4é,ultivar|6steis,avegar|6on,vacuar|5ste,umar|2é,sfrutar|7on,elebrar|6ste,estir|4ste,cificar|6ste,ensurar|5ó,ecorar|5mos,efender|5ieron,evantar|7on,ugerir|2irió,vilizar|6mos,nfiscar|7on,ncluir|4yó,antener|3uvieron,harlar|6on,amentar|6mos,tacar|4steis,educir|3jiste,ascinar|7on,horcar|6on,xponer|2use,oseguir|6ste,nsuciar|7on,erecer|4ió,eber|2ió,stigar|6on,cular|4ste,etir|3mos,ezar|2ó,añar|3ste,viar|3ste,migrar|5mos,sultar|4ó,spirar|6on,manecer|5ieron,riar|3mos,tender|4isteis,ostar|4ste,firmar|4é,agar|3steis,bordar|4ó,probar|6on,udir|3ó,mitir|4ó,illar|3ó,rcar|3steis,mer|1imos,plicar|5mos,atar|3mos,udar|3ste,mostrar|7on,regir|4mos,helar|4steis,cubrir|5ó,coger|3ió,tribuir|6steis,adir|3ó,vocar|4ste,ajar|3ste,resar|4ste,adar|4on,azar|3steis,rrar|3steis,etar|3steis,entar|4ste,terarse|5on,uedarse|5on,ncearse|4ste,ecarse|3ste,untarse|5on,pararse|4steis,lamarse|4steis,udarse|3ste,actarse|4mos,allarse|4mos,eitarse|4steis,ullirse|3eron,uejarse|4steis,verse|1iste,entirse|4ste,omit|4é",
        "exceptions": "dejar|4steis,renunciar|9on,yacer|3imos,oponer|2usiste,ir|fueron,odiar|3ó,andar|3uviste,mandar|4ó,negar|4steis,introducir|7jimos,usar|3steis,constituir|8yó,aprender|6ió,votar|5on,cansar|4ó,parecer|5iste,crecer|4imos,cerrar|4ó,costar|4é,unir|3ste,llorar|5ste,extinguir|8eron,desagradecer|10ieron,meter|3ieron,acordar|6mos,reservar|7ste,hacer|1icisteis,servir|5steis,desaparecer|9isteis,vivir|4ste,teñir|4ste,cenar|4steis,pagar|5on,amar|3mos,medir|4mos,tocar|2qué,jugar|4mos,saltar|5ste,oír|1yeron,volar|4ste,casar|4steis,atraer|4je,herir|1irieron,comprender|8ieron,formar|5mos,entrar|5ste,montar|6on,calentar|6ó,notar|4ste,consistir|8ste,pesar|4steis,faltar|4é,convertir|4irtieron,huir|2yeron,venir|1inisteis,bajar|3é,oler|2isteis,aspirar|6ste,nacer|3ió,traer|3jiste,describir|8steis,leer|2ímos,jurar|4steis,coser|3í,asistir|6eron,tener|1uvisteis,lanzar|5ste,agradar|6ste,sustituir|7yeron,evitar|5ste,vender|4ió,picar|2qué,peinar|5steis,curar|5on,echar|4ste,tirar|4ste,pasar|3é,poner|1usisteis,acortar|5ó,pedir|1idió,dudar|4mos,cesar|4ste,caber|1upisteis,caminar|5é,durar|5on,sorprender|8iste,tardar|5mos,distinguir|9mos,preservar|8mos,luchar|5steis,toser|3isteis,insistir|7ó,freír|4mos,caer|2íste,verificar|6qué,batir|4ste,detener|3uvisteis,seguir|4í,clarificar|9mos,dar|1iste,guiar|3o,duchar|6on,sonar|4mos,escribir|7mos,regar|3ué,robar|4ste,sacar|3ó,mentir|1intió,invertir|7mos,actuar|5ste,mirar|5on,volver|4ieron,decir|1ijeron,saber|1upiste,reír|3ste,vencer|4isteis,agradecer|7iste,purificar|9on,padecer|5í,sacrificar|9ste,ofender|5imos,glorificar|8ó,parar|4steis,conocer|5iste,abrir|4ste,untar|4steis,estimar|6steis,contar|5mos,cortar|5mos,estar|3uvimos,reinar|5ste,soler|3ieron,anunciar|6ó,producir|5jiste,reñir|1iñó,hervir|1irvió,besar|3é,pegar|4steis,gustar|6on,reconocer|7ió,aparecer|6ió,ver|1ieron,inducir|4jeron,atreverse|5iste,extender|6isteis,juntarse|6on,prepararse|7steis,llamarse|5steis,responder|7isteis,prever|4iste,mudarse|4ste,elegir|2igieron,afeitarse|6steis,arrepentirse|9ste,contener|4uvimos,sentirse|5ste,quejarse|5steis,compartir|8eron,atender|5isteis,dirigir|6eron",
        "rev": "oviste|2erse,duviste|1ar,nceaste|4rse,ecaste|3rse,hiciste|1acer,traje|3er,rajiste|2er,dijiste|1ecir,aliste|2er,ude|oder,aíste|1er,upiste|aber,btuve|2ener,pusiste|1oner,diste|1er,puse|1oner,dujiste|2cir,ciste|1er,ste|r,teraron|5se,uedaron|5se,guieron|3r,icieron|acer,stieron|3r,reyeron|2er,ulleron|3irse,ibieron|3r,ijeron|ecir,uvieron|ener,dujeron|2cir,irieron|erir,uyeron|1ir,ieron|er,ron|1,dujimos|2cir,tegimos|3er,arrimos|3er,uisimos|1erer,metimos|3er,actamos|4rse,emimos|2er,allamos|4rse,olvimos|3er,omimos|2er,ndimos|2er,cimos|1er,cisteis|1er,mos|r,steis|r,ompí|3er,orrí|3er,osí|2er,scogí|4er,adecí|4er,endí|3er,í|ir,esolvió|5er,onsumió|6r,ació|2er,revivió|6r,rsiguió|2eguir,idió|edir,ingió|4r,erdió|3er,intió|entir,iñó|eñir,irvió|ervir,ugirió|2erir,conoció|5er,ebió|2er,uyó|1ir,udió|3r,cubrió|5r,cogió|3er,adió|3r,tió|2r,endió|3er,eció|2er,ó|ar,tretuvo|4ener,endijo|3ecir,onvino|3enir,upuso|2oner,uio|2ar,dujo|2cir,omité|4,lmorcé|4zar,egué|2ar,qué|car,é|ar"
      },
      "second": {
        "rules": "bicar|3ó,abricar|4qué,apar|2é,ceptar|5steis,eclarar|7on,astar|5on,omponer|3uso,omenzar|6steis,raduar|4ó,lorecer|5imos,ivertir|2irtieron,esentir|6steis,eprimir|6steis,roteger|5iste,sificar|4qué,intar|3é,egresar|6steis,squiar|4é,espedir|6ste,ontecer|5í,spertar|7on,ducar|5on,estruir|5yeron,onfiar|4é,lonizar|4cé,namorar|6mos,ufrir|3í,lustrar|5é,alcular|6mos,egatear|6mos,ensar|4steis,omper|3isteis,ailar|5on,orcer|3iste,onreír|5ste,epillar|6steis,eportar|6ste,arrer|3isteis,mpezar|3cé,epasar|5mos,mportar|6steis,ablecer|5iste,ormir|4steis,erretir|5í,allar|4steis,ropezar|6steis,rindar|5steis,nvitar|6on,ngañar|5steis,urlar|3ó,obernar|6mos,riunfar|6steis,nmigrar|6steis,uebrar|4ó,uerer|1isieron,nfadar|5steis,sayunar|5é,rometer|5í,gorar|3é,legar|4ste,isfacer|3izo,sgustar|5é,brazar|5mos,scender|5í,busar|4mos,tirizar|6mos,eshacer|3icimos,lanchar|5é,andonar|5é,olocar|3qué,dvertir|6steis,orrer|3ió,xportar|6steis,onjugar|6steis,retener|3uve,dmirar|4é,rrachar|7on,tenecer|5ió,ecidir|5ó,omprar|5steis,horrar|5mos,oñar|3steis,xtender|5iste,postar|5steis,atinar|6on,terizar|7on,poyar|4mos,cesitar|6ste,anejar|4ó,ompañar|6ste,ticipar|5é,ariar|3é,lantar|6on,adrar|3é,egular|4ó,taminar|6steis,xplotar|5ó,lenar|5on,evorar|4ó,ulpar|4ste,onsumir|6ste,eparar|4é,sustar|4ó,impiar|4ó,uceder|4imos,uivocar|6ste,ublicar|6mos,endecir|3ije,sponder|5ió,esear|4ste,elear|3é,egociar|6ste,nseguir|6steis,iseñar|4ó,contrar|6ste,liminar|6ste,visar|4ste,laticar|4qué,bedecer|5imos,olgar|4steis,dornar|4ó,evistar|5ó,ocinar|4é,acudir|5eron,sperar|4ó,jercer|4í,nfluir|4yeron,tilizar|6mos,ncender|5iste,legrar|5steis,aciar|4mos,rever|3í,dmitir|5ste,ituar|3ó,enovar|5steis,licitar|5ó,ezclar|4é,frecer|4imos,onducir|4je,nseñar|5ste,cercar|3qué,emer|2ió,nformar|5é,divinar|6mos,reer|2í,iolar|5on,almar|3é,ralizar|6mos,xplicar|6ste,ratar|4ste,onfesar|6steis,ausar|3é,nvencer|5ió,dificar|7on,yudar|3ó,sminuir|5yó,urgir|4eron,redecir|3ijisteis,guantar|6steis,hocar|2qué,ruñir|3ó,vanzar|3cé,equerir|6mos,nstruir|6mos,asticar|6mos,ondenar|6mos,uemar|4steis,scoger|4ieron,eguntar|6ste,ganizar|6ste,roponer|3usieron,fectuar|6steis,uardar|4é,revivir|6steis,rseguir|6ste,ubir|3ó,ntregar|7on,campar|4ó,omar|2é,onvenir|3ine,mplear|6on,nificar|6mos,nfirmar|7on,ehusar|5ste,ombatir|6ó,rrojar|4é,bortar|4ó,municar|6ste,ibujar|4ó,aludar|5mos,aler|2imos,levar|4mos,umentar|5é,preciar|5ó,ijar|2ó,nojar|4ste,nventar|5é,uscar|4steis,uponer|2use,ogar|3steis,rohibir|6ste,rear|3ste,nservar|6mos,omer|2ieron,mprimir|6ste,tumbrar|5ó,eriguar|4üé,raducir|4je,sociar|5steis,alir|3ste,sconder|5í,lcanzar|6ste,burrir|5ste,ograr|3ó,siasmar|6ste,lquilar|5ó,ermitir|5í,orir|3ste,vejecer|5ió,oder|udo,scansar|7on,erdonar|7on,etestar|6ste,oblar|3é,hismear|6mos,anar|3steis,avar|3steis,astimar|5ó,nfermar|6steis,ingir|4eron,nversar|5é,ntinuar|6mos,ritar|5on,ncionar|5é,obrar|4mos,ricular|6steis,lmorzar|7on,opiar|5on,ablar|4mos,ecoger|4iste,studiar|5ó,mpartir|6ste,alvar|3ó,arcar|4ste,ealizar|6ste,añer|2isteis,rreglar|5é,ntentar|5ó,ucear|5on,oportar|6mos,fligir|5eron,erder|3imos,ncantar|5é,erminar|5ó,ruzar|4steis,niciar|5steis,echazar|4cé,ragar|5on,espirar|6steis,umplir|5ó,ecibir|5ste,ñadir|4mos,galizar|4cé,epender|5imos,quistar|6steis,olestar|6mos,nvocar|5steis,acticar|7on,riticar|6ste,eredar|4é,autizar|4cé,nvadir|4í,btener|2uvo,xhibir|5ó,ravesar|6ste,rabajar|6mos,nstalar|6steis,menazar|7on,escar|4ste,referir|6mos,scuchar|5é,bolizar|6ste,teresar|5é,plaudir|6mos,iajar|3ó,talecer|5í,gistrar|5ó,xplorar|6steis,vorciar|7on,dorar|3é,cabar|4steis,lvidar|4ó,argar|3ué,eciclar|7on,ultivar|6mos,avegar|4ó,vacuar|4é,umar|2ó,sfrutar|5ó,xpresar|5ó,elebrar|7on,estir|3í,cificar|4qué,espetar|7on,ecorar|5ste,efender|5imos,evantar|5ó,ugerir|5steis,vilizar|6steis,nfiscar|6mos,ncluir|4í,harlar|5mos,amentar|6steis,astigar|6ste,rovocar|4qué,educir|3jisteis,ascinar|6steis,horcar|5steis,xponer|2uso,oseguir|6steis,nsuciar|6ste,erecer|4iste,ejar|2é,entir|4ste,igar|3mos,testar|4ó,endar|5on,viar|3steis,igir|3ó,tinguir|6ó,sultar|4é,idar|3ste,spirar|5mos,olver|3iste,cordar|4ó,eñir|3mos,firmar|4ó,olar|3steis,asar|2ó,pagar|4ste,dicar|3ó,tender|4imos,quecer|4ieron,pretar|5ste,probar|5ste,alar|4on,sitar|3ó,nacer|3imos,egir|2í,petir|1itieron,plicar|5steis,sentar|5mos,ntener|2uvisteis,cubrir|5mos,costar|5mos,acar|3ste,tribuir|5yeron,urar|3mos,llar|2é,elar|2ó,overse|2í,terarse|4steis,ncearse|3é,ecarse|1qué,reverse|3ió,pararse|4mos,lamarse|5on,actarse|3é,allarse|3é,ullirse|3ó,uejarse|4mos,darse|1ó,tarse|2mos,omit|4ó",
        "exceptions": "beber|3iste,renunciar|7é,yacer|3í,oponer|2usimos,ir|fuimos,odiar|3é,andar|3uvimos,mandar|4é,negar|3ó,introducir|7jiste,regir|4ste,usar|3mos,constituir|8yeron,aprender|6isteis,votar|4ste,cansar|4é,parecer|5ió,crecer|4í,cerrar|4é,unir|3mos,llorar|4é,desagradecer|10ió,desagradar|9mos,meter|3iste,errar|4ste,reservar|6ó,hacer|1izo,servir|5ste,permanecer|8iste,mostrar|6ste,desaparecer|9ieron,criar|4steis,vivir|4eron,cenar|3ó,amar|2é,medir|1idieron,tocar|4ste,jugar|4ste,saltar|5steis,oír|2,atraer|4jo,herir|4steis,comprender|8imos,formar|5steis,entrar|5steis,montar|4é,calentar|6é,abordar|6ste,notar|4steis,consistir|8eron,pesar|3ó,faltar|4ó,convertir|7í,huir|3ste,venir|1iniste,bajar|4ste,nadar|3é,oler|2ieron,traer|3jeron,describir|8mos,leer|2yó,coser|3iste,asistir|6ste,tener|1uviste,matar|4steis,rezar|4ste,bañar|5on,lanzar|5mos,alentar|6steis,agradar|7on,coger|3í,sustituir|7yó,evitar|5mos,vender|4ieron,picar|4mos,peinar|4é,curar|3ó,echar|4steis,tirar|4steis,demostrar|8steis,arrepentirse|9steis,amanecer|6í,poner|1usimos,acortar|5é,pedir|4steis,dudar|4steis,cesar|3é,caber|1upiste,caminar|5ó,durar|4ste,sorprender|8í,tardar|5steis,preservar|8ste,luchar|5mos,sentirse|4í,helar|4ste,toser|3ió,insistir|6í,freír|2ieron,bordar|4é,caer|2ímos,verificar|8ste,batir|3í,detener|3uvimos,seguir|1iguieron,clarificar|9ste,dar|1imos,guiar|3e,duchar|5steis,sonar|5on,escribir|7ó,regar|4mos,robar|3ó,invertir|7steis,actuar|6on,mirar|4steis,volver|4isteis,decir|1ijiste,saber|1upisteis,reír|3steis,vencer|4iste,agradecer|7ieron,purificar|7ó,deber|3imos,cazar|2cé,padecer|5iste,sacrificar|7qué,ofender|5ieron,glorificar|10on,parar|4ste,conocer|5í,abrir|4steis,untar|4mos,borrar|4ó,estimar|7on,contar|6on,cortar|5steis,estar|3uviste,reinar|5steis,soler|3í,anunciar|8on,producir|5jisteis,hervir|5mos,besar|3ó,pegar|3ué,gustar|5ste,reconocer|7isteis,aparecer|6í,emigrar|7on,ver|1i,inducir|4jiste,divertir|3irtieron,enterarse|6steis,romper|4isteis,barrer|4isteis,juntarse|5mos,mudarse|3ó,predecir|4ijisteis,contener|4uvisteis,mantener|4uvisteis",
        "rev": "ebiste|2er,tegiste|3er,etiste|2er,tretuve|4ener,endije|3ecir,iniste|enir,osiste|2er,onvine|3enir,upuse|2oner,upiste|aber,cogiste|3er,uie|2ar,ijiste|ecir,dujiste|2cir,olviste|3er,endiste|3er,duje|2cir,ciste|1er,ste|r,oví|2erse,ufrí|3ir,erretí|5ir,onvertí|6ir,ermití|5ir,entí|3irse,atí|2ir,nvadí|4ir,ncluí|4ir,egí|2ir,stí|2ir,í|er,duvimos|1ar,hicimos|1acer,paramos|4rse,cedimos|3er,alimos|2er,eitamos|4rse,uejamos|4rse,aímos|1er,tuvimos|1ener,ñisteis|1er,erdimos|3er,ebimos|2er,cisteis|1er,pusimos|1oner,jisteis|cir,cimos|1er,endimos|3er,mos|r,steis|r,areció|4er,uedó|3arse,radeció|5er,orrió|3er,teneció|5er,ecidió|5r,trevió|4erse,spondió|5er,eyó|1er,emió|2er,nvenció|5er,omitó|4,ruñó|3ir,ombatió|6r,vejeció|5er,ambulló|6irse,osió|2er,umplió|5r,igió|3r,tinguió|6r,uyó|1ir,bió|2r,ó|ar,ronceé|5arse,equé|1carse,acté|3arse,allé|3arse,verigüé|5uar,gué|1ar,cé|zar,qué|car,é|ar,isieron|erer,ivieron|3r,idieron|edir,lamaron|5se,stieron|3r,udieron|3r,lieron|1er,rajeron|2er,ogieron|2er,usieron|oner,omieron|2er,rieron|1eír,ndieron|2er,itieron|etir,gieron|2r,ecieron|2er,uyeron|1ir,aron|2,trajo|3er,udo|oder,btuvo|2ener,puso|1oner,izo|acer,i|er"
      },
      "third": {
        "rules": "bicar|4ste,abricar|6steis,apar|4on,ceptar|4ó,nsentir|2intió,eclarar|5é,astar|4steis,estigar|5ué,omponer|3use,omenzar|4cé,raduar|4é,lorecer|5í,ivertir|2irtió,eprimir|6eron,roteger|5ió,sificar|7on,intar|5on,egresar|6ste,squiar|5mos,espedir|3idió,ontecer|5iste,otestar|5é,spertar|6mos,ducar|4ste,estruir|6mos,onfiar|5steis,lonizar|7on,namorar|5é,ufrir|4mos,onsejar|5ó,lustrar|5ó,egatear|6steis,ensar|3é,omper|3iste,orcer|3í,onreír|3ió,epillar|7on,eportar|5ó,arrer|3í,mpezar|5steis,epasar|6on,mportar|6mos,ablecer|5ió,ormir|4mos,allar|4mos,ropezar|4cé,rindar|4é,nvitar|4é,erendar|6steis,ngañar|6on,urlar|4steis,obernar|7on,xigir|4mos,riunfar|5ó,nmigrar|5ó,uebrar|6on,uerer|1isisteis,nfadar|4é,sayunar|6steis,esultar|6mos,rometer|5ió,gorar|4ste,legar|3ó,isfacer|3iciste,sgustar|6ste,brazar|6on,scender|5ieron,busar|4ste,onvidar|5ó,tirizar|7on,eshacer|3icisteis,lanchar|5ó,andonar|7on,olocar|6on,uspirar|6ste,esolver|5imos,dvertir|2irtieron,orrer|3iste,xportar|6mos,onjugar|6ste,retener|3uvimos,dmirar|5steis,rrachar|6ste,tenecer|5ieron,ecidir|5ste,omprar|6on,horrar|6on,xtender|5í,atinar|5steis,terizar|4cé,poyar|3ó,cesitar|5ó,anejar|5ste,ticipar|5ó,ariar|3ó,lantar|4ó,adrar|4steis,egular|5ste,bligar|5steis,ndicar|3qué,lenar|4mos,evorar|4é,ulpar|3é,onsumir|6steis,sustar|5mos,impiar|6on,uceder|4ió,uivocar|5ó,ublicar|5ó,endecir|3ijisteis,ntender|5isteis,sponder|5í,esear|4mos,elear|5on,iquecer|5isteis,egociar|7on,nseguir|2iguió,contrar|5ó,liminar|5é,visar|4steis,laticar|7on,bedecer|5ió,olgar|3ó,dornar|5steis,ocinar|4ó,acudir|4í,eñalar|5steis,sperar|4é,jercer|4imos,tilizar|4cé,ncender|5ió,legrar|4é,aciar|4steis,rever|3ieron,dmitir|5steis,ituar|3é,enovar|5ste,licitar|7on,edicar|5mos,frecer|4ieron,onducir|4jeron,quillar|6ste,enacer|4ieron,emer|2isteis,nformar|5ó,divinar|5ó,reer|2yó,almar|4steis,ralizar|6steis,ratar|4steis,onfesar|6mos,ausar|4steis,nvencer|5isteis,dificar|6ste,sminuir|6steis,urgir|4mos,redecir|3ije,guantar|6ste,hocar|3ó,ruñir|4ste,vanzar|5ste,equerir|3irieron,nstruir|5í,asticar|4qué,ondenar|6ste,uemar|5on,eguntar|6steis,ganizar|6mos,roponer|3usimos,fectuar|6ste,uardar|4ó,legir|4steis,rrollar|5ó,rillar|5steis,rseguir|6steis,ntregar|5ué,campar|5steis,omar|3mos,onvenir|3iniste,mplear|4é,nificar|7on,ehusar|4é,ombatir|6eron,bortar|5steis,municar|6mos,ibujar|4é,evolver|5ió,eplicar|7on,aler|2í,levar|4steis,umentar|5ó,preciar|6ste,ijar|2é,nventar|6mos,esentar|5é,uscar|4ste,uponer|2usieron,ogar|3ste,rohibir|5í,rear|2ó,orregir|6ste,nservar|6ste,omer|2iste,uidar|4steis,mprimir|6steis,tumbrar|6steis,eriguar|6mos,raducir|4jiste,sociar|5ste,alir|3mos,sconder|5iste,lcanzar|5ó,burrir|4í,ograr|4mos,siasmar|6mos,ermitir|6ste,orir|3mos,vejecer|5isteis,oder|udieron,erdonar|6ste,ecordar|6mos,ontener|3uviste,adurar|6on,etestar|5ó,oblar|3ó,hismear|6ste,anar|3mos,avar|2é,astimar|7on,nfermar|5ó,ingir|4steis,nversar|5ó,scubrir|6steis,ntinuar|6steis,ritar|4steis,ncionar|5ó,obrar|4steis,lmorzar|6mos,opiar|3é,ablar|5on,studiar|6mos,mpartir|6steis,alvar|4mos,ealizar|7on,añer|2iste,rreglar|6steis,ntentar|5é,ucear|3é,oportar|6steis,erder|3ieron,ncantar|7on,erminar|5é,ruzar|4ste,niciar|6on,echazar|6steis,ragar|3ó,espirar|5ó,umplir|4í,ecibir|5mos,ñadir|4steis,galizar|5ó,epender|5ió,olestar|5ó,nvocar|5mos,acticar|6steis,riticar|4qué,eredar|4ó,autizar|6ste,nvadir|5ste,epetir|4í,btener|2uvimos,ntestar|6mos,ravesar|6mos,rabajar|7on,nstalar|7on,menazar|5ó,scuchar|6mos,bolizar|4cé,teresar|5ó,plaudir|6ste,iajar|3é,talecer|5iste,gistrar|6ste,xplorar|5é,omendar|6ste,vorciar|5ó,aquecer|5imos,dorar|5on,cabar|3é,lvidar|4é,argar|3ó,egalar|4ó,ultivar|5é,avegar|5mos,vacuar|4ó,umar|3ste,sfrutar|5é,xpresar|5é,elebrar|6mos,nsultar|6ste,estir|istieron,cificar|5ó,ensurar|5é,ecorar|4ó,efender|5ió,evantar|5é,vilizar|6ste,antener|3uvimos,harlar|5ste,amentar|6ste,astigar|5ó,tacar|2qué,rovocar|6steis,educir|3jeron,ascinar|6ste,horcar|4ó,xponer|2usiste,oseguir|5í,nsuciar|6mos,erecer|4imos,entir|intieron,cular|3ó,ilar|2é,etir|3ste,viar|4on,radecer|5í,agradar|6steis,eservar|5é,ostar|5on,firmar|5ste,altar|5on,aminar|5ste,otar|4on,pagar|4mos,parar|5on,etar|2é,sistir|5steis,istar|4ste,luir|3ste,sitar|3é,clar|3steis,rcar|3mos,olar|3mos,plicar|3qué,udar|2é,coger|3imos,vivir|4mos,ojar|3mos,mostrar|6mos,cansar|5mos,aber|upimos,uchar|4ste,igir|2í,scar|2ó,parecer|5isteis,erir|3ste,elar|2é,ñar|2mos,bir|2eron,overse|2ieron,terarse|4ste,ncearse|3ó,ecarse|2ó,reverse|3imos,untarse|4steis,pararse|5on,lamarse|3ó,allarse|3ó,ullirse|4mos,uejarse|5on,darse|1é,tarse|1ó,entirse|intieron,omit|4asteis",
        "exceptions": "dejar|4mos,beber|3imos,renunciar|8steis,yacer|3ió,oponer|2uso,ir|fue,odiar|5on,andar|3uve,mandar|5steis,negar|5on,introducir|7jeron,regir|1igió,usar|4on,constituir|9ste,aprender|6iste,votar|3ó,crecer|4iste,cerrar|5steis,costar|4ó,unir|3steis,llorar|4ó,extinguir|8ste,meter|3í,errar|5on,acordar|6steis,hacer|1iciste,servir|1irvió,permanecer|8í,desaparecer|9iste,criar|3o,teñir|1iñeron,cenar|3é,amar|2ó,medir|4steis,tocar|4steis,jugar|3ó,sentar|5steis,oír|1yó,volar|3é,casar|3é,atraer|4jiste,comprender|8ió,formar|5ste,entrar|5mos,montar|5mos,calentar|7ste,abordar|7on,pesar|3é,aprobar|6mos,convertir|8ste,huir|2í,firmar|5mos,venir|1inimos,bajar|4steis,nadar|3ó,oler|2ió,aspirar|7on,nacer|3í,traer|3jimos,leer|2yeron,jurar|3ó,coser|3isteis,tener|1uvo,matar|4ste,rezar|4mos,bañar|4steis,lanzar|6on,alentar|7on,coger|3iste,sustituir|8mos,evitar|5steis,vender|4isteis,picar|5on,peinar|4ó,curar|3é,echar|4mos,tirar|5on,pasar|4steis,amanecer|6imos,poner|1usiste,acortar|6ste,pedir|3í,dudar|5on,cesar|4steis,cubrir|5eron,durar|4mos,sorprender|8ieron,tardar|6on,distinguir|8í,helar|5on,toser|3iste,insistir|7mos,freír|4ste,bordar|5mos,apretar|7on,caer|2ísteis,verificar|8mos,batir|4mos,detener|3uvieron,seguir|5steis,clarificar|10on,dar|1i,guiar|4steis,sonar|4steis,regar|5on,robar|4steis,sacar|4steis,invertir|3irtió,actuar|5mos,mirar|4ste,distribuir|9ste,volver|4í,decir|1ijo,atender|5ió,reír|3,vencer|4ió,purificar|8ste,deber|3isteis,cazar|4mos,padecer|5ieron,sacrificar|9mos,ofender|5í,glorificar|9steis,conocer|5ió,abrir|4mos,untar|4ste,borrar|4é,estimar|6mos,contar|5steis,cortar|6on,probar|4é,estar|3uvisteis,reinar|5mos,soler|3imos,anunciar|7ste,producir|5je,reñir|4steis,hervir|4í,besar|4ste,pegar|5on,gustar|5steis,reconocer|7í,emigrar|5é,ver|1imos,contribuir|8yó,inducir|4je,presentir|4intieron,querer|2isisteis,deshacer|4icisteis,advertir|3irtieron,juntarse|5steis,prepararse|8on,bendecir|4ijisteis,entender|6isteis,mudarse|3é,temer|3isteis,vomit|5asteis,arrepentirse|5intieron,sentirse|1intieron,mentir|1intieron,vestir|1istieron",
        "rev": "ebimos|2er,olvimos|3er,revimos|3erse,inimos|enir,rajimos|2er,pusimos|1oner,ullimos|4rse,aísteis|1er,bisteis|1er,olimos|2er,cogimos|3er,upimos|aber,tuvimos|1ener,cimos|1er,cisteis|1er,steis|r,mos|r,nsintió|2entir,ació|2er,rotegió|5er,igió|egir,espidió|3edir,onrió|3eír,ronceó|5arse,rometió|5er,ecó|2arse,irvió|ervir,lamó|3arse,nsiguió|2eguir,lió|1er,actó|3arse,reyó|2er,alló|3arse,evolvió|5er,feitó|4arse,enció|3er,onoció|4er,tribuyó|5ir,virtió|1ertir,eció|2er,dió|1er,ó|ar,ompuse|3oner,nduve|2ar,teraste|4rse,ompiste|3er,orriste|3er,rajiste|2er,redije|3ecir,ogiste|2er,viniste|1enir,omiste|2er,dujiste|2cir,tuviste|1ener,osiste|2er,añiste|2er,ndiste|2er,iciste|acer,duje|2cir,pusiste|1oner,eciste|2er,ste|r,ovieron|2erse,imieron|3r,iñeron|eñir,evieron|2er,eyeron|1er,irieron|erir,atieron|3r,usieron|oner,udieron|oder,brieron|3r,uejaron|5se,uvieron|ener,dujeron|2cir,dieron|1er,cieron|1er,bieron|2r,aron|2,puso|1oner,rio|2ar,uvo|ener,ijo|ecir,arrí|3er,acudí|4ir,alí|2er,rohibí|5ir,edí|2ir,burrí|4ir,umplí|4ir,olví|3er,eí|2r,epetí|4ir,erví|3ir,igí|2ir,ndí|2er,uí|1ir,cí|1er,uedé|3arse,gué|1ar,cé|zar,qué|car,é|ar,i|ar"
      },
      "firstPlural": {
        "rules": "bicar|5on,abricar|6ste,apar|3steis,ceptar|4é,nsentir|2intieron,eclarar|6mos,astar|4mos,omponer|3usieron,omenzar|7on,lorecer|5ió,ivertir|6ste,esentir|6mos,eprimir|6ste,roteger|5ieron,sificar|6ste,intar|4mos,egresar|5é,ontecer|5isteis,otestar|6steis,spertar|5ó,ducar|2qué,onfiar|5ste,lonizar|6ste,namorar|5ó,ufrir|4eron,lustrar|6mos,ensar|3ó,omper|3imos,ailar|3ó,orcer|3imos,onreír|5,epillar|5ó,eportar|7on,arrer|3ieron,mpezar|5ste,epasar|4ó,mportar|7on,ablecer|5ieron,ormir|urmieron,allar|4ste,ropezar|6mos,rindar|4ó,nvitar|5mos,erendar|5ó,urlar|5on,nviar|3é,obernar|5ó,xigir|4steis,riunfar|5é,nmigrar|5é,uebrar|5mos,uerer|1isiste,nfadar|4ó,sayunar|7on,rometer|5iste,gorar|4steis,legar|4mos,isfacer|3icisteis,scender|5isteis,busar|5on,onvidar|5é,tirizar|4cé,eshacer|3izo,lanchar|6ste,andonar|6ste,olocar|4ó,uspirar|5ó,esolver|5í,dvertir|6ste,orrer|3isteis,xportar|5ó,onjugar|5ué,retener|3uvieron,dmirar|5mos,rrachar|5é,ecidir|5mos,omprar|4ó,horrar|4é,oñar|2ó,xtender|5ió,postar|5mos,atinar|4é,terizar|5ó,poyar|3é,anejar|5steis,ompañar|7on,ticipar|6steis,ariar|4steis,lantar|4é,adrar|4mos,bligar|4ué,taminar|7on,ndicar|6on,lenar|3é,evorar|6on,ulpar|3ó,onsumir|5í,eparar|5ste,impiar|5steis,uceder|4í,uivocar|6mos,ublicar|6steis,endecir|3ijeron,sponder|5iste,elear|4ste,egociar|6mos,nseguir|2iguieron,iseñar|5ste,liminar|5ó,visar|3é,laticar|6mos,bedecer|5í,olgar|3ué,dornar|5ste,evistar|6mos,ocinar|5mos,acudir|5mos,eñalar|5mos,sperar|5ste,jercer|4ieron,positar|6steis,tilizar|7on,ncender|5imos,legrar|4ó,aciar|5on,rever|3isteis,dmitir|5mos,enovar|5mos,licitar|6mos,edicar|5steis,ezclar|5ste,frecer|4isteis,onducir|4jiste,nseñar|6on,enacer|4í,cercar|6on,emer|2í,nformar|6mos,divinar|7on,reer|2ísteis,almar|4ste,ralizar|5ó,xplicar|5ó,ratar|3ó,onfesar|5ó,ausar|4mos,nvencer|5iste,dificar|6mos,yudar|4steis,sminuir|5yeron,urgir|4ó,redecir|3ijo,guantar|5é,hocar|5on,ruñir|4mos,equerir|6steis,ntrolar|5é,asticar|6ste,ondenar|7on,uemar|4ste,scoger|4ió,eguntar|6mos,ganizar|6steis,roponer|3uso,fectuar|5ó,uardar|5steis,legir|4ste,rrollar|6ste,revivir|5í,rseguir|5í,ubir|3steis,campar|6on,omar|4on,liviar|4ó,onvenir|3inimos,nificar|6steis,nfirmar|5é,ehusar|6on,ombatir|6steis,rrojar|6on,ompetir|6mos,bortar|5ste,municar|5ó,ibujar|5steis,aludar|4ó,evolver|5ieron,eplicar|6mos,aler|2isteis,levar|5on,umentar|6steis,preciar|7on,ijar|4on,nojar|3é,nventar|6steis,esentar|5ó,evelar|5steis,uscar|4mos,uponer|2usimos,ogar|3mos,rohibir|6eron,rear|2é,omer|2isteis,uidar|5on,mprimir|6ó,tumbrar|6mos,eriguar|5ó,raducir|4jisteis,sociar|4ó,alir|3eron,sconder|5ieron,lcanzar|6steis,burrir|5steis,ograr|4steis,siasmar|6steis,lquilar|6mos,ermitir|6steis,orir|3steis,vejecer|5iste,oder|udisteis,scansar|6ste,nhelar|5mos,erdonar|5ó,ecordar|7on,ontener|3uvieron,etestar|5é,oblar|4steis,anar|2ó,avar|2ó,astimar|6steis,nfermar|5é,ingir|4ste,nversar|6steis,scubrir|6ste,ntinuar|5ó,ritar|4mos,ncionar|6mos,obrar|3é,lmorzar|6ste,opiar|3ó,ablar|3é,ecoger|4isteis,mpartir|6mos,alvar|5on,arcar|3ó,ealizar|6steis,añer|2í,rreglar|5ó,ntentar|7on,oportar|5ó,fligir|5ó,erder|3isteis,ncantar|6ste,erminar|6mos,ruzar|5on,niciar|4ó,ragar|4mos,umplir|5mos,ñadir|3í,galizar|7on,epender|5ieron,quistar|5ó,olestar|5é,irigir|5ste,nvocar|4ó,acticar|6mos,riticar|5ó,eredar|5ste,autizar|6steis,nvadir|5mos,btener|2uvisteis,ntestar|7on,ravesar|6steis,nstalar|5ó,escar|2qué,referir|6steis,scuchar|6ste,bolizar|6mos,teresar|6mos,plaudir|5í,iajar|5on,talecer|5isteis,gistrar|6mos,omendar|5é,vorciar|6ste,ancelar|6mos,dorar|4ste,lvidar|5mos,argar|4ste,eciclar|5ó,egalar|5ste,ultivar|5ó,avegar|5steis,umar|4on,sfrutar|6ste,xpresar|7on,elebrar|6steis,estir|4mos,cificar|7on,ensurar|6steis,ecorar|4é,efender|5isteis,evantar|6ste,ugerir|2irieron,vilizar|5ó,nfiscar|6steis,antener|3uvo,harlar|5steis,amentar|7on,rovocar|7on,educir|3jimos,ascinar|5ó,horcar|3qué,xponer|2usisteis,oseguir|2iguió,nsuciar|5ó,erecer|4isteis,ejar|4on,stigar|5steis,diar|3steis,uiar|3ste,edir|2í,struir|4yó,etir|3steis,añar|3mos,lorar|5on,sultar|6on,ustar|5on,necer|3iste,parecer|5imos,sitar|5on,altar|4mos,olar|2ó,otar|3mos,ntrar|3é,tender|4iste,quecer|4í,etar|2ó,luir|3steis,spirar|4é,illar|4mos,anzar|3ó,regar|3ó,regir|1igieron,servar|4ó,durar|3é,acar|3mos,bajar|3ó,ular|2é,bar|1ó,rificar|6steis,uar|2steis,azar|3ste,ibir|2í,ear|1ó,overse|2isteis,terarse|4mos,uedarse|4steis,ncearse|4mos,ecarse|3steis,reverse|3í,pararse|4ste,lamarse|3é,udarse|4on,actarse|4steis,allarse|5on,uejarse|3é,tarse|1é,irse|1steis,omit|4amos",
        "exceptions": "beber|3ieron,renunciar|7ó,yacer|3ieron,oponer|2use,ir|fui,andar|3uvo,mandar|6on,negar|4mos,introducir|7jisteis,usar|3ste,constituir|9mos,aprender|6imos,votar|3é,cansar|5steis,crecer|4isteis,cerrar|6on,costar|6on,unir|3ó,extinguir|7í,desagradecer|10iste,desagradar|8é,meter|3imos,errar|3é,acordar|5é,reservar|7mos,hacer|1icieron,servir|1irvieron,permanecer|8imos,mostrar|6steis,criar|3é,vivir|4ó,teñir|1iñó,cenar|4ste,pagar|3ó,amar|3ste,afirmar|6mos,tocar|4mos,jugar|5on,sentar|6on,oír|2mos,casar|4ste,atraer|4jisteis,apagar|6on,herir|4mos,comprender|8iste,formar|4é,montar|5steis,calentar|8on,abordar|6steis,consistir|8ó,pesar|4ste,convertir|4irtió,huir|3mos,firmar|5ste,venir|1ino,nadar|4ste,oler|2iste,nacer|3isteis,traer|3je,leer|2í,jurar|4ste,coser|3ió,asistir|5í,tener|1uvieron,matar|5on,rezar|2cé,alentar|6mos,agradar|5ó,coger|3imos,sustituir|8ste,evitar|6on,vender|4iste,picar|3ó,peinar|5mos,curar|4mos,echar|5on,tirar|4mos,demostrar|8ste,arrepentirse|9mos,pasar|4mos,poner|1use,acortar|6steis,pedir|4mos,dudar|3é,cesar|4mos,cubrir|4í,caber|1upo,caminar|6steis,sorprender|8ió,tardar|4é,distinguir|9ste,luchar|4é,helar|3é,toser|3imos,insistir|7ste,freír|4steis,acostar|6steis,bordar|6on,aplicar|7on,apretar|6mos,caer|2yeron,verificar|9on,batir|4eron,detener|3uviste,seguir|1iguió,dar|1isteis,duchar|5mos,sonar|3é,robar|5on,mentir|5steis,invertir|3irtieron,mirar|3é,distribuir|9mos,volver|4ió,decir|1ijimos,saber|1upieron,reír|1ieron,vencer|4imos,agradecer|7imos,deber|3í,padecer|5isteis,ofender|5ió,glorificar|7qué,parar|3é,conocer|5isteis,abrir|4eron,untar|5on,borrar|6on,estimar|6ste,contar|4é,cortar|4ó,estar|3uvieron,reinar|6on,soler|3ió,anunciar|6é,producir|5jo,reñir|3í,hervir|5ste,besar|4mos,pegar|3ó,gustar|5mos,reconocer|7imos,aparecer|6iste,emigrar|6ste,ver|1io,contribuir|8í,inducir|4jo,consentir|4intieron,moverse|3isteis,quedarse|5steis,dormir|1urmieron,satisfacer|6icisteis,secarse|4steis,correr|4isteis,prepararse|7ste,conseguir|4iguieron,prever|4isteis,jactarse|5steis,creer|3ísteis,valer|3isteis,poder|1udisteis,zambullirse|8steis,sentirse|5steis,recoger|5isteis,obtener|3uvisteis,exponer|3usisteis",
        "rev": "ebieron|2er,usieron|oner,egieron|2er,frieron|3r,rrieron|2er,icieron|acer,dijeron|1ecir,udaron|4se,nuyeron|2ir,allaron|5se,lvieron|2er,ibieron|3r,alieron|3r,ayeron|1er,atieron|3r,upieron|aber,brieron|3r,irieron|erir,igieron|egir,ndieron|2er,cieron|1er,uvieron|ener,aron|2,loreció|5er,nió|2r,iñó|eñir,nsistió|6r,nvirtió|2ertir,osió|2er,scogió|4er,mprimió|6r,olvió|3er,olió|2er,struyó|4ir,gió|2r,siguió|1eguir,endió|3er,ó|ar,nduvo|2ar,eshizo|3acer,ino|enir,redijo|3ecir,ropuso|3oner,upo|aber,antuvo|3ener,io|er,dujo|2cir,teramos|4rse,ompimos|3er,nceamos|4rse,mitamos|3,ogimos|2er,vinimos|1enir,pusimos|1oner,misteis|1er,osimos|2er,ijimos|ecir,dujimos|2cir,jisteis|cir,endimos|3er,disteis|1er,cimos|1er,cisteis|1er,steis|r,mos|r,onreí|5r,esolví|5er,treví|4erse,ucedí|4er,emí|2er,añí|2er,ebí|2er,cí|1er,í|ir,uisiste|1erer,metiste|3er,liste|1er,dujiste|2cir,raje|2er,tuviste|1ener,puse|1oner,ndiste|2er,ciste|1er,ste|r,unté|3arse,lamé|3arse,feité|4arse,uejé|3arse,cé|zar,gué|1ar,qué|car,é|ar"
      },
      "secondPlural": {
        "rules": "bicar|4steis,abricar|6mos,ceptar|6on,astar|3é,estigar|5ó,omponer|3usimos,omenzar|5ó,raduar|5ste,lorecer|5isteis,ivertir|6steis,esentir|5í,eprimir|5í,roteger|5isteis,intar|4steis,egresar|5ó,squiar|5steis,espedir|6mos,ontecer|5ió,ducar|4mos,estruir|6steis,onfiar|5mos,lonizar|5ó,namorar|7on,ufrir|4ó,onsejar|6steis,lustrar|7on,egatear|5é,omper|3ieron,ailar|4mos,onreír|3ieron,epillar|5é,arrer|3ió,mpezar|4ó,epasar|4é,mportar|5ó,ablecer|5í,ormir|4ste,erretir|3itió,allar|3ó,nvitar|5ste,urlar|4ste,nviar|4mos,obernar|5é,xigir|3í,riunfar|7on,nmigrar|6ste,uerer|1ise,nfadar|5mos,sayunar|6mos,esultar|6ste,rometer|5ieron,gorar|5on,legar|3ué,isfacer|3ice,sgustar|6mos,brazar|3cé,scender|5imos,busar|3ó,onvidar|6steis,tirizar|6steis,eshacer|3ice,lanchar|7on,andonar|6mos,olocar|5ste,uspirar|5é,esolver|5isteis,dvertir|2irtió,orrer|3ieron,onjugar|7on,retener|3uvisteis,dmirar|6on,rrachar|5ó,tenecer|5í,ecidir|5steis,omprar|4é,horrar|4ó,xtender|5imos,postar|4ó,atinar|4ó,terizar|6mos,poyar|4ste,cesitar|6mos,anejar|6on,ompañar|5ó,ariar|5on,lantar|5mos,adrar|4ste,bligar|5ste,taminar|5ó,ndicar|5ste,lenar|3ó,evorar|5mos,onsumir|6mos,sustar|5ste,uceder|4ieron,uivocar|6steis,sponder|5imos,esear|3é,elear|4mos,iquecer|5iste,nseguir|6ste,iseñar|6on,rpretar|6mos,contrar|6steis,liminar|6mos,visar|5on,laticar|6ste,bedecer|5ieron,olgar|4ste,dornar|5mos,evistar|6steis,ocinar|6on,acudir|5ste,eñalar|4ó,sperar|6on,nfluir|5mos,positar|7on,tilizar|6ste,ncender|5isteis,legrar|5ste,aciar|4ste,rever|3imos,dmitir|5eron,ituar|5on,enovar|4é,licitar|6ste,edicar|3qué,ezclar|6on,frecer|4í,quillar|7on,enacer|4iste,cercar|4ó,emer|2iste,nformar|7on,divinar|6ste,reer|2íste,iolar|3é,almar|5on,xplicar|7on,ratar|3é,onfesar|5é,ausar|5on,nvencer|5imos,dificar|6steis,yudar|4mos,sminuir|5í,urgir|4steis,guantar|5ó,hocar|4mos,ruñir|3í,vanzar|6on,equerir|5í,ntrolar|6ste,nstruir|5yeron,asticar|5ó,ondenar|6steis,uemar|3ó,scoger|4isteis,eguntar|5é,ganizar|4cé,fectuar|5é,uardar|5mos,legir|1igió,rrollar|6mos,revivir|6ste,rillar|5ste,rseguir|6mos,ubir|2í,ntregar|6mos,campar|5ste,omar|3steis,liviar|4é,onvenir|3inisteis,mplear|5ste,nfirmar|5ó,ehusar|5steis,ombatir|6mos,rrojar|5steis,ompetir|6steis,bortar|6on,municar|6steis,ibujar|6on,aludar|6on,evolver|5í,aler|2ieron,levar|3é,umentar|7on,preciar|6steis,ijar|3mos,nojar|5on,nventar|7on,esentar|7on,uponer|2usiste,ogar|4on,rohibir|6mos,rear|3mos,orregir|6steis,nservar|5é,omer|2í,uidar|3ó,mprimir|6mos,tumbrar|7on,eriguar|6ste,raducir|4jimos,alir|2í,sconder|5isteis,lcanzar|6mos,burrir|5eron,ograr|5on,siasmar|7on,lquilar|6steis,ermitir|6mos,orir|urió,vejecer|5í,oder|udiste,scansar|5ó,erdonar|5é,ecordar|6steis,ontener|3uvo,adurar|5steis,etestar|7on,oblar|5on,hismear|5é,anar|2é,avar|4on,astimar|6mos,nfermar|7on,ingir|4mos,nversar|6ste,scubrir|6eron,ntinuar|5é,ritar|3é,ncionar|6steis,obrar|3ó,ricular|7on,lmorzar|6steis,ablar|3ó,ecoger|4í,studiar|6ste,mpartir|5í,alvar|4steis,arcar|2qué,añer|2imos,rreglar|7on,ntentar|6mos,ucear|4steis,erder|3iste,ncantar|6mos,erminar|7on,ruzar|4mos,niciar|4é,echazar|6mos,ragar|4ste,espirar|6mos,umplir|5steis,ecibir|5ó,ñadir|4ste,galizar|6mos,epender|5isteis,quistar|5é,olestar|7on,nvocar|3qué,acticar|6ste,riticar|6steis,eredar|5mos,autizar|6mos,nvadir|5eron,epetir|5ste,btener|2uviste,xhibir|5ste,ravesar|5ó,rabajar|5é,nstalar|5é,menazar|6mos,referir|5í,scuchar|7on,bolizar|6steis,plaudir|6steis,iajar|4steis,talecer|5imos,gistrar|7on,xplorar|6ste,omendar|5ó,vorciar|6mos,isitar|5steis,aquecer|5ió,dorar|4steis,cabar|5on,lvidar|5ste,argar|5on,eciclar|6ste,egalar|5steis,ultivar|6ste,avegar|5ste,vacuar|6on,umar|3mos,sfrutar|6steis,nsultar|6mos,estir|istió,cificar|6steis,espetar|6ste,ensurar|6ste,ecorar|5steis,efender|5iste,evantar|6steis,ugerir|5mos,vilizar|4cé,nfiscar|4qué,ncluir|4yeron,antener|3uve,harlar|4ó,amentar|5é,astigar|5ué,tacar|3ó,rovocar|6mos,educir|3je,ascinar|5é,horcar|5ste,xponer|2usimos,oseguir|2iguieron,nsuciar|5é,erecer|4í,entir|4mos,arar|3steis,testar|5ste,ular|3steis,stituir|5í,nsar|4on,otar|3steis,rcer|2ió,ezar|4on,ebrar|3é,eservar|7on,manecer|5ió,firmar|5steis,pagar|3ué,prender|5isteis,piar|3ste,ontar|3ó,decir|1ijimos,tender|4í,ociar|3é,nducir|3jimos,alizar|3cé,oponer|2usisteis,scar|4on,uchar|3ó,igir|3steis,resar|4steis,robar|4mos,par|2mos,ndar|3ste,licar|4ste,elar|4on,ñar|1é,ificar|4ó,rtar|2é,overse|2ió,terarse|3ó,uedarse|4mos,ncearse|4steis,ecarse|3mos,reverse|3ieron,untarse|3ó,pararse|3é,lamarse|4mos,udarse|3steis,allarse|4steis,uejarse|3ó,tarse|3on,irse|í,omit|4aste",
        "exceptions": "dejar|4ste,beber|3isteis,renunciar|8ste,yacer|3iste,ir|fuisteis,odiar|4mos,andar|3uvisteis,negar|3ué,introducir|7je,regir|3í,usar|2é,aprender|6í,parecer|5ieron,crecer|4ieron,cerrar|5mos,costar|5steis,unir|2í,llorar|5steis,extinguir|8mos,desagradecer|10isteis,desagradar|8ó,meter|3isteis,errar|3ó,acordar|6ste,hacer|1icimos,servir|4í,mostrar|5é,desaparecer|9ió,criar|4ste,vivir|4steis,teñir|4steis,cenar|5on,amar|4on,medir|4ste,tocar|3ó,jugar|4steis,saltar|4ó,sentar|4é,oír|2steis,volar|4mos,casar|4mos,atraer|4jimos,herir|1irió,formar|4ó,entrar|4ó,calentar|7mos,abordar|6mos,notar|3ó,consistir|7í,pesar|4mos,faltar|5ste,aprobar|5é,convertir|8mos,huir|3steis,venir|1ine,bajar|4mos,nadar|4steis,oler|2imos,aspirar|6steis,nacer|3ieron,traer|3jo,describir|8ste,leer|2ísteis,jurar|3é,coser|3imos,asistir|6ó,tener|1uve,matar|3ó,lanzar|5steis,alentar|5é,agradar|5é,coger|3ieron,evitar|4ó,vender|4imos,picar|4steis,peinar|6on,curar|4steis,echar|3é,tirar|3é,demostrar|7ó,pasar|5on,poner|1uso,acortar|7on,pedir|1idieron,dudar|3ó,cesar|5on,cubrir|5ste,caber|1upieron,caminar|6mos,durar|3ó,tardar|4ó,distinguir|9eron,sentirse|5mos,helar|3ó,toser|3í,insistir|7eron,freír|2ió,acostar|5é,bordar|5ste,apretar|5é,caer|2yó,batir|4ó,detener|3uvo,seguir|5ste,dar|1ieron,guiar|5on,sonar|3ó,escribir|7steis,regar|4steis,sacar|2qué,invertir|7ste,actuar|4ó,mirar|3ó,distribuir|8í,volver|4imos,decir|1ije,saber|1upo,reír|3mos,vencer|4í,agradecer|7ió,purificar|8mos,deber|3iste,cazar|3ó,padecer|5imos,ofender|5isteis,glorificar|9ste,parar|3ó,conocer|5imos,abrir|3í,untar|3ó,borrar|5mos,estimar|5é,estar|3uvo,reinar|4ó,soler|3iste,anunciar|7mos,producir|5jeron,reñir|4ste,hervir|1irvieron,besar|4steis,pegar|4mos,gustar|4é,reconocer|7iste,aparecer|6imos,emigrar|6steis,ver|1isteis,contribuir|9ste,oponer|2usisteis,proteger|6isteis,broncearse|7steis,resolver|6isteis,correr|4ieron,entretener|6uvisteis,juntarse|4ó,comprender|8isteis,encender|6isteis,mudarse|4steis,escoger|5isteis,proponer|4usisteis,convenir|4inisteis,hallarse|5steis,esconder|6isteis,aburrir|6eron,poder|1udiste,sorprender|8isteis,depender|6isteis,vestir|1istió,proseguir|4iguieron",
        "rev": "ovió|2erse,nteró|4arse,ufrió|4r,arrió|3er,erritió|3etir,dvirtió|2ertir,irió|erir,sistió|5r,ligió|1egir,urió|orir,uejó|3arse,ayó|1er,atió|3r,ecibió|5r,ció|1er,ó|ar,mpieron|2er,nrieron|2eír,etieron|2er,evieron|2erse,edieron|2er,actaron|5se,ogieron|2er,alieron|2er,eitaron|5se,idieron|edir,upieron|aber,brieron|3r,adieron|3r,dujeron|2cir,tieron|2r,uyeron|1ir,cieron|1er,aron|2,uedamos|4rse,ecamos|3rse,icimos|acer,lamamos|4rse,rajimos|2er,limos|1er,eísteis|1er,osimos|2er,añimos|2er,pusimos|1oner,cisteis|1er,dijimos|1ecir,vimos|1er,dujimos|2cir,ndimos|2er,cimos|1er,steis|r,mos|r,uise|1erer,ine|enir,emiste|2er,reíste|2er,mitaste|3,pusiste|1oner,erdiste|3er,ije|ecir,ebiste|2er,tuviste|1ener,oliste|2er,endiste|3er,duje|2cir,ice|acer,tuve|1ener,ciste|1er,ste|r,reparé|5arse,gué|1ar,cé|zar,qué|car,é|ar,rajo|2er,uso|oner,upo|aber,stuvo|2ar,tuvo|1ener,evolví|5er,repentí|6irse,omí|2er,ambullí|6irse,osí|2er,ecogí|4er,endí|3er,cí|1er,í|ir"
      },
      "thirdPlural": {
        "rules": "bicar|4mos,abricar|5ó,apar|3ste,ceptar|5mos,nsentir|6steis,eclarar|5ó,astar|3ó,estigar|6ste,omponer|3usisteis,omenzar|6ste,raduar|5mos,lorecer|5ieron,ivertir|5í,esentir|2intió,eprimir|6ó,roteger|5í,sificar|6mos,intar|4ste,squiar|6on,espedir|3idieron,ontecer|5imos,otestar|7on,spertar|6ste,ducar|3ó,estruir|6ste,onfiar|6on,lonizar|6steis,namorar|6ste,ufrir|4steis,onsejar|6ste,lustrar|6steis,alcular|7on,egatear|6ste,omper|3ió,ailar|4steis,orcer|3ieron,onreír|5mos,epillar|6ste,eportar|6steis,arrer|3iste,mpezar|5mos,epasar|5steis,mportar|5é,ablecer|5isteis,ormir|urmió,erretir|3itieron,allar|3é,ropezar|6ste,rindar|6on,nvitar|5steis,erendar|5é,nviar|3ó,obernar|6steis,xigir|4eron,riunfar|6ste,nmigrar|7on,uebrar|5ste,uerer|1iso,nfadar|5ste,sayunar|6ste,rometer|5isteis,legar|4steis,isfacer|3icimos,brazar|4ó,scender|5iste,busar|3é,onvidar|6mos,eshacer|3icieron,lanchar|6mos,andonar|6steis,olocar|5mos,uspirar|6steis,esolver|5ieron,dvertir|6mos,orrer|3imos,xportar|6ste,onjugar|6mos,retener|3uviste,dmirar|5ste,rrachar|6mos,ecidir|5eron,omprar|5mos,oñar|4on,postar|4é,atinar|5ste,poyar|4steis,cesitar|5é,anejar|5mos,ompañar|5é,ticipar|7on,ariar|4ste,lantar|5steis,adrar|3ó,bligar|6on,taminar|5é,xplotar|6ste,ndicar|5mos,lenar|4steis,evorar|5steis,ulpar|4steis,onsumir|6eron,uceder|4isteis,ublicar|4qué,endecir|3ijiste,sponder|5ieron,esear|5on,elear|4steis,iquecer|5imos,egociar|5ó,nseguir|5í,iseñar|5steis,rpretar|7on,contrar|6mos,liminar|6steis,visar|3ó,laticar|5ó,bedecer|5iste,olgar|4mos,dornar|6on,ocinar|5ste,acudir|5steis,eñalar|4é,sperar|5mos,jercer|4isteis,nfluir|4yó,positar|6mos,tilizar|6steis,ncender|5ieron,legrar|5mos,aciar|3ó,rever|3ió,dmitir|4í,ituar|4ste,enovar|6on,licitar|6steis,edicar|6on,frecer|4iste,nseñar|4ó,quillar|6steis,enacer|4ió,cercar|5ste,emer|2ieron,nformar|6ste,divinar|5é,reer|2ímos,iolar|4ste,almar|4mos,xplicar|6steis,ratar|5on,onfesar|6ste,ausar|4ste,nvencer|5í,dificar|4qué,yudar|5on,sminuir|6ste,urgir|3í,redecir|3ijeron,guantar|7on,hocar|4ste,ruñir|3eron,vanzar|5steis,equerir|3irió,ntrolar|5ó,nstruir|6steis,asticar|6steis,ondenar|5ó,uemar|3é,scoger|4iste,eguntar|5ó,ganizar|7on,roponer|3usiste,fectuar|6mos,uardar|6on,legir|4mos,rrollar|7on,revivir|6eron,rillar|6on,rseguir|2iguieron,ubir|3ste,campar|5mos,omar|3ste,liviar|5mos,mplear|5mos,nificar|6ste,nfirmar|6steis,ehusar|5mos,ombatir|6ste,bortar|5mos,municar|7on,ibujar|5ste,aludar|5steis,evolver|5isteis,aler|2ió,levar|3ó,umentar|6mos,preciar|6mos,ijar|3steis,nventar|6ste,esentar|6steis,evelar|5ste,uscar|3ó,uponer|2usisteis,ogar|2ué,rohibir|6ó,rear|4on,orregir|3igió,omer|2ió,uidar|3é,mprimir|6eron,tumbrar|6ste,eriguar|7on,raducir|4jeron,sociar|5mos,alir|3ó,sconder|5ió,burrir|5ó,ograr|4ste,siasmar|5ó,lquilar|6ste,ermitir|6eron,orir|urieron,vejecer|5ieron,oder|udimos,scansar|5é,nhelar|5ste,erdonar|6mos,ecordar|6ste,ontener|3uve,adurar|5ste,etestar|6mos,hismear|6steis,anar|4on,avar|3mos,astimar|6ste,nfermar|6mos,ingir|3í,nversar|6mos,scubrir|5í,ntinuar|6ste,ritar|3ó,ncionar|7on,obrar|5on,lmorzar|5ó,ecoger|4ieron,studiar|7on,mpartir|6ó,alvar|4ste,arcar|5on,ealizar|6mos,añer|2ó,rreglar|6mos,ntentar|6steis,ucear|4ste,oportar|7on,fligir|5ste,erder|3í,ncantar|6steis,erminar|6steis,ruzar|2cé,niciar|5mos,echazar|5ó,ragar|3ué,espirar|6ste,umplir|5eron,ecibir|5steis,ñadir|4eron,epender|5iste,olestar|6steis,irigir|5mos,acticar|5ó,riticar|6mos,eredar|6on,autizar|5ó,nvadir|5steis,btener|2uvieron,ntestar|6steis,xhibir|5steis,ravesar|5é,rabajar|6steis,nstalar|6ste,menazar|4cé,escar|4steis,referir|3irió,scuchar|6steis,bolizar|5ó,plaudir|6eron,iajar|4mos,talecer|5ió,gistrar|6steis,omendar|6mos,vorciar|5é,ancelar|6steis,isitar|5ste,aquecer|5isteis,cabar|4mos,lvidar|6on,argar|4steis,egalar|5mos,ultivar|7on,avegar|4ué,vacuar|5mos,umar|3steis,sfrutar|6mos,xpresar|6mos,elebrar|5ó,estir|4steis,cificar|6mos,espetar|6mos,ensurar|7on,ecorar|6on,efender|5í,evantar|6mos,ugerir|4í,vilizar|7on,nfiscar|6ste,ncluir|5mos,antener|3uviste,amentar|5ó,astigar|6mos,rovocar|5ó,educir|3jo,ascinar|6mos,horcar|5mos,xponer|2usieron,oseguir|6mos,nsuciar|6steis,erecer|4ieron,resar|5on,stituir|6steis,nsar|3ste,añar|2ó,rlar|2é,tinguir|6steis,ustar|4steis,rizar|4ste,parecer|5í,firmar|6on,ular|3mos,parar|4mos,piar|3mos,vocar|5on,ontar|4ste,sistir|5mos,istar|5on,probar|5steis,clar|3mos,nducir|3jisteis,oser|2ieron,alizar|5ste,anzar|2cé,venir|1inieron,ojar|2ó,petir|1itió,plicar|4ó,aber|upe,blar|3ste,acar|4on,conocer|5ieron,rrar|3ste,ltar|3steis,servar|5steis,necer|3isteis,tender|4ieron,egar|3ste,orar|3mos,overse|2imos,terarse|3é,ncearse|5on,ecarse|4on,reverse|3isteis,pararse|3ó,udarse|3mos,ullirse|4ste,entirse|intió,arse|1ste,omit|4aron",
        "exceptions": "dejar|3ó,beber|3í,renunciar|8mos,yacer|3isteis,oponer|2usieron,ir|fuiste,odiar|4ste,andar|3uvieron,mandar|5mos,introducir|7jo,regir|4steis,usar|2ó,aprender|6ieron,votar|4mos,crecer|4ió,costar|5ste,unir|3eron,desagradecer|10imos,desagradar|9ste,meter|3ió,errar|4mos,acordar|7on,hacer|1ice,servir|5mos,mostrar|5ó,criar|5on,vivir|3í,teñir|3í,cenar|4mos,pagar|4steis,amar|3steis,medir|1idió,tocar|5on,jugar|3ué,saltar|4é,sentar|4ó,oír|2ste,volar|5on,casar|5on,atraer|4jeron,apagar|4ó,herir|3í,comprender|8í,formar|6on,entrar|6on,calentar|7steis,abordar|5é,notar|3é,pesar|5on,convertir|8steis,huir|2yó,bajar|5on,nadar|4mos,oler|2í,aspirar|5ó,nacer|3iste,traer|3jisteis,describir|8ó,leer|2íste,jurar|5on,tener|1uvimos,matar|3é,rezar|4steis,alentar|5ó,agradar|6mos,coger|3isteis,evitar|4é,vender|4í,picar|4ste,peinar|5ste,curar|4ste,echar|3ó,tirar|3ó,demostrar|7é,pasar|4ste,poner|1usieron,acortar|6mos,pedir|4ste,dudar|4ste,cesar|3ó,cubrir|5steis,caminar|7on,durar|4steis,sorprender|8imos,tardar|5ste,luchar|6on,helar|4mos,insistir|7steis,freír|4,acostar|5ó,bordar|5steis,apretar|5ó,caer|2í,verificar|8steis,batir|4steis,detener|3uve,seguir|5mos,clarificar|7qué,dar|1io,guiar|4mos,duchar|4é,sonar|4ste,escribir|7ste,robar|3é,mentir|4í,invertir|6í,actuar|4é,mirar|4mos,distribuir|8yó,volver|4iste,decir|1ijisteis,reír|1io,vencer|4ieron,agradecer|7isteis,purificar|6qué,deber|3ieron,cazar|5on,padecer|5ió,sacrificar|10on,ofender|5iste,glorificar|9mos,abrir|4ó,untar|3é,estimar|5ó,cortar|5ste,estar|3uve,reinar|4é,soler|3isteis,anunciar|7steis,producir|5jimos,reñir|1iñeron,hervir|5steis,besar|5on,gustar|4ó,aparecer|6ieron,emigrar|5ó,ver|1iste,contribuir|9mos,componer|4usisteis,despedir|4idieron,derretir|4itieron,prometer|6isteis,decidir|6eron,atreverse|5isteis,suceder|5isteis,conducir|5jisteis,creer|3ímos,perseguir|4iguieron,devolver|6isteis,valer|3ió,suponer|3usisteis,salir|4ó,permitir|7eron,tañer|3ó,obtener|3uvieron,inducir|4jisteis",
        "rev": "ebí|2er,rotegí|5er,iví|2ir,eñí|2ir,onseguí|6ir,lí|1er,reí|3r,aí|1er,gí|1ir,cí|1er,rí|1ir,tí|1ir,dí|1er,ovimos|2erse,ficimos|1acer,orrimos|3er,udamos|3rse,uvimos|ener,udimos|oder,endimos|3er,listeis|1er,dujimos|2cir,ecimos|2er,cisteis|1er,steis|r,mos|r,nteré|4arse,gué|1ar,iqué|1car,cé|zar,é|ar,esintió|2entir,eprimió|6r,ompió|3er,urmió|ormir,etió|2er,idió|edir,reparó|5arse,revió|3er,enació|4er,orrigió|3egir,omió|2er,scondió|5er,burrió|5r,mpartió|6r,brió|3r,ibió|3r,irió|erir,pitió|1etir,intió|entirse,eció|2er,uyó|1ir,ó|ar,arriste|3er,uedaste|4rse,ice|acer,untaste|4rse,lamaste|4rse,dijiste|1ecir,eíste|1er,actaste|4rse,cogiste|3er,pusiste|1oner,allaste|4rse,eitaste|4rse,ulliste|4rse,uejaste|4rse,olviste|3er,stuve|2ar,tuviste|1ener,upe|aber,tuve|1ener,endiste|3er,ciste|1er,ste|r,ncearon|5se,igieron|3r,ecaron|4se,icieron|acer,lvieron|2er,rajeron|2er,emieron|2er,dijeron|1ecir,mitaron|3,ruñeron|3ir,ivieron|3r,dujeron|2cir,urieron|orir,ogieron|2er,plieron|3r,adieron|3r,ebieron|2er,udieron|3r,iñeron|eñir,mieron|2r,inieron|enir,osieron|2er,usieron|oner,ndieron|2er,cieron|1er,aron|2,uiso|1erer,dujo|2cir"
      }
    },
    "futureTense": {
      "first": {
        "rules": "bicar|5án,abricar|7emos,apar|4é,ceptar|6á,nsentir|7éis,eclarar|7án,astar|5á,estigar|7éis,omponer|5dremos,omenzar|7ás,raduar|6é,ivertir|7emos,esentir|7emos,eprimir|7á,sificar|7éis,intar|5ás,ontecer|7é,otestar|7á,spertar|7emos,ducar|5é,estruir|7é,onfiar|6emos,namorar|7ás,ufrir|5á,alcular|7án,egatear|7á,omper|5á,ailar|5án,orcer|5ás,onreír|4iréis,epillar|7éis,eportar|7éis,arrer|5emos,epasar|6ás,mportar|7á,ablecer|7án,ormir|5án,erretir|7emos,allar|5éis,rindar|6á,nvitar|6é,erendar|7emos,ngañar|6éis,nviar|5án,obernar|7ás,xigir|5é,riunfar|7ás,nmigrar|7ás,uebrar|6ás,uerer|3rán,nfadar|6á,sayunar|7emos,esultar|7éis,rometer|7é,gorar|5ás,legar|5á,isfacer|4rán,brazar|6éis,scender|7é,busar|5emos,onvidar|7éis,tirizar|7ás,eshacer|4rá,lanchar|7emos,andonar|7ás,olocar|6é,esolver|7emos,dvertir|7emos,orrer|5án,xportar|7éis,onjugar|7án,retener|5dréis,dmirar|6emos,rrachar|7éis,tenecer|7éis,ecidir|6ás,omprar|6emos,horrar|6ás,oñar|4éis,xtender|7é,atinar|6emos,terizar|7emos,poyar|5emos,cesitar|7é,ticipar|7emos,ariar|5emos,lantar|6á,adrar|5emos,bligar|6é,taminar|7án,xplotar|7ás,ndicar|6é,lenar|5á,evorar|6emos,ulpar|5é,onsumir|7ás,impiar|6emos,uceder|6éis,uivocar|7ás,ublicar|7é,endecir|7emos,esear|5emos,elear|5éis,nseguir|7á,iseñar|6emos,rpretar|7ás,liminar|7á,visar|5éis,laticar|7é,bedecer|7ás,olgar|5éis,dornar|6á,evistar|7emos,ocinar|6ás,sperar|6é,jercer|6éis,nfluir|6á,positar|7án,tilizar|7éis,ncender|7emos,legrar|6é,aciar|5éis,rever|5éis,dmitir|6ás,enovar|6ás,licitar|7éis,edicar|6ás,ezclar|6é,onducir|7é,nseñar|6éis,quillar|7ás,enacer|6emos,cercar|6emos,emer|4á,divinar|7ás,reer|4ás,almar|5éis,ralizar|7emos,xplicar|7án,ratar|5é,onfesar|7án,ausar|5án,nvencer|7é,dificar|7éis,yudar|5é,sminuir|7emos,urgir|5é,redecir|7án,guantar|7emos,hocar|5éis,ruñir|5emos,vanzar|6emos,nstruir|7ás,asticar|7á,uemar|5ás,eguntar|7án,roponer|5dréis,rrollar|7é,revivir|7ás,rillar|6á,rseguir|7ás,ubir|4emos,ntregar|7emos,campar|6á,omar|4éis,liviar|6emos,onvenir|5dremos,mplear|6án,nificar|7á,nfirmar|7emos,ehusar|6éis,ombatir|7án,rrojar|6éis,ompetir|7éis,bortar|6ás,municar|7emos,ibujar|6ás,evolver|7ás,eplicar|7éis,aler|2dréis,levar|5éis,umentar|7é,preciar|7á,ijar|4emos,nojar|5án,nventar|7emos,esentar|7é,evelar|6é,uscar|5á,uponer|4drán,ogar|4á,rohibir|7á,rear|4án,orregir|7é,omer|4éis,uidar|5án,mprimir|7emos,tumbrar|7á,eriguar|7ás,raducir|7án,alir|2dremos,lcanzar|7ás,burrir|6á,ograr|5ás,siasmar|7emos,lquilar|7emos,ermitir|7emos,orir|4emos,vejecer|7éis,oder|2réis,nhelar|6éis,erdonar|7éis,ecordar|7á,ontener|5dremos,adurar|6éis,etestar|7án,oblar|5á,hismear|7á,anar|4éis,avar|4éis,nfermar|7ás,ingir|5emos,nversar|7emos,scubrir|7éis,ntinuar|7án,ritar|5ás,ncionar|7án,obrar|5á,lmorzar|7án,opiar|5éis,ablar|5éis,ecoger|6án,studiar|7éis,mpartir|7ás,alvar|5emos,arcar|5ás,ealizar|7án,añer|4á,rreglar|7án,ntentar|7án,ucear|5emos,oportar|7emos,fligir|6éis,erder|5án,ncantar|7á,erminar|7emos,ruzar|5á,niciar|6án,echazar|7ás,ragar|5emos,umplir|6éis,ecibir|6éis,ñadir|5éis,galizar|7é,epender|7emos,quistar|7é,olestar|7emos,irigir|6á,nvocar|6emos,acticar|7éis,riticar|7emos,eredar|6á,autizar|7ás,nvadir|6é,epetir|6é,btener|4drás,ntestar|7éis,xhibir|6emos,ravesar|7éis,rabajar|7é,menazar|7emos,escar|5é,referir|7éis,bolizar|7emos,iajar|5án,talecer|7é,xplorar|7é,omendar|7éis,vorciar|7éis,ancelar|7á,isitar|6á,dorar|5emos,cabar|5ás,lvidar|6emos,argar|5emos,eciclar|7án,egalar|6é,ultivar|7emos,avegar|6á,vacuar|6éis,umar|4é,sfrutar|7emos,xpresar|7á,elebrar|7emos,nsultar|7ás,estir|5éis,cificar|7án,espetar|7éis,ensurar|7ás,ecorar|6án,efender|7emos,evantar|7án,vilizar|7é,nfiscar|7emos,ncluir|6emos,antener|5dréis,amentar|7án,astigar|7ás,tacar|5án,rovocar|7é,educir|6emos,ascinar|7éis,horcar|6án,xponer|4dré,oseguir|7éis,nsuciar|7emos,erecer|6ás,egir|4emos,resar|5án,uiar|4éis,edir|4éis,nizar|5emos,ejar|4é,nsar|4emos,pezar|5éis,rlar|4éis,ustar|5é,spirar|6emos,enar|4emos,ostar|5á,añar|4é,ular|4emos,asar|4án,parar|5ás,ontar|5éis,tender|6ás,onder|5ás,quecer|6ás,ociar|5án,udir|4emos,alar|4án,aer|3emos,ser|3á,formar|6á,olar|4emos,ardar|5ás,udar|4emos,servar|6án,stimar|6éis,uchar|5éis,tribuir|7é,robar|5á,conocer|7éis,ger|3emos,erir|4á,tuar|4emos,recer|5éis,trar|4éis,overse|4emos,terarse|5é,uedarse|5é,ncearse|5éis,ecarse|4é,reverse|5éis,pararse|5éis,lamarse|5éis,udarse|4éis,allarse|5éis,eitarse|5éis,ullirse|5ás,uejarse|5á,tarse|3emos,entirse|5emos,omit|4aréis",
        "exceptions": "dejar|5emos,beber|5emos,renunciar|9ás,yacer|5án,oponer|4drán,ir|2é,odiar|5á,andar|5é,mandar|6éis,negar|5éis,introducir|10emos,usar|4án,constituir|10ás,aprender|8ás,votar|5án,cansar|6án,parecer|7ás,crecer|6á,cerrar|6án,costar|6ás,unir|4á,llorar|6ás,extinguir|9éis,desagradecer|12emos,desagradar|10é,meter|5éis,errar|5ás,acordar|7éis,reservar|8á,hacer|2réis,servir|6éis,permanecer|10é,criar|5éis,vivir|5án,teñir|5é,pagar|5éis,amar|4án,afirmar|7á,tocar|5é,jugar|5emos,saltar|6án,sentar|6ás,oír|1iréis,volar|5á,atraer|6án,apagar|6án,comprender|10emos,entrar|6ás,calentar|8emos,abordar|7emos,notar|5emos,consistir|9éis,pesar|5án,faltar|6éis,aprobar|7ás,convertir|9éis,huir|4emos,firmar|6ás,venir|3dréis,bajar|5ás,nadar|5ás,oler|4án,aspirar|7ás,nacer|5á,describir|9ás,leer|4á,jurar|5á,asistir|7á,tener|3dréis,matar|5án,rezar|5ás,lanzar|6éis,alentar|7án,agradar|7éis,sustituir|9án,evitar|6án,vender|6éis,picar|5é,peinar|6éis,curar|5emos,echar|5á,tirar|5án,demostrar|9á,amanecer|8emos,poner|3drán,acortar|7éis,pedir|5é,cesar|5ás,cubrir|6é,caber|3rás,caminar|7éis,durar|5á,sorprender|10éis,distinguir|10emos,luchar|6án,helar|5á,toser|5é,insistir|8é,freír|3iremos,bordar|6éis,aplicar|7ás,apretar|7á,verificar|9emos,batir|5á,detener|5dremos,seguir|6án,clarificar|10emos,dar|3ás,sonar|5á,escribir|8emos,regar|5éis,sacar|5á,mentir|6é,invertir|8á,mirar|5éis,volver|6á,decir|1iré,saber|3remos,reír|2iré,vencer|6án,agradecer|9án,purificar|9á,deber|5éis,cazar|5emos,padecer|7ás,sacrificar|10é,ofender|7éis,glorificar|10é,abrir|5ás,untar|5é,borrar|6éis,cortar|6emos,estar|5ás,reinar|6án,soler|5ás,anunciar|8emos,producir|8éis,reñir|5á,hervir|6á,besar|5emos,pegar|5emos,gustar|6án,emigrar|7éis,ver|3á,inducir|7ás,moverse|5emos,atreverse|7éis,juntarse|6emos,jactarse|6emos,vomit|5aréis,convenir|6dremos,hallarse|6éis,afeitarse|7éis,arrepentirse|10emos,sentirse|6emos",
        "rev": "nteraré|6se,uedaré|5se,ecaré|4se,eiré|1ír,xpondré|4er,ré|1,reiréis|2ír,cearéis|4se,araréis|4se,amaréis|4se,udaréis|4se,ldremos|1ir,odréis|2er,abrás|2er,ullirás|5se,eiremos|1ír,abremos|2er,tendrás|3er,ndremos|1er,dréis|er,rás|1,réis|1,remos|1,uerrán|3er,isfarán|4cer,pondrán|3er,rán|1,eshará|4cer,uejará|5se,rá|1"
      },
      "second": {
        "rules": "bicar|5ás,abricar|7éis,apar|4á,ceptar|6ás,nsentir|7ás,eclarar|7ás,astar|5é,omponer|5drán,omenzar|7emos,raduar|6á,lorecer|7é,ivertir|7á,esentir|7éis,eprimir|7é,roteger|7án,sificar|7emos,intar|5á,egresar|7á,squiar|6án,ontecer|7á,otestar|7é,spertar|7é,ducar|5emos,estruir|7á,onfiar|6é,lonizar|7éis,namorar|7emos,ufrir|5é,lustrar|7emos,egatear|7é,omper|5é,ailar|5ás,onreír|4iré,epillar|7á,eportar|7á,epasar|6án,mportar|7emos,ablecer|7ás,ormir|5ás,erretir|7é,allar|5án,rindar|6é,nvitar|6á,erendar|7éis,ngañar|6ás,urlar|5án,nviar|5emos,obernar|7án,xigir|5án,riunfar|7án,uebrar|6emos,uerer|3rás,nfadar|6é,sayunar|7ás,esultar|7á,rometer|7éis,gorar|5án,isfacer|4rás,brazar|6ás,scender|7á,busar|5é,tirizar|7án,eshacer|4ré,lanchar|7éis,andonar|7án,olocar|6á,esolver|7á,dvertir|7éis,xportar|7án,onjugar|7ás,retener|5dremos,dmirar|6ás,rrachar|7emos,tenecer|7ás,ecidir|6án,omprar|6án,horrar|6án,oñar|4ás,xtender|7á,atinar|6ás,terizar|7éis,poyar|5ás,cesitar|7á,ticipar|7ás,ariar|5éis,lantar|6é,adrar|5é,egular|6éis,bligar|6á,taminar|7ás,xplotar|7án,ndicar|6á,lenar|5é,evorar|6án,ulpar|5á,onsumir|7án,eparar|6á,impiar|6é,uceder|6emos,uivocar|7án,ublicar|7á,endecir|7éis,esear|5ás,elear|5emos,nseguir|7ás,iseñar|6é,contrar|7emos,visar|5án,laticar|7ás,olgar|5emos,dornar|6é,evistar|7é,acudir|6éis,eñalar|6ás,sperar|6ás,nfluir|6é,positar|7ás,tilizar|7ás,ncender|7éis,legrar|6á,aciar|5emos,rever|5án,dmitir|6é,ituar|5éis,enovar|6án,licitar|7é,edicar|6án,ezclar|6á,frecer|6án,onducir|7ás,nseñar|6án,quillar|7án,enacer|6ás,cercar|6éis,emer|4ás,divinar|7án,reer|4án,almar|5emos,ralizar|7éis,xplicar|7ás,ratar|5á,onfesar|7ás,nvencer|7á,dificar|7án,yudar|5á,sminuir|7ás,urgir|5á,redecir|7ás,guantar|7éis,hocar|5á,vanzar|6é,equerir|7ás,nstruir|7án,asticar|7é,ondenar|7á,uemar|5án,scoger|6éis,eguntar|7ás,ganizar|7ás,roponer|5drás,fectuar|7ás,uardar|6án,legir|5án,rrollar|7á,rillar|6é,rseguir|7án,ubir|4ás,ntregar|7á,campar|6án,omar|4é,liviar|6á,onvenir|5dréis,mplear|6ás,nificar|7é,nfirmar|7é,ombatir|7ás,rrojar|6emos,ompetir|7emos,bortar|6án,municar|7ás,ibujar|6án,evolver|7án,eplicar|7á,aler|2dré,levar|5ás,umentar|7á,preciar|7é,ijar|4á,nojar|5ás,nventar|7á,esentar|7á,evelar|6án,uponer|4dremos,ogar|4é,rohibir|7é,rear|4ás,orregir|7á,omer|4emos,uidar|5ás,mprimir|7ás,tumbrar|7é,eriguar|7án,raducir|7ás,alir|2dré,burrir|6é,siasmar|7éis,lquilar|7é,ermitir|7ás,orir|4án,vejecer|7á,oder|2ré,erdonar|7emos,ecordar|7é,ontener|5dré,adurar|6emos,etestar|7ás,hismear|7éis,anar|4án,avar|4á,astimar|7emos,nfermar|7án,ingir|5á,nversar|7éis,ntinuar|7éis,ritar|5án,ncionar|7ás,obrar|5é,lmorzar|7ás,opiar|5án,ecoger|6ás,studiar|7án,mpartir|7án,alvar|5án,arcar|5án,ealizar|7ás,añer|4é,rreglar|7éis,ntentar|7ás,ucear|5á,oportar|7é,erder|5ás,ncantar|7é,ruzar|5é,niciar|6ás,echazar|7án,ragar|5éis,espirar|7ás,umplir|6emos,ecibir|6é,ñadir|5án,galizar|7á,epender|7ás,quistar|7á,olestar|7ás,nvocar|6ás,acticar|7ás,riticar|7á,eredar|6é,autizar|7án,nvadir|6á,epetir|6ás,btener|4drán,ntestar|7emos,xhibir|6éis,ravesar|7é,rabajar|7á,nstalar|7emos,menazar|7é,escar|5á,referir|7án,scuchar|7emos,bolizar|7é,teresar|7ás,plaudir|7án,iajar|5ás,talecer|7éis,xplorar|7á,omendar|7án,vorciar|7á,ancelar|7é,isitar|6é,dorar|5á,cabar|5án,argar|5án,eciclar|7ás,egalar|6á,ultivar|7á,vacuar|6ás,umar|4á,sfrutar|7ás,xpresar|7emos,elebrar|7án,nsultar|7án,estir|5ás,cificar|7ás,ensurar|7án,ecorar|6ás,efender|7éis,evantar|7emos,ugerir|6é,vilizar|7emos,ncluir|6án,antener|5dremos,harlar|6emos,amentar|7ás,tacar|5ás,rovocar|7á,educir|6éis,horcar|6ás,xponer|4drán,oseguir|7emos,nsuciar|7á,erecer|6éis,stigar|6án,edir|4emos,ejar|4á,cular|5ás,nsar|4á,otar|4ás,rcer|4án,rrer|4ás,pezar|5é,ustar|5á,vidar|5é,spirar|6án,manecer|7á,ñir|3ás,ostar|5é,añar|4á,quecer|6án,ociar|5ás,etar|4án,cinar|5án,nvertir|7é,aer|3é,ser|3é,formar|6é,olar|4á,anzar|5án,udar|4éis,scar|4é,servar|6ás,helar|5emos,aber|2rán,uchar|5é,blar|4é,cubrir|6á,igir|4é,tribuir|7á,conocer|7emos,grar|4án,decer|5án,vir|3án,strar|5é,minar|5é,usar|4ás,egar|4é,nder|4án,overse|4ás,terarse|5á,ncearse|5ás,ecarse|4á,reverse|5é,pararse|5emos,lamarse|5é,allarse|5án,eitarse|5á,ullirse|5án,uejarse|5é,darse|3á,tarse|3án,omit|4aré",
        "exceptions": "dejar|5án,beber|5éis,renunciar|9án,yacer|5ás,oponer|4dremos,ir|2á,odiar|5é,andar|5emos,mandar|6á,introducir|10án,regir|5ás,constituir|10emos,cansar|6ás,parecer|7án,crecer|6é,cerrar|6ás,costar|6án,unir|4é,llorar|6án,extinguir|9emos,desagradar|10á,meter|5emos,errar|5án,acordar|7ás,reservar|8éis,hacer|2rás,desaparecer|11ás,criar|5án,vivir|5á,cenar|5án,pagar|5emos,amar|4ás,afirmar|7éis,tocar|5emos,jugar|5án,saltar|6ás,sentar|6án,oír|1irán,volar|5é,casar|5ás,atraer|6ás,apagar|6ás,herir|5é,entrar|6éis,montar|6emos,calentar|8á,abordar|7éis,consistir|9emos,pesar|5ás,faltar|6emos,aprobar|7án,huir|4éis,firmar|6án,venir|3dremos,bajar|5án,nadar|5án,oler|4ás,nacer|5é,describir|9án,leer|4é,jurar|5án,asistir|7é,tener|3drán,matar|5ás,rezar|5án,alentar|7ás,agradar|7án,coger|5á,sustituir|9ás,evitar|6ás,picar|5á,peinar|6emos,curar|5éis,echar|5é,tirar|5ás,arrepentirse|10éis,pasar|5éis,poner|3drás,acortar|7emos,pedir|5á,cesar|5éis,durar|5é,tardar|6éis,distinguir|10án,sentirse|6á,toser|5emos,insistir|8á,freír|3irá,bordar|6á,aplicar|7án,apretar|7é,verificar|9ás,batir|5é,detener|5dréis,seguir|6emos,clarificar|10éis,dar|3án,guiar|5á,sonar|5é,escribir|8éis,regar|5emos,robar|5éis,sacar|5é,mentir|6á,actuar|6á,mirar|5é,volver|6é,decir|1irá,reír|2irás,vencer|6ás,agradecer|9á,purificar|9é,deber|5é,cazar|5éis,sacrificar|10á,ofender|7emos,glorificar|10éis,parar|5án,abrir|5án,untar|5á,borrar|6emos,estimar|7é,contar|6á,cortar|6é,probar|6é,estar|5á,reinar|6éis,soler|5án,anunciar|8ás,producir|8á,reñir|5éis,besar|5é,gustar|6ás,aparecer|8á,ver|3é,inducir|7án,prepararse|8emos,mudarse|5á,convenir|6dréis,hallarse|6án,valer|3dré,salir|3dré",
        "rev": "overás|4se,ncearás|5se,uerrás|3er,isfarás|4cer,eirás|1ír,pondrás|3er,ndremos|1er,réis|1,remos|1,rás|1,nterará|6se,uedará|5se,ecará|4se,feitará|6se,reirá|2ír,rá|1,onreiré|4ír,esharé|4cer,treveré|6se,lamaré|5se,omitaré|4,odré|2er,ntendré|4er,uejaré|5se,ré|1,untarán|5se,actarán|5se,ullirán|5se,abrán|2er,ndrán|1er,rán|1"
      },
      "third": {
        "rules": "bicar|5éis,abricar|7ás,apar|4emos,ceptar|6án,nsentir|7án,astar|5emos,estigar|7ás,omponer|5drás,omenzar|7á,raduar|6emos,lorecer|7án,ivertir|7án,esentir|7á,roteger|7ás,sificar|7á,intar|5é,egresar|7é,squiar|6ás,ontecer|7ás,otestar|7ás,spertar|7á,ducar|5á,onfiar|6á,namorar|7á,ufrir|5éis,onsejar|7emos,lustrar|7á,alcular|7é,egatear|7éis,omper|5emos,ailar|5éis,orcer|5éis,onreír|4irás,epillar|7é,eportar|7é,arrer|5án,epasar|6é,mportar|7é,ablecer|7emos,ormir|5é,erretir|7á,allar|5ás,rindar|6emos,nvitar|6éis,erendar|7án,ngañar|6án,urlar|5ás,nviar|5éis,obernar|7emos,xigir|5ás,riunfar|7emos,nmigrar|7é,uebrar|6á,uerer|3remos,nfadar|6éis,sayunar|7á,gorar|5á,legar|5án,isfacer|4rá,sgustar|7án,brazar|6é,scender|7emos,busar|5á,tirizar|7éis,lanchar|7án,andonar|7emos,olocar|6éis,uspirar|7ás,esolver|7é,dvertir|7á,orrer|5é,xportar|7ás,onjugar|7éis,retener|5drá,dmirar|6án,rrachar|7é,tenecer|7án,ecidir|6emos,omprar|6ás,horrar|6emos,oñar|4án,xtender|7án,atinar|6án,terizar|7é,poyar|5án,anejar|6án,ompañar|7ás,ticipar|7án,ariar|5é,adrar|5á,egular|6á,taminar|7emos,xplotar|7emos,ndicar|6án,lenar|5éis,evorar|6ás,ulpar|5emos,onsumir|7é,sustar|6emos,impiar|6éis,uceder|6ás,uivocar|7é,ublicar|7éis,endecir|7é,ntender|7éis,esear|5án,elear|5án,iquecer|7emos,egociar|7éis,nseguir|7án,rpretar|7á,contrar|7á,liminar|7ás,visar|5ás,bedecer|7éis,olgar|5á,dornar|6éis,evistar|7á,ocinar|6emos,acudir|6é,eñalar|6é,sperar|6án,jercer|6emos,nfluir|6éis,ncender|7é,legrar|6emos,aciar|5é,rever|5ás,dmitir|6á,ituar|5á,enovar|6emos,licitar|7á,edicar|6emos,frecer|6ás,onducir|7án,quillar|7emos,enacer|6án,cercar|6á,nformar|7emos,divinar|7á,reer|4é,iolar|5é,almar|5án,ralizar|7é,ratar|5án,onfesar|7éis,ausar|5éis,nvencer|7emos,dificar|7ás,sminuir|7án,urgir|5ás,redecir|7emos,guantar|7á,hocar|5án,vanzar|6á,equerir|7án,ntrolar|7án,ondenar|7é,uemar|5emos,eguntar|7é,roponer|5drán,fectuar|7án,legir|5ás,rrollar|7éis,revivir|7emos,rillar|6éis,rseguir|7emos,ubir|4án,campar|6é,omar|4á,liviar|6é,mplear|6éis,nificar|7emos,nfirmar|7á,ehusar|6án,rrojar|6án,ompetir|7é,bortar|6emos,municar|7án,ibujar|6éis,aludar|6é,evolver|7á,eplicar|7án,aler|2drá,levar|5án,preciar|7emos,ijar|4é,nojar|5é,nventar|7é,evelar|6ás,uscar|5ás,uponer|4dré,ogar|4éis,rohibir|7éis,rear|4emos,orregir|7emos,nservar|7éis,uidar|5éis,tumbrar|7éis,eriguar|7éis,raducir|7emos,sociar|6á,alir|2drán,lcanzar|7emos,burrir|6emos,ograr|5éis,siasmar|7ás,lquilar|7á,ermitir|7án,orir|4ás,vejecer|7é,oder|2rá,nhelar|6á,erdonar|7é,ecordar|7emos,ontener|5dréis,adurar|6á,etestar|7á,oblar|5éis,hismear|7é,anar|4ás,avar|4é,astimar|7é,nfermar|7é,ingir|5é,nversar|7á,scubrir|7ás,ntinuar|7emos,ncionar|7emos,obrar|5éis,ricular|7án,lmorzar|7á,opiar|5ás,ablar|5á,ecoger|6á,studiar|7ás,mpartir|7é,alvar|5é,ealizar|7emos,añer|4án,rreglar|7á,ucear|5é,oportar|7á,fligir|6á,erder|5á,erminar|7á,ruzar|5emos,niciar|6éis,echazar|7éis,ragar|5án,espirar|7án,umplir|6án,ecibir|6á,ñadir|5ás,galizar|7ás,epender|7éis,quistar|7án,olestar|7án,irigir|6éis,nvocar|6án,riticar|7é,eredar|6ás,autizar|7á,nvadir|6éis,epetir|6án,btener|4dremos,ntestar|7é,xhibir|6ás,ravesar|7á,nstalar|7éis,menazar|7á,escar|5án,referir|7ás,bolizar|7éis,teresar|7á,plaudir|7ás,talecer|7ás,gistrar|7án,xplorar|7éis,omendar|7ás,vorciar|7ás,ancelar|7emos,isitar|6éis,aquecer|7éis,dorar|5é,argar|5ás,egalar|6emos,ultivar|7é,avegar|6án,vacuar|6án,umar|4emos,sfrutar|7án,xpresar|7éis,elebrar|7ás,cificar|7á,espetar|7ás,ensurar|7á,ecorar|6é,efender|7é,ugerir|6éis,nfiscar|7á,ncluir|6ás,antener|5dré,harlar|6án,tacar|5á,rovocar|7emos,educir|6án,ascinar|7ás,xponer|4drás,oseguir|7án,nsuciar|7é,erecer|6á,arar|4éis,primir|6án,edir|4é,struir|6emos,nizar|5án,nsar|4é,pezar|5á,ostar|5éis,sultar|6é,meter|5án,vidar|5á,hacer|2rán,ñir|3án,altar|5á,igar|4emos,prender|7ás,onder|5emos,bordar|6é,señar|5ás,ilizar|6án,clar|4éis,aer|3á,mer|3án,plicar|6á,udar|4án,coger|5é,ardar|5á,regar|5é,venir|3dré,batir|5éis,mentar|6emos,aber|2réis,rcar|4éis,uchar|5án,adecer|6é,ajar|4emos,antar|5éis,ticar|5án,stir|4án,bar|3emos,itar|4emos,entar|5éis,overse|4án,terarse|5emos,uedarse|5ás,ncearse|5án,ecarse|4ás,reverse|5á,pararse|5án,lamarse|5emos,udarse|4é,allarse|5ás,eitarse|5é,ullirse|5emos,uejarse|5éis,tarse|3ás,omit|4arán",
        "exceptions": "dejar|5ás,beber|5ás,renunciar|9emos,yacer|5éis,oponer|4drás,ir|2án,ser|3éis,odiar|5emos,andar|5ás,mandar|6emos,negar|5á,introducir|10ás,regir|5á,usar|4á,constituir|10á,aprender|8é,votar|5é,cansar|6éis,parecer|7éis,crecer|6éis,cerrar|6á,unir|4ás,llorar|6é,extinguir|9á,desagradecer|12ás,desagradar|10éis,errar|5emos,acordar|7án,reservar|8ás,servir|6ás,permanecer|10emos,mostrar|7á,desaparecer|11án,criar|5ás,vivir|5é,cenar|5ás,pagar|5é,amar|4éis,afirmar|7é,tocar|5éis,jugar|5ás,oír|1irá,volar|5éis,casar|5éis,atraer|6emos,apagar|6éis,herir|5éis,formar|6ás,entrar|6án,montar|6ás,notar|5án,pesar|5á,convertir|9á,huir|4é,firmar|6emos,bajar|5á,nadar|5emos,oler|4á,aspirar|7é,nacer|5ás,describir|9éis,leer|4emos,jurar|5ás,coser|5emos,tener|3drás,matar|5á,rezar|5é,bañar|5emos,lanzar|6ás,agradar|7ás,sustituir|9é,vender|6ás,picar|5emos,peinar|6á,curar|5án,echar|5éis,tirar|5emos,demostrar|9emos,arrepentirse|10é,pasar|5ás,amanecer|8é,poner|3dréis,acortar|7ás,pedir|5emos,cesar|5emos,cubrir|6éis,caminar|7á,durar|5ás,distinguir|10ás,preservar|9emos,luchar|6á,sentirse|6ás,helar|5éis,toser|5ás,insistir|8éis,freír|3iré,acostar|7án,apretar|7éis,verificar|9é,detener|5dré,seguir|6ás,clarificar|10á,dar|3emos,guiar|5é,sonar|5án,escribir|8á,robar|5é,sacar|5éis,mentir|6emos,invertir|8éis,actuar|6é,mirar|5á,distribuir|10emos,volver|6éis,decir|1irán,atender|7emos,reír|2irán,vencer|6á,purificar|9éis,deber|5á,cazar|5ás,sacrificar|10emos,ofender|7ás,glorificar|10ás,parar|5é,conocer|7é,abrir|5emos,untar|5emos,borrar|6é,estimar|7á,contar|6é,cortar|6á,estar|5é,reinar|6ás,soler|5emos,anunciar|8án,producir|8é,reñir|5é,hervir|6é,besar|5á,pegar|5á,gustar|6é,reconocer|9án,aparecer|8é,emigrar|7ás,ver|3ás,contribuir|10éis,inducir|7á,enterarse|7emos,hacer|2rán,llamarse|6emos,mudarse|5é,hallarse|6ás",
        "rev": "overán|4se,ncearán|5se,esharán|4cer,pararán|5se,mitarán|3,pondrán|3er,aldrán|2ir,eirán|1ír,rán|1,nreirás|3ír,uedarás|5se,erremos|2er,ecarás|4se,untarás|5se,actarás|5se,liremos|3se,entirás|5se,ejaréis|4se,ndremos|1er,ndréis|1er,abréis|2er,ndrás|1er,rás|1,réis|1,remos|1,tisfará|5cer,treverá|6se,odrá|2er,drá|er,rá|1,feitaré|6se,pentiré|6se,reiré|2ír,vendré|3ir,ndré|1er,ré|1"
      },
      "firstPlural": {
        "rules": "bicar|5emos,abricar|7án,ceptar|6emos,nsentir|7á,astar|5éis,estigar|7é,omponer|5dré,omenzar|7é,raduar|6éis,lorecer|7ás,ivertir|7ás,esentir|7é,eprimir|7éis,roteger|7éis,sificar|7é,intar|5án,egresar|7ás,ontecer|7án,otestar|7éis,spertar|7ás,ducar|5éis,estruir|7án,onfiar|6ás,lonizar|7ás,namorar|7é,ufrir|5ás,onsejar|7éis,lustrar|7é,alcular|7emos,egatear|7emos,ensar|5éis,omper|5éis,ailar|5é,orcer|5emos,onreír|4irán,epillar|7án,eportar|7ás,arrer|5á,mpezar|6án,mportar|7éis,ablecer|7éis,erretir|7éis,allar|5á,ropezar|7emos,rindar|6éis,nvitar|6emos,erendar|7ás,ngañar|6emos,urlar|5á,nviar|5á,obernar|7é,xigir|5éis,riunfar|7éis,nmigrar|7á,uerer|3rá,nfadar|6emos,sayunar|7é,esultar|7án,gorar|5é,legar|5ás,isfacer|4ré,sgustar|7ás,brazar|6á,scender|7éis,busar|5án,onvidar|7ás,tirizar|7é,eshacer|4rás,andonar|7é,olocar|6emos,uspirar|7é,esolver|7ás,dvertir|7é,orrer|5éis,xportar|7é,onjugar|7emos,retener|5dré,dmirar|6á,rrachar|7á,tenecer|7é,ecidir|6éis,omprar|6éis,oñar|4emos,xtender|7ás,atinar|6éis,terizar|7á,poyar|5á,anejar|6ás,ompañar|7án,ariar|5á,lantar|6án,adrar|5ás,bligar|6án,taminar|7á,ndicar|6ás,lenar|5emos,evorar|6éis,ulpar|5án,eparar|6án,sustar|6éis,impiar|6á,uceder|6án,uivocar|7á,ublicar|7ás,endecir|7á,ntender|7emos,sponder|7á,esear|5éis,elear|5ás,iquecer|7éis,iseñar|6án,rpretar|7é,contrar|7é,liminar|7án,visar|5é,laticar|7emos,bedecer|7emos,olgar|5é,dornar|6ás,ocinar|6é,eñalar|6á,sperar|6éis,jercer|6ás,nfluir|6án,tilizar|7á,ncender|7á,legrar|6án,aciar|5á,rever|5emos,dmitir|6éis,ituar|5é,enovar|6á,licitar|7emos,edicar|6éis,ezclar|6ás,frecer|6é,onducir|7emos,nseñar|6emos,quillar|7é,enacer|6á,cercar|6é,emer|4emos,nformar|7éis,divinar|7é,reer|4á,iolar|5éis,almar|5ás,ralizar|7á,ratar|5ás,onfesar|7emos,ausar|5emos,nvencer|7éis,dificar|7é,sminuir|7éis,urgir|5emos,redecir|7éis,guantar|7é,hocar|5ás,ruñir|5á,vanzar|6éis,equerir|7é,ntrolar|7ás,nstruir|7á,asticar|7ás,uemar|5éis,scoger|6án,eguntar|7á,ganizar|7éis,roponer|5drá,fectuar|7á,legir|5á,rrollar|7emos,revivir|7á,rillar|6emos,ubir|4é,ntregar|7án,omar|4emos,liviar|6éis,onvenir|5drá,mplear|6emos,nificar|7éis,nfirmar|7ás,ehusar|6á,ombatir|7emos,rrojar|6ás,ompetir|7án,bortar|6éis,municar|7é,ibujar|6é,aludar|6á,evolver|7é,eplicar|7ás,aler|2drás,levar|5emos,umentar|7án,preciar|7ás,ijar|4ás,nojar|5éis,nventar|7éis,esentar|7án,evelar|6éis,uscar|5án,uponer|4drá,ogar|4emos,rohibir|7emos,rear|4é,orregir|7án,nservar|7é,omer|4ás,uidar|5emos,tumbrar|7emos,eriguar|7á,raducir|7éis,alir|2dréis,sconder|7éis,lcanzar|7á,burrir|6ás,ograr|5emos,siasmar|7án,lquilar|7éis,ermitir|7é,orir|4éis,vejecer|7emos,oder|2rás,scansar|7ás,nhelar|6é,erdonar|7á,ecordar|7ás,adurar|6é,etestar|7é,oblar|5án,hismear|7emos,anar|4á,avar|4emos,astimar|7á,nfermar|7emos,ingir|5ás,nversar|7é,scubrir|7án,ntinuar|7á,ritar|5éis,ncionar|7á,obrar|5ás,lmorzar|7éis,opiar|5emos,ablar|5ás,ecoger|6é,studiar|7emos,mpartir|7á,alvar|5á,ealizar|7éis,añer|4ás,rreglar|7é,ntentar|7é,ucear|5éis,oportar|7éis,fligir|6emos,erder|5é,ncantar|7emos,erminar|7éis,ruzar|5ás,niciar|6emos,echazar|7á,ragar|5ás,espirar|7éis,umplir|6ás,ecibir|6án,ñadir|5emos,galizar|7án,epender|7é,olestar|7éis,irigir|6án,acticar|7emos,riticar|7éis,eredar|6án,autizar|7é,nvadir|6án,epetir|6emos,btener|4dréis,ntestar|7á,xhibir|6é,ravesar|7emos,rabajar|7án,menazar|7ás,escar|5ás,referir|7é,bolizar|7á,talecer|7án,gistrar|7ás,xplorar|7emos,omendar|7é,vorciar|7án,ancelar|7ás,isitar|6ás,aquecer|7á,dorar|5éis,lvidar|6án,argar|5éis,eciclar|7emos,ultivar|7ás,avegar|6ás,vacuar|6é,umar|4éis,sfrutar|7é,nsultar|7emos,estir|5é,cificar|7é,espetar|7emos,ensurar|7é,ecorar|6éis,efender|7á,evantar|7á,ugerir|6án,vilizar|7ás,nfiscar|7éis,ncluir|6éis,harlar|6ás,amentar|7á,astigar|7éis,tacar|5é,educir|6ás,ascinar|7emos,xponer|4dréis,oseguir|7ás,nsuciar|7éis,erecer|6é,nunciar|7éis,arar|4á,uiar|4emos,edir|4á,ostar|5emos,ebrar|5é,meter|5ás,orrar|5á,enar|4éis,sitar|5éis,ular|4é,otar|4éis,aer|3éis,ociar|5é,sistir|6ás,istar|5ás,udir|4á,ajar|4é,oser|4án,plicar|6é,udar|4ás,ardar|5é,einar|5é,cortar|6án,ntener|4drá,rcar|4emos,vocar|5éis,alar|4ás,resar|5é,oler|4é,par|3éis,asar|4á,mir|3á,bar|3éis,rificar|7án,guir|4é,char|4ás,overse|4éis,terarse|5éis,ncearse|5é,ecarse|4án,reverse|5ás,untarse|5á,pararse|5ás,lamarse|5á,actarse|5éis,allarse|5emos,eitarse|5emos,ullirse|5é,uejarse|5án,darse|3án,omit|4ará",
        "exceptions": "dejar|5é,beber|5án,yacer|5é,oponer|4dréis,ir|2ás,ser|3ás,odiar|5án,andar|5án,mandar|6é,negar|5emos,introducir|10á,regir|5é,usar|4é,constituir|10é,aprender|8á,votar|5á,cansar|6é,parecer|7emos,crecer|6emos,cerrar|6é,unir|4án,llorar|6á,desagradecer|12éis,desagradar|10ás,errar|5éis,acordar|7é,reservar|8án,hacer|2ré,servir|6á,permanecer|10éis,mostrar|7emos,desaparecer|11á,criar|5é,vivir|5ás,teñir|5éis,pagar|5á,amar|4emos,afirmar|7emos,tocar|5á,jugar|5éis,saltar|6éis,sentar|6é,oír|1iremos,volar|5án,apagar|6emos,herir|5emos,comprender|10éis,formar|6án,entrar|6emos,montar|6án,calentar|8é,abordar|7á,pesar|5é,faltar|6é,convertir|9ás,huir|4á,firmar|6éis,venir|3drás,nadar|5éis,aspirar|7á,nacer|5án,traer|5ás,describir|9á,leer|4éis,jurar|5éis,tener|3dré,matar|5é,rezar|5á,bañar|5ás,lanzar|6emos,alentar|7emos,agradar|7emos,coger|5ás,sustituir|9éis,evitar|6á,vender|6é,picar|5éis,curar|5ás,echar|5emos,tirar|5á,demostrar|9án,arrepentirse|10á,amanecer|8án,poner|3drá,pedir|5án,cesar|5án,cubrir|6emos,caber|3remos,caminar|7emos,durar|5emos,sorprender|10é,distinguir|10éis,preservar|9éis,sentirse|6án,helar|5ás,insistir|8án,freír|3iréis,acostar|7ás,bordar|6emos,apretar|7án,batir|5án,detener|5drá,clarificar|10é,dar|3éis,sonar|5ás,escribir|8é,regar|5á,robar|5ás,sacar|5emos,mentir|6ás,invertir|8emos,actuar|6éis,mirar|5án,distribuir|10éis,volver|6án,decir|1irás,atender|7á,saber|3rá,reír|2iremos,vencer|6é,agradecer|9emos,deber|5ás,cazar|5án,padecer|7á,sacrificar|10ás,ofender|7án,conocer|7á,abrir|5éis,untar|5éis,estimar|7emos,contar|6ás,estar|5emos,producir|8emos,reñir|5emos,hervir|6emos,besar|5ás,pegar|5éis,gustar|6á,reconocer|9ás,aparecer|8ás,emigrar|7é,ver|3án,contribuir|10emos,inducir|7é,enterarse|7éis,juntarse|6á,hallarse|6emos,afeitarse|7emos",
        "rev": "overéis|4se,esharás|4cer,reverás|5se,pararás|5se,endrás|2ir,ctaréis|4se,aldrás|2er,aldréis|2ir,odrás|2er,abremos|2er,reiréis|2ír,eiremos|1ír,ndréis|1er,remos|1,rás|1,réis|1,nreirán|3ír,uedarán|5se,ecarán|4se,udarán|4se,entirán|5se,uejarán|5se,rán|1,oncearé|6se,tisfaré|5cer,bulliré|6se,ndré|1er,ré|1,uerrá|3er,lamará|5se,omitará|4,nvendrá|4ir,pentirá|6se,abrá|2er,ndrá|1er,rá|1"
      },
      "secondPlural": {
        "rules": "bicar|5á,abricar|7á,apar|4ás,ceptar|6éis,nsentir|7é,astar|5án,omponer|5drá,omenzar|7éis,raduar|6ás,lorecer|7emos,ivertir|7é,esentir|7ás,eprimir|7emos,roteger|7á,sificar|7án,intar|5emos,squiar|6á,ontecer|7éis,otestar|7án,spertar|7án,ducar|5ás,estruir|7ás,onfiar|6án,namorar|7án,ufrir|5án,onsejar|7án,lustrar|7án,alcular|7éis,egatear|7án,ensar|5ás,omper|5ás,ailar|5á,orcer|5á,onreír|4irá,epillar|7ás,eportar|7án,arrer|5é,mpezar|6ás,epasar|6éis,mportar|7ás,ablecer|7á,ormir|5emos,allar|5é,ropezar|7án,rindar|6ás,nvitar|6ás,erendar|7é,ngañar|6é,nviar|5é,obernar|7á,xigir|5emos,riunfar|7á,nmigrar|7emos,uebrar|6án,uerer|3ré,nfadar|6án,sayunar|7éis,esultar|7ás,gorar|5éis,legar|5emos,isfacer|4réis,sgustar|7emos,brazar|6án,scender|7án,busar|5ás,onvidar|7án,tirizar|7emos,eshacer|4réis,lanchar|7á,andonar|7á,olocar|6ás,uspirar|7á,esolver|7án,dvertir|7án,orrer|5á,xportar|7á,dmirar|6é,rrachar|7án,tenecer|7á,ecidir|6é,omprar|6á,horrar|6é,oñar|4é,xtender|7emos,postar|6án,atinar|6á,terizar|7án,poyar|5é,anejar|6emos,ompañar|7éis,ticipar|7á,ariar|5án,lantar|6ás,adrar|5án,egular|6ás,bligar|6ás,taminar|7é,xplotar|7é,ndicar|6emos,evorar|6á,ulpar|5ás,onsumir|7éis,sustar|6ás,impiar|6ás,uceder|6á,uivocar|7emos,ublicar|7án,endecir|7án,sponder|7éis,esear|5á,elear|5á,iquecer|7á,egociar|7á,nseguir|7éis,rpretar|7éis,contrar|7ás,liminar|7éis,visar|5á,laticar|7á,bedecer|7é,olgar|5ás,dornar|6án,evistar|7án,eñalar|6emos,sperar|6emos,jercer|6é,nfluir|6ás,positar|7é,tilizar|7é,ncender|7ás,legrar|6ás,aciar|5ás,rever|5é,dmitir|6emos,ituar|5án,enovar|6é,licitar|7ás,edicar|6é,ezclar|6án,frecer|6á,onducir|7á,quillar|7á,enacer|6é,cercar|6án,nformar|7ás,divinar|7emos,reer|4emos,iolar|5án,almar|5é,ralizar|7ás,onfesar|7á,ausar|5é,nvencer|7ás,dificar|7á,yudar|5emos,sminuir|7á,urgir|5án,redecir|7é,guantar|7ás,hocar|5é,ruñir|5é,vanzar|6án,equerir|7éis,ntrolar|7é,nstruir|7é,asticar|7éis,uemar|5é,scoger|6á,eguntar|7éis,roponer|5dré,fectuar|7é,uardar|6éis,legir|5é,rrollar|7án,rillar|6án,rseguir|7á,ubir|4á,campar|6emos,omar|4án,liviar|6án,mplear|6é,nificar|7ás,ehusar|6é,ombatir|7á,rrojar|6é,bortar|6é,municar|7á,ibujar|6á,aludar|6án,eplicar|7é,aler|2dremos,levar|5é,umentar|7éis,preciar|7án,ijar|4án,nojar|5emos,nventar|7ás,esentar|7ás,evelar|6emos,uscar|5emos,uponer|4dréis,ogar|4án,rohibir|7án,rear|4á,orregir|7ás,nservar|7á,uidar|5é,mprimir|7é,tumbrar|7ás,eriguar|7é,raducir|7á,sociar|6éis,alir|2drás,sconder|7á,lcanzar|7é,burrir|6án,ograr|5á,siasmar|7á,lquilar|7án,ermitir|7á,orir|4á,vejecer|7ás,oder|2rán,scansar|7án,erdonar|7ás,ecordar|7án,adurar|6ás,etestar|7éis,oblar|5ás,hismear|7ás,anar|4é,avar|4án,nfermar|7á,ingir|5án,nversar|7ás,scubrir|7é,ntinuar|7é,ritar|5á,ncionar|7é,obrar|5án,ricular|7á,lmorzar|7é,opiar|5á,ablar|5án,ecoger|6éis,studiar|7á,mpartir|7emos,alvar|5ás,ealizar|7á,añer|4éis,rreglar|7emos,ntentar|7á,ucear|5án,oportar|7ás,erder|5emos,ncantar|7án,erminar|7ás,ruzar|5án,niciar|6á,echazar|7é,espirar|7é,umplir|6á,ecibir|6ás,ñadir|5á,galizar|7emos,epender|7á,quistar|7éis,olestar|7é,nvocar|6é,acticar|7é,riticar|7án,eredar|6éis,autizar|7emos,epetir|6éis,btener|4drá,ntestar|7ás,xhibir|6á,ravesar|7án,rabajar|7ás,nstalar|7é,menazar|7án,escar|5éis,referir|7á,bolizar|7án,plaudir|7é,iajar|5á,talecer|7emos,gistrar|7emos,xplorar|7án,omendar|7á,vorciar|7emos,aquecer|7é,dorar|5ás,cabar|5é,lvidar|6ás,argar|5á,eciclar|7á,egalar|6án,ultivar|7án,avegar|6emos,vacuar|6á,umar|4án,sfrutar|7á,xpresar|7án,elebrar|7á,nsultar|7éis,estir|5á,cificar|7éis,espetar|7é,ensurar|7emos,ecorar|6á,efender|7ás,evantar|7é,ugerir|6ás,vilizar|7éis,nfiscar|7ás,ncluir|6á,amentar|7é,tacar|5éis,rovocar|7ás,educir|6é,xponer|4dremos,oseguir|7é,nsuciar|7án,erecer|6emos,arar|4é,stigar|6á,resar|5éis,nizar|5á,etir|4ás,rlar|4é,meter|5á,eservar|7é,jugar|5á,etener|4drán,parecer|7é,firmar|6án,sitar|5án,asar|4é,agar|4á,prender|7á,enar|4án,tender|6é,señar|5á,cinar|5á,mer|3é,plicar|6éis,atar|4emos,regar|5ás,venir|3drán,ntener|4drás,stimar|6ás,rcar|4é,uchar|5á,igir|4ás,tribuir|7án,robar|5án,vir|3éis,ver|3emos,elar|4án,dir|3ás,overse|4é,terarse|5án,uedarse|5emos,ncearse|5emos,ecarse|4emos,reverse|5án,pararse|5é,lamarse|5án,udarse|4ás,allarse|5á,eitarse|5ás,ullirse|5á,uejarse|5ás,tarse|3é,omit|4aremos",
        "exceptions": "dejar|5á,beber|5é,renunciar|9é,yacer|5emos,oponer|4drá,ir|2éis,ser|3án,odiar|5ás,andar|5éis,mandar|6án,negar|5án,introducir|10é,regir|5án,usar|4éis,constituir|10éis,aprender|8emos,votar|5éis,cansar|6á,crecer|6án,cerrar|6emos,costar|6é,unir|4emos,llorar|6éis,extinguir|9án,desagradecer|12é,desagradar|10án,errar|5é,acordar|7á,hacer|2rá,servir|6é,permanecer|10án,mostrar|7án,criar|5á,teñir|5emos,cenar|5é,pagar|5án,amar|4é,tocar|5ás,saltar|6é,sentar|6á,oír|1irás,volar|5ás,atraer|6é,herir|5án,formar|6éis,entrar|6é,montar|6á,calentar|8án,abordar|7án,notar|5á,consistir|9é,pesar|5éis,faltar|6án,aprobar|7á,convertir|9án,huir|4ás,firmar|6é,bajar|5éis,nadar|5é,oler|4éis,aspirar|7emos,nacer|5éis,traer|5éis,describir|9é,leer|4án,jurar|5emos,coser|5ás,asistir|7éis,tener|3drá,rezar|5éis,bañar|5án,lanzar|6á,alentar|7é,agradar|7á,coger|5án,sustituir|9emos,evitar|6é,vender|6emos,picar|5ás,peinar|6án,curar|5á,echar|5án,tirar|5é,demostrar|9ás,arrepentirse|10án,amanecer|8ás,poner|3dré,acortar|7é,dudar|5á,cesar|5é,cubrir|6ás,caber|3rá,caminar|7án,durar|5éis,tardar|6emos,distinguir|10á,luchar|6emos,sentirse|6é,toser|5á,insistir|8ás,freír|3irán,acostar|7emos,bordar|6ás,apretar|7ás,caer|4án,verificar|9á,batir|5ás,seguir|6á,clarificar|10án,dar|3é,guiar|5ás,sonar|5éis,escribir|8ás,sacar|5án,mentir|6án,invertir|8ás,actuar|6ás,mirar|5ás,decir|1iremos,saber|3ré,reír|2iréis,vencer|6emos,agradecer|9ás,purificar|9ás,deber|5án,cazar|5á,padecer|7emos,sacrificar|10án,ofender|7é,glorificar|10á,parar|5éis,conocer|7án,abrir|5á,untar|5án,borrar|6ás,contar|6án,cortar|6ás,estar|5éis,reinar|6á,soler|5á,anunciar|8á,producir|8án,reñir|5án,besar|5án,pegar|5án,gustar|6éis,reconocer|9á,aparecer|8án,emigrar|7á,inducir|7emos,quedarse|6emos,secarse|5emos,prepararse|8é,vomit|5aremos",
        "rev": "overé|4se,uerré|3er,untaré|5se,actaré|5se,abré|2er,pondré|3er,ré|1,terarán|5se,reverán|5se,lamarán|5se,odrán|2er,reirán|2ír,tendrán|3er,vendrán|3ir,rán|1,onreirá|4ír,allará|5se,abrá|2er,bullirá|6se,ndrá|1er,rá|1,earemos|3se,sfaréis|3cer,sharéis|3cer,udarás|4se,eitarás|5se,ondréis|2er,aldrás|2ir,uejarás|5se,eiréis|1ír,dremos|er,tendrás|3er,remos|1,réis|1,rás|1"
      },
      "thirdPlural": {
        "rules": "bicar|5é,abricar|7é,apar|4án,ceptar|6é,nsentir|7emos,astar|5ás,estigar|7emos,omponer|5dréis,omenzar|7án,raduar|6án,lorecer|7á,ivertir|7éis,esentir|7án,eprimir|7ás,roteger|7é,sificar|7ás,intar|5éis,squiar|6é,ontecer|7emos,spertar|7éis,ducar|5án,onfiar|6éis,namorar|7éis,ufrir|5emos,onsejar|7ás,lustrar|7ás,alcular|7á,egatear|7ás,ensar|5án,omper|5án,ailar|5emos,orcer|5é,onreír|4iremos,epillar|7emos,eportar|7emos,arrer|5éis,mportar|7án,ablecer|7é,ormir|5éis,erretir|7án,allar|5emos,ropezar|7ás,rindar|6án,nvitar|6án,erendar|7á,ngañar|6á,urlar|5emos,obernar|7éis,xigir|5á,riunfar|7é,nmigrar|7éis,uerer|3réis,nfadar|6ás,sayunar|7án,esultar|7emos,rometer|7emos,gorar|5emos,legar|5éis,isfacer|4remos,sgustar|7éis,brazar|6emos,scender|7ás,busar|5éis,onvidar|7emos,tirizar|7á,lanchar|7é,andonar|7éis,olocar|6án,dvertir|7ás,orrer|5emos,xportar|7emos,rrachar|7ás,tenecer|7emos,ecidir|6á,omprar|6é,horrar|6éis,oñar|4á,postar|6ás,atinar|6é,terizar|7ás,poyar|5éis,cesitar|7ás,ompañar|7emos,ticipar|7é,ariar|5ás,lantar|6emos,adrar|5éis,egular|6án,bligar|6éis,taminar|7éis,xplotar|7á,ndicar|6éis,evorar|6é,ulpar|5éis,onsumir|7emos,sustar|6án,impiar|6án,uceder|6é,uivocar|7éis,endecir|7ás,ntender|7á,esear|5é,elear|5é,iquecer|7é,nseguir|7emos,iseñar|6éis,contrar|7án,liminar|7emos,visar|5emos,laticar|7éis,bedecer|7á,olgar|5án,dornar|6emos,evistar|7éis,ocinar|6éis,acudir|6án,sperar|6á,jercer|6á,nfluir|6emos,positar|7á,tilizar|7emos,ncender|7án,legrar|6éis,aciar|5án,rever|5á,dmitir|6án,ituar|5ás,enovar|6éis,licitar|7án,edicar|6á,ezclar|6emos,frecer|6emos,nseñar|6é,quillar|7éis,enacer|6éis,cercar|6ás,emer|4éis,nformar|7án,divinar|7éis,reer|4éis,iolar|5ás,almar|5á,ralizar|7án,onfesar|7é,ausar|5á,nvencer|7án,dificar|7emos,yudar|5éis,sminuir|7é,redecir|7á,guantar|7án,hocar|5emos,ruñir|5éis,vanzar|6ás,ntrolar|7éis,asticar|7emos,uemar|5á,scoger|6ás,eguntar|7emos,roponer|5dremos,fectuar|7éis,uardar|6emos,rrollar|7ás,revivir|7é,rillar|6ás,rseguir|7éis,ubir|4éis,ntregar|7éis,campar|6ás,omar|4ás,onvenir|5drás,mplear|6á,nificar|7án,nfirmar|7éis,ehusar|6emos,ombatir|7é,bortar|6á,municar|7éis,ibujar|6emos,aludar|6ás,aler|2drán,levar|5á,umentar|7ás,preciar|7éis,ijar|4éis,nventar|7án,evelar|6á,uscar|5éis,uponer|4drás,ogar|4ás,rohibir|7ás,rear|4éis,omer|4á,uidar|5á,mprimir|7éis,tumbrar|7án,eriguar|7emos,raducir|7é,alir|2drá,lcanzar|7éis,burrir|6éis,ograr|5é,siasmar|7é,lquilar|7ás,ermitir|7éis,orir|4é,vejecer|7án,oder|2remos,scansar|7éis,nhelar|6ás,erdonar|7án,ecordar|7éis,hismear|7án,anar|4emos,avar|4ás,nfermar|7éis,nversar|7án,scubrir|7emos,ntinuar|7ás,ritar|5é,ncionar|7éis,obrar|5emos,ricular|7éis,lmorzar|7emos,opiar|5é,ecoger|6emos,studiar|7é,mpartir|7éis,alvar|5éis,ealizar|7é,añer|4emos,rreglar|7ás,ntentar|7emos,ucear|5ás,oportar|7án,fligir|6án,erder|5éis,ncantar|7ás,erminar|7án,ruzar|5éis,niciar|6é,echazar|7emos,espirar|7á,umplir|6é,ecibir|6emos,ñadir|5é,galizar|7éis,epender|7án,quistar|7emos,olestar|7á,irigir|6emos,nvocar|6á,acticar|7á,riticar|7ás,eredar|6emos,autizar|7éis,nvadir|6emos,btener|4dré,ntestar|7án,xhibir|6án,ravesar|7ás,nstalar|7á,menazar|7éis,escar|5emos,scuchar|7é,bolizar|7ás,plaudir|7éis,talecer|7á,gistrar|7á,xplorar|7ás,omendar|7emos,vorciar|7é,ancelar|7éis,isitar|6emos,aquecer|7emos,dorar|5án,cabar|5á,lvidar|6éis,argar|5é,eciclar|7é,ultivar|7éis,avegar|6éis,vacuar|6emos,umar|4ás,sfrutar|7éis,xpresar|7ás,nsultar|7á,cificar|7emos,espetar|7á,ensurar|7éis,ecorar|6emos,efender|7án,evantar|7ás,vilizar|7á,nfiscar|7án,ncluir|6é,harlar|6á,amentar|7éis,astigar|7é,tacar|5emos,rovocar|7án,educir|6á,ascinar|7é,xponer|4drá,oseguir|7á,nsuciar|7ás,erecer|6án,ejar|4éis,resar|5emos,edir|4án,testar|6emos,struir|6éis,nizar|5é,ezar|4emos,viar|4ás,ebrar|5éis,hacer|2remos,servar|6emos,jugar|5é,etener|4drás,parecer|7emos,tender|6éis,agar|4é,enar|4ás,onder|5é,ociar|5emos,pretar|6emos,alar|4éis,nducir|6éis,oser|4éis,atar|4éis,ojar|4á,petir|5á,sentar|6emos,ntener|4drán,durar|5án,blar|4emos,stimar|6án,rcar|4á,tribuir|7ás,adecer|6éis,ajar|4éis,arar|4emos,asar|4emos,ver|3éis,stir|4emos,erir|4emos,irar|4éis,licar|5emos,gir|3éis,overse|4á,terarse|5ás,uedarse|5éis,ncearse|5á,ecarse|4éis,reverse|5emos,untarse|5éis,pararse|5á,lamarse|5ás,udarse|4emos,actarse|5á,allarse|5é,eitarse|5án,uejarse|5emos,irse|2éis,omit|4arás",
        "exceptions": "beber|5á,renunciar|9á,yacer|5á,oponer|4dré,ir|2emos,ser|3emos,odiar|5éis,andar|5á,mandar|6ás,negar|5ás,introducir|10éis,usar|4emos,constituir|10án,aprender|8éis,votar|5emos,cansar|6emos,parecer|7á,crecer|6ás,cerrar|6éis,costar|6á,unir|4éis,llorar|6emos,extinguir|9ás,desagradecer|12á,desagradar|10emos,meter|5é,errar|5á,acordar|7emos,servir|6emos,permanecer|10ás,mostrar|7ás,criar|5emos,vivir|5emos,teñir|5á,cenar|5á,pagar|5ás,amar|4á,afirmar|7ás,tocar|5án,saltar|6emos,oír|1iré,volar|5emos,atraer|6á,herir|5ás,comprender|10é,formar|6emos,entrar|6á,montar|6é,calentar|8ás,abordar|7ás,notar|5é,consistir|9á,pesar|5emos,faltar|6ás,aprobar|7é,convertir|9emos,huir|4án,firmar|6á,venir|3drá,bajar|5emos,nadar|5á,oler|4emos,nacer|5emos,traer|5án,describir|9emos,leer|4ás,jurar|5é,tener|3dremos,bañar|5éis,lanzar|6é,alentar|7á,agradar|7é,coger|5éis,sustituir|9á,evitar|6éis,vender|6á,picar|5án,peinar|6ás,curar|5é,echar|5ás,demostrar|9éis,arrepentirse|10ás,amanecer|8éis,poner|3dremos,acortar|7á,pedir|5éis,dudar|5é,cesar|5á,cubrir|6án,caber|3ré,caminar|7ás,sorprender|10emos,tardar|6án,distinguir|10é,preservar|9á,luchar|6éis,helar|5é,freír|3irás,acostar|7éis,bordar|6án,caer|4ás,verificar|9éis,batir|5emos,seguir|6éis,clarificar|10ás,dar|3á,guiar|5án,duchar|6emos,sonar|5emos,escribir|8án,regar|5án,robar|5emos,sacar|5ás,mentir|6éis,invertir|8án,actuar|6án,mirar|5emos,volver|6ás,decir|1iréis,saber|3rás,reír|2irá,vencer|6éis,purificar|9emos,deber|5emos,cazar|5é,sacrificar|10éis,ofender|7á,glorificar|10emos,conocer|7ás,abrir|5é,untar|5ás,borrar|6án,contar|6emos,cortar|6éis,probar|6ás,estar|5án,reinar|6emos,soler|5éis,anunciar|8é,producir|8ás,reñir|5ás,hervir|6ás,besar|5éis,pegar|5ás,gustar|6emos,reconocer|9é,emigrar|7emos,deshacer|5remos,hacer|2remos,juntarse|6éis,mudarse|5emos,sentirse|6éis,quejarse|6emos",
        "rev": "ondréis|2er,terarás|5se,eiremos|1ír,edaréis|4se,uerréis|3er,faremos|2cer,ecaréis|4se,veremos|3se,lamarás|5se,mitarás|3,vendrás|3ir,entirás|5se,odremos|2er,lliréis|4se,reirás|2ír,abrás|2er,ndrás|1er,ndremos|1er,rás|1,réis|1,remos|1,overá|4se,onceará|6se,eparará|6se,actará|5se,eirá|1ír,xpondrá|4er,drá|ir,rá|1,allaré|5se,abré|2er,ndré|1er,ré|1,eitarán|5se,drán|er,rán|1"
      }
    },
    "conditional": {
      "first": {
        "rules": "bicar|5ías,abricar|7ían,apar|4ía,ceptar|6ías,nsentir|7íamos,astar|5íais,estigar|7íais,omponer|5dría,omenzar|7ías,raduar|6íamos,lorecer|7ían,ivertir|7ía,esentir|7ía,eprimir|7íais,roteger|7ías,sificar|7íamos,intar|5ía,egresar|7ían,squiar|6íais,espedir|7íais,ontecer|7íamos,otestar|7íais,spertar|7ían,ducar|5ía,estruir|7ían,onfiar|6íais,lonizar|7íais,egatear|7ían,ensar|5íais,omper|5ía,orcer|5íais,epillar|7ías,eportar|7íais,epasar|6íais,mportar|7íais,ablecer|7íais,ormir|5íamos,allar|5íamos,rindar|6íais,nviar|5íais,obernar|7ían,riunfar|7íamos,nmigrar|7íamos,uebrar|6íais,uerer|3ríamos,sayunar|7ías,esultar|7ía,rometer|7íais,gorar|5ían,legar|5íais,isfacer|4ríais,brazar|6íamos,busar|5ían,tirizar|7íais,lanchar|7ía,andonar|7ías,olocar|6íais,uspirar|7íamos,esolver|7íais,dvertir|7íamos,xportar|7íamos,onjugar|7íamos,retener|5drías,dmirar|6ía,rrachar|7ían,tenecer|7íais,ecidir|6íamos,omprar|6ías,horrar|6ías,oñar|4íais,xtender|7íais,atinar|6ías,terizar|7ían,poyar|5ían,cesitar|7ía,ompañar|7íamos,ticipar|7íais,ariar|5íamos,lantar|6íamos,adrar|5íamos,egular|6íais,bligar|6ía,taminar|7íamos,xplotar|7ía,ndicar|6íamos,lenar|5ían,ulpar|5íamos,onsumir|7ía,eparar|6íais,sustar|6ía,impiar|6ía,uceder|6ías,ublicar|7ían,endecir|7ían,ntender|7ías,sponder|7íais,egociar|7ían,nseguir|7íais,iseñar|6ía,rpretar|7íamos,liminar|7íamos,visar|5íais,laticar|7íais,bedecer|7ías,olgar|5íamos,dornar|6ía,evistar|7ías,ocinar|6íais,acudir|6ía,eñalar|6íamos,sperar|6íamos,jercer|6ía,nfluir|6ía,positar|7íais,tilizar|7ían,legrar|6ían,aciar|5ían,rever|5ía,dmitir|6íais,enovar|6ías,licitar|7ía,edicar|6íais,ezclar|6íais,frecer|6ía,nseñar|6íamos,quillar|7ían,enacer|6íais,cercar|6ías,emer|4íamos,nformar|7íais,divinar|7ía,iolar|5ías,almar|5ían,ralizar|7íais,ratar|5ías,onfesar|7ía,ausar|5ía,nvencer|7íais,dificar|7ías,sminuir|7íais,urgir|5ía,redecir|7ía,guantar|7ían,hocar|5ía,ruñir|5íais,equerir|7íamos,ntrolar|7íais,nstruir|7íais,asticar|7íamos,uemar|5íais,scoger|6íamos,eguntar|7íais,ganizar|7ía,roponer|5dríais,fectuar|7íamos,uardar|6ían,legir|5ías,rrollar|7ían,revivir|7íamos,rillar|6íamos,rseguir|7íamos,ubir|4ía,ntregar|7ías,campar|6íais,omar|4ías,liviar|6ía,onvenir|5drían,nificar|7ía,nfirmar|7ía,ehusar|6ías,ombatir|7íais,rrojar|6ía,ompetir|7ían,bortar|6ías,municar|7ía,ibujar|6ías,evolver|7ían,aler|2dríais,levar|5ía,umentar|7íais,preciar|7íais,ijar|4íamos,nojar|5íamos,nventar|7ías,esentar|7íamos,evelar|6íais,uscar|5íais,uponer|4drías,ogar|4ías,orregir|7ía,nservar|7ía,omer|4ías,uidar|5ías,mprimir|7íamos,tumbrar|7íamos,eriguar|7íais,raducir|7íamos,sociar|6íamos,alir|2dría,sconder|7íamos,lcanzar|7íamos,ograr|5íamos,siasmar|7íais,ermitir|7íamos,vejecer|7ía,oder|2rías,scansar|7íamos,nhelar|6ías,erdonar|7íamos,ecordar|7ía,ontener|5dríais,adurar|6ían,etestar|7ías,hismear|7ían,anar|4ían,avar|4íamos,astimar|7íamos,nfermar|7íais,ingir|5íais,nversar|7ías,scubrir|7ía,ntinuar|7ían,ritar|5ía,ncionar|7íais,obrar|5íais,lmorzar|7íais,opiar|5ían,ecoger|6íais,studiar|7ían,mpartir|7ías,alvar|5íais,arcar|5ían,ealizar|7íamos,añer|4íamos,rreglar|7ía,ntentar|7ía,ucear|5ías,oportar|7ías,fligir|6ía,erder|5ías,ncantar|7ías,erminar|7ías,ruzar|5íais,niciar|6ían,echazar|7íais,ragar|5ían,espirar|7ía,umplir|6ías,galizar|7ías,epender|7íais,quistar|7ía,olestar|7ías,nvocar|6ías,acticar|7íais,riticar|7ías,eredar|6íais,autizar|7ían,btener|4dríamos,ntestar|7íamos,xhibir|6ían,ravesar|7ían,nstalar|7ía,menazar|7íamos,escar|5íamos,bolizar|7ía,plaudir|7íamos,talecer|7ía,xplorar|7ían,vorciar|7íais,ancelar|7ían,isitar|6ías,argar|5ía,eciclar|7íamos,egalar|6ían,ultivar|7ía,avegar|6ías,vacuar|6íamos,umar|4ía,sfrutar|7íamos,elebrar|7íamos,nsultar|7íamos,estir|5íamos,cificar|7ían,espetar|7íais,ensurar|7íamos,efender|7ía,evantar|7íamos,vilizar|7íais,nfiscar|7ía,ncluir|6íamos,antener|5dría,amentar|7ías,astigar|7íamos,tacar|5íamos,educir|6íais,ascinar|7ías,horcar|6íamos,xponer|4dríamos,oseguir|7ías,nsuciar|7íais,erecer|6ía,eber|4ía,arar|4ías,roducir|7ías,ejar|4ía,cular|5ía,prender|7íamos,ilar|4ían,reír|2iríais,errar|5íamos,rrer|4íais,pezar|5ían,etir|4íamos,vitar|5íamos,endar|5ías,añar|4íais,rlar|4ía,igir|4ías,gustar|6íamos,cender|6íais,vidar|5ía,hacer|2ría,enar|4ía,ostar|5ías,vocar|5íamos,alentar|7íamos,quecer|6ías,tuar|4ía,nducir|6íamos,eer|3ía,plicar|6íamos,udar|4íais,anzar|5ían,einar|5íamos,blar|4ía,uchar|5ía,adir|4ía,ajar|4ía,resar|5ías,oler|4ías,adar|4íais,bar|3íamos,orar|4íais,trar|4ía,ear|3íamos,ibir|4íais,rir|3íais,overse|4íais,terarse|5ían,uedarse|5ías,ncearse|5ían,ecarse|4íamos,reverse|5ías,untarse|5íais,pararse|5íamos,lamarse|5íais,udarse|4íamos,actarse|5íamos,allarse|5ían,eitarse|5ía,ullirse|5ía,uejarse|5ía,omit|4arían",
        "exceptions": "dejar|5ían,renunciar|9íais,yacer|5íamos,oponer|4dríamos,ir|2ían,ser|3ía,odiar|5íais,andar|5ía,mandar|6ían,negar|5ía,regir|5íamos,usar|4íamos,constituir|10íais,votar|5íamos,cansar|6ía,parecer|7íais,crecer|6íamos,costar|6ían,unir|4ía,llorar|6íamos,extinguir|9íais,desagradecer|12ían,meter|5ían,acordar|7íais,reservar|8ías,servir|6íamos,permanecer|10íamos,mostrar|7ías,desaparecer|11íamos,criar|5ían,vivir|5ían,teñir|5ías,pagar|5íais,amar|4íamos,afirmar|7ías,medir|5ías,tocar|5ía,jugar|5ían,saltar|6íamos,sentar|6íais,oír|1iría,volar|5íamos,casar|5ías,atraer|6íais,apagar|6íamos,herir|5ías,comprender|10ían,formar|6ías,entrar|6ías,montar|6íais,abordar|7ían,notar|5ían,consistir|9ían,pesar|5íais,faltar|6ías,convertir|9íais,huir|4ía,firmar|6íais,venir|3drías,bajar|5ías,nadar|5íamos,aspirar|7ías,nacer|5íamos,traer|5ía,jurar|5íais,coser|5ías,asistir|7ías,tener|3dríais,matar|5íamos,rezar|5íamos,coger|5ía,sustituir|9íamos,vender|6íamos,picar|5ía,curar|5íamos,echar|5ían,tirar|5íais,arrepentirse|10ían,pasar|5íamos,amanecer|8ía,poner|3dríais,acortar|7íamos,pedir|5íamos,dudar|5ía,cesar|5ían,caber|3rías,caminar|7ía,durar|5ía,tardar|6ías,distinguir|10ías,preservar|9íamos,luchar|6íais,sentirse|6íais,helar|5ían,toser|5ían,insistir|8íais,freír|3iríamos,bordar|6íamos,aplicar|7ías,apretar|7ía,caer|4ías,verificar|9íais,batir|5ía,detener|5dríamos,seguir|6íamos,clarificar|10ía,dar|3ían,guiar|5ía,sonar|5íais,regar|5ía,robar|5ía,sacar|5íais,mentir|6íais,invertir|8ían,mirar|5ían,distribuir|10ía,volver|6ía,decir|1iríamos,atender|7íamos,saber|3ríais,vencer|6ía,agradecer|9ía,purificar|9íamos,cazar|5ía,padecer|7ías,sacrificar|10ía,ofender|7íamos,glorificar|10ías,conocer|7íais,abrir|5íamos,untar|5íamos,borrar|6ía,estimar|7ía,contar|6ía,cortar|6ía,estar|5íamos,anunciar|8ías,reñir|5ía,hervir|6íais,besar|5íamos,pegar|5íais,reconocer|9ía,aparecer|8ía,emigrar|7ían,ver|3ías,contribuir|10ían,moverse|5íais,secarse|5íamos,hacer|2ría,juntarse|6íais,prepararse|8íamos,llamarse|6íais,mudarse|5íamos,jactarse|6íamos,hallarse|6ían",
        "rev": "erarían|4se,cearían|4se,itarían|2,endrían|2ir,ntirían|4se,rían|1,edarías|4se,rríamos|1er,faríais|2cer,everías|4se,odrías|2er,abrías|2er,abríais|2er,eiríais|1ír,ndrías|1er,dríamos|er,dríais|er,rías|1,ríais|1,ríamos|1,esharía|4cer,eitaría|5se,aldría|2ir,ulliría|5se,uejaría|5se,ndría|1er,ría|1"
      },
      "second": {
        "rules": "bicar|5íais,abricar|7ías,apar|4ía,ceptar|6ían,nsentir|7íais,eclarar|7íamos,astar|5ía,estigar|7íamos,omponer|5dría,omenzar|7ían,lorecer|7ías,ivertir|7ía,esentir|7ía,eprimir|7íamos,roteger|7ían,sificar|7íais,intar|5ía,egresar|7ía,squiar|6ías,espedir|7ían,spertar|7ía,ducar|5ía,estruir|7ías,onfiar|6íamos,lonizar|7ías,namorar|7íamos,ufrir|5ías,egatear|7ías,ensar|5íamos,omper|5ía,orcer|5ías,onreír|4irías,epillar|7ían,eportar|7íamos,epasar|6ías,mportar|7íamos,ormir|5íais,erretir|7ía,rindar|6ía,nvitar|6ías,ngañar|6ías,nviar|5ías,obernar|7ías,riunfar|7ía,uebrar|6íamos,uerer|3ríais,nfadar|6ía,sayunar|7ían,esultar|7ía,gorar|5íamos,isfacer|4rían,brazar|6íais,busar|5íais,tirizar|7ía,andonar|7ían,olocar|6íamos,uspirar|7íais,dvertir|7ía,xportar|7ía,onjugar|7ían,retener|5drían,dmirar|6ía,rrachar|7ías,ecidir|6íais,omprar|6ían,horrar|6ían,oñar|4íamos,atinar|6ían,terizar|7ías,poyar|5ías,ompañar|7ía,ticipar|7ían,ariar|5ían,lantar|6ía,adrar|5ías,egular|6íamos,ndicar|6íais,evorar|6ían,ulpar|5ían,onsumir|7ía,eparar|6ías,sustar|6ía,impiar|6ía,uceder|6ían,uivocar|7ías,endecir|7ías,ntender|7ían,esear|5íais,nseguir|7íamos,iseñar|6ía,rpretar|7íais,liminar|7íais,visar|5íamos,laticar|7ían,bedecer|7ían,dornar|6ía,ocinar|6ía,eñalar|6íais,sperar|6ías,jercer|6ía,nfluir|6ía,positar|7íamos,tilizar|7ías,aciar|5ías,dmitir|6ía,enovar|6íamos,edicar|6ías,ezclar|6ías,nseñar|6ías,enacer|6ías,cercar|6ían,emer|4íais,nformar|7ía,divinar|7ía,iolar|5íais,almar|5ías,ralizar|7íamos,ratar|5ían,onfesar|7ía,ausar|5ía,nvencer|7íamos,dificar|7ían,sminuir|7íamos,urgir|5ía,redecir|7ía,guantar|7ías,hocar|5ía,ruñir|5íamos,equerir|7ían,nstruir|7ían,asticar|7ía,uemar|5ías,scoger|6ían,ganizar|7ía,roponer|5dríamos,fectuar|7íais,uardar|6ías,legir|5ían,revivir|7ía,rillar|6ía,rseguir|7ías,ubir|4ía,ntregar|7ían,campar|6ías,omar|4ían,liviar|6ía,onvenir|5drías,nificar|7ía,nfirmar|7ía,ehusar|6íamos,ombatir|7ían,rrojar|6ía,ompetir|7ías,bortar|6ían,municar|7ía,ibujar|6ían,aludar|6ían,evolver|7ías,aler|2dría,umentar|7ía,preciar|7ían,ijar|4íais,nojar|5íais,nventar|7ían,esentar|7íais,evelar|6ía,uscar|5ían,uponer|4drían,rohibir|7ía,rear|4ías,orregir|7ía,omer|4ían,uidar|5ían,mprimir|7ías,tumbrar|7íais,eriguar|7ían,raducir|7íais,alir|2dría,sconder|7íais,lcanzar|7íais,burrir|6íamos,ograr|5ía,siasmar|7ían,ermitir|7ías,orir|4ía,oder|2rían,nhelar|6ía,erdonar|7ías,ecordar|7ía,adurar|6ías,etestar|7ían,hismear|7ías,anar|4ías,nfermar|7ías,ingir|5ía,nversar|7ían,ntinuar|7ías,ncionar|7ían,obrar|5ías,lmorzar|7íamos,opiar|5ías,ecoger|6íamos,studiar|7ías,mpartir|7ían,alvar|5ías,arcar|5ías,ealizar|7íais,añer|4íais,rreglar|7ía,ntentar|7ía,ucear|5ían,oportar|7ían,fligir|6ía,erder|5íamos,ncantar|7ían,erminar|7ían,ruzar|5íamos,niciar|6ías,echazar|7ían,espirar|7ía,umplir|6ían,ecibir|6ían,galizar|7ían,epender|7íamos,olestar|7ían,acticar|7íamos,riticar|7ían,eredar|6ías,autizar|7ías,epetir|6íais,btener|4drían,xhibir|6ías,ravesar|7ías,nstalar|7ía,menazar|7ía,referir|7íamos,bolizar|7ía,xplorar|7ías,vorciar|7íamos,ancelar|7ías,isitar|6ían,dorar|5ía,cabar|5íais,eciclar|7íais,egalar|6ías,avegar|6ían,umar|4ía,sfrutar|7íais,elebrar|7ía,nsultar|7íais,estir|5ían,cificar|7ías,espetar|7ían,ensurar|7ían,ecorar|6íamos,evantar|7íais,ugerir|6ía,vilizar|7íamos,ncluir|6íais,amentar|7ían,tacar|5íais,educir|6ías,ascinar|7ían,horcar|6íais,xponer|4dríais,oseguir|7ían,nsuciar|7ía,eber|4ía,roducir|7ían,testar|6ías,ejar|4ía,cular|5ía,ilar|4ías,errar|5íais,rrer|4ían,pezar|5ías,endar|5ían,rlar|4ía,igir|4ían,meter|5ías,gustar|6íais,vidar|5ía,hacer|2ría,ostar|5ían,altar|5ían,olar|4ías,aminar|6ía,otar|4ía,aer|3ían,lear|4ían,quecer|6ían,ociar|5ías,istar|5ía,nducir|6íais,eer|3ía,udar|4ía,anzar|5ías,untar|5ías,cansar|6ía,ntener|4dría,blar|4ía,stimar|6ía,cubrir|6ía,vocar|5ían,ajar|4ía,scar|4ía,resar|5ían,robar|5ía,conocer|7ía,llar|4ías,grar|4ías,ver|3ía,enar|4ía,licar|5ías,rificar|7ía,uar|3ía,trar|4ía,char|4ía,itar|4ía,var|3ía,dir|3ía,nder|4ía,gar|3ía,ecer|4ía,terarse|5ías,ncearse|5ías,reverse|5ían,pararse|5íais,udarse|4ían,actarse|5íais,allarse|5ías,rse|1ía,omit|4arías",
        "exceptions": "dejar|5ías,renunciar|9íamos,yacer|5ían,oponer|4dría,ir|2ías,ser|3ía,odiar|5ía,andar|5ía,mandar|6ías,regir|5íais,usar|4ía,constituir|10íamos,votar|5ías,parecer|7ían,crecer|6ían,costar|6ías,unir|4ía,llorar|6ían,extinguir|9ía,desagradecer|12ías,desagradar|10ía,acordar|7íamos,reservar|8ían,servir|6íais,mostrar|7ían,desaparecer|11ían,criar|5ías,vivir|5ías,teñir|5ían,pagar|5íamos,amar|4íais,afirmar|7ían,tocar|5ía,jugar|5ías,sentar|6ías,oír|1iría,casar|5ían,apagar|6íais,herir|5ían,comprender|10ías,formar|6ían,entrar|6íamos,montar|6ían,calentar|8ían,abordar|7ías,consistir|9ías,pesar|5íamos,aprobar|7ías,convertir|9íamos,huir|4ía,firmar|6íamos,venir|3dríamos,bajar|5ían,nadar|5ían,oler|4ía,aspirar|7ían,nacer|5ía,traer|5ía,describir|9íamos,jurar|5íamos,coser|5ían,asistir|7ían,tener|3dría,matar|5ías,rezar|5ían,bañar|5íamos,alentar|7ías,agradar|7ías,coger|5ía,sustituir|9íais,vender|6íais,picar|5ía,peinar|6ían,curar|5íais,echar|5ías,tirar|5íamos,arrepentirse|10ías,pasar|5íais,poner|3drías,acortar|7ías,cesar|5ías,caber|3rían,durar|5ía,tardar|6ían,distinguir|10ían,helar|5ías,toser|5ías,insistir|8íamos,freír|3iría,bordar|6ía,aplicar|7ían,apretar|7ía,verificar|9ían,batir|5ía,detener|5drías,seguir|6ía,dar|3ías,guiar|5ía,sonar|5íamos,escribir|8ía,sacar|5ía,mentir|6ías,invertir|8ías,mirar|5ías,distribuir|10ía,decir|1irían,atender|7íais,saber|3ría,reír|2irían,vencer|6ía,purificar|9ías,cazar|5ía,padecer|7íais,parar|5ían,abrir|5ías,borrar|6ía,contar|6ía,cortar|6ía,estar|5íais,reinar|6ías,soler|5ían,anunciar|8ían,reñir|5ía,hervir|6ía,besar|5ías,ver|3ían,contribuir|10ías,enterarse|7ías,hacer|2ría,prepararse|8íais,mudarse|5ían,jactarse|6íais,vomit|5arías,proponer|6dríamos,convenir|6drías,hallarse|6ías,salir|3dría,sentirse|6ía",
        "rev": "overía|4se,uedaría|5se,ecaría|4se,esharía|4cer,untaría|5se,lamaría|5se,eitaría|5se,ulliría|5se,reiría|2ír,uejaría|5se,abría|2er,dría|er,ría|1,reirías|2ír,cearías|4se,erríais|2er,ndríais|1er,ndrías|1er,ríamos|1,ríais|1,rías|1,sfarían|3cer,everían|4se,odrían|2er,abrían|2er,eirían|1ír,ndrían|1er,rían|1"
      },
      "third": {
        "rules": "bicar|5ía,abricar|7íais,ceptar|6íamos,astar|5ía,omponer|5dríamos,omenzar|7íamos,raduar|6ía,lorecer|7íais,eprimir|7ías,roteger|7ía,sificar|7ía,intar|5íamos,squiar|6ían,espedir|7ías,ontecer|7ía,spertar|7ía,ducar|5íais,estruir|7íais,onfiar|6ía,lonizar|7ían,ufrir|5ían,onsejar|7ías,lustrar|7ían,alcular|7ías,omper|5íamos,ailar|5íais,onreír|4irían,mpezar|6íamos,epasar|6ían,ablecer|7ía,ormir|5ía,allar|5ía,ropezar|7ía,rindar|6ía,nvitar|6ían,urlar|5ías,nviar|5ían,obernar|7íamos,xigir|5íais,riunfar|7ía,nmigrar|7ían,uebrar|6ías,uerer|3ría,nfadar|6ía,sayunar|7ía,rometer|7ían,gorar|5íais,legar|5ía,isfacer|4rías,sgustar|7ían,brazar|6ían,busar|5íamos,onvidar|7íamos,tirizar|7ía,eshacer|4ríamos,lanchar|7ían,andonar|7íais,olocar|6ía,uspirar|7ías,dvertir|7ía,onjugar|7ías,retener|5dría,dmirar|6íais,rrachar|7íamos,ecidir|6ías,omprar|6íamos,horrar|6ía,oñar|4ías,postar|6íais,atinar|6íamos,terizar|7íamos,poyar|5íais,cesitar|7íais,anejar|6íamos,ompañar|7ía,ariar|5ías,adrar|5ían,egular|6ía,bligar|6íamos,taminar|7ía,xplotar|7íais,ndicar|6ías,lenar|5ía,evorar|6ías,onsumir|7íais,sustar|6íamos,impiar|6ían,uivocar|7íais,ublicar|7íais,ntender|7íais,esear|5ían,iquecer|7íamos,egociar|7íais,nseguir|7ía,iseñar|6íais,rpretar|7ían,contrar|7ían,liminar|7ían,visar|5ía,laticar|7ías,bedecer|7íamos,olgar|5ía,dornar|6íais,evistar|7ía,ocinar|6ía,acudir|6íamos,sperar|6ían,nfluir|6ían,positar|7ían,tilizar|7íamos,legrar|6íais,aciar|5ía,rever|5íais,dmitir|6ía,ituar|5íamos,enovar|6ía,licitar|7ías,edicar|6ían,ezclar|6ían,frecer|6íamos,nseñar|6ían,enacer|6íamos,emer|4ían,nformar|7ía,divinar|7íamos,reer|4íais,iolar|5íamos,almar|5ía,ratar|5íais,onfesar|7íamos,ausar|5íais,nvencer|7ía,dificar|7íamos,yudar|5ía,sminuir|7ían,urgir|5íais,hocar|5íamos,ruñir|5ías,vanzar|6íamos,ntrolar|7ían,nstruir|7ías,asticar|7ía,ondenar|7íais,uemar|5ían,scoger|6ías,ganizar|7ías,uardar|6íamos,legir|5íais,revivir|7ía,rillar|6ía,rseguir|7ían,ubir|4íamos,ntregar|7íais,campar|6ían,omar|4íais,liviar|6íais,onvenir|5dría,mplear|6ías,nificar|7ías,nfirmar|7ías,ehusar|6ían,ombatir|7ías,rrojar|6íais,ompetir|7íamos,bortar|6íamos,municar|7íais,ibujar|6íamos,aludar|6ías,aler|2dría,levar|5íamos,umentar|7ía,preciar|7ías,ijar|4ía,nojar|5ías,nventar|7ía,esentar|7ías,uponer|4dríamos,ogar|4ía,nservar|7íais,omer|4ía,mprimir|7ían,tumbrar|7ías,eriguar|7ías,raducir|7ían,sociar|6ían,alir|2dríais,sconder|7ías,lcanzar|7ía,ograr|5ía,siasmar|7ías,lquilar|7íamos,ermitir|7ían,vejecer|7ían,oder|2ría,erdonar|7ían,ecordar|7íais,ontener|5dría,adurar|6ía,etestar|7íais,oblar|5ías,anar|4íamos,avar|4ía,astimar|7ía,nfermar|7ían,ingir|5ía,nversar|7íamos,scubrir|7ías,ntinuar|7ía,ritar|5ías,ncionar|7ías,obrar|5ían,ricular|7íais,lmorzar|7ía,opiar|5íamos,ablar|5íamos,ecoger|6ía,studiar|7íais,alvar|5ían,añer|4ía,rreglar|7íamos,ntentar|7ían,ucear|5íamos,oportar|7íais,fligir|6ías,erder|5íais,erminar|7ía,ruzar|5ía,niciar|6ía,echazar|7ías,umplir|6ía,ecibir|6ías,ñadir|5ían,galizar|7íais,quistar|7íais,olestar|7íais,irigir|6ía,nvocar|6ía,acticar|7ía,riticar|7íais,eredar|6ían,autizar|7íais,nvadir|6íais,btener|4drías,ravesar|7ía,rabajar|7íais,nstalar|7íamos,menazar|7ía,escar|5ía,scuchar|7ían,bolizar|7íais,plaudir|7ía,talecer|7íamos,gistrar|7íais,vorciar|7ía,isitar|6ía,aquecer|7íais,cabar|5ías,argar|5íamos,eciclar|7ías,ultivar|7íamos,avegar|6íais,vacuar|6ía,umar|4íamos,sfrutar|7ías,xpresar|7íamos,elebrar|7ía,estir|5ías,cificar|7íamos,espetar|7ías,ensurar|7ías,efender|7íamos,evantar|7ías,vilizar|7ía,ncluir|6ías,antener|5dríamos,harlar|6íamos,amentar|7íamos,rovocar|7ías,educir|6ían,ascinar|7íamos,horcar|6ías,xponer|4dría,oseguir|7íais,nsuciar|7ía,sentir|6ías,arar|4ían,stigar|6ía,resar|5ía,testar|6ían,nsar|4ía,rcer|4ían,rrer|4ías,etir|4ía,añar|4ían,olver|5ía,eservar|7ía,necer|5ía,agar|4ía,edir|4ía,decir|5íamos,robar|5ían,alar|4ía,ajar|4íamos,spirar|6íais,rcar|4íais,alizar|6ía,plicar|6ían,untar|5ían,oponer|4dría,ctuar|5ías,scar|4ías,regir|5ían,idar|4íais,ser|3íais,costar|6íamos,acar|4ía,par|3ías,ndar|4íais,rtir|4íamos,llar|4íamos,portar|6ía,ltar|4ías,antar|5ía,elar|4ía,ducir|5ía,orar|4ía,ear|3ía,recer|5ías,ibir|4ía,rir|3ía,der|3ía,overse|4ía,terarse|5íamos,uedarse|5ía,ncearse|5íamos,ecarse|4ía,reverse|5íamos,untarse|5ía,pararse|5ían,lamarse|5ía,udarse|4íais,actarse|5ías,allarse|5íais,eitarse|5íamos,ullirse|5íais,uejarse|5íamos,entirse|5ía,omit|4aría",
        "exceptions": "dejar|5íais,beber|5íamos,renunciar|9ías,yacer|5ías,ir|2íamos,odiar|5ía,andar|5íamos,negar|5íamos,usar|4ía,constituir|10ían,votar|5ían,cansar|6ían,crecer|6íais,cerrar|6ía,unir|4ías,llorar|6ías,extinguir|9ía,desagradecer|12íais,desagradar|10ía,meter|5íamos,errar|5ían,acordar|7ían,hacer|2rías,servir|6ían,mostrar|7íais,criar|5íais,vivir|5íais,teñir|5íamos,cenar|5íamos,amar|4ía,afirmar|7íais,tocar|5íais,jugar|5íais,sentar|6ían,oír|1irían,volar|5ía,casar|5íais,atraer|6ías,apagar|6ían,herir|5íamos,comprender|10íais,formar|6íais,entrar|6íais,montar|6íamos,calentar|8ías,abordar|7íamos,notar|5ía,consistir|9íamos,pesar|5ían,faltar|6ía,convertir|9ía,huir|4íamos,firmar|6ían,venir|3drían,nadar|5ías,oler|4ía,nacer|5ía,traer|5íais,leer|4ías,jurar|5ías,coser|5ía,asistir|7íais,tener|3dría,matar|5ía,rezar|5ías,lanzar|6íais,alentar|7ían,agradar|7ían,coger|5íamos,sustituir|9ías,evitar|6ía,vender|6ías,picar|5ías,peinar|6ías,curar|5ía,echar|5ía,tirar|5ía,demostrar|9íamos,pasar|5ía,amanecer|8íamos,poner|3drían,acortar|7ían,dudar|5íais,cesar|5íamos,caber|3ríais,caminar|7íais,durar|5íais,tardar|6ía,distinguir|10íais,luchar|6ía,helar|5íais,insistir|8ían,freír|3iría,bordar|6ía,aplicar|7íamos,apretar|7íamos,caer|4íamos,verificar|9ías,batir|5íamos,detener|5drían,seguir|6ía,clarificar|10ían,dar|3íamos,guiar|5íais,duchar|6ías,sonar|5ían,regar|5ían,mentir|6ían,mirar|5íamos,distribuir|10íamos,volver|6ías,decir|1irías,saber|3ría,reír|2irías,vencer|6íais,agradecer|9ías,purificar|9ían,deber|5ían,cazar|5ías,padecer|7íamos,sacrificar|10ías,glorificar|10ía,parar|5íamos,conocer|7ía,abrir|5ían,borrar|6íamos,estimar|7íais,contar|6íais,cortar|6íamos,probar|6ía,estar|5ías,reinar|6ía,soler|5íamos,anunciar|8íamos,reñir|5íais,hervir|6ía,besar|5ían,pegar|5ía,gustar|6ía,reconocer|9íamos,emigrar|7íamos,ver|3íais,contribuir|10ía,enterarse|7íamos,broncearse|8íamos,deshacer|5ríamos,atreverse|7íamos,prepararse|8ían,mudarse|5íais,hallarse|6íais,afeitarse|7íamos,quejarse|6íamos",
        "rev": "overía|4se,uedaría|5se,uerría|3er,ecaría|4se,untaría|5se,lamaría|5se,mitaría|3,vendría|3ir,odría|2er,reiría|2ír,abría|2er,entiría|5se,dría|er,ría|1,reirían|2ír,ndrían|1er,rían|1,sfarías|3cer,ctarías|4se,ldríais|1ir,abríais|2er,liríais|3se,eirías|1ír,endrías|2er,dríamos|er,rías|1,ríais|1,ríamos|1"
      },
      "firstPlural": {
        "rules": "bicar|5ía,abricar|7íamos,apar|4ían,ceptar|6ía,astar|5ían,estigar|7ía,omponer|5drías,raduar|6ían,lorecer|7íamos,ivertir|7ías,eprimir|7ían,roteger|7ía,sificar|7ía,intar|5íais,egresar|7íamos,squiar|6íamos,espedir|7ía,ontecer|7ías,spertar|7íais,ducar|5ían,onfiar|6ía,lonizar|7íamos,ufrir|5íamos,lustrar|7ías,alcular|7ían,ensar|5ía,omper|5ían,ailar|5íamos,orcer|5ía,onreír|4iríamos,epillar|7ía,ablecer|7íamos,ormir|5ía,allar|5ía,rindar|6ían,nvitar|6ía,erendar|7íamos,ngañar|6ía,nviar|5íamos,obernar|7ía,riunfar|7ías,nmigrar|7ía,uebrar|6ían,uerer|3ría,nfadar|6íamos,sayunar|7ía,rometer|7íamos,legar|5ían,isfacer|4ría,sgustar|7ías,brazar|6ías,scender|7ían,busar|5ías,onvidar|7ías,tirizar|7ías,eshacer|4ríais,lanchar|7ías,andonar|7íamos,olocar|6ía,dvertir|7ías,xportar|7ían,onjugar|7íais,retener|5dría,dmirar|6íamos,rrachar|7íais,ecidir|6ían,omprar|6íais,horrar|6ía,oñar|4ían,atinar|6íais,poyar|5íamos,cesitar|7íamos,ticipar|7íamos,lantar|6ías,adrar|5íais,egular|6ía,bligar|6ían,taminar|7ías,ndicar|6ían,lenar|5ías,evorar|6íamos,ulpar|5íais,onsumir|7ían,sustar|6íais,impiar|6ías,uceder|6ía,uivocar|7ían,sponder|7íamos,iquecer|7ía,iseñar|6ías,rpretar|7ías,contrar|7ías,liminar|7ías,visar|5ía,laticar|7íamos,bedecer|7íais,olgar|5íais,dornar|6íamos,evistar|7íais,ocinar|6ías,acudir|6ías,sperar|6íais,jercer|6ías,nfluir|6ías,positar|7ías,tilizar|7íais,ncender|7íamos,legrar|6íamos,dmitir|6ían,ituar|5íais,enovar|6ía,licitar|7ían,edicar|6íamos,ezclar|6íamos,frecer|6ías,nseñar|6íais,enacer|6ía,emer|4ías,nformar|7ían,divinar|7ían,reer|4íamos,almar|5ía,onfesar|7íais,ausar|5íamos,nvencer|7ía,dificar|7ía,yudar|5ías,sminuir|7ías,urgir|5íamos,redecir|7ías,hocar|5íais,ntrolar|7íamos,asticar|7ías,uemar|5íamos,scoger|6íais,ganizar|7ían,uardar|6íais,legir|5íamos,revivir|7ías,ubir|4ías,ntregar|7ía,campar|6ía,omar|4íamos,liviar|6ías,nificar|7ían,nfirmar|7ían,ehusar|6íais,ombatir|7ía,bortar|6íais,municar|7ías,ibujar|6íais,aludar|6ía,evolver|7ía,eplicar|7íais,aler|2drías,levar|5ías,umentar|7ías,preciar|7íamos,ijar|4ía,evelar|6íamos,uscar|5ía,ogar|4ían,rohibir|7íamos,nservar|7íamos,omer|4ía,uidar|5íamos,mprimir|7íais,tumbrar|7ían,eriguar|7íamos,raducir|7ías,sociar|6íais,alir|2drían,sconder|7ían,burrir|6ía,ograr|5ías,siasmar|7íamos,lquilar|7ía,ermitir|7ía,orir|4ían,vejecer|7ías,oder|2ría,nhelar|6ían,erdonar|7ía,ecordar|7íamos,ontener|5drías,etestar|7íamos,anar|4íais,avar|4ían,astimar|7ían,nfermar|7íamos,ingir|5íamos,nversar|7íais,scubrir|7ían,ntinuar|7ía,ritar|5ían,ncionar|7íamos,obrar|5ía,ricular|7íamos,opiar|5ía,ecoger|6ía,mpartir|7íais,alvar|5íamos,añer|4ía,rreglar|7ías,ntentar|7ías,ucear|5íais,fligir|6ían,erder|5ían,erminar|7ía,espirar|7íamos,umplir|6ía,ñadir|5ías,epender|7ía,quistar|7ían,olestar|7íamos,acticar|7ía,riticar|7íamos,eredar|6íamos,nvadir|6ían,epetir|6ía,btener|4dría,ravesar|7ía,rabajar|7íamos,nstalar|7íais,menazar|7íais,escar|5ías,scuchar|7ías,bolizar|7íamos,teresar|7ía,plaudir|7ían,iajar|5ían,talecer|7ías,gistrar|7íamos,omendar|7ía,ancelar|7ía,isitar|6ía,aquecer|7íamos,dorar|5ías,cabar|5ían,lvidar|6ían,argar|5ían,eciclar|7ían,ultivar|7ías,avegar|6íamos,vacuar|6ías,umar|4ían,sfrutar|7ían,xpresar|7íais,elebrar|7íais,estir|5íais,cificar|7ía,espetar|7ía,efender|7ías,evantar|7ían,ugerir|6íamos,nfiscar|7ían,ncluir|6ían,antener|5dríais,astigar|7íais,tacar|5ía,educir|6íamos,ascinar|7ía,horcar|6ían,nsuciar|7ías,erecer|6ían,sentir|6ían,diar|4íamos,testar|6ía,struir|6íamos,ejar|4ían,prender|7íais,rrer|4íamos,ostar|5ía,etir|4íais,rlar|4ían,igir|4ía,tinguir|7íamos,sultar|6ían,riar|4ía,enar|4ían,tender|6íamos,añar|4ías,olar|4ía,otar|4ías,traer|5íamos,agar|4ías,sistir|6ía,probar|6íais,alar|4ía,nvertir|7ía,rcar|4ía,atar|4ía,ñir|3ían,ctuar|5ían,einar|5ía,venir|3dría,ojar|4ían,regir|5ías,cansar|6ías,blar|4ían,vocar|5ía,arar|4ía,asar|4ía,ver|3íamos,necer|5ías,erir|4ía,licar|5ía,seguir|6ía,ibir|4ía,llar|4íais,orar|4ía,ortar|5ía,irar|4ía,urar|4ía,poner|3dría,cir|3ía,ciar|4ía,ear|3ía,ntar|4ía,zar|3ía,overse|4ías,terarse|5ía,uedarse|5íamos,ncearse|5íais,ecarse|4íais,reverse|5ía,untarse|5íamos,pararse|5ías,lamarse|5ían,udarse|4ía,allarse|5íamos,ullirse|5ían,uejarse|5íais,tarse|3ían,omit|4aría",
        "exceptions": "dejar|5íamos,beber|5íais,renunciar|9ían,yacer|5ía,oponer|4drían,ir|2íais,ser|3ías,andar|5íais,mandar|6ía,negar|5ías,usar|4ían,constituir|10ías,votar|5ía,parecer|7íamos,crecer|6ía,cerrar|6ía,unir|4ían,llorar|6íais,desagradecer|12íamos,desagradar|10ías,meter|5íais,errar|5ías,acordar|7ías,reservar|8ía,hacer|2rían,servir|6ías,mostrar|7ía,desaparecer|11ía,vivir|5ía,teñir|5ía,pagar|5ía,amar|4ía,afirmar|7íamos,medir|5íais,tocar|5ías,jugar|5ía,saltar|6íais,oír|1irías,comprender|10íamos,formar|6íamos,entrar|6ían,abordar|7íais,pesar|5ías,faltar|6ía,huir|4íais,firmar|6ías,bajar|5íais,nadar|5íais,oler|4ían,nacer|5íais,leer|4ían,coser|5ía,tener|3drías,agradar|7íamos,coger|5ías,sustituir|9ían,evitar|6íais,vender|6ían,picar|5ían,echar|5ía,demostrar|9íais,arrepentirse|10ía,pedir|5ías,dudar|5íamos,cesar|5íais,cubrir|6íamos,caber|3ríamos,caminar|7ían,durar|5íamos,tardar|6ía,preservar|9ían,luchar|6ían,sentirse|6íamos,helar|5ía,toser|5íamos,insistir|8ías,freír|3iríais,acostar|7íais,bordar|6ías,apretar|7ían,caer|4ía,verificar|9ía,batir|5ían,detener|5dríais,seguir|6ían,clarificar|10ías,dar|3ía,guiar|5ías,duchar|6íais,sonar|5ías,escribir|8íamos,regar|5ías,robar|5ías,sacar|5ías,mentir|6íamos,distribuir|10íais,volver|6ían,decir|1iríais,atender|7ía,saber|3rías,reír|2iría,vencer|6íamos,agradecer|9ían,purificar|9íais,deber|5ías,cazar|5ían,padecer|7ía,sacrificar|10ían,ofender|7ían,glorificar|10íamos,conocer|7íamos,abrir|5íais,untar|5íais,borrar|6íais,estimar|7íamos,contar|6ías,cortar|6ías,estar|5ían,soler|5íais,hervir|6íamos,besar|5ía,pegar|5íamos,gustar|6ía,reconocer|9íais,aparecer|8ían,emigrar|7íais,contribuir|10ía,sonreír|5iríamos,quedarse|6íamos,broncearse|8íais,secarse|5íais,deshacer|5ríais,juntarse|6íamos,mudarse|5ía,hallarse|6íamos,afeitarse|7ían,quejarse|6íais",
        "rev": "overías|4se,ararías|4se,bríamos|1er,eiríais|1ír,abrías|2er,ndríais|1er,drías|er,ríais|1,rías|1,ríamos|1,ondrían|2er,amarían|4se,ctarían|4se,aldrían|2ir,llirían|4se,rían|1,teraría|5se,uerría|3er,isfaría|4cer,revería|5se,mitaría|3,entiría|5se,odría|2er,eiría|1ír,vendría|3ir,ndría|1er,ría|1"
      },
      "secondPlural": {
        "rules": "bicar|5ían,apar|4íais,astar|5ías,omponer|5drían,raduar|6ías,ivertir|7ían,esentir|7íais,roteger|7íais,sificar|7ían,intar|5ían,egresar|7ías,espedir|7ía,ontecer|7ían,spertar|7ías,ducar|5ías,onfiar|6ías,lonizar|7ía,namorar|7ían,ufrir|5ía,onsejar|7íamos,lustrar|7íamos,alcular|7íais,egatear|7íamos,ensar|5ías,omper|5íais,orcer|5ía,eportar|7ían,mportar|7ían,ablecer|7ías,ormir|5ías,erretir|7ías,allar|5ían,ropezar|7íais,rindar|6ías,urlar|5íais,obernar|7ía,xigir|5ía,riunfar|7ían,uerer|3rían,nfadar|6ías,sayunar|7íais,esultar|7íais,legar|5ías,isfacer|4ría,brazar|6ía,scender|7ías,busar|5ía,onvidar|7ían,tirizar|7ían,eshacer|4rían,lanchar|7íamos,olocar|6ías,esolver|7ías,dvertir|7ían,xportar|7ías,retener|5dríais,dmirar|6ían,rrachar|7ía,ecidir|6ía,horrar|6íamos,xtender|7ían,atinar|6ía,terizar|7ía,poyar|5ía,cesitar|7ías,anejar|6ías,ompañar|7ían,lantar|6ían,egular|6ías,taminar|7ían,xplotar|7ían,lenar|5íamos,onsumir|7ías,sustar|6ías,impiar|6íamos,uceder|6íais,endecir|7ía,ntender|7ía,sponder|7ían,esear|5ía,elear|5íais,nseguir|7ías,iseñar|6ían,contrar|7íais,liminar|7ía,visar|5ían,olgar|5ían,dornar|6ían,evistar|7ían,ocinar|6ían,acudir|6ían,eñalar|6ían,jercer|6íamos,nfluir|6íais,tilizar|7ía,ncender|7ían,aciar|5íais,rever|5ías,dmitir|6ías,ituar|5ían,enovar|6ían,licitar|7íais,frecer|6ían,enacer|6ía,emer|4ía,nformar|7ías,divinar|7ías,reer|4ías,almar|5íamos,onfesar|7ían,ausar|5ías,nvencer|7ías,yudar|5ían,urgir|5ías,redecir|7íais,guantar|7íais,hocar|5ías,equerir|7íais,asticar|7ían,uemar|5ía,scoger|6ía,ganizar|7íais,roponer|5drían,fectuar|7ía,revivir|7ían,rillar|6ías,ubir|4ían,ntregar|7ía,omar|4ía,liviar|6ían,onvenir|5dríais,mplear|6ía,nificar|7íamos,nfirmar|7íamos,ehusar|6ía,rrojar|6ías,municar|7ían,ibujar|6ía,aler|2drían,levar|5ían,umentar|7ían,ijar|4ían,nojar|5ía,nventar|7íais,evelar|6ías,uscar|5ía,uponer|4dría,ogar|4íais,rohibir|7ían,rear|4ían,orregir|7íais,nservar|7ían,omer|4íamos,eriguar|7ía,raducir|7ía,alir|2drías,sconder|7ía,lcanzar|7ían,burrir|6ías,ograr|5íais,siasmar|7ía,orir|4ías,vejecer|7íamos,oder|2ríais,scansar|7ían,nhelar|6íamos,ecordar|7ían,ontener|5drían,adurar|6íais,oblar|5íamos,hismear|7íais,anar|4ía,avar|4ías,ingir|5ías,nversar|7ía,scubrir|7íais,ntinuar|7íamos,ritar|5íais,ricular|7ían,lmorzar|7ías,ablar|5ías,alvar|5ía,añer|4ían,rreglar|7ían,ntentar|7íais,ucear|5ía,fligir|6íamos,erder|5ía,ncantar|7íais,erminar|7íais,ruzar|5ías,niciar|6íais,echazar|7ía,ragar|5íamos,espirar|7ías,umplir|6íais,ecibir|6ía,ñadir|5íais,galizar|7ía,epender|7ías,quistar|7ías,irigir|6íais,nvocar|6íais,acticar|7ías,autizar|7ía,nvadir|6ías,epetir|6ías,btener|4dría,xhibir|6íamos,ravesar|7íais,rabajar|7ían,nstalar|7ías,menazar|7ías,escar|5ían,referir|7ían,scuchar|7íais,bolizar|7ías,teresar|7íamos,plaudir|7ías,iajar|5ías,talecer|7ían,gistrar|7ían,xplorar|7íamos,vorciar|7ías,ancelar|7íais,isitar|6íamos,dorar|5ían,cabar|5ía,lvidar|6ías,argar|5ías,egalar|6íamos,ultivar|7ían,avegar|6ía,vacuar|6ían,umar|4ías,xpresar|7ía,elebrar|7ías,ecorar|6ías,efender|7ían,ugerir|6ías,vilizar|7ían,nfiscar|7íamos,antener|5drías,harlar|6ías,astigar|7ían,educir|6ía,ascinar|7ía,xponer|4drías,nsuciar|7ían,erecer|6íais,igar|4ías,primir|6ía,egir|4ía,prender|7ías,ilar|4ía,reír|2iría,rrer|4ía,ezar|4ía,asar|4ía,meter|5ía,jugar|5ía,ñir|3ía,enar|4ías,edir|4ían,aer|3ía,vocar|5ía,quecer|6ía,clar|4ía,nducir|6ían,olar|4ía,alizar|6ías,volver|6íamos,stimar|6ías,coger|5ían,acar|4ían,nzar|4ía,llar|4ía,decer|5ía,necer|5ían,par|3ía,rcar|4ía,recer|5ía,ñar|3ía,onar|4ía,rmar|4ía,uir|3ía,iar|3ía,tir|3ía,dar|3ía,icar|4ía,rar|3ía,tar|3ía,overse|4ían,uedarse|5ían,ncearse|5ía,ecarse|4ían,reverse|5ía,untarse|5ían,lamarse|5ías,udarse|4ía,actarse|5ía,allarse|5ía,eitarse|5ías,uejarse|5ían,rarse|3ía,irse|2ías,omit|4aríais",
        "exceptions": "dejar|5ía,beber|5ían,yacer|5ía,oponer|4drías,ir|2ía,ser|3ían,odiar|5ían,andar|5ían,negar|5íais,introducir|10íamos,usar|4ías,cansar|6íamos,cerrar|6ían,unir|4íais,extinguir|9ían,desagradar|10ían,reservar|8íais,hacer|2ríamos,servir|6ía,vivir|5ía,pagar|5ías,amar|4ías,tocar|5ían,oír|1iríais,volar|5íais,apagar|6ía,herir|5ía,comprender|10ía,notar|5íais,pesar|5ía,faltar|6íais,aprobar|7ía,convertir|9ías,huir|4ían,venir|3dría,bajar|5ía,oler|4íamos,nacer|5ías,traer|5ían,describir|9ías,leer|4íais,coser|5íamos,tener|3drían,matar|5íais,evitar|6ían,vender|6ía,picar|5íamos,peinar|6ía,curar|5ían,echar|5íamos,tirar|5ías,demostrar|9ían,arrepentirse|10íamos,pasar|5ías,poner|3dría,dudar|5ían,cesar|5ía,cubrir|6ías,caber|3ría,caminar|7ías,durar|5ían,tardar|6íais,preservar|9ías,luchar|6ías,helar|5ía,toser|5ía,freír|3irías,bordar|6ían,apretar|7ías,batir|5ías,detener|5dría,seguir|6ías,clarificar|10íais,guiar|5ían,duchar|6ían,escribir|8ían,regar|5íais,robar|5íais,actuar|6íais,distribuir|10ían,decir|1iría,atender|7ías,saber|3ríamos,vencer|6ían,agradecer|9íamos,deber|5íamos,cazar|5íais,sacrificar|10íais,ofender|7ías,glorificar|10ían,conocer|7ían,abrir|5ía,borrar|6ías,contar|6ían,cortar|6ían,probar|6ían,reinar|6íais,soler|5ía,producir|8íais,reñir|5ías,hervir|6ías,besar|5ía,pegar|5ías,gustar|6ías,reconocer|9ías,aparecer|8íamos,ver|3ía,contribuir|10íamos,entretener|8dríais,juntarse|6ían,prepararse|8ía,llamarse|6ías,mudarse|5ía,vomit|5aríais,convenir|6dríais,afeitarse|7ías",
        "rev": "overían|4se,edarían|4se,uerrían|3er,ecarían|4se,sharían|3cer,ejarían|4se,drían|er,rían|1,teraría|5se,ncearía|5se,isfaría|4cer,revería|5se,actaría|5se,allaría|5se,abría|2er,reiría|2ír,ndría|1er,ría|1,aldrías|2ir,odríais|2er,llirías|4se,ntirías|4se,reirías|2ír,bríamos|1er,ndrías|1er,ríamos|1,ríais|1,rías|1"
      },
      "thirdPlural": {
        "rules": "bicar|5íamos,abricar|7ía,apar|4íamos,ceptar|6íais,astar|5íamos,estigar|7ían,omponer|5dríais,omenzar|7íais,raduar|6íais,lorecer|7ía,esentir|7íamos,roteger|7íamos,sificar|7ías,intar|5ías,squiar|6ía,ontecer|7íais,otestar|7íamos,spertar|7íamos,ducar|5íamos,onfiar|6ían,lonizar|7ía,namorar|7ías,ufrir|5ía,lustrar|7íais,alcular|7íamos,egatear|7íais,ensar|5ían,omper|5ías,ailar|5ía,orcer|5íamos,onreír|4iría,epillar|7íais,eportar|7ías,mportar|7ías,ablecer|7ían,ormir|5ían,allar|5íais,ropezar|7íamos,nvitar|6íais,erendar|7ía,ngañar|6íamos,urlar|5íamos,nviar|5ía,obernar|7íais,riunfar|7íais,nmigrar|7íais,uebrar|6ía,uerer|3rías,nfadar|6ían,sayunar|7íamos,esultar|7íamos,gorar|5ías,legar|5íamos,isfacer|4ríamos,sgustar|7ía,brazar|6ía,scender|7íamos,busar|5ía,onvidar|7íais,tirizar|7íamos,eshacer|4rías,lanchar|7íais,olocar|6ían,esolver|7ían,xportar|7íais,onjugar|7ía,retener|5dríamos,dmirar|6ías,rrachar|7ía,tenecer|7íamos,ecidir|6ía,omprar|6ía,horrar|6íais,oñar|4ía,xtender|7ías,postar|6íamos,atinar|6ía,terizar|7íais,poyar|5ía,cesitar|7ían,ompañar|7íais,ticipar|7ía,ariar|5íais,lantar|6íais,adrar|5ía,egular|6ían,bligar|6íais,taminar|7íais,evorar|6ía,ulpar|5ía,onsumir|7íamos,eparar|6íamos,uceder|6íamos,uivocar|7ía,ublicar|7íamos,endecir|7íais,ntender|7ía,sponder|7ías,esear|5ías,elear|5ías,iquecer|7íais,egociar|7íamos,nseguir|7ían,iseñar|6íamos,rpretar|7ía,contrar|7íamos,liminar|7ía,visar|5ías,laticar|7ía,bedecer|7ía,olgar|5ías,dornar|6ías,ocinar|6íamos,eñalar|6ías,sperar|6ía,jercer|6íais,nfluir|6íamos,positar|7ía,tilizar|7ía,ncender|7ías,legrar|6ía,aciar|5íamos,rever|5ían,dmitir|6íamos,ituar|5ías,licitar|7íamos,frecer|6íais,nseñar|6ía,quillar|7ía,emer|4ía,nformar|7íamos,divinar|7íais,reer|4ían,almar|5íais,ratar|5íamos,onfesar|7ías,ausar|5ían,nvencer|7ían,dificar|7íais,sminuir|7ía,urgir|5ían,redecir|7ían,guantar|7íamos,hocar|5ían,ruñir|5ía,vanzar|6íais,equerir|7ías,ntrolar|7ía,asticar|7íais,ondenar|7íamos,uemar|5ía,scoger|6ía,eguntar|7íamos,ganizar|7íamos,roponer|5drías,fectuar|7ía,uardar|6ía,rrollar|7ía,revivir|7íais,rillar|6ían,rseguir|7íais,ubir|4íais,campar|6íamos,omar|4ía,liviar|6íamos,onvenir|5dríamos,mplear|6íais,nificar|7íais,nfirmar|7íais,ehusar|6ía,ombatir|7íamos,rrojar|6íamos,ompetir|7ía,bortar|6ía,municar|7íamos,ibujar|6ía,eplicar|7ía,aler|2dríamos,umentar|7íamos,preciar|7ía,ijar|4ías,nojar|5ía,nventar|7íamos,esentar|7ían,evelar|6ían,uscar|5íamos,uponer|4dríais,ogar|4íamos,rohibir|7ías,rear|4íais,orregir|7íamos,nservar|7ías,omer|4íais,uidar|5ía,tumbrar|7ía,eriguar|7ía,raducir|7ía,sociar|6ía,alir|2dríamos,sconder|7ía,lcanzar|7ías,burrir|6ían,ograr|5ían,siasmar|7ía,lquilar|7íais,ermitir|7íais,orir|4íamos,vejecer|7íais,oder|2ríamos,nhelar|6íais,erdonar|7íais,ecordar|7ías,ontener|5dríamos,adurar|6íamos,hismear|7íamos,anar|4ía,astimar|7íais,ingir|5ían,nversar|7ía,scubrir|7íamos,ntinuar|7íais,ritar|5íamos,obrar|5íamos,ricular|7ías,lmorzar|7ían,ecoger|6ías,studiar|7ía,mpartir|7ía,alvar|5ía,añer|4ías,rreglar|7íais,ntentar|7íamos,ucear|5ía,oportar|7íamos,fligir|6íais,erder|5ía,ncantar|7íamos,erminar|7íamos,ruzar|5ían,niciar|6íamos,echazar|7íamos,ragar|5íais,umplir|6íamos,ecibir|6íamos,galizar|7íamos,epender|7ían,nvocar|6íamos,acticar|7ían,riticar|7ía,eredar|6ía,autizar|7íamos,btener|4dríais,ntestar|7íais,xhibir|6íais,ravesar|7íamos,rabajar|7ías,nstalar|7ían,menazar|7ían,referir|7ías,bolizar|7ían,iajar|5íais,talecer|7íais,gistrar|7ías,xplorar|7íais,vorciar|7ían,ancelar|7íamos,isitar|6íais,aquecer|7ía,dorar|5íamos,cabar|5ía,lvidar|6íamos,argar|5íais,egalar|6íais,avegar|6ía,vacuar|6íais,umar|4íais,sfrutar|7ía,xpresar|7ía,elebrar|7ían,nsultar|7ía,estir|5ía,cificar|7íais,espetar|7íamos,ensurar|7íais,ecorar|6ían,evantar|7ía,ugerir|6ían,vilizar|7ías,ncluir|6ía,antener|5drían,harlar|6íais,amentar|7íais,astigar|7ías,tacar|5ías,rovocar|7íais,educir|6ía,ascinar|7íais,horcar|6ía,xponer|4drían,oseguir|7íamos,nsuciar|7íamos,erecer|6íamos,entir|5ía,arar|4íais,primir|6ía,egir|4ía,resar|5íais,edir|4íamos,struir|6ía,ejar|4íais,stituir|7ía,prender|7ían,rrer|4ía,ezar|4íais,asar|4íamos,etir|4ían,igir|4íamos,meter|5ía,spirar|6ían,manecer|7íais,parecer|7íais,enar|4íais,olar|4ían,otar|4íamos,dicar|5ía,ustar|5ían,piar|4íais,alentar|7íais,istar|5íamos,udir|4íais,clar|4ía,nducir|6ías,nacer|5ían,rcar|4íamos,alizar|6ían,plicar|6íais,udar|4íamos,regar|5íamos,volver|6íais,cortar|6íais,cansar|6íais,blar|4íais,adir|4íamos,fender|6íais,scar|4íais,ndar|4íamos,vertir|6íais,onar|4ía,uchar|5íamos,estar|5ía,rificar|7íamos,rmar|4ía,var|3íais,overse|4íamos,terarse|5íais,uedarse|5íais,ncearse|5ía,ecarse|4ías,reverse|5íais,untarse|5ías,pararse|5ía,lamarse|5íamos,udarse|4ías,actarse|5ía,allarse|5ía,eitarse|5íais,ullirse|5íamos,uejarse|5ías,omit|4aríamos",
        "exceptions": "dejar|5ía,beber|5ías,renunciar|9ía,yacer|5íais,oponer|4dríais,ir|2ía,ser|3íamos,odiar|5ías,andar|5ías,negar|5ían,introducir|10íais,usar|4íais,votar|5íais,parecer|7ía,crecer|6ías,cerrar|6ías,costar|6íais,unir|4íamos,llorar|6ía,extinguir|9ías,desagradecer|12ía,desagradar|10íamos,errar|5ía,acordar|7ía,reservar|8íamos,hacer|2ríais,servir|6ía,mostrar|7íamos,criar|5íamos,vivir|5íamos,teñir|5íais,pagar|5ían,amar|4ían,tocar|5íamos,jugar|5íamos,saltar|6ía,sentar|6íamos,oír|1iríamos,atraer|6ía,apagar|6ía,herir|5íais,comprender|10ía,entrar|6ía,montar|6ías,abordar|7ía,consistir|9íais,pesar|5ía,faltar|6íamos,aprobar|7ía,convertir|9ían,huir|4ías,venir|3dríais,bajar|5ía,nadar|5ía,oler|4íais,aspirar|7íamos,traer|5ías,describir|9ían,leer|4íamos,jurar|5ían,coser|5íais,asistir|7íamos,tener|3dríamos,matar|5ían,bañar|5ía,lanzar|6íamos,agradar|7ía,coger|5íais,evitar|6ías,vender|6ía,picar|5íais,peinar|6íais,curar|5ías,echar|5íais,tirar|5ían,demostrar|9ías,arrepentirse|10íais,pasar|5ían,poner|3dríamos,pedir|5íais,dudar|5ías,cesar|5ía,cubrir|6ían,caber|3ría,caminar|7íamos,durar|5ías,tardar|6íamos,distinguir|10ía,sentirse|6ían,helar|5íamos,toser|5ía,insistir|8ía,freír|3irían,acostar|7ía,bordar|6íais,apretar|7íais,caer|4íais,batir|5íais,detener|5dría,seguir|6íais,dar|3íais,guiar|5íamos,escribir|8ías,robar|5íamos,sacar|5íamos,actuar|6íamos,mirar|5íais,distribuir|10ías,decir|1iría,atender|7ían,saber|3rían,reír|2iríamos,vencer|6ías,agradecer|9íais,purificar|9ía,deber|5íais,cazar|5íamos,padecer|7ían,glorificar|10íais,conocer|7ías,abrir|5ía,untar|5ía,borrar|6ían,estimar|7ían,contar|6íamos,probar|6ías,reinar|6ían,soler|5ía,anunciar|8íais,producir|8íamos,reñir|5íamos,hervir|6ían,besar|5íais,pegar|5ían,reconocer|9ían,emigrar|7ía,ver|3ía,contribuir|10íais,moverse|5íamos,enterarse|7íais,quedarse|6íais,satisfacer|7ríamos,atreverse|7íais,juntarse|6ías,llamarse|6íamos,mudarse|5ías,vomit|5aríamos,convenir|6dríamos,afeitarse|7íais,salir|3dríamos,poder|3ríamos,zambullirse|9íamos",
        "rev": "nreiría|3ír,ncearía|5se,pararía|5se,actaría|5se,allaría|5se,abría|2er,tendría|3er,ría|1,uerrías|3er,ecarías|4se,sharías|3cer,ondrías|2er,ejarías|4se,ndríais|1er,dríamos|er,rías|1,ríamos|1,ríais|1,ntirían|4se,reirían|2ír,abrían|2er,ndrían|1er,rían|1"
      }
    }
  };

  // uncompress them
  Object.keys(model$1).forEach(k => {
    Object.keys(model$1[k]).forEach(form => {
      model$1[k][form] = uncompress$1(model$1[k][form]);
    });
  });
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

  const toPresent = (str) => doEach(str, presentTense);
  const fromPresent = (str) => doEach(str, presentRev);

  const toPast = (str) => doEach(str, pastTense);
  const fromPast = (str) => doEach(str, pastRev);

  const toFuture = (str) => doEach(str, futureTense);
  const fromFuture = (str) => doEach(str, futureRev);

  const toConditional = (str) => doEach(str, conditional);
  const fromConditional = (str) => doEach(str, conditionalRev);


  var conjugate = {
    toPresent, fromPresent,
    toPast, fromPast,
    toFuture, fromFuture,
    toConditional, fromConditional
  };

  let lexicon$1 = {};

  const addWords = function (obj, tag, lex) {
    Object.values(obj).forEach(w => {
      lex[w] = tag;
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
        addWords(obj, 'Verb', lexicon$1);
      }
    });
  });
  // console.log(lexicon['llorar'])

  var lexicon$2 = lexicon$1;

  var lexicon = {
    model: {
      one: {
        lexicon: lexicon$2
      }
    },
    methods: {
      one: {
        transform: {
          conjugate
        }
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


  const tagger$1 = function (view) {
    let world = view.world;
    view.docs.forEach(terms => {
      firstPass(terms, world);
      secondPass(terms, world);
    });
    return view
  };
  var tagger$2 = tagger$1;

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
      ndo: vb,
      ada: vb,
      ron: vb,
      // ido: vb,
      aba: vb,
      tar: vb,
      'ían': vb,
      rar: vb,
      // ida: vb,
    },
    {
      // four-letter suffixes
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
      ando: vb,
      // ados: vb,
      aron: vb,
      adas: vb,
      tado: vb,
    },
    { // five-letter suffixes
      'ación': nn,
      mente: rb,
      iendo: vb,
      ieron: vb,
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

  var tagger = {
    compute: {
      tagger: tagger$2
    },
    model: {
      two: model
    },
    hooks: ['tagger']
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

  nlp$1.plugin(tokenizer);
  nlp$1.plugin(tagset);
  nlp$1.plugin(lexicon);
  nlp$1.plugin(tagger);


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
