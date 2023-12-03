import { useEffect, useState } from "react";

export function createState<T>(obj: T) {
    let data = obj;
    const fns: Function[] = []
    function subscribe(fn: () => void) {
        fns.push(fn);
    }
    function getState() {
        return data;
    }
    function refreshStore(newState: T) {
        data = newState;
        fns.forEach(fn => fn());
    }

    function useStore(mapState: (state: T) => any) {
        const [mpState, setState] = useState(mapState(data));
        useEffect(() => {
            subscribe(() => setState(mapState(data)));
        }, []);
        return mpState;
    }
    
    return { getState, refreshStore, subscribe, useStore }
}