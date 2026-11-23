import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ReactNode } from 'react';
import { Children, cloneElement, isValidElement } from 'react';

/** Pull plain text out of rendered children (to detect callout markers). */
function textOf(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textOf).join('');
  if (isValidElement<{ children?: ReactNode }>(node)) return textOf(node.props.children);
  return '';
}

/** Remove a leading "[!VERIFY]" / "[!TRAP]" marker from the first paragraph's text. */
function stripMarker(children: ReactNode, marker: string): ReactNode {
  let done = false;
  const strip = (n: ReactNode): ReactNode => {
    if (done) return n;
    if (typeof n === 'string') {
      const i = n.indexOf(marker);
      if (i >= 0) {
        done = true;
        return n.slice(0, i) + n.slice(i + marker.length).replace(/^\s+/, '');
      }
      return n;
    }
    if (Array.isArray(n)) return n.map(strip);
    if (isValidElement<{ children?: ReactNode }>(n)) {
      return cloneElement(n, undefined, ...(Children.map(n.props.children, strip) ?? []));
    }
    return n;
  };
  return Children.map(children, strip);
}

/**
 * Markdown renderer for study notes. Raw HTML is not rendered.
 * Callouts: a blockquote starting with [!VERIFY] or [!TRAP] gets special styling.
 */
export function Markdown({ children }: { children: string }) {
  return (
    <div className="prose">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          blockquote({ children: kids }) {
            const t = textOf(kids).trim();
            if (t.startsWith('[!VERIFY]')) return <blockquote className="verify">{stripMarker(kids, '[!VERIFY]')}</blockquote>;
            if (t.startsWith('[!TRAP]')) return <blockquote className="trap">{stripMarker(kids, '[!TRAP]')}</blockquote>;
            return <blockquote>{kids}</blockquote>;
          },
          a({ href, children: kids }) {
            return (
              <a href={href} target="_blank" rel="noreferrer noopener">
                {kids}
              </a>
            );
          },
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
