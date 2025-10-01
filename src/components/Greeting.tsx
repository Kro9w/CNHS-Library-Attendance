import React from "react";

interface GreetingProps {
  scannedLrn: string | null;
  currentTime: Date;
}

const Greeting: React.FC<GreetingProps> = ({ scannedLrn, currentTime }) => {
  if (!scannedLrn) {
    return (
      <h2 className="text-center mb-4">Welcome! Please scan your barcode.</h2>
    );
  }

  const hour = currentTime.getHours();
  let greetingText = "Hello";

  if (hour >= 5 && hour < 12) greetingText = "Good Morning";
  else if (hour >= 12 && hour < 18) greetingText = "Good Afternoon";
  else greetingText = "Good Evening";

  return (
    <h2 className="text-center mb-4 bold">
      {greetingText}, Student {scannedLrn}!
    </h2>
  );
};

export default Greeting;
