import React, { memo, useState } from "react";
import { state } from '@/mystore/case'

const MyComponent: React.FC = () => {
    const [count, setCount] = useState(0);
    const age = state.useStore(state => state.age);
  return (
    <div>
    three - {count} - {age}
      {/* Your component content goes here */}
    </div>
  );
};

export default memo(MyComponent);
