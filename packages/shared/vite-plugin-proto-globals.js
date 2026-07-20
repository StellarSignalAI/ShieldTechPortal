/* Replicates the prototype's Babel-standalone eval semantics for files under
   packages/shared/proto/: in sloppy indirect eval, top-level `function` and `var`
   declarations leak onto the global object (which is how the prototype's
   files see each other), while `let`/`const` stay file-private. ES modules
   scope everything, so this plugin appends `window.X = X` exports for each
   top-level function/var declaration — keeping the vendored files verbatim. */

const FN_RE = /^(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/gm;
const VAR_RE = /^var\s+([A-Za-z_$][\w$]*)/gm;

export default function protoGlobals() {
  return {
    name: 'proto-globals',
    enforce: 'pre',
    transform(code, id) {
      if (!id.includes('/proto/') || !id.endsWith('.jsx')) return null;
      const names = new Set();
      for (const m of code.matchAll(FN_RE)) names.add(m[1]);
      for (const m of code.matchAll(VAR_RE)) names.add(m[1]);
      if (!names.size) return null;
      const assigns = [...names].map(n => `window.${n} = typeof ${n} !== 'undefined' ? ${n} : window.${n};`).join(' ');
      return { code: code + `\n;${assigns}\n`, map: null };
    },
  };
}
