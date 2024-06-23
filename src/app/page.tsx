"use client";
import { useEffect, useMemo, useState } from 'react';
import { getStr } from './md';
import styles from './App.module.scss';

function App() {
    const [content, setContent] = useState('');

    useEffect(() => {
        async function getStrFromFile() {
            const api = await fetch('/api/item')
            const resp = await api.json();
            setContent(resp.content);
        }
        getStrFromFile();
    }, []);

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
