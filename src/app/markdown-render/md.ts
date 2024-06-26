import Prism from 'prismjs';
import 'prismjs/themes/prism.css';
import { Tokenizer } from './tokenlize';
import { BlockquoteStrategy, CodeBlockStrategy, HeaderStrategy, HrStrategy, ListStrategy, TableStrategy } from './strategies';
export class Token {
    constructor(public type: string, public value: string) {}
}

class MarkdownNode {
    children: MarkdownNode[] = [];
    constructor(public type: string, public value: string = '') {}
    addChild(node: MarkdownNode) {
        this.children.push(node);
    }
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
                currentNode.addChild(new MarkdownNode(token.type, token.value));
                break;
            case 'listItem':
                if (currentNode.type !== 'list') {
                    const listNode = new MarkdownNode('list');
                    currentNode.addChild(listNode);
                    currentNode = listNode;
                }
                currentNode.children.push(new MarkdownNode('listItem', token.value));
                break;
            case 'codeBlockStart':
                currentNode = root;
                const codeBlockNode = new MarkdownNode('codeBlock', token.value);
                currentNode.addChild(codeBlockNode);
                currentNode = codeBlockNode;
                break;
            case 'codeBlockEnd':
                currentNode = root;
                break;
            case 'codeLine':
                currentNode.addChild(new MarkdownNode('codeLine', token.value));
                break;
            case 'tableRow':
                if (currentNode.type !== 'table') {
                    isTableHeader = true;
                    const tableNode = new MarkdownNode('table');
                    currentNode.addChild(tableNode);
                    currentNode = tableNode;
                }
                currentNode.addChild(new MarkdownNode(isTableHeader ? 'tableHeader' : 'tableRow', token.value));
                break;
            case 'tableSeparator':
                isTableHeader = false;
                break;
            case 'strikethrough':
                currentNode = root;
                const strikethroughNode = new MarkdownNode('strikethrough', token.value);
                currentNode.children.push(strikethroughNode);
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
        strikethrough: /~~(.*?)~~/g,
    };

    text = text.replace(regex.image, '<img style="height: 100px" src="$2" alt="$1" />');
    text = text.replace(regex.link, '<a href="$2">$1</a>');
    text = text.replace(regex.bold, '<strong>$1</strong>');
    text = text.replace(regex.italic, '<em>$1</em>');
    text = text.replace(regex.inlineCode, '<code>$1</code>');
    text = text.replace(regex.strikethrough, '<del>$1</del>');

    return text;
}

function renderTable(node: MarkdownNode): string {
    const headerHtml = node.children[0].value.split('|').map(header => header.trim()).filter(Boolean).map(header => `<th>${header}</th>`).join('');
    const rowsHtml = node.children.slice(1).map(nt => `<tr>${nt.value.split('|').map(header => header.trim()).filter(Boolean).map(header => `<td>${header}</td>`).join('')}<tr>`).join('')
    return `<table><thead><tr>${headerHtml}</tr></thead><tbody>${rowsHtml}</tbody></table>`;
}

function generateTokens(markdown: string) {
    const tokenlizer = new Tokenizer();
    tokenlizer.addStrategy(new HeaderStrategy());
    tokenlizer.addStrategy(new HrStrategy());
    tokenlizer.addStrategy(new ListStrategy());
    tokenlizer.addStrategy(new BlockquoteStrategy());
    tokenlizer.addStrategy(new CodeBlockStrategy());
    tokenlizer.addStrategy(new TableStrategy());
    return tokenlizer.tokenize(markdown);
}

export function getStr(markdown: string) {
    // Tokenize, parse, and render the Markdown
    // const tokens = tokenize(markdown);
    const tokens = generateTokens(markdown);
    console.log('tokens:', tokens);
    const ast = parse(tokens);
    console.log('ast:', ast);
    const html = render(ast);
    return html;
}
