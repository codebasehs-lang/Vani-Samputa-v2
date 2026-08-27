// Notes are authored via a constrained contentEditable toolbar (bold/underline/highlight only),
// but pasted clipboard content can carry arbitrary HTML — strip anything dangerous before persisting.
const ALLOWED_TAGS = new Set(["B", "STRONG", "U", "SPAN", "DIV", "BR", "MARK", "P"])

export function sanitizeNoteHtml(html: string): string {
  if (typeof window === "undefined") {
    // Server: regex-based defense in depth (removes scripts, event handlers, javascript: URLs).
    return html
      .replace(/<\/?(script|style|iframe|object|embed|link|meta|form)[^>]*>/gi, "")
      .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
      .replace(/(href|src)\s*=\s*("javascript:[^"]*"|'javascript:[^']*')/gi, "")
  }

  const template = document.createElement("template")
  template.innerHTML = html

  const walk = (node: Node) => {
    const children = Array.from(node.childNodes)
    for (const child of children) {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const el = child as HTMLElement
        if (!ALLOWED_TAGS.has(el.tagName)) {
          el.replaceWith(...Array.from(el.childNodes))
          continue
        }
        for (const attr of Array.from(el.attributes)) {
          if (attr.name === "style") {
            // only allow background-color / color declarations (used for highlighter pens)
            const safe = attr.value
              .split(";")
              .map((d) => d.trim())
              .filter((d) => /^(background-color|color)\s*:/.test(d))
              .join("; ")
            if (safe) el.setAttribute("style", safe)
            else el.removeAttribute("style")
          } else {
            el.removeAttribute(attr.name)
          }
        }
        walk(el)
      }
    }
  }
  walk(template.content)
  return template.innerHTML
}
