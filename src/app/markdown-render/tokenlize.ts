import { Token } from "./md";
import { TokenizationStrategy } from "./strategies";

export class Tokenizer {
    private strategies: TokenizationStrategy[] = [];

    addStrategy(strategy: TokenizationStrategy) {
        this.strategies.push(strategy);
    }

    tokenize(markdown: string): Token[] {
        const tokens: Token[] = [];
        const lines = markdown.split('\n');
        lines.forEach(line => {
            let matched = false;
            for (const strategy of this.strategies) {
                if (strategy.matches(line)) {
                    tokens.push(strategy.tokenize(line));
                    matched = true;
                    break;
                }
            }
            if (!matched) {
                tokens.push(new Token('paragraph', line));
            }
        });
        return tokens;
    }
}