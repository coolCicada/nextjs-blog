import { Token } from './md';

export const StrategyContext = {
    inCodeBlock: false,
};

export interface TokenizationStrategy {
  matches(line: string): boolean;
  tokenize(line: string): Token;
}

export class HeaderStrategy implements TokenizationStrategy {
    private regex = /^(#{1,6})\s+(.*)$/;

    matches(line: string): boolean {
        return this.regex.test(line);
    }

    tokenize(line: string): Token {
        const match = line.match(this.regex)!;
        return new Token(`header${match[1].length}`, match[2]);
    }
}

export class HrStrategy implements TokenizationStrategy {
    private regex = /^-{3,}$/;
    matches(line: string): boolean {
        return this.regex.test(line);
    }

    tokenize(line: string): Token {
        return new Token('hr', '');
    }
}

export class ListStrategy implements TokenizationStrategy {
    private regex = /^\-{1}\s+(.*)$/;
    matches(line: string): boolean {
        return this.regex.test(line);
    }
    tokenize(line: string): Token {
        const match = line.match(this.regex)!;
        return new Token('listItem', match[1])
    }
}

export class BlockquoteStrategy implements TokenizationStrategy {
    private regex = /^>\s+(.*)$/;
    matches(line: string): boolean {
        return this.regex.test(line);
    }
    tokenize(line: string): Token {
        const match = line.match(this.regex)!;
        return new Token('blockquote', match[1])
    }
}

export class CodeBlockStrategy implements TokenizationStrategy {
    private regex = /^```(\w*)$/;
    matches(line: string): boolean {
        return this.regex.test(line) || StrategyContext.inCodeBlock;
    }
    tokenize(line: string): Token {
        if (!StrategyContext.inCodeBlock) {
            StrategyContext.inCodeBlock = true;
            return new Token('codeBlockStart', line.match(this.regex)![1]);
        } else {
            if (this.regex.test(line)) {
                StrategyContext.inCodeBlock = false;
                return new Token('codeBlockEnd', '');
            } else {
                return new Token('codeLine', line);
            }
        }
    }
}

export class TableStrategy implements TokenizationStrategy {
    private regex = /^\|.*\|$/;
    private regexSeparator = /^\|(-{3,}\|)+$/;
    matches(line: string): boolean {
        return this.regex.test(line);
    }
    tokenize(line: string): Token {
        if (this.regexSeparator.test(line)) {
            return new Token('tableSeparator', '');
        }
        return new Token('tableRow', line);
    }
}
