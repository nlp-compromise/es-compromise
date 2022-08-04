const postTagger = function (doc) {
  // ne foo pas
  // doc.match('ne [.] pas', 0).tag('Verb', 'ne-verb-pas')
  // reflexive
  // doc.match('(se|me|te) [.]', 0).tag('Verb', 'se-noun')
  // numbers
  doc.match('#Value y #Value').tag('TextValue', 'num-y-num')
  // minus eight
  doc.match('menos #Value').tag('TextValue', 'minus-val')
  // 3 pintas de cerveza
  doc.match('#Value [#PresentTense] de #Noun', 0).tag('Plural', '3-pintas')
}
export default postTagger