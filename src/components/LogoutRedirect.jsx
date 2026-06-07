import { useEffect } from 'react';

export default function LogoutRedirect() {
  useEffect(() => {
    window.location.href = 'http://localhost:9090/logout';
  }, []);
  return null;
}