import React, { memo, useState } from "react";
import Two from "./Two";

const MyComponent: React.FC = () => {
    const [count, setCount] = useState(0);
  return (
    <div>
    one - {count}
    <Two />
      {/* Your component content goes here */}
    </div>
  );
};

export default memo(MyComponent);
