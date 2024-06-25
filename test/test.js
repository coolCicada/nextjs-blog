const rules = [
    { type: 'inlineCode', regex: /`([^`]+)`/, valueIndex: 1 },
    { type: 'bold', regex: /\*\*(.*?)\*\*/, valueIndex: 1 },
    { type: 'italic', regex: /\*(.*?)\*/, valueIndex: 1 },
    { type: 'link', regex: /\[([^\]]+)\]\(([^)]+)\)/, valueIndex: 1 },
    { type: 'image', regex: /!\[([^\]]*)\]\(([^)]+)\)/, valueIndex: 1 },
    { type: 'strikethrough', regex: /\~\~(.*?)\~\~/, valueIndex: 1 },
];

const nodeRender = {
    header1: (context) => {
        return `<h1>${context[0]}</h1>`
    },
    paragraph: (context, child) => {
        return `<p>${Array.isArray(child) ? child.join('') : ''}</p>`
    },
    inlineCode: (context) => {
        return `<code>${context[0]}</code>`
    },
    bold: (context) => {
        return `<b>${context[0]}</b>`;
    },
    italic: (context) => {
        return `<em>${context}</em>`;
    },
    link: (context) => {
        return `<a href="${context[1]}">${context[0]}</a>`;
    },
    image: (context) => {
        return `<img src="${context[1]}" alt="${context[0]}"/>`;
    },
    strikethrough: (context) => {
        return `<del>${context[0]}</del>`;
    },
    text: (context) => {
        return `${context[0]}`;
    }
}

function tokenize(input) {
    const tokens = [];
    let pos = 0;

    while (pos < input.length) {
        let match = null;
        let matchedRule = null;
        let currIndex = Infinity;
        let currMatch = null;

        for (let rule of rules) {
            currMatch = input.slice(pos).match(rule.regex);
            if (currMatch && currMatch.index < currIndex) {
                matchedRule = rule;
                currIndex = currMatch.index;
                match = currMatch;
            }
        }

        if (!match) {
            throw new Error(`Unexpected token at position ${pos}`);
        }
        const token = {
            type: matchedRule.type,
            value: [...match.slice(matchedRule.valueIndex)],
        };
        if (currIndex > 0) {
            tokens.push({ type: 'text', value: [input.slice(pos, pos + currIndex)] });
        }
        tokens.push(token);
        pos += match.index + match[0].length;
    }

    return tokens;
}

const input = '这是一段`文本`、演示 ~~删除线~~、 **粗体** 和 *斜体* text、 还有一个 [超链接](http://example.com) 下边是图片: ![alt text](https://img2.baidu.com/it/u=4206823861,2043582464&fm=253&fmt=auto&app=120&f=JPEG?w=100&h=100)';
const tokens = tokenize(input);

console.log(tokens);
const node = { type: 'paragraph', children: 
    [
        { type: 'header1', value: ['标题'] },
        {
            type: 'paragraph', children: tokens,
        }
    ]
};

function render(node) {
    return nodeRender[node.type](node.value, node?.children?.map(render));
}
const r = render(node);
console.log('r:', r);
