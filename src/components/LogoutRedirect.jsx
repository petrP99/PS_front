import { useEffect } from 'react';
import { bffUrl } from '../config';

export default function LogoutRedirect() {
  useEffect(() => {
    window.location.href = bffUrl('/logout');
  }, []);
  return null;
}
