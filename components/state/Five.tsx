import React, { memo, useState } from "react";
import { state } from '@/mystore/case';

const MyComponent: React.FC = () => {
    const [count, setCount] = useState(0);
  return (
    <div>
    five - {count}
    <button onClick={() => state.refreshStore({ name: new Date().getTime().toString(), age: 20})}>refresh</button>
      {/* Your component content goes here */}
    </div>
  );
};

export default memo(MyComponent);
