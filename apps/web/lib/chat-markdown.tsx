import React, { type ElementType, type ReactNode } from "react";

type MarkdownBlock =
  | {
      type: "heading";
      level: 1 | 2 | 3 | 4 | 5 | 6;
      content: string;
    }
  | {
      type: "paragraph";
      content: string;
    }
  | {
      type: "unordered-list";
      items: string[];
    }
  | {
      type: "ordered-list";
      items: string[];
    }
  | {
      type: "blockquote";
      content: string;
    }
  | {
      type: "code";
      language: string | null;
      content: string;
    };

function isBlockStart(line: string) {
  const trimmed = line.trim();
  return (
    trimmed.startsWith("```") ||
    /^#{1,6}\s+/.test(trimmed) ||
    /^>\s?/.test(trimmed) ||
    /^[-*+]\s+/.test(trimmed) ||
    /^\d+\.\s+/.test(trimmed)
  );
}

function parseMarkdownBlocks(content: string): MarkdownBlock[] {
  const lines = content.replace(/\r\n?/g, "\n").split("\n");
  const blocks: MarkdownBlock[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index] ?? "";
    const trimmed = line.trim();

    if (!trimmed) {
      index += 1;
      continue;
    }

    if (trimmed.startsWith("```")) {
      const language = trimmed.slice(3).trim() || null;
      const codeLines: string[] = [];
      index += 1;

      while (index < lines.length && !(lines[index] ?? "").trim().startsWith("```")) {
        codeLines.push(lines[index] ?? "");
        index += 1;
      }

      if (index < lines.length) {
        index += 1;
      }

      blocks.push({
        type: "code",
        language,
        content: codeLines.join("\n"),
      });
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      blocks.push({
        type: "heading",
        level: headingMatch[1].length as 1 | 2 | 3 | 4 | 5 | 6,
        content: headingMatch[2].replace(/\s+#+\s*$/, ""),
      });
      index += 1;
      continue;
    }

    if (/^>\s?/.test(trimmed)) {
      const quoteLines: string[] = [];

      while (index < lines.length) {
        const quoteLine = lines[index] ?? "";
        if (!quoteLine.trim()) {
          break;
        }

        const match = quoteLine.match(/^>\s?(.*)$/);
        if (!match) {
          break;
        }

        quoteLines.push(match[1]);
        index += 1;
      }

      blocks.push({
        type: "blockquote",
        content: quoteLines.join("\n"),
      });
      continue;
    }

    if (/^[-*+]\s+/.test(trimmed)) {
      const items: string[] = [];

      while (index < lines.length) {
        const listLine = lines[index] ?? "";
        const listMatch = listLine.trim().match(/^[-*+]\s+(.+)$/);
        if (listMatch) {
          items.push(listMatch[1]);
          index += 1;
          continue;
        }

        if ((listLine.startsWith("  ") || listLine.startsWith("\t")) && items.length > 0) {
          items[items.length - 1] = `${items[items.length - 1]}\n${listLine.trim()}`;
          index += 1;
          continue;
        }

        if (!listLine.trim()) {
          index += 1;
        }
        break;
      }

      blocks.push({
        type: "unordered-list",
        items,
      });
      continue;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      const items: string[] = [];

      while (index < lines.length) {
        const listLine = lines[index] ?? "";
        const listMatch = listLine.trim().match(/^\d+\.\s+(.+)$/);
        if (listMatch) {
          items.push(listMatch[1]);
          index += 1;
          continue;
        }

        if ((listLine.startsWith("  ") || listLine.startsWith("\t")) && items.length > 0) {
          items[items.length - 1] = `${items[items.length - 1]}\n${listLine.trim()}`;
          index += 1;
          continue;
        }

        if (!listLine.trim()) {
          index += 1;
        }
        break;
      }

      blocks.push({
        type: "ordered-list",
        items,
      });
      continue;
    }

    const paragraphLines = [trimmed];
    index += 1;

    while (index < lines.length) {
      const nextLine = lines[index] ?? "";
      if (!nextLine.trim() || isBlockStart(nextLine)) {
        break;
      }

      paragraphLines.push(nextLine.trim());
      index += 1;
    }

    blocks.push({
      type: "paragraph",
      content: paragraphLines.join("\n"),
    });
  }

  return blocks;
}

function findClosingToken(content: string, token: string, startIndex: number) {
  let index = startIndex;

  while (index < content.length) {
    const nextIndex = content.indexOf(token, index);
    if (nextIndex === -1) {
      return -1;
    }

    if (content[nextIndex - 1] !== "\\") {
      return nextIndex;
    }

    index = nextIndex + token.length;
  }

  return -1;
}

function isSafeHref(href: string) {
  if (href.startsWith("/")) {
    return true;
  }

  try {
    const url = new URL(href);
    return url.protocol === "http:" || url.protocol === "https:" || url.protocol === "mailto:";
  } catch {
    return false;
  }
}

