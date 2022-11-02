const findNumbers = function (view) {
  let m = view.match('#Value+')
  //5-8
  m = m.splitAfter('#NumberRange')
  // june 5th 1999
  m = m.splitBefore('#Year')
  // 1993/44 y 1994/44
  m = m.splitAfter('#Fraction')
  // not 'y una'
  m = m.not('^y')
  return m
}
export default findNumbers