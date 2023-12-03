import React, { memo, useState } from "react";
import { state } from '@/mystore/case'

const MyComponent: React.FC = () => {
    const [count, setCount] = useState(0);
    const name = state.useStore(state => state.name);
  return (
    <div>
    three - {count} - {name}
      {/* Your component content goes here */}
    </div>
  );
};

export default memo(MyComponent);
