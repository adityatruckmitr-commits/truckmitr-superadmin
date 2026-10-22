import { useEffect } from 'react'
import { useHighlightId } from '../hooks/useHighlightId'

/**
 * Makes `?highlight=<id>` work on any screen: once the page's data has rendered, it scrolls to the element
 * tagged `data-hl="<id>"` and pulses it. Pages only tag their rows; no per-page scroll code needed.
 */
const DeepLinkHighlighter = () => {
  const highlightId = useHighlightId()

  useEffect(() => {
    if (highlightId === null) return
    const selector = `[data-hl="${CSS.escape(String(highlightId))}"]`
    let tries = 0
    // Lists load asynchronously, so keep looking for a few seconds rather than once.
    const timer = setInterval(() => {
      const matches = Array.from(document.querySelectorAll(selector)).filter((el) => el.offsetParent !== null)
      if (matches.length || ++tries > 40) {
        clearInterval(timer)
        if (!matches.length) return
        matches[0].scrollIntoView({ behavior: 'smooth', block: 'center' })
        matches.forEach((el) => {
          el.classList.remove('deep-link-flash')
          void el.offsetWidth // restart the animation if the same row is linked twice
          el.classList.add('deep-link-flash')
        })
      }
    }, 200)
    return () => clearInterval(timer)
  }, [highlightId])

  return null
}

export default DeepLinkHighlighter
