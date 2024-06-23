"use client";
import { useMemo, useState } from 'react';
import { getStr } from './md';
import styles from './App.module.scss';

function App() {
    const [content, setContent] = useState(`# Title
## Subtitle
### Sub-subtitle
This is a paragraph with **bold** and *italic* text, as well as a [link](http://example.com) and an image: 
![alt text](https://img2.baidu.com/it/u=4206823861,2043582464&fm=253&fmt=auto&app=120&f=JPEG?w=100&h=100)

\`\`\`javascript
function helloWorld() {
  console.log('hello, world');
}
helloWorld();
\`\`\`

- List item 1
- List item 2
- List item 3

> This is a blockquote.

| Header1 | Header2 | Header3 |
|---------|---------|---------|
| Cell1   | Cell2   | Cell3   |
| Cell4   | Cell5   | Cell6   |
Another paragraph.
`);

    const handleChange = (e: any) => {
        setContent(e.target.value);
    };
    const htmlString = useMemo(() => {
        return getStr(content);
    }, [content]);
    return (
        <div className={styles.container}>
            <textarea
                value={content}
                onChange={handleChange}
                placeholder='Enter your markdown here...'
            />
            <div className={styles.preview} dangerouslySetInnerHTML={{ __html: htmlString }} />
        </div>
    )
}

export default App
