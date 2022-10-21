import toText from './toText.js'
import { toOrdinal } from './_data.js'

const formatNumber = function (parsed, fmt) {
  if (fmt === 'TextOrdinal') {
    let words = toText(parsed.num)
    words = words.map(w => {
      if (toOrdinal.hasOwnProperty) {
        return toOrdinal[w]
      }
      return w
    })
    return words.join(' ')
  }
  if (fmt === 'TextCardinal') {
    return toText(parsed.num).join(' ')
  }
  // numeric formats
  if (fmt === 'Ordinal') {
    return String(parsed.num) + '°'
  }
  if (fmt === 'Cardinal') {
    return String(parsed.num)
  }
  return String(parsed.num || '')
}
export default formatNumber