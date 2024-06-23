"use client";
import { useEffect, useMemo, useRef, useState } from 'react';
import { getStr } from './md';
import styles from './App.module.scss';

function App() {
    const [content, setContent] = useState('');
    const textarea = useRef<HTMLTextAreaElement>(null);

    function autoResize() {
        const scrollPosition = window.scrollY; // 保存当前的滚动位置
        textarea.current!.style.height = 'auto';
        textarea.current!.style.height = textarea.current!.scrollHeight + 'px';  // 设置为内容的高度
        console.log(textarea.current!.style.height)
        window.scrollTo({ top: scrollPosition }); // 恢复滚动位置
    }

    useEffect(() => {
        async function getStrFromFile() {
            const api = await fetch('/api/item')
            const resp = await api.json();
            setContent(resp.content);
        }
        getStrFromFile();
    }, []);

    useEffect(() => {
        autoResize();
    }, [content]);
    
    const handleChange = (e: any) => {
        setContent(e.target.value);
    };
    const htmlString = useMemo(() => {
        return getStr(content);
    }, [content]);
    return (
        <div className={styles.container}>
            <textarea
                ref={textarea}
                value={content}
                onChange={handleChange}
                placeholder='Enter your markdown here...'
            />
            <div className={styles.preview} dangerouslySetInnerHTML={{ __html: htmlString }} />
        </div>
    )
}

export default App
