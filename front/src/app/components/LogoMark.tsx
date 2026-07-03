import type { ImgHTMLAttributes } from 'react';
import logoUrl from '../../styles/consorcio.png';

type LogoMarkProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'>;

export function LogoMark({ className, ...props }: LogoMarkProps) {
  return (
    <img
      src={logoUrl}
      alt="CuentasClaras"
      className={['object-contain', className].filter(Boolean).join(' ')}
      width={64}
      height={64}
      {...props}
    />
  );
}
