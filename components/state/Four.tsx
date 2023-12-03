import React, { memo, useState } from "react";
import Five from "./Five";

const MyComponent: React.FC = () => {
    const [count, setCount] = useState(0);
  return (
    <div>
    four - {count}
    <Five />
      {/* Your component content goes here */}
    </div>
  );
};

export default memo(MyComponent);
