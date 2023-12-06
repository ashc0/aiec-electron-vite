import { Button } from 'antd';
import { useState } from 'react';

function AboutView() {
  const [count, setCount] = useState(0);

  const handlePlusClick = () => {
    setCount(count + 1);
  };

  const handleMinusClick = () => {
    setCount(count - 1);
  };

  return (
    <div className="about-view text-right">
      <h1>About</h1>
      <Button type="primary" onClick={handlePlusClick}>
        Plus
      </Button>
      <Button type="primary" onClick={handleMinusClick}>
        Minus
      </Button>
      <h2>
        Count:
        {count}
      </h2>

      <h2>
        Double Count:
        {count * 2}
      </h2>
    </div>
  );
}

export default AboutView;
