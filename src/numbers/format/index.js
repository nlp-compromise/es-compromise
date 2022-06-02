import toText from './toText.js'
// import { toOrdinal } from '../parse/_data.js'

const formatNumber = function (parsed, fmt) {
  if (fmt === 'TextOrdinal') {
    let words = toText(parsed.num)
    // let last = words[words.length - 1]
    // words[words.length - 1] = toOrdinal[last]
    return words.join(' ')
  }
  if (fmt === 'TextCardinal') {
    return toText(parsed.num).join(' ')
  }
  // numeric formats
  if (fmt === 'Ordinal') {

  }
  if (fmt === 'Cardinal') {
    return String(parsed.num)
  }
  return String(parsed.num || '')
}
export default formatNumber