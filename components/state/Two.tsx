import React, { memo, useState } from "react";
import Three from './Three'
import Three2 from './Three2'

const MyComponent: React.FC = () => {
    const [count, setCount] = useState(0);
  return (
    <div>
      two - {count}
      <Three />
      <Three2 />
    </div>
  );
};

export default memo(MyComponent);
