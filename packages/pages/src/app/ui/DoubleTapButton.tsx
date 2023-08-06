import { memo, type PropsWithChildren, useCallback, useState } from 'react';
import { useRefFrom } from 'use-ref-from';

type Props = PropsWithChildren<{
  onClick: () => void;
}>;

export default memo(function DoubleTapButton({ children, onClick }: Props) {
  const [once, setOnce] = useState(false);
  const onceRef = useRefFrom(once);
  const onClickRef = useRefFrom(onClick);

  const handleBlur = useCallback(() => setOnce(false), [setOnce]);
  const handleClick = useCallback(() => {
    if (onceRef.current) {
      onClickRef.current?.();
    }

    setOnce(!onceRef.current);
  }, [onceRef, onClickRef, setOnce]);

  return (
    <button onBlur={handleBlur} onClick={handleClick} type="button">
      {children}
    </button>
  );
});