function renderInline(content: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let cursor = 0;

  while (cursor < content.length) {
    const nextSpecial = content.slice(cursor).search(/[`[*_]/);
    if (nextSpecial === -1) {
      nodes.push(content.slice(cursor));
      break;
    }

    const tokenIndex = cursor + nextSpecial;
    if (tokenIndex > cursor) {
      nodes.push(content.slice(cursor, tokenIndex));
    }

    if (content.startsWith("`", tokenIndex)) {
      const closingIndex = findClosingToken(content, "`", tokenIndex + 1);
      if (closingIndex > tokenIndex + 1) {
        nodes.push(
          <code key={`${keyPrefix}-code-${tokenIndex}`}>{content.slice(tokenIndex + 1, closingIndex)}</code>,
        );
        cursor = closingIndex + 1;
        continue;
      }
    }

    if (content.startsWith("[", tokenIndex)) {
      const labelEnd = content.indexOf("]", tokenIndex + 1);
      const hrefStart = labelEnd === -1 ? -1 : content.indexOf("(", labelEnd);
      const hrefEnd = hrefStart === -1 ? -1 : content.indexOf(")", hrefStart);
      if (labelEnd > tokenIndex + 1 && hrefStart === labelEnd + 1 && hrefEnd > hrefStart + 1) {
        const label = content.slice(tokenIndex + 1, labelEnd);
        const href = content.slice(hrefStart + 1, hrefEnd).trim();

        if (isSafeHref(href)) {
          nodes.push(
            <a href={href} key={`${keyPrefix}-link-${tokenIndex}`} rel="noreferrer" target="_blank">
              {renderInline(label, `${keyPrefix}-link-label-${tokenIndex}`)}
            </a>,
          );
          cursor = hrefEnd + 1;
          continue;
        }
      }
    }

    if (content.startsWith("**", tokenIndex) || content.startsWith("__", tokenIndex)) {
      const token = content.slice(tokenIndex, tokenIndex + 2);
      const closingIndex = findClosingToken(content, token, tokenIndex + 2);
      if (closingIndex > tokenIndex + 2) {
        nodes.push(
          <strong key={`${keyPrefix}-strong-${tokenIndex}`}>
            {renderInline(content.slice(tokenIndex + 2, closingIndex), `${keyPrefix}-strong-inner-${tokenIndex}`)}
          </strong>,
        );
        cursor = closingIndex + 2;
        continue;
      }
    }

    if (content.startsWith("*", tokenIndex) || content.startsWith("_", tokenIndex)) {
      const token = content[tokenIndex]!;
      const closingIndex = findClosingToken(content, token, tokenIndex + 1);
      if (closingIndex > tokenIndex + 1) {
        nodes.push(
          <em key={`${keyPrefix}-em-${tokenIndex}`}>
            {renderInline(content.slice(tokenIndex + 1, closingIndex), `${keyPrefix}-em-inner-${tokenIndex}`)}
          </em>,
        );
        cursor = closingIndex + 1;
        continue;
      }
    }

    nodes.push(content[tokenIndex]);
    cursor = tokenIndex + 1;
  }

  return nodes;
}

function renderInlineWithBreaks(content: string, keyPrefix: string) {
  return content.split("\n").flatMap((segment, index) => {
    const segmentNodes = renderInline(segment, `${keyPrefix}-segment-${index}`);
    return index === 0 ? segmentNodes : [<br key={`${keyPrefix}-break-${index}`} />, ...segmentNodes];
  });
}

function renderBlock(block: MarkdownBlock, index: number) {
  switch (block.type) {
    case "heading": {
      const Tag = `h${Math.min(block.level, 4)}` as ElementType;
      return <Tag key={`block-${index}`}>{renderInline(block.content, `block-${index}`)}</Tag>;
    }
    case "paragraph":
      return <p key={`block-${index}`}>{renderInlineWithBreaks(block.content, `block-${index}`)}</p>;
    case "unordered-list":
      return (
        <ul key={`block-${index}`}>
          {block.items.map((item, itemIndex) => (
            <li key={`block-${index}-item-${itemIndex}`}>{renderInlineWithBreaks(item, `block-${index}-item-${itemIndex}`)}</li>
          ))}
        </ul>
      );
    case "ordered-list":
      return (
        <ol key={`block-${index}`}>
          {block.items.map((item, itemIndex) => (
            <li key={`block-${index}-item-${itemIndex}`}>{renderInlineWithBreaks(item, `block-${index}-item-${itemIndex}`)}</li>
          ))}
        </ol>
      );
    case "blockquote":
      return <blockquote key={`block-${index}`}>{renderInlineWithBreaks(block.content, `block-${index}`)}</blockquote>;
    case "code":
      return (
        <pre key={`block-${index}`}>
          {block.language ? <span className="chat-markdown__language">{block.language}</span> : null}
          <code>{block.content}</code>
        </pre>
      );
  }
}

export function ChatMarkdown({ content }: { content: string }) {
  const blocks = parseMarkdownBlocks(content);

  if (blocks.length === 0) {
    return <div className="chat-markdown" />;
  }

  return <div className="chat-markdown">{blocks.map(renderBlock)}</div>;
}
