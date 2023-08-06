import { type ChangeEventHandler, memo, useCallback } from 'react';
import { useRefFrom } from 'use-ref-from';

import DoubleTapButton from './DoubleTapButton';

type Props = {
  autoFocus?: boolean;
  botIdentifier?: string;
  environmentID?: string;
  hostnameSuffix?: string;
  onChange?: (nextCredential: {
    botIdentifier: string;
    environmentID: string;
    hostnameSuffix: string;
    tenantID?: string;
    token: string;
  }) => void;
  onReset?: () => void;
  onSubmit?: () => void;
  tenantID?: string;
  token?: string;
};

export default memo(function CredentialForm({
  autoFocus,
  botIdentifier,
  environmentID,
  hostnameSuffix,
  onChange,
  onReset,
  onSubmit,
  tenantID,
  token
}: Props) {
  const botIdentifierRef = useRefFrom(botIdentifier);
  const environmentIDRef = useRefFrom(environmentID);
  const hostnameSuffixRef = useRefFrom(hostnameSuffix);
  const onChangeRef = useRefFrom(onChange);
  const onResetRef = useRefFrom(onReset);
  const onSubmitRef = useRefFrom(onSubmit);
  const tenantIDRef = useRefFrom(tenantID);
  const tokenRef = useRefFrom(token);

  const dispatchChange = useCallback(
    (overrides: {
      botIdentifier?: string;
      environmentID?: string;
      hostnameSuffix?: string;
      tenantID?: string;
      token?: string;
    }) =>
      onChangeRef.current?.({
        botIdentifier: botIdentifierRef.current || '',
        environmentID: environmentIDRef.current || '',
        hostnameSuffix: hostnameSuffixRef.current || '',
        tenantID: tenantIDRef.current || '',
        token: tokenRef.current || '',
        ...overrides
      }),
    [botIdentifierRef, environmentIDRef, hostnameSuffix, tenantIDRef, tokenRef]
  );

  const handleBotIdentifierChange = useCallback<ChangeEventHandler<HTMLInputElement>>(
    ({ currentTarget }) => dispatchChange({ botIdentifier: currentTarget.value }),
    [environmentIDRef, onChangeRef, tenantIDRef, tokenRef]
  );

  const handleEnvironmentIDChange = useCallback<ChangeEventHandler<HTMLInputElement>>(
    ({ currentTarget }) => dispatchChange({ environmentID: currentTarget.value }),
    [dispatchChange]
  );

  const handleHostnameSuffixChange = useCallback<ChangeEventHandler<HTMLInputElement>>(
    ({ currentTarget }) => dispatchChange({ hostnameSuffix: currentTarget.value }),
    [dispatchChange]
  );

  const handleTenantIDChange = useCallback<ChangeEventHandler<HTMLInputElement>>(
    ({ currentTarget }) => dispatchChange({ tenantID: currentTarget.value }),
    [dispatchChange]
  );

  const handleTokenChange = useCallback<ChangeEventHandler<HTMLInputElement>>(
    ({ currentTarget }) => dispatchChange({ token: currentTarget.value }),
    [dispatchChange]
  );

  const handleSubmit = useCallback<ChangeEventHandler<HTMLFormElement>>(
    event => {
      event.preventDefault();

      onSubmitRef.current?.();
    },
    [onSubmitRef]
  );

  const handleResetButtonClick = useCallback(() => onResetRef.current?.(), [onResetRef]);

  // TODO: If autofocus is enabled, consider focus on the first invalid field.

  return (
    <form onSubmit={handleSubmit}>
      <dl>
        <label>
          <dt>Hostname suffix</dt>
          <dd>
            <input onChange={handleHostnameSuffixChange} type="text" value={hostnameSuffix || ''} />
          </dd>
        </label>
        <label>
          <dt>Tenant ID</dt>
          <dd>
            <input onChange={handleTenantIDChange} type="text" value={tenantID || ''} />
          </dd>
        </label>
        <label>
          <dt>Environment ID</dt>
          <dd>
            <input onChange={handleEnvironmentIDChange} required type="text" value={environmentID || ''} />
          </dd>
        </label>
        <label>
          <dt>Bot identifier</dt>
          <dd>
            <input onChange={handleBotIdentifierChange} required type="text" value={botIdentifier || ''} />
          </dd>
        </label>
        <label>
          <dt>Token</dt>
          <dd>
            <input autoComplete="off" onChange={handleTokenChange} required type="password" value={token || ''} />
          </dd>
        </label>
      </dl>
      <button autoFocus={autoFocus} type="submit">
        Create
      </button>{' '}
      <DoubleTapButton onClick={handleResetButtonClick}>Double tap to reset</DoubleTapButton>
    </form>
  );
});
