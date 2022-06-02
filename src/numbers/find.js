const findNumbers = function (view) {
  let m = view.match('#Value+')
  //5-8
  m = m.splitAfter('#NumberRange')
  // june 5th 1999
  m = m.splitBefore('#Year')
  return m
}
export default findNumbers