const CLASS_SELECTOR = /\.([_a-zA-Z][\w-]*)/g

export function classesIn(css: string): Set<string> {
  const classes = new Set<string>()
  CLASS_SELECTOR.lastIndex = 0
  for (const match of css.matchAll(CLASS_SELECTOR)) classes.add(match[1])
  CLASS_SELECTOR.lastIndex = 0
  return classes
}

/** Selectors named by the reference CSS which the project has not translated. */
export function legacyOnlyClasses(referenceCss: string, projectCss: string): Set<string> {
  const reference = classesIn(referenceCss)
  const defined = classesIn(projectCss)
  return new Set([...reference].filter((className) => !defined.has(className)))
}
