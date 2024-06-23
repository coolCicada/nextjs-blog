import Prism from 'prismjs';
import 'prismjs/themes/prism.css';
class Token {
    constructor(public type: string, public value: string) {}
}

class MarkdownNode {
    children: MarkdownNode[] = [];
    constructor(public type: string, public value: string = '') {}
}

function tokenize(markdown: string): Token[] {
    const tokens: Token[] = [];
    const lines = markdown.split('\n');
    const regex = {
        header: /^(#{1,6})\s+(.*)$/,
        hr: /^-{3,}$/,
        list: /^\-{1}\s+(.*)$/,
        blockquote: /^>\s+(.*)$/,
        mainInfoBlock: /^>{3}\s+(.*)$/,
        codeBlock: /^```(\w*)$/,
        table: /^\|.*\|$/,
        tableSeparator: /^\|(-{3,}\|)+$/,
        inlineCode: /`([^`]+)`/,
        bold: /\*\*(.*?)\*\*/g,
        italic: /\*(.*?)\*/g,
        link: /\[([^\]]+)\]\(([^)]+)\)/g,
        image: /!\[([^\]]*)\]\(([^)]+)\)/g,
    };

    let inCodeBlock = false;
    lines.forEach(line => {
        if (inCodeBlock) {
            if (regex.codeBlock.test(line)) {
                inCodeBlock = false;
                tokens.push(new Token('codeBlockEnd', ''));
            } else {
                tokens.push(new Token('codeLine', line));
            }
        } else {
            if (regex.codeBlock.test(line)) {
                inCodeBlock = true;
                tokens.push(new Token('codeBlockStart', line.match(regex.codeBlock)![1]));
            } else if (regex.header.test(line)) {
                const match = line.match(regex.header)!;
                tokens.push(new Token(`header${match[1].length}`, match[2]));
            } else if (regex.hr.test(line)) {
                tokens.push(new Token('hr', ''));
            } else if (regex.list.test(line)) {
                const match = line.match(regex.list)!;
                tokens.push(new Token('listItem', match[1]));
            }else if (regex.blockquote.test(line)) {
                const match = line.match(regex.blockquote)!;
                tokens.push(new Token('blockquote', match[1]));
            } else if (regex.tableSeparator.test(line)) {
                tokens.push(new Token('tableSeparator', ''));
            } else if (regex.table.test(line)) {
                tokens.push(new Token('tableRow', line));
            } else {
                tokens.push(new Token('paragraph', line));
            }
        }
    });

    return tokens;
}

function parse(tokens: Token[]): MarkdownNode {
    const root = new MarkdownNode('root');
    let currentNode = root;
    let isTableHeader = false;

    tokens.forEach(token => {

        switch (token.type) {
            case 'header1':
            case 'header2':
            case 'header3':
            case 'header4':
            case 'header5':
            case 'header6':
            case 'paragraph':
            case 'blockquote':
            case 'hr':
                currentNode = root;
                currentNode.children.push(new MarkdownNode(token.type, token.value));
                break;
            case 'listItem':
                if (currentNode.type !== 'list') {
                    const listNode = new MarkdownNode('list');
                    root.children.push(listNode);
                    currentNode = listNode;
                }
                currentNode.children.push(new MarkdownNode('listItem', token.value));
                break;
            case 'codeBlockStart':
                const codeBlockNode = new MarkdownNode('codeBlock', token.value);
                root.children.push(codeBlockNode);
                currentNode = codeBlockNode;
                break;
            case 'codeBlockEnd':
                currentNode = root;
                break;
            case 'codeLine':
                currentNode.children.push(new MarkdownNode('codeLine', token.value));
                break;
            case 'tableRow':
                if (currentNode.type !== 'table') {
                    isTableHeader = true;
                    const tableNode = new MarkdownNode('table');
                    console.log('currentNode:', currentNode);
                    currentNode.children.push(tableNode);
                    currentNode = tableNode;
                }
                currentNode.children.push(new MarkdownNode(isTableHeader ? 'tableHeader' : 'tableRow', token.value));
                break;
            case 'tableSeparator':
                isTableHeader = false;
                break;
            default:
                throw new Error(`Unknown token type: ${token.type}`);
        }
    });

    return root;
}

function render(node: MarkdownNode): string {
    switch (node.type) {
        case 'root':
            return node.children.map(render).join('\n');
        case 'header1':
            return `<h1>${node.value}</h1>`;
        case 'header2':
            return `<h2>${node.value}</h2>`;
        case 'header3':
            return `<h3>${node.value}</h3>`;
        case 'header4':
            return `<h4>${node.value}</h4>`;
        case 'header5':
            return `<h5>${node.value}</h5>`;
        case 'header6':
            return `<h6>${node.value}</h6>`;
        case 'paragraph':
            return `<p>${renderInline(node.value)}</p>`;
        case 'blockquote':
            return `<blockquote>${renderInline(node.value)}</blockquote>`;
        case 'hr':
            return `<hr />`;
        case 'list':
            return `<ul>${node.children.map(render).join('')}</ul>`;
        case 'listItem':
            return `<li>${renderInline(node.value)}</li>`;
        case 'codeBlock':
            const language = node.value || 'plaintext';
            const code = node.children.map(render).join('\n');
            const highlightedCode = Prism.highlight(code, Prism.languages[language], language);
            console.log('code:', code, highlightedCode)
            return `<div class="code-block"><pre><code class="language-${language}">${highlightedCode}</code></pre></div>`;
        case 'codeLine':
            return node.value;
        case 'table':
            return renderTable(node);
        default:
            throw new Error(`Unknown node type: ${node.type}`);
    }
}

function renderInline(text: string): string {
    const regex = {
        inlineCode: /`([^`]+)`/,
        bold: /\*\*(.*?)\*\*/g,
        italic: /\*(.*?)\*/g,
        link: /\[([^\]]+)\]\(([^)]+)\)/g,
        image: /!\[([^\]]*)\]\(([^)]+)\)/g,
    };

    text = text.replace(regex.image, '<div style="height: 100px"><img style="height: 100%" src="$2" alt="$1" /><div>');
    text = text.replace(regex.link, '<a href="$2">$1</a>');
    text = text.replace(regex.bold, '<strong>$1</strong>');
    text = text.replace(regex.italic, '<em>$1</em>');
    text = text.replace(regex.inlineCode, '<code>$1</code>');

    return text;
}

function renderTable(node: MarkdownNode): string {
    const headerHtml = node.children[0].value.split('|').map(header => header.trim()).filter(Boolean).map(header => `<th>${header}</th>`).join('');
    console.log('headerHtml:', headerHtml);
    const rowsHtml = node.children.slice(1).map(nt => `<tr>${nt.value.split('|').map(header => header.trim()).filter(Boolean).map(header => `<td>${header}</td>`).join('')}<tr>`).join('')
    return `<table><thead><tr>${headerHtml}</tr></thead><tbody>${rowsHtml}</tbody></table>`;
}

export function getStr(markdown: string) {
    // Tokenize, parse, and render the Markdown
    const tokens = tokenize(markdown);
    console.log('tokens:', tokens);
    const ast = parse(tokens);
    console.log('ast:', ast);
    const html = render(ast);
    return html;
}
