import React from "react";

interface GradeLevelCardProps {
  grade: string;
}

const GradeLevelCard: React.FC<GradeLevelCardProps> = ({ grade }) => {
  return (
    <div className="card text-white bg-secondary w-50 text-center py-4 shadow">
      <h3 className="m-0">Grade {grade}</h3>
    </div>
  );
};

export default GradeLevelCard;
