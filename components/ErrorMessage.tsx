import React from 'react';

interface ErrorMessageProps {
  message?: string;
  id?: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, id }) => {
  if (!message) return null;
  return (
    <p className="mt-2 text-sm text-red-600" id={id}>
      {message}
    </p>
  );
};

export default ErrorMessage;
